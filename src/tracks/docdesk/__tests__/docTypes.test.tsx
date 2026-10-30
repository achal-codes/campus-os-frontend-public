import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { renderWithProviders, screen } from '@/test/render'
import * as docTypesApi from '../api/docTypes'
import { DocTypeManagerScreen } from '../screens/DocTypeManagerScreen'
import type { DocType } from '../types'

vi.mock('../api/docTypes')
vi.mock('../hooks/useProfile', () => ({
  useProfile: () => ({
    profile: { dept: 'Student Affairs' },
    isStudentAffairs: true,
    loading: false,
    error: null,
  }),
}))

const mockTypes: DocType[] = [
  { doc_type_id: 'DT-ACT-1', name: 'Bonafide Certificate', description: 'Proof of study', status: 'active', created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' },
  { doc_type_id: 'DT-ARC-1', name: 'Old Library Pass', description: 'Archived physical pass', status: 'archived', created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z' },
]

describe('DocTypeManagerScreen (Screen 7)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(docTypesApi.listDocTypes).mockResolvedValue({ items: mockTypes, next_cursor: null })
  })

  it('renders wireframe copy, active list, and switches to archived tab', async () => {
    renderWithProviders(
      <MemoryRouter>
        <DocTypeManagerScreen />
      </MemoryRouter>,
      { user: { id: 'staff@campus.edu', name: 'Staff Jane', email: 'staff@campus.edu', role: 'office_staff' } },
    )

    expect(await screen.findByRole('heading', { name: 'Document types' })).toBeInTheDocument()
    expect(screen.getByText('Manage the types of documents students and faculty can request.')).toBeInTheDocument()

    // Active tab initially
    expect(screen.getByText('Bonafide Certificate')).toBeInTheDocument()
    expect(screen.queryByText('Old Library Pass')).not.toBeInTheDocument()

    // Switch to Archived tab
    const archivedTab = screen.getByRole('button', { name: /Archived/i })
    fireEvent.click(archivedTab)

    expect(screen.getByText('Old Library Pass')).toBeInTheDocument()
    expect(screen.queryByText('Bonafide Certificate')).not.toBeInTheDocument()
  })

  it('handles duplicate error from API gracefully', async () => {
    vi.mocked(docTypesApi.createDocType).mockRejectedValue(new Error('A document type with this name already exists.'))

    renderWithProviders(
      <MemoryRouter>
        <DocTypeManagerScreen />
      </MemoryRouter>,
      { user: { id: 'staff@campus.edu', name: 'Staff Jane', email: 'staff@campus.edu', role: 'office_staff' } },
    )

    const nameInput = await screen.findByTestId('doctype-name-input')
    const submitBtn = screen.getByTestId('create-doctype-button')

    fireEvent.change(nameInput, { target: { value: 'Bonafide Certificate' } })
    fireEvent.click(submitBtn)

    expect(await screen.findByText('A document type with this name already exists.')).toBeInTheDocument()
  })

  it('supports editing an existing type and canceling resets the form', async () => {
    renderWithProviders(
      <MemoryRouter>
        <DocTypeManagerScreen />
      </MemoryRouter>,
      { user: { id: 'staff@campus.edu', name: 'Staff Jane', email: 'staff@campus.edu', role: 'office_staff' } },
    )

    await screen.findByText('Bonafide Certificate')
    const editBtn = screen.getByTestId('edit-dt-DT-ACT-1')
    fireEvent.click(editBtn)

    const nameInput = screen.getByTestId('doctype-name-input') as HTMLInputElement
    expect(nameInput.value).toBe('Bonafide Certificate')

    const cancelBtn = screen.getByRole('button', { name: 'Cancel' })
    fireEvent.click(cancelBtn)

    expect(nameInput.value).toBe('')
  })
})
