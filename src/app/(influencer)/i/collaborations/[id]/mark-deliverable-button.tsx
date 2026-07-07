'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { markDeliverableComplete } from '@/lib/actions'

export function MarkDeliverableCompleteButton({
  deliverableId,
  collaborationId,
}: {
  deliverableId: string
  collaborationId: string
}) {
  const [loading, setLoading] = useState(false)

  async function handleMarkComplete() {
    setLoading(true)
    try {
      await markDeliverableComplete(deliverableId, collaborationId)
    } catch (error: any) {
      alert(error.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleMarkComplete}
      disabled={loading}
    >
      {loading ? '提交中...' : '标记完成'}
    </Button>
  )
}
