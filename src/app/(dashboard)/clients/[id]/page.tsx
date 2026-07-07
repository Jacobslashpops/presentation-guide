import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Building2, FileText, Users, Receipt } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ClientDetailTabs } from './client-detail-tabs'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (!client) {
    return <div className="text-center py-12 text-muted-foreground">客户不存在</div>
  }

  const { data: contacts } = await supabase
    .from('client_contacts')
    .select('*')
    .eq('client_id', id)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: false })

  const { data: contracts } = await supabase
    .from('client_contracts')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" render={
          <Link href="/clients"><ArrowLeft className="size-4" /></Link>
        } />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
          {client.description && (
            <p className="text-muted-foreground">{client.description}</p>
          )}
        </div>
      </div>

      <ClientDetailTabs client={client} contacts={contacts || []} contracts={contracts || []} />
    </div>
  )
}
