'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Service, Profile, PipelineStage, ServiceType } from '@/lib/types'

// Helper to get current user
async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new Error('Unauthorized')
  }
  return user
}

// Helper to get user profile with role
async function getCurrentProfile() {
  const user = await getCurrentUser()
  const supabase = await createClient()
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (error || !profile) {
    throw new Error('Profile not found')
  }
  return profile as Profile
}

// Get all services (with role-based filtering via RLS)
export async function getServices() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('services')
    .select(`
      *,
      client:profiles!services_client_id_fkey(*),
      assigned_staff:profiles!services_assigned_staff_id_fkey(*)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[v0] Error fetching services:', error)
    return []
  }
  return data as Service[]
}

// Get single service by ID
export async function getServiceById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('services')
    .select(`
      *,
      client:profiles!services_client_id_fkey(*),
      assigned_staff:profiles!services_assigned_staff_id_fkey(*),
      tasks:pipeline_tasks(*),
      documents(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('[v0] Error fetching service:', error)
    return null
  }
  return data as Service
}

// Create new service (staff/admin only)
export async function createService(data: {
  client_id: string
  service_type: ServiceType
  product_name: string
  product_description?: string
}) {
  const profile = await getCurrentProfile()
  
  // Only admin and staff can create services
  if (profile.role !== 'admin' && profile.role !== 'staff') {
    throw new Error('Unauthorized: Only admin and staff can create services')
  }
  
  const supabase = await createClient()
  
  const { data: service, error } = await supabase
    .from('services')
    .insert(data)
    .select()
    .single()

  if (error) {
    console.error('[v0] Error creating service:', error)
    throw new Error('Failed to create service')
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/pipeline')
  return service as Service
}

// Update service stage
export async function updateServiceStage(serviceId: string, stage: PipelineStage) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  
  const { error } = await supabase
    .from('services')
    .update({ 
      current_stage: stage,
      updated_at: new Date().toISOString()
    })
    .eq('id', serviceId)

  if (error) {
    console.error('[v0] Error updating service stage:', error)
    throw new Error('Failed to update service stage')
  }

  // Log activity
  await supabase.from('activity_logs').insert({
    service_id: serviceId,
    user_id: user.id,
    action: 'stage_updated',
    details: { new_stage: stage }
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/pipeline')
  revalidatePath(`/dashboard/service/${serviceId}`)
}

// Update service details
export async function updateService(serviceId: string, data: Partial<Service>) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('services')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('id', serviceId)

  if (error) {
    console.error('[v0] Error updating service:', error)
    throw new Error('Failed to update service')
  }

  revalidatePath('/dashboard')
  revalidatePath(`/dashboard/service/${serviceId}`)
}

// Get pipeline tasks for a service
export async function getServiceTasks(serviceId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pipeline_tasks')
    .select('*')
    .eq('service_id', serviceId)
    .order('stage')
    .order('sort_order')

  if (error) {
    console.error('[v0] Error fetching tasks:', error)
    return []
  }
  return data
}

// Toggle task completion
export async function toggleTask(taskId: string, isCompleted: boolean) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  
  const { error } = await supabase
    .from('pipeline_tasks')
    .update({
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
      completed_by: isCompleted ? user.id : null
    })
    .eq('id', taskId)

  if (error) {
    console.error('[v0] Error toggling task:', error)
    throw new Error('Failed to update task')
  }

  revalidatePath('/dashboard')
}

// Create task
export async function createTask(data: {
  service_id: string
  stage: PipelineStage
  title: string
  description?: string
  sort_order?: number
}) {
  const profile = await getCurrentProfile()
  
  // Only admin and staff can create tasks
  if (profile.role !== 'admin' && profile.role !== 'staff') {
    throw new Error('Unauthorized: Only admin and staff can create tasks')
  }
  
  const supabase = await createClient()
  
  // Get the max sort_order for this service and stage
  const { data: existingTasks } = await supabase
    .from('pipeline_tasks')
    .select('sort_order')
    .eq('service_id', data.service_id)
    .eq('stage', data.stage)
    .order('sort_order', { ascending: false })
    .limit(1)
  
  const nextSortOrder = existingTasks && existingTasks.length > 0 
    ? (existingTasks[0].sort_order || 0) + 1 
    : 1
  
  const { data: task, error } = await supabase
    .from('pipeline_tasks')
    .insert({
      ...data,
      sort_order: data.sort_order ?? nextSortOrder
    })
    .select()
    .single()

  if (error) {
    console.error('[v0] Error creating task:', error)
    throw new Error('Failed to create task')
  }

  revalidatePath('/dashboard')
  revalidatePath(`/dashboard/service/${data.service_id}`)
  return task
}

// Update task
export async function updateTask(taskId: string, data: {
  title?: string
  description?: string
  stage?: PipelineStage
  sort_order?: number
}) {
  const profile = await getCurrentProfile()
  
  // Only admin and staff can update tasks
  if (profile.role !== 'admin' && profile.role !== 'staff') {
    throw new Error('Unauthorized: Only admin and staff can update tasks')
  }
  
  const supabase = await createClient()
  
  const { data: task, error } = await supabase
    .from('pipeline_tasks')
    .update(data)
    .eq('id', taskId)
    .select()
    .single()

  if (error) {
    console.error('[v0] Error updating task:', error)
    throw new Error('Failed to update task')
  }

  revalidatePath('/dashboard')
  return task
}

// Delete task
export async function deleteTask(taskId: string) {
  const profile = await getCurrentProfile()
  
  // Only admin and staff can delete tasks
  if (profile.role !== 'admin' && profile.role !== 'staff') {
    throw new Error('Unauthorized: Only admin and staff can delete tasks')
  }
  
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('pipeline_tasks')
    .delete()
    .eq('id', taskId)

  if (error) {
    console.error('[v0] Error deleting task:', error)
    throw new Error('Failed to delete task')
  }

  revalidatePath('/dashboard')
}

// Update service stage (for drag and drop)
export async function updateServiceStage(serviceId: string, newStage: PipelineStage) {
  const profile = await getCurrentProfile()
  
  // Only admin and staff can update service stage
  if (profile.role !== 'admin' && profile.role !== 'staff') {
    throw new Error('Unauthorized: Only admin and staff can update service stage')
  }
  
  const supabase = await createClient()
  
  // Get current stage for activity log
  const { data: currentService } = await supabase
    .from('services')
    .select('current_stage')
    .eq('id', serviceId)
    .single()
  
  // Update service stage
  const { error: updateError } = await supabase
    .from('services')
    .update({ 
      current_stage: newStage,
      updated_at: new Date().toISOString()
    })
    .eq('id', serviceId)

  if (updateError) {
    console.error('[v0] Error updating service stage:', updateError)
    throw new Error('Failed to update service stage')
  }

  // Log activity
  try {
    const { data: stageLabel } = await supabase
      .from('services')
      .select('current_stage')
      .eq('id', serviceId)
      .single()
    
    await supabase
      .from('activity_logs')
      .insert({
        service_id: serviceId,
        action: 'stage_changed',
        details: {
          from_stage: currentService?.current_stage,
          to_stage: newStage
        },
        performed_by: profile.id
      })
  } catch (error) {
    console.error('[v0] Error logging activity:', error)
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/pipeline')
  return { success: true }
}

export async function getServiceDocuments(serviceId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('documents')
    .select(`
      *,
      uploader:profiles!documents_uploaded_by_fkey(*)
    `)
    .eq('service_id', serviceId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[v0] Error fetching documents:', error)
    return []
  }
  return data
}

// Get all documents (for documents page)
export async function getAllDocuments() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('documents')
    .select(`
      *,
      uploader:profiles!documents_uploaded_by_fkey(*),
      service:services(*)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[v0] Error fetching documents:', error)
    return []
  }
  return data
}

// Get notifications
export async function getNotifications() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notifications')
    .select(`
      *,
      service:services(id, product_name)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[v0] Error fetching notifications:', error)
    return []
  }
  return data
}

// Mark notification as read
export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('id', notificationId)

  if (error) {
    console.error('[v0] Error marking notification read:', error)
    throw new Error('Failed to update notification')
  }

  revalidatePath('/dashboard/notifications')
}

// Mark all notifications as read
export async function markAllNotificationsRead() {
  const supabase = await createClient()
  const user = await getCurrentUser()
  
  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) {
    console.error('[v0] Error marking all notifications read:', error)
    throw new Error('Failed to update notifications')
  }

  revalidatePath('/dashboard/notifications')
}

// Delete notification
export async function deleteNotification(notificationId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)

  if (error) {
    console.error('[v0] Error deleting notification:', error)
    throw new Error('Failed to delete notification')
  }

  revalidatePath('/dashboard/notifications')
}

// Get user profile
export async function getProfile() {
  return getCurrentProfile()
}

// Update profile
export async function updateProfile(data: Partial<Profile>) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  
  const { error } = await supabase
    .from('profiles')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)

  if (error) {
    console.error('[v0] Error updating profile:', error)
    throw new Error('Failed to update profile')
  }

  revalidatePath('/dashboard/settings')
}

// Get notification settings
export async function getNotificationSettings() {
  const supabase = await createClient()
  const user = await getCurrentUser()
  
  const { data, error } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.error('[v0] Error fetching notification settings:', error)
    return null
  }
  return data
}

// Update notification settings
export async function updateNotificationSettings(data: {
  email_service_updates?: boolean
  email_document_requests?: boolean
  email_renewal_reminders?: boolean
  reminder_days_before?: number
}) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  
  const { error } = await supabase
    .from('notification_settings')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)

  if (error) {
    console.error('[v0] Error updating notification settings:', error)
    throw new Error('Failed to update settings')
  }

  revalidatePath('/dashboard/settings')
}

// Get services with expiring FDA or US Agent
export async function getExpiringServices(daysAhead: number = 30) {
  const supabase = await createClient()
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + daysAhead)
  
  const { data, error } = await supabase
    .from('services')
    .select(`
      *,
      client:profiles!services_client_id_fkey(*)
    `)
    .or(`fda_expiry_date.lte.${futureDate.toISOString()},us_agent_expiry_date.lte.${futureDate.toISOString()}`)
    .not('fda_expiry_date', 'is', null)
    .order('fda_expiry_date', { ascending: true })

  if (error) {
    console.error('[v0] Error fetching expiring services:', error)
    return []
  }
  return data as Service[]
}

// Get dashboard stats
export async function getDashboardStats() {
  const supabase = await createClient()
  const profile = await getCurrentProfile()
  
  // Get total services count
  const { count: totalServices } = await supabase
    .from('services')
    .select('*', { count: 'exact', head: true })
  
  // Get completed services count
  const { count: completedServices } = await supabase
    .from('services')
    .select('*', { count: 'exact', head: true })
    .eq('current_stage', 'completion_handover')
  
  // Get unread notifications count
  const { count: unreadNotifications } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false)
  
  // Get expiring services count (next 30 days)
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + 30)
  const { count: expiringCount } = await supabase
    .from('services')
    .select('*', { count: 'exact', head: true })
    .or(`fda_expiry_date.lte.${futureDate.toISOString()},us_agent_expiry_date.lte.${futureDate.toISOString()}`)
    .not('fda_expiry_date', 'is', null)

  return {
    totalServices: totalServices || 0,
    completedServices: completedServices || 0,
    unreadNotifications: unreadNotifications || 0,
    expiringCount: expiringCount || 0,
    userRole: profile.role
  }
}

// Get all clients (for admin/staff)
export async function getClients() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'client')
    .order('company_name')

  if (error) {
    console.error('[v0] Error fetching clients:', error)
    return []
  }
  return data as Profile[]
}

// Get all staff members (for admin)
export async function getStaffMembers() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['staff', 'admin'])
    .order('full_name')

  if (error) {
    console.error('[v0] Error fetching staff:', error)
    return []
  }
  return data as Profile[]
}

// Create a new client profile (admin/staff only)
export async function createClientProfile(data: {
  email: string
  full_name?: string
  company_name?: string
  phone?: string
}) {
  const supabase = await createClient()
  
  // Generate a UUID for the new client
  const clientId = crypto.randomUUID()
  
  const { data: client, error } = await supabase
    .from('profiles')
    .insert({
      id: clientId,
      email: data.email,
      full_name: data.full_name || null,
      company_name: data.company_name || null,
      phone: data.phone || null,
      role: 'client'
    })
    .select()
    .single()

  if (error) {
    console.error('[v0] Error creating client:', error)
    throw new Error('Failed to create client: ' + error.message)
  }

  revalidatePath('/dashboard')
  return client as Profile
}

// Get all users (admin only)
export async function getAllUsers() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[v0] Error fetching users:', error)
    return []
  }
  return data as Profile[]
}

// Update user role (admin only)
export async function updateUserRole(userId: string, role: 'admin' | 'staff' | 'client') {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('[v0] Error updating user role:', error)
    throw new Error('Failed to update user role: ' + error.message)
  }

  revalidatePath('/dashboard/users')
  return data as Profile
}

// Create staff member (admin only)
export async function createStaffMember(data: {
  email: string
  full_name?: string
  phone?: string
  role: 'staff' | 'admin'
}) {
  const supabase = await createClient()
  
  const staffId = crypto.randomUUID()
  
  const { data: staff, error } = await supabase
    .from('profiles')
    .insert({
      id: staffId,
      email: data.email,
      full_name: data.full_name || null,
      phone: data.phone || null,
      role: data.role
    })
    .select()
    .single()

  if (error) {
    console.error('[v0] Error creating staff:', error)
    throw new Error('Failed to create staff member: ' + error.message)
  }

  revalidatePath('/dashboard/users')
  return staff as Profile
}

// Delete user (admin only)
export async function deleteUser(userId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId)

  if (error) {
    console.error('[v0] Error deleting user:', error)
    throw new Error('Failed to delete user: ' + error.message)
  }

  revalidatePath('/dashboard/users')
  return { success: true }
}

// Get activity logs for a service
export async function getActivityLogs(serviceId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('activity_logs')
    .select(`
      *,
      user:profiles!activity_logs_user_id_fkey(full_name, email)
    `)
    .eq('service_id', serviceId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[v0] Error fetching activity logs:', error)
    return []
  }
  return data
}

// Sign out
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/')
}
