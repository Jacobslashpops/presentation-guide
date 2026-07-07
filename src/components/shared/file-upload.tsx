'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { uploadInvoiceFile, uploadPaymentReceipt } from '@/lib/actions'
import { Upload, File, X } from 'lucide-react'

interface FileUploadProps {
  type: 'invoice' | 'receipt'
  targetId: string
  onUploadComplete?: () => void
}

export function FileUpload({ type, targetId, onUploadComplete }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return

    if (!allowedTypes.includes(selected.type)) {
      setError('仅支持 PDF、JPEG、PNG、WebP 格式')
      return
    }

    if (selected.size > maxSize) {
      setError('文件大小不能超过 10MB')
      return
    }

    setError('')
    setFile(selected)
  }

  async function handleUpload() {
    if (!file) return

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      if (type === 'invoice') {
        formData.append('invoice_id', targetId)
        await uploadInvoiceFile(formData)
      } else {
        formData.append('payment_id', targetId)
        await uploadPaymentReceipt(formData)
      }

      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
      onUploadComplete?.()
    } catch (err: any) {
      setError(err.message || '上传失败')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={handleFileChange}
          className="hidden"
          id={`file-upload-${type}-${targetId}`}
        />
        <label htmlFor={`file-upload-${type}-${targetId}`}>
          <Button variant="outline" size="sm" render={
            <span className="cursor-pointer inline-flex items-center">
              <Upload className="w-4 h-4 mr-2" />
              选择文件
            </span>
          } />
        </label>
        {file && (
          <>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <File className="w-3.5 h-3.5" />
              <span className="truncate max-w-[150px]">{file.name}</span>
              <span className="text-xs">({(file.size / 1024).toFixed(0)}KB)</span>
            </div>
            <button
              onClick={() => { setFile(null); if (inputRef.current) inputRef.current.value = '' }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
      {file && (
        <Button size="sm" onClick={handleUpload} disabled={uploading}>
          {uploading ? '上传中...' : '确认上传'}
        </Button>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
