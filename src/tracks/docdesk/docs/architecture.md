# DocDesk Architecture & Design System

## Overview
DocDesk is structured as a self-contained, enterprise-grade track inside CampusOS, adhering to strict track boundaries:
- Mounted at `/tracks/docdesk`
- Auto-discovered via `defineTrack()` in `src/tracks/docdesk/index.ts`
- Global sticky horizontal navigation via `DocDeskTopbar` (`data-testid="docdesk-nav"`) replacing all legacy sidebars
- Premium frosted glass design system implemented in `theme/glass.module.css` with dark mode support and graceful `@supports not (backdrop-filter)` fallbacks
- Role-based route guards (`RequesterGuard`, `StudentAffairsGuard`, `AdminGuard`)
- Track-local adapter `api/http.ts` for authenticated multipart upload and binary blob downloads
- All routes lazily loaded for minimal initial bundle overhead

## Complete Screen Catalog

### Requester Flow
1. **Screen 1 — My Requests (`/tracks/docdesk/my-requests`)**: Frosted glass filter panel (status pills, dynamic doc types, search), dual desktop table / mobile cards, cursor pagination, "View" action.
2. **Screen 2 — New Document Request (`/tracks/docdesk/new`)**: Centered glass card, dynamic active document types with description callouts, reason input with 5–1000 char live counter, cancel/submit actions.
3. **Screen 3 — Pending Request Details (`/tracks/docdesk/requests/:id`)**: Split glass layout, request info, TAT badge, edit request glass modal, withdraw action with confirmation.
4. **Screen 4 — Answered & Acknowledged Request Details (`/tracks/docdesk/requests/:id`)**: Official response box, document download, filled-form round trip panel, acknowledge action with confirmation, chronological activity timeline.
5. **Supporting — Requester Dashboard (`/tracks/docdesk`)**: Overview statistics (Pending, Answered, Completed), quick action buttons, recent requests glass list.
6. **Supporting — Document Catalogue (`/tracks/docdesk/catalogue`)**: Grid of active institutional document types with "Request This Document" quick navigation.

### Student Affairs Flow
7. **Screen 5 — Student Affairs Request Queue (`/tracks/docdesk/staff`)**: Glass filter panel (status pills, doc type, All/Mine scope, search), multi-select checkboxes for pending rows, "Set Bulk TAT" button with badge, desktop table & mobile cards.
8. **Screen 6 — Student Affairs Process Request (`/tracks/docdesk/staff/requests/:id`)**: 3-panel layout (Panel A: Requester info & filled form download; Panel B: Turnaround Time SLA target; Panel C: Answer & resolution composer / document upload, edit/withdraw answer, requester acknowledgment tracking), activity timeline.
9. **Screen 7 — Document Type Management (`/tracks/docdesk/staff/doc-types`)**: Two-column layout (Left: Add/Edit Type form with 3–80 char validation and active toggle; Right: Active & Archived types glass tables with edit, archive, restore, delete actions).
10. **Screen 8 — Bulk Turnaround Time (`/tracks/docdesk/staff/bulk-tat`)**: Dedicated screen under `StudentAffairsGuard`. Two-column layout (Left: Pending requests selection table with select-all; Right: Apply TAT form with `expected_by >= today IST`, optional note, affected preview list, atomic all-or-nothing batch update).
11. **Supporting — Student Affairs Operations Hub (`/tracks/docdesk/staff/dashboard`)**: Real-time KPI metrics (Pending Workload, Answered Active, Completed, Document Types), immediate action items table.

### Admin Flow (Strict Read-Only)
12. **Supporting — Admin Overview (`/tracks/docdesk/admin`)**: Institution-wide audit inspection of all requests, filterable by status and doc type, strictly zero mutation controls.
13. **Supporting — Admin Detail (`/tracks/docdesk/admin/requests/:id`)**: Complete read-only audit inspection of requester profile, submission reason, official answer, attached documents, filled form, and chronological timeline. Explicit "ADMIN AUDIT MODE (MUTATION DISABLED)" badge.

## File Organization
```
src/tracks/docdesk/
├── api/            # Typed endpoints and HTTP transport adapter (VERIFIED-LIVE)
├── components/     # Topbar, Layout, Guards, Badges, Modals, CommunicationPanel
├── docs/           # api-matrix.md, api-quirks.md, architecture.md, testing-report.md
├── hooks/          # useProfile, useCursorPagination
├── permissions/    # Central typed permission engine (can())
├── routes.tsx      # Route definitions with track-local guards
├── screens/        # All 8 Wireframe Screens + 5 Supporting Screens
├── theme/          # glass.module.css (frosted glass tokens & utility classes)
├── types/          # Strict TypeScript interfaces
└── utils/          # Department normalisation, time (IST), errors, file validation
```

## Security & Boundary Architecture
- Strict track boundaries verified by `boundaries.test.ts`: docdesk files import only from `@/ui`, `@/theme`, `@/core`, and track-local files.
- Admin permissions strictly read-only: Admin cannot create, edit, answer, upload, or delete any requests or document types.
- Student Affairs operations strictly isolated to users with `role: "office_staff"` and normalized department `"Student Affairs"`.
