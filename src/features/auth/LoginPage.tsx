import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { useAuth } from '@/core/auth'
import { Spinner } from '@/ui'
import { mapAuthError, type MappedAuthError } from './mapAuthError'
import { safeNext } from './safeNext'
import { hasErrors, validateLogin, type FieldErrors, type LoginValues } from './validation'
import styles from './LoginPage.module.css'

export function LoginPage() {
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const next = safeNext(params.get('next'))

  const initialIsAdmin = params.get('mode') === 'admin' || params.get('admin') === 'true'
  const [isAdminMode, setIsAdminMode] = useState(initialIsAdmin)
  const [showPassword, setShowPassword] = useState(false)

  const [values, setValues] = useState<LoginValues>({ email: '', otp: '' })
  const [errors, setErrors] = useState<FieldErrors<LoginValues>>({})
  const [formError, setFormError] = useState<MappedAuthError | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [isWaking, setIsWaking] = useState(false)
  const [rateLimitCountdown, setRateLimitCountdown] = useState<number>(0)

  const wakingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (wakingTimerRef.current) clearTimeout(wakingTimerRef.current)
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (rateLimitCountdown > 0) {
      countdownTimerRef.current = setInterval(() => {
        setRateLimitCountdown((prev) => {
          if (prev <= 1) {
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
      }
    }
  }, [rateLimitCountdown])

  if (user && !submitting) return <Navigate to={next} replace />

  const update = (field: keyof LoginValues) => (event: ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [field]: event.target.value }))

  function toggleAdminMode() {
    const nextMode = !isAdminMode
    setIsAdminMode(nextMode)
    setFormError(null)
    setErrors({})
    const newParams = new URLSearchParams(params)
    if (nextMode) {
      newParams.set('mode', 'admin')
    } else {
      newParams.delete('mode')
      newParams.delete('admin')
    }
    setParams(newParams, { replace: true })
  }

  function fillDemo(email: string, otp: string, requireAdmin = false) {
    setValues({ email, otp })
    setErrors({})
    setFormError(null)
    if (requireAdmin !== isAdminMode) {
      toggleAdminMode()
    }
  }

  async function handleAuthenticate() {
    const found = validateLogin(values)
    setErrors(found)
    setFormError(null)
    if (hasErrors(found)) return

    setSubmitting(true)
    setIsWaking(false)

    // Render cold start notification after 4 seconds
    wakingTimerRef.current = setTimeout(() => {
      setIsWaking(true)
    }, 4000)

    try {
      await signIn(values.email, values.otp, { isAdmin: isAdminMode })
      if (wakingTimerRef.current) clearTimeout(wakingTimerRef.current)
      navigate(next, { replace: true })
    } catch (error) {
      if (wakingTimerRef.current) clearTimeout(wakingTimerRef.current)
      setIsWaking(false)
      setSubmitting(false)

      const mapped = mapAuthError(error)
      setFormError(mapped)

      if (mapped.isRateLimited) {
        setRateLimitCountdown(30)
      }
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (rateLimitCountdown > 0 || submitting) return
    await handleAuthenticate()
  }

  return (
    <div className={styles.wrapper}>
      {/* Soft blurred ambient blobs behind the card */}
      <div className={styles.ambientBlobs} aria-hidden="true">
        <div className={styles.blob1} />
        <div className={styles.blob2} />
        <div className={styles.blob3} />
      </div>

      {/* Centered Glass Card */}
      <div className={styles.card}>
        {/* 1. Brand & Trust Header */}
        <div className={styles.brandRow}>
          <div className={styles.brandLogo}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 6h10" />
              <path d="M6 10h10" />
            </svg>
            <span className={styles.brandMark}>Campus OS</span>
          </div>
          <div className={styles.securityBadge}>
            <span className={styles.securityDot} aria-hidden="true" />
            <span>Verified Portal</span>
          </div>
        </div>

        {/* 2. Single H1 and helper text */}
        <div className={styles.header}>
          <h1 className={styles.heading}>
            {isAdminMode ? 'Administrator Sign In' : 'Sign in'}
          </h1>
          <p className={styles.helperText}>
            {isAdminMode ? 'Use your administrator account.' : 'Use your campus account.'}
          </p>
        </div>

        {/* 3. Authentication Form */}
        <form
          onSubmit={onSubmit}
          noValidate
          aria-label="Sign in"
          aria-busy={submitting}
          aria-describedby={formError ? 'login-error-alert' : undefined}
          className={styles.form}
        >
          {/* Email / ID field */}
          <div className={styles.fieldGroup}>
            <label htmlFor="login-email" className={styles.label}>
              Email
            </label>
            <div className={styles.inputWrapper}>
              <svg
                className={styles.inputIcon}
                aria-hidden="true"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              <input
                id="login-email"
                type="email"
                autoComplete="username"
                className={`${styles.input} ${styles.inputWithIcon}`}
                value={values.email}
                onChange={update('email')}
                disabled={submitting}
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={errors.email ? 'login-email-error' : undefined}
                data-testid="login-email"
                placeholder="name@institution.com"
              />
            </div>
            {errors.email && (
              <p id="login-email-error" className={styles.fieldError}>
                {errors.email}
              </p>
            )}
          </div>

          {/* OTP / Password field with show/hide toggle */}
          <div className={styles.fieldGroup}>
            <div className={styles.labelRow}>
              <label htmlFor="login-password" id="login-password-label" className={styles.label}>
                Enter OTP
              </label>
              {/* Screen reader / compatibility labels for OTP and Password queries */}
              <label htmlFor="login-password" id="login-otp-label" className={styles.srOnly}>
                OTP
              </label>
              <label htmlFor="login-password" id="login-compat-label" className={styles.srOnly}>
                Password
              </label>
            </div>
            <div className={styles.inputWrapper}>
              <svg
                className={styles.inputIcon}
                aria-hidden="true"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className={`${styles.input} ${styles.inputWithIcon} ${styles.passwordInput}`}
                value={values.otp}
                onChange={update('otp')}
                disabled={submitting}
                aria-invalid={errors.otp ? true : undefined}
                aria-describedby={errors.otp ? 'login-password-error' : undefined}
                data-testid="login-password"
                placeholder="6-digit OTP code"
              />
              <button
                type="button"
                className={styles.revealButton}
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                data-testid="toggle-password-visibility"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.otp && (
              <p id="login-password-error" className={styles.fieldError}>
                {errors.otp}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={styles.submitButton}
            disabled={rateLimitCountdown > 0 || submitting}
            data-testid="login-submit"
          >
            {submitting ? (
              <span className={styles.submitContent}>
                <Spinner size="sm" />
                <span>Signing in...</span>
              </span>
            ) : rateLimitCountdown > 0 ? (
              `Wait ${rateLimitCountdown}s`
            ) : isAdminMode ? (
              'Sign in as Admin'
            ) : (
              'Sign in'
            )}
          </button>

          {/* Quick-Fill Demo Chips */}
          <div className={styles.demoAccounts} aria-label="Demo accounts quick fill">
            <span className={styles.demoLabel}>Demo shortcuts:</span>
            <div className={styles.demoChips}>
              <button
                type="button"
                className={styles.demoChip}
                onClick={() => fillDemo('student@team24.com', '123456', false)}
                title="Fill Student account"
              >
                Student
              </button>
              <button
                type="button"
                className={styles.demoChip}
                onClick={() => fillDemo('sa.officer@team24.com', '123456', false)}
                title="Fill Student Affairs staff account"
              >
                Staff
              </button>
              <button
                type="button"
                className={styles.demoChip}
                onClick={() => fillDemo('admin@team24.com', '204884', true)}
                title="Fill Administrator account"
              >
                Admin
              </button>
            </div>
          </div>

          {/* Admin Sign-In Mode Toggle */}
          <div className={styles.adminToggleArea}>
            <button
              type="button"
              onClick={toggleAdminMode}
              className={styles.adminToggleBtn}
              data-testid="toggle-admin-login"
            >
              {isAdminMode ? '← Sign in as student, faculty, or staff' : 'Sign in as Administrator →'}
            </button>
          </div>

          {/* Inline Error & Recovery Region */}
          {formError && (
            <div
              className={styles.errorAlert}
              role="alert"
              id="login-error-alert"
              data-testid="login-error"
            >
              <div className={styles.errorMessage}>{formError.message}</div>
              {formError.requestId && (
                <div className={styles.requestId} data-testid="login-error-request-id">
                  Reference: {formError.requestId}
                </div>
              )}
              {formError.isRecoverable && (
                <button
                  type="button"
                  onClick={handleAuthenticate}
                  className={styles.retryBtn}
                  data-testid="login-retry-button"
                >
                  Try Again
                </button>
              )}
            </div>
          )}

          {/* Cold-start waiting indicator */}
          {isWaking && (
            <div className={styles.wakingNotice} role="status">
              <span className={styles.pulseDot} />
              <span>Connecting to hosted server. If the server is spinning up from sleep, this may take up to 45 seconds...</span>
            </div>
          )}

          {rateLimitCountdown > 0 && (
            <p className={styles.rateLimitNote}>
              Rate limited: login requests will be unlocked in {rateLimitCountdown} seconds.
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
