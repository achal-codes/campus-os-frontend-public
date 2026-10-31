import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/core/auth'
import { Button, Text } from '@/ui'
import { formatDate } from '@/tracks/docdesk/utils/time'
import { getProfile, type ProfileData } from './profileApi'
import { getInitials, getRoleLabel } from './profileUtils'
import styles from './ProfilePage.module.css'

export function ProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const h1Ref = useRef<HTMLHeadingElement>(null)

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async (isRetry = false) => {
    if (!user) return
    if (isRetry) setLoading(true)
    setError(null)
    try {
      const data = await getProfile(user.role)
      setProfile(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile details')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    document.title = 'Profile · Campus OS'
    h1Ref.current?.focus()
  }, [])

  useEffect(() => {
    let ignore = false
    async function init() {
      if (!user) return
      try {
        const data = await getProfile(user.role)
        if (!ignore) setProfile(data)
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : 'Failed to load profile details')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    init()
    return () => {
      ignore = true
    }
  }, [user])

  function onBack() {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/', { replace: true })
    }
  }

  // Active data: fetched profile data with fallback to session user info
  const activeData: ProfileData | null = profile ?? (user ? {
    name: user.name,
    email_id: user.email,
    role: user.role,
  } : null)

  const displayName = activeData?.name || user?.name || ''
  const displayEmail = activeData?.email_id || activeData?.email || user?.email || ''
  const displayRole = getRoleLabel(activeData?.role || user?.role)
  const initials = getInitials(displayName)

  // Construct label/value rows, strictly omitting any missing/empty values
  const rows: { label: string; value: string; testId: string }[] = []

  if (displayName) {
    rows.push({ label: 'Name', value: displayName, testId: 'profile-name' })
  }
  if (displayEmail) {
    rows.push({ label: 'Email', value: displayEmail, testId: 'profile-email' })
  }
  if (displayRole) {
    rows.push({ label: 'Role', value: displayRole, testId: 'profile-role' })
  }
  if (activeData?.usn) {
    rows.push({ label: 'ID', value: activeData.usn, testId: 'profile-id' })
  }
  if (activeData?.dept) {
    rows.push({ label: 'Department', value: activeData.dept, testId: 'profile-dept' })
  }
  if (activeData?.designation) {
    rows.push({ label: 'Designation', value: activeData.designation, testId: 'profile-designation' })
  }
  if (activeData?.institution_name) {
    rows.push({ label: 'Institution', value: activeData.institution_name, testId: 'profile-institution' })
  }
  if (activeData?.phone_number) {
    rows.push({ label: 'Phone number', value: activeData.phone_number, testId: 'profile-phone' })
  }
  if (activeData?.created_at) {
    const formattedDate = formatDate(activeData.created_at)
    if (formattedDate) {
      rows.push({ label: 'Member since', value: formattedDate, testId: 'profile-created-at' })
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.backRow}>
        <button
          type="button"
          onClick={onBack}
          className={styles.backButton}
          data-testid="profile-back"
          aria-label="Back"
        >
          &larr; Back
        </button>
      </div>

      <h1
        ref={h1Ref}
        tabIndex={-1}
        className={styles.title}
        data-testid="profile-heading"
      >
        Profile
      </h1>

      {error && (
        <div role="alert" className={styles.errorNotice} data-testid="profile-error">
          <Text tone="danger">{error}</Text>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => loadData(true)}
            className={styles.retryButton}
            data-testid="profile-retry"
          >
            Retry
          </Button>
        </div>
      )}

      {loading && !activeData ? (
        <div className={styles.card} aria-busy="true" data-testid="profile-loading">
          <div className={styles.skeletonHeader} />
          <div className={styles.skeletonRows}>
            <div className={styles.skeletonLine} />
            <div className={styles.skeletonLine} />
            <div className={styles.skeletonLine} />
          </div>
        </div>
      ) : (
        <div className={styles.card} data-testid="profile-card">
          <div className={styles.headerBlock}>
            <div className={styles.avatar} aria-hidden="true" data-testid="profile-avatar">
              {initials}
            </div>
            <div className={styles.identity}>
              <h2 className={styles.fullName} data-testid="profile-display-name">
                {displayName}
              </h2>
              <span className={styles.badge} data-testid="profile-badge">
                {displayRole}
              </span>
            </div>
          </div>

          <dl className={styles.dl} data-testid="profile-fields">
            {rows.map((row) => (
              <div key={row.label} className={styles.row}>
                <dt className={styles.dt}>{row.label}</dt>
                <dd className={styles.dd} data-testid={row.testId}>{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  )
}
