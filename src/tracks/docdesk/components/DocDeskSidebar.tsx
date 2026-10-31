import { useEffect, useRef } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { useAuth } from '@/core/auth'
import { useProfile } from '../hooks/useProfile'
import { isStudentAffairs } from '../utils/department'
import styles from './DocDeskSidebar.module.css'

interface DocDeskSidebarProps {
  mobileOpen?: boolean
  onCloseMobile?: () => void
}

export function DocDeskSidebar({ mobileOpen = false, onCloseMobile }: DocDeskSidebarProps) {
  const { user } = useAuth()
  const { profile } = useProfile()
  const location = useLocation()
  const drawerRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const isStaff = user?.role === 'office_staff' && isStudentAffairs(profile?.dept ?? (user as any)?.dept)
  const isAdmin = user?.role === 'admin'

  let landingRoute = '/tracks/docdesk'
  let roleLabel = 'Requester'
  let navItems: Array<{ label: string; to: string; end?: boolean; testId: string }> = []

  if (isAdmin) {
    landingRoute = '/tracks/docdesk/admin'
    roleLabel = 'Admin'
    navItems = [
      { label: 'Request Audit', to: '/tracks/docdesk/admin', end: true, testId: 'nav-docdesk-admin' },
    ]
  } else if (isStaff) {
    landingRoute = '/tracks/docdesk/staff/dashboard'
    roleLabel = 'Student Affairs'
    navItems = [
      { label: 'Dashboard', to: '/tracks/docdesk/staff/dashboard', end: true, testId: 'nav-docdesk-staff-dash' },
      { label: 'Requests', to: '/tracks/docdesk/staff', end: true, testId: 'nav-docdesk-staff' },
      { label: 'Document Types', to: '/tracks/docdesk/staff/doc-types', testId: 'nav-docdesk-doctypes' },
    ]
  } else {
    landingRoute = '/tracks/docdesk/my-requests'
    roleLabel = user?.role === 'faculty' ? 'Faculty' : user?.role === 'office_staff' ? 'Office Staff' : 'Student'
    navItems = [
      { label: 'My Requests', to: '/tracks/docdesk/my-requests', end: true, testId: 'nav-docdesk-my-requests' },
      { label: 'New Request', to: '/tracks/docdesk/new', testId: 'nav-docdesk-new' },
    ]
  }

  // Close drawer on route change
  useEffect(() => {
    if (mobileOpen && onCloseMobile) {
      onCloseMobile()
    }
  }, [location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle Escape key and focus trap when mobile drawer is open
  useEffect(() => {
    if (!mobileOpen) return

    // Reversible scroll lock
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Focus initial element in drawer
    const timer = setTimeout(() => {
      closeButtonRef.current?.focus()
    }, 50)

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCloseMobile?.()
        return
      }

      if (e.key === 'Tab') {
        if (!drawerRef.current) return
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        if (focusable.length === 0) return

        const firstElement = focusable[0]
        const lastElement = focusable[focusable.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      clearTimeout(timer)
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [mobileOpen, onCloseMobile])

  const renderNavContent = (isDrawer = false) => (
    <div className={styles.inner}>
      <div className={isDrawer ? styles.drawerHeader : styles.headerBlock}>
        <Link
          to={landingRoute}
          className={styles.brandLink}
          onClick={isDrawer ? onCloseMobile : undefined}
        >
          <h2 className={styles.brandTitle}>DocDesk</h2>
          <p className={styles.roleContext}>{roleLabel}</p>
        </Link>
        {isDrawer && (
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.closeButton}
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
          >
            &times;
          </button>
        )}
      </div>

      <nav aria-label="DocDesk" className={styles.nav}>
        <ul className={styles.navList}>
          {navItems.map((item) => (
            <li key={item.to + item.label} className={styles.navItem}>
              <NavLink
                to={item.to}
                end={item.end}
                data-testid={item.testId}
                onClick={isDrawer ? onCloseMobile : undefined}
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
    </div>
  )

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className={styles.sidebarWrapper} aria-label="DocDesk Sidebar" data-testid="docdesk-sidebar">
        {renderNavContent(false)}
      </aside>

      {/* Mobile Modal Drawer */}
      {mobileOpen && (
        <div
          className={styles.backdrop}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onCloseMobile?.()
            }
          }}
          data-testid="docdesk-drawer-backdrop"
        >
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="DocDesk Navigation"
            id="docdesk-sidebar-drawer"
            className={styles.drawer}
            data-testid="docdesk-drawer"
          >
            {renderNavContent(true)}
          </div>
        </div>
      )}
    </>
  )
}
