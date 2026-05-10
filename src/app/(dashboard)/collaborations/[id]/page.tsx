import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DeliverableForm } from './deliverable-form'
import { ConfirmDeliverablesButton } from './confirm-button'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export default async function CollaborationDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: collaboration } = await supabase
    .from('collaborations')
    .select('*, project:projects(name, client:clients(name)), influencer:influencers(display_name, email), currency:currencies(code)')
    .eq('id', id)
    .single()

  if (!collaboration) notFound()

  const { data: deliverables } = await supabase
    .from('deliverables')
    .select('*')
    .eq('collaboration_id', id)
    .order('created_at', { ascending: true })

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

  const project = collaboration.project as any
  const influencer = collaboration.influencer as any
  const currency = (collaboration as any).currency

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

      <div className="grid gap-4 md:grid-cols-3">
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
    </div>
  )
}
