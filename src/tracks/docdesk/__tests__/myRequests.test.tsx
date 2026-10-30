import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { renderWithProviders, screen } from '@/test/render'
import * as docTypesApi from '../api/docTypes'
import * as requestsApi from '../api/requests'
import { MyRequestsScreen } from '../screens/MyRequestsScreen'
import type { DocRequest, DocType } from '../types'

vi.mock('../api/docTypes')
vi.mock('../api/requests')
vi.mock('../hooks/useProfile', () => ({
  useProfile: () => ({ profile: null, loading: false, error: null }),
}))

const mockDocTypes: DocType[] = [
  { doc_type_id: 'DT-1', name: 'Bonafide Certificate', status: 'active', created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' },
  { doc_type_id: 'DT-2', name: 'Transcript', status: 'active', created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' },
]

const mockRequests: DocRequest[] = [
  {
    request_id: 'REQ-001',
    doc_type_id: 'DT-1',
    doc_type_name: 'Bonafide Certificate',
    reason: 'Bank loan application process requirement',
    status: 'pending',
    requested_by: 'student@campus.edu',
    requested_by_name: 'John Student',
    requested_by_role: 'student',
    created_at: '2026-10-25T10:00:00Z',
    updated_at: '2026-10-25T10:00:00Z',
  },
  {
    request_id: 'REQ-002',
    doc_type_id: 'DT-2',
    doc_type_name: 'Transcript',
    reason: 'Applying for master degree admission',
    status: 'answered',
    requested_by: 'student@campus.edu',
    requested_by_name: 'John Student',
    requested_by_role: 'student',
    created_at: '2026-10-20T10:00:00Z',
    updated_at: '2026-10-22T10:00:00Z',
  },
  {
    request_id: 'REQ-003',
    doc_type_id: 'DT-1',
    doc_type_name: 'Bonafide Certificate',
    reason: 'Visa verification embassy letter',
    status: 'acknowledged',
    requested_by: 'student@campus.edu',
    requested_by_name: 'John Student',
    requested_by_role: 'student',
    created_at: '2026-10-15T10:00:00Z',
    updated_at: '2026-10-18T10:00:00Z',
  },
]

describe('MyRequestsScreen', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(docTypesApi.listDocTypes).mockResolvedValue({ items: mockDocTypes, next_cursor: null })
  })

  it('renders wireframe copy, table headers, and all 3 request statuses', async () => {
    vi.mocked(requestsApi.listRequests).mockResolvedValue({ items: mockRequests, next_cursor: null })

    renderWithProviders(
      <MemoryRouter>
        <MyRequestsScreen />
      </MemoryRouter>,
      { user: { id: 'student@campus.edu', name: 'John Student', email: 'student@campus.edu', role: 'student' } },
    )

    expect(await screen.findByRole('heading', { name: 'My requests' })).toBeInTheDocument()
    expect(screen.getByText('Track the status of your document requests.')).toBeInTheDocument()
    expect(screen.getByText('New request')).toBeInTheDocument()

    // Assert rows
    expect(await screen.findByText('REQ-001')).toBeInTheDocument()
    expect(screen.getByText('REQ-002')).toBeInTheDocument()
    expect(screen.getByText('REQ-003')).toBeInTheDocument()

    // Status badges
    expect(screen.getAllByTestId('status-badge-pending')[0]).toHaveTextContent('Pending')
    expect(screen.getAllByTestId('status-badge-answered')[0]).toHaveTextContent('Answered')
    expect(screen.getAllByTestId('status-badge-acknowledged')[0]).toHaveTextContent('Acknowledged')
  })

  it('shows empty state when no requests exist', async () => {
    vi.mocked(requestsApi.listRequests).mockResolvedValue({ items: [], next_cursor: null })

    renderWithProviders(
      <MemoryRouter>
        <MyRequestsScreen />
      </MemoryRouter>,
      { user: { id: 'student@campus.edu', name: 'John Student', email: 'student@campus.edu', role: 'student' } },
    )

    expect(await screen.findByText("No requests found. Click 'New request' to get started.")).toBeInTheDocument()
  })

  it('shows error state when request loading fails', async () => {
    vi.mocked(requestsApi.listRequests).mockRejectedValue(new Error('Network error: server unreachable'))

    renderWithProviders(
      <MemoryRouter>
        <MyRequestsScreen />
      </MemoryRouter>,
      { user: { id: 'student@campus.edu', name: 'John Student', email: 'student@campus.edu', role: 'student' } },
    )

    expect(await screen.findByText('Network error: server unreachable')).toBeInTheDocument()
  })

  it('handles pagination via Load more button when next_cursor is present', async () => {
    vi.mocked(requestsApi.listRequests)
      .mockResolvedValueOnce({ items: [mockRequests[0]], next_cursor: 'cursor-page-2' })
      .mockResolvedValueOnce({ items: [mockRequests[1]], next_cursor: null })

    renderWithProviders(
      <MemoryRouter>
        <MyRequestsScreen />
      </MemoryRouter>,
      { user: { id: 'student@campus.edu', name: 'John Student', email: 'student@campus.edu', role: 'student' } },
    )

    expect(await screen.findByText('REQ-001')).toBeInTheDocument()
    const loadMoreBtn = screen.getByRole('button', { name: /Load more/i })
    expect(loadMoreBtn).toBeInTheDocument()

    fireEvent.click(loadMoreBtn)

    await waitFor(() => {
      expect(requestsApi.listRequests).toHaveBeenCalledWith(
        expect.objectContaining({ cursor: 'cursor-page-2' }),
      )
    })
    expect(await screen.findByText('REQ-002')).toBeInTheDocument()
  })
})
