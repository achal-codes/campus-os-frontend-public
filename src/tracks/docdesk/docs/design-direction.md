# DocDesk Design Direction — Single-Shell Wireframe Standards

## 1. Aesthetic Mandate: Plain Wireframe Language
- **Visual Personality**: High-contrast, typography-led enterprise university administrative system adhering strictly to organizer wireframe mandates.
- **Surface Elevation & Color Tokens**:
  - Solid surfaces: White (`#ffffff` / `var(--color-surface)`) in light mode; dark neutral (`var(--color-surface)`) in dark mode.
  - Page background: Light neutral (`var(--color-bg)`).
  - Single brand accent: Semantic `#4338ca` / `var(--color-primary)` (indigo/purple).
  - Borders: Simple 1px neutral borders (`var(--color-border)`).
  - Forbidden decorations: Zero glassmorphism, zero `backdrop-filter`, zero linear/radial gradients, zero emoji glyphs, zero decorative glow.
- **Clarity Over Cleverness**:
  Every screen answers within 3 seconds: Where am I? What is the state? What can I do next? What is the primary action?

## 2. Single-Shell Navigation Architecture
- **Global CampusOS Header (`AppLayout`)**:
  - The ONLY sticky header (`position: sticky; top: 0; z-index: 10`).
  - Owns global branding ("Campus OS"), global track navigation, user identity, theme toggle, sign-out, and the single `<main>` landmark.
- **DocDesk Workspace (`DocDeskLayout`)**:
  - Two-column CSS Grid: `240px minmax(0, 1fr)`.
  - Local Sidebar (`DocDeskSidebar`): `position: sticky; top: var(--shell-header-height, 57px); align-self: start; max-height: calc(100vh - var(--shell-header-height, 57px)); overflow-y: auto;`.
  - Role-aware sidebar links (Exact labels):
    - *Requester*: **My Requests**, **New Request**
    - *Student Affairs*: **Dashboard**, **Requests**, **Document Types**
    - *Admin*: **Request Audit**
    - *Bulk TAT*: Not in sidebar; reachable exclusively via multi-selection from Requests queue.
- **Mobile Navigation (<= 768px)**:
  - Accessible modal drawer dialog (`role="dialog"`, `aria-modal="true"`) with backdrop (solid translucent neutral, NO blur).
  - Non-sticky "Menu" button trigger (`aria-expanded`, `aria-controls="docdesk-sidebar-drawer"`).
  - Accessible focus trap (Tab and Shift+Tab cycle within drawer).
  - Reversible body scroll lock (`overflow: hidden` on open, fully restored on close/route-change/unmount).
  - Escape key, backdrop click, close button, and route change dismissals with focus returning to trigger button.

## 3. Status Badges & Lifecycle
- Exactly three request statuses:
  - `Pending`: Amber-tinted pill (`#fef3c7` / text `#92400e`), solid amber dot.
  - `Answered`: Indigo-tinted pill (`#e0e7ff` / text `#3730a3`), solid indigo dot.
  - `Acknowledged`: Green-tinted pill (`#dcfce7` / text `#166534`), solid green dot.
- "Withdrawn" is strictly never rendered as a status.
- Color is never the sole information carrier: text label and shape/dot are always paired.

## 4. Accessibility (WCAG 2.2 AA)
- Contrast ratio >= 4.5:1 for body text and >= 3:1 for UI borders and controls across both light and dark themes.
- Touch target minimum 44x44px on all interactive controls.
- Keyboard accessible without trap traps; Escape closes all dialogs and modals.
- Tabular figures (`tabular-nums`) for all IDs, dates, and metric counters.
