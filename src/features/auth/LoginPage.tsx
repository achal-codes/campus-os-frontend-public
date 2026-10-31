import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { useAuth } from '@/core/auth'
import { Alert, Button, Stack, Text, TextField } from '@/ui'
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
    <Stack gap={6} className={styles.container}>
      <Stack gap={2}>
        <div className={styles.badgeRow}>
          <span className={styles.badge}>Campus OS</span>
          <span className={styles.badgeSubtle}>
            {isAdminMode ? 'Administrator Console' : 'DocDesk Portal'}
          </span>
        </div>
        <Text as="h1" size="xl" weight="bold" className={styles.heading}>
          {isAdminMode ? 'Administrator Sign In' : 'Welcome back'}
        </Text>
        <Text tone="textMuted" size="sm" className={styles.subtitle}>
          {isAdminMode
            ? 'Sign in with institutional admin credentials to access the console.'
            : 'Sign in with your institution email and the OTP from your admin.'}
        </Text>
      </Stack>

      <form
        onSubmit={onSubmit}
        noValidate
        aria-label="Sign in"
        aria-busy={submitting}
        aria-describedby={formError ? 'login-error-alert' : undefined}
        className={styles.form}
      >
        <Stack gap={4}>
          {formError && (
            <Alert tone="danger" data-testid="login-error" id="login-error-alert">
              <Stack gap={1}>
                <div>{formError.message}</div>
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
              </Stack>
            </Alert>
          )}

          {isWaking && (
            <div className={styles.wakingNotice} role="status">
              <span className={styles.pulseDot} />
              <span>Connecting to hosted server. If the server is spinning up from sleep, this may take up to 45 seconds...</span>
            </div>
          )}

          <TextField
            label="Email"
            type="email"
            autoComplete="username"
            value={values.email}
            onChange={update('email')}
            error={errors.email}
            disabled={submitting}
            data-testid="login-email"
          />
          <TextField
            label="OTP"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={8}
            value={values.otp}
            onChange={update('otp')}
            error={errors.otp}
            disabled={submitting}
            data-testid="login-otp"
          />
          <Button
            type="submit"
            fullWidth
            loading={submitting}
            disabled={rateLimitCountdown > 0 || submitting}
            data-testid="login-submit"
          >
            {rateLimitCountdown > 0 ? `Wait ${rateLimitCountdown}s` : isAdminMode ? 'Sign in as Admin' : 'Sign in'}
          </Button>

          {rateLimitCountdown > 0 && (
            <Text size="xs" tone="textMuted" style={{ textAlign: 'center' }}>
              Rate limited: login requests will be unlocked in {rateLimitCountdown} seconds.
            </Text>
          )}

          <div className={styles.modeToggleArea}>
            <button
              type="button"
              onClick={toggleAdminMode}
              className={styles.modeToggleBtn}
              data-testid="toggle-admin-login"
            >
              {isAdminMode ? '← Sign in as student, faculty, or staff' : 'Sign in as Administrator →'}
            </button>
          </div>
        </Stack>
      </form>
    </Stack>
  )
}
