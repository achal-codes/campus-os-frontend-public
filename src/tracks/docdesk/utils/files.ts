const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

const ANSWER_DOC_EXTENSIONS = ['.pdf', '.docx']
const FILLED_FORM_EXTENSIONS = ['.pdf', '.docx', '.jpg', '.jpeg', '.png']

const ANSWER_DOC_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
]

const FILLED_FORM_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'image/jpeg',
  'image/png',
]

const ANSWER_DOC_ACCEPT = '.pdf,.docx'
const FILLED_FORM_ACCEPT = '.pdf,.docx,.jpg,.jpeg,.png'

export interface FileValidationResult {
  valid: boolean
  error?: string
}

function hasValidExtension(fileName: string, extensions: string[]): boolean {
  const lower = fileName.toLowerCase()
  return extensions.some(ext => lower.endsWith(ext))
}

export function validateAnswerDocument(file: File): FileValidationResult {
  const typeValid = ANSWER_DOC_TYPES.includes(file.type) || hasValidExtension(file.name, ANSWER_DOC_EXTENSIONS)
  if (!typeValid) {
    return { valid: false, error: 'Only PDF and DOCX files are accepted.' }
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File must be smaller than 10 MB.' }
  }
  return { valid: true }
}

export function validateFilledForm(file: File): FileValidationResult {
  const typeValid = FILLED_FORM_TYPES.includes(file.type) || hasValidExtension(file.name, FILLED_FORM_EXTENSIONS)
  if (!typeValid) {
    return { valid: false, error: 'Only PDF, DOCX, JPEG and PNG files are accepted.' }
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File must be smaller than 10 MB.' }
  }
  return { valid: true }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Parse filename from Content-Disposition header */
export function parseContentDisposition(header: string | null): string | null {
  if (!header) return null

  // Try filename*= (RFC 5987) first
  const starMatch = header.match(/filename\*\s*=\s*UTF-8''(.+?)(?:;|$)/i)
  if (starMatch) {
    try {
      return decodeURIComponent(starMatch[1])
    } catch { /* fall through */ }
  }

  // Try quoted filename=
  const quotedMatch = header.match(/filename\s*=\s*"(.+?)"/i)
  if (quotedMatch) return quotedMatch[1]

  // Try unquoted filename=
  const unquotedMatch = header.match(/filename\s*=\s*([^\s;]+)/i)
  if (unquotedMatch) return unquotedMatch[1]

  return null
}

/** Sanitise a filename for safe download */
export function sanitiseFilename(raw: string, fallback = 'docdesk-document'): string {
  let name = raw.replace(/[/\\]/g, '_')

  // Strip control characters (ASCII < 32) without control regex
  name = Array.from(name)
    .filter((ch) => ch.charCodeAt(0) >= 32)
    .join('')
    .replace(/^\.+/, '') // strip leading dots
    .trim()

  if (name.length > 200) {
    const ext = name.lastIndexOf('.')
    if (ext > 0) {
      name = name.slice(0, 196) + name.slice(ext)
    } else {
      name = name.slice(0, 200)
    }
  }

  return name || fallback
}

export { ANSWER_DOC_ACCEPT, FILLED_FORM_ACCEPT, MAX_FILE_SIZE }
