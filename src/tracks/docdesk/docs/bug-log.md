# DocDesk Comprehensive Bug Log

This document records all findings discovered during the deep-dive audit across API contracts, permissions, state management, forms, dates, files, security, accessibility, responsiveness, code quality, and login/session flows, along with their tested resolutions.

## Summary by Severity

| Severity Level | Definition | Count | Status |
|---|---|:---:|:---:|
| **S1** | Data loss, security hole, wrong permission, app crash | **0** | No critical vulnerabilities found |
| **S2** | Broken workflow or wrong data shown | **4** | Resolved & Verified |
| **S3** | Visual, accessibility or polish defect | **2** | Resolved & Verified |
| **S4** | Code quality, loose typing, dead code | **3** | Resolved & Verified |
| **Total** | | **9** | **All 9 Resolved** |

---

## Detailed Findings & Resolutions

### BUG-01
- **Severity**: S2
- **Where**: `src/tracks/docdesk/api/requests.ts`
- **Repro steps**: Student Affairs submits an initial official answer containing only a message (no document attached).
- **Root cause**: `createAnswer` previously branched on `!document` and attempted to call JSON endpoints. The live FastAPI backend at `POST /api/v1/docdesk/requests/{request_id}/answer` accepts only `multipart/form-data`, returning `422 Unprocessable Entity` for JSON bodies.
- **Resolution**: Enforced `FormData` payload with `form.append('message', message)` via `apiUpload<DocRequest>` for all initial answers regardless of whether an attachment file is present.
- **Commit**: `e98ff91` (`fix(docdesk): enforce multipart FormData for initial answer API (BUG-01)`)
- **Regression Test**: `src/tracks/docdesk/__tests__/apiAnswer.test.ts` (VERIFIED-MOCKED, VERIFIED-LIVE)

---

### BUG-02
- **Severity**: S2
- **Where**: `src/tracks/docdesk/screens/StaffQueueScreen.tsx` & `src/tracks/docdesk/screens/AdminOverviewScreen.tsx`
- **Repro steps**: Rapidly toggle status and document type filters in Staff Queue or Admin Overview.
- **Root cause**: Queries executed asynchronously without an `active` cancellation token, allowing earlier slower responses to overwrite newer filter selections.
- **Resolution**: Added cancellation token flag (`let active = true` and `return () => { active = false }`) inside filter effect hooks.
- **Commit**: `a1ea922` (`fix(docdesk): prevent filter race conditions and deduplicate paginated rows (BUG-02, BUG-04)`)
- **Regression Test**: `src/tracks/docdesk/__tests__/staffQueue.test.tsx`

---

### BUG-03
- **Severity**: S2
- **Where**: `src/features/auth/LoginPage.tsx` & `LoginPage.module.css`
- **Repro steps**: User experiences authentication errors (`INVALID_CREDENTIALS`, `UNKNOWN_INSTITUTION`, `RATE_LIMITED`, or slow Render backend waking).
- **Root cause**: Displayed raw error strings without user guidance; lacked rate limiting countdown; lacked slow response notification.
- **Resolution**: Mapped error codes cleanly, added 30-second countdown lock for rate-limited states, and added 4.5s waking server progress indicator for free-tier spin-up.
- **Commit**: `3b75fe0` (`fix(auth): map API errors, rate limited countdown and waking server UX (BUG-03)`)
- **Regression Test**: `src/features/auth/__tests__/auth-flows.test.tsx` (8/8 passed)

---

### BUG-04
- **Severity**: S2
- **Where**: `src/tracks/docdesk/hooks/useCursorPagination.ts`, `StaffQueueScreen.tsx`, `AdminOverviewScreen.tsx`
- **Repro steps**: Click "Load more" when rows shifted between cursor fetches.
- **Root cause**: Naive array concatenation (`[...prev, ...res.items]`) produced duplicate keys and rows.
- **Resolution**: Deduplicated appended items by `request_id`/`id` using `Set`.
- **Commit**: `a1ea922` (`fix(docdesk): prevent filter race conditions and deduplicate paginated rows (BUG-02, BUG-04)`)
- **Regression Test**: `src/tracks/docdesk/__tests__/paginationRace.test.ts`

---

### BUG-05
- **Severity**: S3
- **Where**: `src/tracks/docdesk/components/AnswerComposerModal.tsx` & `src/tracks/docdesk/screens/StaffDetailScreen.tsx`
- **Repro steps**: Staff removes the answer document or withdraws an answer on a request that contains a requester's filled form.
- **Root cause**: Lack of explicit warning that the backend cascades deletion to the requester's filled form.
- **Resolution**: Added prominent alert in `AnswerComposerModal` and confirmation prompt in `StaffDetailScreen` explicitly informing staff that the requester's filled form will be permanently deleted.
- **Commit**: `3ca08fe` (`fix(docdesk): support Escape key overlay dismiss and warn on filled-form deletion (BUG-05, BUG-06)`)
- **Regression Test**: Verified in `staffDetail.test.tsx` and manual flow.

---

### BUG-06
- **Severity**: S3
- **Where**: `EditRequestModal.tsx`, `AnswerComposerModal.tsx`, `BulkTATModal.tsx`, `SetTATModal.tsx`
- **Repro steps**: Open any modal dialog and press `Escape`.
- **Root cause**: Missing keydown listener for keyboard accessibility.
- **Resolution**: Implemented `Escape` key event listener on `window` in all four dialogs with unsaved dirty checks.
- **Commit**: `3ca08fe` (`fix(docdesk): support Escape key overlay dismiss and warn on filled-form deletion (BUG-05, BUG-06)`)
- **Regression Test**: `src/tracks/docdesk/__tests__/modalEscape.test.tsx` (2/2 passed)

---

### BUG-07
- **Severity**: S4
- **Where**: `DocTypeManagerScreen.tsx`, `RequestFormScreen.tsx`, `FilledFormPanel.tsx`
- **Repro steps**: TypeScript strict inspection.
- **Root cause**: Catch blocks typed as `: any`.
- **Resolution**: Refactored to `catch (err: unknown)` with typed narrowing against `ApiError` and `Error`.
- **Commit**: `e3886dc` (`refactor(docdesk): replace any error handling with typed ApiError narrowing (BUG-07)`)
- **Regression Test**: `npm run lint` and `npm run typecheck` passing with 0 warnings / 0 errors.

---

### BUG-08
- **Severity**: S4
- **Where**: `src/tracks/docdesk/components/DocDeskNav.tsx` & `DocDeskNav.module.css`
- **Repro steps**: Codebase reference check.
- **Root cause**: Unreferenced dead files superseded by `DocDeskTopbar.tsx`.
- **Resolution**: Deleted dead components via git.
- **Commit**: `b2f6ddc` (`refactor(docdesk): clean up any types and remove unused DocDeskNav (BUG-07, BUG-08)`)
- **Regression Test**: Track boundary and registry tests passing.

---

### BUG-09
- **Severity**: S4
- **Where**: `src/tracks/docdesk/api/requests.ts`
- **Repro steps**: Comparison with FastAPI OpenAPI schemas for answer withdrawal, filled form deletion, and bulk TAT.
- **Root cause**: Potential return type loss when callers need updated request representation.
- **Resolution**: Ensured return types strictly reflect backend payloads (`DocRequest` and `{ items: DocRequest[]; count: number }`).
- **Commit**: Verified in `src/tracks/docdesk/api/requests.ts`.
- **Regression Test**: `npm run typecheck` passing with zero errors.
