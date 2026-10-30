import type { Role, RequestStatus } from '../types'

export type PermissionAction =
  | 'request.create' | 'request.read.own' | 'request.read.all' | 'request.read.detail'
  | 'request.edit' | 'request.withdraw' | 'request.acknowledge'
  | 'answer.create' | 'answer.edit' | 'answer.withdraw'
  | 'document.download' | 'document.upload.answer' | 'document.remove.answer'
  | 'filledForm.upload' | 'filledForm.download' | 'filledForm.delete'
  | 'tat.set.single' | 'tat.set.bulk'
  | 'docType.read' | 'docType.create' | 'docType.edit'
  | 'docType.archive' | 'docType.restore' | 'docType.delete'

export interface PermissionContext {
  role: Role
  isStudentAffairs: boolean
  /** Status of the request being acted upon */
  requestStatus?: RequestStatus
  /** Whether the current user owns the request */
  isOwner?: boolean
  /** Whether the request has an answer document attached */
  hasDocument?: boolean
  /** Whether the request has a filled form */
  hasFilledForm?: boolean
}

/**
 * Central permission engine for DocDesk.
 * Enforces role-based permissions across:
 * - Student
 * - Faculty (identical to Student)
 * - Other Office Staff (requester permissions only; cannot answer or manage doc types)
 * - Student Affairs Office Staff (can manage queue, answer requests, set TAT, manage types, + requester permissions)
 * - Admin (strictly read-only inside DocDesk; cannot mutate requests, types, or TAT)
 */
export function can(action: PermissionAction, ctx: PermissionContext): boolean {
  const { role, isStudentAffairs: isSA, requestStatus, isOwner, hasDocument, hasFilledForm } = ctx

  // Admin is strictly read-only inside DocDesk:
  // Can:
  // - View all DocDesk requests
  // - View individual request details
  // - View document types
  // - Download answer documents
  // - Download filled-in forms
  // Cannot:
  // - Create a document request through DocDesk
  // - Answer requests
  // - Edit or withdraw answers
  // - Set turnaround time
  // - Manage document types
  // - Upload filled-in forms
  // - Acknowledge requests
  if (role === 'admin') {
    switch (action) {
      case 'request.read.all':
      case 'request.read.detail':
        return true
      case 'document.download':
        return hasDocument === true
      case 'filledForm.download':
        return hasFilledForm === true
      case 'docType.read':
        return true
      default:
        return false
    }
  }

  // Student, Faculty, Other Office Staff, and Student Affairs Office Staff
  switch (action) {
    // --- Requests ---
    case 'request.create':
      // Student, faculty, other office staff, and Student Affairs can all submit requests
      return true

    case 'request.read.own':
      // All requesters can view their own document requests
      return true

    case 'request.read.all':
      // Only Student Affairs can view everyone else's requests
      return isSA

    case 'request.read.detail':
      // Owner can view own request details; Student Affairs can view any request details
      return isOwner === true || isSA

    case 'request.edit':
      // Only request owner can edit, and only while pending
      return isOwner === true && requestStatus === 'pending'

    case 'request.withdraw':
      // Only request owner can withdraw, and only while pending
      return isOwner === true && requestStatus === 'pending'

    case 'request.acknowledge':
      // Only request owner can acknowledge their own answered requests
      return isOwner === true && requestStatus === 'answered'

    // --- Answers ---
    case 'answer.create':
      // Only Student Affairs can answer pending requests
      return isSA && requestStatus === 'pending'

    case 'answer.edit':
      // Only Student Affairs can edit answers on answered requests
      return isSA && requestStatus === 'answered'

    case 'answer.withdraw':
      // Only Student Affairs can withdraw answers on answered requests (reverting to pending)
      return isSA && requestStatus === 'answered'

    // --- Documents ---
    case 'document.download':
      // Requesters can download document sent with answer for their own request.
      // Student Affairs can download documents across all requests.
      return (isOwner === true || isSA) && hasDocument === true

    case 'document.upload.answer':
      // Only Student Affairs can attach documents when answering or editing answers
      return isSA && (requestStatus === 'pending' || requestStatus === 'answered')

    case 'document.remove.answer':
      // Only Student Affairs can remove attached document when editing answer
      return isSA && requestStatus === 'answered'

    // --- Filled Forms ---
    case 'filledForm.upload':
      // Only request owner can upload filled-in form, when answered and staff attached a document
      return isOwner === true && requestStatus === 'answered' && hasDocument === true

    case 'filledForm.download':
      // Requester can download their filled-in form. Student Affairs can download filled-in forms across requests.
      return (isOwner === true || isSA) && hasFilledForm === true

    case 'filledForm.delete':
      // Only request owner can remove their filled form, and only before acknowledgement
      return isOwner === true && requestStatus === 'answered' && hasFilledForm === true

    // --- Turnaround Time (TAT) ---
    case 'tat.set.single':
      // Only Student Affairs can set turnaround time for pending requests
      return isSA && requestStatus === 'pending'

    case 'tat.set.bulk':
      // Only Student Affairs can set turnaround time in bulk
      return isSA

    // --- Document Types ---
    case 'docType.read':
      // All roles can view document types
      return true

    case 'docType.create':
    case 'docType.edit':
    case 'docType.archive':
    case 'docType.restore':
    case 'docType.delete':
      // Only Student Affairs can manage document types; Other office staff cannot!
      return isSA

    default:
      return false
  }
}
