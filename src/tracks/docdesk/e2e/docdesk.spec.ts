import { expect, test } from '../../../../e2e/fixtures'

test.describe('docdesk track', () => {
  test('opens from the home grid and displays the requester dashboard', async ({ signedInPage: page }, testInfo) => {
    await page.getByTestId('track-card-docdesk').click()
    await expect(page).toHaveURL(/\/tracks\/docdesk$/)
    await expect(page.getByRole('heading', { name: /DocDesk — Document Portal/i })).toBeVisible()
    await expect(page.getByTestId('docdesk-nav')).toBeVisible()
    await page.screenshot({ path: `test-results/screenshots/${testInfo.project.name}-dashboard.png` })
  })
})
