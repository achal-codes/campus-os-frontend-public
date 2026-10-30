// Roles
export type Role = 'admin' | 'student' | 'faculty' | 'office_staff'

// Request statuses — ONLY these three exist in DocDesk
export type RequestStatus = 'pending' | 'answered' | 'acknowledged'

// Document type statuses
export type DocTypeStatus = 'active' | 'archived'

// Profile from GET /users/me
export interface UserProfile {
  email_id: string
  name: string
  role: Role
  phone_number?: string
  usn?: string        // student only
  dept?: string       // student, office_staff
  designation?: string // faculty, office_staff
}

// TAT nested object
export interface TATInfo {
  expected_by: string  // YYYY-MM-DD
  note?: string | null
  updated_by?: string
  updated_at?: string
}

// File metadata nested object
export interface FileMetadata {
  file_id: string
  filename: string
  content_type: string
  size_bytes: number
  url?: string  // expiring preview URL — do NOT use for authenticated downloads
}

// Answer nested object
export interface Answer {
  message: string
  answered_by?: string
  answered_by_name?: string
  answered_at?: string
  updated_at?: string
}

// Full request object
export interface DocRequest {
  request_id: string
  doc_type_id: string
  doc_type_name?: string
  reason: string
  status: RequestStatus
  requested_by: string
  requested_by_name?: string
  requested_by_role?: Role
  requested_by_dept?: string
  requested_by_phone_number?: string
  created_at: string
  updated_at: string
  tat?: TATInfo | null
  answer?: Answer | null
  document?: FileMetadata | null
  filled_form?: FileMetadata | null
  acknowledged_at?: string | null
}

// Document type
export interface DocType {
  doc_type_id: string
  name: string
  description?: string
  status: DocTypeStatus
  created_by?: string
  created_at?: string
  updated_at?: string
}

// Paginated response envelope
export interface PaginatedResponse<T> {
  items: T[]
  count: number
  next_cursor: string | null
}

// Create request body
export interface CreateRequestBody {
  doc_type_id: string
  reason: string
}

// Edit request body (partial)
export interface EditRequestBody {
  doc_type_id?: string
  reason?: string
}

// Answer body (for JSON-only, message-only answers)
export interface CreateAnswerBody {
  message: string
}

// TAT body
export interface SetTATBody {
  expected_by: string  // YYYY-MM-DD
  note?: string
}

// Bulk TAT body
export interface BulkTATBody {
  request_ids: string[]
  expected_by: string
  note?: string
}

// Create doc type body
export interface CreateDocTypeBody {
  name: string
  description?: string
}

// Edit doc type body
export interface EditDocTypeBody {
  name?: string
  description?: string
  status?: DocTypeStatus
}

// Request list filters
export interface RequestFilters {
  status?: RequestStatus
  doc_type_id?: string
  mine?: boolean
  limit?: number
  cursor?: string | null
}
