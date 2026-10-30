import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '@/core/auth'
import { Alert, Button, TextField } from '@/ui'
import { createNotice } from '../api/notices'
import styles from './ComposeNoticeScreen.module.css'

export function ComposeNoticeScreen() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [pinned, setPinned] = useState(false)
  const [publishAt, setPublishAt] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Guard: Admin, Faculty, Office Staff only
  const canPublish = user?.role === 'admin' || user?.role === 'faculty' || user?.role === 'office_staff'
  if (!canPublish) {
    return (
      <div className={styles.container}>
        <Alert tone="info">
          <strong>Access Restricted</strong>: Publishing campus notices is restricted to faculty, office staff, and administrators. Students may view notices and submit doubts on the Notice Board.
        </Alert>
        <Link to="/tracks/noticehub" className={styles.backLink}>
          ← Return to Notice Hub
        </Link>
      </div>
    )
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) {
      setFile(null)
      return
    }

    if (selected.size > 10 * 1024 * 1024) {
      setError('Attachment file size cannot exceed 10 MB.')
      e.target.value = ''
      setFile(null)
      return
    }

    setError(null)
    setFile(selected)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedTitle = title.trim()
    const trimmedBody = body.trim()

    if (trimmedTitle.length < 3 || trimmedTitle.length > 120) {
      setError('Notice title must be between 3 and 120 characters.')
      return
    }

    if (trimmedBody.length < 10 || trimmedBody.length > 5000) {
      setError('Notice content body must be between 10 and 5000 characters.')
      return
    }

    if (publishAt) {
      const scheduledDate = new Date(publishAt)
      if (isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now()) {
        setError('Scheduled publish date/time must be in the future.')
        return
      }
    }

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('title', trimmedTitle)
      formData.append('body', trimmedBody)
      formData.append('pinned', String(pinned))

      if (publishAt) {
        formData.append('publish_at', new Date(publishAt).toISOString())
      }

      if (file) {
        formData.append('attachment', file)
      }

      const created = await createNotice(formData)
      navigate(`/tracks/noticehub/${created.notice_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish notice.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container} data-testid="compose-notice-screen">
      <Link to="/tracks/noticehub" className={styles.backLink}>
        ← Back to Notice Hub
      </Link>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h1 className={styles.title}>Post a Campus Notice</h1>
          <p className={styles.subtitle}>
            Publish an official announcement to the student body and campus community.
          </p>
        </div>

        {error && <Alert tone="danger">{error}</Alert>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <TextField
              label="Notice Title (3–120 characters)"
              placeholder="e.g. End Semester Examination Schedule Announcement"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              data-testid="notice-title-input"
            />
            <span className={styles.charCount}>{title.length} / 120</span>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="notice-body" className={styles.label}>
              Notice Content (10–5000 characters)*
            </label>
            <textarea
              id="notice-body"
              className={styles.textarea}
              placeholder="Provide complete details, deadlines, criteria, instructions..."
              value={body}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBody(e.target.value)}
              rows={8}
              required
              data-testid="notice-body-input"
            />
            <span className={styles.charCount}>{body.length} / 5000</span>
          </div>

          {/* Pinned Checkbox */}
          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              className={styles.checkboxInput}
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              data-testid="notice-pinned-checkbox"
            />
            <div>
              <span className={styles.label}>Pin this notice to the top</span>
              <p className={styles.helpText} style={{ margin: 0 }}>
                Pinned notices appear prominently in the banner at the top of the Notice Hub board.
              </p>
            </div>
          </label>

          {/* Schedule Publishing (Optional) */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Schedule Publishing (Optional)</label>
            <input
              type="datetime-local"
              className={styles.fileInput}
              value={publishAt}
              onChange={(e) => setPublishAt(e.target.value)}
              data-testid="notice-publish-at-input"
            />
            <span className={styles.helpText}>
              Leave blank to publish immediately as ACTIVE. If set to a future date/time, the notice remains SCHEDULED until then.
            </span>
          </div>

          {/* Attachment (Optional) */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Document Attachment (Optional, max 10 MB)</label>
            <input
              type="file"
              className={styles.fileInput}
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              data-testid="notice-attachment-input"
            />
            <span className={styles.helpText}>
              Supported formats: PDF, JPEG, PNG. Maximum file size: 10 MB.
            </span>
          </div>

          <div className={styles.buttonRow}>
            <Link to="/tracks/noticehub" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" size="md">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              data-testid="publish-notice-button"
            >
              Publish Notice
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
