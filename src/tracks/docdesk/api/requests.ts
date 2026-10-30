import { apiRequest } from '@/core/api'
import type {
  DocRequest, PaginatedResponse, CreateRequestBody,
  EditRequestBody, CreateAnswerBody, SetTATBody, BulkTATBody,
  RequestFilters,
} from '../types'
import { apiUpload, apiDownload } from './http'

const BASE = '/docdesk/requests'

/** List requests with filters and cursor pagination */
export function listRequests(filters: RequestFilters = {}): Promise<PaginatedResponse<DocRequest>> {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.doc_type_id) params.set('doc_type_id', filters.doc_type_id)
  if (filters.mine) params.set('mine', 'true')
  if (filters.limit) params.set('limit', String(filters.limit))
  if (filters.cursor) params.set('cursor', filters.cursor)
  const qs = params.toString()
  return apiRequest<PaginatedResponse<DocRequest>>(`${BASE}${qs ? `?${qs}` : ''}`)
}

/** Get a single request by ID */
export function getRequest(requestId: string): Promise<DocRequest> {
  return apiRequest<DocRequest>(`${BASE}/${requestId}`)
}

/** Create a new request */
export function createRequest(body: CreateRequestBody): Promise<DocRequest> {
  return apiRequest<DocRequest>(BASE, { method: 'POST', json: body })
}

/** Edit a pending request */
export function editRequest(requestId: string, body: EditRequestBody): Promise<DocRequest> {
  return apiRequest<DocRequest>(`${BASE}/${requestId}`, { method: 'PATCH', json: body })
}

/** Withdraw (delete) a pending request */
export function withdrawRequest(requestId: string): Promise<void> {
  return apiRequest<void>(`${BASE}/${requestId}`, { method: 'DELETE' })
}

/** Create an answer (message-only JSON) */
export function createAnswerMessage(requestId: string, body: CreateAnswerBody): Promise<DocRequest> {
  return apiRequest<DocRequest>(`${BASE}/${requestId}/answer`, { method: 'POST', json: body })
}

/** Create an answer with optional document (multipart/form-data) */
export function createAnswer(requestId: string, message: string, document?: File): Promise<DocRequest> {
  if (!document) {
    return createAnswerMessage(requestId, { message })
  }
  const form = new FormData()
  form.append('message', message)
  form.append('document', document)
  return apiUpload<DocRequest>(`${BASE}/${requestId}/answer`, form, 'POST')
}

/** Edit an answer (multipart) */
export function editAnswer(
  requestId: string,
  opts: { message?: string; document?: File; remove_document?: boolean },
): Promise<DocRequest> {
  const form = new FormData()
  if (opts.message !== undefined) form.append('message', opts.message)
  if (opts.document) form.append('document', opts.document)
  if (opts.remove_document) form.append('remove_document', 'true')
  return apiUpload<DocRequest>(`${BASE}/${requestId}/answer`, form, 'PATCH')
}

/** Withdraw an answer (reverts request to pending) */
export function withdrawAnswer(requestId: string): Promise<void> {
  return apiRequest<void>(`${BASE}/${requestId}/answer`, { method: 'DELETE' })
}

/** Acknowledge an answered request */
export function acknowledgeRequest(requestId: string): Promise<DocRequest> {
  return apiRequest<DocRequest>(`${BASE}/${requestId}/acknowledge`, { method: 'POST' })
}

/** Download answer document */
export function downloadDocument(requestId: string): Promise<void> {
  return apiDownload(`/docdesk/requests/${requestId}/document`)
}

/** Upload filled form */
export function uploadFilledForm(requestId: string, file: File): Promise<DocRequest> {
  const form = new FormData()
  // Supply both field aliases so backend binding succeeds regardless of 'file' vs 'filled_form' param name
  form.append('file', file)
  form.append('filled_form', file)
  return apiUpload<DocRequest>(`/docdesk/requests/${requestId}/filled-form`, form, 'PUT')
}

/** Download filled form */
export function downloadFilledForm(requestId: string): Promise<void> {
  return apiDownload(`/docdesk/requests/${requestId}/filled-form`)
}

/** Delete filled form */
export function deleteFilledForm(requestId: string): Promise<void> {
  return apiRequest<void>(`${BASE}/${requestId}/filled-form`, { method: 'DELETE' })
}

/** Set TAT for a single request */
export function setTAT(requestId: string, body: SetTATBody): Promise<DocRequest> {
  return apiRequest<DocRequest>(`${BASE}/${requestId}/tat`, { method: 'PUT', json: body })
}

/** Set TAT for multiple requests in bulk */
export function setBulkTAT(body: BulkTATBody): Promise<void> {
  return apiRequest<void>(`${BASE}/bulk-tat`, { method: 'POST', json: body })
}
