import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import { useAuth } from '@/core/auth'
import { useTheme } from '@/theme'
import { useProfile } from '../hooks/useProfile'
import { isStudentAffairs } from '../utils/department'
import styles from './DocDeskTopbar.module.css'

export function DocDeskTopbar() {
  const { user, signOut } = useAuth()
  const { profile } = useProfile()
  const { mode, setMode } = useTheme()
  const navigate = useNavigate()

  const [mobileOpen, setMobileOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)

  const isStaff = user?.role === 'office_staff' && isStudentAffairs(profile?.dept ?? (user as any)?.dept)
  const isAdmin = user?.role === 'admin'

  // Determine navigation items according to user role
  let navItems: Array<{ label: string; to: string; end?: boolean; testId: string }> = []
  let roleTitle = 'DocDesk Requester'
  let roleDisplay = user?.role === 'faculty' ? 'Faculty' : user?.role === 'office_staff' ? 'Office Staff' : 'Student'

  if (isAdmin) {
    roleTitle = 'DocDesk Admin'
    roleDisplay = 'Admin'
    navItems = [
      { label: 'Overview', to: '/tracks/docdesk/admin', end: true, testId: 'nav-docdesk-admin' },
      { label: 'Request Audit', to: '/tracks/docdesk/admin', testId: 'nav-docdesk-audit' },
    ]
  } else if (isStaff) {
    roleTitle = 'DocDesk Student Affairs'
    roleDisplay = 'Student Affairs'
    navItems = [
      { label: 'Dashboard', to: '/tracks/docdesk/staff/dashboard', testId: 'nav-docdesk-staff-dash' },
      { label: 'Requests', to: '/tracks/docdesk/staff', end: true, testId: 'nav-docdesk-staff' },
      { label: 'Bulk TAT', to: '/tracks/docdesk/staff/bulk-tat', testId: 'nav-docdesk-bulk-tat' },
      { label: 'Document Types', to: '/tracks/docdesk/staff/doc-types', testId: 'nav-docdesk-doctypes' },
    ]
  } else {
    roleTitle = 'DocDesk Requester'
    navItems = [
      { label: 'My Requests', to: '/tracks/docdesk/my-requests', testId: 'nav-docdesk-my-requests' },
      { label: 'New Request', to: '/tracks/docdesk/new', testId: 'nav-docdesk-new' },
    ]
  }

  // Handle ESC key and outside click to close mobile menu
  useEffect(() => {
    if (!mobileOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMobileOpen(false)
        menuButtonRef.current?.focus()
      }
    }

    function handleClickOutside(e: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node) && e.target !== menuButtonRef.current) {
        setMobileOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('mousedown', handleClickOutside)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('mousedown', handleClickOutside)
    }
  }, [mobileOpen])

  function toggleTheme() {
    setMode(mode === 'dark' ? 'light' : 'dark')
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <header className={styles.topbarContainer} data-testid="docdesk-nav">
      <div className={styles.innerBar}>
        {/* Brand Link & Role Info */}
        <Link to="/tracks/docdesk" className={styles.brandLink}>
          <div className={styles.brandBadge}>DocDesk</div>
          <div className={styles.roleTag}>
            <span className={styles.roleTitle}>{roleTitle}</span>
            <span className={styles.roleSub}>{roleDisplay}</span>
          </div>
        </Link>

        {/* Desktop Horizontal Navigation Pills */}
        <nav className={styles.navDesktop} aria-label="DocDesk Navigation">
          <ul className={styles.navList}>
            {navItems.map((item) => (
              <li key={item.to + item.label}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  data-testid={item.testId}
                  className={({ isActive }) =>
                    isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right Controls */}
        <div className={styles.rightCluster}>
          {user && (
            <div className={styles.userCapsule}>
              <span className={styles.userDot} />
              <span className={styles.userName}>{user.name || user.email.split('@')[0]}</span>
            </div>
          )}

          <button
            type="button"
            className={styles.themeBtn}
            onClick={toggleTheme}
            aria-label={`Toggle theme: current ${mode}`}
          >
            {mode === 'dark' ? '☀️' : '🌙'}
          </button>

          <button
            type="button"
            className={styles.logoutBtn}
            onClick={handleSignOut}
            aria-label="Logout"
          >
            Logout
          </button>

          <button
            ref={menuButtonRef}
            type="button"
            className={styles.hamburgerBtn}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-label="Open navigation menu"
            data-testid="docdesk-menu-toggle"
          >
            Menu
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          className={styles.mobileDrawerOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Menu"
        >
          <div ref={drawerRef} className={styles.mobileDrawer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div className={styles.brandBadge}>DocDesk</div>
                <div className={styles.roleTitle}>{roleTitle}</div>
                <div className={styles.roleSub}>{roleDisplay}</div>
              </div>
              <button
                type="button"
                className={styles.hamburgerBtn}
                onClick={() => {
                  setMobileOpen(false)
                  menuButtonRef.current?.focus()
                }}
                aria-label="Close navigation menu"
              >
                Close
              </button>
            </div>

            <nav aria-label="Mobile Navigation">
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {navItems.map((item) => (
                  <li key={'m-' + item.to + item.label}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      data-testid={`m-${item.testId}`}
                      className={({ isActive }) =>
                        isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
                      }
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16, marginTop: 'auto' }}>
              {user && (
                <div style={{ marginBottom: 12, fontSize: 13 }}>
                  <div style={{ fontWeight: 600 }}>{user.name}</div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>{user.email}</div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className={styles.themeBtn} onClick={toggleTheme} style={{ flex: 1 }}>
                  {mode === 'dark' ? 'Light' : 'Dark'}
                </button>
                <button type="button" className={styles.logoutBtn} onClick={handleSignOut} style={{ flex: 1 }}>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
