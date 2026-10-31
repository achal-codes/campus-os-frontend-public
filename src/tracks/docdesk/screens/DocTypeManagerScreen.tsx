import { useEffect, useState, type FormEvent } from 'react'
import { ApiError } from '@/core/api'
import { Alert, Button, SelectField, Spinner, Stack, Text, TextField } from '@/ui'
import {
  createDocType,
  deleteDocType,
  editDocType,
  listDocTypes,
} from '../api/docTypes'
import { ConfirmModal } from '../components/ConfirmModal'
import { DocDeskLayout } from '../components/DocDeskLayout'
import { showToast } from '../components/Toast'
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

  // Confirm delete modal state
  const [docTypeToDelete, setDocTypeToDelete] = useState<DocType | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function loadData() {
    setError(null)
    try {
      const [activeRes, archivedRes] = await Promise.allSettled([
        listDocTypes({ status: 'active', limit: 100 }),
        listDocTypes({ status: 'archived', limit: 100 }),
      ])
      const map = new Map<string, DocType>()
      if (activeRes.status === 'fulfilled') {
        for (const item of activeRes.value.items) map.set(item.doc_type_id, item)
      }
      if (archivedRes.status === 'fulfilled') {
        for (const item of archivedRes.value.items) map.set(item.doc_type_id, item)
      }
      if (map.size === 0) {
        const res = await listDocTypes()
        for (const item of res.items) map.set(item.doc_type_id, item)
      }
      setTypes(Array.from(map.values()))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document types')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    Promise.allSettled([
      listDocTypes({ status: 'active', limit: 100 }),
      listDocTypes({ status: 'archived', limit: 100 }),
    ])
      .then(([activeRes, archivedRes]) => {
        if (!active) return
        const map = new Map<string, DocType>()
        if (activeRes.status === 'fulfilled') {
          for (const item of activeRes.value.items) map.set(item.doc_type_id, item)
        }
        if (archivedRes.status === 'fulfilled') {
          for (const item of archivedRes.value.items) map.set(item.doc_type_id, item)
        }
        if (map.size === 0) {
          listDocTypes().then((res) => {
            if (active) setTypes(res.items)
          })
        } else {
          setTypes(Array.from(map.values()))
        }
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load document types')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
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
        showToast('Document type saved')
      } else {
        await createDocType({
          name: trimmedName,
          description: description.trim() || undefined,
        })
        setSuccess(`Document type "${trimmedName}" created successfully.`)
        showToast('Document type saved')
      }
      resetForm()
      await loadData()
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.code === 'ALREADY_EXISTS' || err.status === 409) {
          setError('A document type with this name already exists.')
        } else if (err.status === 403) {
          setError('Only Student Affairs staff are permitted to manage document types.')
        } else {
          setError(err.message || 'Failed to save document type')
        }
      } else {
        setError(err instanceof Error ? err.message : 'Failed to save document type')
      }
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

  async function handleConfirmDelete() {
    if (!docTypeToDelete) return
    setDeleting(true)
    setError(null)
    try {
      await deleteDocType(docTypeToDelete.doc_type_id)
      setSuccess(`"${docTypeToDelete.name}" deleted.`)
      showToast('Document type deleted')
      if (editingDocType?.doc_type_id === docTypeToDelete.doc_type_id) {
        resetForm()
      }
      setDocTypeToDelete(null)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document type')
    } finally {
      setDeleting(false)
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
          <div className={styles.panel}>
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
          <div className={styles.panel}>
            <Stack gap={3}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text as="h2" size="sm" weight="bold" tone="accent" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  EXISTING DOCUMENT TYPES
                </Text>
                <Button variant="secondary" size="sm" onClick={loadData}>
                  Refresh
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
                                borderRadius: 'var(--radius-full)',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                background: dt.status === 'active' ? 'var(--color-surface-muted)' : 'var(--color-surface-muted)',
                                color: dt.status === 'active' ? 'var(--color-success)' : 'var(--color-text-muted)',
                                border: '1px solid var(--color-border)',
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
                              <Button size="sm" variant="danger" onClick={() => setDocTypeToDelete(dt)}>
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

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={Boolean(docTypeToDelete)}
          title="Delete document type"
          message={`Are you sure you want to permanently delete "${docTypeToDelete?.name}"? Archiving is recommended over deletion if historical requests exist.`}
          confirmLabel="Delete"
          confirmVariant="danger"
          loading={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDocTypeToDelete(null)}
        />
      </div>
    </DocDeskLayout>
  )
}
