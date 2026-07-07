import {
  Globe,
  Mail,
  ExternalLink,
} from 'lucide-react'

interface SocialLinksData {
  website: string | null
  twitter: string | null
  facebook: string | null
  linkedin: string | null
  instagram: string | null
  tiktok: string | null
  twitch: string | null
  email: string | null
}

const linkConfig = [
  { key: 'website' as const, label: 'Website', icon: Globe, color: 'text-blue-500' },
  { key: 'email' as const, label: 'Email', icon: Mail, color: 'text-orange-500' },
  { key: 'instagram' as const, label: 'Instagram', icon: ExternalLink, color: 'text-pink-500' },
  { key: 'tiktok' as const, label: 'TikTok', icon: ExternalLink, color: 'text-gray-800' },
  { key: 'twitch' as const, label: 'Twitch', icon: ExternalLink, color: 'text-purple-500' },
  { key: 'twitter' as const, label: 'Twitter/X', icon: ExternalLink, color: 'text-sky-500' },
  { key: 'facebook' as const, label: 'Facebook', icon: ExternalLink, color: 'text-blue-600' },
  { key: 'linkedin' as const, label: 'LinkedIn', icon: ExternalLink, color: 'text-blue-700' },
]

function formatDisplayUrl(url: string, key: string): string {
  try {
    const u = new URL(url)
    if (key === 'email') return url.replace(/^mailto:/, '')
    // Show domain + path without protocol
    return u.hostname.replace('www.', '') + (u.pathname !== '/' ? u.pathname : '')
  } catch {
    return url
  }
}

function getHref(url: string, key: string): string {
  if (key === 'email') return url.startsWith('mailto:') ? url : `mailto:${url}`
  return url
}

export function SocialLinksSection({ links }: { links: SocialLinksData }) {
  const activeLinks = linkConfig.filter(c => links[c.key])

  if (activeLinks.length === 0) return null

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">社交链接</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {activeLinks.map(({ key, label, icon: Icon, color }) => {
          const url = links[key]!
          return (
            <a
              key={key}
              href={getHref(url, key)}
              target={key !== 'email' ? '_blank' : undefined}
              rel={key !== 'email' ? 'noopener noreferrer' : undefined}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg border hover:bg-accent/50 transition-colors group"
            >
              <Icon className={`w-4 h-4 ${color} shrink-0`} />
              <div className="min-w-0 flex-1">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="text-sm font-medium truncate group-hover:text-primary">
                  {formatDisplayUrl(url, key)}
                </div>
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}
