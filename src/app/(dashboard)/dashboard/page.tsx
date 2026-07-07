import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'
import { FolderOpen, Users, CreditCard, DollarSign, FileText, CheckCircle } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Parallel fetch all dashboard data
  const [
    { count: activeProjectsCount },
    { count: activeCollaborationsCount },
    { data: pendingPayments },
    { data: recentPayments },
    { data: pendingInvoices },
    { data: recentCollaborations },
  ] = await Promise.all([
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('collaborations').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('payments').select('id, requested_amount, requested_currency_id, status, collaboration:collaborations(title), currency:currencies(code)').eq('status', 'pending').order('created_at', { ascending: false }),
    supabase.from('payments').select('id, requested_amount, status, paid_at, collaboration:collaborations(title), currency:currencies(code)').eq('status', 'paid').order('paid_at', { ascending: false }).limit(5),
    supabase.from('invoices').select('id, invoice_number, amount, status, submitted_at, collaboration:collaborations(title), currency:currencies(code)').eq('status', 'submitted').order('created_at', { ascending: false }).limit(5),
    supabase.from('collaborations').select('id, title, total_amount, status, created_at, project:projects(name), influencer:influencers(display_name), currency:currencies(code)').order('created_at', { ascending: false }).limit(5),
  ])

  // Calculate monthly spending
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const { data: monthPayments } = await supabase
    .from('payments')
    .select('requested_amount, actual_amount')
    .eq('status', 'paid')
    .gte('paid_at', monthStart)

  const monthlySpent = monthPayments?.reduce((sum, p) => sum + (p.actual_amount || p.requested_amount || 0), 0) || 0
  const pendingPaymentTotal = pendingPayments?.reduce((sum, p) => sum + (p.requested_amount || 0), 0) || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">仪表盘</h1>
        <p className="text-muted-foreground">欢迎来到 CelePulse 红人管理系统</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">进行中项目</CardTitle>
            <FolderOpen className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjectsCount || 0}</div>
            <p className="text-xs text-muted-foreground">活跃状态的项目</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃合作</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCollaborationsCount || 0}</div>
            <p className="text-xs text-muted-foreground">进行中的合作</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待处理付款</CardTitle>
            <CreditCard className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayments?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              共 ${pendingPaymentTotal.toLocaleString()} 待付
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本月支出</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${monthlySpent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">本月已确认付款总额</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>近期合作</CardTitle>
            <CardDescription>最近创建的合作项目</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>合作名称</TableHead>
                  <TableHead>项目</TableHead>
                  <TableHead>红人</TableHead>
                  <TableHead>金额</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentCollaborations?.map((collab: any) => (
                  <TableRow key={collab.id}>
                    <TableCell className="font-medium">
                      <Link href={`/collaborations/${collab.id}`} className="hover:underline">
                        {collab.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {collab.project?.name || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {collab.influencer?.display_name || '-'}
                    </TableCell>
                    <TableCell>
                      {collab.currency?.code} {collab.total_amount?.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                {(!recentCollaborations || recentCollaborations.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                      暂无合作
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>待审批 Invoice</CardTitle>
            <CardDescription>等待审批的发票 ({pendingInvoices?.length || 0})</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingInvoices?.map((invoice: any) => (
                <div key={invoice.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">
                      {invoice.invoice_number || invoice.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {invoice.collaboration?.title || '独立 Invoice'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {invoice.currency?.code} {invoice.amount?.toLocaleString()}
                    </p>
                    {invoice.submitted_at && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(invoice.submitted_at).toLocaleDateString('zh-CN')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {(!pendingInvoices || pendingInvoices.length === 0) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
                  <CheckCircle className="w-4 h-4" />
                  全部审批完毕
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
