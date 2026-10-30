import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { renderWithProviders, screen } from '@/test/render'
import * as requestsApi from '../api/requests'
import { BulkTATScreen } from '../screens/BulkTATScreen'
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

const mockPending: DocRequest[] = [
  {
    request_id: 'REQ-BULK-01',
    doc_type_id: 'DT-1',
    doc_type_name: 'Bonafide Certificate',
    reason: 'Application 1',
    status: 'pending',
    requested_by: 's1@campus.edu',
    requested_by_name: 'Student 1',
    requested_by_role: 'student',
    created_at: '2026-10-30T10:00:00Z',
    updated_at: '2026-10-30T10:00:00Z',
  },
  {
    request_id: 'REQ-BULK-02',
    doc_type_id: 'DT-1',
    doc_type_name: 'Bonafide Certificate',
    reason: 'Application 2',
    status: 'pending',
    requested_by: 's2@campus.edu',
    requested_by_name: 'Student 2',
    requested_by_role: 'student',
    created_at: '2026-10-30T11:00:00Z',
    updated_at: '2026-10-30T11:00:00Z',
  },
]

describe('BulkTATScreen (Screen 8)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('renders pending requests and handles bulk selection', async () => {
    vi.mocked(requestsApi.listRequests).mockResolvedValue({ items: mockPending, next_cursor: null })

    renderWithProviders(
      <MemoryRouter>
        <BulkTATScreen />
      </MemoryRouter>,
      { user: { id: 'staff@campus.edu', name: 'Staff Jane', email: 'staff@campus.edu', role: 'office_staff' } },
    )

    expect(await screen.findByRole('heading', { name: /Set turnaround time/i })).toBeInTheDocument()
    expect(screen.getByText('REQ-BULK-01')).toBeInTheDocument()
    expect(screen.getByText('REQ-BULK-02')).toBeInTheDocument()

    // Select All button
    const selectAllBtn = screen.getByTestId('bulk-select-all-button')
    fireEvent.click(selectAllBtn)

    expect(screen.getByText(/2 of 100 selected/i)).toBeInTheDocument()
  })

  it('displays atomic error message when bulk submission fails', async () => {
    vi.mocked(requestsApi.listRequests).mockResolvedValue({ items: mockPending, next_cursor: null })
    vi.mocked(requestsApi.setBulkTAT).mockRejectedValue(
      new Error('Request REQ-BULK-02 is no longer pending and cannot have TAT set.'),
    )

    renderWithProviders(
      <MemoryRouter>
        <BulkTATScreen />
      </MemoryRouter>,
      { user: { id: 'staff@campus.edu', name: 'Staff Jane', email: 'staff@campus.edu', role: 'office_staff' } },
    )

    const selectAllBtn = await screen.findByTestId('bulk-select-all-button')
    fireEvent.click(selectAllBtn)

    const submitBtn = screen.getByTestId('apply-bulk-tat-button')
    fireEvent.click(submitBtn)

    expect(await screen.findByText(/No requests were updated: Request REQ-BULK-02 is no longer pending/i)).toBeInTheDocument()
  })

  it('renders empty state when no pending requests exist', async () => {
    vi.mocked(requestsApi.listRequests).mockResolvedValue({ items: [], next_cursor: null })

    renderWithProviders(
      <MemoryRouter>
        <BulkTATScreen />
      </MemoryRouter>,
      { user: { id: 'staff@campus.edu', name: 'Staff Jane', email: 'staff@campus.edu', role: 'office_staff' } },
    )

    expect(await screen.findByText(/No pending document requests currently requiring TAT assignment/i)).toBeInTheDocument()
  })
})
