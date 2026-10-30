import { NavLink } from 'react-router'
import { useAuth } from '@/core/auth'
import { Text } from '@/ui'
import { useProfile } from '../hooks/useProfile'
import styles from './DocDeskNav.module.css'

export function DocDeskNav() {
  const { user } = useAuth()
  const { isStudentAffairs } = useProfile()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `${styles.navLink} ${isActive ? styles.active : ''}`

  return (
    <nav className={styles.bar} aria-label="DocDesk Navigation" data-testid="docdesk-nav">
      <div className={styles.links}>
        {/* Requesters (student, faculty, office_staff) */}
        {user?.role !== 'admin' && (
          <>
            <NavLink to="/tracks/docdesk" end className={linkClass} data-testid="nav-docdesk-home">
              Dashboard
            </NavLink>
            <NavLink to="/tracks/docdesk/catalogue" className={linkClass} data-testid="nav-docdesk-catalogue">
              Catalogue
            </NavLink>
            <NavLink to="/tracks/docdesk/my-requests" className={linkClass} data-testid="nav-docdesk-my-requests">
              My Requests
            </NavLink>
            <NavLink to="/tracks/docdesk/new" className={linkClass} data-testid="nav-docdesk-new">
              New Request
            </NavLink>
          </>
        )}

        {/* Student Affairs only */}
        {isStudentAffairs && (
          <>
            <NavLink to="/tracks/docdesk/staff" end className={linkClass} data-testid="nav-docdesk-staff">
              Staff Queue
            </NavLink>
            <NavLink to="/tracks/docdesk/staff/doc-types" className={linkClass} data-testid="nav-docdesk-doctypes">
              Manage Doc Types
            </NavLink>
          </>
        )}

        {/* Admin only */}
        {user?.role === 'admin' && (
          <NavLink to="/tracks/docdesk/admin" end className={linkClass} data-testid="nav-docdesk-admin">
            Admin Overview (Read-Only)
          </NavLink>
        )}
      </div>

      <div className={styles.meta}>
        <Text size="xs" tone="textMuted">
          Role: <strong>{user?.role}</strong>
          {isStudentAffairs && ' (Student Affairs Staff)'}
        </Text>
      </div>
    </nav>
  )
}
