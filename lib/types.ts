export type ServiceType = 'food' | 'cosmetic' | 'medical_device'
export type ServiceStatus = 'pending' | 'in_progress' | 'completed' | 'expired'
export type StageStatus = 'pending' | 'in_progress' | 'completed'
export type DocumentType = 'upload' | 'download'
export type UploadedBy = 'customer' | 'vexim'
export type NotificationType = 'info' | 'warning' | 'success' | 'renewal_reminder'

export interface Role {
  name: string
  display_name: string | null
}

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  company_name: string | null
  phone: string | null
  address: string | null
  created_at: string
  updated_at: string
  roles?: Role | null
}

export interface Service {
  id: string
  user_id: string
  service_type: ServiceType
  product_name: string
  product_description: string | null
  fda_registration_number: string | null
  fda_issue_date: string | null
  fda_expiry_date: string | null
  us_agent_name: string | null
  us_agent_expiry_date: string | null
  status: ServiceStatus
  created_at: string
  updated_at: string
}

export interface PipelineStage {
  id: string
  service_id: string
  stage_number: number
  stage_name: string
  stage_description: string | null
  status: StageStatus
  assigned_to: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  service_id: string
  user_id: string
  stage_id: string | null
  document_name: string
  document_type: DocumentType
  file_url: string
  file_size: number | null
  mime_type: string | null
  uploaded_by: UploadedBy
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  service_id: string | null
  title: string
  message: string
  notification_type: NotificationType
  is_read: boolean
  created_at: string
}

export interface ActivityLog {
  id: string
  user_id: string
  service_id: string | null
  action: string
  description: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

// Service with related data
export interface ServiceWithStages extends Service {
  stages: PipelineStage[]
}

export interface ServiceWithDocuments extends Service {
  documents: Document[]
}

export interface ServiceComplete extends Service {
  stages: PipelineStage[]
  documents: Document[]
}

// Dashboard stats
export interface DashboardStats {
  totalServices: number
  pendingServices: number
  inProgressServices: number
  completedServices: number
  expiringServices: number
  unreadNotifications: number
}

// Default pipeline stages for each service type
export const DEFAULT_FOOD_STAGES = [
  { stage_number: 1, stage_name: 'Tiếp nhận hồ sơ', stage_description: 'Vexim tiếp nhận và kiểm tra hồ sơ ban đầu' },
  { stage_number: 2, stage_name: 'Xử lý nội bộ', stage_description: 'Vexim xử lý hồ sơ và chuẩn bị tài liệu' },
  { stage_number: 3, stage_name: 'Nộp FDA', stage_description: 'Nộp hồ sơ lên FDA' },
  { stage_number: 4, stage_name: 'Chờ FDA phê duyệt', stage_description: 'Chờ FDA xử lý và phê duyệt' },
  { stage_number: 5, stage_name: 'Hoàn thành', stage_description: 'Nhận mã số FDA và hoàn tất đăng ký' },
]

export const DEFAULT_COSMETIC_STAGES = [
  { stage_number: 1, stage_name: 'Tiếp nhận hồ sơ', stage_description: 'Vexim tiếp nhận và kiểm tra hồ sơ ban đầu' },
  { stage_number: 2, stage_name: 'Đánh giá thành phần', stage_description: 'Đánh giá công thức và thành phần sản phẩm' },
  { stage_number: 3, stage_name: 'Chuẩn bị tài liệu', stage_description: 'Chuẩn bị hồ sơ đăng ký theo quy định FDA' },
  { stage_number: 4, stage_name: 'Nộp VCRP', stage_description: 'Đăng ký trên hệ thống VCRP của FDA' },
  { stage_number: 5, stage_name: 'Hoàn thành', stage_description: 'Hoàn tất đăng ký mỹ phẩm' },
]

export const DEFAULT_MEDICAL_DEVICE_STAGES = [
  { stage_number: 1, stage_name: 'Tiếp nhận hồ sơ', stage_description: 'Vexim tiếp nhận và kiểm tra hồ sơ ban đầu' },
  { stage_number: 2, stage_name: 'Phân loại thiết bị', stage_description: 'Xác định phân loại thiết bị y tế (Class I/II/III)' },
  { stage_number: 3, stage_name: 'Chuẩn bị hồ sơ 510(k)', stage_description: 'Chuẩn bị hồ sơ 510(k) nếu cần' },
  { stage_number: 4, stage_name: 'Đăng ký FDA', stage_description: 'Nộp hồ sơ đăng ký thiết bị y tế' },
  { stage_number: 5, stage_name: 'Listing', stage_description: 'Hoàn tất listing thiết bị trên hệ thống FDA' },
  { stage_number: 6, stage_name: 'Hoàn thành', stage_description: 'Nhận xác nhận đăng ký và hoàn tất' },
]

export function getDefaultStages(serviceType: ServiceType) {
  switch (serviceType) {
    case 'food':
      return DEFAULT_FOOD_STAGES
    case 'cosmetic':
      return DEFAULT_COSMETIC_STAGES
    case 'medical_device':
      return DEFAULT_MEDICAL_DEVICE_STAGES
    default:
      return DEFAULT_FOOD_STAGES
  }
}

export function getServiceTypeLabel(type: ServiceType): string {
  switch (type) {
    case 'food':
      return 'Thực phẩm'
    case 'cosmetic':
      return 'Mỹ phẩm'
    case 'medical_device':
      return 'Thiết bị y tế'
    default:
      return type
  }
}

export function getStatusLabel(status: ServiceStatus | StageStatus): string {
  switch (status) {
    case 'pending':
      return 'Chờ xử lý'
    case 'in_progress':
      return 'Đang xử lý'
    case 'completed':
      return 'Hoàn thành'
    case 'expired':
      return 'Hết hạn'
    default:
      return status
  }
}

export function getStatusColor(status: ServiceStatus | StageStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'in_progress':
      return 'bg-blue-100 text-blue-800'
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'expired':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
