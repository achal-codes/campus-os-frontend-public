import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { renderWithProviders, screen } from '@/test/render'
import * as docTypesApi from '../api/docTypes'
import * as requestsApi from '../api/requests'
import { RequestFormScreen } from '../screens/RequestFormScreen'
import type { DocType } from '../types'

vi.mock('../api/docTypes')
vi.mock('../api/requests')
vi.mock('../hooks/useProfile', () => ({
  useProfile: () => ({ profile: null, loading: false, error: null }),
}))

const mockDocTypes: DocType[] = [
  { doc_type_id: 'DT-ACTIVE-1', name: 'Bonafide Certificate', status: 'active', created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' },
  { doc_type_id: 'DT-ARCHIVED-1', name: 'Legacy Internship NOC', status: 'archived', created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' },
]

describe('RequestFormScreen', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(docTypesApi.listDocTypes).mockResolvedValue({ count: mockDocTypes.length, items: mockDocTypes, next_cursor: null })
  })

  it('renders wireframe copy, filters out archived types, and has no file upload input', async () => {
    renderWithProviders(
      <MemoryRouter>
        <RequestFormScreen />
      </MemoryRouter>,
      { user: { id: 's1@campus.edu', name: 'Student One', email: 's1@campus.edu', role: 'student' } },
    )

    expect(await screen.findByRole('heading', { name: 'Request a document' })).toBeInTheDocument()
    expect(screen.getByText('Submit a request for bonafide certificates, transcripts, or official letters.')).toBeInTheDocument()

    // Assert archived types are excluded
    const select = screen.getByTestId('doctype-select')
    expect(select).toBeInTheDocument()
    expect(screen.getByText('Bonafide Certificate')).toBeInTheDocument()
    expect(screen.queryByText('Legacy Internship NOC')).not.toBeInTheDocument()

    // Assert NO file attachment input exists (Wireframe Screen 2 compliance)
    const fileInputs = document.querySelectorAll('input[type="file"]')
    expect(fileInputs.length).toBe(0)
  })

  it('validates reason length and enables submission only when valid', async () => {
    vi.mocked(requestsApi.createRequest).mockResolvedValue({
      request_id: 'REQ-NEW-123',
      doc_type_id: 'DT-ACTIVE-1',
      doc_type_name: 'Bonafide Certificate',
      reason: 'Valid reason of sufficient length',
      status: 'pending',
      requested_by: 's1@campus.edu',
      requested_by_name: 'Student One',
      requested_by_role: 'student',
      created_at: '2026-10-31T00:00:00Z',
      updated_at: '2026-10-31T00:00:00Z',
    })

    renderWithProviders(
      <MemoryRouter>
        <RequestFormScreen />
      </MemoryRouter>,
      { user: { id: 's1@campus.edu', name: 'Student One', email: 's1@campus.edu', role: 'student' } },
    )

    const textarea = await screen.findByTestId('request-reason-input')
    const submitBtn = screen.getByTestId('submit-request-button')

    // Empty or short reason (< 5 chars) keeps submit disabled
    fireEvent.change(textarea, { target: { value: 'abc' } })
    expect(submitBtn).toBeDisabled()

    // Valid reason (>= 5 chars)
    fireEvent.change(textarea, { target: { value: 'Required for external bank account opening process' } })
    expect(submitBtn).not.toBeDisabled()

    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(requestsApi.createRequest).toHaveBeenCalledWith({
        doc_type_id: 'DT-ACTIVE-1',
        reason: 'Required for external bank account opening process',
      })
    })
  })
})
