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
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))

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
      await signIn(values.email, values.otp)
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
        {/* 1. Small brand wordmark */}
        <div className={styles.brandRow}>
          <span className={styles.brandMark}>Campus OS</span>
        </div>

        {/* 2. Single H1 and helper text */}
        <div className={styles.header}>
          <h1 className={styles.heading}>Sign in</h1>
          <p className={styles.helperText}>Use your campus account.</p>
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
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              className={styles.input}
              value={values.email}
              onChange={update('email')}
              disabled={submitting}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? 'login-email-error' : undefined}
              data-testid="login-email"
            />
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
            <div className={styles.passwordWrapper}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className={`${styles.input} ${styles.passwordInput}`}
                value={values.otp}
                onChange={update('otp')}
                disabled={submitting}
                aria-invalid={errors.otp ? true : undefined}
                aria-describedby={errors.otp ? 'login-password-error' : undefined}
                data-testid="login-password"
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
            ) : (
              'Sign in'
            )}
          </button>

          {/* 4. Inline Error & Recovery Region */}
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
