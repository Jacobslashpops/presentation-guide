'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { InvoiceForm } from './invoice-form'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface InvoiceCreateButtonProps {
  collaborations: { id: string; title: string; currency_id: string }[]
  companies: { id: string; name: string }[]
  currencies: { id: string; code: string; name: string }[]
}

export function InvoiceCreateButton({ collaborations, companies, currencies }: InvoiceCreateButtonProps) {
  const [open, setOpen] = useState(false)
  const [sourceType, setSourceType] = useState<'uploaded' | 'generated' | null>(null)

  function handleSelectType(type: 'uploaded' | 'generated') {
    setSourceType(type)
  }

  function handleClose() {
    setOpen(false)
    setSourceType(null)
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>新建 Invoice</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新建 Invoice</DialogTitle>
          </DialogHeader>
          {!sourceType ? (
            <div className="grid grid-cols-2 gap-4 py-4">
              <button
                onClick={() => handleSelectType('uploaded')}
                className="p-6 border rounded-lg hover:bg-accent text-left transition-colors"
              >
                <div className="font-medium text-lg mb-2">上传 Invoice</div>
                <div className="text-sm text-muted-foreground">
                  上传已有的 PDF 或图片文件
                </div>
              </button>
              <button
                onClick={() => handleSelectType('generated')}
                className="p-6 border rounded-lg hover:bg-accent text-left transition-colors"
              >
                <div className="font-medium text-lg mb-2">生成 Invoice</div>
                <div className="text-sm text-muted-foreground">
                  填写信息，由系统生成 PDF Invoice
                </div>
              </button>
            </div>
          ) : (
            <InvoiceForm
              sourceType={sourceType}
              collaborations={collaborations}
              companies={companies}
              currencies={currencies}
              onCancel={handleClose}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
