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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createBankAccount, updateBankAccount, deleteBankAccount } from '@/lib/actions'
import { Pencil, Plus, Trash2 } from 'lucide-react'

interface Currency {
  id: string
  code: string
  name: string
}

interface BankAccount {
  id: string
  account_name: string
  bank_name: string | null
  country: string
  currency_id: string
  account_type: string | null
  swift_bic: string | null
  is_default: boolean
}

export function BankAccountForm({
  bankAccount,
  currencies,
}: {
  bankAccount?: BankAccount
  currencies: Currency[]
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const isEdit = !!bankAccount

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    try {
      if (isEdit && bankAccount) {
        await updateBankAccount(bankAccount.id, formData)
      } else {
        await createBankAccount(formData)
      }
      setOpen(false)
    } catch (error: any) {
      alert(error.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!bankAccount || !confirm('确定要删除这个银行账户吗？')) return
    setLoading(true)
    try {
      await deleteBankAccount(bankAccount.id)
      setOpen(false)
    } catch (error: any) {
      alert(error.message || '删除失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        isEdit ? (
          <Button variant="ghost" size="sm">
            <Pencil className="w-4 h-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            添加银行账户
          </Button>
        )
      } />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑银行账户' : '添加银行账户'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改收款银行账户信息' : '添加新的收款银行账户'}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>账户名称 *</Label>
            <Input name="account_name" defaultValue={bankAccount?.account_name || ''} required />
          </div>
          <div className="space-y-2">
            <Label>银行名称</Label>
            <Input name="bank_name" defaultValue={bankAccount?.bank_name || ''} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>国家 *</Label>
              <Input name="country" defaultValue={bankAccount?.country || ''} required />
            </div>
            <div className="space-y-2">
              <Label>币种 *</Label>
              <Select name="currency_id" defaultValue={bankAccount?.currency_id || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="选择币种" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.code} - {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>账户类型</Label>
              <Select name="account_type" defaultValue={bankAccount?.account_type || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="选择类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">活期账户</SelectItem>
                  <SelectItem value="savings">储蓄账户</SelectItem>
                  <SelectItem value="business">对公账户</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>SWIFT/BIC</Label>
              <Input name="swift_bic" defaultValue={bankAccount?.swift_bic || ''} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_default"
              id="is_default"
              value="true"
              defaultChecked={bankAccount?.is_default || false}
              className="h-4 w-4"
            />
            <Label htmlFor="is_default">设为默认收款账户</Label>
          </div>
          <div className="flex justify-between">
            {isEdit && (
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
                <Trash2 className="w-4 h-4 mr-2" />
                删除
              </Button>
            )}
            <Button type="submit" disabled={loading} className={isEdit ? 'ml-auto' : ''}>
              {loading ? '保存中...' : isEdit ? '保存修改' : '添加账户'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
