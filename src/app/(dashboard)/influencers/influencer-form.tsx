'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createInfluencer, updateInfluencer, deleteInfluencer } from '@/lib/actions'
import { toast } from 'sonner'

interface InfluencerFormProps {
  influencer?: {
    id: string
    email: string | null
    display_name: string
    phone: string | null
    bio: string | null
    timezone: string
    status: string
  }
}

export function InfluencerForm({ influencer }: InfluencerFormProps) {
  const [open, setOpen] = useState(false)
  const isEditing = !!influencer

  async function handleSubmit(formData: FormData) {
    try {
      if (isEditing) {
        await updateInfluencer(influencer.id, formData)
      } else {
        await createInfluencer(formData)
      }
      setOpen(false)
    } catch (error) {
      console.error('Failed to save influencer:', error)
      toast.error((error as Error).message || '保存失败，请重试')
    }
  }

  async function handleDelete() {
    if (!influencer) return
    if (!confirm('确定要删除这个红人吗？')) return
    try {
      await deleteInfluencer(influencer.id)
      setOpen(false)
    } catch (error) {
      console.error('Failed to delete influencer:', error)
      toast.error((error as Error).message || '删除失败，请重试')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={isEditing ? 'ghost' : 'default'} size={isEditing ? 'sm' : 'default'}>
          {isEditing ? '编辑' : '新建红人'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? '编辑红人' : '新建红人'}</DialogTitle>
          <DialogDescription>
            {isEditing ? '修改红人信息' : '添加一个新的红人'}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="display_name">显示名称 *</Label>
              <Input
                id="display_name"
                name="display_name"
                defaultValue={influencer?.display_name || ''}
                placeholder="例如：小王"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={influencer?.email || ''}
                placeholder="red@email.com"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">电话</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={influencer?.phone || ''}
                placeholder="+86 138..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">时区</Label>
              <Input
                id="timezone"
                name="timezone"
                defaultValue={influencer?.timezone || 'UTC'}
                placeholder="UTC"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">简介</Label>
            <Textarea
              id="bio"
              name="bio"
              defaultValue={influencer?.bio || ''}
              placeholder="红人的简介信息"
              rows={3}
            />
          </div>
          <div className="flex justify-between">
            {isEditing && (
              <Button type="button" variant="destructive" onClick={handleDelete}>
                删除
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button type="submit">保存</Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
