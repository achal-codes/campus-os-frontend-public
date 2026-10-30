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
  let navItems: Array<{ label: string, to: string, end?: boolean, testId: string }> = []
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
    <aside className={styles.navContainer} data-testid="docdesk-nav">
      {/* Desktop Left Sidebar */}
      <div className={styles.sidebarShell}>
        <div className={styles.brandHeader}>
          <Link to="/tracks/docdesk" style={{ textDecoration: 'none' }}>
            <div className={styles.brandName}>DocDesk</div>
          </Link>
          <div className={styles.roleLabel}>{roleTitle}</div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{roleDisplay}</div>
        </div>

        <nav className={styles.navSection} aria-label="DocDesk Sidebar Navigation">
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

        <div className={styles.sidebarFooter}>
          {user && (
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user.name || user.email.split('@')[0]}</span>
              <span className={styles.userEmail}>{user.email}</span>
            </div>
          )}

          <div className={styles.footerControls}>
            <button
              type="button"
              className={styles.themeButton}
              onClick={toggleTheme}
              aria-label={`Toggle theme: current ${mode}`}
            >
              {mode === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>

            <button
              type="button"
              className={styles.logoutButton}
              onClick={handleSignOut}
              aria-label="Logout"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bar (< 768px) */}
      <div className={styles.mobileBar}>
        <Link to="/tracks/docdesk" className={styles.mobileBrand}>
          <span className={styles.brandName}>DocDesk</span>
        </Link>

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

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className={styles.mobileDrawerOverlay} role="dialog" aria-modal="true" aria-label="Navigation Menu">
          <div ref={drawerRef} className={styles.mobileDrawer}>
            <div className={styles.brandHeader} style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className={styles.brandName}>DocDesk</div>
                <div className={styles.roleLabel}>{roleTitle}</div>
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

            <nav className={styles.navSection}>
              <ul className={styles.navList}>
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

            <div className={styles.sidebarFooter}>
              {user && (
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{user.name}</span>
                  <span className={styles.userEmail}>{user.email}</span>
                </div>
              )}
              <div className={styles.footerControls}>
                <button type="button" className={styles.themeButton} onClick={toggleTheme}>
                  {mode === 'dark' ? 'Light mode' : 'Dark mode'}
                </button>
                <button type="button" className={styles.logoutButton} onClick={handleSignOut}>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
