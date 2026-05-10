'use server'

import { revalidatePath } from 'next/cache'
import { createClient as createServerClient } from '@/lib/supabase/server'

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
  if (error) throw error
  revalidatePath('/clients')
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
  if (error) throw error
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
  if (error) throw error
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
  if (error) throw error
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
  if (error) throw error
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
