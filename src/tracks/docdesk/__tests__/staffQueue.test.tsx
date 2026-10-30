import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { renderWithProviders, screen } from '@/test/render'
import * as docTypesApi from '../api/docTypes'
import * as requestsApi from '../api/requests'
import { StaffQueueScreen } from '../screens/StaffQueueScreen'
import type { DocRequest, DocType } from '../types'

vi.mock('../api/docTypes')
vi.mock('../api/requests')
vi.mock('../hooks/useProfile', () => ({
  useProfile: () => ({
    profile: { dept: 'Student Affairs' },
    isStudentAffairs: true,
    loading: false,
    error: null,
  }),
}))

const mockTypes: DocType[] = [
  { doc_type_id: 'DT-1', name: 'Bonafide Certificate', status: 'active', created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' },
]

const mockQueue: DocRequest[] = [
  {
    request_id: 'REQ-PENDING-01',
    doc_type_id: 'DT-1',
    doc_type_name: 'Bonafide Certificate',
    reason: 'Passport renewal urgency',
    status: 'pending',
    requested_by: 'student1@campus.edu',
    requested_by_name: 'Alice Student',
    requested_by_role: 'student',
    created_at: '2026-10-27T08:00:00Z',
    updated_at: '2026-10-27T08:00:00Z',
  },
  {
    request_id: 'REQ-ANSWERED-02',
    doc_type_id: 'DT-1',
    doc_type_name: 'Bonafide Certificate',
    reason: 'Visa application submission',
    status: 'answered',
    requested_by: 'student2@campus.edu',
    requested_by_name: 'Bob Student',
    requested_by_role: 'student',
    created_at: '2026-10-25T08:00:00Z',
    updated_at: '2026-10-26T08:00:00Z',
  },
]

describe('StaffQueueScreen (Screen 5)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(docTypesApi.listDocTypes).mockResolvedValue({ items: mockTypes, next_cursor: null })
    vi.mocked(requestsApi.listRequests).mockResolvedValue({ items: mockQueue, next_cursor: null })
  })

  it('renders queue rows and enforces selection checkbox only on pending requests', async () => {
    renderWithProviders(
      <MemoryRouter>
        <StaffQueueScreen />
      </MemoryRouter>,
      { user: { id: 'staff@campus.edu', name: 'Staff Jane', email: 'staff@campus.edu', role: 'office_staff' } },
    )

    expect(await screen.findByRole('heading', { name: 'Document requests' })).toBeInTheDocument()
    expect(screen.getByText('REQ-PENDING-01')).toBeInTheDocument()
    expect(screen.getByText('REQ-ANSWERED-02')).toBeInTheDocument()

    // Row 1 (pending): checkbox enabled
    const pendingCheckbox = screen.getAllByLabelText('Select REQ-PENDING-01')[0] as HTMLInputElement
    expect(pendingCheckbox).not.toBeDisabled()

    // Row 2 (answered): checkbox disabled
    const answeredCheckbox = screen.getAllByLabelText('Select REQ-ANSWERED-02')[0] as HTMLInputElement
    expect(answeredCheckbox).toBeDisabled()
  })

  it('toggles selection and displays floating bulk action bar with clear action', async () => {
    renderWithProviders(
      <MemoryRouter>
        <StaffQueueScreen />
      </MemoryRouter>,
      { user: { id: 'staff@campus.edu', name: 'Staff Jane', email: 'staff@campus.edu', role: 'office_staff' } },
    )

    await screen.findByText('REQ-PENDING-01')
    const pendingCheckbox = screen.getAllByLabelText('Select REQ-PENDING-01')[0]
    expect(screen.queryByTestId('bulk-tat-button')).not.toBeInTheDocument()

    // Select row
    fireEvent.click(pendingCheckbox)
    expect(screen.getByTestId('bulk-tat-button')).toBeInTheDocument()
    expect(screen.getByText(/1 selected/i)).toBeInTheDocument()

    // Click Clear selection
    const clearBtn = screen.getByTestId('clear-selection-button')
    fireEvent.click(clearBtn)

    expect(screen.queryByTestId('bulk-tat-button')).not.toBeInTheDocument()
  })
})
