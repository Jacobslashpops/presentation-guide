import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { InvoiceCreateButton } from './invoice-create-button'

export default async function InfluencerInvoicesPage() {
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
        <h1 className="text-3xl font-bold tracking-tight">我的 Invoice</h1>
        <p className="text-muted-foreground">请先完成红人档案设置</p>
      </div>
    )
  }

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, collaboration:collaborations(title), company:companies(name), currency:currencies(code)')
    .eq('submitted_by', influencer.id)
    .order('created_at', { ascending: false })

  const { data: collaborations } = await supabase
    .from('collaborations')
    .select('id, title, currency_id')
    .eq('influencer_id', influencer.id)

  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')
    .eq('owner_id', influencer.id)

  const { data: currencies } = await supabase
    .from('currencies')
    .select('id, code, name')

  const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    draft: { label: '草稿', variant: 'secondary' },
    submitted: { label: '待审批', variant: 'default' },
    approved: { label: '已审批', variant: 'outline' },
    rejected: { label: '已拒绝', variant: 'destructive' },
  }

  const sourceTypeMap: Record<string, string> = {
    uploaded: '上传',
    generated: '生成',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">我的 Invoice</h1>
          <p className="text-muted-foreground">管理提交的 Invoice</p>
        </div>
        <InvoiceCreateButton
          collaborations={collaborations || []}
          companies={companies || []}
          currencies={currencies || []}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice 列表</CardTitle>
          <CardDescription>共 {invoices?.length || 0} 个 Invoice</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>编号</TableHead>
                <TableHead>合作</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>来源</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>提交时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices?.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    {invoice.invoice_number || invoice.id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {(invoice.collaboration as any)?.title || '独立 Invoice'}
                  </TableCell>
                  <TableCell>
                    {(invoice as any).currency?.code} {invoice.amount?.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{sourceTypeMap[invoice.source_type]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusMap[invoice.status]?.variant || 'default'}>
                      {statusMap[invoice.status]?.label || invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {invoice.submitted_at
                      ? new Date(invoice.submitted_at).toLocaleDateString('zh-CN')
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
              {(!invoices || invoices.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    暂无 Invoice，点击右上角创建
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
