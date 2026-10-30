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

## 2. Five-Minute Hackathon Demo Script (Team 24)

### Prerequisites Setup (via Admin Console at `/admin`)
1. Admin logs in with `admin@team24.com` using the organiser-supplied OTP.
2. Admin creates sample users in domain `team24.com`:
   - Student: e.g. `asha@team24.com` (`dept: CSE`, `usn: 1CF24CS024`)
   - Office Staff: e.g. `ravi@team24.com` (`dept: Student Affairs`, `designation: Section Officer`)
   - Faculty: e.g. `meera@team24.com` (`designation: Professor`)

### Walkthrough
- **Minute 1: Overview & Requester Dashboard**
  - Sign in as Student (`asha@team24.com`).
  - Open DocDesk from the top navigation bar.
  - Review the Requester Dashboard showing loaded request counts and available actions.
- **Minute 2: Document Catalogue & Request Creation**
  - Click on "Catalogue" or "Request Document".
  - Pick an active document type (e.g. *Bonafide Certificate*).
  - Fill in the required purpose (e.g. "Required for external scholarship application").
  - Submit the request. Highlight the assigned `DRQ-...` ID and initial `pending` status.
- **Minute 3: Student Affairs Operational Desk**
  - Switch session to Student Affairs staff (`ravi@team24.com`, `dept: Student Affairs`).
  - Access the Staff Queue at `/tracks/docdesk/staff`.
  - Filter queue by `pending`.
  - Select the request, click "Set TAT", and specify tomorrow's date in IST with an operational note.
  - Open "Submit Official Answer": provide official instructions and attach an official document (PDF/DOCX <= 10 MB).
- **Minute 4: Requester Verification, File Download, & Round-Trip**
  - Return to student view (`asha@team24.com`).
  - Notice the status transition to `answered`.
  - Download the official document via authenticated streaming.
  - If a filled form is required, demonstrate the form round-trip by uploading the completed form (`filled_form`).
  - Click "✓ Acknowledge & Close" to confirm receipt. Status transitions to `acknowledged`.
- **Minute 5: Institutional Audit & Admin Read-Only Guarantee**
  - Sign in as Team 24 Admin (`admin@team24.com`).
  - Navigate to `/tracks/docdesk/admin`.
  - Open the audit record: verify complete metadata, timestamps, reason, staff response, and document download options.
  - Highlight the complete absence of mutation buttons (zero create, edit, withdraw, answer, or acknowledgement controls), enforcing strict audit-only access.
  - Show the honest communication timeline confirming official request-and-response lifecycle milestones.

---

## 3. Guarding Strategy
- Because the shared `RequireRole` only checks a single role, DocDesk provides track-local route wrappers in `components/Guards.tsx`:
  - `RequesterGuard`: Allows `student`, `faculty`, and `office_staff`. Redirects `admin` directly to `/tracks/docdesk/admin`.
  - `StudentAffairsGuard`: Waits for profile hydration (`/users/me`), verifies `role === 'office_staff'` and `isStudentAffairs(dept)`.
  - `AdminGuard`: Checks `role === 'admin'`. Never blocks on profile hydration.
