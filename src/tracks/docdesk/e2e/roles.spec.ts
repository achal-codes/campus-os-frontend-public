import { expect, test } from '../../../../e2e/fixtures'
import { LoginPage } from '../../../../e2e/pages/LoginPage'

const mockDocTypes = [
  {
    doc_type_id: 'DT-1',
    name: 'Bonafide Certificate',
    description: 'Official proof of active enrollment.',
    status: 'active',
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
  },
  {
    doc_type_id: 'DT-2',
    name: 'Official Transcript',
    description: 'Cumulative academic grade card.',
    status: 'active',
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
  },
]

const mockRequests = [
  {
    request_id: 'DRQ-SA-001',
    doc_type_id: 'DT-1',
    doc_type_name: 'Bonafide Certificate',
    reason: 'Application for scholarship',
    status: 'pending',
    requested_by: 'student@team24.com',
    requested_by_name: 'John Student',
    requested_by_role: 'student',
    created_at: '2026-10-31T08:00:00Z',
    updated_at: '2026-10-31T08:00:00Z',
  },
  {
    request_id: 'DRQ-SA-002',
    doc_type_id: 'DT-2',
    doc_type_name: 'Official Transcript',
    reason: 'Internship verification',
    status: 'answered',
    requested_by: 'faculty@team24.com',
    requested_by_name: 'Prof. Miller',
    requested_by_role: 'faculty',
    created_at: '2026-10-30T10:00:00Z',
    updated_at: '2026-10-30T14:00:00Z',
  },
]

test.describe('DocDesk Role-Based Access & E2E Coverage', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/docdesk/doc-types**', async (route) => {
      await route.fulfill({ json: { items: mockDocTypes, next_cursor: null } })
    })

    await page.route('**/api/v1/docdesk/requests**', async (route) => {
      await route.fulfill({
        json: {
          items: mockRequests,
          next_cursor: null,
          count: mockRequests.length,
        },
      })
    })
  })

  test('1. SA sign-in lands on the staff queue; queue rows render', async ({ page }) => {
    const login = new LoginPage(page)
    await login.goto()
    await login.signIn('sa.officer@team24.com')
    await page.waitForURL('/')

    await page.goto('/tracks/docdesk/staff')
    await expect(page).toHaveURL('/tracks/docdesk/staff')
    await expect(page.getByRole('heading', { level: 1, name: 'Document requests' })).toBeVisible()
    await expect(page.locator('[data-testid="queue-row-DRQ-SA-001"]:visible')).toBeVisible()
  })

  test('2. Admin sign-in sees the read-only overview with no action buttons', async ({ page }) => {
    const login = new LoginPage(page)
    await login.goto()
    // Admin email triggers USE_ADMIN_LOGIN recovery path to /auth/admin/login
    await login.signIn('admin@team24.com')
    await page.waitForURL('/')

    await page.goto('/tracks/docdesk/admin')
    await expect(page).toHaveURL('/tracks/docdesk/admin')
    await expect(page.getByRole('heading', { name: 'DocDesk — Institutional Audit & Overview' })).toBeVisible()
    await expect(page.getByText('STRICTLY READ-ONLY')).toBeVisible()

    // Assert action buttons are completely absent
    await expect(page.getByRole('button', { name: /New Request/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Send Answer/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Set TAT/i })).toHaveCount(0)
  })

  test('3. Requester sign-in cannot reach /tracks/docdesk/staff (guard redirects)', async ({ page }) => {
    const login = new LoginPage(page)
    await login.goto()
    await login.signIn('student@team24.com')
    await page.waitForURL('/')

    // Navigate to restricted Student Affairs staff queue
    await page.goto('/tracks/docdesk/staff')

    // Guard redirects requester back to /tracks/docdesk
    await expect(page).toHaveURL(/\/tracks\/docdesk$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Document requests' })).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 1, name: 'DocDesk — Document Portal' })).toBeVisible()
  })
})
