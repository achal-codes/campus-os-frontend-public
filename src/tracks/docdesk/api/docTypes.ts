import { apiRequest } from '@/core/api'
import type { DocType, PaginatedResponse, CreateDocTypeBody, EditDocTypeBody } from '../types'

const BASE = '/docdesk/doc-types'

export interface DocTypeFilters {
  status?: 'active' | 'archived' | ''
  limit?: number
  cursor?: string
}

/** List document types with optional status and pagination */
export function listDocTypes(filters: DocTypeFilters = {}): Promise<PaginatedResponse<DocType>> {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.limit) params.set('limit', String(filters.limit))
  if (filters.cursor) params.set('cursor', filters.cursor)
  const qs = params.toString()
  return apiRequest<PaginatedResponse<DocType>>(`${BASE}${qs ? `?${qs}` : ''}`)
}

/** Get a single document type */
export function getDocType(docTypeId: string): Promise<DocType> {
  return apiRequest<DocType>(`${BASE}/${docTypeId}`)
}

/** Create a new document type (Student Affairs only) */
export function createDocType(body: CreateDocTypeBody): Promise<DocType> {
  return apiRequest<DocType>(BASE, { method: 'POST', json: body })
}

/** Edit a document type (Student Affairs only) */
export function editDocType(docTypeId: string, body: EditDocTypeBody): Promise<DocType> {
  return apiRequest<DocType>(`${BASE}/${docTypeId}`, { method: 'PATCH', json: body })
}

/** Delete a document type (Student Affairs only) */
export function deleteDocType(docTypeId: string): Promise<void> {
  return apiRequest<void>(`${BASE}/${docTypeId}`, { method: 'DELETE' })
}
