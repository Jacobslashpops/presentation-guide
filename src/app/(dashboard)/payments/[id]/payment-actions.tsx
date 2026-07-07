'use client'

import { Button } from '@/components/ui/button'
import { rejectPayment, cancelPayment } from '@/lib/actions'
import { toast } from 'sonner'

interface PaymentActionsProps {
  paymentId: string
}

export function PaymentActions({ paymentId }: PaymentActionsProps) {
  async function handleReject() {
    if (!confirm('确定拒绝这个付款申请吗？')) return
    try {
      await rejectPayment(paymentId)
    } catch (error) {
      console.error('Failed to reject payment:', error)
      toast.error((error as Error).message || '拒绝失败')
    }
  }

  async function handleCancel() {
    if (!confirm('确定取消这个付款申请吗？')) return
    try {
      await cancelPayment(paymentId)
    } catch (error) {
      console.error('Failed to cancel payment:', error)
      toast.error((error as Error).message || '取消失败')
    }
  }

  return (
    <div className="flex gap-2">
      <Button type="button" variant="destructive" onClick={handleReject}>
        拒绝
      </Button>
      <Button type="button" variant="outline" onClick={handleCancel}>
        取消
      </Button>
    </div>
  )
}
