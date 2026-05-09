import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ProjectForm } from './project-form'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: projects } = await supabase
    .from('projects')
    .select('*, client:clients(name)')
    .order('created_at', { ascending: false })

  const { data: clients } = await supabase.from('clients').select('id, name')
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
          <h1 className="text-3xl font-bold tracking-tight">项目管理</h1>
          <p className="text-muted-foreground">管理客户的各个项目</p>
        </div>
        <ProjectForm clients={clients || []} currencies={currencies || []} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>项目列表</CardTitle>
          <CardDescription>共 {projects?.length || 0} 个项目</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>项目名称</TableHead>
                <TableHead>客户</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>预算</TableHead>
                <TableHead>时间</TableHead>
                <TableHead className="w-[100px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects?.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>{(project.client as any)?.name || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={statusMap[project.status]?.variant || 'default'}>
                      {statusMap[project.status]?.label || project.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {project.budget
                      ? `${project.budget} ${(project as any).currency?.code || ''}`
                      : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {project.start_date
                      ? `${new Date(project.start_date).toLocaleDateString('zh-CN')}`
                      : '-'}
                    {project.end_date ? ` ~ ${new Date(project.end_date).toLocaleDateString('zh-CN')}` : ''}
                  </TableCell>
                  <TableCell>
                    <ProjectForm
                      project={project}
                      clients={clients || []}
                      currencies={currencies || []}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {(!projects || projects.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    暂无项目，点击右上角添加
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
