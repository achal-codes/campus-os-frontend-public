import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, waitFor } from '@testing-library/react'
import { renderRoute, screen } from '@/test/render'
import * as profileApi from '../profileApi'

vi.mock('../profileApi')

describe('ProfilePage (Phase 3 Specification Tests)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  // 1. Tapping the profile trigger opens /profile for Student, Staff and Admin.
  it('1. tapping the profile trigger opens /profile for Student, Staff and Admin', async () => {
    vi.mocked(profileApi.getProfile).mockResolvedValue({
      name: 'Alice Student',
      email_id: 'alice@team24.com',
      role: 'student',
      usn: '1MS21CS101',
      dept: 'CSE',
    })

    const { router } = renderRoute({
      route: '/',
      user: { id: 'alice@team24.com', name: 'Alice Student', email: 'alice@team24.com', role: 'student' },
    })

    const trigger = screen.getByTestId('profile-trigger')
    expect(trigger).toHaveAttribute('aria-label', 'View profile')
    fireEvent.click(trigger)

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/profile')
      expect(screen.getByTestId('profile-heading')).toHaveTextContent('Profile')
    })
  })

  // 2. Page shows the correct role label and only fields present in the user data.
  it('2a. shows Student role label and only fields present in student profile', async () => {
    vi.mocked(profileApi.getProfile).mockResolvedValue({
      name: 'Bob Student',
      email_id: 'bob@team24.com',
      role: 'student',
      usn: '1MS21CS202',
      dept: 'ISE',
      phone_number: '9876543210',
      created_at: '2026-10-31T05:00:00.000Z',
    })

    renderRoute({
      route: '/profile',
      user: { id: 'bob@team24.com', name: 'Bob Student', email: 'bob@team24.com', role: 'student' },
    })

    await waitFor(() => {
      expect(screen.getByTestId('profile-badge')).toHaveTextContent('Student')
      expect(screen.getByTestId('profile-name')).toHaveTextContent('Bob Student')
      expect(screen.getByTestId('profile-email')).toHaveTextContent('bob@team24.com')
      expect(screen.getByTestId('profile-role')).toHaveTextContent('Student')
      expect(screen.getByTestId('profile-id')).toHaveTextContent('1MS21CS202')
      expect(screen.getByTestId('profile-dept')).toHaveTextContent('ISE')
      expect(screen.getByTestId('profile-phone')).toHaveTextContent('9876543210')
      expect(screen.getByTestId('profile-created-at')).toHaveTextContent('31/10/2026')
    })

    // Designation and Institution must not exist
    expect(screen.queryByTestId('profile-designation')).not.toBeInTheDocument()
    expect(screen.queryByTestId('profile-institution')).not.toBeInTheDocument()
  })

  it('2b. shows Staff role label and only fields present in staff profile', async () => {
    vi.mocked(profileApi.getProfile).mockResolvedValue({
      name: 'Carol Staff',
      email_id: 'carol@team24.com',
      role: 'office_staff',
      dept: 'Student Affairs',
      designation: 'Superintendent',
      phone_number: '9876543211',
    })

    renderRoute({
      route: '/profile',
      user: { id: 'carol@team24.com', name: 'Carol Staff', email: 'carol@team24.com', role: 'office_staff' },
    })

    await waitFor(() => {
      expect(screen.getByTestId('profile-badge')).toHaveTextContent('Staff')
      expect(screen.getByTestId('profile-dept')).toHaveTextContent('Student Affairs')
      expect(screen.getByTestId('profile-designation')).toHaveTextContent('Superintendent')
    })

    expect(screen.queryByTestId('profile-id')).not.toBeInTheDocument()
    expect(screen.queryByTestId('profile-institution')).not.toBeInTheDocument()
  })

  it('2c. shows Admin role label and only fields present in admin profile', async () => {
    vi.mocked(profileApi.getProfile).mockResolvedValue({
      name: 'Team 24 Admin',
      email_id: 'admin@team24.com',
      role: 'admin',
      institution_name: 'Team 24 University',
      phone_number: '9000000024',
    })

    renderRoute({
      route: '/profile',
      user: { id: 'admin@team24.com', name: 'Team 24 Admin', email: 'admin@team24.com', role: 'admin' },
    })

    await waitFor(() => {
      expect(screen.getByTestId('profile-badge')).toHaveTextContent('Admin')
      expect(screen.getByTestId('profile-institution')).toHaveTextContent('Team 24 University')
      expect(screen.getByTestId('profile-phone')).toHaveTextContent('9000000024')
    })

    expect(screen.queryByTestId('profile-id')).not.toBeInTheDocument()
    expect(screen.queryByTestId('profile-dept')).not.toBeInTheDocument()
    expect(screen.queryByTestId('profile-designation')).not.toBeInTheDocument()
  })

  // 3. No input, textarea, select or save/edit button exists on the page.
  it('3. no input, textarea, select or save/edit button exists on the page', async () => {
    vi.mocked(profileApi.getProfile).mockResolvedValue({
      name: 'Alice Student',
      email_id: 'alice@team24.com',
      role: 'student',
    })

    const { container } = renderRoute({
      route: '/profile',
      user: { id: 'alice@team24.com', name: 'Alice Student', email: 'alice@team24.com', role: 'student' },
    })

    await waitFor(() => {
      expect(screen.getByTestId('profile-card')).toBeInTheDocument()
    })

    expect(container.querySelector('input')).toBeNull()
    expect(container.querySelector('textarea')).toBeNull()
    expect(container.querySelector('select')).toBeNull()

    const buttons = container.querySelectorAll('button')
    for (const btn of buttons) {
      expect(btn.textContent).not.toMatch(/save|edit|update|change|submit/i)
    }
  })

  // 4. Missing fields are not rendered (omitted, not shown as dashes or placeholders).
  it('4. missing fields are omitted, not shown as dashes or placeholders', async () => {
    vi.mocked(profileApi.getProfile).mockResolvedValue({
      name: 'Barebones User',
      email_id: 'bare@team24.com',
      role: 'student',
      // No usn, dept, phone, created_at
    })

    const { container } = renderRoute({
      route: '/profile',
      user: { id: 'bare@team24.com', name: 'Barebones User', email: 'bare@team24.com', role: 'student' },
    })

    await waitFor(() => {
      expect(screen.getByTestId('profile-card')).toBeInTheDocument()
    })

    expect(screen.queryByTestId('profile-id')).not.toBeInTheDocument()
    expect(screen.queryByTestId('profile-dept')).not.toBeInTheDocument()
    expect(screen.queryByTestId('profile-phone')).not.toBeInTheDocument()
    expect(screen.queryByTestId('profile-created-at')).not.toBeInTheDocument()

    // Ensure no dashed placeholders in any <dd>
    const dds = container.querySelectorAll('dd')
    for (const dd of dds) {
      expect(dd.textContent?.trim()).not.toBe('-')
      expect(dd.textContent?.trim()).not.toBe('—')
      expect(dd.textContent?.trim()).not.toBe('N/A')
    }
  })

  // 5. Unauthenticated access redirects via the existing guard.
  it('5. unauthenticated access redirects via the existing RequireAuth guard', async () => {
    const { router } = renderRoute({
      route: '/profile',
    })

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login')
    })
  })

  // 6. Global header, theme toggle and logout still render exactly once.
  it('6. global header, theme toggle and logout still render exactly once', async () => {
    vi.mocked(profileApi.getProfile).mockResolvedValue({
      name: 'Dave Faculty',
      email_id: 'dave@team24.com',
      role: 'faculty',
    })

    const { container } = renderRoute({
      route: '/profile',
      user: { id: 'dave@team24.com', name: 'Dave Faculty', email: 'dave@team24.com', role: 'faculty' },
    })

    await waitFor(() => {
      expect(screen.getByTestId('profile-heading')).toBeInTheDocument()
    })

    const headers = container.querySelectorAll('header')
    expect(headers).toHaveLength(1)

    const themeToggles = screen.getAllByTestId('theme-toggle')
    expect(themeToggles).toHaveLength(1)

    const signOutBtns = screen.getAllByTestId('sign-out')
    expect(signOutBtns).toHaveLength(1)
  })

  // 7. Dates (if any) display as DD/MM/YYYY.
  it('7. dates display strictly as DD/MM/YYYY format', async () => {
    vi.mocked(profileApi.getProfile).mockResolvedValue({
      name: 'Date Test User',
      email_id: 'date@team24.com',
      role: 'student',
      created_at: '2026-10-31T12:00:00.000Z',
    })

    renderRoute({
      route: '/profile',
      user: { id: 'date@team24.com', name: 'Date Test User', email: 'date@team24.com', role: 'student' },
    })

    await waitFor(() => {
      const createdEl = screen.getByTestId('profile-created-at')
      expect(createdEl).toHaveTextContent('31/10/2026')
      expect(createdEl.textContent).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
    })
  })

  // 8. Accessibility: title, H1 focus, semantic dl, aria-hidden avatar, back link.
  it('8. satisfies accessibility requirements (title, H1 focus, dl semantics, back button)', async () => {
    vi.mocked(profileApi.getProfile).mockResolvedValue({
      name: 'Accessible User',
      email_id: 'a11y@team24.com',
      role: 'student',
    })

    renderRoute({
      route: '/profile',
      user: { id: 'a11y@team24.com', name: 'Accessible User', email: 'a11y@team24.com', role: 'student' },
    })

    await waitFor(() => {
      expect(screen.getByTestId('profile-heading')).toBeInTheDocument()
    })

    expect(document.title).toBe('Profile · Campus OS')
    expect(document.activeElement).toBe(screen.getByTestId('profile-heading'))

    const avatar = screen.getByTestId('profile-avatar')
    expect(avatar).toHaveAttribute('aria-hidden', 'true')
    expect(avatar).toHaveTextContent('AU')

    const backBtn = screen.getByTestId('profile-back')
    expect(backBtn).toHaveTextContent('Back')
  })

  // 9. Error state and retry.
  it('9. shows error notice with role="alert" and allows retry', async () => {
    vi.mocked(profileApi.getProfile)
      .mockRejectedValueOnce(new Error('Network disconnected'))
      .mockResolvedValueOnce({
        name: 'Retry User',
        email_id: 'retry@team24.com',
        role: 'student',
      })

    renderRoute({
      route: '/profile',
      user: { id: 'retry@team24.com', name: 'Retry User', email: 'retry@team24.com', role: 'student' },
    })

    await waitFor(() => {
      const alert = screen.getByRole('alert')
      expect(alert).toHaveTextContent('Network disconnected')
    })

    const retryBtn = screen.getByTestId('profile-retry')
    fireEvent.click(retryBtn)

    await waitFor(() => {
      expect(screen.getByTestId('profile-card')).toBeInTheDocument()
      expect(screen.getByTestId('profile-name')).toHaveTextContent('Retry User')
    })
  })
})
