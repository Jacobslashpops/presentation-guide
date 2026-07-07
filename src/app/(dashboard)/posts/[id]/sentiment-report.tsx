'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  ThumbsUp,
  ThumbsDown,
  Minus,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Brain,
  MessageCircleHeart,
  Scale,
  Sparkles,
} from 'lucide-react'

interface SentimentData {
  product_mentioned: boolean
  product_sentiment: string
  recommendation: string
  key_positive_claims: string[]
  key_negative_claims: string[]
  confidence: string
  summary: string
  analyzed_at: string
  // Comment-specific fields (optional)
  positive_ratio_estimate?: string
  top_positive_themes?: string[]
  top_negative_themes?: string[]
  controversy_level?: string
  sample_size?: number
}

const SENTIMENT_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  strongly_positive: { label: '非常正面', color: 'bg-emerald-100 text-emerald-900 border-emerald-300', icon: ThumbsUp },
  positive: { label: '正面', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: ThumbsUp },
  neutral: { label: '中立', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Minus },
  negative: { label: '负面', color: 'bg-red-50 text-red-700 border-red-200', icon: ThumbsDown },
  strongly_negative: { label: '非常负面', color: 'bg-red-100 text-red-900 border-red-300', icon: ThumbsDown },
}

const RECOMMENDATION_CONFIG: Record<string, { label: string; color: string }> = {
  recommend: { label: '推荐购买', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  neutral: { label: '未表态', color: 'bg-gray-50 text-gray-600 border-gray-200' },
  not_recommend: { label: '不推荐', color: 'bg-red-50 text-red-700 border-red-200' },
}

const CONFIDENCE_CONFIG: Record<string, { label: string; color: string }> = {
  high: { label: '高置信', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  medium: { label: '中置信', color: 'bg-blue-50/50 text-blue-600 border-blue-200/50' },
  low: { label: '低置信', color: 'bg-orange-50 text-orange-600 border-orange-200' },
}

export function SentimentReport({
  videoSentiment,
  videoSentimentStatus,
  commentSentiment,
  commentSentimentStatus,
}: {
  videoSentiment: SentimentData | null
  videoSentimentStatus: string | null
  commentSentiment: SentimentData | null
  commentSentimentStatus: string | null
}) {
  const [expanded, setExpanded] = useState(true)

  // Don't render if both are pending/null
  if (!videoSentimentStatus && !commentSentimentStatus) return null

  return (
    <div className="border rounded-lg p-5 bg-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold">情绪分析报告</h2>
        </div>
        {videoSentiment && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            {expanded ? '收起' : '展开'}
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      {/* Video Sentiment - Creator Analysis */}
      {videoSentimentStatus === 'processing' && (
        <div className="flex items-center gap-2 py-6 text-muted-foreground justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">正在分析创作者情绪...</span>
        </div>
      )}

      {videoSentimentStatus === 'failed' && (
        <div className="flex items-center gap-2 py-4 text-destructive justify-center">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">情绪分析失败</span>
        </div>
      )}

      {videoSentimentStatus === 'completed' && videoSentiment && expanded && (
        <div className="space-y-5">
          {/* Sentiment Gauge */}
          <SentimentGauge sentiment={videoSentiment.product_sentiment} />

          {/* Tags Row */}
          <div className="flex flex-wrap gap-2">
            <SentimentBadge config={SENTIMENT_CONFIG} value={videoSentiment.product_sentiment} />
            <SentimentBadge config={RECOMMENDATION_CONFIG} value={videoSentiment.recommendation} />
            <SentimentBadge config={CONFIDENCE_CONFIG} value={videoSentiment.confidence} />
            {!videoSentiment.product_mentioned && (
              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                未提及产品
              </Badge>
            )}
          </div>

          {/* AI Summary */}
          {videoSentiment.summary && (
            <div className="bg-purple-50/50 border border-purple-100 rounded-md p-3">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                <p className="text-sm text-purple-900 leading-relaxed">{videoSentiment.summary}</p>
              </div>
            </div>
          )}

          {/* Claims */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videoSentiment.key_positive_claims.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-emerald-700 mb-2 flex items-center gap-1">
                  <ThumbsUp className="w-3 h-3" />
                  正面观点
                </h4>
                <ul className="space-y-1.5">
                  {videoSentiment.key_positive_claims.map((claim, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <span className="text-muted-foreground">{claim}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {videoSentiment.key_negative_claims.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-red-700 mb-2 flex items-center gap-1">
                  <ThumbsDown className="w-3 h-3" />
                  负面观点
                </h4>
                <ul className="space-y-1.5">
                  {videoSentiment.key_negative_claims.map((claim, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                      <span className="text-muted-foreground">{claim}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Comment Sentiment (if available) */}
          {commentSentimentStatus === 'completed' && commentSentiment && (
            <CommentSentimentSection data={commentSentiment} />
          )}

          {commentSentimentStatus === 'processing' && (
            <div className="flex items-center gap-2 py-3 text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="text-sm">正在分析观众评论情绪...</span>
            </div>
          )}
        </div>
      )}

      {/* Collapsed state - show just the gauge and tags */}
      {videoSentimentStatus === 'completed' && videoSentiment && !expanded && (
        <div className="flex items-center gap-3">
          <SentimentDot sentiment={videoSentiment.product_sentiment} />
          <span className="text-sm text-muted-foreground">
            {SENTIMENT_CONFIG[videoSentiment.product_sentiment]?.label || '未知'} · {RECOMMENDATION_CONFIG[videoSentiment.recommendation]?.label || '未知'}
          </span>
        </div>
      )}
    </div>
  )
}

// ===== Sub-components =====

function SentimentGauge({ sentiment }: { sentiment: string }) {
  // Map sentiment to a position on a 5-segment bar
  const positions: Record<string, number> = {
    strongly_negative: 0,
    negative: 25,
    neutral: 50,
    positive: 75,
    strongly_positive: 100,
  }
  const pos = positions[sentiment] ?? 50

  return (
    <div className="relative">
      {/* Track */}
      <div className="h-2 rounded-full bg-gradient-to-r from-red-300 via-gray-200 to-emerald-300" />
      {/* Labels */}
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-red-600">非常负面</span>
        <span className="text-[10px] text-red-400">负面</span>
        <span className="text-[10px] text-gray-500">中立</span>
        <span className="text-[10px] text-emerald-400">正面</span>
        <span className="text-[10px] text-emerald-600">非常正面</span>
      </div>
      {/* Pointer */}
      <div
        className="absolute top-0 -translate-x-1/2 -translate-y-0.5"
        style={{ left: `${pos}%` }}
      >
        <div className="w-3 h-3 rounded-full border-2 border-white shadow-md bg-gray-800" />
      </div>
    </div>
  )
}

function SentimentBadge({ config, value }: { config: Record<string, { label: string; color: string; icon?: React.ElementType }>; value: string }) {
  const item = config[value]
  if (!item) return null
  const Icon = item.icon
  return (
    <Badge className={`text-xs font-medium ${item.color}`}>
      {Icon && <Icon className="w-3 h-3 mr-1" />}
      {item.label}
    </Badge>
  )
}

function SentimentDot({ sentiment }: { sentiment: string }) {
  const colors: Record<string, string> = {
    strongly_positive: 'bg-emerald-500',
    positive: 'bg-emerald-400',
    neutral: 'bg-gray-400',
    negative: 'bg-red-400',
    strongly_negative: 'bg-red-500',
  }
  return <span className={`w-2.5 h-2.5 rounded-full inline-block ${colors[sentiment] || 'bg-gray-300'}`} />
}

function CommentSentimentSection({ data }: { data: SentimentData }) {
  const [showDetail, setShowDetail] = useState(false)

  return (
    <div className="border-t pt-4 mt-2">
      <button
        onClick={() => setShowDetail(!showDetail)}
        className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary mb-3"
      >
        <MessageCircleHeart className="w-4 h-4 text-purple-500" />
        观众评论情绪
        <Badge variant="outline" className="text-xs">
          {data.sample_size} 条评论
        </Badge>
        {showDetail ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {/* Always show summary tags */}
      <div className="flex flex-wrap gap-2 mb-3">
        <SentimentBadge config={SENTIMENT_CONFIG} value={data.product_sentiment} />
        {data.controversy_level && (
          <Badge variant="outline" className={`text-xs ${
            data.controversy_level === 'low' ? 'text-blue-600' :
            data.controversy_level === 'high' ? 'text-red-600' : 'text-amber-600'
          }`}>
            争议度: {data.controversy_level === 'low' ? '低' : data.controversy_level === 'high' ? '高' : '中'}
          </Badge>
        )}
        {data.positive_ratio_estimate && (
          <Badge variant="outline" className="text-xs">
            正面占比约 {data.positive_ratio_estimate}
          </Badge>
        )}
      </div>

      {showDetail && (
        <div className="space-y-3">
          {/* Ratio bar */}
          <PositiveRatioBar ratio={data.positive_ratio_estimate} />

          {/* Themes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.top_positive_themes && data.top_positive_themes.length > 0 && (
              <div>
                <h5 className="text-xs font-medium text-emerald-700 mb-1.5">正面主题</h5>
                <div className="flex flex-wrap gap-1.5">
                  {data.top_positive_themes.map((theme, i) => (
                    <Badge key={i} variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                      {theme}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {data.top_negative_themes && data.top_negative_themes.length > 0 && (
              <div>
                <h5 className="text-xs font-medium text-red-700 mb-1.5">负面主题</h5>
                <div className="flex flex-wrap gap-1.5">
                  {data.top_negative_themes.map((theme, i) => (
                    <Badge key={i} variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                      {theme}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Summary */}
          {data.summary && (
            <div className="bg-purple-50/50 border border-purple-100 rounded-md p-3">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                <p className="text-sm text-purple-900 leading-relaxed">{data.summary}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PositiveRatioBar({ ratio }: { ratio?: string }) {
  // Parse ratio like "70-80%" -> use midpoint 75
  let pct = 50
  if (ratio) {
    const match = ratio.match(/(\d+)/g)
    if (match && match.length >= 2) {
      pct = (parseInt(match[0]) + parseInt(match[1])) / 2
    } else if (match && match.length === 1) {
      pct = parseInt(match[0])
    }
  }

  return (
    <div>
      <div className="flex h-3 rounded-full overflow-hidden border border-gray-200">
        <div
          className="bg-emerald-300 transition-all"
          style={{ width: `${pct}%` }}
        />
        <div
          className="bg-red-200 transition-all"
          style={{ width: `${100 - pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
        <span>正面 ~{pct}%</span>
        <span>负面 ~{100 - pct}%</span>
      </div>
    </div>
  )
}
