import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DeliverableForm } from './deliverable-form'
import { ConfirmDeliverablesButton } from './confirm-button'
import { PaymentForm } from './payment-form'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export default async function CollaborationDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: collaboration } = await supabase
    .from('collaborations')
    .select('*, project:projects(name, client:clients(name)), influencer:influencers(display_name, email), currency:currencies(id, code)')
    .eq('id', id)
    .single()

  if (!collaboration) notFound()

  const { data: deliverables } = await supabase
    .from('deliverables')
    .select('*')
    .eq('collaboration_id', id)
    .order('created_at', { ascending: true })

  const { data: payments } = await supabase
    .from('payments')
    .select('*, currency:currencies(code), requested_by_user:users(full_name)')
    .eq('collaboration_id', id)
    .order('created_at', { ascending: false })

  // Find approved invoice for this collaboration
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, amount, status')
    .eq('collaboration_id', id)
    .eq('status', 'approved')

  const approvedInvoice = invoices?.[0]

  // Calculate remaining payment amount
  const totalPaid = payments
    ?.filter(p => ['pending', 'paid'].includes(p.status))
    .reduce((sum, p) => sum + (p.requested_amount || 0), 0) || 0
  const remainingAmount = (collaboration.total_amount || 0) - totalPaid

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

  const project = collaboration.project as any
  const influencer = collaboration.influencer as any
  const currency = (collaboration as any).currency

  const canRequestPayment =
    collaboration.deliverables_confirmed &&
    approvedInvoice &&
    remainingAmount > 0 &&
    !payments?.some(p => p.status === 'pending')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{collaboration.title}</h1>
            <Badge variant={statusMap[collaboration.status]?.variant || 'default'}>
              {statusMap[collaboration.status]?.label || collaboration.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            <Link href={`/projects?client=${project?.client?.name}`} className="hover:underline">
              {project?.client?.name}
            </Link>
            {' > '}
            <Link href={`/projects`} className="hover:underline">
              {project?.name}
            </Link>
            {' > '}
            {influencer?.display_name}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">合作价格</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currency?.code} {collaboration.total_amount?.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">红人</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">{influencer?.display_name}</div>
            <div className="text-sm text-muted-foreground">{influencer?.email || '-'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">交付确认</CardTitle>
          </CardHeader>
          <CardContent>
            {collaboration.deliverables_confirmed ? (
              <div>
                <Badge variant="default">已确认</Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {collaboration.deliverables_confirmed_at
                    ? new Date(collaboration.deliverables_confirmed_at).toLocaleDateString('zh-CN')
                    : ''}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Badge variant="secondary">待确认</Badge>
                <ConfirmDeliverablesButton collaborationId={collaboration.id} />
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">付款状态</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm">
                已付: {currency?.code} {totalPaid.toLocaleString()}
              </div>
              <div className="text-sm">
                剩余: {currency?.code} {remainingAmount.toLocaleString()}
              </div>
              {canRequestPayment && approvedInvoice && (
                <PaymentForm
                  collaborationId={collaboration.id}
                  invoiceId={approvedInvoice.id}
                  currencyId={currency?.id}
                  maxAmount={remainingAmount}
                  currencyCode={currency?.code}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {collaboration.description && (
        <Card>
          <CardHeader>
            <CardTitle>描述</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{collaboration.description}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>交付物</CardTitle>
            <CardDescription>管理本次合作的交付内容</CardDescription>
          </div>
          <DeliverableForm collaborationId={collaboration.id} />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>交付项</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>截止日期</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="w-[100px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliverables?.map((deliverable) => (
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
                    <DeliverableForm deliverable={deliverable} collaborationId={collaboration.id} />
                  </TableCell>
                </TableRow>
              ))}
              {(!deliverables || deliverables.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    暂无交付物，点击右上角添加
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payments Section */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>付款记录</CardTitle>
            <CardDescription>合作相关的付款申请和记录</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>申请金额</TableHead>
                <TableHead>货币</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>申请人</TableHead>
                <TableHead>申请时间</TableHead>
                <TableHead>实际付款金额</TableHead>
                <TableHead className="w-[100px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments?.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">
                    {payment.requested_amount?.toLocaleString()}
                  </TableCell>
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
                    {payment.actual_amount
                      ? `${payment.actual_amount.toLocaleString()}`
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Link href={`/payments/${payment.id}`}>
                      <Button variant="ghost" size="sm">查看</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {(!payments || payments.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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
