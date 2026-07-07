'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { registerInfluencer, updateInfluencerProfile } from '@/lib/actions'

interface Influencer {
  id: string
  display_name: string
  phone: string | null
  timezone: string
  bio: string | null
}

export function InfluencerProfileForm({ influencer }: { influencer?: Influencer }) {
  const [loading, setLoading] = useState(false)
  const isEdit = !!influencer

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    try {
      if (isEdit && influencer) {
        await updateInfluencerProfile(influencer.id, formData)
      } else {
        await registerInfluencer(formData)
      }
    } catch (error: any) {
      alert(error.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  const timezones = [
    'UTC',
    'America/New_York',
    'America/Los_Angeles',
    'America/Chicago',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Shanghai',
    'Asia/Tokyo',
    'Asia/Singapore',
    'Asia/Dubai',
    'Australia/Sydney',
  ]

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>显示名称 *</Label>
        <Input
          name="display_name"
          defaultValue={influencer?.display_name || ''}
          placeholder="您的公开显示名称"
          required
        />
      </div>
      <div className="space-y-2">
        <Label>联系电话</Label>
        <Input
          name="phone"
          defaultValue={influencer?.phone || ''}
          placeholder="+1 234 567 8900"
        />
      </div>
      <div className="space-y-2">
        <Label>时区</Label>
        <Select name="timezone" defaultValue={influencer?.timezone || 'UTC'}>
          <SelectTrigger>
            <SelectValue placeholder="选择时区" />
          </SelectTrigger>
          <SelectContent>
            {timezones.map((tz) => (
              <SelectItem key={tz} value={tz}>{tz}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>个人简介</Label>
        <Textarea
          name="bio"
          defaultValue={influencer?.bio || ''}
          placeholder="简单介绍一下自己..."
          rows={3}
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? '保存中...' : isEdit ? '保存修改' : '提交注册'}
      </Button>
    </form>
  )
}
