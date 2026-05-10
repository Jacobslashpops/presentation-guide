'use client'

import { Button } from '@/components/ui/button'
import { approveInvoice, rejectInvoice } from '@/lib/actions'

interface InvoiceActionsProps {
  invoiceId: string
}

export function InvoiceActions({ invoiceId }: InvoiceActionsProps) {
  async function handleApprove() {
    if (!confirm('确定批准这个 Invoice 吗？')) return
    try {
      await approveInvoice(invoiceId)
    } catch (error) {
      console.error('Failed to approve invoice:', error)
      alert('审批失败')
    }
  }

  async function handleReject() {
    if (!confirm('确定拒绝这个 Invoice 吗？')) return
    try {
      await rejectInvoice(invoiceId)
    } catch (error) {
      console.error('Failed to reject invoice:', error)
      alert('拒绝失败')
    }
  }

  return (
    <div className="flex gap-1">
      <Button variant="default" size="sm" onClick={handleApprove}>
        批准
      </Button>
      <Button variant="outline" size="sm" onClick={handleReject}>
        拒绝
      </Button>
    </div>
  )
}
