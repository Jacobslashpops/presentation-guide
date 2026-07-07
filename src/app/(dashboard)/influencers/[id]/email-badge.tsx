'use client'

import { useState } from 'react'
import { Mail, Check } from 'lucide-react'

export function EmailBadge({ email }: { email: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    await navigator.clipboard.writeText(email)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <a
      href={`mailto:${email}`}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 text-sm font-medium hover:bg-orange-100 transition-colors group"
      title={email}
    >
      <Mail className="w-3.5 h-3.5 shrink-0" />
      <span className="max-w-[220px] truncate">{email}</span>
      <button
        onClick={handleCopy}
        className="ml-0.5 p-0.5 rounded hover:bg-orange-200/50 transition-colors"
        title="复制邮箱"
      >
        {copied ? (
          <Check className="w-3 h-3 text-green-600" />
        ) : (
          <Mail className="w-3 h-3 opacity-0 group-hover:opacity-50" />
        )}
      </button>
    </a>
  )
}
