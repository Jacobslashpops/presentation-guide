'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { syncPost, triggerWhisperTranscription, getTranscriptionQuota, estimateQuotaCost } from '@/lib/actions'
import { toast } from 'sonner'
import {
  RefreshCw,
  Loader2,
  Search,
  MessageSquare,
  ThumbsUp,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  AudioLines,
  AlertCircle,
  FileText,
  Gauge,
  Plug,
  Cookie,
} from 'lucide-react'
import { SentimentReport } from './sentiment-report'

interface Comment {
  id: string
  platform_comment_id: string
  author_name: string | null
  author_avatar_url: string | null
  author_channel_url: string | null
  text: string
  like_count: number
  published_at: string | null
  is_reply: boolean
  parent_comment_id: string | null
}

const COMMENTS_PER_PAGE = 20

export function PostDetailClient({
  postId,
  comments: allComments,
  commentsDisabled,
  duration,
  transcription,
  transcriptionSource,
  transcriptionStatus,
  transcriptionLanguage,
  transcriptionError,
  videoSentiment,
  videoSentimentStatus,
  commentSentiment,
  commentSentimentStatus,
}: {
  postId: string
  comments: Comment[]
  commentsDisabled: boolean
  duration: string | null
  transcription: string | null
  transcriptionSource: string | null
  transcriptionStatus: string | null
  transcriptionLanguage: string | null
  transcriptionError: string | null
  videoSentiment: any
  videoSentimentStatus: string | null
  commentSentiment: any
  commentSentimentStatus: string | null
}) {
  const [syncing, setSyncing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'top'>('newest')
  const [visibleCount, setVisibleCount] = useState(COMMENTS_PER_PAGE)
  const [transcribing, setTranscribing] = useState(false)
  const [transcriptionExpanded, setTranscriptionExpanded] = useState(false)
  const [quota, setQuota] = useState<{ remaining_seconds: number; used_seconds: number; quota_seconds: number } | null>(null)
  const [estimatedSeconds, setEstimatedSeconds] = useState<number>(0)

  // Mutable status fields — updated by polling
  const [txStatus, setTxStatus] = useState(transcriptionStatus)
  const [txText, setTxText] = useState(transcription)
  const [txSource, setTxSource] = useState(transcriptionSource)
  const [txLanguage, setTxLanguage] = useState(transcriptionLanguage)
  const [txError, setTxError] = useState(transcriptionError)
  const [vSentiment, setVSentiment] = useState(videoSentiment)
  const [vSentimentStatus, setVSentimentStatus] = useState(videoSentimentStatus)
  const [cSentiment, setCSentiment] = useState(commentSentiment)
  const [cSentimentStatus, setCSentimentStatus] = useState(commentSentimentStatus)
  const [polling, setPolling] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Extension detection
  const [extensionReady, setExtensionReady] = useState(false)
  const [refreshingCookies, setRefreshingCookies] = useState(false)

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.source !== window) return
      if (event.data?.type === 'CELEPULSE_PONG') {
        setExtensionReady(true)
      }
      if (event.data?.type === 'CELEPULSE_COOKIES_RESULT') {
        setRefreshingCookies(false)
        if (event.data.ok) {
          toast.success(`Cookies 已刷新（${event.data.count} 条）`)
        } else {
          toast.error(`Cookies 刷新失败: ${event.data.error || '未知错误'}`)
        }
      }
    }
    window.addEventListener('message', onMessage)
    // Send ping on mount
    window.postMessage({ type: 'CELEPULSE_PING' }, '*')
    return () => window.removeEventListener('message', onMessage)
  }, [])

  function handleRefreshCookies() {
    setRefreshingCookies(true)
    window.postMessage({ type: 'CELEPULSE_REFRESH_COOKIES' }, '*')
    // Timeout fallback
    setTimeout(() => setRefreshingCookies(false), 15000)
  }

  // Start polling when status is 'processing'
  const startPolling = useCallback(() => {
    if (pollRef.current) return
    setPolling(true)
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/post-status?id=${postId}`)
        if (!res.ok) return
        const data = await res.json()

        // Update transcription state
        setTxStatus(data.transcription_status)
        setTxError(data.transcription_error)
        if (data.transcription_status === 'completed') {
          setTxText(data.transcription)
          setTxSource(data.transcription_source)
          setTxLanguage(data.transcription_language)
        }

        // Update sentiment state
        setVSentimentStatus(data.video_sentiment_status)
        if (data.video_sentiment_status === 'completed') {
          setVSentiment(data.video_sentiment)
        }
        setCSentimentStatus(data.comment_sentiment_status)
        if (data.comment_sentiment_status === 'completed') {
          setCSentiment(data.comment_sentiment)
        }

        // Check if everything reached a terminal state.
        // Sentiment starts as 'pending' and only moves to 'processing' after transcription
        // completes, so we must wait for 'completed' or 'failed' — not just 'not processing'.
        const TERMINAL = ['completed', 'failed', 'pending', null]
        const txTerminal = TERMINAL.includes(data.transcription_status)
        const sentTerminal = TERMINAL.includes(data.video_sentiment_status)
        // Only stop when BOTH are terminal AND neither is actively processing
        const anyActive = data.transcription_status === 'processing' || data.video_sentiment_status === 'processing'
        if (txTerminal && sentTerminal && !anyActive) {
          // Stop polling
          if (pollRef.current) {
            clearInterval(pollRef.current)
            pollRef.current = null
          }
          setPolling(false)
          setTranscribing(false)

          // Notify user
          if (data.transcription_status === 'completed') {
            toast.success('转写完成' + (data.video_sentiment_status === 'completed' ? '，情绪分析已就绪' : ''))
          } else if (data.transcription_status === 'failed') {
            toast.error(`转写失败: ${data.transcription_error || '未知错误'}`)
          }

          // Refresh quota
          try {
            const quotaData = await getTranscriptionQuota()
            setQuota({
              remaining_seconds: quotaData.remaining_seconds,
              used_seconds: quotaData.used_seconds,
              quota_seconds: quotaData.quota_seconds,
            })
          } catch {}
        }
      } catch {}
    }, 5000)
  }, [postId])

  // Auto-start polling if already processing on mount
  useEffect(() => {
    if (txStatus === 'processing' || vSentimentStatus === 'processing') {
      setTranscribing(true)
      startPolling()
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch quota and estimated cost on mount
  useEffect(() => {
    let cancelled = false
    async function loadQuota() {
      try {
        const [quotaData, costData] = await Promise.all([
          getTranscriptionQuota(),
          duration ? estimateQuotaCost(postId) : Promise.resolve({ estimated_seconds: 0 }),
        ])
        if (!cancelled) {
          setQuota({
            remaining_seconds: quotaData.remaining_seconds,
            used_seconds: quotaData.used_seconds,
            quota_seconds: quotaData.quota_seconds,
          })
          setEstimatedSeconds(costData.estimated_seconds)
        }
      } catch {
        // ignore — quota display is best-effort
      }
    }
    loadQuota()
    return () => { cancelled = true }
  }, [postId, duration])

  async function handleSync() {
    setSyncing(true)
    try {
      await syncPost(postId)
      toast.success('同步成功，数据和评论已更新')
    } catch (e) {
      toast.error((e as Error).message || '同步失败')
    } finally {
      setSyncing(false)
    }
  }

  async function handleWhisperTranscribe() {
    setTranscribing(true)
    try {
      // Server action returns immediately after marking as processing
      await triggerWhisperTranscription(postId)
      // Status is now 'processing' — start polling for completion
      setTxStatus('processing')
      setTxError(null)
      toast.info('AI 转写已启动，后台运行中...')
      startPolling()
    } catch (e) {
      toast.error((e as Error).message || '转写失败')
      setTranscribing(false)
    }
  }

  // Organize: top-level + replies
  const topLevelComments = useMemo(() => {
    const topLevel = allComments.filter((c) => !c.is_reply)
    return topLevel
  }, [allComments])

  const repliesByParent = useMemo(() => {
    const map: Record<string, Comment[]> = {}
    for (const c of allComments) {
      if (c.is_reply && c.parent_comment_id) {
        if (!map[c.parent_comment_id]) map[c.parent_comment_id] = []
        map[c.parent_comment_id].push(c)
      }
    }
    return map
  }, [allComments])

  // Filter + Sort
  const filteredComments = useMemo(() => {
    let comments = [...topLevelComments]

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      comments = comments.filter(
        (c) =>
          c.text.toLowerCase().includes(q) ||
          (c.author_name || '').toLowerCase().includes(q)
      )
    }

    // Sort
    if (sortBy === 'top') {
      comments.sort((a, b) => b.like_count - a.like_count)
    } else {
      comments.sort((a, b) => {
        const da = a.published_at ? new Date(a.published_at).getTime() : 0
        const db = b.published_at ? new Date(b.published_at).getTime() : 0
        return db - da
      })
    }

    return comments
  }, [topLevelComments, searchQuery, sortBy])

  const visibleComments = filteredComments.slice(0, visibleCount)
  const hasMore = visibleCount < filteredComments.length

  return (
    <>
      {/* Sync Button (placed in the parent page) */}
      <div className="flex items-center justify-between">
        <div />
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={syncing}
        >
          {syncing ? (
            <>
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              同步中...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Sync Now
            </>
          )}
        </Button>
      </div>

      {/* Transcription Section */}
      <TranscriptionSection
        status={txStatus}
        text={txText}
        source={txSource}
        language={txLanguage}
        error={txError}
        expanded={transcriptionExpanded}
        onToggleExpand={() => setTranscriptionExpanded(!transcriptionExpanded)}
        onTriggerWhisper={handleWhisperTranscribe}
        transcribing={transcribing}
        quota={quota}
        estimatedSeconds={estimatedSeconds}
        extensionReady={extensionReady}
        onRefreshCookies={handleRefreshCookies}
        refreshingCookies={refreshingCookies}
      />

      {/* Sentiment Analysis Report */}
      <SentimentReport
        videoSentiment={vSentiment}
        videoSentimentStatus={vSentimentStatus}
        commentSentiment={cSentiment}
        commentSentimentStatus={cSentimentStatus}
      />

      {/* Comments Section */}
      <div className="border rounded-lg p-5 bg-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            评论 ({topLevelComments.length})
          </h2>
        </div>

        {commentsDisabled ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>该视频已关闭评论</p>
          </div>
        ) : topLevelComments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>暂无评论数据</p>
            <p className="text-xs mt-1">点击 "Sync Now" 同步评论</p>
          </div>
        ) : (
          <>
            {/* Search + Sort Controls */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="搜索评论..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setVisibleCount(COMMENTS_PER_PAGE)
                  }}
                  className="pl-8"
                />
              </div>
              <Select
                value={sortBy}
                onValueChange={(v) => setSortBy(v as 'newest' | 'top')}
              >
                <SelectTrigger className="w-[140px]">
                  <ArrowUpDown className="w-3.5 h-3.5 mr-1.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">最新</SelectItem>
                  <SelectItem value="top">最多点赞</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search Results Count */}
            {searchQuery.trim() && (
              <p className="text-xs text-muted-foreground mb-3">
                找到 {filteredComments.length} 条相关评论
              </p>
            )}

            {/* Comments List */}
            <div className="space-y-1">
              {visibleComments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  replies={repliesByParent[comment.platform_comment_id] || []}
                />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => setVisibleCount((prev) => prev + COMMENTS_PER_PAGE)}
                >
                  <ChevronDown className="w-4 h-4 mr-1.5" />
                  加载更多 ({filteredComments.length - visibleCount} 条)
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

function CommentItem({
  comment,
  replies,
}: {
  comment: Comment
  replies: Comment[]
}) {
  const [showReplies, setShowReplies] = useState(false)

  return (
    <div className="border-b last:border-0 py-3">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full overflow-hidden bg-muted shrink-0">
          {comment.author_avatar_url ? (
            <img
              src={comment.author_avatar_url}
              alt={comment.author_name || ''}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs font-medium text-muted-foreground">
              {(comment.author_name || '?')[0].toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {comment.author_name || '匿名用户'}
            </span>
            <span className="text-xs text-muted-foreground">
              {comment.published_at
                ? new Date(comment.published_at).toLocaleDateString('zh-CN', {
                    month: 'short',
                    day: 'numeric',
                  })
                : ''}
            </span>
          </div>
          <p
            className="text-sm mt-1 text-foreground/90 whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{ __html: comment.text }}
          />
          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" />
              {comment.like_count}
            </span>
            {replies.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="text-primary hover:underline font-medium"
              >
                {showReplies
                  ? '收起回复'
                  : `查看 ${replies.length} 条回复`}
              </button>
            )}
          </div>

          {/* Replies (collapsible) */}
          {showReplies && replies.length > 0 && (
            <div className="mt-3 ml-2 space-y-2 border-l-2 pl-3">
              {replies.map((reply) => (
                <div key={reply.id} className="flex gap-2">
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-muted shrink-0">
                    {reply.author_avatar_url ? (
                      <img
                        src={reply.author_avatar_url}
                        alt={reply.author_name || ''}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                        {(reply.author_name || '?')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium">
                        {reply.author_name || '匿名用户'}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {reply.published_at
                          ? new Date(reply.published_at).toLocaleDateString('zh-CN', {
                              month: 'short',
                              day: 'numeric',
                            })
                          : ''}
                      </span>
                    </div>
                    <p
                      className="text-xs mt-0.5 text-foreground/80 whitespace-pre-wrap break-words"
                      dangerouslySetInnerHTML={{ __html: reply.text }}
                    />
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
                      <ThumbsUp className="w-2.5 h-2.5" />
                      {reply.like_count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TranscriptionSection({
  status,
  text,
  source,
  language,
  error,
  expanded,
  onToggleExpand,
  onTriggerWhisper,
  transcribing,
  quota,
  estimatedSeconds,
  extensionReady,
  onRefreshCookies,
  refreshingCookies,
}: {
  status: string | null
  text: string | null
  source: string | null
  language: string | null
  error: string | null
  expanded: boolean
  onToggleExpand: () => void
  onTriggerWhisper: () => void
  transcribing: boolean
  quota: { remaining_seconds: number; used_seconds: number; quota_seconds: number } | null
  estimatedSeconds: number
  extensionReady: boolean
  onRefreshCookies: () => void
  refreshingCookies: boolean
}) {
  const LINE_LIMIT = 300
  const needsTruncation = text ? text.length > LINE_LIMIT : false
  const displayText = expanded || !needsTruncation ? text : text?.slice(0, LINE_LIMIT) + '...'

  const sourceLabel =
    source === 'youtube_subtitle'
      ? 'YouTube 字幕'
      : source === 'openai_whisper'
        ? 'AI 转写 (Whisper)'
        : null

  return (
    <div className="border rounded-lg p-5 bg-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5" />
            转写文本
          </h2>
          {sourceLabel && (
            <Badge variant="secondary" className="text-xs">
              {sourceLabel}
            </Badge>
          )}
          {language && (
            <Badge variant="outline" className="text-xs">
              {language.toUpperCase()}
            </Badge>
          )}
        </div>
        {/* Extension status + cookie refresh */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 text-xs ${
            extensionReady ? 'text-green-600' : 'text-muted-foreground'
          }`}>
            <Plug className="w-3.5 h-3.5" />
            {extensionReady ? '插件已连接' : '未检测到插件'}
          </div>
          {extensionReady && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefreshCookies}
              disabled={refreshingCookies}
              className="h-7 px-2 text-xs gap-1"
            >
              {refreshingCookies ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Cookie className="w-3 h-3" />
              )}
              {refreshingCookies ? '刷新中...' : '刷新 Cookies'}
            </Button>
          )}
        </div>
      </div>

      {/* Pending / Processing */}
      {(status === 'pending' || status === 'processing') && (
        <div className="flex items-center gap-2 py-6 text-muted-foreground justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">正在获取字幕...</span>
        </div>
      )}

      {/* Completed */}
      {status === 'completed' && text && (
        <div>
          <div className="bg-muted/50 rounded-md p-4 max-h-[400px] overflow-y-auto">
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
              {displayText}
            </p>
          </div>
          {needsTruncation && (
            <button
              onClick={onToggleExpand}
              className="text-xs text-primary hover:underline mt-2 inline-flex items-center gap-0.5"
            >
              {expanded ? (
                <>收起 <ChevronUp className="w-3 h-3" /></>
              ) : (
                <>展开完整文本 <ChevronDown className="w-3 h-3" /></>
              )}
            </button>
          )}
        </div>
      )}

      {/* Available for STT (subtitles not found, can trigger Whisper) */}
      {status === 'available_for_stt' && (
        <div className="text-center py-6">
          <AudioLines className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground mb-3">
            {error || 'YouTube 字幕不可用'}
          </p>
          {/* Quota info */}
          {quota && (
            <div className="flex items-center justify-center gap-4 mb-3 text-xs">
              {estimatedSeconds > 0 && (
                <span className="text-muted-foreground">
                  预计消耗 <span className="font-medium text-foreground">{Math.ceil(estimatedSeconds / 60)} 分钟</span>
                </span>
              )}
              <span className={`flex items-center gap-1 ${
                quota.remaining_seconds <= 0 ? 'text-destructive' : 'text-muted-foreground'
              }`}>
                <Gauge className="w-3 h-3" />
                本月剩余 <span className="font-medium text-foreground">{Math.floor(quota.remaining_seconds / 60)} 分钟</span>
              </span>
            </div>
          )}
          {quota && estimatedSeconds > 0 && estimatedSeconds > quota.remaining_seconds ? (
            <div>
              <Button
                variant="outline"
                size="sm"
                disabled
                className="gap-1.5 opacity-50"
              >
                <AlertCircle className="w-4 h-4" />
                配额不足
              </Button>
              <p className="text-xs text-destructive mt-2">
                本月转写配额已用完，请下月再试或联系管理员
              </p>
            </div>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onTriggerWhisper}
                disabled={transcribing}
                className="gap-1.5"
              >
                {transcribing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    转写中...
                  </>
                ) : (
                  <>
                    <AudioLines className="w-4 h-4" />
                    AI 转写 (Whisper)
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                使用 OpenAI Whisper API 进行语音转文字
              </p>
            </>
          )}
        </div>
      )}

      {/* Failed */}
      {status === 'failed' && (
        <div className="text-center py-6">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-destructive opacity-50" />
          <p className="text-sm text-destructive mb-1">转写失败</p>
          <p className="text-xs text-muted-foreground mb-3">
            {error || '未知错误'}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onTriggerWhisper}
            disabled={transcribing}
            className="gap-1.5"
          >
            {transcribing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                重试中...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                重试
              </>
            )}
          </Button>
        </div>
      )}

      {/* No status at all (old posts without transcription fields) */}
      {!status && (
        <div className="text-center py-6 text-muted-foreground">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">暂无转写数据</p>
          <p className="text-xs mt-1">同步 Post 后将自动尝试获取字幕</p>
        </div>
      )}
    </div>
  )
}
