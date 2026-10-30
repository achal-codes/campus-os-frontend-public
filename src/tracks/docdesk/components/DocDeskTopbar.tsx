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

  const isStaff = user?.role === 'office_staff' && isStudentAffairs(profile?.dept)
  const isAdmin = user?.role === 'admin'

  // Determine navigation items according to user role
  let navItems: Array<{ label: string, to: string, end?: boolean, testId: string }> = []
  let roleLabel = 'Requester'
  let roleBadgeClass = styles.roleBadge

  if (isAdmin) {
    roleLabel = 'Admin (Audit)'
    roleBadgeClass = `${styles.roleBadge} ${styles.roleBadgeAdmin}`
    navItems = [
      { label: 'Overview', to: '/tracks/docdesk/admin', end: true, testId: 'nav-docdesk-admin' },
      { label: 'Request Audit', to: '/tracks/docdesk/admin', testId: 'nav-docdesk-audit' },
    ]
  } else if (isStaff) {
    roleLabel = 'Student Affairs'
    roleBadgeClass = `${styles.roleBadge} ${styles.roleBadgeStaff}`
    navItems = [
      { label: 'Dashboard', to: '/tracks/docdesk/staff/dashboard', testId: 'nav-docdesk-staff-dash' },
      { label: 'Requests', to: '/tracks/docdesk/staff', end: true, testId: 'nav-docdesk-staff' },
      { label: 'Document Types', to: '/tracks/docdesk/staff/doc-types', testId: 'nav-docdesk-doctypes' },
    ]
  } else {
    roleLabel = user?.role === 'faculty' ? 'Faculty Requester' : 'Student Requester'
    navItems = [
      { label: 'Dashboard', to: '/tracks/docdesk', end: true, testId: 'nav-docdesk-home' },
      { label: 'My Requests', to: '/tracks/docdesk/my-requests', testId: 'nav-docdesk-my-requests' },
      { label: 'New Request', to: '/tracks/docdesk/new', testId: 'nav-docdesk-new' },
      { label: 'Catalogue', to: '/tracks/docdesk/catalogue', testId: 'nav-docdesk-catalogue' },
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
    <header className={styles.topbarWrapper} role="banner" data-testid="docdesk-nav">
      <div className={styles.topbarContainer}>
        {/* Left: Brand */}
        <Link to="/tracks/docdesk" className={styles.brandGroup} aria-label="DocDesk Home">
          <div className={styles.brandGlyph} aria-hidden="true">
            📄
          </div>
          <div className={styles.brandText}>
            <span className={styles.brandName}>DocDesk</span>
            <span className={styles.brandContext}>CampusOS · Team 24</span>
          </div>
        </Link>

        {/* Center: Horizontal Top Navigation */}
        <nav aria-label="Main Track Navigation">
          <ul className={styles.navLinks}>
            {navItems.map((item) => (
              <li key={item.to + item.label} className={styles.navItem}>
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

        {/* Right: Role, Profile & Controls */}
        <div className={styles.actionsGroup}>
          <span className={roleBadgeClass} aria-label={`Current Role: ${roleLabel}`}>
            {roleLabel}
          </span>

          {user && (
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user.name || user.email.split('@')[0]}</span>
              <span className={styles.userEmail}>{user.email}</span>
            </div>
          )}

          <button
            type="button"
            className={styles.iconButton}
            onClick={toggleTheme}
            aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
            title={`Toggle theme (${mode})`}
          >
            {mode === 'dark' ? '☀️' : '🌙'}
          </button>

          <button
            type="button"
            className={styles.iconButton}
            onClick={handleSignOut}
            aria-label="Sign out"
            title="Sign out of CampusOS"
          >
            🚪
          </button>

          {/* Mobile hamburger menu toggle */}
          <button
            ref={menuButtonRef}
            type="button"
            className={styles.mobileMenuToggle}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-label="Open navigation menu"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className={styles.mobileDrawerOverlay} role="dialog" aria-modal="true" aria-label="Navigation Menu">
          <div ref={drawerRef} className={styles.mobileDrawer}>
            <div className={styles.mobileDrawerHeader}>
              <div className={styles.brandText}>
                <span className={styles.brandName}>DocDesk</span>
                <span className={styles.brandContext}>{roleLabel}</span>
              </div>
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => {
                  setMobileOpen(false)
                  menuButtonRef.current?.focus()
                }}
                aria-label="Close navigation menu"
              >
                ✕
              </button>
            </div>

            <ul className={styles.mobileNavLinks}>
              {navItems.map((item) => (
                <li key={'m-' + item.to + item.label}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      isActive ? `${styles.mobileNavLink} ${styles.mobileNavLinkActive}` : styles.mobileNavLink
                    }
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className={styles.mobileDrawerFooter}>
              {user && (
                <div style={{ fontSize: '0.875rem' }}>
                  <div style={{ fontWeight: 600 }}>{user.name}</div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{user.email}</div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    minHeight: '44px',
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text)',
                    cursor: 'pointer',
                  }}
                  onClick={toggleTheme}
                >
                  {mode === 'dark' ? '☀️ Light' : '🌙 Dark'}
                </button>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    minHeight: '44px',
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: 'var(--color-danger)',
                    cursor: 'pointer',
                  }}
                  onClick={handleSignOut}
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
