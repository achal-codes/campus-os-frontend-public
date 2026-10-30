import { describe, expect, it } from 'vitest'
import { can, type PermissionContext } from '../permissions/permissions'

describe('docdesk permission matrix (can())', () => {
  describe('Student Role', () => {
    const studentCtx: PermissionContext = {
      role: 'student',
      isStudentAffairs: false,
      requestStatus: 'pending',
      isOwner: true,
      hasDocument: true,
      hasFilledForm: true,
    }

    it('can view own document requests, submit new requests, and view document types', () => {
      expect(can('request.read.own', studentCtx)).toBe(true)
      expect(can('request.create', studentCtx)).toBe(true)
      expect(can('docType.read', studentCtx)).toBe(true)
    })

    it('can edit and withdraw own requests while pending, but not when answered/acknowledged or not owner', () => {
      expect(can('request.edit', studentCtx)).toBe(true)
      expect(can('request.withdraw', studentCtx)).toBe(true)

      // Not owner
      expect(can('request.edit', { ...studentCtx, isOwner: false })).toBe(false)
      expect(can('request.withdraw', { ...studentCtx, isOwner: false })).toBe(false)

      // When answered
      expect(can('request.edit', { ...studentCtx, requestStatus: 'answered' })).toBe(false)
      expect(can('request.withdraw', { ...studentCtx, requestStatus: 'answered' })).toBe(false)

      // When acknowledged
      expect(can('request.edit', { ...studentCtx, requestStatus: 'acknowledged' })).toBe(false)
      expect(can('request.withdraw', { ...studentCtx, requestStatus: 'acknowledged' })).toBe(false)
    })

    it('can view answers and download document sent with answer', () => {
      const answeredCtx: PermissionContext = { ...studentCtx, requestStatus: 'answered' }
      expect(can('request.read.detail', answeredCtx)).toBe(true)
      expect(can('document.download', answeredCtx)).toBe(true)
      expect(can('document.download', { ...answeredCtx, hasDocument: false })).toBe(false)
      // Cannot download other students' documents
      expect(can('document.download', { ...answeredCtx, isOwner: false })).toBe(false)
    })

    it('can upload a filled-in form when eligible, download own filled form, and acknowledge answered requests', () => {
      const answeredCtx: PermissionContext = { ...studentCtx, requestStatus: 'answered' }
      expect(can('filledForm.upload', answeredCtx)).toBe(true)
      expect(can('filledForm.download', answeredCtx)).toBe(true)
      expect(can('request.acknowledge', answeredCtx)).toBe(true)

      // Upload ineligible when pending or when staff attached no document
      expect(can('filledForm.upload', { ...answeredCtx, hasDocument: false })).toBe(false)
      expect(can('filledForm.upload', { ...answeredCtx, requestStatus: 'pending' })).toBe(false)

      // Acknowledge ineligible when pending or already acknowledged
      expect(can('request.acknowledge', { ...answeredCtx, requestStatus: 'pending' })).toBe(false)
      expect(can('request.acknowledge', { ...answeredCtx, requestStatus: 'acknowledged' })).toBe(false)
      expect(can('request.acknowledge', { ...answeredCtx, isOwner: false })).toBe(false)
    })

    it('cannot perform staff operations (answer, manage doc types, set TAT, read all requests)', () => {
      expect(can('request.read.all', studentCtx)).toBe(false)
      expect(can('answer.create', studentCtx)).toBe(false)
      expect(can('answer.edit', studentCtx)).toBe(false)
      expect(can('answer.withdraw', studentCtx)).toBe(false)
      expect(can('tat.set.single', studentCtx)).toBe(false)
      expect(can('tat.set.bulk', studentCtx)).toBe(false)
      expect(can('docType.create', studentCtx)).toBe(false)
      expect(can('docType.edit', studentCtx)).toBe(false)
      expect(can('docType.archive', studentCtx)).toBe(false)
      expect(can('docType.restore', studentCtx)).toBe(false)
      expect(can('docType.delete', studentCtx)).toBe(false)
    })
  })

  describe('Faculty Role', () => {
    const facultyCtx: PermissionContext = {
      role: 'faculty',
      isStudentAffairs: false,
      requestStatus: 'pending',
      isOwner: true,
      hasDocument: true,
      hasFilledForm: true,
    }

    it('has identical requester permissions to student', () => {
      expect(can('request.create', facultyCtx)).toBe(true)
      expect(can('request.read.own', facultyCtx)).toBe(true)
      expect(can('request.edit', facultyCtx)).toBe(true)
      expect(can('request.withdraw', facultyCtx)).toBe(true)
      expect(can('docType.read', facultyCtx)).toBe(true)

      const answeredFaculty: PermissionContext = { ...facultyCtx, requestStatus: 'answered' }
      expect(can('document.download', answeredFaculty)).toBe(true)
      expect(can('filledForm.upload', answeredFaculty)).toBe(true)
      expect(can('filledForm.download', answeredFaculty)).toBe(true)
      expect(can('request.acknowledge', answeredFaculty)).toBe(true)

      // Cannot do staff actions
      expect(can('request.read.all', facultyCtx)).toBe(false)
      expect(can('answer.create', facultyCtx)).toBe(false)
      expect(can('docType.create', facultyCtx)).toBe(false)
      expect(can('tat.set.single', facultyCtx)).toBe(false)
    })
  })

  describe('Other Office Staff (Non-Student Affairs)', () => {
    const otherStaffCtx: PermissionContext = {
      role: 'office_staff',
      isStudentAffairs: false,
      requestStatus: 'pending',
      isOwner: true,
      hasDocument: true,
      hasFilledForm: true,
    }

    it('can perform requester actions (submit, view own, edit/withdraw pending, view types)', () => {
      expect(can('request.create', otherStaffCtx)).toBe(true)
      expect(can('request.read.own', otherStaffCtx)).toBe(true)
      expect(can('request.edit', otherStaffCtx)).toBe(true)
      expect(can('request.withdraw', otherStaffCtx)).toBe(true)
      expect(can('docType.read', otherStaffCtx)).toBe(true)
    })

    it('can download own documents, upload/download eligible forms, and acknowledge own requests', () => {
      const answeredOtherStaff: PermissionContext = { ...otherStaffCtx, requestStatus: 'answered' }
      expect(can('request.read.detail', answeredOtherStaff)).toBe(true)
      expect(can('document.download', answeredOtherStaff)).toBe(true)
      expect(can('filledForm.upload', answeredOtherStaff)).toBe(true)
      expect(can('filledForm.download', answeredOtherStaff)).toBe(true)
      expect(can('request.acknowledge', answeredOtherStaff)).toBe(true)
    })

    it('CANNOT answer requests or manage document types or set TAT', () => {
      expect(can('request.read.all', otherStaffCtx)).toBe(false)
      expect(can('answer.create', otherStaffCtx)).toBe(false)
      expect(can('answer.edit', otherStaffCtx)).toBe(false)
      expect(can('answer.withdraw', otherStaffCtx)).toBe(false)
      expect(can('tat.set.single', otherStaffCtx)).toBe(false)
      expect(can('tat.set.bulk', otherStaffCtx)).toBe(false)
      expect(can('docType.create', otherStaffCtx)).toBe(false)
      expect(can('docType.edit', otherStaffCtx)).toBe(false)
      expect(can('docType.archive', otherStaffCtx)).toBe(false)
      expect(can('docType.restore', otherStaffCtx)).toBe(false)
      expect(can('docType.delete', otherStaffCtx)).toBe(false)
    })
  })

  describe('Student Affairs Office Staff', () => {
    const saCtx: PermissionContext = {
      role: 'office_staff',
      isStudentAffairs: true,
      requestStatus: 'pending',
      isOwner: false,
      hasDocument: true,
      hasFilledForm: true,
    }

    it('can submit and manage their own document requests', () => {
      const saOwnerCtx: PermissionContext = { ...saCtx, isOwner: true }
      expect(can('request.create', saOwnerCtx)).toBe(true)
      expect(can('request.read.own', saOwnerCtx)).toBe(true)
      expect(can('request.edit', saOwnerCtx)).toBe(true)
      expect(can('request.withdraw', saOwnerCtx)).toBe(true)

      const answeredOwnerCtx: PermissionContext = { ...saOwnerCtx, requestStatus: 'answered' }
      expect(can('document.download', answeredOwnerCtx)).toBe(true)
      expect(can('request.acknowledge', answeredOwnerCtx)).toBe(true)
    })

    it('can view everyone else requests and individual request details', () => {
      expect(can('request.read.all', saCtx)).toBe(true)
      expect(can('request.read.detail', saCtx)).toBe(true)
    })

    it('can answer pending requests and attach answer documents', () => {
      expect(can('answer.create', saCtx)).toBe(true)
      expect(can('document.upload.answer', saCtx)).toBe(true)
    })

    it('can edit and withdraw answers on answered requests', () => {
      const answeredSACtx: PermissionContext = { ...saCtx, requestStatus: 'answered' }
      expect(can('answer.create', answeredSACtx)).toBe(false)
      expect(can('answer.edit', answeredSACtx)).toBe(true)
      expect(can('answer.withdraw', answeredSACtx)).toBe(true)
      expect(can('document.remove.answer', answeredSACtx)).toBe(true)
    })

    it('can manage document types (create, edit, archive, restore, delete)', () => {
      expect(can('docType.create', saCtx)).toBe(true)
      expect(can('docType.edit', saCtx)).toBe(true)
      expect(can('docType.archive', saCtx)).toBe(true)
      expect(can('docType.restore', saCtx)).toBe(true)
      expect(can('docType.delete', saCtx)).toBe(true)
    })

    it('can set turnaround time for pending requests and in bulk', () => {
      expect(can('tat.set.single', saCtx)).toBe(true)
      expect(can('tat.set.bulk', saCtx)).toBe(true)
      // Cannot set single TAT on answered requests
      expect(can('tat.set.single', { ...saCtx, requestStatus: 'answered' })).toBe(false)
    })

    it('can download documents and filled-in forms across requests (even when not owner)', () => {
      expect(can('document.download', saCtx)).toBe(true)
      expect(can('filledForm.download', saCtx)).toBe(true)
    })

    it('cannot acknowledge requests they do not own', () => {
      const answeredNotOwner: PermissionContext = { ...saCtx, requestStatus: 'answered', isOwner: false }
      expect(can('request.acknowledge', answeredNotOwner)).toBe(false)
    })
  })

  describe('Admin Role (Strictly Read-Only inside DocDesk)', () => {
    const adminCtx: PermissionContext = {
      role: 'admin',
      isStudentAffairs: false,
      requestStatus: 'pending',
      isOwner: false,
      hasDocument: true,
      hasFilledForm: true,
    }

    it('allows read and download operations (even when not owner)', () => {
      expect(can('request.read.all', adminCtx)).toBe(true)
      expect(can('request.read.detail', adminCtx)).toBe(true)
      expect(can('docType.read', adminCtx)).toBe(true)
      expect(can('document.download', adminCtx)).toBe(true)
      expect(can('filledForm.download', adminCtx)).toBe(true)

      // When no document or filled form exists
      expect(can('document.download', { ...adminCtx, hasDocument: false })).toBe(false)
      expect(can('filledForm.download', { ...adminCtx, hasFilledForm: false })).toBe(false)
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
})
