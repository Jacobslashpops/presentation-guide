import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default async function InfluencerCollaborationsPage() {
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
        <h1 className="text-3xl font-bold tracking-tight">我的合作</h1>
        <p className="text-muted-foreground">请先完成红人档案设置</p>
      </div>
    )
  }

  const { data: collaborations } = await supabase
    .from('collaborations')
    .select(`
      *,
      project:projects(name, client:clients(name)),
      currency:currencies(code, symbol),
      deliverables:deliverables(id, title, status, due_date),
      payments:payments(id, requested_amount, status, requested_at, paid_at)
    `)
    .eq('influencer_id', influencer.id)
    .order('created_at', { ascending: false })

  const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    draft: { label: '草稿', variant: 'secondary' },
    active: { label: '进行中', variant: 'default' },
    completed: { label: '已完成', variant: 'outline' },
    cancelled: { label: '已取消', variant: 'destructive' },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">我的合作</h1>
        <p className="text-muted-foreground">查看您的所有合作项目</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>合作列表</CardTitle>
          <CardDescription>共 {collaborations?.length || 0} 个合作</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>合作名称</TableHead>
                <TableHead>项目 / 客户</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>交付物</TableHead>
                <TableHead>付款进度</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collaborations?.map((collab) => {
                const deliverables = (collab as any).deliverables || []
                const payments = (collab as any).payments || []
                const completedDeliverables = deliverables.filter((d: any) => d.status === 'completed' || d.status === 'approved').length
                const totalPaid = payments
                  .filter((p: any) => ['pending', 'paid'].includes(p.status))
                  .reduce((sum: number, p: any) => sum + (p.requested_amount || 0), 0)
                const currency = (collab as any).currency
                const project = collab.project as any

                return (
                  <TableRow key={collab.id}>
                    <TableCell className="font-medium">
                      <Link href={`/i/collaborations/${collab.id}`} className="hover:underline">
                        {collab.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {project?.name}
                      {project?.client?.name && (
                        <span className="text-xs"> · {project.client.name}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {currency?.code} {collab.total_amount?.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusMap[collab.status]?.variant || 'default'}>
                        {statusMap[collab.status]?.label || collab.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {completedDeliverables}/{deliverables.length}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {currency?.code} {totalPaid.toLocaleString()} / {collab.total_amount?.toLocaleString()}
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                        <div
                          className="bg-primary rounded-full h-1.5"
                          style={{ width: `${Math.min(100, (totalPaid / (collab.total_amount || 1)) * 100)}%` }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              {(!collaborations || collaborations.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    暂无合作
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
