# DocDesk Testing Report

## 1. Automated Test Execution Summary

| Test Suite | Command | Result | Duration | Details |
|---|---|---|---|---|
| **DocDesk Track Unit/Integration** | `npm run test:track docdesk` | **PASSED** (5/5 test files, 33/33 tests) | ~1.6s | Department normalisation, permissions matrix (all 5 roles & states), time & IST formatting, file validation & sanitisation, component rendering |
| **Full Repository Unit Suite** | `npm test` | **PASSED** (13/13 test files, 66/66 tests) | ~5.2s | All core tests, auth tests, admin tests, track boundary tests, registry tests, and DocDesk tests |
| **Linting (oxlint)** | `npm run lint` | **PASSED** (0 warnings, 0 errors) | ~25ms | Checked 141 files |
| **Typecheck** | `npm run typecheck` | **PASSED** (0 errors) | ~1.5s | Strict TypeScript compilation (`tsc -b`) |
| **Production Build** | `npm run build` | **PASSED** | ~450ms | Vite bundle compilation with clean code-splitting per track screen |
| **Playwright E2E Suite** | `npm run test:e2e` | **PASSED** (33/33 tests passed) | ~10.6s | Verified on `chromium-light`, `chromium-dark`, and `mobile` (Pixel 7) |

## 2. Visual Verification
- **Viewports Verified**: 360px (mobile), 768px (tablet), 1280px (desktop) via Playwright responsive runs.
- **Themes Verified**: Light and Dark color schemes verified with CSS custom property inheritance.
- **Accessibility**: Screen reader labels, ARIA landmarks, form labels, keyboard navigation, and zero axe violations verified.

## 3. Live Backend Integration Notes
- When connecting to the official backend instance at `VITE_API_BASE_URL`:
  - Requester: Sign in with student/faculty email + OTP -> submits request -> receives `DRQ-...` ID.
  - Student Affairs: Sign in with office staff in `Student Affairs` -> sets TAT -> answers with optional PDF/DOCX -> requester acknowledges.
  - Admin: Sign in with admin credentials -> inspects records read-only.

## 4. Live Hosted Backend Verification (Render Instance)
- **Base URL:** `https://campus-os-backend-8sjf.onrender.com`
- **Connectivity:** Root reachable, `/docs` returned `200 OK`, `/openapi.json` returned `200 OK`.
- **CORS Verification:** Live backend headers returned `Access-Control-Allow-Origin: *`.
- **Schema Reconciliation:**
  - 10/10 DocDesk endpoint routes, HTTP verbs, and query parameters match 1:1.
  - Multipart answer upload (`POST` and `PATCH`) confirmed `message` + optional `document` file.
  - Multipart filled-form upload (`PUT`) officially confirmed property name `file` in `Body_replace_filled_form_api_v1_docdesk_requests__request_id__filled_form_put`.
- **Auth Endpoint Behavior:**
  - Tested `POST /api/v1/auth/login` with `admin@team24.com`: confirmed backend returns `400 USE_ADMIN_LOGIN`.
  - Tested `POST /api/v1/auth/admin/login`: confirmed backend returns `401 INVALID_CREDENTIALS` for invalid OTP, confirming endpoint route and CORS validity.

## 4. Live Hosted Backend Verification (Render Instance)
- **Base URL:** `https://campus-os-backend-8sjf.onrender.com`
- **Connectivity:** Root reachable, `/docs` returned `200 OK`, `/openapi.json` returned `200 OK`.
- **CORS Verification:** Live backend headers returned `Access-Control-Allow-Origin: *`.
- **Schema Reconciliation:**
  - 10/10 DocDesk endpoint routes, HTTP verbs, and query parameters match 1:1.
  - Multipart answer upload (`POST` and `PATCH`) confirmed `message` + optional `document` file.
  - Multipart filled-form upload (`PUT`) officially confirmed property name `file` in `Body_replace_filled_form_api_v1_docdesk_requests__request_id__filled_form_put`.
- **Auth Endpoint Behavior:**
  - Tested `POST /api/v1/auth/login` with `admin@team24.com`: confirmed backend returns `400 USE_ADMIN_LOGIN`.
  - Tested `POST /api/v1/auth/admin/login`: confirmed backend returns `401 INVALID_CREDENTIALS` for invalid OTP, confirming endpoint route and CORS validity.
