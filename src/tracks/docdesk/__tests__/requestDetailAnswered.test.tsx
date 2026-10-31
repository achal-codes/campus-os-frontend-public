import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { renderWithProviders, screen } from '@/test/render'
import * as requestsApi from '../api/requests'
import { RequestDetailScreen } from '../screens/RequestDetailScreen'
import type { DocRequest } from '../types'

vi.mock('../api/requests')
vi.mock('../hooks/useProfile', () => ({
  useProfile: () => ({ profile: null, isStudentAffairs: false, loading: false, error: null }),
}))

const mockAnsweredRequestWithDoc: DocRequest = {
  request_id: 'REQ-ANS-01',
  doc_type_id: 'DTY-BONAFIDE',
  doc_type_name: 'Bonafide Certificate',
  reason: 'Need for internship verification.',
  status: 'answered',
  requested_by: 'student@campus.edu',
  requested_by_name: 'John Student',
  requested_by_role: 'student',
  created_at: '2026-10-25T10:00:00Z',
  updated_at: '2026-10-26T14:00:00Z',
  answer: {
    message: 'Please fill and return the attached certificate template.',
    answered_by: 'staff@campus.edu',
    answered_by_name: 'Affairs Officer Jane',
    answered_at: '2026-10-26T14:00:00Z',
  },
  document: {
    file_id: 'FILE-TEMPLATE-01',
    filename: 'bonafide_template.docx',
    content_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size_bytes: 52000,
  },
}

describe('RequestDetailScreen — Answered State (Screen 4)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(requestsApi.getRequest).mockResolvedValue(mockAnsweredRequestWithDoc)
  })

  it('renders answered details, student affairs answer message, document download, and filled-form panel', async () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/tracks/docdesk/requests/REQ-ANS-01']}>
        <Routes>
          <Route path="/tracks/docdesk/requests/:id" element={<RequestDetailScreen />} />
        </Routes>
      </MemoryRouter>,
      { user: { id: 'student@campus.edu', name: 'John Student', email: 'student@campus.edu', role: 'student' } },
    )

    expect(await screen.findByRole('heading', { name: 'Request details' })).toBeInTheDocument()
    expect(screen.getAllByTestId('status-badge-answered')[0]).toHaveTextContent('Answered')

    // Student Affairs answer content
    expect(screen.getAllByText('Affairs Officer Jane')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Please fill and return the attached certificate template.')[0]).toBeInTheDocument()

    // Download button for document
    expect(screen.getByTestId('download-document-button')).toBeInTheDocument()

    // Filled form panel is rendered because request has an attached document
    expect(screen.getByTestId('filled-form-panel')).toBeInTheDocument()

    // Acknowledge receipt button is available
    expect(screen.getByTestId('acknowledge-request-button')).toBeInTheDocument()
  })

  it('acknowledges receipt and updates to terminal status', async () => {
    vi.mocked(requestsApi.acknowledgeRequest).mockResolvedValue({
      ...mockAnsweredRequestWithDoc,
      status: 'acknowledged',
      acknowledged_at: '2026-10-26T15:00:00Z',
    })
    vi.mocked(requestsApi.getRequest)
      .mockResolvedValueOnce(mockAnsweredRequestWithDoc)
      .mockResolvedValueOnce({
        ...mockAnsweredRequestWithDoc,
        status: 'acknowledged',
        acknowledged_at: '2026-10-26T15:00:00Z',
      })

    renderWithProviders(
      <MemoryRouter initialEntries={['/tracks/docdesk/requests/REQ-ANS-01']}>
        <Routes>
          <Route path="/tracks/docdesk/requests/:id" element={<RequestDetailScreen />} />
        </Routes>
      </MemoryRouter>,
      { user: { id: 'student@campus.edu', name: 'John Student', email: 'student@campus.edu', role: 'student' } },
    )

    const ackBtn = await screen.findByTestId('acknowledge-request-button')
    fireEvent.click(ackBtn)

    const modal = screen.getByRole('dialog')
    const confirmBtn = modal.querySelector('button:last-child') as HTMLButtonElement
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(requestsApi.acknowledgeRequest).toHaveBeenCalledWith('REQ-ANS-01')
    })
  })
})
