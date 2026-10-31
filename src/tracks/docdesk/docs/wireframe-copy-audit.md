# Wireframe Copy & Interaction Audit Table

This document provides a screen-by-screen audit verifying exact alignment between `DocDesk_8_Simple_UIUX_Wireframes.pdf` and the React implementation in `src/tracks/docdesk/`.

| Screen # | Wireframe Screen | Wireframe Copy / Element | Implementation Component | Implementation Route | Match Status | Verification Evidence / Notes |
|---|---|---|---|---|---|---|
| **1** | **My Requests** | Title: "My requests" | `MyRequestsScreen.tsx` | `/tracks/docdesk/my-requests` | **EXACT MATCH** | Rendered via `<Text as="h1" size="2xl">My requests</Text>` |
| 1 | My Requests | Subtitle: "Track the status of your document requests." | `MyRequestsScreen.tsx` | `/tracks/docdesk/my-requests` | **EXACT MATCH** | Matches wireframe subtitle verbatim |
| 1 | My Requests | Status dropdown: "All statuses", "Pending", "Answered", "Acknowledged" | `MyRequestsScreen.tsx` | `/tracks/docdesk/my-requests` | **EXACT MATCH** | Exactly 3 statuses + "All statuses" option. No unsupported "withdrawn" status. |
| 1 | My Requests | Type dropdown: "All types" + type names | `MyRequestsScreen.tsx` | `/tracks/docdesk/my-requests` | **EXACT MATCH** | `typeOptions` starts with `{ value: '', label: 'All types' }` |
| 1 | My Requests | Primary button: "New request" | `MyRequestsScreen.tsx` | `/tracks/docdesk/my-requests` | **EXACT MATCH** | Button links to `/tracks/docdesk/new` |
| 1 | My Requests | Table columns: ID, Document type, Status, TAT, Submitted, Actions | `MyRequestsScreen.tsx` | `/tracks/docdesk/my-requests` | **EXACT MATCH** | `th` headers match wireframe column headers |
| 1 | My Requests | Empty state: "No requests found. Click 'New request' to get started." | `MyRequestsScreen.tsx` | `/tracks/docdesk/my-requests` | **EXACT MATCH** | Matches wireframe empty state copy |
| 1 | My Requests | Action: "View" link | `MyRequestsScreen.tsx` | `/tracks/docdesk/my-requests` | **EXACT MATCH** | Row action links to `/tracks/docdesk/requests/{id}` |
| **2** | **Request Form** | Title: "Request a document" | `RequestFormScreen.tsx` | `/tracks/docdesk/new` | **EXACT MATCH** | Matches wireframe heading verbatim |
| 2 | Request Form | Subtitle: "Submit a request for bonafide certificates, transcripts, or official letters." | `RequestFormScreen.tsx` | `/tracks/docdesk/new` | **EXACT MATCH** | Subtitle rendered under heading |
| 2 | Request Form | Document type selector (active types only) | `RequestFormScreen.tsx` | `/tracks/docdesk/new` | **EXACT MATCH** | Loads active doc types; archived types rejected by validation & backend |
| 2 | Request Form | Reason for request (5-1000 chars) | `RequestFormScreen.tsx` | `/tracks/docdesk/new` | **EXACT MATCH** | Textarea with live character counter (5/1000) and blur validation |
| 2 | Request Form | Actions: "Submit request" & "Cancel" | `RequestFormScreen.tsx` | `/tracks/docdesk/new` | **EXACT MATCH** | Primary submit + secondary cancel returning to My Requests |
| 2 | Request Form | No file attachment input | `RequestFormScreen.tsx` | `/tracks/docdesk/new` | **EXACT MATCH** | Initial request creation accepts only doc_type_id & reason (OpenAPI verified) |
| **3** | **Request Detail — Pending** | Title: "Request details" + Request ID | `RequestDetailScreen.tsx` | `/tracks/docdesk/requests/:id` | **EXACT MATCH** | Displays request ID badge and status |
| 3 | Request Detail — Pending | Lifecycle strip: Submitted (done) → In review (current) → Answered → Acknowledged | `LifecycleStrip.tsx` | `/tracks/docdesk/requests/:id` | **EXACT MATCH** | Visual 4-step progress stepper |
| 3 | Request Detail — Pending | Action: "Edit request" | `EditRequestModal.tsx` | `/tracks/docdesk/requests/:id` | **EXACT MATCH** | Only visible/enabled when status === 'pending' |
| 3 | Request Detail — Pending | Action: "Withdraw request" | `RequestDetailScreen.tsx` | `/tracks/docdesk/requests/:id` | **EXACT MATCH** | Only visible/enabled when status === 'pending', with confirmation modal |
| 3 | Request Detail — Pending | Empty answer state: "Your request is currently under review by Student Affairs." | `RequestCommunicationPanel.tsx` | `/tracks/docdesk/requests/:id` | **EXACT MATCH** | Informational pending callout |
| **4** | **Request Detail — Answered** | Status badge: "Answered" | `RequestDetailScreen.tsx` | `/tracks/docdesk/requests/:id` | **EXACT MATCH** | Rendered via `<StatusBadge status="answered" />` |
| 4 | Request Detail — Answered | Answer panel: Message text, answered by, timestamp | `RequestCommunicationPanel.tsx` | `/tracks/docdesk/requests/:id` | **EXACT MATCH** | Displays official Student Affairs response |
| 4 | Request Detail — Answered | Document download: "Download attached document" | `RequestDetailScreen.tsx` | `/tracks/docdesk/requests/:id` | **EXACT MATCH** | Uses authenticated `apiDownload` with filename |
| 4 | Request Detail — Answered | Filled form upload panel | `FilledFormPanel.tsx` | `/tracks/docdesk/requests/:id` | **EXACT MATCH** | Drag-and-drop file upload (PDF/DOCX/PNG/JPEG), replace, and delete |
| 4 | Request Detail — Answered | Action: "Acknowledge receipt" | `RequestDetailScreen.tsx` | `/tracks/docdesk/requests/:id` | **EXACT MATCH** | Moves request to terminal 'acknowledged' status and disables further edits |
| **5** | **Staff Queue** | Title: "Document requests" | `StaffQueueScreen.tsx` | `/tracks/docdesk/staff` | **EXACT MATCH** | Primary heading for Student Affairs queue |
| 5 | Staff Queue | Subtitle: "Review and process document requests..." | `StaffQueueScreen.tsx` | `/tracks/docdesk/staff` | **EXACT MATCH** | Context description |
| 5 | Staff Queue | Filters: Status (All, Pending, Answered, Acknowledged) | `StaffQueueScreen.tsx` | `/tracks/docdesk/staff` | **EXACT MATCH** | Strictly 3 statuses + All. "Withdrawn" removed. |
| 5 | Staff Queue | Filter: Document type dropdown | `StaffQueueScreen.tsx` | `/tracks/docdesk/staff` | **EXACT MATCH** | Loads types dynamically |
| 5 | Staff Queue | Filter: Request scope ("All requests", "My requests") | `StaffQueueScreen.tsx` | `/tracks/docdesk/staff` | **EXACT MATCH** | Scopes queue view |
| 5 | Staff Queue | Filter: "Search loaded requests" | `StaffQueueScreen.tsx` | `/tracks/docdesk/staff` | **EXACT MATCH** | Search input with exact wireframe label |
| 5 | Staff Queue | Table checkboxes (pending only) | `StaffQueueScreen.tsx` | `/tracks/docdesk/staff` | **EXACT MATCH** | Checkboxes disabled on answered/acknowledged rows |
| 5 | Staff Queue | Floating bulk action bar | `StaffQueueScreen.tsx` | `/tracks/docdesk/staff` | **EXACT MATCH** | Shows count, "Set Bulk TAT" button, "Clear selection" button |
| **6** | **Staff Detail / Answer & TAT** | Title: "Request details" + Request ID | `StaffDetailScreen.tsx` | `/tracks/docdesk/staff/requests/:id` | **EXACT MATCH** | Header with requester profile info |
| 6 | Staff Detail / Answer & TAT | Turnaround time card | `SetTATModal.tsx` | `/tracks/docdesk/staff/requests/:id` | **EXACT MATCH** | Expected date (min >= today IST), note, update button (pending only) |
| 6 | Staff Detail / Answer & TAT | Answer composer modal | `AnswerComposerModal.tsx` | `/tracks/docdesk/staff/requests/:id` | **EXACT MATCH** | Message textarea (1-2000 chars), optional document upload |
| 6 | Staff Detail / Answer & TAT | Actions: "Edit answer" & "Withdraw answer" | `StaffDetailScreen.tsx` | `/tracks/docdesk/staff/requests/:id` | **EXACT MATCH** | Edit updates answer via PATCH; withdraw reverts request to pending via DELETE |
| **7** | **Document Types Manager** | Title: "Document types" | `DocTypeManagerScreen.tsx` | `/tracks/docdesk/staff/doc-types` | **EXACT MATCH** | Topbar nav label: "Document Types" |
| 7 | Document Types Manager | Subtitle: "Manage the types of documents students and faculty can request." | `DocTypeManagerScreen.tsx` | `/tracks/docdesk/staff/doc-types` | **EXACT MATCH** | Matches wireframe subtitle |
| 7 | Document Types Manager | Tabs: "Active types" / "Archived types" | `DocTypeManagerScreen.tsx` | `/tracks/docdesk/staff/doc-types` | **EXACT MATCH** | Accessible tab switching |
| 7 | Document Types Manager | Add new type card: Name (3-80 chars), Description | `DocTypeManagerScreen.tsx` | `/tracks/docdesk/staff/doc-types` | **EXACT MATCH** | Real API integration with validation |
| 7 | Document Types Manager | Actions: Edit, Archive, Restore, Delete | `DocTypeManagerScreen.tsx` | `/tracks/docdesk/staff/doc-types` | **EXACT MATCH** | Full lifecycle operations with confirmation modals |
| **8** | **Bulk TAT Screen** | Title: "Set Turnaround Time in Bulk" | `BulkTATScreen.tsx` | `/tracks/docdesk/staff/bulk-tat` | **EXACT MATCH** | Title matches wireframe |
| 8 | Bulk TAT Screen | Selected requests summary list | `BulkTATScreen.tsx` | `/tracks/docdesk/staff/bulk-tat` | **EXACT MATCH** | Lists up to 100 selected request IDs |
| 8 | Bulk TAT Screen | Date input (min = today IST) + note input | `BulkTATScreen.tsx` | `/tracks/docdesk/staff/bulk-tat` | **EXACT MATCH** | Enforces IST calendar calculation |
| 8 | Bulk TAT Screen | Actions: "Apply Bulk TAT" & "Cancel" | `BulkTATScreen.tsx` | `/tracks/docdesk/staff/bulk-tat` | **EXACT MATCH** | Handles 409 atomic failure with specific request_id callouts |
