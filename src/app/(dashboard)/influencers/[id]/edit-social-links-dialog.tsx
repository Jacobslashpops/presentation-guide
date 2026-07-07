'use client'

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pencil } from 'lucide-react'
import { updateInfluencerSocialLinks } from '@/lib/actions'
import { toast } from 'sonner'

interface SocialLinks {
  email: string | null
  website: string | null
  twitter: string | null
  facebook: string | null
  linkedin: string | null
  instagram: string | null
  tiktok: string | null
  twitch: string | null
}

const fields: { key: keyof SocialLinks; label: string; placeholder: string }[] = [
  { key: 'email', label: 'Email', placeholder: 'e.g. contact@creator.com' },
  { key: 'website', label: 'Website', placeholder: 'https://...' },
  { key: 'twitter', label: 'Twitter / X', placeholder: 'https://x.com/...' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@...' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/...' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/...' },
  { key: 'twitch', label: 'Twitch', placeholder: 'https://twitch.tv/...' },
]

export function EditSocialLinksDialog({
  influencerId,
  existingLinks,
}: {
  influencerId: string
  existingLinks: SocialLinks
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState<SocialLinks>(existingLinks)

  // Reset form when dialog opens
  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) setForm({ ...existingLinks })
    setOpen(nextOpen)
  }

  function handleChange(key: keyof SocialLinks, value: string) {
    setForm(prev => ({ ...prev, [key]: value || null }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        await updateInfluencerSocialLinks(influencerId, form)
        toast.success('链接已更新')
        setOpen(false)
      } catch (err) {
        console.error(err)
        toast.error('保存失败')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Pencil className="w-3 h-3" />
        编辑
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>编辑社交链接</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          {fields.map(({ key, label, placeholder }) => (
            <div key={key} className="grid grid-cols-[100px_1fr] items-center gap-2">
              <Label htmlFor={`edit-${key}`} className="text-sm text-right">
                {label}
              </Label>
              <Input
                id={`edit-${key}`}
                type={key === 'email' ? 'email' : 'text'}
                placeholder={placeholder}
                value={form[key] || ''}
                onChange={e => handleChange(key, e.target.value)}
                className="text-sm"
              />
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
            >
              取消
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? '保存中...' : '保存'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
