'use client'

import { Button } from '@/components/ui/button'
import { confirmDeliverables } from '@/lib/actions'

interface ConfirmDeliverablesButtonProps {
  collaborationId: string
}

export function ConfirmDeliverablesButton({ collaborationId }: ConfirmDeliverablesButtonProps) {
  async function handleConfirm() {
    if (!confirm('确认所有交付物已完成？此操作不可撤销。')) return
    try {
      await confirmDeliverables(collaborationId)
    } catch (error) {
      console.error('Failed to confirm deliverables:', error)
      alert('确认失败，请重试')
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleConfirm} className="w-full">
      确认交付完成
    </Button>
  )
}
