import { useState, useRef, type ReactNode } from 'react'
import { Outlet } from 'react-router'
import { DocDeskSidebar } from './DocDeskSidebar'
import { ToastContainer } from './Toast'
import styles from './DocDeskLayout.module.css'

interface DocDeskLayoutProps {
  children?: ReactNode
  activeItem?: string
  className?: string
}

export function DocDeskLayout({ children, className }: DocDeskLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuBtnRef = useRef<HTMLButtonElement>(null)

  function handleCloseMobile() {
    setMobileOpen(false)
    menuBtnRef.current?.focus()
  }

  return (
    <div className={styles.workspace} data-testid="docdesk-nav" id="docdesk-workspace">
      <ToastContainer />
      <DocDeskSidebar
        mobileOpen={mobileOpen}
        onCloseMobile={handleCloseMobile}
      />
      <div className={styles.contentColumn}>
        <div className={styles.mobileMenuBar}>
          <button
            ref={menuBtnRef}
            type="button"
            className={styles.mobileMenuBtn}
            onClick={() => setMobileOpen(true)}
            aria-label="Open DocDesk navigation"
            aria-expanded={mobileOpen}
            aria-controls="docdesk-sidebar-drawer"
            data-testid="docdesk-menu-toggle"
          >
            Menu
          </button>
        </div>
        <section
          className={`${styles.workspaceSection} ${className ?? ''}`}
          id="docdesk-workspace-content"
          data-testid="docdesk-workspace-content"
        >
          {children ?? <Outlet />}
        </section>
      </div>
    </div>
  )
}
