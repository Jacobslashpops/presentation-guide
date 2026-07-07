'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createCurrency, updateCurrency, deleteCurrency } from '@/lib/actions'

interface CurrencyFormProps {
  currency?: {
    id: string
    code: string
    name: string
    symbol: string | null
    is_active: boolean
    is_default: boolean
    supported_countries: string[]
  }
}

export function CurrencyForm({ currency }: CurrencyFormProps) {
  const [open, setOpen] = useState(false)
  const isEditing = !!currency

  async function handleSubmit(formData: FormData) {
    try {
      if (isEditing) {
        await updateCurrency(currency.id, formData)
      } else {
        await createCurrency(formData)
      }
      setOpen(false)
    } catch (error) {
      console.error('Failed to save currency:', error)
      alert('保存失败，请重试')
    }
  }

  async function handleDelete() {
    if (!currency) return
    if (!confirm('确定要删除这个币种吗？')) return
    try {
      await deleteCurrency(currency.id)
      setOpen(false)
    } catch (error) {
      console.error('Failed to delete currency:', error)
      alert('删除失败，请重试')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={isEditing ? 'ghost' : 'default'} size={isEditing ? 'sm' : 'default'}>
          {isEditing ? '编辑' : '新建币种'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? '编辑币种' : '新建币种'}</DialogTitle>
          <DialogDescription>
            {isEditing ? '修改币种信息' : '添加一个新的币种'}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">代码 *</Label>
              <Input
                id="code"
                name="code"
                defaultValue={currency?.code || ''}
                placeholder="例如：USD"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="symbol">符号</Label>
              <Input
                id="symbol"
                name="symbol"
                defaultValue={currency?.symbol || ''}
                placeholder="例如：$"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">名称 *</Label>
            <Input
              id="name"
              name="name"
              defaultValue={currency?.name || ''}
              placeholder="例如：US Dollar"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supported_countries">支持国家（逗号分隔）</Label>
            <Input
              id="supported_countries"
              name="supported_countries"
              defaultValue={currency?.supported_countries?.join(', ') || ''}
              placeholder="例如：US, CA, UK"
            />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                name="is_active"
                defaultChecked={currency?.is_active ?? true}
                value="true"
              />
              <Label htmlFor="is_active">启用</Label>
            </div>
            {isEditing && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_default"
                  name="is_default"
                  defaultChecked={currency?.is_default || false}
                  value="true"
                />
                <Label htmlFor="is_default">设为默认</Label>
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
