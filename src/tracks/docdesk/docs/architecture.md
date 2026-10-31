# DocDesk Architecture & Design System

## Phase 1 Architecture Audit: Single-Shell Hierarchy

### 1. Current Hierarchy & Root Causes
- **Route Nesting**:
  CampusOS routes are defined in `src/app/routes.tsx`. Authenticated routes are wrapped by `RequireAuth` and render `AppLayout`. Inside `AppLayout`, `<Outlet />` renders active track routes under `/tracks/:id/*` defined by `defineTrack()`. DocDesk routes mount under `/tracks/docdesk/*`.
- **Global Controls Ownership**:
  `AppLayout` (`src/app/AppLayout.tsx`) owns global branding ("Campus OS"), global track navigation, user identity display (`user.name`), theme switcher (`<ThemeToggle />`), sign-out button, and the single `<main className={styles.main}>` landmark.
- **Root Cause of Duplicate Topbar**:
  `DocDeskLayout.tsx` previously mounted a redundant horizontal `<DocDeskTopbar />` which duplicated user identity, theme toggle, and sign out, and declared `position: sticky; top: 0; z-index: 50`. This competed with `AppLayout.module.css`'s `.header` (`position: sticky; top: 0; z-index: 10`), creating sticky collisions and visual redundancy.
- **Root Cause of Nested `<main>`**:
  `DocDeskLayout.tsx` (line 19) rendered `<main className={styles.mainContent} id="docdesk-main-content">` inside `AppLayout`'s `<main className={styles.main}><Outlet /></main>`, violating WCAG 2.2 AA and HTML semantics (only one `<main>` landmark per document).
- **Width Constraint & Double-Padding Conflict**:
  - `AppLayout.module.css`: `.main` had `max-width: 1120px; margin: 0 auto; padding: var(--space-7) var(--space-4);`.
  - `DocDeskLayout.module.css`: `.mainContent` had `max-width: 1200px; margin: 0 auto; padding: var(--space-6) var(--space-4) var(--space-8);`.
  - When placing a 240px sidebar into an 1120px-constrained container with double horizontal padding, the remaining content column was constrained to ~856px on wide viewports (1280px–1920px), severely cramping tabular data (e.g. Staff Queue, Bulk TAT, Audit).
- **Global Header Height Definition**:
  `AppLayout.module.css` `.header` has `padding: var(--space-3) var(--space-4)` with ~57px rendered height. Defining `--shell-header-height: 57px;` provides an explicit sticky top offset for the DocDesk local sidebar.

### 2. Target Hierarchy & Single-Shell Architecture
- **CampusOS Shell (`AppLayout`)**:
  - Exclusively owns: Global branding, track navigation, user identity, theme toggle, sign-out, and the single `<main>` landmark.
  - Minimal additive modifier: Applied when `location.pathname.startsWith('/tracks/docdesk')` (`styles.mainDocDesk`) to lift the 1120px `max-width` to `100%` and standardize padding, ensuring all non-DocDesk tracks remain completely unchanged at `max-width: 1120px`.
- **DocDesk Workspace (`DocDeskLayout`)**:
  - Zero topbars (`DocDeskTopbar` eliminated).
  - CSS Grid workspace: `grid-template-columns: 240px minmax(0, 1fr)`. `minmax(0, 1fr)` ensures wide tables scroll horizontally without forcing page-level overflow.
  - Local Sidebar (`DocDeskSidebar`): `position: sticky; top: var(--shell-header-height, 57px); align-self: start; max-height: calc(100vh - var(--shell-header-height, 57px)); overflow-y: auto;`.
  - Non-main content wrapper: DocDesk content rendered inside `<section className={styles.workspaceSection}>` or `<div>`, eliminating the nested `<main>`.
  - Mobile Drawer (<= 768px): Accessible drawer dialog (`role="dialog"`, `aria-modal="true"`) with backdrop (solid translucent neutral, no blur), focus trap, and reversible body scroll lock.

---

## Navigation & Role Mapping

### Sidebar Primary Navigation (Exact Labels)
- **Requester** (`student`, `faculty`, `office_staff` outside Student Affairs):
  - `My Requests` &rarr; `/tracks/docdesk/my-requests`
  - `New Request` &rarr; `/tracks/docdesk/new`
- **Student Affairs** (`office_staff` in Student Affairs):
  - `Dashboard` &rarr; `/tracks/docdesk/staff/dashboard`
  - `Requests` &rarr; `/tracks/docdesk/staff`
  - `Document Types` &rarr; `/tracks/docdesk/staff/doc-types`
  *(Note: No "My Requests" or "Bulk TAT" in primary sidebar. Student Affairs staff can still access their own requests via direct URL, and Bulk TAT via queue multi-selection).*
- **Admin**:
  - `Request Audit` &rarr; `/tracks/docdesk/admin` (strictly no duplicate destinations).

---

## Screen Catalog

### Requester Flow
1. **Screen 1 — My Requests (`/tracks/docdesk/my-requests`)**: Status tabs, document type filter, search loaded requests, responsive table / cards, cursor pagination, "View" action.
2. **Screen 2 — New Document Request (`/tracks/docdesk/new`)**: Solid card, active document types only, 5–1000 char live counter, cancel/submit actions.
3. **Screen 3 — Pending Request Details (`/tracks/docdesk/requests/:id`)**: Details card, RequestStepper, TAT badge, in-app Edit Request modal, withdraw action with ConfirmModal.
4. **Screen 4 — Answered & Acknowledged Request Details (`/tracks/docdesk/requests/:id`)**: Official answer card, document download, FilledFormPanel round trip, acknowledge action with ConfirmModal, RequestStepper.
5. **Supporting — Requester Dashboard (`/tracks/docdesk`)**: Overview statistics, quick action links, recent requests list.
6. **Supporting — Document Catalogue (`/tracks/docdesk/catalogue`)**: Active institutional document types grid with quick request links.

### Student Affairs Flow
7. **Screen 5 — Student Affairs Request Queue (`/tracks/docdesk/staff`)**: Status filters, doc type filter, All/Mine scope, search loaded requests, pending-only row checkboxes, floating bottom bulk action bar ("Set TAT for Selected").
8. **Screen 6 — Student Affairs Process Request (`/tracks/docdesk/staff/requests/:id`)**: Requester profile, TAT SLA targets (quick date buttons), Answer composer with file attachment, edit/withdraw answer with ConfirmModal.
9. **Screen 7 — Document Type Management (`/tracks/docdesk/staff/doc-types`)**: Add/Edit type form (3–80 char validation), Active & Archived tabs, archive/restore toggles, permanent delete with ConfirmModal.
10. **Screen 8 — Bulk Turnaround Time (`/tracks/docdesk/staff/bulk-tat`)**: Reachable only via queue row selection. Atomic all-or-nothing batch update (1–100 IDs), date picker, note input, empty state with back button when visited directly with no selection.
11. **Supporting — Student Affairs Operations Hub (`/tracks/docdesk/staff/dashboard`)**: KPI metrics (Pending Workload, Answered Active, Completed, Document Types), immediate action items table.

### Admin Flow (Strict Read-Only)
12. **Supporting — Admin Overview (`/tracks/docdesk/admin`)**: Institution-wide audit view of all requests, filterable by status and doc type, strictly zero mutation controls.
13. **Supporting — Admin Detail (`/tracks/docdesk/admin/requests/:id`)**: Read-only audit inspection of requester profile, submission reason, official answer, attached documents, filled form, RequestStepper.
