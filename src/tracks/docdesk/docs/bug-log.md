# DocDesk Comprehensive Bug Log

This document records all findings discovered during the Phase 2 deep-dive audit across API contracts, permissions, state management, forms, dates, files, security, accessibility, responsiveness, code quality, and login/session flows.

## Summary by Severity

| Severity Level | Definition | Count | Status |
|---|---|:---:|:---:|
| **S1** | Data loss, security hole, wrong permission, app crash | **0** | No critical vulnerabilities found |
| **S2** | Broken workflow or wrong data shown | **4** | To be fixed in Phase 3 |
| **S3** | Visual, accessibility or polish defect | **2** | To be fixed in Phase 3 |
| **S4** | Code quality, loose typing, dead code | **3** | To be fixed in Phase 3 |
| **Total** | | **9** | |

---

## Detailed Findings

### BUG-01
- **Severity**: S2
- **Where**: `src/tracks/docdesk/api/requests.ts` (lines 49–57)
- **Repro steps**: Student Affairs submits an initial official answer containing only a message (no document attached).
- **Root cause**: `createAnswer` branches on `!document` and calls `createAnswerMessage(requestId, { message })` with `application/json`. The live FastAPI backend at `POST /api/v1/docdesk/requests/{request_id}/answer` accepts only `multipart/form-data`, returning `422 Unprocessable Entity` for JSON bodies.
- **Proposed fix**: Send `multipart/form-data` via `FormData` in `createAnswer` even when no document is attached (`form.append('message', message)`).
- **Test**: Vitest unit test in `src/tracks/docdesk/__tests__/api.test.ts` verifying `FormData` payload on `createAnswer` without document.

---

### BUG-02
- **Severity**: S2
- **Where**: `src/tracks/docdesk/screens/StaffQueueScreen.tsx` (lines 67–90) & `src/tracks/docdesk/screens/AdminOverviewScreen.tsx` (lines 45–66)
- **Repro steps**: In Staff Queue or Admin Overview, rapidly toggle filters (e.g. click Pending, then Answered, then All).
- **Root cause**: `loadQueue` / `loadData` are asynchronous fetch functions without cancellation flags (`active` token). A slow earlier query can resolve after a faster subsequent query, overwriting state with stale mismatched data (race condition).
- **Proposed fix**: Add `let active = true` inside `useEffect` and verify `if (active)` before `setItems` and `setLoading(false)`. Return cleanup function `() => { active = false }`.
- **Test**: Vitest test simulating out-of-order resolved promises verifying only the latest filter state survives.

---

### BUG-03
- **Severity**: S2
- **Where**: `src/features/auth/LoginPage.tsx` (lines 35–38)
- **Repro steps**: User enters invalid OTP or unregistered email domain, or hits rate limit, or experiences network delay on waking server.
- **Root cause**: `LoginPage.tsx` directly displays raw `error.message` without mapping specific error codes (`INVALID_CREDENTIALS`, `UNKNOWN_INSTITUTION`, `RATE_LIMITED`, server cold start > 5s). Code field is not cleared/focused on invalid credentials.
- **Proposed fix**: Map backend error codes to prescribed messages:
  - `INVALID_CREDENTIALS` -> 'The email or code is not correct.' (clear and focus code field).
  - `UNKNOWN_INSTITUTION` -> 'This email domain is not registered. Check your email address.' (focus email field).
  - `RATE_LIMITED` -> 'Too many attempts. Try again in N seconds.' (read `Retry-After` header and countdown).
  - Add 5-second slow response server waking indicator ("The server may be waking up. This can take up to a minute.").
- **Test**: Integration tests in `src/features/auth/__tests__/auth-flows.test.tsx` verifying each error state and focus handling.

---

### BUG-04
- **Severity**: S2
- **Where**: `src/tracks/docdesk/hooks/useCursorPagination.ts` (lines 48–52) & `src/tracks/docdesk/screens/StaffQueueScreen.tsx` (lines 102–105)
- **Repro steps**: Click "Load more" when items on previous page were shifted or inserted.
- **Root cause**: `setItems((prev) => [...prev, ...res.items])` blindly concatenates arrays, resulting in duplicate row items and React duplicate key warnings.
- **Proposed fix**: Deduplicate items by `request_id` when appending pages.
- **Test**: Unit test verifying `loadMore` deduplicates overlapping request items.

---

### BUG-05
- **Severity**: S3
- **Where**: `src/tracks/docdesk/components/AnswerComposerModal.tsx` (lines 182–195) & `src/tracks/docdesk/screens/StaffDetailScreen.tsx` (lines 94–98)
- **Repro steps**: Staff removes the attached document or withdraws an answer on a request where requester has submitted a filled form.
- **Root cause**: The UI does not explicitly warn that removing the answer document or withdrawing the answer will delete the requester's submitted filled-in form.
- **Proposed fix**: Check `request.filled_form` and display an explicit warning: "Removing this document (or withdrawing this answer) will permanently delete the requester's uploaded filled form."
- **Test**: Component test verifying warning alert appears when `request.filled_form` is present.

---

### BUG-06
- **Severity**: S3
- **Where**: `src/tracks/docdesk/components/EditRequestModal.tsx`, `AnswerComposerModal.tsx`, `BulkTATModal.tsx`, `SetTATModal.tsx`
- **Repro steps**: User opens any modal overlay and presses the `Escape` key.
- **Root cause**: Modals lack `keydown` listener for `Escape` and focus restore.
- **Proposed fix**: Add `keydown` event listener for `Escape` that calls `handleCancel()` or `onClose()`.
- **Test**: Vitest test simulating `Escape` key press on modal dialog closing it.

---

### BUG-07
- **Severity**: S4
- **Where**: `src/tracks/docdesk/screens/DocTypeManagerScreen.tsx` (line 158), `RequestFormScreen.tsx` (line 85), `FilledFormPanel.tsx` (line 64)
- **Repro steps**: TypeScript static analysis.
- **Root cause**: Uses `catch (err: any)` with loose typing instead of `err: unknown` and proper type narrowing.
- **Proposed fix**: Refactor to `catch (err: unknown)` with typed narrowing against `ApiError` or `Error`.
- **Test**: `npm run typecheck` passing with zero diagnostics.

---

### BUG-08
- **Severity**: S4
- **Where**: `src/tracks/docdesk/components/DocDeskNav.tsx` & `DocDeskNav.module.css`
- **Repro steps**: Dead code inspection.
- **Root cause**: `DocDeskNav` is completely unreferenced by any route or component; all screens import `DocDeskLayout` and `DocDeskTopbar`.
- **Proposed fix**: Remove dead file `DocDeskNav.tsx` and its CSS module.
- **Test**: `npm test` and `boundaries.test.ts` passing.

---

### BUG-09
- **Severity**: S4
- **Where**: `src/tracks/docdesk/api/requests.ts` (lines 72, 101, 111)
- **Repro steps**: TypeScript typing audit against live OpenAPI.
- **Root cause**: `withdrawAnswer`, `deleteFilledForm`, and `setBulkTAT` return `Promise<void>` while the backend actually returns `RequestView` and `BulkTatResult`.
- **Proposed fix**: Update return types to `Promise<DocRequest>` and `Promise<{ items: DocRequest[]; count: number }>`.
- **Test**: TypeScript typecheck verification.
