import { test as base, type Page } from '@playwright/test'
import { AppShell } from './pages/AppShell'
import { LoginPage } from './pages/LoginPage'

/** Signing in with this email is rejected by the mocked backend; tests use it for the error state. */
export const FAILING_EMAIL = 'fail@team1.com'

/**
 * Stands in for campus-os-backend's login endpoints so e2e runs without a live server.
 * Derives role from email (sa.*@ -> office_staff with Student Affairs dept, admin.*@ -> admin,
 * faculty.*@ -> faculty, default student), except FAILING_EMAIL.
 */
async function mockLogin(page: Page) {
  let activeProfile = {
    role: 'student',
    name: 'Student',
    email_id: 'student@team1.com',
    dept: undefined as string | undefined,
    designation: undefined as string | undefined,
  }

  await page.route('**/api/v1/auth/login', async (route) => {
    const { email_id } = route.request().postDataJSON() as { email_id: string }
    if (email_id === FAILING_EMAIL) {
      await route.fulfill({ status: 401, json: { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email_id or OTP' } } })
      return
    }
    const local = email_id.split('@')[0] ?? email_id
    const name = local.charAt(0).toUpperCase() + local.slice(1)
    const lowerEmail = email_id.toLowerCase()

    let role = 'student'
    let dept: string | undefined = undefined
    let designation: string | undefined = undefined

    if (lowerEmail.startsWith('sa.') || lowerEmail.startsWith('studentaffairs.') || lowerEmail.startsWith('sa@')) {
      role = 'office_staff'
      dept = 'Student Affairs'
    } else if (lowerEmail.startsWith('admin.') || lowerEmail.startsWith('admin@')) {
      role = 'admin'
    } else if (lowerEmail.startsWith('faculty.') || lowerEmail.startsWith('faculty@')) {
      role = 'faculty'
      designation = 'Professor'
    }

    if (role === 'admin') {
      // Backend contract: standard login returns USE_ADMIN_LOGIN for admin accounts
      await route.fulfill({
        status: 400,
        json: {
          error: {
            code: 'USE_ADMIN_LOGIN',
            message: 'This is an admin account, use POST /api/v1/auth/admin/login',
          },
        },
      })
      return
    }

    activeProfile = { role, name, email_id, dept, designation }

    await route.fulfill({
      json: {
        access_token: 'e2e-token',
        token_type: 'bearer',
        expires_in: 3600,
        profile: { role, name, email_id, dept, designation },
      },
    })
  })

  await page.route('**/api/v1/auth/admin/login', async (route) => {
    const { email_id } = route.request().postDataJSON() as { email_id: string }
    if (email_id === FAILING_EMAIL) {
      await route.fulfill({ status: 401, json: { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email_id or OTP' } } })
      return
    }
    const local = email_id.split('@')[0] ?? email_id
    const name = local.charAt(0).toUpperCase() + local.slice(1)
    activeProfile = {
      role: 'admin',
      name,
      email_id,
      dept: undefined,
      designation: undefined,
    }
    await route.fulfill({
      json: {
        access_token: 'e2e-admin-token',
        token_type: 'bearer',
        expires_in: 3600,
        profile: {
          role: 'admin',
          team_id: 'team24',
          institution_name: 'Team 24',
          name,
          email_id,
          phone_number: '9000000024',
        },
      },
    })
  })

  await page.route('**/api/v1/users/me', async (route) => {
    await route.fulfill({
      json: activeProfile,
    })
  })
}

interface Fixtures {
  loginPage: LoginPage
  shell: AppShell
  /** A page already signed in and sitting on the home screen. */
  signedInPage: Page
}

export const test = base.extend<Fixtures>({
  page: async ({ page }, use) => {
    await mockLogin(page)
    await use(page)
  },
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  shell: async ({ page }, use) => use(new AppShell(page)),
  signedInPage: async ({ page }, use) => {
    const login = new LoginPage(page)
    await login.goto()
    await login.signIn('student@team1.com')
    await page.waitForURL('/')
    await use(page)
  },
})

export { expect } from '@playwright/test'
