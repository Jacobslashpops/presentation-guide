'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createDeliverable, updateDeliverable, deleteDeliverable } from '@/lib/actions'

interface DeliverableFormProps {
  collaborationId: string
  deliverable?: {
    id: string
    title: string
    description: string | null
    due_date: string | null
    status: string
  }
}

export function DeliverableForm({ collaborationId, deliverable }: DeliverableFormProps) {
  const [open, setOpen] = useState(false)
  const isEditing = !!deliverable

  async function handleSubmit(formData: FormData) {
    try {
      if (isEditing) {
        await updateDeliverable(deliverable.id, formData)
      } else {
        await createDeliverable(formData)
      }
      setOpen(false)
    } catch (error) {
      console.error('Failed to save deliverable:', error)
      alert('保存失败，请重试')
    }
  }

  async function handleDelete() {
    if (!deliverable) return
    if (!confirm('确定要删除这个交付物吗？')) return
    try {
      await deleteDeliverable(deliverable.id, collaborationId)
      setOpen(false)
    } catch (error) {
      console.error('Failed to delete deliverable:', error)
      alert('删除失败，请重试')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={isEditing ? 'ghost' : 'default'} size={isEditing ? 'sm' : 'default'}>
          {isEditing ? '编辑' : '添加交付物'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? '编辑交付物' : '添加交付物'}</DialogTitle>
          <DialogDescription>
            {isEditing ? '修改交付物信息' : '添加一个新的交付项'}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="collaboration_id" value={collaborationId} />
          <div className="space-y-2">
            <Label htmlFor="title">交付项名称 *</Label>
            <Input
              id="title"
              name="title"
              defaultValue={deliverable?.title || ''}
              placeholder="例如：3条 Instagram 帖子"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={deliverable?.description || ''}
              placeholder="交付内容详情"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due_date">截止日期</Label>
              <Input
                id="due_date"
                name="due_date"
                type="date"
                defaultValue={deliverable?.due_date || ''}
              />
            </div>
            {isEditing && (
              <div className="space-y-2">
                <Label htmlFor="status">状态</Label>
                <Select name="status" defaultValue={deliverable?.status || 'pending'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">待完成</SelectItem>
                    <SelectItem value="completed">已完成</SelectItem>
                    <SelectItem value="approved">已审批</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
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
