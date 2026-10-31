import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SetTATModal } from '../components/SetTATModal'
import { BulkTATModal } from '../components/BulkTATModal'
import type { DocRequest } from '../types'

describe('Modal Escape key dismiss (BUG-06)', () => {
  const dummyRequest: DocRequest = {
    request_id: 'DRQ-1234567890123-abcdef01',
    doc_type_id: 'DTY-1',
    doc_type_name: 'Bonafide Certificate',
    reason: 'Application requirement',
    status: 'pending',
    requested_by: 'student@example.com',
    created_at: '2026-10-31T00:00:00Z',
    updated_at: '2026-10-31T00:00:00Z',
  }

  it('closes SetTATModal on Escape keypress', () => {
    const handleClose = vi.fn()
    render(<SetTATModal request={dummyRequest} onClose={handleClose} onSuccess={vi.fn()} />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' })

    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('closes BulkTATModal on Escape keypress', () => {
    const handleClose = vi.fn()
    render(<BulkTATModal requestIds={['DRQ-1']} onClose={handleClose} onSuccess={vi.fn()} />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' })

    expect(handleClose).toHaveBeenCalledTimes(1)
  })
})
