'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

export function ExpandableDescription({ text, lineClamp = 3 }: { text: string; lineClamp?: number }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div>
      <p
        className={`text-sm text-muted-foreground whitespace-pre-wrap break-words ${
          expanded ? '' : `line-clamp-${lineClamp}`
        }`}
      >
        {text}
      </p>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-primary hover:underline mt-1.5 inline-flex items-center gap-0.5"
      >
        {expanded ? (
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
  )
}
