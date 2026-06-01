export type UserRole = 'admin' | 'staff' | 'client'
export type ServiceType = 'food' | 'cosmetics' | 'medical_device'
export type PipelineStage = 
  | 'reception_consultation'
  | 'document_collection'
  | 'expert_review'
  | 'fda_registration'
  | 'us_agent_confirmation'
  | 'tracking_update'
  | 'completion_handover'
  | 'renewal_support'
export type DocumentType = 'required' | 'result'
export type DocumentCategory =
  | 'fda_certificate'
  | 'form_3537'
  | 'login_account'
  | 'other_form'
  | 'other'
export type NotificationType = 'info' | 'warning' | 'success' | 'error'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  company_name: string | null
  phone: string | null
  role: UserRole
  avatar_url: string | null
  force_password_change: boolean | null
  created_at: string
  updated_at: string
}

export interface Service {
  id: string
  client_id: string
  assigned_staff_id: string | null
  service_type: ServiceType
  product_name: string
  product_description: string | null
  current_stage: PipelineStage
  fda_code: string | null
  fda_issue_date: string | null
  fda_expiry_date: string | null
  fda_duns_code: string | null
  fda_fei_code: string | null
  us_agent_name: string | null
  us_agent_start_date: string | null
  us_agent_expiry_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined fields
  client?: Profile
  assigned_staff?: Profile
  tasks?: PipelineTask[]
  documents?: Document[]
}

export interface PipelineTask {
  id: string
  service_id: string
  stage: PipelineStage
  title: string
  description: string | null
  is_completed: boolean
  completed_at: string | null
  completed_by: string | null
  sort_order: number
  created_at: string
}

export interface Document {
  id: string
  service_id: string
  uploaded_by: string
  document_type: DocumentType
  category: DocumentCategory | null
  file_name: string
  file_url: string
  file_size: number | null
  mime_type: string | null
  stage: PipelineStage | null
  created_at: string
  // Joined fields
  uploader?: Profile
  service?: Service
}

export interface Notification {
  id: string
  user_id: string
  service_id: string | null
  title: string
  message: string
  notification_type: NotificationType
  is_read: boolean
  read_at: string | null
  created_at: string
  // Joined fields
  service?: Service
}

export interface ActivityLog {
  id: string
  service_id: string
  user_id: string
  action: string
  details: Record<string, unknown> | null
  created_at: string
  // Joined fields
  user?: Profile
  service?: Service
}

export interface NotificationSettings {
  id: string
  user_id: string
  email_service_updates: boolean
  email_document_requests: boolean
  email_renewal_reminders: boolean
  reminder_days_before: number
  created_at: string
  updated_at: string
}

// Helper constants
export const PIPELINE_STAGES: { value: PipelineStage; label: string; description: string }[] = [
  { 
    value: 'reception_consultation', 
    label: 'Tiếp nhận & Tư vấn',
    description: 'Tiếp nhận yêu cầu và tư vấn ban đầu cho khách hàng'
  },
  { 
    value: 'document_collection', 
    label: 'Thu thập Hồ sơ',
    description: 'Thu thập và kiểm tra các tài liệu cần thiết'
  },
  { 
    value: 'expert_review', 
    label: 'Chuyên gia review',
    description: 'Review chuyên gia trong quá trình đăng ký FDA'
  },
  { 
    value: 'fda_registration', 
    label: 'Đăng ký FDA',
    description: 'Nộp hồ sơ và hoàn tất đăng ký FDA'
  },
  { 
    value: 'us_agent_confirmation', 
    label: 'US Agent xác nhận',
    description: 'Xác nhận US Agent và bắt đầu tính thời hạn dịch vụ'
  },
  { 
    value: 'tracking_update', 
    label: 'Theo dõi & Cập nhật',
    description: 'Theo dõi tiến độ và cập nhật thông tin'
  },
  { 
    value: 'completion_handover', 
    label: 'Hoàn tất & Bàn giao',
    description: 'Hoàn tất hồ sơ và bàn giao kết quả'
  },
  { 
    value: 'renewal_support', 
    label: 'Hỗ trợ Gia hạn',
    description: 'Hỗ trợ gia hạn và duy trì đăng ký'
  },
]

// Terminal/end stages accumulate services over time, so they are NOT shown as
// full Kanban columns. They live in a dedicated paginated archive table instead.
export const TERMINAL_STAGES: PipelineStage[] = ['completion_handover', 'renewal_support']

// Active "work in progress" stages shown as Kanban columns.
export const ACTIVE_PIPELINE_STAGES = PIPELINE_STAGES.filter(
  (s) => !TERMINAL_STAGES.includes(s.value),
)

export const TERMINAL_PIPELINE_STAGES = PIPELINE_STAGES.filter((s) =>
  TERMINAL_STAGES.includes(s.value),
)

export const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
  { value: 'food', label: 'Thực phẩm' },
  { value: 'cosmetics', label: 'Mỹ phẩm' },
  { value: 'medical_device', label: 'Thiết bị Y tế' },
]

export const getStageIndex = (stage: PipelineStage): number => {
  return PIPELINE_STAGES.findIndex(s => s.value === stage)
}

export const getStageLabel = (stage: PipelineStage): string => {
  return PIPELINE_STAGES.find(s => s.value === stage)?.label || stage
}

export const getServiceTypeLabel = (type: ServiceType): string => {
  return SERVICE_TYPES.find(t => t.value === type)?.label || type
}

// Document categories used to classify uploaded files
export const DOCUMENT_CATEGORIES: { value: DocumentCategory; label: string }[] = [
  { value: 'fda_certificate', label: 'Chứng nhận FDA' },
  { value: 'form_3537', label: 'Form 3537' },
  { value: 'login_account', label: 'Tài khoản đăng nhập' },
  { value: 'other_form', label: 'Form khác' },
  { value: 'other', label: 'Khác' },
]

export const getDocumentCategoryLabel = (category: DocumentCategory | null | undefined): string => {
  if (!category) return 'Chưa phân loại'
  return DOCUMENT_CATEGORIES.find(c => c.value === category)?.label || 'Khác'
}

// Remove Vietnamese diacritics so keyword matching works on both "chứng nhận"
// and "chung nhan", with or without accents.
function normalizeForMatch(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
}

// Auto-detect the document category from a file name. Falls back to 'other'.
export const detectDocumentCategory = (fileName: string): DocumentCategory => {
  const name = normalizeForMatch(fileName)

  // Form 3537 (incl. 3537a)
  if (/3537/.test(name)) return 'form_3537'

  // Login / account credentials
  if (
    /(login|log-in|account|credential|password|pass-?word|dang ?nhap|tai ?khoan|mat ?khau|\btk\b)/.test(
      name,
    )
  ) {
    return 'login_account'
  }

  // FDA certificate / registration certificate
  if (
    /(certificate|chung ?nhan|cert\b|registration|dang ?ky)/.test(name) ||
    (/fda/.test(name) && /(cert|chung ?nhan|certificate)/.test(name))
  ) {
    return 'fda_certificate'
  }

  // Any other recognizable form
  if (/(form|mau|bieu ?mau)/.test(name)) return 'other_form'

  return 'other'
}
