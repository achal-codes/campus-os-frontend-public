import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createAnswer } from '../api/requests'
import * as httpModule from '../api/http'

describe('createAnswer API contract (BUG-01)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('always uses multipart/form-data (FormData) even when document is omitted', async () => {
    const mockUpload = vi.spyOn(httpModule, 'apiUpload').mockResolvedValue({
      request_id: 'DRQ-1234567890123-abcdef01',
      doc_type_id: 'DTY-1',
      doc_type_name: 'Bonafide',
      reason: 'Scholarship',
      status: 'answered',
      requested_by: 'student@example.com',
      created_at: '2026-10-31T00:00:00Z',
      updated_at: '2026-10-31T00:00:00Z',
    } as any)

    await createAnswer('DRQ-1234567890123-abcdef01', 'Your certificate is ready for collection.')

    expect(mockUpload).toHaveBeenCalledTimes(1)
    const [path, formData, method] = mockUpload.mock.calls[0]
    expect(path).toBe('/docdesk/requests/DRQ-1234567890123-abcdef01/answer')
    expect(method).toBe('POST')
    expect(formData).toBeInstanceOf(FormData)
    expect(formData.get('message')).toBe('Your certificate is ready for collection.')
    expect(formData.get('document')).toBeNull()
  })
})
