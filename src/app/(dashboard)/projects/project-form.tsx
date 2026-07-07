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
import { createProject, updateProject, deleteProject } from '@/lib/actions'
import { toast } from 'sonner'

interface ProjectFormProps {
  project?: {
    id: string
    client_id: string
    name: string
    description: string | null
    status: string
    start_date: string | null
    end_date: string | null
    budget: number | null
    budget_currency_id: string | null
  }
  clients: { id: string; name: string }[]
  currencies: { id: string; code: string; name: string }[]
}

export function ProjectForm({ project, clients, currencies }: ProjectFormProps) {
  const [open, setOpen] = useState(false)
  const isEditing = !!project

  async function handleSubmit(formData: FormData) {
    try {
      if (isEditing) {
        await updateProject(project.id, formData)
      } else {
        await createProject(formData)
      }
      setOpen(false)
    } catch (error) {
      console.error('Failed to save project:', error)
      toast.error((error as Error).message || '保存失败，请重试')
    }
  }

  async function handleDelete() {
    if (!project) return
    if (!confirm('确定要删除这个项目吗？')) return
    try {
      await deleteProject(project.id)
      setOpen(false)
    } catch (error) {
      console.error('Failed to delete project:', error)
      toast.error((error as Error).message || '删除失败，请重试')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={isEditing ? 'ghost' : 'default'} size={isEditing ? 'sm' : 'default'}>
          {isEditing ? '编辑' : '新建项目'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? '编辑项目' : '新建项目'}</DialogTitle>
          <DialogDescription>
            {isEditing ? '修改项目信息' : '为客户创建一个新项目'}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_id">客户 *</Label>
              <Select name="client_id" defaultValue={project?.client_id || ''} required>
                <SelectTrigger>
                  <SelectValue placeholder="选择客户" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">项目名称 *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={project?.name || ''}
                placeholder="例如：春季新品发布"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={project?.description || ''}
              placeholder="项目描述"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">状态</Label>
              <Select name="status" defaultValue={project?.status || 'active'}>
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
            <div className="space-y-2">
              <Label htmlFor="start_date">开始日期</Label>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                defaultValue={project?.start_date || ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">结束日期</Label>
              <Input
                id="end_date"
                name="end_date"
                type="date"
                defaultValue={project?.end_date || ''}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget">预算</Label>
              <Input
                id="budget"
                name="budget"
                type="number"
                step="0.01"
                defaultValue={project?.budget || ''}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget_currency_id">预算币种</Label>
              <Select name="budget_currency_id" defaultValue={project?.budget_currency_id || ''}>
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
