'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getDefaultStages, type ServiceType, type ServiceStatus } from '@/lib/types'

// Get current user
async function getUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthorized')
  return user
}

// Profile actions
export async function getProfile() {
  const user = await getUser()
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (error) throw error
  return data
}

export async function updateProfile(formData: {
  full_name?: string
  company_name?: string
  phone?: string
  address?: string
}) {
  const user = await getUser()
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('profiles')
    .update({
      ...formData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
  
  if (error) throw error
  revalidatePath('/dashboard')
}

// Service actions
export async function getServices() {
  const user = await getUser()
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export async function getService(serviceId: string) {
  const user = await getUser()
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', serviceId)
    .eq('user_id', user.id)
    .single()
  
  if (error) throw error
  return data
}

export async function getServiceWithStages(serviceId: string) {
  const user = await getUser()
  const supabase = await createClient()
  
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('*')
    .eq('id', serviceId)
    .eq('user_id', user.id)
    .single()
  
  if (serviceError) throw serviceError

  const { data: stages, error: stagesError } = await supabase
    .from('pipeline_stages')
    .select('*')
    .eq('service_id', serviceId)
    .order('stage_number', { ascending: true })
  
  if (stagesError) throw stagesError

  return { ...service, stages: stages || [] }
}

export async function createService(formData: {
  service_type: ServiceType
  product_name: string
  product_description?: string
}) {
  const user = await getUser()
  const supabase = await createClient()
  
  // Create the service
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .insert({
      user_id: user.id,
      service_type: formData.service_type,
      product_name: formData.product_name,
      product_description: formData.product_description || null,
      status: 'pending',
    })
    .select()
    .single()
  
  if (serviceError) throw serviceError

  // Create default pipeline stages
  const defaultStages = getDefaultStages(formData.service_type)
  const stagesToInsert = defaultStages.map(stage => ({
    service_id: service.id,
    stage_number: stage.stage_number,
    stage_name: stage.stage_name,
    stage_description: stage.stage_description,
    status: 'pending',
  }))

  const { error: stagesError } = await supabase
    .from('pipeline_stages')
    .insert(stagesToInsert)

  if (stagesError) throw stagesError

  // Log activity
  await logActivity(service.id, 'service_created', `Tạo yêu cầu đăng ký mới: ${formData.product_name}`)

  revalidatePath('/dashboard')
  return service
}

export async function updateServiceStatus(serviceId: string, status: ServiceStatus) {
  const user = await getUser()
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('services')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', serviceId)
    .eq('user_id', user.id)
  
  if (error) throw error
  revalidatePath('/dashboard')
  revalidatePath(`/dashboard/services/${serviceId}`)
}

// Pipeline stage actions
export async function getServiceStages(serviceId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('pipeline_stages')
    .select('*')
    .eq('service_id', serviceId)
    .order('stage_number', { ascending: true })
  
  if (error) throw error
  return data
}

// Document actions
export async function getServiceDocuments(serviceId: string) {
  const user = await getUser()
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('service_id', serviceId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export async function createDocument(formData: {
  service_id: string
  stage_id?: string
  document_name: string
  document_type: 'upload' | 'download'
  file_url: string
  file_size?: number
  mime_type?: string
  uploaded_by: 'customer' | 'vexim'
}) {
  const user = await getUser()
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('documents')
    .insert({
      ...formData,
      user_id: user.id,
    })
    .select()
    .single()
  
  if (error) throw error

  await logActivity(formData.service_id, 'document_uploaded', `Tải lên tài liệu: ${formData.document_name}`)

  revalidatePath('/dashboard')
  revalidatePath(`/dashboard/services/${formData.service_id}`)
  return data
}

export async function deleteDocument(documentId: string, serviceId: string) {
  const user = await getUser()
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId)
    .eq('user_id', user.id)
  
  if (error) throw error
  revalidatePath('/dashboard')
  revalidatePath(`/dashboard/services/${serviceId}`)
}

// Notification actions
export async function getNotifications() {
  const user = await getUser()
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)
  
  if (error) throw error
  return data
}

export async function getUnreadNotificationsCount() {
  const user = await getUser()
  const supabase = await createClient()
  
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)
  
  if (error) throw error
  return count || 0
}

export async function markNotificationAsRead(notificationId: string) {
  const user = await getUser()
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id)
  
  if (error) throw error
  revalidatePath('/dashboard')
}

export async function markAllNotificationsAsRead() {
  const user = await getUser()
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)
  
  if (error) throw error
  revalidatePath('/dashboard')
}

// Activity log actions
export async function getActivityLogs(serviceId?: string) {
  const user = await getUser()
  const supabase = await createClient()
  
  let query = supabase
    .from('activity_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)
  
  if (serviceId) {
    query = query.eq('service_id', serviceId)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  return data
}

async function logActivity(serviceId: string | null, action: string, description: string, metadata?: Record<string, unknown>) {
  const user = await getUser()
  const supabase = await createClient()
  
  await supabase.from('activity_logs').insert({
    user_id: user.id,
    service_id: serviceId,
    action,
    description,
    metadata: metadata || null,
  })
}

// Dashboard stats
export async function getDashboardStats() {
  const user = await getUser()
  const supabase = await createClient()
  
  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select('status, fda_expiry_date, us_agent_expiry_date')
    .eq('user_id', user.id)
  
  if (servicesError) throw servicesError

  const { count: unreadCount, error: notifError } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)
  
  if (notifError) throw notifError

  const now = new Date()
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const expiringServices = services?.filter(s => {
    const fdaExpiry = s.fda_expiry_date ? new Date(s.fda_expiry_date) : null
    const agentExpiry = s.us_agent_expiry_date ? new Date(s.us_agent_expiry_date) : null
    
    return (fdaExpiry && fdaExpiry <= thirtyDaysFromNow && fdaExpiry >= now) ||
           (agentExpiry && agentExpiry <= thirtyDaysFromNow && agentExpiry >= now)
  }).length || 0

  return {
    totalServices: services?.length || 0,
    pendingServices: services?.filter(s => s.status === 'pending').length || 0,
    inProgressServices: services?.filter(s => s.status === 'in_progress').length || 0,
    completedServices: services?.filter(s => s.status === 'completed').length || 0,
    expiringServices,
    unreadNotifications: unreadCount || 0,
  }
}

// Sign out action
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/')
}
