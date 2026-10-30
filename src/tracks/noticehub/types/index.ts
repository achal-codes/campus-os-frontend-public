export type NoticeStatus = 'active' | 'scheduled' | 'archived'

export interface NoticeAttachment {
  file_id: string
  filename: string
  content_type: string
  size_bytes: number
}

export interface Notice {
  notice_id: string
  title: string
  body: string
  status: NoticeStatus
  pinned: boolean
  publish_at?: string | null
  publisher: string
  publisher_name?: string
  publisher_role?: string
  attachment?: NoticeAttachment | null
  doubts_count?: number
  unanswered_doubts_count?: number
  created_at: string
  updated_at: string
}

export interface Doubt {
  doubt_id: string
  notice_id: string
  question: string
  asked_by: string
  asked_by_name?: string
  asked_at: string
  response?: string | null
  answered_by?: string | null
  answered_by_name?: string | null
  answered_at?: string | null
}

export interface NoticeFilters {
  status?: NoticeStatus | ''
  pinned?: boolean
  mine?: boolean
  limit?: number
  cursor?: string | null
}

export interface PaginatedNotices {
  count: number
  items: Notice[]
  next_cursor: string | null
}

export interface PaginatedDoubts {
  count: number
  items: Doubt[]
  next_cursor: string | null
}
