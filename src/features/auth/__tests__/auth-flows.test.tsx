import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderRoute, screen, waitFor } from '@/test/render'
import { loadSession } from '@/core/auth/session'

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

const token = (role: string, name: string, email_id: string) =>
  jsonResponse(200, {
    access_token: 'jwt-mock-token',
    token_type: 'bearer',
    expires_in: 3600,
    profile: { role, name, email_id },
  })

afterEach(() => {
  vi.unstubAllGlobals()
  sessionStorage.clear()
  localStorage.clear()
})

describe('Login Page Presentation & Architecture (Part 1)', () => {
  // 1. None of the removed marketing phrases render on the login page
  it('1. does not render any of the removed marketing phrases or feature list', () => {
    renderRoute({ route: '/login' })

    expect(screen.queryByText(/Modern document infrastructure for higher education/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Streamlined credential requests/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Real-Time Request Lifecycle/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Student Affairs Workflow/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Role-Enforced Security/i)).not.toBeInTheDocument()
  })

  // 2. Exactly one H1, one form, one primary submit button, and "Enter OTP" label
  it('2. renders exactly one H1, one form, one primary submit button, and Enter OTP label', () => {
    renderRoute({ route: '/login' })

    const h1s = screen.getAllByRole('heading', { level: 1 })
    expect(h1s).toHaveLength(1)
    expect(h1s[0]).toHaveTextContent('Sign in')

    const forms = screen.getAllByRole('form')
    expect(forms).toHaveLength(1)

    const submitButtons = screen.getAllByRole('button', { name: 'Sign in' })
    expect(submitButtons).toHaveLength(1)

    // Asserts visible label is "Enter OTP"
    const visibleOtpLabel = document.getElementById('login-password-label')
    expect(visibleOtpLabel).toHaveTextContent('Enter OTP')
    expect(screen.getByLabelText('Enter OTP')).toBeInTheDocument()
  })

  // 6. Supports toggling into Administrator Sign In mode
  it('6. toggles between standard and administrator sign-in modes', async () => {
    const { user } = renderRoute({ route: '/login' })

    const toggleBtn = screen.getByTestId('toggle-admin-login')
    expect(toggleBtn).toHaveTextContent('Sign in as Administrator →')

    await user.click(toggleBtn)
    expect(screen.getByRole('heading', { name: 'Administrator Sign In' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in as Admin' })).toBeInTheDocument()
    expect(toggleBtn).toHaveTextContent('← Sign in as student, faculty, or staff')

    await user.click(toggleBtn)
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
  })

  // 7. Directly posts to /api/v1/auth/admin/login when in admin mode
  it('7. directly posts to /api/v1/auth/admin/login when in admin mode', async () => {
    const fetchAdmin = vi.fn().mockResolvedValue(token('admin', 'Admin Team', 'admin@team24.com'))
    vi.stubGlobal('fetch', fetchAdmin)
    const { user } = renderRoute({ route: '/login?mode=admin' })

    expect(screen.getByRole('heading', { name: 'Administrator Sign In' })).toBeInTheDocument()
    await user.type(screen.getByLabelText('Email'), 'admin@team24.com')
    await user.type(screen.getByLabelText('Password'), '204884')
    await user.click(screen.getByRole('button', { name: 'Sign in as Admin' }))

    await waitFor(() => expect(screen.getByTestId('nav-admin')).toBeInTheDocument())
    expect(fetchAdmin).toHaveBeenCalledTimes(1)
    expect(fetchAdmin.mock.calls[0][0]).toMatch(/\/api\/v1\/auth\/admin\/login$/)
  })

  // 3. Show/hide password toggles type and updates aria-pressed
  it('3. show/hide password toggles input type and updates aria-pressed / aria-label', async () => {
    const { user } = renderRoute({ route: '/login' })

    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement
    expect(passwordInput.type).toBe('password')

    const toggleBtn = screen.getByRole('button', { name: 'Show password' })
    expect(toggleBtn).toHaveAttribute('aria-pressed', 'false')

    // Click show
    await user.click(toggleBtn)
    expect(passwordInput.type).toBe('text')
    expect(toggleBtn).toHaveAttribute('aria-pressed', 'true')
    expect(toggleBtn).toHaveAccessibleName('Hide password')

    // Click hide
    await user.click(toggleBtn)
    expect(passwordInput.type).toBe('password')
    expect(toggleBtn).toHaveAttribute('aria-pressed', 'false')
    expect(toggleBtn).toHaveAccessibleName('Show password')
  })

  // 5. Form is keyboard-operable end to end; Enter submits
  it('5. is keyboard operable and submits when Enter is pressed in an input field', async () => {
    const fetchMock = vi.fn().mockResolvedValue(token('student', 'Student Key', 'student@campus.edu'))
    vi.stubGlobal('fetch', fetchMock)
    const { user, router } = renderRoute({ route: '/login?next=%2Ftracks%2Fexample' })

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')

    await user.type(emailInput, 'student@campus.edu')
    await user.type(passwordInput, '123456{Enter}')

    await waitFor(() => expect(router.state.location.pathname).toBe('/tracks/example'))
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe('Login Authentication Flows (Part 1.4 & Phase 2)', () => {
  it('shows field errors without submitting if required fields are missing', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { user } = renderRoute({ route: '/login' })
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('Email is required.')
    expect(screen.getByLabelText('Password')).toHaveAccessibleDescription('OTP is required.')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  // 1. Standard user login sends POST /api/v1/auth/login and establishes a session
  it('1. standard user login sends POST /api/v1/auth/login and establishes session', async () => {
    const fetchMock = vi.fn().mockResolvedValue(token('student', 'Asha Kumar', 'asha@team1.com'))
    vi.stubGlobal('fetch', fetchMock)
    const { user, router } = renderRoute({ route: '/login?next=%2Ftracks%2Fexample' })

    await user.type(screen.getByLabelText('Email'), 'Asha@team1.com')
    await user.type(screen.getByLabelText('Password'), '482913')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/tracks/example'))

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toMatch(/\/api\/v1\/auth\/login$/)
    expect(JSON.parse(init.body)).toEqual({ email_id: 'asha@team1.com', otp: '482913' })

    const session = loadSession()
    expect(session).not.toBeNull()
    expect(session?.user).toEqual({
      id: 'asha@team1.com',
      name: 'Asha Kumar',
      email: 'asha@team1.com',
      role: 'student',
    })
  })

  // 2. Admin credentials sent to standard login endpoint return 400 USE_ADMIN_LOGIN.
  // The client makes exactly one follow-up request to /api/v1/auth/admin/login and establishes the admin session.
  it('2. recovers from USE_ADMIN_LOGIN with exactly one follow-up call to /api/v1/auth/admin/login', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(
        jsonResponse(400, {
          error: {
            code: 'USE_ADMIN_LOGIN',
            message: 'This is an admin account, use POST /api/v1/auth/admin/login',
          },
          request_id: 'req_admin_redirect_123',
        }),
      )
      .mockResolvedValueOnce(token('admin', 'Admin User', 'admin@team24.com'))

    vi.stubGlobal('fetch', fetchMock)
    const { user } = renderRoute({ route: '/login' })

    await user.type(screen.getByLabelText('Email'), 'admin@team24.com')
    await user.type(screen.getByLabelText('Password'), '123456')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByTestId('nav-admin')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/v1\/auth\/login$/)
    expect(fetchMock.mock.calls[1][0]).toMatch(/\/api\/v1\/auth\/admin\/login$/)

    const session = loadSession()
    expect(session?.user).toEqual({
      id: 'admin@team24.com',
      name: 'Admin User',
      email: 'admin@team24.com',
      role: 'admin',
    })
  })

  // 3. If the follow-up admin request fails (e.g. 401 INVALID_CREDENTIALS), the client surfaces the mapped error to the user and does NOT make further requests.
  it('3. surfaces error and makes NO further retries if the admin follow-up call fails', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(
        jsonResponse(400, {
          error: { code: 'USE_ADMIN_LOGIN', message: 'Use admin login' },
          request_id: 'req_use_admin_400',
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(401, {
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' },
          request_id: 'req_admin_cred_401',
        }),
      )

    vi.stubGlobal('fetch', fetchMock)
    const { user } = renderRoute({ route: '/login' })

    await user.type(screen.getByLabelText('Email'), 'admin@team24.com')
    await user.type(screen.getByLabelText('Password'), '999999')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Invalid email_id or OTP')
    expect(screen.getByTestId('login-error-request-id')).toHaveTextContent('Reference: req_admin_cred_401')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  // 4. If the standard login endpoint returns a different 400 or 401 code (e.g. UNKNOWN_INSTITUTION, INVALID_CREDENTIALS), the client does NOT attempt the admin endpoint.
  it('4. does NOT attempt admin endpoint if standard login returns UNKNOWN_INSTITUTION or INVALID_CREDENTIALS', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(400, {
        error: { code: 'UNKNOWN_INSTITUTION', message: 'Unknown institution' },
        request_id: 'req_unknown_inst',
      }),
    )

    vi.stubGlobal('fetch', fetchMock)
    const { user } = renderRoute({ route: '/login' })

    await user.type(screen.getByLabelText('Email'), 'outsider@gmail.com')
    await user.type(screen.getByLabelText('Password'), '123456')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Unknown institution')
    expect(screen.getByTestId('login-error-request-id')).toHaveTextContent('Reference: req_unknown_inst')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/v1\/auth\/login$/)
  })

  // 5. The retry decision relies strictly on error.code === 'USE_ADMIN_LOGIN'. Changing error.message text in the mock must not change behavior.
  it('5. branches strictly on error.code, ignoring error.message text completely', async () => {
    // Sub-case A: code is USE_ADMIN_LOGIN, but message is arbitrary -> MUST RETRY
    const retryMock = vi.fn()
      .mockResolvedValueOnce(
        jsonResponse(400, {
          error: { code: 'USE_ADMIN_LOGIN', message: 'Arbitrary custom message from proxy or backend' },
        }),
      )
      .mockResolvedValueOnce(token('admin', 'Admin User', 'admin@team24.com'))

    vi.stubGlobal('fetch', retryMock)
    const { user: userA } = renderRoute({ route: '/login' })

    await userA.type(screen.getByLabelText('Email'), 'admin@team24.com')
    await userA.type(screen.getByLabelText('Password'), '123456')
    await userA.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByTestId('nav-admin')).toBeInTheDocument()
    expect(retryMock).toHaveBeenCalledTimes(2)
  })

  it('5b. does not retry if message contains admin hint but error.code is different', async () => {
    const noRetryMock = vi.fn().mockResolvedValue(
      jsonResponse(400, {
        error: { code: 'GENERIC_BAD_REQUEST', message: 'This is an admin account, use POST /api/v1/auth/admin/login' },
      }),
    )

    vi.stubGlobal('fetch', noRetryMock)
    const { user } = renderRoute({ route: '/login' })

    await user.type(screen.getByLabelText('Email'), 'admin@team24.com')
    await user.type(screen.getByLabelText('Password'), '123456')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(noRetryMock).toHaveBeenCalledTimes(1)
  })

  // 6. The client does not store the password/OTP in localStorage/sessionStorage or include it in URLs, logs or error reports.
  it('6. never stores OTP/password in localStorage, sessionStorage, or URL params', async () => {
    const fetchMock = vi.fn().mockResolvedValue(token('student', 'Student One', 'student@team1.com'))
    vi.stubGlobal('fetch', fetchMock)
    const { user, router } = renderRoute({ route: '/login' })

    await user.type(screen.getByLabelText('Email'), 'student@team1.com')
    await user.type(screen.getByLabelText('Password'), '777888')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => expect(router.state.location.pathname).not.toBe('/login'))

    // Verify localStorage has nothing secret
    expect(localStorage.getItem('campus-os:session')).toBeNull()
    expect(JSON.stringify(localStorage)).not.toContain('777888')

    // Verify sessionStorage has session, but NOT the OTP
    const rawSession = sessionStorage.getItem('campus-os:session')
    expect(rawSession).not.toBeNull()
    expect(rawSession).not.toContain('777888')

    // Verify URL does not contain OTP
    expect(router.state.location.search).not.toContain('777888')
  })

  // 7. While the request is pending, the submit button is disabled and shows aria-busy. A second click does not send a second request.
  it('7. disables submit button, sets aria-busy, and ignores duplicate clicks while pending', async () => {
    let resolveLogin: (res: Response) => void
    const pendingPromise = new Promise<Response>((resolve) => {
      resolveLogin = resolve
    })

    const fetchMock = vi.fn().mockReturnValue(pendingPromise)
    vi.stubGlobal('fetch', fetchMock)
    const { user } = renderRoute({ route: '/login' })

    await user.type(screen.getByLabelText('Email'), 'student@team1.com')
    await user.type(screen.getByLabelText('Password'), '123456')

    const submitBtn = screen.getByRole('button', { name: 'Sign in' })
    const form = screen.getByRole('form', { name: 'Sign in' })

    await user.click(submitBtn)

    expect(form).toHaveAttribute('aria-busy', 'true')
    expect(submitBtn).toBeDisabled()
    expect(fetchMock).toHaveBeenCalledTimes(1)

    // Attempt second click while pending
    await user.click(submitBtn)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    // Resolve login
    resolveLogin!(token('student', 'Student One', 'student@team1.com'))
    await waitFor(() => expect(form).not.toBeInTheDocument())
  })

  // 8. Network failure and server timeout show distinct, user-recoverable messages.
  it('8a. shows distinct, recoverable message for network failure', async () => {
    const fetchNetworkError = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    vi.stubGlobal('fetch', fetchNetworkError)
    const { user } = renderRoute({ route: '/login' })

    await user.type(screen.getByLabelText('Email'), 'asha@team1.com')
    await user.type(screen.getByLabelText('Password'), '123456')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    const netAlert = await screen.findByRole('alert')
    expect(netAlert).toHaveTextContent('Cannot reach the authentication server')
    expect(screen.getByTestId('login-retry-button')).toBeInTheDocument()
  })

  it('8b. shows distinct, recoverable message for server timeout', async () => {
    const fetchTimeoutError = vi.fn().mockResolvedValue(
      jsonResponse(504, { error: { code: 'GATEWAY_TIMEOUT', message: 'Gateway Timeout' } }),
    )
    vi.stubGlobal('fetch', fetchTimeoutError)
    const { user } = renderRoute({ route: '/login' })

    await user.type(screen.getByLabelText('Email'), 'asha@team1.com')
    await user.type(screen.getByLabelText('Password'), '123456')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    const timeoutAlert = await screen.findByRole('alert')
    expect(timeoutAlert).toHaveTextContent('The server took too long to respond')
    expect(screen.getByTestId('login-retry-button')).toBeInTheDocument()
  })

  // 8. Admin credentials entered in the single form still succeed through the USE_ADMIN_LOGIN single retry
  it('8. admin credentials entered in the single form succeed via USE_ADMIN_LOGIN retry and redirect to admin page', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(
        jsonResponse(400, {
          error: {
            code: 'USE_ADMIN_LOGIN',
            message: 'This is an admin account, use POST /api/v1/auth/admin/login',
          },
          request_id: 'req_admin_redirect_400',
        }),
      )
      .mockResolvedValueOnce(token('admin', 'Admin Team', 'admin@team24.com'))

    vi.stubGlobal('fetch', fetchMock)
    const { user, router } = renderRoute({ route: '/login?next=%2Fadmin' })

    await user.type(screen.getByLabelText('Email'), 'admin@team24.com')
    await user.type(screen.getByLabelText('Password'), '123456')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/admin'))
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/v1\/auth\/login$/)
    expect(fetchMock.mock.calls[1][0]).toMatch(/\/api\/v1\/auth\/admin\/login$/)

    const session = loadSession()
    expect(session?.user.role).toBe('admin')
  })

  // 9. Student, Faculty and Staff credentials still log in through /auth/login and redirect to their correct landing pages
  it('9a. student credentials log in through /auth/login and redirect to default landing page', async () => {
    const fetchStudent = vi.fn().mockResolvedValue(token('student', 'Student Ananya', 'student@campus.edu'))
    vi.stubGlobal('fetch', fetchStudent)
    const { user, router } = renderRoute({ route: '/login' })
    await user.type(screen.getByLabelText('Email'), 'student@campus.edu')
    await user.type(screen.getByLabelText('Password'), '111111')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(loadSession()?.user.role).toBe('student')
    expect(fetchStudent).toHaveBeenCalledTimes(1)
    expect(fetchStudent.mock.calls[0][0]).toMatch(/\/api\/v1\/auth\/login$/)
  })

  it('9b. faculty credentials log in through /auth/login and redirect to requested destination', async () => {
    const fetchFaculty = vi.fn().mockResolvedValue(token('faculty', 'Prof. Verma', 'verma@campus.edu'))
    vi.stubGlobal('fetch', fetchFaculty)
    const { user, router } = renderRoute({ route: '/login?next=%2Ftracks%2Fexample' })
    await user.type(screen.getByLabelText('Email'), 'verma@campus.edu')
    await user.type(screen.getByLabelText('Password'), '222222')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/tracks/example'))
    expect(loadSession()?.user.role).toBe('faculty')
    expect(fetchFaculty.mock.calls[0][0]).toMatch(/\/api\/v1\/auth\/login$/)
  })

  it('9c. staff credentials log in through /auth/login and redirect to staff queue destination', async () => {
    const fetchStaff = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/auth/login')) {
        return Promise.resolve(token('office_staff', 'Ramesh Staff', 'ramesh@campus.edu'))
      }
      // Hydrate profile for Student Affairs guard
      return Promise.resolve(
        jsonResponse(200, {
          email_id: 'ramesh@campus.edu',
          name: 'Ramesh Staff',
          role: 'office_staff',
          dept: 'Student Affairs',
        }),
      )
    })
    vi.stubGlobal('fetch', fetchStaff)
    const { user, router } = renderRoute({ route: '/login?next=%2Ftracks%2Fdocdesk%2Fstaff' })
    await user.type(screen.getByLabelText('Email'), 'ramesh@campus.edu')
    await user.type(screen.getByLabelText('Password'), '333333')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/tracks/docdesk/staff'))
    expect(loadSession()?.user.role).toBe('office_staff')
    expect(fetchStaff.mock.calls[0][0]).toMatch(/\/api\/v1\/auth\/login$/)
  })

  // Verify the session state shape is identical regardless of user vs admin recovery
  it('9d. produces correct session shape via user login', async () => {
    const fetchUser = vi.fn().mockResolvedValue(token('faculty', 'Prof Rao', 'rao@team1.com'))
    vi.stubGlobal('fetch', fetchUser)
    const { user } = renderRoute({ route: '/login' })
    await user.type(screen.getByLabelText('Email'), 'rao@team1.com')
    await user.type(screen.getByLabelText('Password'), '123456')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => expect(loadSession()).not.toBeNull())
    const userSession = loadSession()

    expect(Object.keys(userSession!)).toEqual(['accessToken', 'expiresAt', 'user'])
    expect(Object.keys(userSession!.user)).toEqual(['id', 'name', 'email', 'role'])
    expect(userSession!.user.role).toBe('faculty')
  })

  it('9e. produces identical session shape via admin recovery', async () => {
    const fetchAdmin = vi.fn()
      .mockResolvedValueOnce(
        jsonResponse(400, {
          error: { code: 'USE_ADMIN_LOGIN', message: 'Use admin login' },
          request_id: 'req_shape_400',
        }),
      )
      .mockResolvedValueOnce(token('admin', 'Admin Rao', 'admin@team1.com'))

    vi.stubGlobal('fetch', fetchAdmin)
    const { user } = renderRoute({ route: '/login' })
    await user.type(screen.getByLabelText('Email'), 'admin@team1.com')
    await user.type(screen.getByLabelText('Password'), '123456')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => expect(loadSession()).not.toBeNull())
    const adminSession = loadSession()

    expect(Object.keys(adminSession!)).toEqual(['accessToken', 'expiresAt', 'user'])
    expect(Object.keys(adminSession!.user)).toEqual(['id', 'name', 'email', 'role'])
    expect(adminSession!.user.role).toBe('admin')
  })

  // 10. Service layer preserves direct signInAdmin without exposing role options in the UI
  it('10. preserves underlying admin service code for programmatic admin authentication', async () => {
    const fetchMock = vi.fn().mockResolvedValue(token('admin', 'Direct Admin', 'admin@direct.edu'))
    vi.stubGlobal('fetch', fetchMock)

    // Call service level signInAdmin directly
    const { signInAdmin } = await import('@/core/auth/authService')
    const adminUser = await signInAdmin('admin@direct.edu', 'direct123')

    expect(adminUser.role).toBe('admin')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/v1\/auth\/admin\/login$/)
  })

  it('handles rate limited response with countdown notice', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      jsonResponse(429, { error: { code: 'RATE_LIMITED', message: 'Too many requests' } }),
    ))
    const { user } = renderRoute({ route: '/login' })
    await user.type(screen.getByLabelText('Email'), 'asha@team1.com')
    await user.type(screen.getByLabelText('Password'), '111111')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Too many login attempts')
    expect(screen.getByRole('button', { name: /Wait \d+s/i })).toBeDisabled()
  })
})

describe('RequireAuth', () => {
  it('redirects signed-out users to /login with next', async () => {
    const { router } = renderRoute({ route: '/tracks/example' })
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(router.state.location.search).toBe('?next=%2Ftracks%2Fexample')
  })

  it('redirects signed-in users away from /login', async () => {
    const { router } = renderRoute({ route: '/login', user: true })
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
  })
})
