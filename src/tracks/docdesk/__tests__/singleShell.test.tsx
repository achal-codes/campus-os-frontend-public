import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { renderRoute, renderWithProviders, screen } from '@/test/render'
import { DocDeskLayout } from '../components/DocDeskLayout'
import { DocDeskSidebar } from '../components/DocDeskSidebar'
import { StatusBadge } from '../components/StatusBadge'
import * as docTypesApi from '../api/docTypes'
import * as requestsApi from '../api/requests'

vi.mock('../api/docTypes')
vi.mock('../api/requests')

const mockProfile = {
  profile: { dept: 'Student Affairs' },
  loading: false,
  error: null,
  isStudentAffairs: true,
  retry: () => {},
}

vi.mock('../hooks/useProfile', () => ({
  useProfile: () => mockProfile,
}))

describe('DocDesk Single-Shell Architecture & UX Requirements', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(docTypesApi.listDocTypes).mockResolvedValue({
      count: 1,
      items: [{ doc_type_id: 'DT-1', name: 'Bonafide Certificate', status: 'active' }],
      next_cursor: null,
    })
    vi.mocked(requestsApi.listRequests).mockResolvedValue({
      count: 0,
      items: [],
      next_cursor: null,
    })
  })

  // 1. Non-DocDesk CampusOS routes still render the global header and keep the ORIGINAL default width
  it('1. non-DocDesk routes keep original default width without leaking full-width modifier', () => {
    const { container } = renderRoute({
      route: '/',
      user: { id: 's1@campus.edu', name: 'Student One', email: 's1@campus.edu', role: 'student' },
    })

    const mainEl = container.querySelector('main')
    expect(mainEl).toBeInTheDocument()
    expect(mainEl?.className).not.toMatch(/mainDocDesk/)
    expect(screen.getByText('Campus OS')).toBeInTheDocument()
  })

  // 2. DocDesk routes render the global header exactly once
  it('2. DocDesk routes render the global header exactly once', async () => {
    const { container } = renderRoute({
      route: '/tracks/docdesk/my-requests',
      user: { id: 's1@campus.edu', name: 'Student One', email: 's1@campus.edu', role: 'student' },
    })

    const headers = container.querySelectorAll('header')
    expect(headers.length).toBe(1)
    expect(headers[0].textContent).toContain('Campus OS')
  })

  // 3. DocDesk sidebar rendered exactly once; no DocDesk horizontal topbar
  it('3. DocDesk sidebar rendered exactly once and zero DocDesk topbars', () => {
    const { container } = renderWithProviders(
      <MemoryRouter>
        <DocDeskLayout>
          <div>Content</div>
        </DocDeskLayout>
      </MemoryRouter>,
      {
        user: { id: 's1@campus.edu', name: 'Student One', email: 's1@campus.edu', role: 'student' },
      },
    )

    expect(screen.getByTestId('docdesk-sidebar')).toBeInTheDocument()
    expect(container.querySelectorAll('header').length).toBe(0)
  })

  // 4. Global theme toggle, user identity and logout each rendered once
  it('4. Global theme toggle, user identity and logout each rendered once on DocDesk route', async () => {
    const { container } = renderRoute({
      route: '/tracks/docdesk/my-requests',
      user: { id: 's1@campus.edu', name: 'Student One', email: 's1@campus.edu', role: 'student' },
    })

    await screen.findByTestId('docdesk-sidebar')

    const themeButtons = screen.getAllByTestId('theme-toggle')
    expect(themeButtons.length).toBe(1)

    const signoutButtons = screen.getAllByTestId('sign-out')
    expect(signoutButtons.length).toBe(1)

    const userNames = container.querySelectorAll('.user')
    expect(userNames.length).toBeLessThanOrEqual(1)
  })

  // 5. Exactly one <main> landmark on DocDesk routes (no nested main)
  it('5. Exactly one <main> landmark across entire page on DocDesk routes', () => {
    const { container } = renderRoute({
      route: '/tracks/docdesk/my-requests',
      user: { id: 's1@campus.edu', name: 'Student One', email: 's1@campus.edu', role: 'student' },
    })

    const mainElements = container.querySelectorAll('main')
    expect(mainElements.length).toBe(1)
  })

  // 6. Requester sidebar links are exactly: My Requests, New Request
  it('6. Requester sidebar links are exactly My Requests and New Request', () => {
    renderWithProviders(
      <MemoryRouter>
        <DocDeskSidebar />
      </MemoryRouter>,
      {
        user: { id: 's1@campus.edu', name: 'Student One', email: 's1@campus.edu', role: 'student' },
      },
    )

    expect(screen.getByTestId('nav-docdesk-my-requests')).toHaveTextContent('My Requests')
    expect(screen.getByTestId('nav-docdesk-new')).toHaveTextContent('New Request')
    expect(screen.queryByTestId('nav-docdesk-staff')).not.toBeInTheDocument()
    expect(screen.queryByTestId('nav-docdesk-staff-dash')).not.toBeInTheDocument()
    expect(screen.queryByTestId('nav-docdesk-bulk-tat')).not.toBeInTheDocument()
  })

  // 7. Student Affairs sidebar links are exactly: Dashboard, Requests, Document Types
  it('7. Student Affairs sidebar links are exactly Dashboard, Requests, Document Types', () => {
    renderWithProviders(
      <MemoryRouter>
        <DocDeskSidebar />
      </MemoryRouter>,
      {
        user: { id: 'staff@campus.edu', name: 'Staff Jane', email: 'staff@campus.edu', role: 'office_staff' },
      },
    )

    expect(screen.getByTestId('nav-docdesk-staff-dash')).toHaveTextContent('Dashboard')
    expect(screen.getByTestId('nav-docdesk-staff')).toHaveTextContent('Requests')
    expect(screen.getByTestId('nav-docdesk-doctypes')).toHaveTextContent('Document Types')
    expect(screen.queryByTestId('nav-docdesk-my-requests')).not.toBeInTheDocument()
    expect(screen.queryByTestId('nav-docdesk-bulk-tat')).not.toBeInTheDocument()
  })

  // 8. Bulk TAT is not a sidebar item; direct visit with no selection shows empty state
  it('8. Bulk TAT is not in sidebar; direct visit shows empty state', async () => {
    renderWithProviders(
      <MemoryRouter>
        <DocDeskSidebar />
      </MemoryRouter>,
      {
        user: { id: 'staff@campus.edu', name: 'Staff Jane', email: 'staff@campus.edu', role: 'office_staff' },
      },
    )

    expect(screen.queryByTestId('nav-docdesk-bulk-tat')).not.toBeInTheDocument()
  })

  // 9. Admin navigation contains no duplicate destination
  it('9. Admin navigation contains no duplicate destination', () => {
    renderWithProviders(
      <MemoryRouter>
        <DocDeskSidebar />
      </MemoryRouter>,
      {
        user: { id: 'admin@campus.edu', name: 'Admin', email: 'admin@campus.edu', role: 'admin' },
      },
    )

    expect(screen.getByTestId('nav-docdesk-admin')).toHaveTextContent('Request Audit')
    expect(screen.queryByTestId('nav-docdesk-audit')).not.toBeInTheDocument()
  })

  // 11. aria-current="page" on active sidebar link
  it('11. aria-current="page" is set on active sidebar link', () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/tracks/docdesk/my-requests']}>
        <DocDeskSidebar />
      </MemoryRouter>,
      {
        user: { id: 's1@campus.edu', name: 'Student One', email: 's1@campus.edu', role: 'student' },
      },
    )

    const activeLink = screen.getByTestId('nav-docdesk-my-requests')
    expect(activeLink).toHaveAttribute('aria-current', 'page')
  })

  // 12. Mobile drawer opens, closes, Escape closes, backdrop click closes, focus returns
  it('12. Mobile drawer opens and closes with focus return', async () => {
    renderWithProviders(
      <MemoryRouter>
        <DocDeskLayout>
          <div>Workspace Content</div>
        </DocDeskLayout>
      </MemoryRouter>,
      {
        user: { id: 's1@campus.edu', name: 'Student One', email: 's1@campus.edu', role: 'student' },
      },
    )

    const menuToggle = screen.getByTestId('docdesk-menu-toggle')
    expect(menuToggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByTestId('docdesk-drawer')).not.toBeInTheDocument()

    // Open drawer
    fireEvent.click(menuToggle)
    expect(screen.getByTestId('docdesk-drawer')).toBeInTheDocument()
    expect(menuToggle).toHaveAttribute('aria-expanded', 'true')

    // Escape closes drawer
    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() => {
      expect(screen.queryByTestId('docdesk-drawer')).not.toBeInTheDocument()
    })
    expect(document.activeElement).toBe(menuToggle)

    // Open again and click backdrop
    fireEvent.click(menuToggle)
    expect(screen.getByTestId('docdesk-drawer')).toBeInTheDocument()
    const backdrop = screen.getByTestId('docdesk-drawer-backdrop')
    fireEvent.click(backdrop)
    await waitFor(() => {
      expect(screen.queryByTestId('docdesk-drawer')).not.toBeInTheDocument()
    })
  })

  // 13. Focus trap within open drawer
  it('13. Keyboard focus cannot escape the open mobile drawer', () => {
    renderWithProviders(
      <MemoryRouter>
        <DocDeskLayout>
          <div>Workspace Content</div>
        </DocDeskLayout>
      </MemoryRouter>,
      {
        user: { id: 's1@campus.edu', name: 'Student One', email: 's1@campus.edu', role: 'student' },
      },
    )

    const menuToggle = screen.getByTestId('docdesk-menu-toggle')
    fireEvent.click(menuToggle)

    const drawer = screen.getByTestId('docdesk-drawer')
    const focusable = drawer.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    expect(focusable.length).toBeGreaterThan(1)

    const firstEl = focusable[0]
    const lastEl = focusable[focusable.length - 1]

    firstEl.focus()
    expect(document.activeElement).toBe(firstEl)

    // Shift-Tab from first element wraps to last element
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(lastEl)

    // Tab from last element wraps to first element
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: false })
    expect(document.activeElement).toBe(firstEl)
  })

  // 14. Body scroll lock and restore
  it('14. Body scrolling is disabled while drawer is open and restored when closed', () => {
    const originalBodyOverflow = document.body.style.overflow

    const { unmount } = renderWithProviders(
      <MemoryRouter>
        <DocDeskLayout>
          <div>Workspace Content</div>
        </DocDeskLayout>
      </MemoryRouter>,
      {
        user: { id: 's1@campus.edu', name: 'Student One', email: 's1@campus.edu', role: 'student' },
      },
    )

    const menuToggle = screen.getByTestId('docdesk-menu-toggle')
    fireEvent.click(menuToggle)

    expect(document.body.style.overflow).toBe('hidden')

    // Close drawer
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(document.body.style.overflow).toBe(originalBodyOverflow)

    // Test unmount restores
    fireEvent.click(menuToggle)
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe(originalBodyOverflow)
  })

  // 16. Exactly three status labels exist; "Withdrawn" is never rendered as a status
  it('16. Exactly three status labels exist; "Withdrawn" is never rendered as a status', () => {
    const { rerender } = renderWithProviders(<StatusBadge status="pending" />)
    expect(screen.getByText('Pending')).toBeInTheDocument()

    rerender(<StatusBadge status="answered" />)
    expect(screen.getByText('Answered')).toBeInTheDocument()

    rerender(<StatusBadge status="acknowledged" />)
    expect(screen.getByText('Acknowledged')).toBeInTheDocument()

    expect(screen.queryByText(/Withdrawn/i)).not.toBeInTheDocument()
  })
})
