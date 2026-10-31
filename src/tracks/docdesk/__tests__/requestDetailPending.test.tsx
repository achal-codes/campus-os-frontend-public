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

const mockPendingRequest: DocRequest = {
  request_id: 'REQ-PEND-01',
  doc_type_id: 'DTY-BONAFIDE',
  doc_type_name: 'Bonafide Certificate',
  reason: 'Required for external scholarship application deadline.',
  status: 'pending',
  requested_by: 'student@campus.edu',
  requested_by_name: 'John Student',
  requested_by_role: 'student',
  created_at: '2026-10-28T09:30:00Z',
  updated_at: '2026-10-28T09:30:00Z',
}

describe('RequestDetailScreen — Pending State (Screen 3)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(requestsApi.getRequest).mockResolvedValue(mockPendingRequest)
  })

  it('renders pending status, request details, and lifecycle strip', async () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/tracks/docdesk/requests/REQ-PEND-01']}>
        <Routes>
          <Route path="/tracks/docdesk/requests/:id" element={<RequestDetailScreen />} />
          <Route path="/tracks/docdesk/my-requests" element={<div>My Requests Screen</div>} />
        </Routes>
      </MemoryRouter>,
      { user: { id: 'student@campus.edu', name: 'John Student', email: 'student@campus.edu', role: 'student' } },
    )

    expect(await screen.findByRole('heading', { name: 'Request details' })).toBeInTheDocument()
    expect(screen.getByTestId('lifecycle-strip')).toBeInTheDocument()
    expect(screen.getAllByTestId('status-badge-pending')[0]).toHaveTextContent('Pending')
    expect(screen.getAllByText('REQ-PEND-01')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Required for external scholarship application deadline.')[0]).toBeInTheDocument()

    // Edit and Withdraw buttons present for owner
    expect(screen.getByTestId('edit-request-button')).toBeInTheDocument()
    expect(screen.getByTestId('withdraw-request-button')).toBeInTheDocument()
  })

  it('prompts confirmation and withdraws request on withdraw action', async () => {
    vi.mocked(requestsApi.withdrawRequest).mockResolvedValue(undefined as any)

    renderWithProviders(
      <MemoryRouter initialEntries={['/tracks/docdesk/requests/REQ-PEND-01']}>
        <Routes>
          <Route path="/tracks/docdesk/requests/:id" element={<RequestDetailScreen />} />
          <Route path="/tracks/docdesk/my-requests" element={<div>My Requests Screen</div>} />
        </Routes>
      </MemoryRouter>,
      { user: { id: 'student@campus.edu', name: 'John Student', email: 'student@campus.edu', role: 'student' } },
    )

    const withdrawBtn = await screen.findByTestId('withdraw-request-button')
    fireEvent.click(withdrawBtn)

    // Confirm in ConfirmModal
    const modalConfirmBtn = screen.getByRole('dialog').querySelector('button[type="button"].danger, button.danger') ?? screen.getAllByRole('button', { name: 'Withdraw' })[1]
    fireEvent.click(modalConfirmBtn)

    await waitFor(() => {
      expect(requestsApi.withdrawRequest).toHaveBeenCalledWith('REQ-PEND-01')
    })
  })
})
