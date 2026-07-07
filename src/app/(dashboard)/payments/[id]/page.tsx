import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { markPaymentPaid } from '@/lib/actions'
import { PaymentActions } from './payment-actions'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PaymentDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: payment } = await supabase
    .from('payments')
    .select('*, collaboration:collaborations(title, total_amount), currency:currencies(code), requested_by_user:users(full_name), paid_by_user:users(full_name), invoice:invoices(invoice_number)')
    .eq('id', id)
    .single()

  if (!payment) notFound()

  const { data: currencies } = await supabase
    .from('currencies')
    .select('id, code, name')
    .eq('is_active', true)
    .order('code')

  const paymentStatusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    pending: { label: '待付款', variant: 'default' },
    paid: { label: '已付款', variant: 'outline' },
    rejected: { label: '已拒绝', variant: 'destructive' },
    cancelled: { label: '已取消', variant: 'secondary' },
  }

  const collaboration = (payment as any).collaboration
  const currency = (payment as any).currency
  const requestedBy = (payment as any).requested_by_user
  const paidBy = (payment as any).paid_by_user
  const invoice = (payment as any).invoice

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">付款详情</h1>
            <Badge variant={paymentStatusMap[payment.status]?.variant || 'default'}>
              {paymentStatusMap[payment.status]?.label || payment.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            付款 ID: {payment.id.slice(0, 8)}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/payments">
            <Button variant="outline">返回列表</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Payment Info */}
        <Card>
          <CardHeader>
            <CardTitle>付款信息</CardTitle>
            <CardDescription>付款申请的基本信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">合作</Label>
                <p className="font-medium">{collaboration?.title || '-'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Invoice</Label>
                <p className="font-medium">{invoice?.invoice_number || '-'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">申请金额</Label>
                <p className="text-xl font-bold">{currency?.code} {payment.requested_amount?.toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">合作总价</Label>
                <p className="font-medium">{currency?.code} {collaboration?.total_amount?.toLocaleString()}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">申请人</Label>
                <p className="font-medium">{requestedBy?.full_name || '-'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">申请时间</Label>
                <p className="font-medium">
                  {payment.requested_at
                    ? new Date(payment.requested_at).toLocaleString('zh-CN')
                    : '-'}
                </p>
              </div>
            </div>
            {payment.status === 'paid' && (
              <>
                <div className="border-t pt-4 grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">实际付款金额</Label>
                    <p className="font-medium">
                      {payment.actual_amount?.toLocaleString() || '-'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">汇率</Label>
                    <p className="font-medium">{payment.exchange_rate || '-'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">付款参考号</Label>
                    <p className="font-medium">{payment.payment_reference || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">付款人</Label>
                    <p className="font-medium">{paidBy?.full_name || '-'}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">备注</Label>
                  <p className="font-medium">{payment.notes || '-'}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Finance Actions */}
        {payment.status === 'pending' && (
          <Card>
            <CardHeader>
              <CardTitle>确认付款</CardTitle>
              <CardDescription>财务确认实际付款信息</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={markPaymentPaid} className="space-y-4">
                <input type="hidden" name="id" value={payment.id} />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="actual_amount">实际付款金额</Label>
                    <Input
                      id="actual_amount"
                      name="actual_amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="actual_currency_id">付款货币</Label>
                    <Select name="actual_currency_id">
                      <SelectTrigger>
                        <SelectValue placeholder="选择货币" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.code} - {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="exchange_rate">汇率</Label>
                    <Input
                      id="exchange_rate"
                      name="exchange_rate"
                      type="number"
                      step="0.000001"
                      min="0"
                      placeholder="1.000000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_reference">付款参考号</Label>
                    <Input
                      id="payment_reference"
                      name="payment_reference"
                      placeholder="例如：银行转账流水号"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="receipt_url">收据/凭证链接</Label>
                  <Input
                    id="receipt_url"
                    name="receipt_url"
                    type="url"
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">备注</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="付款备注信息"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="submit" className="flex-1">确认已付款</Button>
                  <PaymentActions paymentId={payment.id} />
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
