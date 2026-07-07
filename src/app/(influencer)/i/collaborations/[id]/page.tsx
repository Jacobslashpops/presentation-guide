import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'
import { MarkDeliverableCompleteButton } from './mark-deliverable-button'

export default async function InfluencerCollaborationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: influencer } = await supabase
    .from('influencers')
    .select('id')
    .eq('email', user.email)
    .single()

  if (!influencer) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">合作详情</h1>
        <p className="text-muted-foreground">请先完成红人档案设置</p>
      </div>
    )
  }

  const { data: collaboration } = await supabase
    .from('collaborations')
    .select(`
      *,
      project:projects(name, client:clients(name)),
      currency:currencies(id, code, symbol),
      deliverables:deliverables(id, title, description, status, due_date, created_at),
      payments:payments(id, requested_amount, status, requested_at, paid_at, actual_amount),
      invoices:invoices(id, invoice_number, amount, status)
    `)
    .eq('id', id)
    .eq('influencer_id', influencer.id)
    .single()

  if (!collaboration) notFound()

  const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    draft: { label: '草稿', variant: 'secondary' },
    active: { label: '进行中', variant: 'default' },
    completed: { label: '已完成', variant: 'outline' },
    cancelled: { label: '已取消', variant: 'destructive' },
  }

  const deliverableStatusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    pending: { label: '待完成', variant: 'secondary' },
    completed: { label: '已完成', variant: 'default' },
    approved: { label: '已审批', variant: 'outline' },
  }

  const paymentStatusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    pending: { label: '待付款', variant: 'default' },
    paid: { label: '已付款', variant: 'outline' },
    rejected: { label: '已拒绝', variant: 'destructive' },
    cancelled: { label: '已取消', variant: 'secondary' },
  }

  const currency = (collaboration as any).currency
  const project = collaboration.project as any
  const deliverables = (collaboration as any).deliverables || []
  const payments = (collaboration as any).payments || []
  const totalPaid = payments
    .filter((p: any) => ['pending', 'paid'].includes(p.status))
    .reduce((sum: number, p: any) => sum + (p.requested_amount || 0), 0)
  const remainingAmount = (collaboration.total_amount || 0) - totalPaid
  const completedDeliverables = deliverables.filter((d: any) => d.status === 'completed' || d.status === 'approved').length

  return (
    <div className="space-y-6">
      <Link href="/i/collaborations" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
        ← 返回合作列表
      </Link>

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{collaboration.title}</h1>
            <Badge variant={statusMap[collaboration.status]?.variant || 'default'}>
              {statusMap[collaboration.status]?.label || collaboration.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {project?.client?.name} · {project?.name}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">合作总金额</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currency?.code} {collaboration.total_amount?.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">已申请付款</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currency?.code} {totalPaid.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">剩余可付</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currency?.code} {remainingAmount.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">交付进度</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedDeliverables}/{deliverables.length}
            </div>
            {collaboration.deliverables_confirmed && (
              <Badge variant="default" className="mt-1">交付已确认</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {collaboration.description && (
        <Card>
          <CardHeader>
            <CardTitle>合作描述</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{collaboration.description}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>交付物清单</CardTitle>
          <CardDescription>完成交付后点击「标记完成」，等待运营审批</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>交付项</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>截止日期</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="w-[120px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliverables.map((deliverable: any) => (
                <TableRow key={deliverable.id}>
                  <TableCell className="font-medium">{deliverable.title}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {deliverable.description || '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {deliverable.due_date
                      ? new Date(deliverable.due_date).toLocaleDateString('zh-CN')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={deliverableStatusMap[deliverable.status]?.variant || 'default'}>
                      {deliverableStatusMap[deliverable.status]?.label || deliverable.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {deliverable.status === 'pending' && (
                      <MarkDeliverableCompleteButton deliverableId={deliverable.id} collaborationId={collaboration.id} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {deliverables.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    暂无交付物
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>付款记录</CardTitle>
          <CardDescription>查看付款申请和到账情况</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>申请金额</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>申请时间</TableHead>
                <TableHead>实际到账</TableHead>
                <TableHead>到账时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment: any) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">
                    {currency?.code} {payment.requested_amount?.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={paymentStatusMap[payment.status]?.variant || 'default'}>
                      {paymentStatusMap[payment.status]?.label || payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {payment.requested_at
                      ? new Date(payment.requested_at).toLocaleDateString('zh-CN')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {payment.actual_amount
                      ? `${currency?.code} ${payment.actual_amount.toLocaleString()}`
                      : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {payment.paid_at
                      ? new Date(payment.paid_at).toLocaleDateString('zh-CN')
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
              {payments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
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
