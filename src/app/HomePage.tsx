import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '@/core/auth'
import { tracks } from '@/core/tracks/registry'
import { listRequests } from '@/tracks/docdesk/api/requests'
import type { DocRequest } from '@/tracks/docdesk/types'
import { listNotices } from '@/tracks/noticehub/api/notices'
import type { Notice } from '@/tracks/noticehub/types'
import { Card, Spinner, Stack, Text } from '@/ui'
import styles from './HomePage.module.css'

export function HomePage() {
  const { user } = useAuth()
  const role = user?.role ?? 'student'

  const [recentNotices, setRecentNotices] = useState<Notice[]>([])
  const [recentRequests, setRecentRequests] = useState<DocRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadPortalData() {
      setLoading(true)
      try {
        const promises: [Promise<any>, Promise<any>?] = [
          listNotices({ limit: 4, status: 'active' }).catch(() => ({ items: [] })),
        ]

        if (role === 'student') {
          promises.push(listRequests({ mine: true, limit: 4 }).catch(() => ({ items: [] })))
        } else if (role === 'office_staff') {
          promises.push(listRequests({ limit: 4 }).catch(() => ({ items: [] })))
        } else if (role === 'admin') {
          promises.push(listRequests({ limit: 4 }).catch(() => ({ items: [] })))
        }

        const [noticesRes, requestsRes] = await Promise.all(promises)
        if (active) {
          if (noticesRes?.items) setRecentNotices(noticesRes.items)
          if (requestsRes?.items) setRecentRequests(requestsRes.items)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadPortalData()
    return () => {
      active = false
    }
  }, [role])

  function formatDate(iso: string) {
    try {
      return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
      }).format(new Date(iso))
    } catch {
      return iso
    }
  }

  function getStatusClass(status: string) {
    if (status === 'pending') return styles.statusPending
    if (status === 'answered') return styles.statusAnswered
    return styles.statusAcknowledged
  }

  return (
    <div className={styles.portalContainer} data-testid="campus-os-home">
      {/* Welcome & Role Banner */}
      <section className={styles.welcomeCard}>
        <div className={styles.welcomeInfo}>
          <span className={styles.roleBadge}>
            {role === 'office_staff' ? 'Office Staff / Student Affairs' : `${role} Portal`}
          </span>
          <h1 className={styles.userName}>
            Welcome back, {user?.name ?? 'Campus Member'} 👋
          </h1>
          <p className={styles.welcomeSubtext}>
            {role === 'student' && 'Request institutional certificates, apply for scholarships, and track campus notices.'}
            {role === 'faculty' && 'Publish campus announcements, resolve student academic doubts, and stay informed.'}
            {role === 'office_staff' && 'Process student document requests, set turnaround times, and manage campus notices.'}
            {role === 'admin' && 'Oversee campus operations, manage accounts, audit requests, and publish official notices.'}
          </p>
        </div>

        {/* Quick Actions */}
        <div className={styles.quickActions}>
          {role === 'student' && (
            <>
              <Link to="/tracks/docdesk/new" className={`${styles.actionButton} ${styles.actionPrimary}`}>
                + Request Document
              </Link>
              <Link to="/tracks/docdesk/scholarship" className={`${styles.actionButton} ${styles.actionSecondary}`}>
                🎓 Scholarship
              </Link>
              <Link to="/tracks/noticehub" className={`${styles.actionButton} ${styles.actionSecondary}`}>
                📢 Notice Board
              </Link>
            </>
          )}

          {role === 'faculty' && (
            <>
              <Link to="/tracks/noticehub/compose" className={`${styles.actionButton} ${styles.actionPrimary}`}>
                + Post Notice
              </Link>
              <Link to="/tracks/noticehub" className={`${styles.actionButton} ${styles.actionSecondary}`}>
                📢 Campus Notice Board
              </Link>
            </>
          )}

          {role === 'office_staff' && (
            <>
              <Link to="/tracks/docdesk/staff" className={`${styles.actionButton} ${styles.actionPrimary}`}>
                📂 Student Affairs Queue
              </Link>
              <Link to="/tracks/docdesk/staff/bulk-tat" className={`${styles.actionButton} ${styles.actionSecondary}`}>
                ⏱ Bulk TAT
              </Link>
              <Link to="/tracks/noticehub/compose" className={`${styles.actionButton} ${styles.actionSecondary}`}>
                📢 Post Notice
              </Link>
            </>
          )}

          {role === 'admin' && (
            <>
              <Link to="/admin" className={`${styles.actionButton} ${styles.actionPrimary}`}>
                👥 Manage Users
              </Link>
              <Link to="/tracks/docdesk/admin" className={`${styles.actionButton} ${styles.actionSecondary}`}>
                🔍 DocDesk Audit
              </Link>
              <Link to="/tracks/noticehub/compose" className={`${styles.actionButton} ${styles.actionSecondary}`}>
                📢 Post Notice
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Role Dashboard Grid */}
      <div className={styles.dashboardGrid}>
        {/* Left Card: Role Specific Data */}
        {role === 'student' && (
          <div className={styles.sectionCard} data-testid="student-requests-card">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>My Document Requests</h2>
              <Link to="/tracks/docdesk/my-requests" className={styles.viewAllLink}>
                View All →
              </Link>
            </div>

            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <Spinner label="Loading requests..." />
              </div>
            ) : recentRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', background: '#f8fafc', borderRadius: 6 }}>
                <Text size="sm" tone="textMuted">You have not submitted any document requests yet.</Text>
                <div style={{ marginTop: 12 }}>
                  <Link to="/tracks/docdesk/catalogue" className={styles.viewAllLink}>
                    Browse Document Catalog
                  </Link>
                </div>
              </div>
            ) : (
              <div className={styles.itemsList}>
                {recentRequests.map((req) => (
                  <Link
                    key={req.request_id}
                    to={`/tracks/docdesk/requests/${req.request_id}`}
                    className={styles.itemRow}
                  >
                    <div className={styles.itemMain}>
                      <span className={styles.itemTitle}>{req.doc_type_name ?? 'Document Request'}</span>
                      <span className={styles.itemMeta}>Submitted on {formatDate(req.created_at)}</span>
                    </div>
                    <span className={`${styles.statusPill} ${getStatusClass(req.status)}`}>
                      {req.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {(role === 'office_staff' || role === 'admin') && (
          <div className={styles.sectionCard} data-testid="staff-queue-card">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                {role === 'admin' ? 'Recent Campus Requests (Audit)' : 'Student Affairs Processing Queue'}
              </h2>
              <Link
                to={role === 'admin' ? '/tracks/docdesk/admin' : '/tracks/docdesk/staff'}
                className={styles.viewAllLink}
              >
                View Full Queue →
              </Link>
            </div>

            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <Spinner label="Loading queue..." />
              </div>
            ) : recentRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', background: '#f8fafc', borderRadius: 6 }}>
                <Text size="sm" tone="textMuted">No pending or answered requests found.</Text>
              </div>
            ) : (
              <div className={styles.itemsList}>
                {recentRequests.map((req) => (
                  <Link
                    key={req.request_id}
                    to={
                      role === 'admin'
                        ? `/tracks/docdesk/admin/requests/${req.request_id}`
                        : `/tracks/docdesk/staff/requests/${req.request_id}`
                    }
                    className={styles.itemRow}
                  >
                    <div className={styles.itemMain}>
                      <span className={styles.itemTitle}>{req.doc_type_name ?? 'Document Request'}</span>
                      <span className={styles.itemMeta}>
                        From {req.requested_by_name ?? req.requested_by} · {formatDate(req.created_at)}
                      </span>
                    </div>
                    <span className={`${styles.statusPill} ${getStatusClass(req.status)}`}>
                      {req.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {role === 'faculty' && (
          <div className={styles.sectionCard} data-testid="faculty-guidance-card">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Faculty Workspace</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: 1.5 }}>
                As a faculty member, you can publish campus notices, inform students about academic announcements, and answer doubts posted on notices.
              </p>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <Text size="xs" tone="textMuted">
                  Note: Official institutional certificate requesting (bonafide, transcript, migration, etc.) is reserved strictly for students.
                </Text>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <Link to="/tracks/noticehub/compose" className={styles.viewAllLink}>
                  + Create New Announcement →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Right Card: Campus Announcements */}
        <div className={styles.sectionCard} data-testid="recent-notices-card">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Latest Campus Notices</h2>
            <Link to="/tracks/noticehub" className={styles.viewAllLink}>
              Notice Board →
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <Spinner label="Loading announcements..." />
            </div>
          ) : recentNotices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', background: '#f8fafc', borderRadius: 6 }}>
              <Text size="sm" tone="textMuted">No announcements published yet.</Text>
            </div>
          ) : (
            <div className={styles.itemsList}>
              {recentNotices.map((n) => (
                <Link
                  key={n.notice_id}
                  to={`/tracks/noticehub/${n.notice_id}`}
                  className={styles.itemRow}
                >
                  <div className={styles.itemMain}>
                    <span className={styles.itemTitle}>{n.title}</span>
                    <span className={styles.itemMeta}>
                      {n.publisher_name ?? n.publisher} · {formatDate(n.created_at)}
                    </span>
                  </div>
                  {n.pinned && (
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#fdf4ff', color: '#9333ea', border: '1px solid #f0abfc' }}>
                      PINNED
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* System Modules / Tracks Grid */}
      <section className={styles.tracksSection} aria-label="Campus Modules">
        <h2 className={styles.tracksHeading}>All Campus OS Modules</h2>

        {tracks.length === 0 ? (
          <Card>
            <Text tone="textMuted">
              No tracks configured.
            </Text>
          </Card>
        ) : (
          <ul className={styles.grid} aria-label="Tracks">
            {tracks.map((track) => (
              <li key={track.id}>
                <Link to={`/tracks/${track.id}`} className={styles.link} data-testid={`track-card-${track.id}`}>
                  <Card interactive className={styles.card}>
                    <Stack gap={2}>
                      {track.icon && <span className={styles.icon} aria-hidden="true">{track.icon}</span>}
                      <Text as="h3" size="lg" weight="bold">{track.title}</Text>
                      <Text size="sm" tone="textMuted">{track.description}</Text>
                      {track.team && <Text size="xs" tone="primary">{track.team}</Text>}
                    </Stack>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
