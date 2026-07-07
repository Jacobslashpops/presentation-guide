import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('payments')
    .select('*, collaboration:collaborations(title), currency:currencies(code), requested_by_user:users(full_name), paid_by_user:users(full_name)')
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data: payments } = await query

  const paymentStatusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    pending: { label: '待付款', variant: 'default' },
    paid: { label: '已付款', variant: 'outline' },
    rejected: { label: '已拒绝', variant: 'destructive' },
    cancelled: { label: '已取消', variant: 'secondary' },
  }

  const tabs = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待付款' },
    { key: 'paid', label: '已付款' },
    { key: 'rejected', label: '已拒绝' },
    { key: 'cancelled', label: '已取消' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">付款管理</h1>
        <p className="text-muted-foreground">管理付款申请和记录</p>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-1 border-b pb-1">
        {tabs.map((tab) => {
          const isActive = (status || 'all') === tab.key
          return (
            <Link key={tab.key} href={`/payments?status=${tab.key}`}>
              <Button
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                className="rounded-b-none"
              >
                {tab.label}
              </Button>
            </Link>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>付款列表</CardTitle>
          <CardDescription>
            共 {payments?.length || 0} 条记录
            {status && status !== 'all' && ` · 状态: ${tabs.find(t => t.key === status)?.label}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>合作</TableHead>
                <TableHead>申请金额</TableHead>
                <TableHead>货币</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>申请人</TableHead>
                <TableHead>申请时间</TableHead>
                <TableHead>付款人</TableHead>
                <TableHead className="w-[100px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments?.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">
                    {(payment.collaboration as any)?.title || '-'}
                  </TableCell>
                  <TableCell>{payment.requested_amount?.toLocaleString()}</TableCell>
                  <TableCell>{(payment as any).currency?.code}</TableCell>
                  <TableCell>
                    <Badge variant={paymentStatusMap[payment.status]?.variant || 'default'}>
                      {paymentStatusMap[payment.status]?.label || payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{(payment as any).requested_by_user?.full_name || '-'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {payment.requested_at
                      ? new Date(payment.requested_at).toLocaleDateString('zh-CN')
                      : '-'}
                  </TableCell>
                  <TableCell>{(payment as any).paid_by_user?.full_name || '-'}</TableCell>
                  <TableCell>
                    <Link href={`/payments/${payment.id}`}>
                      <Button variant="ghost" size="sm">查看</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {(!payments || payments.length === 0) && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    暂无付款记录
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
