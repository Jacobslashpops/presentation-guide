'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createPayment } from '@/lib/actions'

interface PaymentFormProps {
  collaborationId: string
  invoiceId: string
  currencyId: string
  maxAmount: number
  currencyCode?: string
}

export function PaymentForm({ collaborationId, invoiceId, currencyId, maxAmount, currencyCode }: PaymentFormProps) {
  const [open, setOpen] = useState(false)

  async function handleSubmit(formData: FormData) {
    try {
      await createPayment(formData)
      setOpen(false)
    } catch (error) {
      console.error('Failed to create payment:', error)
      alert(error instanceof Error ? error.message : '付款申请失败')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">申请付款</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>申请付款</DialogTitle>
          <DialogDescription>
            为此合作申请付款，金额不能超过 {currencyCode} {maxAmount.toLocaleString()}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="collaboration_id" value={collaborationId} />
          <input type="hidden" name="invoice_id" value={invoiceId} />
          <input type="hidden" name="requested_currency_id" value={currencyId} />

          <div className="space-y-2">
            <Label htmlFor="requested_amount">付款金额 *</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground w-12">{currencyCode}</span>
              <Input
                id="requested_amount"
                name="requested_amount"
                type="number"
                step="0.01"
                min="0.01"
                max={maxAmount}
                placeholder="0.00"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              最多可申请 {maxAmount.toLocaleString()}
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="submit">提交申请</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
