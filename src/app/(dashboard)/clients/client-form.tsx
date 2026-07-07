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
import { createClient, updateClient, deleteClient } from '@/lib/actions'
import { toast } from 'sonner'

interface ClientFormProps {
  client?: {
    id: string
    name: string
    description: string | null
  }
}

export function ClientForm({ client }: ClientFormProps) {
  const [open, setOpen] = useState(false)
  const isEditing = !!client

  async function handleSubmit(formData: FormData) {
    try {
      if (isEditing) {
        await updateClient(client.id, formData)
      } else {
        await createClient(formData)
      }
      setOpen(false)
    } catch (error) {
      console.error('Failed to save client:', error)
      toast.error((error as Error).message || '保存失败，请重试')
    }
  }

  async function handleDelete() {
    if (!client) return
    if (!confirm('确定要删除这个客户吗？')) return
    try {
      await deleteClient(client.id)
      setOpen(false)
    } catch (error) {
      console.error('Failed to delete client:', error)
      toast.error((error as Error).message || '删除失败，请重试')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={isEditing ? 'ghost' : 'default'} size={isEditing ? 'sm' : 'default'}>
          {isEditing ? '编辑' : '新建客户'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? '编辑客户' : '新建客户'}</DialogTitle>
          <DialogDescription>
            {isEditing ? '修改客户信息' : '添加一个新的品牌方客户'}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">客户名称 *</Label>
            <Input
              id="name"
              name="name"
              defaultValue={client?.name || ''}
              placeholder="例如：Nike"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={client?.description || ''}
              placeholder="客户的描述信息"
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
