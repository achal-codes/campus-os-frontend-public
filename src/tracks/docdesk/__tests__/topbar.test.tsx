import { describe, expect, it, vi } from 'vitest'
import { fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { renderWithProviders, screen } from '@/test/render'
import { DocDeskTopbar } from '../components/DocDeskTopbar'

const mockUseProfile = vi.fn(() => ({
  profile: { dept: 'Student Affairs' },
  loading: false,
  error: null,
  isStudentAffairs: true,
  retry: () => {},
}))

vi.mock('../hooks/useProfile', () => ({
  useProfile: () => mockUseProfile(),
}))

describe('DocDeskTopbar navigation and interaction', () => {
  it('shows requester navigation links for student and Logout button', () => {
    renderWithProviders(
      <MemoryRouter>
        <DocDeskTopbar />
      </MemoryRouter>,
      {
        user: { id: 's1@campus.edu', name: 'Student One', email: 's1@campus.edu', role: 'student' },
      },
    )

    expect(screen.getByTestId('nav-docdesk-my-requests')).toBeInTheDocument()
    expect(screen.getByTestId('nav-docdesk-new')).toBeInTheDocument()
    expect(screen.queryByTestId('nav-docdesk-staff')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument()
  })

  it('shows Student Affairs navigation links for office_staff with Student Affairs dept', () => {
    renderWithProviders(
      <MemoryRouter>
        <DocDeskTopbar />
      </MemoryRouter>,
      {
        user: { id: 'staff@campus.edu', name: 'Staff Jane', email: 'staff@campus.edu', role: 'office_staff' },
      },
    )

    expect(screen.getByTestId('nav-docdesk-staff-dash')).toBeInTheDocument()
    expect(screen.getByTestId('nav-docdesk-staff')).toBeInTheDocument()
    expect(screen.getByTestId('nav-docdesk-doctypes')).toBeInTheDocument()
    expect(screen.getByText('Document Types')).toBeInTheDocument()
    expect(screen.queryByTestId('nav-docdesk-my-requests')).not.toBeInTheDocument()
  })

  it('shows Requester navigation links and Office Staff label for office_staff not in Student Affairs', () => {
    mockUseProfile.mockReturnValueOnce({
      profile: { dept: 'Accounts' },
      loading: false,
      error: null,
      isStudentAffairs: false,
      retry: () => {},
    })

    renderWithProviders(
      <MemoryRouter>
        <DocDeskTopbar />
      </MemoryRouter>,
      {
        user: { id: 'accounts@campus.edu', name: 'Accounts Officer', email: 'accounts@campus.edu', role: 'office_staff' },
      },
    )

    expect(screen.getByTestId('nav-docdesk-my-requests')).toBeInTheDocument()
    expect(screen.getByTestId('nav-docdesk-new')).toBeInTheDocument()
    expect(screen.queryByTestId('nav-docdesk-staff-dash')).not.toBeInTheDocument()
    expect(screen.queryByTestId('nav-docdesk-staff')).not.toBeInTheDocument()
    expect(screen.getByText('Office Staff')).toBeInTheDocument()
  })

  it('shows Admin navigation links for admin role', () => {
    renderWithProviders(
      <MemoryRouter>
        <DocDeskTopbar />
      </MemoryRouter>,
      {
        user: { id: 'admin@campus.edu', name: 'Admin User', email: 'admin@campus.edu', role: 'admin' },
      },
    )

    expect(screen.getByTestId('nav-docdesk-admin')).toBeInTheDocument()
    expect(screen.getByTestId('nav-docdesk-audit')).toBeInTheDocument()
  })

  it('handles mobile drawer opening and closing via Escape key', () => {
    renderWithProviders(
      <MemoryRouter>
        <DocDeskTopbar />
      </MemoryRouter>,
      {
        user: { id: 's1@campus.edu', name: 'Student One', email: 's1@campus.edu', role: 'student' },
      },
    )

    const menuToggle = screen.getByTestId('docdesk-menu-toggle')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    // Open drawer
    fireEvent.click(menuToggle)
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

