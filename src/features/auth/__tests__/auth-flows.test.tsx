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

describe('Login Authentication Flows', () => {
  it('shows field errors without submitting if required fields are missing', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { user } = renderRoute({ route: '/login' })
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('Email is required.')
    expect(screen.getByLabelText('OTP')).toHaveAccessibleDescription('OTP is required.')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  // 1. Standard user login sends POST /api/v1/auth/login and establishes a session
  it('1. standard user login sends POST /api/v1/auth/login and establishes session', async () => {
    const fetchMock = vi.fn().mockResolvedValue(token('student', 'Asha Kumar', 'asha@team1.com'))
    vi.stubGlobal('fetch', fetchMock)
    const { user, router } = renderRoute({ route: '/login?next=%2Ftracks%2Fexample' })

    await user.type(screen.getByLabelText('Email'), 'Asha@team1.com')
    await user.type(screen.getByLabelText('OTP'), '482913')
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
    await user.type(screen.getByLabelText('OTP'), '123456')
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
    await user.type(screen.getByLabelText('OTP'), '999999')
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
    await user.type(screen.getByLabelText('OTP'), '123456')
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
    await userA.type(screen.getByLabelText('OTP'), '123456')
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
    await user.type(screen.getByLabelText('OTP'), '123456')
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
    await user.type(screen.getByLabelText('OTP'), '777888')
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
    await user.type(screen.getByLabelText('OTP'), '123456')

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
    await user.type(screen.getByLabelText('OTP'), '123456')
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
    await user.type(screen.getByLabelText('OTP'), '123456')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    const timeoutAlert = await screen.findByRole('alert')
    expect(timeoutAlert).toHaveTextContent('The server took too long to respond')
    expect(screen.getByTestId('login-retry-button')).toBeInTheDocument()
  })

  // 9. Verify the session state shape is identical regardless of which endpoint produced it.
  it('9a. produces correct session shape via user login', async () => {
    const fetchUser = vi.fn().mockResolvedValue(token('faculty', 'Prof Rao', 'rao@team1.com'))
    vi.stubGlobal('fetch', fetchUser)
    const { user } = renderRoute({ route: '/login' })
    await user.type(screen.getByLabelText('Email'), 'rao@team1.com')
    await user.type(screen.getByLabelText('OTP'), '123456')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => expect(loadSession()).not.toBeNull())
    const userSession = loadSession()

    expect(Object.keys(userSession!)).toEqual(['accessToken', 'expiresAt', 'user'])
    expect(Object.keys(userSession!.user)).toEqual(['id', 'name', 'email', 'role'])
    expect(userSession!.user.role).toBe('faculty')
  })

  it('9b. produces identical session shape via admin login', async () => {
    const fetchAdmin = vi.fn().mockResolvedValue(token('admin', 'Admin Rao', 'admin@team1.com'))
    vi.stubGlobal('fetch', fetchAdmin)
    const { user } = renderRoute({ route: '/login?mode=admin' })
    await user.type(screen.getByLabelText('Email'), 'admin@team1.com')
    await user.type(screen.getByLabelText('OTP'), '123456')
    await user.click(screen.getByRole('button', { name: 'Sign in as Admin' }))

    await waitFor(() => expect(loadSession()).not.toBeNull())
    const adminSession = loadSession()

    expect(Object.keys(adminSession!)).toEqual(['accessToken', 'expiresAt', 'user'])
    expect(Object.keys(adminSession!.user)).toEqual(['id', 'name', 'email', 'role'])
    expect(adminSession!.user.role).toBe('admin')
  })

  // 10. Explicit admin sign-in mode posts directly to /auth/admin/login
  it('10. in explicit admin mode, posts directly to /api/v1/auth/admin/login', async () => {
    const fetchMock = vi.fn().mockResolvedValue(token('admin', 'Admin Team', 'admin@team24.com'))
    vi.stubGlobal('fetch', fetchMock)
    const { user } = renderRoute({ route: '/login' })

    // Toggle into admin mode
    await user.click(screen.getByTestId('toggle-admin-login'))
    expect(screen.getByRole('heading', { name: 'Administrator Sign In' })).toBeInTheDocument()

    await user.type(screen.getByLabelText('Email'), 'admin@team24.com')
    await user.type(screen.getByLabelText('OTP'), '654321')
    await user.click(screen.getByRole('button', { name: 'Sign in as Admin' }))

    await waitFor(() => expect(screen.getByTestId('nav-admin')).toBeInTheDocument())

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/v1\/auth\/admin\/login$/)
  })

  it('handles rate limited response with countdown notice', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      jsonResponse(429, { error: { code: 'RATE_LIMITED', message: 'Too many requests' } }),
    ))
    const { user } = renderRoute({ route: '/login' })
    await user.type(screen.getByLabelText('Email'), 'asha@team1.com')
    await user.type(screen.getByLabelText('OTP'), '111111')
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
