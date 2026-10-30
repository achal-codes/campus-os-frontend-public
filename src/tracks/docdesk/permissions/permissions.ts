import type { Role, RequestStatus } from '../types'

export type PermissionAction =
  | 'request.create' | 'request.read.own' | 'request.read.all'
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

export function can(action: PermissionAction, ctx: PermissionContext): boolean {
  const { role, isStudentAffairs: isSA, requestStatus, isOwner, hasDocument, hasFilledForm } = ctx

  // Admin is strictly read-only across all DocDesk functions: zero mutation controls!
  if (role === 'admin') {
    switch (action) {
      case 'request.read.all':
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

  switch (action) {
    // --- Requests ---
    case 'request.create':
      return true // student, faculty, office_staff can all create requests

    case 'request.read.own':
      return true

    case 'request.read.all':
      return isSA

    case 'request.edit':
      return isOwner === true && requestStatus === 'pending'

    case 'request.withdraw':
      return isOwner === true && requestStatus === 'pending'

    case 'request.acknowledge':
      return isOwner === true && requestStatus === 'answered'

    // --- Answers ---
    case 'answer.create':
      return isSA && requestStatus === 'pending'

    case 'answer.edit':
      return isSA && requestStatus === 'answered'

    case 'answer.withdraw':
      return isSA && requestStatus === 'answered'

    // --- Documents ---
    case 'document.download':
      return (isOwner === true || isSA) && hasDocument === true

    case 'document.upload.answer':
      return isSA && (requestStatus === 'pending' || requestStatus === 'answered')

    case 'document.remove.answer':
      return isSA && requestStatus === 'answered'

    // --- Filled Forms ---
    case 'filledForm.upload':
      return isOwner === true && requestStatus === 'answered' && hasDocument === true

    case 'filledForm.download':
      return (isOwner === true || isSA) && hasFilledForm === true

    case 'filledForm.delete':
      return isOwner === true && requestStatus === 'answered' && hasFilledForm === true

    // --- TAT ---
    case 'tat.set.single':
      return isSA && requestStatus === 'pending'

    case 'tat.set.bulk':
      return isSA

    // --- Doc Types ---
    case 'docType.read':
      return true

    case 'docType.create':
    case 'docType.edit':
    case 'docType.archive':
    case 'docType.restore':
    case 'docType.delete':
      return isSA

    default:
      return false
  }
}
