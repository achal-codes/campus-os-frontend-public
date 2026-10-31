# DocDesk API Quirks & Ambiguities (Post-Cookbook Verification)

## 1. Source Documents Status
- **Status**: Both `api-cookbook.pdf` and `guide.html` were provided and inspected thoroughly.
- **Verification**: All endpoints, data schemas, roles, limits, and error codes in the implementation have been matched and verified against sections 1, 2, 3, 6, 8, 9, and 10 of the official API Cookbook and Chapter 9 of the Guide.

## 2. Communication & Messaging Search
- **Search Conducted**: Searched `api-cookbook.pdf` and `guide.html` for `message`, `comment`, `thread`, `reply`, `chat`, `conversation`, `notification`, `websocket`.
- **Finding (Confirmed)**: No two-way chat, thread, comments, or web socket endpoints exist in DocDesk. The API contract explicitly defines:
  - `POST /requests` has `reason` (5-1000 chars)
  - `POST /requests/{id}/answer` has `message` (1-2000 chars)
  - `PATCH /requests/{id}/answer` edits `message`
  - `DELETE /requests/{id}/answer` withdraws the answer
  - `POST /requests/{id}/acknowledge` closes the request
- **Conclusion**: There is no live chat in the official backend. The implementation provides `RequestCommunicationPanel`, which accurately displays the official Request & Answer lifecycle milestones with real timestamps and plain-text escaping.

## 3. Department Resolution for Student Affairs
- **Rule Confirmed (Cookbook p. 2 & Guide p. 3)**:
  - Only `office_staff` with `dept = "Student Affairs"` has permission to answer requests, set turnaround times, and manage document types.
  - Case-insensitive, trailing `"dept"` ignored.
  - Confirmed examples: `Student Affairs`, `student affairs`, and `Student Affairs Dept` work. `StudentAffairs` returns `403 FORBIDDEN`.

## 4. Admin Account Isolation
- **Rule Confirmed (Cookbook p. 18)**:
  - "The admin can only read here. Any create, edit or upload call from the admin returns 403."
  - Admin view in DocDesk has zero mutation controls.
  - Admin authentication does not query `/users/me` or depend on department hydration.

## 5. File Downloads and Expiring URLs
- **Rule Confirmed (Cookbook p. 5)**:
  - File metadata contains `"url"`, but it expires after ~15 minutes and is intended only for quick previews.
  - "For a download button, use the feature's download endpoint with the token. Those always work."
  - DocDesk implementation uses `apiDownload()` pointing directly to `/requests/{id}/document` and `/requests/{id}/filled-form` with Bearer tokens and safe RFC 5987 / quoted `Content-Disposition` filename extraction.

## 6. Turnaround Time (TAT) Constraints
- **Rule Confirmed (Cookbook p. 21)**:
  - Single: `PUT /requests/{id}/tat` (pending only, date >= today IST).
  - Bulk: `POST /requests/bulk-tat` (1-100 request IDs, all-or-nothing).
  - If any request is not pending, backend returns `409 REQUEST_NOT_PENDING` with `error.details.request_ids`. The UI retains selections and displays failing IDs.

## 7. Filled-Form Multipart Field Name (`VERIFIED`)
- **Status**: `VERIFIED` against the official live OpenAPI schema (`https://campus-os-backend-8sjf.onrender.com/openapi.json`).
- **Confirmation**: Schema `Body_replace_filled_form_api_v1_docdesk_requests__request_id__filled_form_put` explicitly declares `required: ["file"]` with `contentMediaType: "application/octet-stream"`.
- **Client Implementation**: `uploadFilledForm` in `api/requests.ts` passes `file` (and retains `filled_form` defensively), matching the live backend parameter contract exactly.
