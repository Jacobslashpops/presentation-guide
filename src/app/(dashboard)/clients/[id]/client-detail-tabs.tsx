'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Building2, Users, FileText, Receipt, Plus, Trash2, Download } from 'lucide-react'
import {
  updateClientBilling,
  addClientContact,
  updateClientContact,
  deleteClientContact,
  addClientContract,
  deleteClientContract,
} from '@/lib/actions'
import { toast } from 'sonner'

type Client = {
  id: string
  name: string
  description: string | null
  company_name: string | null
  tax_id: string | null
  billing_address: string | null
  bank_name: string | null
  bank_account: string | null
  bank_swift: string | null
  notes: string | null
}

type Contact = {
  id: string
  name: string
  role: string | null
  email: string | null
  phone: string | null
  wechat: string | null
  whatsapp: string | null
  is_primary: boolean
}

type Contract = {
  id: string
  name: string
  file_url: string
  contract_type: string | null
  signed_at: string | null
  expires_at: string | null
}

interface ClientDetailTabsProps {
  client: Client
  contacts: Contact[]
  contracts: Contract[]
}

export function ClientDetailTabs({ client, contacts, contracts }: ClientDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<'billing' | 'contacts' | 'contracts'>('billing')

  const tabs = [
    { id: 'billing' as const, label: '开票信息', icon: Receipt },
    { id: 'contacts' as const, label: '联系人', icon: Users },
    { id: 'contracts' as const, label: '合同', icon: FileText },
  ]

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b pb-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon className="size-4 mr-1" />
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === 'billing' && <BillingSection client={client} />}
      {activeTab === 'contacts' && <ContactsSection clientId={client.id} contacts={contacts} />}
      {activeTab === 'contracts' && <ContractsSection clientId={client.id} contracts={contracts} />}
    </div>
  )
}

function BillingSection({ client }: { client: Client }) {
  async function handleSubmit(formData: FormData) {
    try {
      await updateClientBilling(client.id, formData)
      toast.success('开票信息已保存')
    } catch (error) {
      toast.error((error as Error).message || '保存失败')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="size-5" />
          开票信息
        </CardTitle>
        <CardDescription>填写客户的开票和公司信息，用于生成 Invoice</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>公司名称</Label>
              <Input name="company_name" defaultValue={client.company_name || ''} placeholder="公司全称" />
            </div>
            <div className="space-y-2">
              <Label>税号 / VAT</Label>
              <Input name="tax_id" defaultValue={client.tax_id || ''} placeholder="纳税人识别号" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>开票地址</Label>
            <Textarea name="billing_address" defaultValue={client.billing_address || ''} placeholder="公司注册地址" rows={2} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>开户银行</Label>
              <Input name="bank_name" defaultValue={client.bank_name || ''} placeholder="银行名称" />
            </div>
            <div className="space-y-2">
              <Label>银行账号</Label>
              <Input name="bank_account" defaultValue={client.bank_account || ''} placeholder="账号" />
            </div>
            <div className="space-y-2">
              <Label>SWIFT Code</Label>
              <Input name="bank_swift" defaultValue={client.bank_swift || ''} placeholder="国际汇款用" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>备注</Label>
            <Textarea name="notes" defaultValue={client.notes || ''} placeholder="其他需要注意的信息" rows={2} />
          </div>
          <div className="flex justify-end">
            <Button type="submit">保存</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function ContactsSection({ clientId, contacts }: { clientId: string; contacts: Contact[] }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Contact | null>(null)

  async function handleSubmit(formData: FormData) {
    try {
      if (editing) {
        formData.append('client_id', clientId)
        await updateClientContact(editing.id, formData)
        toast.success('联系人已更新')
      } else {
        await addClientContact(clientId, formData)
        toast.success('联系人已添加')
      }
      setOpen(false)
      setEditing(null)
    } catch (error) {
      toast.error((error as Error).message || '保存失败')
    }
  }

  async function handleDelete(contact: Contact) {
    if (!confirm(`确定删除联系人 ${contact.name}？`)) return
    try {
      await deleteClientContact(contact.id, clientId)
      toast.success('联系人已删除')
    } catch (error) {
      toast.error((error as Error).message || '删除失败')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5" />
              联系人
            </CardTitle>
            <CardDescription>客户的对接人及联系方式</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null) }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="size-4 mr-1" />添加联系人</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? '编辑联系人' : '添加联系人'}</DialogTitle>
                <DialogDescription>填写联系人信息</DialogDescription>
              </DialogHeader>
              <form action={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>姓名 *</Label>
                    <Input name="name" defaultValue={editing?.name || ''} required />
                  </div>
                  <div className="space-y-2">
                    <Label>职位</Label>
                    <Input name="role" defaultValue={editing?.role || ''} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>邮箱</Label>
                    <Input name="email" type="email" defaultValue={editing?.email || ''} />
                  </div>
                  <div className="space-y-2">
                    <Label>电话</Label>
                    <Input name="phone" defaultValue={editing?.phone || ''} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>微信</Label>
                    <Input name="wechat" defaultValue={editing?.wechat || ''} />
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp</Label>
                    <Input name="whatsapp" defaultValue={editing?.whatsapp || ''} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" name="is_primary" id="is_primary" defaultChecked={editing?.is_primary} />
                  <Label htmlFor="is_primary">主要联系人</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>取消</Button>
                  <Button type="submit">保存</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">暂无联系人</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>姓名</TableHead>
                <TableHead>职位</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>电话</TableHead>
                <TableHead>微信</TableHead>
                <TableHead className="w-[80px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    {c.name}
                    {c.is_primary && <span className="ml-1 text-xs text-primary">(主要)</span>}
                  </TableCell>
                  <TableCell>{c.role || '-'}</TableCell>
                  <TableCell>{c.email ? <a href={`mailto:${c.email}`} className="text-primary hover:underline">{c.email}</a> : '-'}</TableCell>
                  <TableCell>{c.phone || '-'}</TableCell>
                  <TableCell>{c.wechat || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(c); setOpen(true) }}>
                        <span className="sr-only">编辑</span>✎
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(c)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function ContractsSection({ clientId, contracts }: { clientId: string; contracts: Contract[] }) {
  const [open, setOpen] = useState(false)

  async function handleSubmit(formData: FormData) {
    try {
      await addClientContract(clientId, formData)
      toast.success('合同已上传')
      setOpen(false)
    } catch (error) {
      toast.error((error as Error).message || '上传失败')
    }
  }

  async function handleDelete(contract: Contract) {
    if (!confirm(`确定删除合同 ${contract.name}？`)) return
    try {
      await deleteClientContract(contract.id, clientId, contract.file_url)
      toast.success('合同已删除')
    } catch (error) {
      toast.error((error as Error).message || '删除失败')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-5" />
              合同文件
            </CardTitle>
            <CardDescription>上传和管理双方签署的合同</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="size-4 mr-1" />上传合同</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>上传合同</DialogTitle>
                <DialogDescription>选择合同文件并填写相关信息</DialogDescription>
              </DialogHeader>
              <form action={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>合同文件 *</Label>
                  <Input name="file" type="file" accept=".pdf,.doc,.docx,.jpg,.png" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>合同名称</Label>
                    <Input name="name" placeholder="如：2025年度合作协议" />
                  </div>
                  <div className="space-y-2">
                    <Label>合同类型</Label>
                    <Input name="contract_type" placeholder="如：框架协议 / 项目合同" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>签署日期</Label>
                    <Input name="signed_at" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label>到期日期</Label>
                    <Input name="expires_at" type="date" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>取消</Button>
                  <Button type="submit">上传</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {contracts.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">暂无合同文件</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>合同名称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>签署日期</TableHead>
                <TableHead>到期日期</TableHead>
                <TableHead className="w-[100px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.contract_type || '-'}</TableCell>
                  <TableCell>{c.signed_at || '-'}</TableCell>
                  <TableCell>{c.expires_at || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" render={
                        <a href={c.file_url} target="_blank" rel="noopener noreferrer">
                          <Download className="size-4" />
                        </a>
                      } />
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(c)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
