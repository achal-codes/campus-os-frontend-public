import type { ReactNode } from 'react'
import { Outlet } from 'react-router'
import { DocDeskTopbar } from './DocDeskTopbar'
import { ToastContainer } from './Toast'
import styles from './DocDeskLayout.module.css'

interface DocDeskLayoutProps {
  children?: ReactNode
  activeItem?: string
  className?: string
}

export function DocDeskLayout({ children, className }: DocDeskLayoutProps) {
  return (
    <div className={styles.appShell}>
      <DocDeskTopbar />
      <ToastContainer />
      <div className={styles.contentArea}>
        <main className={`${styles.mainContent} ${className ?? ''}`} id="docdesk-main-content">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  )
}
