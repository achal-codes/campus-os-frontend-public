import { describe, expect, it } from 'vitest'
import {
  formatFileSize,
  parseContentDisposition,
  sanitiseFilename,
  validateAnswerDocument,
  validateFilledForm,
} from '../utils/files'

describe('file validation and sanitisation utilities', () => {
  it('formats file sizes cleanly', () => {
    expect(formatFileSize(500)).toBe('500 B')
    expect(formatFileSize(2048)).toBe('2.0 KB')
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB')
  })

  describe('validateAnswerDocument', () => {
    it('accepts valid PDF and DOCX files', () => {
      const pdf = new File(['content'], 'transcript.pdf', { type: 'application/pdf' })
      expect(validateAnswerDocument(pdf).valid).toBe(true)

      const docx = new File(['content'], 'certificate.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })
      expect(validateAnswerDocument(docx).valid).toBe(true)
    })

    it('rejects unsupported types like image or text', () => {
      const img = new File(['content'], 'photo.png', { type: 'image/png' })
      expect(validateAnswerDocument(img).valid).toBe(false)
      expect(validateAnswerDocument(img).error).toContain('Only PDF and DOCX')
    })

    it('rejects files larger than 10 MB', () => {
      const oversized = new File(['x'], 'huge.pdf', { type: 'application/pdf' })
      Object.defineProperty(oversized, 'size', { value: 11 * 1024 * 1024 })
      expect(validateAnswerDocument(oversized).valid).toBe(false)
      expect(validateAnswerDocument(oversized).error).toContain('10 MB')
    })
  })

  describe('validateFilledForm', () => {
    it('accepts PDF, DOCX, JPEG, PNG files', () => {
      const pdf = new File(['content'], 'form.pdf', { type: 'application/pdf' })
      expect(validateFilledForm(pdf).valid).toBe(true)

      const jpg = new File(['content'], 'scan.jpg', { type: 'image/jpeg' })
      expect(validateFilledForm(jpg).valid).toBe(true)

      const png = new File(['content'], 'scan.png', { type: 'image/png' })
      expect(validateFilledForm(png).valid).toBe(true)
    })

    it('rejects unsupported formats like zip or exe', () => {
      const zip = new File(['content'], 'archive.zip', { type: 'application/zip' })
      expect(validateFilledForm(zip).valid).toBe(false)
    })
  })

  describe('parseContentDisposition', () => {
    it('parses RFC 5987 encoded filenames (filename*=UTF-8\'\'...)', () => {
      const header = "attachment; filename*=UTF-8''bonafide%20cert.pdf"
      expect(parseContentDisposition(header)).toBe('bonafide cert.pdf')
    })

    it('parses quoted filenames', () => {
      const header = 'attachment; filename="grade_sheet.pdf"'
      expect(parseContentDisposition(header)).toBe('grade_sheet.pdf')
    })

    it('parses unquoted filenames', () => {
      const header = 'attachment; filename=document.docx; size=1024'
      expect(parseContentDisposition(header)).toBe('document.docx')
    })

    it('returns null on empty or missing header', () => {
      expect(parseContentDisposition(null)).toBeNull()
      expect(parseContentDisposition('')).toBeNull()
    })
  })

  describe('sanitiseFilename', () => {
    it('removes directory traversal path separators and leading dots', () => {
      expect(sanitiseFilename('../../etc/passwd')).toBe('_.._etc_passwd')
      expect(sanitiseFilename('.hidden_script.sh')).toBe('hidden_script.sh')
      expect(sanitiseFilename('folder\\subfolder/file.pdf')).toBe('folder_subfolder_file.pdf')
    })

    it('falls back when sanitized name is empty', () => {
      expect(sanitiseFilename('...', 'fallback.pdf')).toBe('fallback.pdf')
    })
  })
})
