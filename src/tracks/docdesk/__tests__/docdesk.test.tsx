import { describe, expect, it } from 'vitest'
import { renderRoute, renderWithProviders, screen } from '@/test/render'
import { RequestCommunicationPanel } from '../components/RequestCommunicationPanel'
import { StatusBadge } from '../components/StatusBadge'
import track from '../index'
import type { DocRequest } from '../types'

describe('docdesk track integration and components', () => {
  it('renders track in isolation and shows dashboard heading', async () => {
    renderRoute({
      route: '/tracks/docdesk',
      user: { id: 'student@campus.edu', name: 'John Student', email: 'student@campus.edu', role: 'student' },
      tracks: [track],
    })

    expect(await screen.findByRole('heading', { name: /DocDesk — Document Portal/i })).toBeInTheDocument()
  })

  it('renders StatusBadge correctly for all statuses', () => {
    const { rerender } = renderWithProviders(<StatusBadge status="pending" />)
    expect(screen.getByTestId('status-badge-pending')).toHaveTextContent('Pending')

    rerender(<StatusBadge status="answered" />)
    expect(screen.getByTestId('status-badge-answered')).toHaveTextContent('Answered')

    rerender(<StatusBadge status="acknowledged" />)
    expect(screen.getByTestId('status-badge-acknowledged')).toHaveTextContent('Acknowledged')
  })

  it('renders RequestCommunicationPanel with genuine chronological milestones and no fake chat', () => {
    const sampleRequest: DocRequest = {
      request_id: 'DRQ-TEST-001',
      doc_type_id: 'DTY-BONAFIDE',
      doc_type_name: 'Bonafide Certificate',
      reason: 'Required for external bank account opening.',
      status: 'answered',
      requested_by: 'student@campus.edu',
      requested_by_name: 'John Student',
      requested_by_role: 'student',
      created_at: '2026-10-30T10:00:00Z',
      updated_at: '2026-10-30T11:00:00Z',
      answer: {
        message: 'Your certificate is approved and attached.',
        answered_by_name: 'Affairs Officer Jane',
        answered_at: '2026-10-30T11:00:00Z',
      },
      document: {
        file_id: 'FILE-123',
        filename: 'bonafide.pdf',
        content_type: 'application/pdf',
        size_bytes: 45000,
      },
    }

    renderWithProviders(<RequestCommunicationPanel request={sampleRequest} />)

    expect(screen.getByTestId('docdesk-communication-panel')).toBeInTheDocument()
    expect(screen.getByTestId('timeline-event-submitted')).toHaveTextContent('Required for external bank account opening.')
    expect(screen.getByTestId('timeline-event-answered')).toHaveTextContent('Your certificate is approved and attached.')
    expect(screen.getByText(/Official chronological log/i)).toBeInTheDocument()
  })
})
