# DocDesk Implementation Notes — Team 24

## 1. Team 24 Configuration & Institutional Context
- **Team ID**: `24`
- **Team Name**: `Team 24`
- **Team Domain**: `team24.com`
- **Team Admin Name**: `Team 24 Admin`
- **Team Admin Email**: `admin@team24.com`
- **Team Admin Phone**: `9000000024`
- **Track ID**: `docdesk` (Mount path: `/tracks/docdesk`)

> **Credential & OTP Safety Policy**:
> All login OTPs are treated as confidential, single-session secrets. No literal OTP is ever hardcoded, logged, screenshot, committed, or written to documentation. Testing configuration templates live in `.env.e2e.example` with blank placeholders. Team metadata is strictly decoupled from permissions; permissions are evaluated strictly through the central typed engine in `permissions/permissions.ts`.

---

## 2. Single-Shell Architecture & Refinement
1. **Single-Shell Hierarchy**:
   - `AppLayout` exclusively owns the application header (`position: sticky; top: 0; z-index: 10`), global track navigation, user identity (`user.name`), theme switcher (`ThemeToggle`), sign-out button, and the single `<main>` landmark.
   - `DocDeskLayout` owns the workspace layout and local sidebar (`DocDeskSidebar`).
   - The duplicate `DocDeskTopbar` has been completely deleted.
2. **Nested `<main>` Elimination**:
   - `DocDeskLayout` replaced `<main id="docdesk-main-content">` with `<section className={styles.workspaceSection} id="docdesk-workspace-content">`. Exactly one `<main>` landmark exists in the document.
3. **Width Constraint & Additive Modifier**:
   - `AppLayout.module.css` previously restricted `.main` to `max-width: 1120px; margin: 0 auto; padding: var(--space-7) var(--space-4);`. Inside this container, a 240px sidebar reduced tabular views to ~856px on 1280px–1920px viewports.
   - Resolution: Introduced an additive modifier in `src/app/AppLayout.tsx` (`styles.mainDocDesk`) applied strictly when `location.pathname.startsWith('/tracks/docdesk')`. It lifts `max-width` to `100%` and adjusts padding, allowing DocDesk's CSS Grid (`240px minmax(0, 1fr)`) to utilize the full available desktop width without horizontal overflow.
   - Non-DocDesk tracks remain completely untouched at `max-width: 1120px` (verified by unit test in `singleShell.test.tsx`).
4. **Mobile Navigation & Scroll Lock**:
   - Mobile viewport (<= 768px): Desktop sidebar is hidden; workspace renders a non-sticky "Menu" button (`data-testid="docdesk-menu-toggle"`) with `aria-expanded` and `aria-controls`.
   - Drawer Dialog: Has `role="dialog"`, `aria-modal="true"`, accessible focus trap cycling Tab / Shift+Tab only inside drawer elements.
   - Reversible scroll lock: Saves `document.body.style.overflow`, sets `document.body.style.overflow = 'hidden'`, and fully restores original overflow on close, route change, and unmount.
5. **Exact Role Navigation Links**:
   - **Requester**: `My Requests`, `New Request`.
   - **Student Affairs**: `Dashboard`, `Requests`, `Document Types`. (No "My Requests", no "Bulk TAT" in primary sidebar).
   - **Admin**: `Request Audit` (no duplicate destinations).
   - Bulk TAT is reached exclusively through queue selection passing real request IDs. Direct visits without selection render a clear empty state with a return link.
6. **Plain Wireframe Standards**:
   - Solid white cards, light neutral background, `#4338ca` accent.
   - Zero gradients, zero `backdrop-filter`, zero emoji glyphs.
   - Three statuses only: `Pending`, `Answered`, `Acknowledged`. Never "Withdrawn".

---

## 3. Guarding Strategy
- `RequesterGuard`: Allows `student`, `faculty`, and `office_staff`. Redirects `admin` directly to `/tracks/docdesk/admin`.
- `StudentAffairsGuard`: Waits for profile hydration (`/users/me`), verifies `role === 'office_staff'` and `isStudentAffairs(dept)`.
- `AdminGuard`: Checks `role === 'admin'`. Never blocks on profile hydration.

---

## 4. Test Suite Verification
- `npm run lint`: 0 warnings, 0 errors.
- `npm run typecheck`: clean (`tsc -b`).
- `npm run test:track docdesk`: 17 test files, 81/81 tests passed.
- `npm test`: 25 test files, 116/116 tests passed.
- `npm run build`: built in 522ms (`tsc -b && vite build`).
- `npm run test:e2e`: 42/42 Playwright tests passed across `chromium-light`, `chromium-dark`, and `mobile`.
