import { describe, expect, it } from 'vitest'
import { can } from '../permissions/permissions'

describe('docdesk permission matrix (can())', () => {
  describe('Admin Role (Strictly Read-Only)', () => {
    const adminCtx = {
      role: 'admin' as const,
      isStudentAffairs: false,
      requestStatus: 'pending' as const,
      isOwner: false,
      hasDocument: true,
      hasFilledForm: true,
    }

    it('allows read and download operations', () => {
      expect(can('request.read.all', adminCtx)).toBe(true)
      expect(can('docType.read', adminCtx)).toBe(true)
      expect(can('document.download', adminCtx)).toBe(true)
      expect(can('filledForm.download', adminCtx)).toBe(true)
    })

    it('forbids all mutation actions without exception', () => {
      expect(can('request.create', adminCtx)).toBe(false)
      expect(can('request.edit', adminCtx)).toBe(false)
      expect(can('request.withdraw', adminCtx)).toBe(false)
      expect(can('request.acknowledge', adminCtx)).toBe(false)
      expect(can('answer.create', adminCtx)).toBe(false)
      expect(can('answer.edit', adminCtx)).toBe(false)
      expect(can('answer.withdraw', adminCtx)).toBe(false)
      expect(can('document.upload.answer', adminCtx)).toBe(false)
      expect(can('document.remove.answer', adminCtx)).toBe(false)
      expect(can('filledForm.upload', adminCtx)).toBe(false)
      expect(can('filledForm.delete', adminCtx)).toBe(false)
      expect(can('tat.set.single', adminCtx)).toBe(false)
      expect(can('tat.set.bulk', adminCtx)).toBe(false)
      expect(can('docType.create', adminCtx)).toBe(false)
      expect(can('docType.edit', adminCtx)).toBe(false)
      expect(can('docType.archive', adminCtx)).toBe(false)
      expect(can('docType.delete', adminCtx)).toBe(false)
    })
  })

  describe('Requester (Student / Faculty / Non-SA Office Staff)', () => {
    it('allows creating requests', () => {
      expect(can('request.create', { role: 'student', isStudentAffairs: false })).toBe(true)
      expect(can('request.create', { role: 'faculty', isStudentAffairs: false })).toBe(true)
      expect(can('request.create', { role: 'office_staff', isStudentAffairs: false })).toBe(true)
    })

    it('allows editing and withdrawing only own pending requests', () => {
      const pendingOwner = {
        role: 'student' as const,
        isStudentAffairs: false,
        requestStatus: 'pending' as const,
        isOwner: true,
      }
      expect(can('request.edit', pendingOwner)).toBe(true)
      expect(can('request.withdraw', pendingOwner)).toBe(true)

      // Not owner
      expect(can('request.edit', { ...pendingOwner, isOwner: false })).toBe(false)
      expect(can('request.withdraw', { ...pendingOwner, isOwner: false })).toBe(false)

      // Already answered
      expect(can('request.edit', { ...pendingOwner, requestStatus: 'answered' })).toBe(false)
      expect(can('request.withdraw', { ...pendingOwner, requestStatus: 'answered' })).toBe(false)
    })

    it('allows acknowledging only answered own requests', () => {
      const answeredOwner = {
        role: 'student' as const,
        isStudentAffairs: false,
        requestStatus: 'answered' as const,
        isOwner: true,
      }
      expect(can('request.acknowledge', answeredOwner)).toBe(true)

      // If pending or acknowledged
      expect(can('request.acknowledge', { ...answeredOwner, requestStatus: 'pending' })).toBe(false)
      expect(can('request.acknowledge', { ...answeredOwner, requestStatus: 'acknowledged' })).toBe(false)
      // If not owner
      expect(can('request.acknowledge', { ...answeredOwner, isOwner: false })).toBe(false)
    })

    it('allows filled form upload only when answered with an attached document', () => {
      const answeredWithDoc = {
        role: 'student' as const,
        isStudentAffairs: false,
        requestStatus: 'answered' as const,
        isOwner: true,
        hasDocument: true,
      }
      expect(can('filledForm.upload', answeredWithDoc)).toBe(true)

      // If no document attached to answer
      expect(can('filledForm.upload', { ...answeredWithDoc, hasDocument: false })).toBe(false)
      // If pending
      expect(can('filledForm.upload', { ...answeredWithDoc, requestStatus: 'pending' })).toBe(false)
    })
  })

  describe('Student Affairs Operator', () => {
    const saCtx = {
      role: 'office_staff' as const,
      isStudentAffairs: true,
      requestStatus: 'pending' as const,
      isOwner: false,
    }

    it('allows operational queue and queue reading', () => {
      expect(can('request.read.all', saCtx)).toBe(true)
      expect(can('tat.set.single', saCtx)).toBe(true)
      expect(can('tat.set.bulk', saCtx)).toBe(true)
    })

    it('allows answering pending requests', () => {
      expect(can('answer.create', saCtx)).toBe(true)
      expect(can('answer.edit', saCtx)).toBe(false) // not answered yet
    })

    it('allows editing or withdrawing answer on answered requests', () => {
      const answeredCtx = { ...saCtx, requestStatus: 'answered' as const }
      expect(can('answer.create', answeredCtx)).toBe(false)
      expect(can('answer.edit', answeredCtx)).toBe(true)
      expect(can('answer.withdraw', answeredCtx)).toBe(true)
    })

    it('allows managing document types', () => {
      expect(can('docType.create', saCtx)).toBe(true)
      expect(can('docType.edit', saCtx)).toBe(true)
      expect(can('docType.archive', saCtx)).toBe(true)
      expect(can('docType.restore', saCtx)).toBe(true)
      expect(can('docType.delete', saCtx)).toBe(true)
    })
  })
})
