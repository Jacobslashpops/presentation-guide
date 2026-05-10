import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CompanyForm } from './company-form'

export default async function CompaniesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Get influencer by email
  const { data: influencer } = await supabase
    .from('influencers')
    .select('id')
    .eq('email', user.email)
    .single()

  if (!influencer) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">我的付款方</h1>
        <p className="text-muted-foreground">请先完成红人档案设置</p>
      </div>
    )
  }

  const { data: companies } = await supabase
    .from('companies')
    .select('*')
    .eq('owner_id', influencer.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">我的付款方</h1>
          <p className="text-muted-foreground">管理 Invoice 的付款方信息，可重复使用</p>
        </div>
        <CompanyForm />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>付款方列表</CardTitle>
          <CardDescription>共 {companies?.length || 0} 个付款方</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>国家</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>税号</TableHead>
                <TableHead className="w-[100px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies?.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>{company.country}</TableCell>
                  <TableCell className="text-muted-foreground">{company.email || '-'}</TableCell>
                  <TableCell className="text-muted-foreground">{company.tax_id || '-'}</TableCell>
                  <TableCell>
                    <CompanyForm company={company} />
                  </TableCell>
                </TableRow>
              ))}
              {(!companies || companies.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    暂无付款方，点击右上角添加
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
