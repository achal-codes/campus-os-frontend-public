import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useAuth } from '@/core/auth'
import { Alert, Button, Spinner, Stack, Text } from '@/ui'
import {
  askDoubt,
  deleteDoubt,
  deleteNotice,
  downloadNoticeAttachment,
  editDoubt,
  editDoubtResponse,
  getNotice,
  listDoubts,
  respondDoubt,
} from '../api/notices'
import type { Doubt, Notice } from '../types'
import styles from './NoticeDetailScreen.module.css'

export function NoticeDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [notice, setNotice] = useState<Notice | null>(null)
  const [doubts, setDoubts] = useState<Doubt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  // Doubt submission state
  const [questionText, setQuestionText] = useState('')
  const [submittingDoubt, setSubmittingDoubt] = useState(false)
  const [doubtError, setDoubtError] = useState<string | null>(null)

  // Responding to doubt state (doubtId -> draft string)
  const [activeRespondDoubtId, setActiveRespondDoubtId] = useState<string | null>(null)
  const [responseText, setResponseText] = useState('')
  const [respondingDoubt, setRespondingDoubt] = useState(false)

  // Editing doubt state
  const [editingDoubtId, setEditingDoubtId] = useState<string | null>(null)
  const [editQuestionText, setEditQuestionText] = useState('')

  // Attachment downloading state
  const [downloading, setDownloading] = useState(false)

  const isPublisherOrAdmin =
    Boolean(notice && user && (user.role === 'admin' || user.id === notice.publisher))
  const canRespond =
    Boolean(user && (user.role === 'admin' || user.role === 'faculty' || user.role === 'office_staff'))

  useEffect(() => {
    if (!id) return
    let active = true

    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        const [noticeData, doubtsData] = await Promise.all([
          getNotice(id!),
          listDoubts(id!),
        ])
        if (active) {
          setNotice(noticeData)
          setDoubts(doubtsData.items)
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load notice details.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadData()
    return () => {
      active = false
    }
  }, [id])

  async function handleDownloadAttachment() {
    if (!id || !notice?.attachment) return
    setDownloading(true)
    try {
      await downloadNoticeAttachment(id, notice.attachment.filename)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed.')
    } finally {
      setDownloading(false)
    }
  }

  async function handleAskDoubt(e: React.FormEvent) {
    e.preventDefault()
    if (!id) return
    const q = questionText.trim()
    if (q.length < 5 || q.length > 500) {
      setDoubtError('Doubt question must be between 5 and 500 characters.')
      return
    }

    setSubmittingDoubt(true)
    setDoubtError(null)
    try {
      const newDoubt = await askDoubt(id, q)
      setDoubts((prev) => [newDoubt, ...prev])
      setQuestionText('')
      setFeedback('Your doubt inquiry has been posted to the notice thread.')
    } catch (err) {
      setDoubtError(err instanceof Error ? err.message : 'Failed to post doubt.')
    } finally {
      setSubmittingDoubt(false)
    }
  }

  async function handleSaveResponse(doubtId: string, isEdit: boolean) {
    const text = responseText.trim()
    if (text.length < 1 || text.length > 1000) {
      setError('Response must be between 1 and 1000 characters.')
      return
    }

    setRespondingDoubt(true)
    setError(null)
    try {
      const updated = isEdit
        ? await editDoubtResponse(doubtId, text)
        : await respondDoubt(doubtId, text)
      setDoubts((prev) => prev.map((d) => (d.doubt_id === doubtId ? updated : d)))
      setActiveRespondDoubtId(null)
      setResponseText('')
      setFeedback('Response published successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save response.')
    } finally {
      setRespondingDoubt(false)
    }
  }

  async function handleSaveEditDoubt(doubtId: string) {
    const text = editQuestionText.trim()
    if (text.length < 5 || text.length > 500) {
      setError('Doubt question must be between 5 and 500 characters.')
      return
    }

    try {
      const updated = await editDoubt(doubtId, text)
      setDoubts((prev) => prev.map((d) => (d.doubt_id === doubtId ? updated : d)))
      setEditingDoubtId(null)
      setEditQuestionText('')
      setFeedback('Doubt updated successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update doubt.')
    }
  }

  async function handleDeleteDoubtItem(doubtId: string) {
    if (!window.confirm('Are you sure you want to delete this doubt?')) return
    try {
      await deleteDoubt(doubtId)
      setDoubts((prev) => prev.filter((d) => d.doubt_id !== doubtId))
      setFeedback('Doubt deleted.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete doubt.')
    }
  }

  async function handleDeleteNotice() {
    if (!id || !window.confirm('Are you sure you want to delete this entire campus notice? This action cannot be undone.')) {
      return
    }

    try {
      await deleteNotice(id)
      navigate('/tracks/noticehub')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete notice.')
    }
  }

  function formatDate(iso: string) {
    try {
      return new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(iso))
    } catch {
      return iso
    }
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <Spinner label="Loading notice..." />
      </div>
    )
  }

  if (!notice) {
    return (
      <div className={styles.container}>
        <Alert tone="danger">{error ?? 'Notice not found.'}</Alert>
        <Link to="/tracks/noticehub" className={styles.backLink}>
          ← Back to Notice Hub
        </Link>
      </div>
    )
  }

  return (
    <div className={styles.container} data-testid="notice-detail-screen">
      <Link to="/tracks/noticehub" className={styles.backLink}>
        ← Back to All Notices
      </Link>

      {feedback && <Alert tone="success">{feedback}</Alert>}
      {error && <Alert tone="danger">{error}</Alert>}

      {/* Main Notice Card */}
      <article className={styles.noticeCard} data-testid="notice-article">
        <div className={styles.noticeMeta}>
          <div className={styles.badgeRow}>
            {notice.pinned && <span className={styles.pinnedBadge}>📌 Pinned Notice</span>}
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: 4,
                background:
                  notice.status === 'active'
                    ? '#dcfce7'
                    : notice.status === 'scheduled'
                    ? '#fef3c7'
                    : '#f1f5f9',
                color:
                  notice.status === 'active'
                    ? '#15803d'
                    : notice.status === 'scheduled'
                    ? '#b45309'
                    : '#64748b',
              }}
            >
              Status: {notice.status.toUpperCase()}
            </span>
          </div>

          {isPublisherOrAdmin && (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteNotice}
                data-testid="delete-notice-button"
              >
                Delete Notice
              </Button>
            </div>
          )}
        </div>

        <h1 className={styles.noticeTitle}>{notice.title}</h1>

        <div className={styles.authorRow}>
          <span>Published by</span>
          <span className={styles.authorHighlight}>{notice.publisher_name ?? notice.publisher}</span>
          {notice.publisher_role && <span>({notice.publisher_role})</span>}
          <span>·</span>
          <span>{formatDate(notice.created_at)}</span>
          {notice.publish_at && notice.status === 'scheduled' && (
            <span>(Scheduled to activate: {formatDate(notice.publish_at)})</span>
          )}
        </div>

        <div className={styles.noticeBody}>{notice.body}</div>

        {/* Attachment box */}
        {notice.attachment && (
          <div className={styles.attachmentBox} data-testid="notice-attachment-box">
            <div className={styles.attachmentInfo}>
              <span className={styles.attachmentName}>📎 {notice.attachment.filename}</span>
              <span className={styles.attachmentSize}>
                {formatBytes(notice.attachment.size_bytes)} · {notice.attachment.content_type}
              </span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              loading={downloading}
              onClick={handleDownloadAttachment}
              data-testid="download-attachment-button"
            >
              Download File
            </Button>
          </div>
        )}
      </article>

      {/* Doubts Thread Section */}
      <section className={styles.doubtsSection} data-testid="doubts-section">
        <div className={styles.doubtsHeader}>
          <div>
            <h2 className={styles.doubtsTitle}>Inquiries & Doubts Thread ({doubts.length})</h2>
            <Text size="xs" tone="textMuted">
              Ask questions regarding this notice or view official answers published by faculty/staff.
            </Text>
          </div>
        </div>

        {/* Ask Doubt Form */}
        <form onSubmit={handleAskDoubt} className={styles.askDoubtForm} data-testid="ask-doubt-form">
          <Text size="sm" weight="bold">
            Have a question about this notice?
          </Text>
          {doubtError && <Alert tone="danger">{doubtError}</Alert>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label htmlFor="doubt-question" style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
              Your Doubt / Question (5–500 characters)*
            </label>
            <textarea
              id="doubt-question"
              className={styles.textarea}
              placeholder="Type your inquiry here clearly..."
              value={questionText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setQuestionText(e.target.value)}
              rows={3}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submittingDoubt}
              disabled={questionText.trim().length < 5 || questionText.trim().length > 500}
              data-testid="submit-doubt-button"
            >
              Submit Doubt
            </Button>
          </div>
        </form>

        {/* List of Doubts */}
        {doubts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', background: '#f8fafc', borderRadius: 6 }}>
            <Text size="sm" tone="textMuted">
              No doubts have been raised for this notice yet. Be the first to ask!
            </Text>
          </div>
        ) : (
          <Stack gap={4}>
            {doubts.map((d) => {
              const isDoubtAuthor = user && user.id === d.asked_by
              const canDeleteDoubt = isDoubtAuthor || user?.role === 'admin'
              const isEditing = editingDoubtId === d.doubt_id
              const isResponding = activeRespondDoubtId === d.doubt_id

              return (
                <div key={d.doubt_id} className={styles.doubtItem} data-testid={`doubt-item-${d.doubt_id}`}>
                  <div className={styles.doubtQuestionRow}>
                    <div className={styles.doubtHeader}>
                      <span>
                        Asked by <strong>{d.asked_by_name ?? d.asked_by}</strong> · {formatDate(d.asked_at)}
                      </span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {isDoubtAuthor && !isEditing && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingDoubtId(d.doubt_id)
                              setEditQuestionText(d.question)
                            }}
                          >
                            Edit
                          </Button>
                        )}
                        {canDeleteDoubt && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDoubtItem(d.doubt_id)}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
                        <textarea
                          className={styles.textarea}
                          value={editQuestionText}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditQuestionText(e.target.value)}
                          rows={2}
                        />
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setEditingDoubtId(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleSaveEditDoubt(d.doubt_id)}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className={styles.doubtQuestionText}>Q: {d.question}</p>
                    )}
                  </div>

                  {/* Official Response */}
                  {d.response ? (
                    <div className={styles.doubtAnswerBox} data-testid={`doubt-response-${d.doubt_id}`}>
                      <div className={styles.doubtAnswerHeader}>
                        <span>
                          Official Response from {d.answered_by_name ?? d.answered_by ?? 'Staff'}
                          {d.answered_at ? ` · ${formatDate(d.answered_at)}` : ''}
                        </span>
                        {canRespond && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setActiveRespondDoubtId(d.doubt_id)
                              setResponseText(d.response ?? '')
                            }}
                          >
                            Edit Response
                          </Button>
                        )}
                      </div>
                      <p className={styles.doubtAnswerText}>{d.response}</p>
                    </div>
                  ) : (
                    <div>
                      {canRespond && !isResponding && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setActiveRespondDoubtId(d.doubt_id)
                            setResponseText('')
                          }}
                          data-testid={`respond-doubt-button-${d.doubt_id}`}
                        >
                          Respond to this Doubt
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Responding form */}
                  {isResponding && (
                    <div className={styles.responseForm}>
                      <textarea
                        className={styles.textarea}
                        placeholder="Provide clear guidance or answer for the student..."
                        value={responseText}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResponseText(e.target.value)}
                        rows={3}
                      />
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setActiveRespondDoubtId(null)
                            setResponseText('')
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          loading={respondingDoubt}
                          disabled={!responseText.trim()}
                          onClick={() => handleSaveResponse(d.doubt_id, Boolean(d.response))}
                        >
                          Publish Response
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </Stack>
        )}
      </section>
    </div>
  )
}
