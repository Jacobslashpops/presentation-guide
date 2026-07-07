import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'
import { Handshake, Wallet, Banknote, Clock, CheckCircle } from 'lucide-react'

export default async function InfluencerDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: influencer } = await supabase
    .from('influencers')
    .select('id, display_name')
    .eq('email', user.email)
    .single()

  if (!influencer) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">我的仪表盘</h1>
          <p className="text-muted-foreground">请先完成红人档案注册</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">您还没有注册红人档案，请联系运营团队为您创建账号</p>
            <Link href="/i/profile" className="text-primary hover:underline text-sm">
              前往注册 →
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fetch influencer data in parallel
  const [
    { data: collaborations },
    { data: payments },
    { data: invoices },
  ] = await Promise.all([
    supabase
      .from('collaborations')
      .select(`
        id, title, total_amount, status,
        project:projects(name, client:clients(name)),
        currency:currencies(code),
        deliverables:deliverables(id, title, status)
      `)
      .eq('influencer_id', influencer.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('payments')
      .select(`
        id, requested_amount, status, paid_at, requested_at,
        collaboration:collaborations(title),
        currency:currencies(code)
      `)
      .in('collaboration_id', (
        await supabase.from('collaborations').select('id').eq('influencer_id', influencer.id)
      ).data?.map(c => c.id) || [])
      .order('created_at', { ascending: false }),
    supabase
      .from('invoices')
      .select('id, amount, status, currency:currencies(code)')
      .eq('submitted_by', influencer.id)
      .order('created_at', { ascending: false }),
  ])

  const activeCollabs = collaborations?.filter(c => c.status === 'active') || []
  const pendingPayments = payments?.filter(p => p.status === 'pending') || []
  const paidPayments = payments?.filter(p => p.status === 'paid') || []
  const totalEarned = paidPayments.reduce((sum, p) => sum + (p.requested_amount || 0), 0)
  const pendingAmount = pendingPayments.reduce((sum, p) => sum + (p.requested_amount || 0), 0)
  const pendingInvoices = invoices?.filter(i => i.status === 'submitted') || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">你好，{influencer.display_name}</h1>
        <p className="text-muted-foreground">管理您的合作、Invoice 和收款</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">进行中的合作</CardTitle>
            <Handshake className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCollabs.length}</div>
            <p className="text-xs text-muted-foreground">
              共 {collaborations?.length || 0} 个合作
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待收款金额</CardTitle>
            <Wallet className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${pendingAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {pendingPayments.length} 笔待处理
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已收款总额</CardTitle>
            <Banknote className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalEarned.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {paidPayments.length} 笔已到账
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待审批 Invoice</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInvoices.length}</div>
            <p className="text-xs text-muted-foreground">等待运营审批</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>进行中的合作</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeCollabs.slice(0, 5).map((collab: any) => {
                const deliverables = collab.deliverables || []
                const completed = deliverables.filter((d: any) => d.status === 'completed' || d.status === 'approved').length
                return (
                  <div key={collab.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <Link href={`/i/collaborations/${collab.id}`} className="text-sm font-medium hover:text-primary transition-colors">
                        {collab.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {collab.project?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {collab.currency?.code} {collab.total_amount?.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        交付 {completed}/{deliverables.length}
                      </p>
                    </div>
                  </div>
                )
              })}
              {activeCollabs.length === 0 && (
                <div className="text-center text-muted-foreground py-4 text-sm">
                  暂无进行中的合作
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>最近付款</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(payments || []).slice(0, 5).map((payment: any) => (
                <div key={payment.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">
                      {payment.collaboration?.title || '-'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {payment.requested_at
                        ? new Date(payment.requested_at).toLocaleDateString('zh-CN')
                        : '-'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {payment.currency?.code} {payment.requested_amount?.toLocaleString()}
                    </p>
                    <Badge
                      variant={payment.status === 'paid' ? 'outline' : payment.status === 'pending' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {payment.status === 'paid' ? '已到账' : payment.status === 'pending' ? '待付款' : payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {(!payments || payments.length === 0) && (
                <div className="text-center text-muted-foreground py-4 text-sm">
                  暂无付款记录
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
