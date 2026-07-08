'use server'

import { revalidatePath } from 'next/cache'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchPostData, fetchSyncData, fetchYouTubeTranscription } from '@/lib/youtube'
import { transcribeWithWhisper } from '@/lib/transcription'
import { analyzeVideoSentiment, analyzeCommentSentiment } from '@/lib/sentiment'

// ===== Notification Helper =====
async function sendNotification(data: {
  user_id?: string
  influencer_id?: string
  type: string
  title: string
  message?: string
  link?: string
}) {
  const supabase = await createServerClient()
  // Use service role to bypass RLS for system notifications
  await supabase.from('notifications').insert({
    user_id: data.user_id || null,
    influencer_id: data.influencer_id || null,
    type: data.type,
    title: data.title,
    message: data.message || null,
    link: data.link || null,
  })
}

// ===== Clients =====
export async function createClient(formData: FormData) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const name = formData.get('name') as string
  const description = formData.get('description') as string

  const { error } = await supabase
    .from('clients')
    .insert({ name, description, created_by: user?.id })

  if (error) throw error
  revalidatePath('/clients')
}

export async function updateClient(id: string, formData: FormData) {
  const supabase = await createServerClient()

  const name = formData.get('name') as string
  const description = formData.get('description') as string

  const { error } = await supabase
    .from('clients')
    .update({ name, description })
    .eq('id', id)

  if (error) throw error
  revalidatePath('/clients')
}

export async function deleteClient(id: string) {
  const supabase = await createServerClient()
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) {
    if (error.code === '23503') {
      throw new Error('该客户下还有关联项目，无法删除')
    }
    throw error
  }
  revalidatePath('/clients')
}

// ===== Client Details (Billing, Contacts, Contracts) =====

export async function updateClientBilling(clientId: string, formData: FormData) {
  const supabase = await createServerClient()
  const { error } = await supabase.from('clients').update({
    company_name: formData.get('company_name') as string || null,
    tax_id: formData.get('tax_id') as string || null,
    billing_address: formData.get('billing_address') as string || null,
    bank_name: formData.get('bank_name') as string || null,
    bank_account: formData.get('bank_account') as string || null,
    bank_swift: formData.get('bank_swift') as string || null,
    notes: formData.get('notes') as string || null,
  }).eq('id', clientId)
  if (error) throw error
  revalidatePath(`/clients/${clientId}`)
}

export async function addClientContact(clientId: string, formData: FormData) {
  const supabase = await createServerClient()
  const { error } = await supabase.from('client_contacts').insert({
    client_id: clientId,
    name: formData.get('name') as string,
    role: formData.get('role') as string || null,
    email: formData.get('email') as string || null,
    phone: formData.get('phone') as string || null,
    wechat: formData.get('wechat') as string || null,
    whatsapp: formData.get('whatsapp') as string || null,
    is_primary: formData.get('is_primary') === 'on',
  })
  if (error) throw error
  revalidatePath(`/clients/${clientId}`)
}

export async function updateClientContact(contactId: string, formData: FormData) {
  const supabase = await createServerClient()
  const clientId = formData.get('client_id') as string
  const { error } = await supabase.from('client_contacts').update({
    name: formData.get('name') as string,
    role: formData.get('role') as string || null,
    email: formData.get('email') as string || null,
    phone: formData.get('phone') as string || null,
    wechat: formData.get('wechat') as string || null,
    whatsapp: formData.get('whatsapp') as string || null,
    is_primary: formData.get('is_primary') === 'on',
  }).eq('id', contactId)
  if (error) throw error
  revalidatePath(`/clients/${clientId}`)
}

export async function deleteClientContact(contactId: string, clientId: string) {
  const supabase = await createServerClient()
  const { error } = await supabase.from('client_contacts').delete().eq('id', contactId)
  if (error) throw error
  revalidatePath(`/clients/${clientId}`)
}

export async function addClientContract(clientId: string, formData: FormData) {
  const supabase = await createServerClient()
  const file = formData.get('file') as File
  if (!file || file.size === 0) throw new Error('请选择文件')

  const ext = file.name.split('.').pop()
  const path = `${clientId}/${Date.now()}_${file.name}`
  const { error: uploadError } = await supabase.storage.from('contracts').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage.from('contracts').getPublicUrl(path)

  const { error } = await supabase.from('client_contracts').insert({
    client_id: clientId,
    name: formData.get('name') as string || file.name,
    file_url: publicUrl,
    contract_type: formData.get('contract_type') as string || null,
    signed_at: formData.get('signed_at') as string || null,
    expires_at: formData.get('expires_at') as string || null,
  })
  if (error) throw error
  revalidatePath(`/clients/${clientId}`)
}

export async function deleteClientContract(contractId: string, clientId: string, fileUrl: string) {
  const supabase = await createServerClient()
  // Delete from storage
  try {
    const path = fileUrl.split('/contracts/')[1]
    if (path) await supabase.storage.from('contracts').remove([path])
  } catch {}
  // Delete from DB
  const { error } = await supabase.from('client_contracts').delete().eq('id', contractId)
  if (error) throw error
  revalidatePath(`/clients/${clientId}`)
}

// ===== Projects =====
export async function createProject(formData: FormData) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from('projects').insert({
    client_id: formData.get('client_id') as string,
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    status: formData.get('status') as string,
    start_date: formData.get('start_date') as string || null,
    end_date: formData.get('end_date') as string || null,
    budget: formData.get('budget') ? parseFloat(formData.get('budget') as string) : null,
    budget_currency_id: formData.get('budget_currency_id') as string || null,
    created_by: user?.id,
  })

  if (error) throw error
  revalidatePath('/projects')
}

export async function updateProject(id: string, formData: FormData) {
  const supabase = await createServerClient()

  const { error } = await supabase.from('projects').update({
    client_id: formData.get('client_id') as string,
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    status: formData.get('status') as string,
    start_date: formData.get('start_date') as string || null,
    end_date: formData.get('end_date') as string || null,
    budget: formData.get('budget') ? parseFloat(formData.get('budget') as string) : null,
    budget_currency_id: formData.get('budget_currency_id') as string || null,
  }).eq('id', id)

  if (error) throw error
  revalidatePath('/projects')
}

export async function deleteProject(id: string) {
  const supabase = await createServerClient()
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) {
    if (error.code === '23503') {
      throw new Error('该项目下还有关联合作，无法删除')
    }
    throw error
  }
  revalidatePath('/projects')
}

// ===== Project Members =====
export async function addProjectMember(projectId: string, userId: string, canRequestPayment: boolean) {
  const supabase = await createServerClient()
  const { error } = await supabase.from('project_members').insert({
    project_id: projectId,
    user_id: userId,
    can_request_payment: canRequestPayment,
  })
  if (error) throw error
  revalidatePath(`/projects/${projectId}`)
}

export async function removeProjectMember(id: string, projectId: string) {
  const supabase = await createServerClient()
  const { error } = await supabase.from('project_members').delete().eq('id', id)
  if (error) throw error
  revalidatePath(`/projects/${projectId}`)
}

// ===== Influencers =====
export async function createInfluencer(formData: FormData) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from('influencers').insert({
    email: formData.get('email') as string || null,
    display_name: formData.get('display_name') as string,
    phone: formData.get('phone') as string || null,
    bio: formData.get('bio') as string || null,
    timezone: formData.get('timezone') as string || 'UTC',
    status: 'pending',
    created_by: user?.id,
  })

  if (error) throw error
  revalidatePath('/influencers')
}

export async function updateInfluencer(id: string, formData: FormData) {
  const supabase = await createServerClient()

  const { error } = await supabase.from('influencers').update({
    email: formData.get('email') as string || null,
    display_name: formData.get('display_name') as string,
    phone: formData.get('phone') as string || null,
    bio: formData.get('bio') as string || null,
    timezone: formData.get('timezone') as string || 'UTC',
    status: formData.get('status') as string,
  }).eq('id', id)

  if (error) throw error
  revalidatePath('/influencers')
}

export async function deleteInfluencer(id: string) {
  const supabase = await createServerClient()
  const { error } = await supabase.from('influencers').delete().eq('id', id)
  if (error) {
    if (error.code === '23503') {
      throw new Error('该红人还有关联合作，无法删除')
    }
    throw error
  }
  revalidatePath('/influencers')
}

// ===== Currencies =====
export async function createCurrency(formData: FormData) {
  const supabase = await createServerClient()

  const { error } = await supabase.from('currencies').insert({
    code: formData.get('code') as string,
    name: formData.get('name') as string,
    symbol: formData.get('symbol') as string || null,
    is_active: formData.get('is_active') === 'true',
    supported_countries: (formData.get('supported_countries') as string || '').split(',').map(s => s.trim()).filter(Boolean),
  })

  if (error) throw error
  revalidatePath('/admin/currencies')
}

export async function updateCurrency(id: string, formData: FormData) {
  const supabase = await createServerClient()

  const { error } = await supabase.from('currencies').update({
    code: formData.get('code') as string,
    name: formData.get('name') as string,
    symbol: formData.get('symbol') as string || null,
    is_active: formData.get('is_active') === 'true',
    is_default: formData.get('is_default') === 'true',
    supported_countries: (formData.get('supported_countries') as string || '').split(',').map(s => s.trim()).filter(Boolean),
  }).eq('id', id)

  if (error) throw error
  revalidatePath('/admin/currencies')
}

export async function deleteCurrency(id: string) {
  const supabase = await createServerClient()
  const { error } = await supabase.from('currencies').delete().eq('id', id)
  if (error) {
    if (error.code === '23503') {
      throw new Error('该币种正被项目或合作使用，无法删除')
    }
    throw error
  }
  revalidatePath('/admin/currencies')
}

// ===== Collaborations =====
export async function createCollaboration(formData: FormData) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from('collaborations').insert({
    project_id: formData.get('project_id') as string,
    influencer_id: formData.get('influencer_id') as string,
    title: formData.get('title') as string,
    description: formData.get('description') as string || null,
    total_amount: parseFloat(formData.get('total_amount') as string),
    currency_id: formData.get('currency_id') as string,
    status: formData.get('status') as string || 'active',
    created_by: user?.id,
  })

  if (error) throw error
  revalidatePath('/collaborations')
  revalidatePath(`/projects/${formData.get('project_id')}`)
}

export async function updateCollaboration(id: string, formData: FormData) {
  const supabase = await createServerClient()

  const { error } = await supabase.from('collaborations').update({
    project_id: formData.get('project_id') as string,
    influencer_id: formData.get('influencer_id') as string,
    title: formData.get('title') as string,
    description: formData.get('description') as string || null,
    total_amount: parseFloat(formData.get('total_amount') as string),
    currency_id: formData.get('currency_id') as string,
    status: formData.get('status') as string,
    deliverables_confirmed: formData.get('deliverables_confirmed') === 'true',
  }).eq('id', id)

  if (error) throw error
  revalidatePath('/collaborations')
  revalidatePath(`/projects/${formData.get('project_id')}`)
}

export async function deleteCollaboration(id: string) {
  const supabase = await createServerClient()
  const { error } = await supabase.from('collaborations').delete().eq('id', id)
  if (error) {
    if (error.code === '23503') {
      throw new Error('该合作下还有关联交付物或付款记录，无法删除')
    }
    throw error
  }
  revalidatePath('/collaborations')
}

// ===== Deliverables =====
export async function createDeliverable(formData: FormData) {
  const supabase = await createServerClient()

  const { error } = await supabase.from('deliverables').insert({
    collaboration_id: formData.get('collaboration_id') as string,
    title: formData.get('title') as string,
    description: formData.get('description') as string || null,
    due_date: formData.get('due_date') as string || null,
  })

  if (error) throw error
  revalidatePath(`/collaborations/${formData.get('collaboration_id')}`)
}

export async function updateDeliverable(id: string, formData: FormData) {
  const supabase = await createServerClient()

  const { error } = await supabase.from('deliverables').update({
    title: formData.get('title') as string,
    description: formData.get('description') as string || null,
    due_date: formData.get('due_date') as string || null,
    status: formData.get('status') as string,
  }).eq('id', id)

  if (error) throw error
  revalidatePath(`/collaborations/${formData.get('collaboration_id')}`)
}

export async function deleteDeliverable(id: string, collaborationId: string) {
  const supabase = await createServerClient()
  const { error } = await supabase.from('deliverables').delete().eq('id', id)
  if (error) throw error
  revalidatePath(`/collaborations/${collaborationId}`)
}

export async function confirmDeliverables(collaborationId: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from('collaborations').update({
    deliverables_confirmed: true,
    deliverables_confirmed_by: user?.id,
    deliverables_confirmed_at: new Date().toISOString(),
  }).eq('id', collaborationId)

  if (error) throw error
  revalidatePath('/collaborations')
  revalidatePath(`/collaborations/${collaborationId}`)
}

// ===== Companies =====
export async function createCompany(formData: FormData) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get influencer ID from current user email
  const { data: influencer } = await supabase
    .from('influencers')
    .select('id')
    .eq('email', user?.email)
    .single()

  if (!influencer) throw new Error('Influencer profile not found')

  const { error } = await supabase.from('companies').insert({
    owner_id: influencer.id,
    name: formData.get('name') as string,
    email: formData.get('email') as string || null,
    address: formData.get('address') as string || null,
    tax_id: formData.get('tax_id') as string || null,
    country: formData.get('country') as string,
  })

  if (error) throw error
  revalidatePath('/i/companies')
}

export async function updateCompany(id: string, formData: FormData) {
  const supabase = await createServerClient()

  const { error } = await supabase.from('companies').update({
    name: formData.get('name') as string,
    email: formData.get('email') as string || null,
    address: formData.get('address') as string || null,
    tax_id: formData.get('tax_id') as string || null,
    country: formData.get('country') as string,
  }).eq('id', id)

  if (error) throw error
  revalidatePath('/i/companies')
}

export async function deleteCompany(id: string) {
  const supabase = await createServerClient()
  const { error } = await supabase.from('companies').delete().eq('id', id)
  if (error) {
    if (error.code === '23503') {
      throw new Error('该付款方正被 Invoice 使用，无法删除')
    }
    throw error
  }
  revalidatePath('/i/companies')
}

// ===== Invoices =====
export async function createInvoice(formData: FormData) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get influencer ID from current user email
  const { data: influencer } = await supabase
    .from('influencers')
    .select('id')
    .eq('email', user?.email)
    .single()

  const collaborationId = formData.get('collaboration_id') as string || null
  const sourceType = formData.get('source_type') as 'uploaded' | 'generated'

  const { data: invoice, error } = await supabase.from('invoices').insert({
    collaboration_id: collaborationId,
    company_id: formData.get('company_id') as string || null,
    amount: parseFloat(formData.get('amount') as string),
    currency_id: formData.get('currency_id') as string,
    source_type: sourceType,
    invoice_number: formData.get('invoice_number') as string || null,
    invoice_date: formData.get('invoice_date') as string || null,
    due_date: formData.get('due_date') as string || null,
    notes: formData.get('notes') as string || null,
    submitted_by: influencer?.id || null,
    status: 'submitted',
  }).select().single()

  if (error) throw error

  // Insert invoice items if generated
  if (sourceType === 'generated') {
    const items = JSON.parse(formData.get('items') as string || '[]')
    if (items.length > 0) {
      const { error: itemsError } = await supabase.from('invoice_items').insert(
        items.map((item: any) => ({
          invoice_id: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.amount,
        }))
      )
      if (itemsError) throw itemsError
    }
  }

  // Notify all admin users about new invoice
  const { data: admins } = await supabase
    .from('users')
    .select('id')
    .in('role', ['admin', 'super_admin', 'finance'])

  if (admins) {
    for (const admin of admins) {
      await sendNotification({
        user_id: admin.id,
        type: 'invoice_submitted',
        title: '新 Invoice 待审批',
        message: `收到新的 Invoice，金额: ${invoice.amount}`,
        link: '/invoices',
      })
    }
  }

  revalidatePath('/i/invoices')
  revalidatePath('/invoices')
}

export async function approveInvoice(id: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: invoice } = await supabase
    .from('invoices')
    .select('submitted_by, collaboration_id, amount')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('invoices').update({
    status: 'approved',
    approved_by: user?.id,
    approved_at: new Date().toISOString(),
  }).eq('id', id)

  if (error) throw error

  // Notify influencer
  if (invoice?.submitted_by) {
    await sendNotification({
      influencer_id: invoice.submitted_by,
      type: 'invoice_approved',
      title: 'Invoice 已审批',
      message: `您的 Invoice 已通过审批，金额: ${invoice.amount}`,
      link: '/i/invoices',
    })
  }

  revalidatePath('/invoices')
  revalidatePath(`/invoices/${id}`)
}

export async function rejectInvoice(id: string) {
  const supabase = await createServerClient()

  const { error } = await supabase.from('invoices').update({
    status: 'rejected',
  }).eq('id', id)

  if (error) throw error
  revalidatePath('/invoices')
  revalidatePath(`/invoices/${id}`)
}

// ===== Payments =====
export async function createPayment(formData: FormData) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const collaborationId = formData.get('collaboration_id') as string
  const invoiceId = formData.get('invoice_id') as string
  const requestedAmount = parseFloat(formData.get('requested_amount') as string)

  // Check if user is a project member with payment request permission
  const { data: collaboration } = await supabase
    .from('collaborations')
    .select('project_id')
    .eq('id', collaborationId)
    .single()

  if (!collaboration) throw new Error('Collaboration not found')

  const { data: member } = await supabase
    .from('project_members')
    .select('id')
    .eq('project_id', collaboration.project_id)
    .eq('user_id', user?.id)
    .eq('can_request_payment', true)
    .single()

  if (!member) throw new Error('You do not have permission to request payment for this project')

  // Check deliverables confirmed
  const { data: collab } = await supabase
    .from('collaborations')
    .select('deliverables_confirmed')
    .eq('id', collaborationId)
    .single()

  if (!collab?.deliverables_confirmed) {
    throw new Error('Deliverables must be confirmed before requesting payment')
  }

  // Check invoice is approved
  const { data: invoice } = await supabase
    .from('invoices')
    .select('status')
    .eq('id', invoiceId)
    .single()

  if (invoice?.status !== 'approved') {
    throw new Error('Invoice must be approved before requesting payment')
  }

  // Check if payment already exists for this invoice
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('id')
    .eq('invoice_id', invoiceId)
    .single()

  if (existingPayment) {
    throw new Error('A payment has already been requested for this invoice')
  }

  const { error } = await supabase.from('payments').insert({
    collaboration_id: collaborationId,
    invoice_id: invoiceId,
    requested_amount: requestedAmount,
    requested_currency_id: formData.get('requested_currency_id') as string,
    requested_by: user?.id,
    status: 'pending',
  })

  if (error) throw error
  revalidatePath('/payments')
  revalidatePath('/payments/pending')
  revalidatePath(`/collaborations/${collaborationId}`)
}

export async function markPaymentPaid(formData: FormData) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const id = formData.get('id') as string
  if (!id) throw new Error('Payment ID is required')

  const { data: payment } = await supabase
    .from('payments')
    .select('collaboration_id, requested_amount, collaboration:collaborations(influencer_id)')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('payments').update({
    status: 'paid',
    paid_by: user?.id,
    paid_at: new Date().toISOString(),
    actual_amount: formData.get('actual_amount') ? parseFloat(formData.get('actual_amount') as string) : null,
    actual_currency_id: formData.get('actual_currency_id') as string || null,
    exchange_rate: formData.get('exchange_rate') ? parseFloat(formData.get('exchange_rate') as string) : null,
    payment_reference: formData.get('payment_reference') as string || null,
    receipt_url: formData.get('receipt_url') as string || null,
    notes: formData.get('notes') as string || null,
  }).eq('id', id)

  if (error) throw error

  // Notify influencer about payment
  const influencerId = (payment?.collaboration as any)?.influencer_id
  if (influencerId) {
    await sendNotification({
      influencer_id: influencerId,
      type: 'payment_paid',
      title: '付款已到账',
      message: `您的付款已确认，金额: ${payment?.requested_amount}`,
      link: '/i/dashboard',
    })
  }

  revalidatePath('/payments')
  revalidatePath('/payments/pending')
  revalidatePath(`/payments/${id}`)
}

export async function rejectPayment(id: string) {
  const supabase = await createServerClient()

  const { error } = await supabase.from('payments').update({
    status: 'rejected',
  }).eq('id', id)

  if (error) throw error
  revalidatePath('/payments')
  revalidatePath('/payments/pending')
  revalidatePath(`/payments/${id}`)
}

export async function cancelPayment(id: string) {
  const supabase = await createServerClient()

  const { error } = await supabase.from('payments').update({
    status: 'cancelled',
  }).eq('id', id)

  if (error) throw error
  revalidatePath('/payments')
  revalidatePath('/payments/pending')
  revalidatePath(`/payments/${id}`)
}

// ===== YouTube Import =====
export async function createInfluencerFromYouTube(raw: {
  display_name: string
  avatar_url: string | null
  bio: string | null
  email: string | null
  followers_count: number | null
  platform: string[]
  channel_urls: Record<string, string>
  location: string | null
  videos: Array<{
    video_id: string
    title: string
    thumbnail_url: string | null
    duration: string | null
    view_count: string | null
    published_at: string | null
    video_url: string
  }>
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // --- Dedup: find existing influencer before inserting ---
  const youtubeUrl = raw.channel_urls?.YouTube
  let existingId: string | null = null

  if (youtubeUrl) {
    // Extract handle from URL (e.g. @cycling366 -> cycling366)
    const handleMatch = youtubeUrl.match(/@([\w.-]+)/)
    const handle = handleMatch?.[1]

    if (handle) {
      // Priority 1: Match by channel_handle (case-insensitive)
      const { data: handleMatch1 } = await supabase
        .from('influencers')
        .select('id')
        .ilike('channel_handle', handle)
        .limit(1)
        .maybeSingle()
      if (handleMatch1) existingId = handleMatch1.id
    }

    // Priority 2: Match by channel_urls JSONB (ilike on the last segment)
    if (!existingId && youtubeUrl) {
      const lastSegment = youtubeUrl.replace(/\/$/, '').split('/').pop()
      if (lastSegment) {
        const { data: urlMatch } = await supabase
          .from('influencers')
          .select('id')
          .or(`channel_urls->>YouTube.ilike.%${lastSegment}%`)
          .limit(1)
          .maybeSingle()
        if (urlMatch) existingId = urlMatch.id
      }
    }

    // Priority 3: Match by email
    if (!existingId && raw.email) {
      const { data: emailMatch } = await supabase
        .from('influencers')
        .select('id')
        .eq('email', raw.email)
        .limit(1)
        .maybeSingle()
      if (emailMatch) existingId = emailMatch.id
    }
  }

  // --- Update existing influencer (fill null fields only) ---
  if (existingId) {
    const { data: existing } = await supabase
      .from('influencers')
      .select('*')
      .eq('id', existingId)
      .single()

    if (existing) {
      const updates: Record<string, unknown> = {}
      if (!existing.avatar_url && raw.avatar_url) updates.avatar_url = raw.avatar_url
      if (!existing.bio && raw.bio) updates.bio = raw.bio
      if (!existing.followers_count && raw.followers_count) updates.followers_count = raw.followers_count
      if (!existing.email && raw.email) updates.email = raw.email
      if (!existing.location && raw.location) updates.location = raw.location

      // Merge channel_urls
      const existingUrls = (existing.channel_urls as Record<string, string>) || {}
      const mergedUrls = { ...raw.channel_urls, ...existingUrls }
      if (JSON.stringify(mergedUrls) !== JSON.stringify(existingUrls)) {
        updates.channel_urls = mergedUrls
      }

      // Merge platform array
      const existingPlatforms: string[] = existing.platform || []
      const newPlatforms = [...new Set([...existingPlatforms, ...(raw.platform || [])])]
      if (newPlatforms.length !== existingPlatforms.length) {
        updates.platform = newPlatforms
      }

      if (Object.keys(updates).length > 0) {
        const { error: updateErr } = await supabase.from('influencers').update(updates).eq('id', existingId)
        if (updateErr) throw updateErr
      }
    }

    // Upsert videos
    if (raw.videos.length > 0) {
      const videoRows = raw.videos.map((v) => ({
        influencer_id: existingId,
        video_id: v.video_id,
        title: v.title,
        thumbnail_url: v.thumbnail_url,
        duration: v.duration,
        view_count: v.view_count,
        published_at: v.published_at,
        video_url: v.video_url,
      }))
      await supabase.from('videos').upsert(videoRows, { onConflict: 'influencer_id,video_id' })
    }

    revalidatePath('/influencers')
    revalidatePath(`/influencers/${existingId}`)
    return { id: existingId }
  }

  // --- Create new influencer (no existing match found) ---
  const insertData: Record<string, unknown> = {
    display_name: raw.display_name,
    avatar_url: raw.avatar_url,
    bio: raw.bio,
    followers_count: raw.followers_count,
    platform: raw.platform,
    channel_urls: raw.channel_urls,
    location: raw.location,
    timezone: 'UTC',
    status: 'active',
    created_by: user?.id,
  }

  if (raw.email) {
    insertData.email = raw.email
  }

  // Extract channel_handle from YouTube URL
  const handleMatch = youtubeUrl?.match(/@([\w.-]+)/)
  if (handleMatch) {
    insertData.channel_handle = handleMatch[1]
  }

  const { data: influencer, error } = await supabase
    .from('influencers')
    .insert(insertData)
    .select('id')
    .single()

  if (error) throw error

  if (raw.videos.length > 0) {
    const videoRows = raw.videos.map((v) => ({
      influencer_id: influencer.id,
      video_id: v.video_id,
      title: v.title,
      thumbnail_url: v.thumbnail_url,
      duration: v.duration,
      view_count: v.view_count,
      published_at: v.published_at,
      video_url: v.video_url,
    }))

    const { error: videoError } = await supabase
      .from('videos')
      .upsert(videoRows, { onConflict: 'influencer_id,video_id' })

    if (videoError) throw videoError
  }

  revalidatePath('/influencers')
  revalidatePath(`/influencers/${influencer.id}`)
  return influencer
}

export async function supplementInfluencerFromYouTube(id: string, raw: {
  social_links?: Record<string, string>
  email?: string | null
  platform?: string[]
  videos?: Array<{
    video_id: string
    title: string
    thumbnail_url: string | null
    duration: string | null
    view_count: string | null
    published_at: string | null
    video_url: string
  }>
}) {
  const supabase = await createServerClient()

  const updateData: Record<string, unknown> = {}
  if (raw.social_links) updateData.channel_urls = raw.social_links
  if (raw.email) updateData.email = raw.email
  if (raw.platform) updateData.platform = raw.platform

  if (Object.keys(updateData).length > 0) {
    const { error } = await supabase.from('influencers').update(updateData).eq('id', id)
    if (error) throw error
  }

  if (raw.videos && raw.videos.length > 0) {
    const videoRows = raw.videos.map((v) => ({
      influencer_id: id,
      video_id: v.video_id,
      title: v.title,
      thumbnail_url: v.thumbnail_url,
      duration: v.duration,
      view_count: v.view_count,
      published_at: v.published_at,
      video_url: v.video_url,
    }))
    const { error: videoError } = await supabase
      .from('videos')
      .upsert(videoRows, { onConflict: 'influencer_id,video_id' })
    if (videoError) throw videoError
  }

  revalidatePath('/influencers')
  revalidatePath(`/influencers/${id}`)
}

// ===== Influencer Self-Service: Mark Deliverable Complete =====
export async function markDeliverableComplete(deliverableId: string, collaborationId: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Verify the user is the influencer for this collaboration
  const { data: influencer } = await supabase
    .from('influencers')
    .select('id')
    .eq('email', user?.email)
    .single()

  if (!influencer) throw new Error('Influencer profile not found')

  const { data: collaboration } = await supabase
    .from('collaborations')
    .select('influencer_id')
    .eq('id', collaborationId)
    .single()

  if (!collaboration || collaboration.influencer_id !== influencer.id) {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase.from('deliverables').update({
    status: 'completed',
    completed_at: new Date().toISOString(),
  }).eq('id', deliverableId).eq('collaboration_id', collaborationId)

  if (error) throw error
  revalidatePath(`/i/collaborations/${collaborationId}`)
  revalidatePath('/i/collaborations')
  revalidatePath(`/collaborations/${collaborationId}`)
}

// ===== Bank Accounts =====
export async function createBankAccount(formData: FormData) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: influencer } = await supabase
    .from('influencers')
    .select('id')
    .eq('email', user?.email)
    .single()

  if (!influencer) throw new Error('Influencer profile not found')

  const { error } = await supabase.from('bank_accounts').insert({
    influencer_id: influencer.id,
    account_name: formData.get('account_name') as string,
    bank_name: formData.get('bank_name') as string || null,
    country: formData.get('country') as string,
    currency_id: formData.get('currency_id') as string,
    account_type: formData.get('account_type') as string || null,
    swift_bic: formData.get('swift_bic') as string || null,
    is_default: formData.get('is_default') === 'true',
  })

  if (error) throw error
  revalidatePath('/i/bank-accounts')
}

export async function updateBankAccount(id: string, formData: FormData) {
  const supabase = await createServerClient()

  const { error } = await supabase.from('bank_accounts').update({
    account_name: formData.get('account_name') as string,
    bank_name: formData.get('bank_name') as string || null,
    country: formData.get('country') as string,
    currency_id: formData.get('currency_id') as string,
    account_type: formData.get('account_type') as string || null,
    swift_bic: formData.get('swift_bic') as string || null,
    is_default: formData.get('is_default') === 'true',
  }).eq('id', id)

  if (error) throw error
  revalidatePath('/i/bank-accounts')
}

export async function deleteBankAccount(id: string) {
  const supabase = await createServerClient()
  const { error } = await supabase.from('bank_accounts').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/i/bank-accounts')
}

// ===== Notifications =====
export async function markNotificationRead(id: string) {
  const supabase = await createServerClient()
  const { error } = await supabase.from('notifications').update({
    is_read: true,
    read_at: new Date().toISOString(),
  }).eq('id', id)
  if (error) throw error
  revalidatePath('/dashboard')
  revalidatePath('/i/dashboard')
}

export async function markAllNotificationsRead() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from('notifications').update({
    is_read: true,
    read_at: new Date().toISOString(),
  }).eq('user_id', user?.id).eq('is_read', false)

  if (error) throw error
  revalidatePath('/dashboard')
  revalidatePath('/i/dashboard')
}

// ===== File Upload =====
export async function uploadInvoiceFile(formData: FormData) {
  const supabase = await createServerClient()
  const file = formData.get('file') as File
  const invoiceId = formData.get('invoice_id') as string

  if (!file || !invoiceId) throw new Error('File and invoice ID are required')

  const fileExt = file.name.split('.').pop()
  const fileName = `${invoiceId}/${Date.now()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('invoices')
    .upload(fileName, file)

  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage
    .from('invoices')
    .getPublicUrl(fileName)

  const { error } = await supabase.from('invoices').update({
    file_url: publicUrl,
    source_type: 'uploaded',
  }).eq('id', invoiceId)

  if (error) throw error
  revalidatePath('/invoices')
  revalidatePath('/i/invoices')
}

export async function uploadPaymentReceipt(formData: FormData) {
  const supabase = await createServerClient()
  const file = formData.get('file') as File
  const paymentId = formData.get('payment_id') as string

  if (!file || !paymentId) throw new Error('File and payment ID are required')

  const fileExt = file.name.split('.').pop()
  const fileName = `${paymentId}/${Date.now()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('receipts')
    .upload(fileName, file)

  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage
    .from('receipts')
    .getPublicUrl(fileName)

  const { error } = await supabase.from('payments').update({
    receipt_url: publicUrl,
  }).eq('id', paymentId)

  if (error) throw error
  revalidatePath('/payments')
  revalidatePath(`/payments/${paymentId}`)
}

// ===== Influencer Registration =====
export async function registerInfluencer(formData: FormData) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Must be logged in')

  // Check if influencer already exists
  const { data: existing } = await supabase
    .from('influencers')
    .select('id')
    .eq('email', user.email)
    .single()

  if (existing) throw new Error('You have already registered')

  const { error } = await supabase.from('influencers').insert({
    email: user.email,
    display_name: formData.get('display_name') as string,
    phone: formData.get('phone') as string || null,
    timezone: formData.get('timezone') as string || 'UTC',
    bio: formData.get('bio') as string || null,
    status: 'pending',
  })

  if (error) throw error
  revalidatePath('/i/dashboard')
  revalidatePath('/i/profile')
}

export async function updateInfluencerProfile(id: string, formData: FormData) {
  const supabase = await createServerClient()

  const { error } = await supabase.from('influencers').update({
    display_name: formData.get('display_name') as string,
    phone: formData.get('phone') as string || null,
    timezone: formData.get('timezone') as string || 'UTC',
    bio: formData.get('bio') as string || null,
  }).eq('id', id)

  if (error) throw error
  revalidatePath('/i/profile')
  revalidatePath('/i/dashboard')
  revalidatePath('/influencers')
}

// ===== Social Link Classification Helper =====
function classifySocialLinksFromPayload(socialLinks: Record<string, string>): Record<string, string | null> {
  const result: Record<string, string | null> = {
    website: null, twitter: null, facebook: null,
    linkedin: null, instagram: null, tiktok: null, twitch: null,
  }
  for (const [, url] of Object.entries(socialLinks)) {
    const u = url.toLowerCase()
    if (u.includes('twitter.com') || u.includes('x.com')) result.twitter = url
    else if (u.includes('facebook.com') || u.includes('fb.com')) result.facebook = url
    else if (u.includes('linkedin.com')) result.linkedin = url
    else if (u.includes('instagram.com')) result.instagram = url
    else if (u.includes('tiktok.com')) result.tiktok = url
    else if (u.includes('twitch.tv') || u.includes('twitch.com')) result.twitch = url
    else if (!result.website && !u.includes('youtube.com')) result.website = url
  }
  return result
}

// ===== Extension Silent Collection: Upsert Influencer =====
export async function upsertInfluencerFromExtension(payload: {
  platform: string
  channel_url: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  followers_count: number | null
  email: string | null
  location: string | null
  social_links: Record<string, string>
  videos: Array<{
    video_id: string
    title: string
    thumbnail_url: string | null
    duration: string | null
    view_count: string | null
    published_at: string | null
    video_url: string
  }>
}, supabaseClient?: SupabaseClient): Promise<{ action: 'created' | 'updated'; influencer_id: string }> {
  const supabase = supabaseClient || await createServerClient()
  const now = new Date().toISOString()

  // --- Step 1: Try to find existing influencer by email first, then channel_url ---
  let existingId: string | null = null

  // Priority 1: Match by email (strongest signal)
  if (payload.email) {
    const { data: emailMatch } = await supabase
      .from('influencers')
      .select('id')
      .eq('email', payload.email)
      .limit(1)
      .single()

    if (emailMatch) existingId = emailMatch.id
  }

  // Priority 2: Match by channel_url (JSONB contains the URL)
  if (!existingId && payload.channel_url) {
    const normalized = payload.channel_url.replace(/\/$/, '')
    let handlePattern = ''
    if (payload.platform === 'YouTube') {
      const m = normalized.match(/youtube\.com\/@([\w.-]+)/)
      if (m) handlePattern = m[1]
    } else if (payload.platform === 'Instagram') {
      const m = normalized.match(/instagram\.com\/([\w.]+)/)
      if (m) handlePattern = m[1]
    } else if (payload.platform === 'TikTok') {
      const m = normalized.match(/tiktok\.com\/@([\w.]+)/)
      if (m) handlePattern = m[1]
    }

    if (handlePattern) {
      // Search channel_urls JSONB — prefer records with email (more complete data)
      const { data: matched } = await supabase
        .from('influencers')
        .select('id, email')
        .or(
          `channel_urls->>YouTube.ilike.%${handlePattern}%,` +
          `channel_urls->>Instagram.ilike.%${handlePattern}%,` +
          `channel_urls->>TikTok.ilike.%${handlePattern}%`
        )
        .order('email', { ascending: false, nullsFirst: false })
        .limit(1)
        .single()

      if (matched) existingId = matched.id
    }
  }

  // --- Step 2: Update or Create ---
  if (existingId) {
    // Update existing — only fill in null/empty fields, don't overwrite stronger data
    const { data: existing } = await supabase
      .from('influencers')
      .select('*')
      .eq('id', existingId)
      .single()

    if (existing) {
      const updates: Record<string, unknown> = { last_collected_at: now }

      // Extract channel_handle from channel_url (YouTube: /@handle)
      if (!existing.channel_handle && payload.platform === 'YouTube') {
        const handleMatch = payload.channel_url.match(/youtube\.com\/@([\w.-]+)/)
        if (handleMatch) updates.channel_handle = handleMatch[1]
      }

      // Only update fields that are currently null/empty
      if (!existing.avatar_url && payload.avatar_url) updates.avatar_url = payload.avatar_url
      if (!existing.bio && payload.bio) updates.bio = payload.bio
      if (!existing.followers_count && payload.followers_count) updates.followers_count = payload.followers_count
      if (!existing.email && payload.email) updates.email = payload.email
      if (!existing.location && payload.location) updates.location = payload.location

      // Classify social links into individual columns
      const classified = classifySocialLinksFromPayload(payload.social_links)
      if (!existing.website && classified.website) updates.website = classified.website
      if (!existing.twitter && classified.twitter) updates.twitter = classified.twitter
      if (!existing.facebook && classified.facebook) updates.facebook = classified.facebook
      if (!existing.linkedin && classified.linkedin) updates.linkedin = classified.linkedin
      if (!existing.instagram && classified.instagram) updates.instagram = classified.instagram
      if (!existing.tiktok && classified.tiktok) updates.tiktok = classified.tiktok
      if (!existing.twitch && classified.twitch) updates.twitch = classified.twitch

      // Merge channel_urls (add new platform URLs, don't overwrite existing)
      const existingUrls = (existing.channel_urls as Record<string, string>) || {}
      const mergedUrls = { ...payload.social_links, ...existingUrls }
      // Always set the current platform URL
      mergedUrls[payload.platform] = payload.channel_url
      if (JSON.stringify(mergedUrls) !== JSON.stringify(existingUrls)) {
        updates.channel_urls = mergedUrls
      }

      // Merge platform array
      const existingPlatforms: string[] = existing.platform || []
      const newPlatforms = [...new Set([...existingPlatforms, payload.platform, ...Object.keys(payload.social_links).filter(k => k !== payload.platform)])]
      if (newPlatforms.length !== existingPlatforms.length) {
        updates.platform = newPlatforms
      }

      if (Object.keys(updates).length > 1) { // more than just last_collected_at
        const { error } = await supabase.from('influencers').update(updates).eq('id', existingId)
        if (error) throw error
      }
    }

    // Upsert videos
    if (payload.videos && payload.videos.length > 0) {
      const videoRows = payload.videos.map(v => ({
        influencer_id: existingId,
        video_id: v.video_id,
        title: v.title,
        thumbnail_url: v.thumbnail_url,
        duration: v.duration,
        view_count: v.view_count,
        published_at: v.published_at,
        video_url: v.video_url,
      }))
      await supabase.from('videos').upsert(videoRows, { onConflict: 'influencer_id,video_id' })
    }

    revalidatePath('/influencers')
    revalidatePath(`/influencers/${existingId}`)
    return { action: 'updated', influencer_id: existingId }
  }

  // --- Create new influencer ---
  const channelUrls: Record<string, string> = {
    [payload.platform]: payload.channel_url,
    ...payload.social_links,
  }

  const platforms = [...new Set([
    payload.platform,
    ...Object.keys(payload.social_links),
  ])]

  // Extract channel_handle from channel_url
  let channelHandle: string | null = null
  if (payload.platform === 'YouTube') {
    const handleMatch = payload.channel_url.match(/youtube\.com\/@([\w.-]+)/)
    if (handleMatch) channelHandle = handleMatch[1]
  } else if (payload.platform === 'Instagram') {
    const handleMatch = payload.channel_url.match(/instagram\.com\/([\w.]+)/)
    if (handleMatch) channelHandle = handleMatch[1]
  } else if (payload.platform === 'TikTok') {
    const handleMatch = payload.channel_url.match(/tiktok\.com\/@([\w.]+)/)
    if (handleMatch) channelHandle = handleMatch[1]
  }

  const { data: newInfluencer, error: createError } = await supabase
    .from('influencers')
    .insert({
      display_name: payload.display_name || payload.channel_url.split('/').pop() || 'Unknown',
      email: payload.email,
      avatar_url: payload.avatar_url,
      bio: payload.bio,
      followers_count: payload.followers_count,
      location: payload.location,
      platform: platforms,
      channel_urls: channelUrls,
      channel_handle: channelHandle,
      status: 'active',
      last_collected_at: now,
      ...classifySocialLinksFromPayload(payload.social_links),
    })
    .select('id')
    .single()

  if (createError) throw createError

  // Insert videos
  if (payload.videos && payload.videos.length > 0 && newInfluencer) {
    const videoRows = payload.videos.map(v => ({
      influencer_id: newInfluencer.id,
      video_id: v.video_id,
      title: v.title,
      thumbnail_url: v.thumbnail_url,
      duration: v.duration,
      view_count: v.view_count,
      published_at: v.published_at,
      video_url: v.video_url,
    }))
    await supabase.from('videos').upsert(videoRows, { onConflict: 'influencer_id,video_id' })
  }

  revalidatePath('/influencers')
  return { action: 'created', influencer_id: newInfluencer.id }
}

// ===== Posts =====

export async function createPost(data: {
  influencer_id?: string
  url: string
  platform: string
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (data.platform !== 'youtube') {
    throw new Error('目前仅支持 YouTube 平台，其他平台即将上线')
  }

  // Directly call YouTube API (no HTTP self-call, no port dependency)
  const videoData = await fetchPostData(data.url)

  // Resolve influencer_id: use provided, or auto-match/create from channel info
  let influencerId = data.influencer_id

  if (!influencerId) {
    const channel = videoData.channel
    const channelUrl = channel.handle
      ? `https://youtube.com/@${channel.handle}`
      : `https://www.youtube.com/channel/${channel.channel_id}`

    // Try to find existing influencer by YouTube channel URL
    const { data: existingInfluencer } = await supabase
      .from('influencers')
      .select('id')
      .eq('channel_urls->>YouTube', channelUrl)
      .maybeSingle()

    // Also try with /channel/ format if @handle didn't match
    let matchedInfluencer = existingInfluencer
    if (!matchedInfluencer && channel.handle) {
      const altUrl = `https://www.youtube.com/channel/${channel.channel_id}`
      const { data: altMatch } = await supabase
        .from('influencers')
        .select('id')
        .eq('channel_urls->>YouTube', altUrl)
        .maybeSingle()
      matchedInfluencer = altMatch
    }

    if (matchedInfluencer) {
      influencerId = matchedInfluencer.id
      // Refresh channel info for existing influencer
      await supabase
        .from('influencers')
        .update({
          youtube_channel_id: channel.channel_id,
          channel_handle: channel.handle,
          channel_description: channel.channel_description,
          channel_banner_url: channel.banner_url,
          total_views: channel.total_views,
          video_count: channel.video_count,
          channel_created_at: channel.channel_created_at,
          followers_count: channel.subscriber_count,
          avatar_url: channel.avatar_url,
          location: channel.country,
        })
        .eq('id', matchedInfluencer.id)
    } else {
      // Auto-create influencer
      const { data: newInfluencer, error: infError } = await supabase
        .from('influencers')
        .insert({
          display_name: channel.title,
          avatar_url: channel.avatar_url,
          bio: channel.description,
          followers_count: channel.subscriber_count,
          platform: ['YouTube'],
          channel_urls: { YouTube: channelUrl },
          location: channel.country,
          timezone: 'UTC',
          status: 'active',
          created_by: user?.id,
          youtube_channel_id: channel.channel_id,
          channel_handle: channel.handle,
          channel_description: channel.channel_description,
          channel_banner_url: channel.banner_url,
          total_views: channel.total_views,
          video_count: channel.video_count,
          channel_created_at: channel.channel_created_at,
        })
        .select('id')
        .single()

      if (infError) throw new Error(`自动创建红人失败: ${infError.message}`)
      if (!newInfluencer) throw new Error('自动创建红人失败')

      influencerId = newInfluencer.id
      revalidatePath('/influencers')
    }
  }

  // Insert post
  const { data: newPost, error: postError } = await supabase
    .from('posts')
    .insert({
      influencer_id: influencerId,
      platform: 'youtube',
      platform_post_id: videoData.platform_post_id,
      url: videoData.url,
      title: videoData.title,
      description: videoData.description,
      thumbnail_url: videoData.thumbnail_url,
      duration: videoData.duration,
      published_at: videoData.published_at,
      comments_disabled: videoData.comments_disabled,
      last_synced_at: new Date().toISOString(),
      tags: videoData.tags,
      hashtags: videoData.hashtags,
      channel_title: videoData.channel_title,
      language: videoData.language,
      category_id: videoData.category_id,
    })
    .select('id')
    .single()

  if (postError) throw postError
  if (!newPost) throw new Error('创建 Post 失败')

  // Insert snapshot
  await supabase.from('post_snapshots').insert({
    post_id: newPost.id,
    view_count: videoData.view_count,
    like_count: videoData.like_count,
    comment_count: videoData.comment_count,
  })

  // Insert comments (batch, upsert to handle duplicates)
  if (videoData.comments.length > 0) {
    const commentRows = videoData.comments.map((c) => ({
      post_id: newPost.id,
      platform_comment_id: c.platform_comment_id,
      author_name: c.author_name,
      author_avatar_url: c.author_avatar_url,
      author_channel_url: c.author_channel_url,
      text: c.text,
      like_count: c.like_count,
      published_at: c.published_at,
      is_reply: c.is_reply,
      parent_comment_id: c.parent_comment_id,
    }))

    // Insert in batches of 100 to avoid payload size issues
    for (let i = 0; i < commentRows.length; i += 100) {
      const batch = commentRows.slice(i, i + 100)
      await supabase.from('post_comments').upsert(batch, { onConflict: 'post_id,platform_comment_id' })
    }
  }

  revalidatePath('/posts')

  // Async: trigger subtitle fetching (non-blocking)
  Promise.resolve().then(() =>
    fetchPostTranscription(newPost.id).catch(console.error)
  )

  // Fetch influencer name for response
  const { data: influencer } = await supabase
    .from('influencers')
    .select('display_name')
    .eq('id', influencerId)
    .single()

  return { id: newPost.id, influencer_name: influencer?.display_name || null }
}

export async function syncPost(postId: string) {
  const supabase = await createServerClient()

  // Get post
  const { data: post, error: fetchError } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .single()

  if (fetchError || !post) throw new Error('Post 不存在')

  if (post.platform !== 'youtube') {
    throw new Error('目前仅支持 YouTube 平台同步')
  }

  // Directly call YouTube API (no HTTP self-call, no port dependency)
  const syncData = await fetchSyncData(post.platform_post_id)

  // Update post sync timestamp
  await supabase
    .from('posts')
    .update({
      last_synced_at: new Date().toISOString(),
      comments_disabled: syncData.comments_disabled,
      updated_at: new Date().toISOString(),
    })
    .eq('id', postId)

  // Insert new snapshot
  await supabase.from('post_snapshots').insert({
    post_id: postId,
    view_count: syncData.view_count,
    like_count: syncData.like_count,
    comment_count: syncData.comment_count,
  })

  // Upsert comments (will update existing, add new)
  if (syncData.comments && syncData.comments.length > 0) {
    const commentRows = syncData.comments.map((c) => ({
      post_id: postId,
      platform_comment_id: c.platform_comment_id,
      author_name: c.author_name,
      author_avatar_url: c.author_avatar_url,
      author_channel_url: c.author_channel_url,
      text: c.text,
      like_count: c.like_count,
      published_at: c.published_at,
      is_reply: c.is_reply,
      parent_comment_id: c.parent_comment_id,
    }))

    for (let i = 0; i < commentRows.length; i += 100) {
      const batch = commentRows.slice(i, i + 100)
      await supabase.from('post_comments').upsert(batch, { onConflict: 'post_id,platform_comment_id' })
    }
  }

  revalidatePath('/posts')
  revalidatePath(`/posts/${postId}`)

  // Async: trigger subtitle fetching only on first sync (pending state only)
  if (post.transcription_status === 'pending') {
    Promise.resolve().then(() =>
      fetchPostTranscription(postId).catch(console.error)
    )
  }
}

// ===== Transcription Quota =====

const DEFAULT_QUOTA_SECONDS = 6000 // 100 minutes per month

/**
 * Parse duration string ("10:30" or "1:23:45") to seconds
 */
function parseDurationToSeconds(duration: string | null): number {
  if (!duration) return 0
  const parts = duration.split(':').map(Number)
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1]
  }
  return 0
}

function getCurrentYearMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Get current user's transcription quota for this month
 */
export async function getTranscriptionQuota() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  const yearMonth = getCurrentYearMonth()

  const { data, error } = await supabase
    .from('transcription_usage')
    .select('used_seconds, quota_seconds')
    .eq('user_id', user.id)
    .eq('year_month', yearMonth)
    .maybeSingle()

  if (error) throw error

  const usedSeconds = data?.used_seconds ?? 0
  const quotaSeconds = data?.quota_seconds ?? DEFAULT_QUOTA_SECONDS

  return {
    used_seconds: usedSeconds,
    quota_seconds: quotaSeconds,
    remaining_seconds: Math.max(0, quotaSeconds - usedSeconds),
    year_month: yearMonth,
  }
}

/**
 * Estimate quota cost for a post based on its duration
 */
export async function estimateQuotaCost(postId: string) {
  const supabase = await createServerClient()

  const { data: post, error } = await supabase
    .from('posts')
    .select('duration')
    .eq('id', postId)
    .single()

  if (error || !post) throw new Error('Post 不存在')

  const seconds = parseDurationToSeconds(post.duration)
  return {
    estimated_seconds: seconds,
    estimated_minutes: Math.ceil(seconds / 60),
    duration_display: post.duration || '未知',
  }
}

// ===== Transcription =====

/**
 * Automatically fetch YouTube subtitles for a post.
 * Called asynchronously after createPost / syncPost.
 */
export async function fetchPostTranscription(postId: string) {
  // Use admin client — this runs fire-and-forget, outside request context
  const supabase = createAdminClient()

  const { data: post, error } = await supabase
    .from('posts')
    .select('id, platform_post_id, platform, transcription_status')
    .eq('id', postId)
    .single()

  if (error || !post) {
    console.error('fetchPostTranscription: Post not found', postId)
    return
  }

  if (post.platform !== 'youtube') return
  if (post.transcription_status === 'completed') return

  // Mark as processing
  await supabase
    .from('posts')
    .update({ transcription_status: 'processing' })
    .eq('id', postId)

  try {
    const result = await fetchYouTubeTranscription(post.platform_post_id)

    if (result) {
      await supabase
        .from('posts')
        .update({
          transcription: result.text,
          transcription_source: result.source,
          transcription_status: 'completed',
          transcription_language: result.language,
          transcription_error: null,
        })
        .eq('id', postId)

      // Chain trigger: transcription completed -> auto-start sentiment analysis
      analyzeVideoSentimentBackground(postId, supabase).catch(console.error)
    } else {
      // Subtitles not available — mark as available for manual STT trigger
      await supabase
        .from('posts')
        .update({
          transcription_status: 'available_for_stt',
          transcription_error: '该视频无 YouTube 字幕，可使用 AI 转写',
        })
        .eq('id', postId)
    }
  } catch (err) {
    // Error was thrown (e.g., YouTube bot detection) — verify via Data API
    const errorMsg = (err as Error).message
    let captionStatus: string | null = null
    try {
      const apiKey = process.env.YOUTUBE_API_KEY
      if (apiKey) {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${post.platform_post_id}&key=${apiKey}`
        )
        if (res.ok) {
          const videoData = await res.json()
          captionStatus = videoData.items?.[0]?.contentDetails?.caption
        }
      }
    } catch {
      // Ignore verification errors
    }

    const userMessage = captionStatus === 'false'
      ? '该视频无 YouTube 字幕，可使用 AI 转写'
      : captionStatus === 'true'
        ? `字幕获取失败（${errorMsg}），请稍后重试或使用 AI 转写`
        : `字幕获取失败（${errorMsg}），可使用 AI 转写`

    await supabase
      .from('posts')
      .update({
        transcription_status: 'available_for_stt',
        transcription_error: userMessage,
      })
      .eq('id', postId)
  }

}

/**
 * Manually trigger OpenAI Whisper transcription for a post.
 * Called by user clicking the "AI 转写" button on the post detail page.
 */
export async function triggerWhisperTranscription(postId: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')

  // --- Quota check ---
  const yearMonth = getCurrentYearMonth()
  const { data: usageRow } = await supabase
    .from('transcription_usage')
    .select('used_seconds, quota_seconds')
    .eq('user_id', user.id)
    .eq('year_month', yearMonth)
    .maybeSingle()

  const usedSeconds = usageRow?.used_seconds ?? 0
  const quotaSeconds = usageRow?.quota_seconds ?? DEFAULT_QUOTA_SECONDS
  const remainingSeconds = quotaSeconds - usedSeconds

  const { data: post, error } = await supabase
    .from('posts')
    .select('id, url, duration, transcription_status')
    .eq('id', postId)
    .single()

  if (error || !post) throw new Error('Post 不存在')
  if (post.transcription_status === 'completed') {
    throw new Error('该视频已有转写结果')
  }

  const estimatedCost = parseDurationToSeconds(post.duration)
  if (estimatedCost > 0 && estimatedCost > remainingSeconds) {
    throw new Error(
      `本月转写配额不足（剩余 ${Math.floor(remainingSeconds / 60)} 分钟，该视频约需 ${Math.ceil(estimatedCost / 60)} 分钟）。请下月再试或联系管理员提升额度`
    )
  }

  // Mark as processing to prevent double-clicks
  await supabase
    .from('posts')
    .update({ transcription_status: 'processing' })
    .eq('id', postId)

  // Fire-and-forget: run transcription + sentiment analysis in background.
  // This way the Server Action returns immediately and the user can navigate away.
  runTranscriptionPipeline(postId, post.url, estimatedCost, usedSeconds, quotaSeconds, yearMonth, user.id).catch(console.error)

  return { started: true }
}

/**
 * Background pipeline: download audio -> Whisper API -> save -> sentiment analysis.
 * Runs independently of the HTTP request lifecycle.
 */
async function runTranscriptionPipeline(
  postId: string,
  url: string,
  estimatedCost: number,
  usedSeconds: number,
  quotaSeconds: number,
  yearMonth: string,
  userId: string,
) {
  // Use admin client — no cookies() dependency, works outside request context
  const supabase = createAdminClient()

  try {
    const result = await transcribeWithWhisper(url)

    if (result) {
      const quotaCost = estimatedCost > 0 ? estimatedCost : 60

      await supabase
        .from('posts')
        .update({
          transcription: result.text,
          transcription_source: 'openai_whisper',
          transcription_status: 'completed',
          transcription_language: result.language,
          transcription_error: null,
          transcription_quota_cost: quotaCost,
        })
        .eq('id', postId)

      // Record quota usage
      const newUsedSeconds = usedSeconds + quotaCost
      await supabase
        .from('transcription_usage')
        .upsert(
          {
            user_id: userId,
            year_month: yearMonth,
            used_seconds: newUsedSeconds,
            quota_seconds: quotaSeconds,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,year_month' }
        )

      // Chain: auto-trigger sentiment analysis (using admin client)
      await analyzeVideoSentimentBackground(postId, supabase)
    } else {
      await supabase
        .from('posts')
        .update({
          transcription_status: 'failed',
          transcription_error: 'Whisper API 未返回结果',
        })
        .eq('id', postId)
    }
  } catch (err) {
    await supabase
      .from('posts')
      .update({
        transcription_status: 'failed',
        transcription_error: (err as Error).message,
      })
      .eq('id', postId)
  }

}

/**
 * Background-safe version of analyzePostVideoSentiment.
 * Uses a pre-created Supabase client (no cookies() dependency).
 */
async function analyzeVideoSentimentBackground(
  postId: string,
  supabase: ReturnType<typeof createAdminClient>,
) {
  const { data: post, error } = await supabase
    .from('posts')
    .select('id, title, transcription, transcription_status, video_sentiment_status')
    .eq('id', postId)
    .single()

  if (error || !post) {
    console.error('analyzeVideoSentimentBackground: Post not found', postId)
    return
  }

  if (post.transcription_status !== 'completed' || !post.transcription) return
  if (post.video_sentiment_status === 'completed') return

  await supabase
    .from('posts')
    .update({ video_sentiment_status: 'processing' })
    .eq('id', postId)

  try {
    const result = await analyzeVideoSentiment(post.transcription, post.title || '')

    await supabase
      .from('posts')
      .update({
        video_sentiment: result as unknown as Record<string, unknown>,
        video_sentiment_status: 'completed',
      })
      .eq('id', postId)
  } catch (err) {
    console.error('Video sentiment analysis error:', err)
    await supabase
      .from('posts')
      .update({ video_sentiment_status: 'failed' })
      .eq('id', postId)
  }

  revalidatePath(`/posts/${postId}`)
}

export async function deletePost(postId: string) {
  const supabase = await createServerClient()

  const { error } = await supabase.from('posts').delete().eq('id', postId)
  if (error) throw error

  revalidatePath('/posts')
}

// ===== Sentiment Analysis =====

/**
 * Analyze creator's sentiment toward the product based on video transcription.
 * Automatically triggered after transcription is completed.
 */
export async function analyzePostVideoSentiment(postId: string) {
  const supabase = await createServerClient()

  const { data: post, error } = await supabase
    .from('posts')
    .select('id, title, transcription, transcription_status, video_sentiment_status')
    .eq('id', postId)
    .single()

  if (error || !post) {
    console.error('analyzePostVideoSentiment: Post not found', postId)
    return
  }

  // Skip if no transcription or already completed
  if (post.transcription_status !== 'completed' || !post.transcription) return
  if (post.video_sentiment_status === 'completed') return

  // Mark as processing
  await supabase
    .from('posts')
    .update({ video_sentiment_status: 'processing' })
    .eq('id', postId)

  try {
    const result = await analyzeVideoSentiment(post.transcription, post.title || '')

    await supabase
      .from('posts')
      .update({
        video_sentiment: result as unknown as Record<string, unknown>,
        video_sentiment_status: 'completed',
      })
      .eq('id', postId)
  } catch (err) {
    console.error('Video sentiment analysis error:', err)
    await supabase
      .from('posts')
      .update({ video_sentiment_status: 'failed' })
      .eq('id', postId)
  }

  revalidatePath(`/posts/${postId}`)
}

/**
 * Analyze audience sentiment based on video comments.
 * Capability reserved — trigger mechanism TBD.
 */
export async function analyzePostCommentSentiment(postId: string) {
  const supabase = await createServerClient()

  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('id, title, comment_sentiment_status')
    .eq('id', postId)
    .single()

  if (postError || !post) {
    console.error('analyzePostCommentSentiment: Post not found', postId)
    return
  }

  if (post.comment_sentiment_status === 'completed') return

  // Fetch comments
  const { data: comments, error: commentsError } = await supabase
    .from('post_comments')
    .select('text, like_count')
    .eq('post_id', postId)
    .eq('is_reply', false) // Top-level comments only
    .order('like_count', { ascending: false })
    .limit(100)

  if (commentsError || !comments || comments.length === 0) {
    await supabase
      .from('posts')
      .update({ comment_sentiment_status: 'skipped' })
      .eq('id', postId)
    return
  }

  // Mark as processing
  await supabase
    .from('posts')
    .update({ comment_sentiment_status: 'processing' })
    .eq('id', postId)

  try {
    const result = await analyzeCommentSentiment(
      comments.map((c) => ({ text: c.text, like_count: c.like_count || 0 })),
      post.title || ''
    )

    await supabase
      .from('posts')
      .update({
        comment_sentiment: result as unknown as Record<string, unknown>,
        comment_sentiment_status: 'completed',
      })
      .eq('id', postId)
  } catch (err) {
    console.error('Comment sentiment analysis error:', err)
    await supabase
      .from('posts')
      .update({ comment_sentiment_status: 'failed' })
      .eq('id', postId)
  }

  revalidatePath(`/posts/${postId}`)
}

// ===== Manual Social Links Update =====

export async function updateInfluencerSocialLinks(
  influencerId: string,
  data: {
    email?: string | null
    website?: string | null
    twitter?: string | null
    facebook?: string | null
    linkedin?: string | null
    instagram?: string | null
    tiktok?: string | null
    twitch?: string | null
  }
) {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('influencers')
    .update({
      email: data.email || null,
      website: data.website || null,
      twitter: data.twitter || null,
      facebook: data.facebook || null,
      linkedin: data.linkedin || null,
      instagram: data.instagram || null,
      tiktok: data.tiktok || null,
      twitch: data.twitch || null,
    })
    .eq('id', influencerId)

  if (error) throw error

  revalidatePath(`/influencers/${influencerId}`)
  return { success: true }
}
