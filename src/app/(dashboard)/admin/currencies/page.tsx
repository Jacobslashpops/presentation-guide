import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { CurrencyForm } from './currency-form'

export default async function CurrenciesPage() {
  const supabase = await createClient()
  const { data: currencies } = await supabase
    .from('currencies')
    .select('*')
    .order('code', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">币种管理</h1>
          <p className="text-muted-foreground">管理系统支持的币种（Super Admin）</p>
        </div>
        <CurrencyForm />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>币种列表</CardTitle>
          <CardDescription>共 {currencies?.length || 0} 个币种</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>代码</TableHead>
                <TableHead>名称</TableHead>
                <TableHead>符号</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>默认</TableHead>
                <TableHead className="w-[100px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currencies?.map((currency) => (
                <TableRow key={currency.id}>
                  <TableCell className="font-medium font-mono">{currency.code}</TableCell>
                  <TableCell>{currency.name}</TableCell>
                  <TableCell className="text-muted-foreground">{currency.symbol || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={currency.is_active ? 'default' : 'secondary'}>
                      {currency.is_active ? '启用' : '禁用'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {currency.is_default ? (
                      <Badge variant="default">默认</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <CurrencyForm currency={currency} />
                  </TableCell>
                </TableRow>
              ))}
              {(!currencies || currencies.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    暂无币种，点击右上角添加
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
