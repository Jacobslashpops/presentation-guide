import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { CollaborationForm } from './collaboration-form'
import Link from 'next/link'

export default async function CollaborationsPage() {
  const supabase = await createClient()
  const { data: collaborations } = await supabase
    .from('collaborations')
    .select('*, project:projects(name), influencer:influencers(display_name), currency:currencies(code)')
    .order('created_at', { ascending: false })

  const { data: projects } = await supabase.from('projects').select('id, name')
  const { data: influencers } = await supabase.from('influencers').select('id, display_name')
  const { data: currencies } = await supabase.from('currencies').select('id, code, name')

  const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    draft: { label: '草稿', variant: 'secondary' },
    active: { label: '进行中', variant: 'default' },
    completed: { label: '已完成', variant: 'outline' },
    cancelled: { label: '已取消', variant: 'destructive' },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">合作管理</h1>
          <p className="text-muted-foreground">管理与红人的合作关系</p>
        </div>
        <CollaborationForm projects={projects || []} influencers={influencers || []} currencies={currencies || []} />
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
                <TableHead>项目</TableHead>
                <TableHead>红人</TableHead>
                <TableHead>价格</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>交付确认</TableHead>
                <TableHead className="w-[100px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collaborations?.map((collab) => (
                <TableRow key={collab.id}>
                  <TableCell className="font-medium">
                    <Link href={`/collaborations/${collab.id}`} className="hover:underline">
                      {collab.title}
                    </Link>
                  </TableCell>
                  <TableCell>{(collab.project as any)?.name || '-'}</TableCell>
                  <TableCell>{(collab.influencer as any)?.display_name || '-'}</TableCell>
                  <TableCell>
                    {(collab as any).currency?.code} {collab.total_amount?.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusMap[collab.status]?.variant || 'default'}>
                      {statusMap[collab.status]?.label || collab.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {collab.deliverables_confirmed ? (
                      <Badge variant="default">已确认</Badge>
                    ) : (
                      <Badge variant="secondary">待确认</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <CollaborationForm
                      collaboration={collab}
                      projects={projects || []}
                      influencers={influencers || []}
                      currencies={currencies || []}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {(!collaborations || collaborations.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    暂无合作，点击右上角添加
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
