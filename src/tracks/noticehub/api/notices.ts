import { API_BASE_URL, ApiError, apiRequest } from '@/core/api'
import { loadSession, saveSession } from '@/core/auth/session'
import type {
  Doubt,
  Notice,
  NoticeFilters,
  PaginatedDoubts,
  PaginatedNotices,
} from '../types'

const BASE = '/noticehub'

export function listNotices(filters: NoticeFilters = {}): Promise<PaginatedNotices> {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.pinned !== undefined) params.set('pinned', String(filters.pinned))
  if (filters.mine) params.set('mine', 'true')
  if (filters.limit) params.set('limit', String(filters.limit))
  if (filters.cursor) params.set('cursor', filters.cursor)
  const qs = params.toString()
  return apiRequest<PaginatedNotices>(`${BASE}/notices${qs ? `?${qs}` : ''}`)
}

export function getNotice(noticeId: string): Promise<Notice> {
  return apiRequest<Notice>(`${BASE}/notices/${noticeId}`)
}

export async function createNotice(formData: FormData): Promise<Notice> {
  return uploadNoticeFormData(`${BASE}/notices`, formData, 'POST')
}

export async function editNotice(noticeId: string, formData: FormData): Promise<Notice> {
  return uploadNoticeFormData(`${BASE}/notices/${noticeId}`, formData, 'PATCH')
}

export function deleteNotice(noticeId: string): Promise<void> {
  return apiRequest<void>(`${BASE}/notices/${noticeId}`, { method: 'DELETE' })
}

export async function downloadNoticeAttachment(noticeId: string, fallbackName = 'notice-attachment'): Promise<void> {
  const token = loadSession()?.accessToken
  const headers = new Headers()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${API_BASE_URL}/api/v1${BASE}/notices/${noticeId}/attachment`, { headers })
  if (!res.ok) {
    throw new ApiError(res.status, 'DOWNLOAD_FAILED', 'Failed to download attachment.')
  }

  const blob = await res.blob()
  const disposition = res.headers.get('Content-Disposition')
  let filename = fallbackName
  if (disposition) {
    const match = disposition.match(/filename=["']?([^"';]+)["']?/i)
    if (match?.[1]) filename = match[1].trim()
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export function listDoubts(noticeId: string, answered?: boolean): Promise<PaginatedDoubts> {
  const params = new URLSearchParams()
  if (answered !== undefined) params.set('answered', String(answered))
  const qs = params.toString()
  return apiRequest<PaginatedDoubts>(`${BASE}/notices/${noticeId}/doubts${qs ? `?${qs}` : ''}`)
}

export function askDoubt(noticeId: string, question: string): Promise<Doubt> {
  return apiRequest<Doubt>(`${BASE}/notices/${noticeId}/doubts`, {
    method: 'POST',
    json: { question },
  })
}

export function editDoubt(doubtId: string, question: string): Promise<Doubt> {
  return apiRequest<Doubt>(`${BASE}/doubts/${doubtId}`, {
    method: 'PATCH',
    json: { question },
  })
}

export function deleteDoubt(doubtId: string): Promise<void> {
  return apiRequest<void>(`${BASE}/doubts/${doubtId}`, { method: 'DELETE' })
}

export function respondDoubt(doubtId: string, response: string): Promise<Doubt> {
  return apiRequest<Doubt>(`${BASE}/doubts/${doubtId}/response`, {
    method: 'POST',
    json: { response },
  })
}

export function editDoubtResponse(doubtId: string, response: string): Promise<Doubt> {
  return apiRequest<Doubt>(`${BASE}/doubts/${doubtId}/response`, {
    method: 'PATCH',
    json: { response },
  })
}

async function uploadNoticeFormData<T>(path: string, formData: FormData, method: 'POST' | 'PATCH'): Promise<T> {
  const headers = new Headers({ Accept: 'application/json' })
  const token = loadSession()?.accessToken
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${API_BASE_URL}/api/v1${path}`, {
    method,
    headers,
    body: formData,
  })

  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) {
    const e = data?.error
    if (res.status === 401) {
      saveSession(null)
      window.location.assign('/login')
    }
    throw new ApiError(res.status, e?.code ?? 'UNKNOWN', e?.message ?? 'Failed to submit notice.', e?.details)
  }
  return data as T
}
