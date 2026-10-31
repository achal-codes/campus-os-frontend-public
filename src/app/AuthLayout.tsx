import { Outlet } from 'react-router'
import { ThemeToggle } from '@/ui'
import styles from './AuthLayout.module.css'

export function AuthLayout() {
  return (
    <main className={styles.page}>
      <div className={styles.toggle}>
        <ThemeToggle />
      </div>
      <Outlet />
    </main>
  )
}
