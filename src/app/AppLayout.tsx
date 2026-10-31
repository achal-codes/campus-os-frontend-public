import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { useAuth } from '@/core/auth'
import { tracks } from '@/core/tracks/registry'
import { Button, Text, ThemeToggle } from '@/ui'
import styles from './AppLayout.module.css'

export function AppLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  async function onSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  const navClass = ({ isActive }: { isActive: boolean }) =>
    [styles.navLink, isActive && styles.active].filter(Boolean).join(' ')

  const isDocDesk = location.pathname.startsWith('/tracks/docdesk')

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link to="/" className={styles.brand}>Campus OS</Link>
        <nav aria-label="Tracks" className={styles.nav}>
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={navClass} data-testid="nav-admin">Admin</NavLink>
          )}
          {tracks.map((track) => (
            <NavLink key={track.id} to={`/tracks/${track.id}`} className={navClass}>
              {track.navLabel ?? track.title}
            </NavLink>
          ))}
        </nav>
        <div className={styles.actions}>
          {user && (
            <Link
              to="/profile"
              className={styles.userLink}
              aria-label="View profile"
              data-testid="profile-trigger"
            >
              <Text as="span" size="sm" tone="textMuted" className={styles.user}>{user.name}</Text>
            </Link>
          )}
          <ThemeToggle />
          <Button variant="secondary" size="sm" onClick={onSignOut} data-testid="sign-out">
            Sign out
          </Button>
        </div>
      </header>
      <main className={[styles.main, isDocDesk && styles.mainDocDesk].filter(Boolean).join(' ')}>
        <Outlet />
      </main>
    </div>
  )
}
