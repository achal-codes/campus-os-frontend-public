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


---

## 4. UI/UX Transformation & Phase Baseline Audit (Phase 1 Gate)
- **Baseline Test Suite Status**:
  - `npm run lint`: 0 warnings, 0 errors across 141 files.
  - `npm run typecheck`: clean (`tsc -b`).
  - `npm run test:track docdesk`: 5 test files, 33/33 tests passed.
  - `npm test`: 13 test files, 66/66 tests passed.
  - `npm run build`: built in 343ms.
  - `npm run test:e2e`: 33/33 Playwright tests passed.
- **Protected Paths Inspected**:
  - `boundaries.test.ts` enforces that tracks only import from `@/ui`, `@/theme`, `@/core`, npm packages, and their own track folder (`src/tracks/docdesk/`).
  - All shared core modules (`src/app/`, `src/core/`, `src/ui/`, `src/theme/`, `src/features/`) are strictly protected and untouched.
- **Design Upgrade Objectives**:
  - Global horizontal top glass toolbar (`DocDeskTopbar`) replacing sidebar navigation.
  - Premium glassmorphism design tokens (`glass.module.css`) with WCAG AA compliance and `@supports not (backdrop-filter)` fallback.
  - Implementation of all 8 complete wireframe screens, including dedicated Screen 8 for Bulk TAT (`BulkTATScreen.tsx`).
  - Preservation and glass-restyling of supporting dashboards (Requester, Student Affairs, and Admin).
