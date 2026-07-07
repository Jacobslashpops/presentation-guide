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
import { createCompany, updateCompany, deleteCompany } from '@/lib/actions'
import { toast } from 'sonner'

interface CompanyFormProps {
  company?: {
    id: string
    name: string
    email: string | null
    address: string | null
    tax_id: string | null
    country: string
  }
}

export function CompanyForm({ company }: CompanyFormProps) {
  const [open, setOpen] = useState(false)
  const isEditing = !!company

  async function handleSubmit(formData: FormData) {
    try {
      if (isEditing) {
        await updateCompany(company.id, formData)
      } else {
        await createCompany(formData)
      }
      setOpen(false)
    } catch (error) {
      console.error('Failed to save company:', error)
      toast.error((error as Error).message || '保存失败，请重试')
    }
  }

  async function handleDelete() {
    if (!company) return
    if (!confirm('确定要删除这个付款方吗？')) return
    try {
      await deleteCompany(company.id)
      setOpen(false)
    } catch (error) {
      console.error('Failed to delete company:', error)
      toast.error((error as Error).message || '删除失败，请重试')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={isEditing ? 'ghost' : 'default'} size={isEditing ? 'sm' : 'default'}>
          {isEditing ? '编辑' : '新建付款方'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? '编辑付款方' : '新建付款方'}</DialogTitle>
          <DialogDescription>
            {isEditing ? '修改付款方信息' : '添加一个新的 Invoice 付款方'}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">名称 *</Label>
            <Input
              id="name"
              name="name"
              defaultValue={company?.name || ''}
              placeholder="例如：Nike Inc."
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">国家 *</Label>
              <Input
                id="country"
                name="country"
                defaultValue={company?.country || ''}
                placeholder="例如：US"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={company?.email || ''}
                placeholder="billing@company.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tax_id">税号</Label>
            <Input
              id="tax_id"
              name="tax_id"
              defaultValue={company?.tax_id || ''}
              placeholder="Tax ID / VAT Number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">地址</Label>
            <Textarea
              id="address"
              name="address"
              defaultValue={company?.address || ''}
              placeholder="公司地址"
              rows={2}
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
