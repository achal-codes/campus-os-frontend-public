import { expect, test, type Page } from '../../../../e2e/fixtures'
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
  {
    doc_type_id: 'DT-3',
    name: 'Legacy NOC',
    description: 'Archived certificate format.',
    status: 'archived',
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  },
]

const mockPendingReq = {
  request_id: 'DRQ-001',
  doc_type_id: 'DT-1',
  doc_type_name: 'Bonafide Certificate',
  reason: 'Required for external scholarship application deadline.',
  status: 'pending',
  requested_by: 'student@campus.edu',
  requested_by_name: 'John Student',
  requested_by_role: 'student',
  created_at: '2026-10-28T09:30:00Z',
  updated_at: '2026-10-28T09:30:00Z',
}

const mockAnsweredReq = {
  request_id: 'DRQ-002',
  doc_type_id: 'DT-2',
  doc_type_name: 'Official Transcript',
  reason: 'Applying for master degree admission abroad.',
  status: 'answered',
  requested_by: 'student@campus.edu',
  requested_by_name: 'John Student',
  requested_by_role: 'student',
  created_at: '2026-10-25T10:00:00Z',
  updated_at: '2026-10-26T14:00:00Z',
  answer: {
    message: 'Your official transcript is attached. Please sign and return.',
    answered_by: 'staff@campus.edu',
    answered_by_name: 'Affairs Officer Jane',
    answered_at: '2026-10-26T14:00:00Z',
  },
  document: {
    file_id: 'FILE-01',
    filename: 'transcript_certified.pdf',
    content_type: 'application/pdf',
    size_bytes: 65400,
  },
}

const mockAcknowledgedReq = {
  request_id: 'DRQ-003',
  doc_type_id: 'DT-1',
  doc_type_name: 'Bonafide Certificate',
  reason: 'Bank account verification.',
  status: 'acknowledged',
  requested_by: 'student@campus.edu',
  requested_by_name: 'John Student',
  requested_by_role: 'student',
  created_at: '2026-10-20T10:00:00Z',
  updated_at: '2026-10-22T12:00:00Z',
  acknowledged_at: '2026-10-22T12:00:00Z',
  answer: {
    message: 'Certificate issued directly.',
    answered_by: 'staff@campus.edu',
    answered_by_name: 'Affairs Officer Jane',
    answered_at: '2026-10-22T11:00:00Z',
  },
}

async function captureScreen(page: Page, projectName: string, viewName: string) {
  await page.screenshot({ path: `test-results/screenshots/${projectName}-${viewName}.png` })
  if (projectName === 'chromium-light') {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.screenshot({ path: `test-results/screenshots/tablet-${viewName}.png` })
    await page.setViewportSize({ width: 1280, height: 720 })
  }
}

async function verifyNoHorizontalScroll(page: Page) {
  const hasHorizontalScroll = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(hasHorizontalScroll).toBe(false)
}

test.describe('DocDesk Visual QA & Responsive Inspection', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept DocDesk API routes
    await page.route('**/api/v1/docdesk/doc-types**', async (route) => {
      await route.fulfill({ json: { items: mockDocTypes, next_cursor: null } })
    })

    await page.route('**/api/v1/docdesk/requests**', async (route) => {
      const url = route.request().url()
      if (url.includes('/DRQ-001')) {
        await route.fulfill({ json: mockPendingReq })
      } else if (url.includes('/DRQ-002')) {
        await route.fulfill({ json: mockAnsweredReq })
      } else if (url.includes('/DRQ-003')) {
        await route.fulfill({ json: mockAcknowledgedReq })
      } else {
        await route.fulfill({
          json: {
            items: [mockPendingReq, mockAnsweredReq, mockAcknowledgedReq],
            next_cursor: null,
          },
        })
      }
    })

    await page.route('**/api/v1/users/me**', async (route) => {
      await route.fulfill({ json: { dept: 'Student Affairs' } })
    })
  })

  test('View 1 to 5: Requester Screens at all breakpoints and themes', async ({ page }, testInfo) => {
    const login = new LoginPage(page)
    await login.goto()
    await login.signIn('student@campus.edu')
    await page.waitForURL('/')

    const projectName = testInfo.project.name

    // 1. My Requests
    await page.goto('/tracks/docdesk/my-requests')
    await expect(page.getByRole('heading', { name: 'My requests' })).toBeVisible()
    await captureScreen(page, projectName, 'view01-my-requests')
    if (projectName === 'mobile') await verifyNoHorizontalScroll(page)

    // 2. New Request Form
    await page.goto('/tracks/docdesk/new')
    await expect(page.getByRole('heading', { name: 'Request a document' })).toBeVisible()
    await captureScreen(page, projectName, 'view02-request-form')
    if (projectName === 'mobile') await verifyNoHorizontalScroll(page)

    // 3. Request Detail - Pending
    await page.goto('/tracks/docdesk/requests/DRQ-001')
    await expect(page.getByRole('heading', { name: 'Request details' })).toBeVisible()
    await captureScreen(page, projectName, 'view03-detail-pending')
    if (projectName === 'mobile') await verifyNoHorizontalScroll(page)

    // 4. Request Detail - Answered
    await page.goto('/tracks/docdesk/requests/DRQ-002')
    await expect(page.getByRole('heading', { name: 'Request details' })).toBeVisible()
    await captureScreen(page, projectName, 'view04-detail-answered')
    if (projectName === 'mobile') await verifyNoHorizontalScroll(page)

    // 5. Request Detail - Acknowledged
    await page.goto('/tracks/docdesk/requests/DRQ-003')
    await expect(page.getByRole('heading', { name: 'Request details' })).toBeVisible()
    await captureScreen(page, projectName, 'view05-detail-acknowledged')
    if (projectName === 'mobile') await verifyNoHorizontalScroll(page)
  })

  test('View 6 to 11: Student Affairs Screens', async ({ page }, testInfo) => {
    // Intercept login to return office_staff with Student Affairs
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        json: {
          access_token: 'staff-token',
          token_type: 'bearer',
          expires_in: 3600,
          profile: { role: 'office_staff', name: 'Staff Jane', email_id: 'staff@campus.edu' },
        },
      })
    })

    const login = new LoginPage(page)
    await login.goto()
    await login.signIn('staff@campus.edu')
    await page.waitForURL('/')

    const projectName = testInfo.project.name

    // 6. Staff Queue
    await page.goto('/tracks/docdesk/staff')
    await expect(page.getByRole('heading', { name: 'Document requests' })).toBeVisible()
    await captureScreen(page, projectName, 'view06-staff-queue')
    if (projectName === 'mobile') await verifyNoHorizontalScroll(page)

    // 7. Staff Detail - Pending
    await page.goto('/tracks/docdesk/staff/requests/DRQ-001')
    await expect(page.getByText('Process request: DRQ-001')).toBeVisible()
    await captureScreen(page, projectName, 'view07-staff-detail-pending')
    if (projectName === 'mobile') await verifyNoHorizontalScroll(page)

    // 8. Staff Detail - Answered
    await page.goto('/tracks/docdesk/staff/requests/DRQ-002')
    await expect(page.getByText('Process request: DRQ-002')).toBeVisible()
    await captureScreen(page, projectName, 'view08-staff-detail-answered')
    if (projectName === 'mobile') await verifyNoHorizontalScroll(page)

    // 9. Document Types Manager (Active tab)
    await page.goto('/tracks/docdesk/staff/doc-types')
    await expect(page.getByRole('heading', { name: 'Document types', exact: true })).toBeVisible()
    await captureScreen(page, projectName, 'view09-doc-types-active')
    if (projectName === 'mobile') await verifyNoHorizontalScroll(page)

    // 10. Document Types Manager (Archived tab)
    await page.getByRole('button', { name: /Archived/i }).click()
    await expect(page.getByText('Legacy NOC')).toBeVisible()
    await captureScreen(page, projectName, 'view10-doc-types-archived')
    if (projectName === 'mobile') await verifyNoHorizontalScroll(page)

    // 11. Bulk TAT Screen
    await page.goto('/tracks/docdesk/staff/bulk-tat')
    await expect(page.getByRole('heading', { name: /Set turnaround time/i })).toBeVisible()
    await captureScreen(page, projectName, 'view11-bulk-tat')
    if (projectName === 'mobile') await verifyNoHorizontalScroll(page)
  })

  test('View 12: Admin Overview / Audit Screen', async ({ page }, testInfo) => {
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        json: {
          access_token: 'admin-token',
          token_type: 'bearer',
          expires_in: 3600,
          profile: { role: 'admin', name: 'Team 24 Admin', email_id: 'admin@team24.com' },
        },
      })
    })

    const login = new LoginPage(page)
    await login.goto()
    await login.signIn('admin@team24.com')
    await page.waitForURL('/')

    const projectName = testInfo.project.name

    await page.goto('/tracks/docdesk/admin')
    await expect(
      page.getByRole('heading', { name: /DocDesk — Institutional Audit & Overview/i }),
    ).toBeVisible()
    await captureScreen(page, projectName, 'view12-admin-overview')
    if (projectName === 'mobile') await verifyNoHorizontalScroll(page)
  })
})
