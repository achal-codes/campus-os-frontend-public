import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '@/core/auth'
import { Alert, Button, Spinner, Text, TextField } from '@/ui'
import { listNotices } from '../api/notices'
import type { Notice } from '../types'
import styles from './NoticeBoardScreen.module.css'

export function NoticeBoardScreen() {
  const { user } = useAuth()
  const canPublish = user?.role === 'admin' || user?.role === 'faculty' || user?.role === 'office_staff'

  const [notices, setNotices] = useState<Notice[]>([])
  const [pinnedNotices, setPinnedNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<'all' | 'mine' | 'scheduled' | 'archived'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    let active = true
    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        const filters: Parameters<typeof listNotices>[0] = { limit: 50 }
        if (activeTab === 'archived') {
          filters.status = 'archived'
        } else if (activeTab === 'scheduled') {
          filters.status = 'scheduled'
        } else if (activeTab === 'mine') {
          filters.mine = true
        } else {
          filters.status = 'active'
        }

        const [mainRes, pinnedRes] = await Promise.allSettled([
          listNotices(filters),
          listNotices({ pinned: true, status: 'active', limit: 10 }),
        ])

        if (active) {
          if (mainRes.status === 'fulfilled') {
            setNotices(mainRes.value.items)
          } else {
            setError(mainRes.reason instanceof Error ? mainRes.reason.message : 'Failed to load notices')
          }

          if (pinnedRes.status === 'fulfilled') {
            setPinnedNotices(pinnedRes.value.items)
          }
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load notices')
      } finally {
        if (active) setLoading(false)
      }
    }
    loadData()
    return () => {
      active = false
    }
  }, [activeTab])

  const filteredNotices = notices.filter((n) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q) || (n.publisher_name ?? '').toLowerCase().includes(q)
  })

  function formatDate(iso: string) {
    try {
      return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(iso))
    } catch {
      return iso
    }
  }

  return (
    <div className={styles.container} data-testid="noticehub-board-screen">
      {/* Header */}
      <div className={styles.headerRow}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>Notice Hub</h1>
          <p className={styles.subtitle}>Official campus announcements, notices, and doubt inquiries.</p>
        </div>

        {canPublish && (
          <Link to="/tracks/noticehub/compose" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="md" data-testid="compose-notice-button">
              + Post Notice
            </Button>
          </Link>
        )}
      </div>

      {error && <Alert tone="danger">{error}</Alert>}

      {/* Pinned Notices Banner (§8: "Banner of pinned notices at the top") */}
      {pinnedNotices.length > 0 && activeTab === 'all' && (
        <div className={styles.pinnedBanner} data-testid="pinned-notices-banner">
          <div className={styles.pinnedHeader}>
            <span>Pinned Campus Notices</span>
          </div>
          <div className={styles.pinnedGrid}>
            {pinnedNotices.map((pn) => (
              <Link key={pn.notice_id} to={`/tracks/noticehub/${pn.notice_id}`} className={styles.pinnedCard}>
                <Text size="sm" weight="bold" style={{ color: '#0f172a' }}>
                  {pn.title}
                </Text>
                <Text size="xs" tone="textMuted">
                  Posted by {pn.publisher_name ?? pn.publisher} · {formatDate(pn.created_at)}
                </Text>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabsRow}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'all' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Notices
        </button>

        {canPublish && (
          <>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'mine' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('mine')}
            >
              My Notices
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'scheduled' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('scheduled')}
            >
              Scheduled
            </button>
          </>
        )}

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'archived' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('archived')}
        >
          Archived
        </button>
      </div>

      {/* Search Input */}
      <div style={{ maxWidth: 400 }}>
        <TextField
          label="Search notices"
          placeholder="Filter by title, keywords or publisher..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spinner label="Loading campus notices..." />
        </div>
      ) : filteredNotices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <Text size="md" weight="medium">No notices found</Text>
          <Text size="sm" tone="textMuted" style={{ marginTop: 6 }}>
            {activeTab === 'mine'
              ? 'You have not published any notices yet.'
              : activeTab === 'scheduled'
              ? 'No notices currently scheduled for future release.'
              : activeTab === 'archived'
              ? 'No archived notices in the record.'
              : 'There are currently no active announcements published on campus.'}
          </Text>
        </div>
      ) : (
        <div className={styles.noticesList}>
          {filteredNotices.map((notice) => (
            <Link
              key={notice.notice_id}
              to={`/tracks/noticehub/${notice.notice_id}`}
              className={styles.noticeItem}
              data-testid={`notice-item-${notice.notice_id}`}
            >
              <div className={styles.noticeItemHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h2 className={styles.noticeTitle}>{notice.title}</h2>
                  {notice.pinned && (
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#fdf4ff', color: '#9333ea', border: '1px solid #f0abfc' }}>
                      Pinned
                    </span>
                  )}
                  {notice.status === 'scheduled' && (
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: '#fef3c7', color: '#b45309' }}>
                      Scheduled: {formatDate(notice.publish_at ?? notice.created_at)}
                    </span>
                  )}
                  {notice.status === 'archived' && (
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: '#f1f5f9', color: '#64748b' }}>
                      Archived
                    </span>
                  )}
                </div>

                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  {formatDate(notice.created_at)}
                </span>
              </div>

              <p className={styles.noticeSnippet}>{notice.body}</p>

              <div className={styles.noticeFooter}>
                <span>
                  By <strong>{notice.publisher_name ?? notice.publisher}</strong>
                  {notice.publisher_role ? ` (${notice.publisher_role})` : ''}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {notice.attachment && (
                    <span style={{ color: '#4338ca', fontWeight: 500 }}>
                      Attachment: {notice.attachment.filename}
                    </span>
                  )}
                  <span>
                    Doubts thread →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
