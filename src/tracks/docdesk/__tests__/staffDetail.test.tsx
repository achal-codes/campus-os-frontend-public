import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { renderWithProviders, screen } from '@/test/render'
import * as requestsApi from '../api/requests'
import { StaffDetailScreen } from '../screens/StaffDetailScreen'
import type { DocRequest } from '../types'

vi.mock('../api/requests')
vi.mock('../hooks/useProfile', () => ({
  useProfile: () => ({
    profile: { dept: 'Student Affairs' },
    isStudentAffairs: true,
    loading: false,
    error: null,
  }),
}))

const mockPending: DocRequest = {
  request_id: 'REQ-STF-01',
  doc_type_id: 'DT-1',
  doc_type_name: 'Bonafide Certificate',
  reason: 'Scholarship proof submission',
  status: 'pending',
  requested_by: 'student@campus.edu',
  requested_by_name: 'John Student',
  requested_by_role: 'student',
  created_at: '2026-10-29T10:00:00Z',
  updated_at: '2026-10-29T10:00:00Z',
}

const mockAnswered: DocRequest = {
  request_id: 'REQ-STF-01',
  doc_type_id: 'DT-1',
  doc_type_name: 'Bonafide Certificate',
  reason: 'Scholarship proof submission',
  status: 'answered',
  requested_by: 'student@campus.edu',
  requested_by_name: 'John Student',
  requested_by_role: 'student',
  created_at: '2026-10-29T10:00:00Z',
  updated_at: '2026-10-29T14:00:00Z',
  answer: {
    message: 'Your request has been approved. The certificate is attached.',
    answered_by: 'staff@campus.edu',
    answered_by_name: 'Staff Jane',
    answered_at: '2026-10-29T14:00:00Z',
  },
}

const mockAcknowledged: DocRequest = {
  ...mockAnswered,
  status: 'acknowledged',
  acknowledged_at: '2026-10-29T16:00:00Z',
}

describe('StaffDetailScreen (Screen 6)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('shows TAT and answer buttons when request is pending', async () => {
    vi.mocked(requestsApi.getRequest).mockResolvedValue(mockPending)

    renderWithProviders(
      <MemoryRouter initialEntries={['/tracks/docdesk/staff/requests/REQ-STF-01']}>
        <Routes>
          <Route path="/tracks/docdesk/staff/requests/:id" element={<StaffDetailScreen />} />
        </Routes>
      </MemoryRouter>,
      { user: { id: 'staff@campus.edu', name: 'Staff Jane', email: 'staff@campus.edu', role: 'office_staff' } },
    )

    expect(await screen.findByTestId('set-tat-button')).toBeInTheDocument()
    expect(screen.getByTestId('answer-request-button')).toBeInTheDocument()
    expect(screen.queryByTestId('edit-answer-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('withdraw-answer-button')).not.toBeInTheDocument()
  })

  it('shows edit and withdraw answer buttons when answered, and withdraw answer reverts request', async () => {
    vi.mocked(requestsApi.getRequest)
      .mockResolvedValueOnce(mockAnswered)
      .mockResolvedValueOnce(mockPending)
    vi.mocked(requestsApi.withdrawAnswer).mockResolvedValue(undefined as any)

    renderWithProviders(
      <MemoryRouter initialEntries={['/tracks/docdesk/staff/requests/REQ-STF-01']}>
        <Routes>
          <Route path="/tracks/docdesk/staff/requests/:id" element={<StaffDetailScreen />} />
        </Routes>
      </MemoryRouter>,
      { user: { id: 'staff@campus.edu', name: 'Staff Jane', email: 'staff@campus.edu', role: 'office_staff' } },
    )

    expect(await screen.findByTestId('edit-answer-button')).toBeInTheDocument()
    const withdrawBtn = screen.getByTestId('withdraw-answer-button')
    expect(withdrawBtn).toBeInTheDocument()
    expect(screen.queryByTestId('set-tat-button')).not.toBeInTheDocument()

    // Trigger withdraw answer
    fireEvent.click(withdrawBtn)

    // Confirm in ConfirmModal
    const modal = screen.getByRole('dialog')
    const confirmBtn = modal.querySelector('button:last-child') as HTMLButtonElement
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(requestsApi.withdrawAnswer).toHaveBeenCalledWith('REQ-STF-01')
    })
  })

  it('hides all mutation controls when request is in terminal acknowledged status', async () => {
    vi.mocked(requestsApi.getRequest).mockResolvedValue(mockAcknowledged)

    renderWithProviders(
      <MemoryRouter initialEntries={['/tracks/docdesk/staff/requests/REQ-STF-01']}>
        <Routes>
          <Route path="/tracks/docdesk/staff/requests/:id" element={<StaffDetailScreen />} />
        </Routes>
      </MemoryRouter>,
      { user: { id: 'staff@campus.edu', name: 'Staff Jane', email: 'staff@campus.edu', role: 'office_staff' } },
    )

    await screen.findByText('Process request: REQ-STF-01')
    expect(screen.queryByTestId('set-tat-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('answer-request-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('edit-answer-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('withdraw-answer-button')).not.toBeInTheDocument()
  })
})
