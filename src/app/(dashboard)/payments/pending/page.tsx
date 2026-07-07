import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function PendingPaymentsPage() {
  const supabase = await createClient()

  const { data: payments } = await supabase
    .from('payments')
    .select('*, collaboration:collaborations(title), currency:currencies(code), requested_by_user:users(full_name)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  const paymentStatusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    pending: { label: '待付款', variant: 'default' },
    paid: { label: '已付款', variant: 'outline' },
    rejected: { label: '已拒绝', variant: 'destructive' },
    cancelled: { label: '已取消', variant: 'secondary' },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">待付款</h1>
          <p className="text-muted-foreground">需要财务处理的付款申请</p>
        </div>
        <Link href="/payments">
          <Button variant="outline">查看全部</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>待付款列表</CardTitle>
          <CardDescription>
            共 {payments?.length || 0} 条待处理记录
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
                  <TableCell>
                    <Link href={`/payments/${payment.id}`}>
                      <Button variant="ghost" size="sm">处理</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {(!payments || payments.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    暂无待付款申请
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
