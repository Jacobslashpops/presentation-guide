import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { InfluencerForm } from './influencer-form'

export default async function InfluencersPage() {
  const supabase = await createClient()
  const { data: influencers } = await supabase
    .from('influencers')
    .select('*')
    .order('created_at', { ascending: false })

  const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    pending: { label: '待激活', variant: 'secondary' },
    active: { label: '活跃', variant: 'default' },
    inactive: { label: '已停用', variant: 'destructive' },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">红人管理</h1>
          <p className="text-muted-foreground">管理合作的红人</p>
        </div>
        <InfluencerForm />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>红人列表</CardTitle>
          <CardDescription>共 {influencers?.length || 0} 个红人</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>时区</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="w-[100px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {influencers?.map((influencer) => (
                <TableRow key={influencer.id}>
                  <TableCell className="font-medium">{influencer.display_name}</TableCell>
                  <TableCell className="text-muted-foreground">{influencer.email || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={statusMap[influencer.status]?.variant || 'default'}>
                      {statusMap[influencer.status]?.label || influencer.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{influencer.timezone}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(influencer.created_at).toLocaleDateString('zh-CN')}
                  </TableCell>
                  <TableCell>
                    <InfluencerForm influencer={influencer} />
                  </TableCell>
                </TableRow>
              ))}
              {(!influencers || influencers.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    暂无红人，点击右上角添加
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
