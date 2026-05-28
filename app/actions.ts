'use server'

import { createClient } from '@/lib/supabase/server'

// Helper to get user's profile with company_id
async function getUserWithProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { user: null, profile: null, supabase }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, roles(name)')
    .eq('id', user.id)
    .single()
    
  return { user, profile, supabase }
}

export async function getDashboardStats() {
  const { user, profile, supabase } = await getUserWithProfile()
  if (!user) throw new Error('Unauthorized')

  // Get statuses for filtering
  const { data: statuses } = await supabase
    .from('registration_statuses')
    .select('id, code')
  
  const statusMap = new Map(statuses?.map(s => [s.code, s.id]) || [])
  const completedStatusId = statusMap.get('COMPLETED')
  const approvedStatusId = statusMap.get('APPROVED')

  // Build query based on role
  let query = supabase.from('fda_registrations').select('id, status_id')
  
  // If customer, filter by company_id
  if (profile?.roles?.name === 'customer' && profile.company_id) {
    query = query.eq('company_id', profile.company_id)
  } else if (profile?.roles?.name === 'customer') {
    // Customer without company - no registrations
    return {
      totalServices: 0,
      inProgressServices: 0,
      completedServices: 0,
      expiringServices: 0,
    }
  }
  // Admin/staff can see all

  const { data: registrations } = await query
  const total = registrations?.length || 0
  const completed = registrations?.filter(r => 
    r.status_id === completedStatusId || r.status_id === approvedStatusId
  ).length || 0

  return {
    totalServices: total,
    inProgressServices: total - completed,
    completedServices: completed,
    expiringServices: 0, // TODO: Calculate based on expiration_date
  }
}

export async function getServices() {
  const { user, profile, supabase } = await getUserWithProfile()
  if (!user) throw new Error('Unauthorized')

  let query = supabase
    .from('fda_registrations')
    .select(`
      *,
      registration_types(code, name, display_name),
      registration_statuses(code, name, display_name, color),
      companies(name)
    `)
    .order('created_at', { ascending: false })
  
  // If customer, filter by company_id
  if (profile?.roles?.name === 'customer' && profile.company_id) {
    query = query.eq('company_id', profile.company_id)
  } else if (profile?.roles?.name === 'customer') {
    return [] // Customer without company
  }

  const { data, error } = await query
  if (error) throw error
  
  // Transform to match frontend expectations
  return (data || []).map(reg => ({
    id: reg.id,
    product_name: reg.facility_name || 'Chưa có tên',
    product_description: reg.product_description,
    service_type: reg.registration_types?.code?.toLowerCase() || 'food',
    status: reg.registration_statuses?.code?.toLowerCase() || 'pending',
    status_display: reg.registration_statuses?.display_name,
    status_color: reg.registration_statuses?.color,
    type_display: reg.registration_types?.display_name,
    company_name: reg.companies?.name,
    created_at: reg.created_at,
    updated_at: reg.updated_at,
  }))
}

export async function getNotifications() {
  const { user, supabase } = await getUserWithProfile()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  
  // Transform to match frontend expectations  
  return (data || []).map(n => ({
    ...n,
    notification_type: n.type || 'info',
  }))
}

export async function createService(formData: {
  product_name: string
  service_type: string
  product_description?: string
}) {
  const { user, profile, supabase } = await getUserWithProfile()
  if (!user) throw new Error('Unauthorized')
  
  // Only admin/staff can create registrations
  if (profile?.roles?.name === 'customer') {
    throw new Error('Customers cannot create registrations directly')
  }

  // Get registration type and default status
  const [typeResult, statusResult] = await Promise.all([
    supabase.from('registration_types').select('id').eq('code', formData.service_type.toUpperCase()).single(),
    supabase.from('registration_statuses').select('id').eq('code', 'DRAFT').single(),
  ])

  if (!typeResult.data || !statusResult.data) {
    throw new Error('Invalid service type or status')
  }

  const { data, error } = await supabase
    .from('fda_registrations')
    .insert([{
      facility_name: formData.product_name,
      product_description: formData.product_description,
      registration_type_id: typeResult.data.id,
      status_id: statusResult.data.id,
      created_by: user.id,
      company_id: profile?.company_id,
    }])
    .select()

  if (error) throw error
  return data?.[0]
}

export async function updateServiceStatus(serviceId: string, statusCode: string) {
  const { user, profile, supabase } = await getUserWithProfile()
  if (!user) throw new Error('Unauthorized')

  // Only admin/staff can update status
  if (profile?.roles?.name === 'customer') {
    throw new Error('Customers cannot update registration status')
  }

  const { data: status } = await supabase
    .from('registration_statuses')
    .select('id')
    .eq('code', statusCode.toUpperCase())
    .single()

  if (!status) throw new Error('Invalid status')

  const { data, error } = await supabase
    .from('fda_registrations')
    .update({ status_id: status.id, updated_at: new Date().toISOString() })
    .eq('id', serviceId)
    .select()

  if (error) throw error
  return data?.[0]
}

export async function createNotification(title: string, message: string, type: string, registrationId?: string) {
  const { user, supabase } = await getUserWithProfile()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('notifications')
    .insert([{
      user_id: user.id,
      registration_id: registrationId,
      title,
      message,
      type,
      is_read: false,
    }])
    .select()

  if (error) throw error
  return data?.[0]
}

export async function markAllNotificationsAsRead() {
  const { user, supabase } = await getUserWithProfile()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) throw error
}

export async function updateProfile(formData: {
  full_name?: string
  company_name?: string
  phone?: string
}) {
  const { user, supabase } = await getUserWithProfile()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('profiles')
    .update({
      full_name: formData.full_name,
      company_name: formData.company_name,
      phone: formData.phone,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select()

  if (error) throw error
  return data?.[0]
}

export async function getProfile() {
  const { user, supabase } = await getUserWithProfile()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('profiles')
    .select('*, roles(name, display_name), companies(name)')
    .eq('id', user.id)
    .single()

  if (error) throw error
  return data
}

export async function getUserRole() {
  const { user, profile } = await getUserWithProfile()
  if (!user) return null
  
  return {
    role: profile?.roles?.name || 'customer',
    isAdmin: profile?.roles?.name === 'admin',
    isStaff: profile?.roles?.name === 'staff',
    isCustomer: profile?.roles?.name === 'customer',
    canCreateRegistration: profile?.roles?.name === 'admin' || profile?.roles?.name === 'staff',
    canManageUsers: profile?.roles?.name === 'admin',
  }
}
