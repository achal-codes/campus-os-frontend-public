# CampusOS Authentication Architecture & USE_ADMIN_LOGIN Handling

## 1. Executive Summary & Root Cause

### 1.1 Observed Behavior
When attempting to authenticate an institutional administrator using the standard login endpoint:
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email_id": "admin@team24.com",
  "otp": "..."
}
```
The backend returns HTTP 400 Bad Request with the following payload:
```json
{
  "error": {
    "code": "USE_ADMIN_LOGIN",
    "message": "This is an admin account, use POST /api/v1/auth/admin/login"
  },
  "request_id": "73bd73e65b6946b0acb3015a07e592d6"
}
```

### 1.2 Root Cause
The CampusOS backend segregates authentication endpoints by role:
- Standard users (`student`, `faculty`, `office_staff`) authenticate through `/api/v1/auth/login`.
- System administrators (`admin`) are authenticated strictly through `/api/v1/auth/admin/login`.

If an administrator submits credentials to `/auth/login`, the backend rejects the request with error code `USE_ADMIN_LOGIN` rather than processing the login or issuing a token.

---

## 2. Verified Backend Contracts

Inspected from live OpenAPI specification (`https://campus-os-backend-8sjf.onrender.com/openapi.json`):

### 2.1 Standard Login Endpoint (`/api/v1/auth/login`)
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "email_id": "string",
    "otp": "string"
  }
  ```
- **Success (200 OK)**:
  ```json
  {
    "access_token": "string",
    "token_type": "bearer",
    "expires_in": 3600,
    "profile": {
      "role": "student" | "faculty" | "office_staff",
      "name": "string",
      "email_id": "string",
      "phone_number": "string | null",
      "team_id": "string | null"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request` with `code: "USE_ADMIN_LOGIN"` if the email belongs to an administrator.
  - `400 Bad Request` with `code: "UNKNOWN_INSTITUTION"` if domain is unrecognized.
  - `401 Unauthorized` with `code: "INVALID_CREDENTIALS"` if credentials do not match.
  - `422 Unprocessable Entity` with `code: "VALIDATION_ERROR"` for malformed payload.
  - `429 Too Many Requests` with `code: "RATE_LIMITED"`.

### 2.2 Admin Login Endpoint (`/api/v1/auth/admin/login`)
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "email_id": "string",
    "otp": "string"
  }
  ```
- **Success (200 OK)**:
  ```json
  {
    "access_token": "string",
    "token_type": "bearer",
    "expires_in": 3600,
    "profile": {
      "role": "admin",
      "name": "string",
      "email_id": "string",
      "phone_number": "string | null",
      "team_id": "string | null"
    }
  }
  ```
- **Error Responses**:
  - `401 Unauthorized` with `code: "INVALID_CREDENTIALS"`.
  - `422 Unprocessable Entity` with `code: "VALIDATION_ERROR"`.
  - `429 Too Many Requests` with `code: "RATE_LIMITED"`.

### 2.3 Normalized Session State
Both endpoints yield an identical session structure stored in `sessionStorage` (`campus-os:session`):
```typescript
interface Session {
  accessToken: string;
  expiresAt: number;
  user: {
    id: string;     // profile.email_id
    name: string;   // profile.name
    email: string;  // profile.email_id
    role: Role;     // profile.role ('admin' | 'student' | 'faculty' | 'office_staff')
  };
}
```

---

## 3. Client Architecture & Implementation

### 3.1 Strict Error Code Branching
Following Principle P3, the client strictly evaluates `error.code` and **never** string-matches on `error.message`.
```typescript
if (error instanceof ApiError && error.code === 'USE_ADMIN_LOGIN') {
  // Retries exactly once against /auth/admin/login
  return await apiRequest<TokenResponse>('/auth/admin/login', { method: 'POST', json });
}
```

### 3.2 Retry Guard & Loop Prevention
- The retry mechanism is implemented inside `loginUser()` in `src/core/auth/authService.ts`.
- If the follow-up request to `/api/v1/auth/admin/login` fails (e.g., returns 401 `INVALID_CREDENTIALS`), it is **not caught** by the retry block, preventing any recursive loops.
- `loginAdmin()` does not catch or retry errors.

### 3.3 Role-Blind Single Form (Amendment P7)
Per principle P7, all role sign-in options ("Sign in as Administrator", "Sign in as Faculty", "Sign in as Student", and `toggle-admin-login`) have been removed from the UI:
- The login page provides a single form and single submit path.
- The user never chooses a role; the backend determines account type from credentials.
- All users (Student, Faculty, Staff, and Admin) submit credentials via the single form.
- The form posts to `POST /api/v1/auth/login`. When admin credentials are submitted, the backend responds with `400 USE_ADMIN_LOGIN`, triggering the single automatic transparent retry to `POST /api/v1/auth/admin/login`.
- Direct service functions (`signInAdmin`, `loginAdmin`) remain intact in `src/core/auth/authService.ts` for programmatic/service use, but no role controls exist in the UI.

### 3.4 Error Mapping & Request ID Tracking
`src/features/auth/mapAuthError.ts` centralizes error normalization:
- `INVALID_CREDENTIALS` -> "Invalid email_id or OTP. Please check your credentials and try again."
- `UNKNOWN_INSTITUTION` -> "Unknown institution. Please sign in with your registered campus email."
- `RATE_LIMITED` -> "Too many login attempts. Please wait 30 seconds before trying again."
- `VALIDATION_ERROR` -> "Please provide a valid campus email and 4-8 digit OTP."
- `USE_ADMIN_LOGIN` -> "This is an administrator account. Please use Admin Sign In."
- `TIMEOUT` / `GATEWAY_TIMEOUT` / HTTP 504 -> "The server took too long to respond. The free-tier server may be waking up—please wait a moment and try again."
- `NETWORK_ERROR` -> "Cannot reach the authentication server. Please check your connection and try again."
- HTTP 5xx -> "The authentication server encountered an unexpected error. Please try again in a few moments."

All errors capturing a backend `request_id` surface it cleanly:
`data-testid="login-error-request-id"`: `Reference: <request_id>`.

### 3.5 Credential Hygiene
- Neither OTP nor passwords are stored in `localStorage`, `sessionStorage`, cookies, URLs, or error objects.
- Credentials are transmitted strictly over HTTPS JSON bodies.
- `sessionStorage` stores only the signed JWT access token, expiration timestamp, and normalized user metadata.

---

## 4. Test Verification Matrix

| Test Case | Description | Scope / Environment | Result |
| :--- | :--- | :--- | :--- |
| **Standard Login** | User signs in via `/auth/login`; JWT saved to session | Vitest / Mocked | Passed |
| **Auto-Recovery** | Admin logs in via `/auth/login`; receives `USE_ADMIN_LOGIN`; retries `/auth/admin/login` once | Vitest / Mocked | Passed |
| **Recovery Failure** | Admin follow-up returns 401; error displayed; no further calls | Vitest / Mocked | Passed |
| **Non-Admin Error** | Standard login returns `UNKNOWN_INSTITUTION`; no admin retry | Vitest / Mocked | Passed |
| **Strict Code Branch** | Changing `error.message` does not affect retry decision | Vitest / Mocked | Passed |
| **Credential Hygiene** | OTP never stored in localStorage, sessionStorage, or URL params | Vitest / Mocked | Passed |
| **Pending Guard** | Submit disabled with `aria-busy="true"`; duplicate clicks ignored | Vitest / Mocked | Passed |
| **Network & Timeout** | Distinguishes network failure from server gateway timeouts | Vitest / Mocked | Passed |
| **Session Symmetry** | Session schema identical between user and admin logins | Vitest / Mocked | Passed |
| **Explicit Admin** | Toggle/param activates direct `/auth/admin/login` call | Vitest / Mocked | Passed |
| **Rate Limit Countdown**| 429 initiates 30-second countdown button disable | Vitest / Mocked | Passed |
| **Live Contract Probe** | `/auth/login` returns 400 `USE_ADMIN_LOGIN` with `request_id` | Live Backend | Verified |
| **Live Admin Probe** | `/auth/admin/login` returns 401 `INVALID_CREDENTIALS` | Live Backend | Verified |
| **Live Domain Probe** | `/auth/login` returns 400 `UNKNOWN_INSTITUTION` | Live Backend | Verified |

---

## 5. Unverified Items & Backend Team Questions

1. **OTP Invalidation on Admin Switch**: Does the backend invalidate an OTP once it is rejected with `USE_ADMIN_LOGIN`, or can the same OTP immediately be accepted at `/api/v1/auth/admin/login`?
   * *Observed*: In our mock tests, the same OTP is forwarded to `/auth/admin/login`. Live verification requires valid admin OTP credentials from the backend team.
2. **Account Provisioning Mechanism**: Does the backend allow creating an admin via API, or are admins provisioned exclusively through database seeds/migrations?
3. **Session Revocation Endpoint**: Currently, logout is performed client-side by dropping the token from `sessionStorage`. Does the backend plan to expose a `POST /auth/logout` blacklist endpoint?
