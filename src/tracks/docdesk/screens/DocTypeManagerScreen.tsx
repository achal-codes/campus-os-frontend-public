import { useEffect, useState, type FormEvent } from 'react'
import { Alert, Button, SelectField, Spinner, Stack, Text, TextField } from '@/ui'
import {
  createDocType,
  deleteDocType,
  editDocType,
  listDocTypes,
} from '../api/docTypes'
import { DocDeskLayout } from '../components/DocDeskLayout'
import glass from '../theme/glass.module.css'
import type { DocType } from '../types'
import styles from './DocTypeManagerScreen.module.css'

export function DocTypeManagerScreen() {
  const [types, setTypes] = useState<DocType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [editingDocType, setEditingDocType] = useState<DocType | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'active' | 'archived'>('active')
  const [submitting, setSubmitting] = useState(false)

  // Tabs state: 'active' | 'archived'
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active')

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const res = await listDocTypes()
      setTypes(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document types')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    async function init() {
      try {
        const res = await listDocTypes()
        if (active) setTypes(res.items)
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load document types')
      } finally {
        if (active) setLoading(false)
      }
    }
    init()
    return () => {
      active = false
    }
  }, [])

  const isDirty = editingDocType
    ? name !== editingDocType.name || description !== (editingDocType.description ?? '')
    : name.trim().length > 0 || description.trim().length > 0

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty && !submitting) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty, submitting])

  function resetForm() {
    if (isDirty && typeof window.confirm === 'function') {
      try {
        if (!window.confirm('You have unsaved changes in the form. Discard?')) {
          return
        }
      } catch {
        // Ignore if confirm not implemented in environment
      }
    }
    setEditingDocType(null)
    setName('')
    setDescription('')
    setStatus('active')
  }

  function startEdit(dt: DocType) {
    setEditingDocType(dt)
    setName(dt.name)
    setDescription(dt.description ?? '')
    setStatus(dt.status)
    setError(null)
    setSuccess(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmedName = name.trim()
    if (trimmedName.length < 3 || trimmedName.length > 80) {
      setError('Document type name must be between 3 and 80 characters.')
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      if (editingDocType) {
        await editDocType(editingDocType.doc_type_id, {
          name: trimmedName,
          description: description.trim() || undefined,
          status,
        })
        setSuccess(`Document type "${trimmedName}" updated successfully.`)
      } else {
        await createDocType({
          name: trimmedName,
          description: description.trim() || undefined,
        })
        setSuccess(`Document type "${trimmedName}" created successfully.`)
      }
      resetForm()
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save document type')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleArchive(dt: DocType) {
    setError(null)
    try {
      await editDocType(dt.doc_type_id, { status: 'archived' })
      setSuccess(`"${dt.name}" has been archived.`)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive document type')
    }
  }

  async function handleActivate(dt: DocType) {
    setError(null)
    try {
      await editDocType(dt.doc_type_id, { status: 'active' })
      setSuccess(`"${dt.name}" has been activated.`)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate document type')
    }
  }

  async function handleDelete(dt: DocType) {
    if (!window.confirm(`Are you sure you want to permanently delete "${dt.name}"? Archiving is recommended over deletion if historical requests exist.`)) {
      return
    }

    setError(null)
    try {
      await deleteDocType(dt.doc_type_id)
      setSuccess(`"${dt.name}" deleted.`)
      if (editingDocType?.doc_type_id === dt.doc_type_id) {
        resetForm()
      }
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document type')
    }
  }

  const activeTypes = types.filter((t) => t.status === 'active')
  const archivedTypes = types.filter((t) => t.status === 'archived')
  const displayedTypes = activeTab === 'active' ? activeTypes : archivedTypes

  return (
    <DocDeskLayout activeItem="doc-types">
      <div className={styles.container} data-testid="docdesk-doctype-manager-screen">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <Stack gap={1}>
            <Text as="h1" size="2xl" weight="bold">
              Document types
            </Text>
            <Text tone="textMuted">
              Manage the types of documents students and faculty can request.
            </Text>
          </Stack>

          <Button
            variant="primary"
            size="md"
            onClick={resetForm}
            data-testid="add-type-button"
          >
            + Add Type
          </Button>
        </div>

        {error && <Alert tone="danger">{error}</Alert>}
        {success && <Alert tone="success">{success}</Alert>}

        <div className={styles.twoColumnGrid}>
          {/* Panel A: ADD / EDIT DOCUMENT TYPE */}
          <div className={`${glass.panel} ${glass.tintBlue}`}>
            <form onSubmit={handleSubmit} noValidate>
              <Stack gap={4}>
                <Text as="h2" size="sm" weight="bold" tone="accent" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ADD / EDIT DOCUMENT TYPE
                </Text>

                <Stack gap={1}>
                  <TextField
                    label="Name *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Bonafide Certificate"
                    required
                    data-testid="doctype-name-input"
                  />
                  <Text size="xs" tone="textMuted">
                    3-80 characters, must be unique
                  </Text>
                </Stack>

                <TextField
                  label="Description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Official verification of student enrollment"
                  data-testid="doctype-desc-input"
                />

                {editingDocType && (
                  <SelectField
                    label="Status (edit only)"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'active' | 'archived')}
                    options={[
                      { value: 'active', label: 'Active' },
                      { value: 'archived', label: 'Archived' },
                    ]}
                    data-testid="doctype-status-select"
                  />
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                  {editingDocType && (
                    <Button type="button" variant="secondary" onClick={resetForm}>
                      Cancel
                    </Button>
                  )}
                  <Button type="submit" loading={submitting} data-testid="create-doctype-button">
                    Save Type
                  </Button>
                </div>
              </Stack>
            </form>
          </div>

          {/* Panel B: EXISTING DOCUMENT TYPES */}
          <div className={`${glass.panel} ${glass.tintBlue}`}>
            <Stack gap={3}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text as="h2" size="sm" weight="bold" tone="accent" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  EXISTING DOCUMENT TYPES
                </Text>
                <Button variant="secondary" size="sm" onClick={loadData}>
                  ↻ Refresh
                </Button>
              </div>

              {/* Segmented Control / Tabs */}
              <div className={styles.tabsRow}>
                <button
                  type="button"
                  className={`${styles.tabBtn} ${activeTab === 'active' ? styles.tabBtnActive : ''}`}
                  onClick={() => setActiveTab('active')}
                >
                  Active ({activeTypes.length})
                </button>
                <button
                  type="button"
                  className={`${styles.tabBtn} ${activeTab === 'archived' ? styles.tabBtnActive : ''}`}
                  onClick={() => setActiveTab('archived')}
                >
                  Archived ({archivedTypes.length})
                </button>
              </div>

              {loading ? (
                <div style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
                  <Spinner label="Loading document types..." />
                </div>
              ) : displayedTypes.length === 0 ? (
                <Text size="sm" tone="textMuted">
                  No {activeTab} document types found.
                </Text>
              ) : (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedTypes.map((dt) => (
                        <tr key={dt.doc_type_id} data-testid={`doctype-row-${dt.doc_type_id}`}>
                          <td>
                            <Text size="sm" weight="medium">{dt.name}</Text>
                          </td>
                          <td>
                            <Text size="xs" tone="textMuted">{dt.description || '—'}</Text>
                          </td>
                          <td>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                background: dt.status === 'active' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(156, 163, 175, 0.15)',
                                color: dt.status === 'active' ? '#22c55e' : '#9ca3af',
                              }}
                            >
                              {dt.status === 'active' ? 'Active' : 'Archived'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                              <Button size="sm" variant="secondary" onClick={() => startEdit(dt)} data-testid={`edit-dt-${dt.doc_type_id}`}>
                                Edit
                              </Button>
                              {dt.status === 'active' ? (
                                <Button size="sm" variant="secondary" onClick={() => handleArchive(dt)}>
                                  Archive
                                </Button>
                              ) : (
                                <Button size="sm" variant="secondary" onClick={() => handleActivate(dt)}>
                                  Activate
                                </Button>
                              )}
                              <Button size="sm" variant="danger" onClick={() => handleDelete(dt)}>
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <p className={styles.footerNote}>
                Archived types are hidden from new-request selection.
              </p>
            </Stack>
          </div>
        </div>
      </div>
    </DocDeskLayout>
  )
}
