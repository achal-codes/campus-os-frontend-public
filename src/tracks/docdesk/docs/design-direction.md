# DocDesk Design Direction — Premium Glassmorphism & Top Navigation

## 1. Aesthetic Vision: Premium Academic SaaS
- **Visual Personality**: High-end university administrative system, blending frosted glassmorphism with crisp academic typography, refined purple accents, and fluid responsiveness.
- **Surface Elevation & Glass System**:
  - `backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);`
  - Translucent surfaces: `rgba(255, 255, 255, 0.72)` in light theme, `rgba(26, 22, 37, 0.75)` in dark theme.
  - Delicate border strokes: `1px solid rgba(255, 255, 255, 0.45)` (light) / `rgba(255, 255, 255, 0.1)` (dark).
  - Ambient elevation shadows: `0 8px 32px 0 rgba(112, 60, 200, 0.08)` (light) / `0 8px 32px 0 rgba(0, 0, 0, 0.45)` (dark).
  - High-performance fallback: `@supports not (backdrop-filter: blur(1px))` provides opaque, high-contrast theme surfaces.

## 2. Global Top Toolbar (No Left Sidebar)
- **Top Navigation Model**: Replaces the left sidebar with a sticky, translucent horizontal glass toolbar across all DocDesk screens.
- **Left**: DocDesk brand glyph (`📄` / `◈ DocDesk`), title, and subtle CampusOS breadcrumb.
- **Center**: Role-aware horizontal navigation pills:
  - *Requester*: **My Requests**, **New Request**
  - *Student Affairs*: **Dashboard**, **Requests** (Queue), **Document Types**
  - *Admin*: **Overview**, **Request Audit**
- **Right**:
  - Role pill badge (e.g., `Requester`, `Student Affairs`, `Admin`)
  - User name and institutional domain badge
  - Theme toggle (Sun / Moon)
  - Logout action
- **Mobile (<768px)**: Compact bar with hamburger trigger, accessible glass drawer menu, touch targets >= 44px, outside click and Escape-key closure.

## 3. The Eight Complete Wireframe Screens
1. **Screen 1 — My Requests**: Requester table/cards with live status/type glass filters and cursor pagination.
2. **Screen 2 — New Document Request**: Centered glass card with dynamic active doc-type selector and 5-1000 char validation.
3. **Screen 3 — Pending Request Details**: Request info, TAT indicator, glass edit modal, and withdraw confirmation dialog.
4. **Screen 4 — Answered & Acknowledged Details**: Two-panel response & staff document download, verified `file` multipart filled-form upload/replace/remove, accessible Acknowledge modal.
5. **Screen 5 — Student Affairs Request Queue**: Filter glass panel, pending-only multi-selection checkboxes, select-all on page, selected counter, navigation to Screen 8.
6. **Screen 6 — Student Affairs Process Request**: 3-panel split view (Requester info, TAT picker with IST validation, Staff document & Answer composer with 1-2000 char validation).
7. **Screen 7 — Document Type Management**: Two-panel layout with Add/Edit Document Type form and Existing Types table (active/archived tabs, activate, archive, delete).
8. **Screen 8 — Bulk Turnaround Time**: Dedicated full-page screen with Left Pending Requests selection list and Right Apply Turnaround Time form (atomic all-or-nothing submission).

## 4. Color & Contrast Accessibility
- Primary accent: CampusOS brand purple (`#7c3aed` / `var(--color-primary)`).
- Semantic statuses:
  - `Pending`: Amber (`#d97706` / `#fef3c7`)
  - `Answered`: Sky/Blue (`#0284c7` / `#e0f2fe`)
  - `Acknowledged`: Emerald/Green (`#059669` / `#d1fae5`)
  - `Error / Destructive`: Rose/Red (`#e11d48` / `#ffe4e6`)
- Every status pairs text with distinct typography and icons; color is never the sole information carrier.
- WCAG AA contrast ratio (> 4.5:1) guaranteed in both light and dark modes against glass panels.
