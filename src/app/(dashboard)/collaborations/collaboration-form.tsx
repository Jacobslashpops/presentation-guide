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
import { createCollaboration, updateCollaboration, deleteCollaboration } from '@/lib/actions'
import { toast } from 'sonner'

interface CollaborationFormProps {
  collaboration?: {
    id: string
    project_id: string
    influencer_id: string
    title: string
    description: string | null
    total_amount: number
    currency_id: string
    status: string
  }
  projects: { id: string; name: string }[]
  influencers: { id: string; display_name: string }[]
  currencies: { id: string; code: string; name: string }[]
}

export function CollaborationForm({ collaboration, projects, influencers, currencies }: CollaborationFormProps) {
  const [open, setOpen] = useState(false)
  const isEditing = !!collaboration

  async function handleSubmit(formData: FormData) {
    try {
      if (isEditing) {
        await updateCollaboration(collaboration.id, formData)
      } else {
        await createCollaboration(formData)
      }
      setOpen(false)
    } catch (error) {
      console.error('Failed to save collaboration:', error)
      toast.error((error as Error).message || '保存失败，请重试')
    }
  }

  async function handleDelete() {
    if (!collaboration) return
    if (!confirm('确定要删除这个合作吗？')) return
    try {
      await deleteCollaboration(collaboration.id)
      setOpen(false)
    } catch (error) {
      console.error('Failed to delete collaboration:', error)
      toast.error((error as Error).message || '删除失败，请重试')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={isEditing ? 'ghost' : 'default'} size={isEditing ? 'sm' : 'default'}>
          {isEditing ? '编辑' : '新建合作'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? '编辑合作' : '新建合作'}</DialogTitle>
          <DialogDescription>
            {isEditing ? '修改合作信息' : '创建一个新的红人合作'}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project_id">项目 *</Label>
              <Select name="project_id" defaultValue={collaboration?.project_id || ''} required>
                <SelectTrigger>
                  <SelectValue placeholder="选择项目" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="influencer_id">红人 *</Label>
              <Select name="influencer_id" defaultValue={collaboration?.influencer_id || ''} required>
                <SelectTrigger>
                  <SelectValue placeholder="选择红人" />
                </SelectTrigger>
                <SelectContent>
                  {influencers.map((influencer) => (
                    <SelectItem key={influencer.id} value={influencer.id}>
                      {influencer.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">合作标题 *</Label>
            <Input
              id="title"
              name="title"
              defaultValue={collaboration?.title || ''}
              placeholder="例如：春季新品推广"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={collaboration?.description || ''}
              placeholder="合作详情描述"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total_amount">合作总价 *</Label>
              <Input
                id="total_amount"
                name="total_amount"
                type="number"
                step="0.01"
                defaultValue={collaboration?.total_amount || ''}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency_id">币种 *</Label>
              <Select name="currency_id" defaultValue={collaboration?.currency_id || ''} required>
                <SelectTrigger>
                  <SelectValue placeholder="选择币种" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.id} value={currency.id}>
                      {currency.code} - {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">状态</Label>
              <Select name="status" defaultValue={collaboration?.status || 'active'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">草稿</SelectItem>
                  <SelectItem value="active">进行中</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                  <SelectItem value="cancelled">已取消</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
