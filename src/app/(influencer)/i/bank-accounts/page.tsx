import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { BankAccountForm } from './bank-account-form'

export default async function InfluencerBankAccountsPage() {
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
        <h1 className="text-3xl font-bold tracking-tight">银行账户</h1>
        <p className="text-muted-foreground">请先完成红人档案设置</p>
      </div>
    )
  }

  const { data: bankAccounts } = await supabase
    .from('bank_accounts')
    .select('*, currency:currencies(code, name)')
    .eq('influencer_id', influencer.id)
    .order('created_at', { ascending: false })

  const { data: currencies } = await supabase
    .from('currencies')
    .select('id, code, name')
    .eq('is_active', true)
    .order('code')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">银行账户</h1>
          <p className="text-muted-foreground">管理收款银行账户</p>
        </div>
        <BankAccountForm currencies={currencies || []} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>账户列表</CardTitle>
          <CardDescription>共 {bankAccounts?.length || 0} 个银行账户</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>账户名称</TableHead>
                <TableHead>银行</TableHead>
                <TableHead>国家</TableHead>
                <TableHead>币种</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="w-[120px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bankAccounts?.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.account_name}</TableCell>
                  <TableCell>{account.bank_name || '-'}</TableCell>
                  <TableCell>{account.country}</TableCell>
                  <TableCell>{(account as any).currency?.code || '-'}</TableCell>
                  <TableCell>{account.account_type || '-'}</TableCell>
                  <TableCell>
                    {account.is_verified ? (
                      <Badge variant="default">已验证</Badge>
                    ) : (
                      <Badge variant="secondary">待验证</Badge>
                    )}
                    {account.is_default && (
                      <Badge variant="outline" className="ml-1">默认</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <BankAccountForm bankAccount={account} currencies={currencies || []} />
                  </TableCell>
                </TableRow>
              ))}
              {(!bankAccounts || bankAccounts.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    暂无银行账户，点击右上角添加
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
