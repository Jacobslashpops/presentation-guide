'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { YouTubeIcon } from '@/components/shared/platform-tag'
import Link from 'next/link'
import {
  ExternalLink,
  Tag,
  Hash,
  Globe,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const INITIAL_TAG_COUNT = 10

export function PostInfoSection({
  title,
  description,
  influencerId,
  influencerName,
  url,
  hashtags,
  tags,
  publishedAt,
  channelTitle,
  language,
}: {
  title: string
  description: string | null
  influencerId: string
  influencerName: string
  url: string
  hashtags: string[]
  tags: string[]
  publishedAt: string | null
  channelTitle: string | null
  language: string | null
}) {
  const [descExpanded, setDescExpanded] = useState(false)
  const [tagsExpanded, setTagsExpanded] = useState(false)

  const visibleTags = tagsExpanded ? tags : tags.slice(0, INITIAL_TAG_COUNT)
  const hasMoreTags = tags.length > INITIAL_TAG_COUNT

  return (
    <div className="flex-1 min-w-0 space-y-3">
      {/* Title + Influencer */}
      <div>
        <h1 className="text-xl font-bold leading-tight line-clamp-2">
          {title}
        </h1>
        <div className="flex items-center gap-3 mt-2">
          <Link
            href={`/influencers/${influencerId}`}
            className="text-sm text-primary hover:underline"
          >
            {influencerName}
          </Link>
          <Badge variant="secondary" className="gap-1">
            <YouTubeIcon className="w-3 h-3" color="#FF0000" />
            YouTube
          </Badge>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Description (expandable) */}
      {description && (
        <div>
          <p
            className={`text-sm text-muted-foreground whitespace-pre-wrap break-words ${
              descExpanded ? '' : 'line-clamp-3'
            }`}
          >
            {description}
          </p>
          <button
            onClick={() => setDescExpanded(!descExpanded)}
            className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-0.5"
          >
            {descExpanded ? (
              <>
                收起 <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                展开完整描述 <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Hashtags */}
      {hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <Hash className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          {hashtags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs font-normal">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Tags (expandable) */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <Tag className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          {visibleTags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs font-normal">
              {tag}
            </Badge>
          ))}
          {hasMoreTags && !tagsExpanded && (
            <button
              onClick={() => setTagsExpanded(true)}
              className="text-xs text-primary hover:underline"
            >
              +{tags.length - INITIAL_TAG_COUNT} more
            </button>
          )}
          {tagsExpanded && hasMoreTags && (
            <button
              onClick={() => setTagsExpanded(false)}
              className="text-xs text-primary hover:underline inline-flex items-center gap-0.5"
            >
              收起 <ChevronUp className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Metadata row */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>发布时间：{formatDate(publishedAt)}</span>
        {channelTitle && (
          <span className="flex items-center gap-1">
            <YouTubeIcon className="w-3 h-3" color="#FF0000" />
            {channelTitle}
          </span>
        )}
        {language && (
          <span className="flex items-center gap-1">
            <Globe className="w-3 h-3" />
            {language.toUpperCase()}
          </span>
        )}
      </div>
    </div>
  )
}
