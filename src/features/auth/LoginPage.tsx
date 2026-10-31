import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { useAuth } from '@/core/auth'
import { ApiError } from '@/core/api'
import { Alert, Button, Stack, Text, TextField } from '@/ui'
import { safeNext } from './safeNext'
import { hasErrors, validateLogin, type FieldErrors, type LoginValues } from './validation'
import styles from './LoginPage.module.css'

export function LoginPage() {
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))

  const [values, setValues] = useState<LoginValues>({ email: '', otp: '' })
  const [errors, setErrors] = useState<FieldErrors<LoginValues>>({})
  const [formError, setFormError] = useState<string | null>(null)
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

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (rateLimitCountdown > 0) return

    const found = validateLogin(values)
    setErrors(found)
    setFormError(null)
    if (hasErrors(found)) return

    setSubmitting(true)
    setIsWaking(false)

    // Free tier Render server wake warning after 4.5 seconds
    wakingTimerRef.current = setTimeout(() => {
      setIsWaking(true)
    }, 4500)

    try {
      await signIn(values.email, values.otp)
      if (wakingTimerRef.current) clearTimeout(wakingTimerRef.current)
      navigate(next, { replace: true })
    } catch (error) {
      if (wakingTimerRef.current) clearTimeout(wakingTimerRef.current)
      setIsWaking(false)
      setSubmitting(false)

      if (error instanceof ApiError) {
        if (error.code === 'INVALID_CREDENTIALS') {
          setFormError(error.message || 'Invalid email_id or OTP')
        } else if (error.code === 'UNKNOWN_INSTITUTION') {
          setFormError(error.message || 'Unknown institution domain. Please sign in with your campus email.')
        } else if (error.code === 'RATE_LIMITED') {
          setRateLimitCountdown(30)
          setFormError('Too many login attempts. Please wait 30 seconds before trying again.')
        } else if (error.code === 'USE_ADMIN_LOGIN') {
          setFormError('Please use the admin login portal for this administrative account.')
        } else {
          setFormError(error.message || 'Authentication failed. Please try again.')
        }
      } else {
        setFormError(error instanceof Error ? error.message : 'Something went wrong. Try again.')
      }
    }
  }

  return (
    <Stack gap={6} className={styles.container}>
      <Stack gap={2}>
        <div className={styles.badgeRow}>
          <span className={styles.badge}>Campus OS</span>
          <span className={styles.badgeSubtle}>DocDesk Portal</span>
        </div>
        <Text as="h1" size="xl" weight="bold" className={styles.heading}>
          Welcome back
        </Text>
        <Text tone="textMuted" size="sm" className={styles.subtitle}>
          Sign in with your institution email and the OTP from your admin.
        </Text>
      </Stack>

      <form onSubmit={onSubmit} noValidate aria-label="Sign in" className={styles.form}>
        <Stack gap={4}>
          {formError && (
            <Alert tone="danger" data-testid="login-error">
              {formError}
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
            data-testid="login-otp"
          />
          <Button
            type="submit"
            fullWidth
            loading={submitting}
            disabled={rateLimitCountdown > 0}
            data-testid="login-submit"
          >
            {rateLimitCountdown > 0 ? `Wait ${rateLimitCountdown}s` : 'Sign in'}
          </Button>

          {rateLimitCountdown > 0 && (
            <Text size="xs" tone="textMuted" style={{ textAlign: 'center' }}>
              Rate limited: login requests will be unlocked in {rateLimitCountdown} seconds.
            </Text>
          )}
        </Stack>
      </form>
    </Stack>
  )
}
