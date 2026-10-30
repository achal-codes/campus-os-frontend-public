import { loadSession, saveSession } from '@/core/auth/session'
import { API_BASE_URL, ApiError } from '@/core/api'
import { parseContentDisposition, sanitiseFilename } from '../utils/files'

const REQUEST_TIMEOUT_MS = 30_000

/**
 * Multipart upload for DocDesk file operations.
 * Only accepts known DocDesk relative paths.
 */
export async function apiUpload<T>(
  path: string,
  formData: FormData,
  method: 'POST' | 'PUT' | 'PATCH' = 'POST',
): Promise<T> {
  assertDocDeskPath(path)

  const headers = new Headers({ Accept: 'application/json' })
  const token = loadSession()?.accessToken
  if (token) headers.set('Authorization', `Bearer ${token}`)
  // Do NOT set Content-Type manually — browser automatically sets multipart/form-data with boundary

  let res: Response
  try {
    res = await fetch(`${API_BASE_URL}/api/v1${path}`, {
      method,
      headers,
      body: formData,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new ApiError(0, 'TIMEOUT', 'The upload took too long. Try again.')
    }
    throw new ApiError(0, 'NETWORK_ERROR', 'Cannot reach the server. Check your connection and try again.')
  }

  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) {
    const e = data?.error
    if (res.status === 401) {
      saveSession(null)
      window.location.assign('/login')
    }
    throw new ApiError(res.status, e?.code ?? 'UNKNOWN', e?.message ?? 'Upload failed. Try again.', e?.details)
  }
  return data as T
}

/**
 * Authenticated binary download.
 * Triggers browser download with proper filename handling.
 */
export async function apiDownload(
  path: string,
  fallbackFilename = 'docdesk-document',
): Promise<void> {
  assertDocDeskPath(path)

  const headers = new Headers()
  const token = loadSession()?.accessToken
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let res: Response
  try {
    res = await fetch(`${API_BASE_URL}/api/v1${path}`, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new ApiError(0, 'TIMEOUT', 'The download took too long. Try again.')
    }
    throw new ApiError(0, 'NETWORK_ERROR', 'Cannot reach the server. Check your connection.')
  }

  if (!res.ok) {
    const data = await res.json().catch(() => null)
    const e = data?.error
    if (res.status === 401) {
      saveSession(null)
      window.location.assign('/login')
    }
    throw new ApiError(res.status, e?.code ?? 'UNKNOWN', e?.message ?? 'Download failed.', e?.details)
  }

  const blob = await res.blob()
  const disposition = res.headers.get('Content-Disposition')
  const parsedName = parseContentDisposition(disposition)
  const filename = sanitiseFilename(parsedName ?? fallbackFilename, fallbackFilename)

  const url = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Only allow known DocDesk paths */
function assertDocDeskPath(path: string): void {
  if (!path.startsWith('/docdesk/')) {
    throw new Error(`apiUpload/apiDownload only accepts /docdesk/ paths, got: ${path}`)
  }
}
