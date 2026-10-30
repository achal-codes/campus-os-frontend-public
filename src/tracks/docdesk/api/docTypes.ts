import { apiRequest } from '@/core/api'
import type { DocType, PaginatedResponse, CreateDocTypeBody, EditDocTypeBody } from '../types'

const BASE = '/docdesk/doc-types'

/** List all document types */
export function listDocTypes(): Promise<PaginatedResponse<DocType>> {
  return apiRequest<PaginatedResponse<DocType>>(BASE)
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
