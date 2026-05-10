'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createInvoice } from '@/lib/actions'

interface InvoiceItem {
  description: string
  quantity: number
  unit_price: number
  amount: number
}

interface InvoiceFormProps {
  sourceType: 'uploaded' | 'generated'
  collaborations: { id: string; title: string; currency_id: string }[]
  companies: { id: string; name: string }[]
  currencies: { id: string; code: string; name: string }[]
  onCancel: () => void
}

export function InvoiceForm({ sourceType, collaborations, companies, currencies, onCancel }: InvoiceFormProps) {
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unit_price: 0, amount: 0 },
  ])
  const [totalAmount, setTotalAmount] = useState(0)
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState('')

  function updateItem(index: number, field: keyof InvoiceItem, value: string | number) {
    const newItems = [...items]
    if (field === 'description') {
      newItems[index].description = value as string
    } else {
      newItems[index][field] = Number(value) || 0
      newItems[index].amount = newItems[index].quantity * newItems[index].unit_price
    }
    setItems(newItems)
    setTotalAmount(newItems.reduce((sum, item) => sum + item.amount, 0))
  }

  function addItem() {
    setItems([...items, { description: '', quantity: 1, unit_price: 0, amount: 0 }])
  }

  function removeItem(index: number) {
    if (items.length <= 1) return
    const newItems = items.filter((_, i) => i !== index)
    setItems(newItems)
    setTotalAmount(newItems.reduce((sum, item) => sum + item.amount, 0))
  }

  async function handleSubmit(formData: FormData) {
    try {
      if (sourceType === 'generated') {
        const validItems = items.filter(item => item.description.trim() && item.amount > 0)
        if (validItems.length === 0) {
          alert('请至少添加一个有效的明细项')
          return
        }
        formData.append('items', JSON.stringify(validItems))
        formData.append('amount', totalAmount.toString())
      }
      await createInvoice(formData)
      onCancel()
    } catch (error) {
      console.error('Failed to create invoice:', error)
      alert('创建失败：' + (error as Error).message)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="source_type" value={sourceType} />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="collaboration_id">关联合作（可选）</Label>
          <Select name="collaboration_id">
            <SelectTrigger>
              <SelectValue placeholder="选择合作或留空（独立 Invoice）" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">独立 Invoice</SelectItem>
              {collaborations.map((collab) => (
                <SelectItem key={collab.id} value={collab.id}>
                  {collab.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="company_id">付款方（可选）</Label>
          <Select name="company_id">
            <SelectTrigger>
              <SelectValue placeholder="选择付款方" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">无</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="invoice_number">发票编号</Label>
          <Input
            id="invoice_number"
            name="invoice_number"
            placeholder="INV-001"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency_id">币种 *</Label>
          <Select name="currency_id" required>
            <SelectTrigger>
              <SelectValue placeholder="选择币种" />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency.id} value={currency.id}>
                  {currency.code} - {currency.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">金额 *</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            defaultValue={sourceType === 'generated' ? totalAmount : ''}
            value={sourceType === 'generated' ? totalAmount || '' : undefined}
            readOnly={sourceType === 'generated'}
            placeholder="0.00"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="invoice_date">发票日期</Label>
          <Input id="invoice_date" name="invoice_date" type="date" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="due_date">到期日期</Label>
          <Input id="due_date" name="due_date" type="date" />
        </div>
      </div>

      {sourceType === 'uploaded' && (
        <div className="space-y-2">
          <Label htmlFor="file">上传文件</Label>
          <Input id="file" name="file" type="file" accept=".pdf,.png,.jpg,.jpeg" />
          <p className="text-xs text-muted-foreground">支持 PDF、PNG、JPG 格式</p>
        </div>
      )}

      {sourceType === 'generated' && (
        <div className="space-y-3 border rounded-lg p-4">
          <div className="font-medium">明细项</div>
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-5">
                <Input
                  placeholder="描述"
                  value={item.description}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  placeholder="数量"
                  value={item.quantity || ''}
                  onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                />
              </div>
              <div className="col-span-3">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="单价"
                  value={item.unit_price || ''}
                  onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                />
              </div>
              <div className="col-span-1 text-right text-sm">
                {item.amount.toLocaleString()}
              </div>
              <div className="col-span-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(index)}
                  disabled={items.length <= 1}
                >
                  删除
                </Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            + 添加明细项
          </Button>
          <div className="text-right font-medium text-lg">
            合计: {totalAmount.toLocaleString()}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="notes">备注</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Invoice 备注信息"
          rows={2}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit">提交 Invoice</Button>
      </div>
    </form>
  )
}
