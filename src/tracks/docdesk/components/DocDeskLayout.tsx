import type { ReactNode } from 'react'
import { Outlet } from 'react-router'
import { DocDeskTopbar } from './DocDeskTopbar'
import glassStyles from '../theme/glass.module.css'
import styles from './DocDeskLayout.module.css'

interface DocDeskLayoutProps {
  children?: ReactNode
  activeItem?: string
  className?: string
}

export function DocDeskLayout({ children, className }: DocDeskLayoutProps) {
  return (
    <div className={glassStyles.glassContainer}>
      <DocDeskTopbar />
      <main className={`${styles.mainContent} ${className ?? ''}`} id="docdesk-main-content">
        {children ?? <Outlet />}
      </main>
    </div>
  )
}
