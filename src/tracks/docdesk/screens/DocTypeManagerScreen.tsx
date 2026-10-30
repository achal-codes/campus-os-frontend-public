import { useEffect, useState, type FormEvent } from 'react'
import { Alert, Button, Spinner, Stack, Text, TextField } from '@/ui'
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

  // Creation form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

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

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (name.trim().length < 3 || name.trim().length > 80) {
      setError('Document type name must be between 3 and 80 characters.')
      return
    }

    setCreating(true)
    setError(null)
    setSuccess(null)
    try {
      await createDocType({
        name: name.trim(),
        description: description.trim() || undefined,
      })
      setName('')
      setDescription('')
      setSuccess('Document type created successfully.')
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create document type')
    } finally {
      setCreating(false)
    }
  }

  async function handleToggleStatus(dt: DocType) {
    const nextStatus = dt.status === 'active' ? 'archived' : 'active'
    setError(null)
    try {
      await editDocType(dt.doc_type_id, { status: nextStatus })
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${nextStatus} document type`)
    }
  }

  async function handleDelete(dt: DocType) {
    if (!window.confirm(`Are you sure you want to permanently delete "${dt.name}"? Archiving is recommended over deletion if historical requests exist.`)) {
      return
    }

    setError(null)
    try {
      await deleteDocType(dt.doc_type_id)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document type')
    }
  }

  function startEdit(dt: DocType) {
    setEditingId(dt.doc_type_id)
    setEditName(dt.name)
    setEditDesc(dt.description ?? '')
  }

  async function saveEdit(dt: DocType) {
    if (editName.trim().length < 3 || editName.trim().length > 80) {
      setError('Document type name must be between 3 and 80 characters.')
      return
    }

    setSavingEdit(true)
    setError(null)
    try {
      await editDocType(dt.doc_type_id, {
        name: editName.trim(),
        description: editDesc.trim() || undefined,
      })
      setEditingId(null)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update document type')
    } finally {
      setSavingEdit(false)
    }
  }

  const activeTypes = types.filter((t) => t.status === 'active')
  const archivedTypes = types.filter((t) => t.status === 'archived')

  return (
    <DocDeskLayout activeItem="doc-types">
      <div className={styles.container} data-testid="docdesk-doctype-manager-screen">
        <Stack gap={1}>
          <Text as="h1" size="2xl" weight="bold">
            Document Type Management
          </Text>
          <Text tone="textMuted">
            Configure institutional document types, turnaround times, and active statuses.
          </Text>
        </Stack>

        {error && <Alert tone="danger">{error}</Alert>}
        {success && <Alert tone="success">{success}</Alert>}

        <div className={styles.twoColumnGrid}>
          {/* Left Panel: Add / Edit Document Type Form */}
          <div className={`${glass.panel} ${glass.tintBlue}`}>
            <form onSubmit={handleCreate} noValidate>
              <Stack gap={4}>
                <Text as="h2" size="md" weight="bold">
                  Add New Document Type
                </Text>

                <TextField
                  label="Type Name (3-80 chars)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Bonafide Certificate, Transcript"
                  required
                  data-testid="doctype-name-input"
                />

                <TextField
                  label="Description (Optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Official verification of student enrollment"
                  data-testid="doctype-desc-input"
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button type="submit" loading={creating} data-testid="create-doctype-button">
                    + Create Type
                  </Button>
                </div>
              </Stack>
            </form>
          </div>

          {/* Right Panel: Existing Types List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {/* Active Document Types */}
            <div className={`${glass.panel} ${glass.tintBlue}`}>
              <Stack gap={3}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text as="h2" size="md" weight="bold">
                    Active Catalogues ({activeTypes.length})
                  </Text>
                  <Button variant="secondary" size="sm" onClick={loadData}>
                    ↻ Refresh
                  </Button>
                </div>

                {loading ? (
                  <div style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
                    <Spinner label="Loading document types..." />
                  </div>
                ) : activeTypes.length === 0 ? (
                  <Text size="sm" tone="textMuted">No active document types configured.</Text>
                ) : (
                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Description</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeTypes.map((dt) => (
                          <tr key={dt.doc_type_id} data-testid={`doctype-row-${dt.doc_type_id}`}>
                            <td><Text size="xs" weight="bold">{dt.doc_type_id}</Text></td>
                            <td>
                              {editingId === dt.doc_type_id ? (
                                <input
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '6px 8px',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-surface)',
                                    color: 'var(--color-text)',
                                  }}
                                />
                              ) : (
                                <Text size="sm" weight="medium">{dt.name}</Text>
                              )}
                            </td>
                            <td>
                              {editingId === dt.doc_type_id ? (
                                <input
                                  value={editDesc}
                                  onChange={(e) => setEditDesc(e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '6px 8px',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-surface)',
                                    color: 'var(--color-text)',
                                  }}
                                />
                              ) : (
                                <Text size="xs" tone="textMuted">{dt.description || '—'}</Text>
                              )}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                {editingId === dt.doc_type_id ? (
                                  <>
                                    <Button size="sm" variant="primary" onClick={() => saveEdit(dt)} loading={savingEdit}>
                                      Save
                                    </Button>
                                    <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>
                                      Cancel
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button size="sm" variant="secondary" onClick={() => startEdit(dt)}>
                                      Edit
                                    </Button>
                                    <Button size="sm" variant="secondary" onClick={() => handleToggleStatus(dt)}>
                                      Archive
                                    </Button>
                                    <Button size="sm" variant="danger" onClick={() => handleDelete(dt)}>
                                      Delete
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Stack>
            </div>

            {/* Archived Document Types */}
            {archivedTypes.length > 0 && (
              <div className={`${glass.panel} ${glass.tintBlue}`}>
                <Stack gap={3}>
                  <Text as="h2" size="md" weight="bold">
                    Archived Catalogues ({archivedTypes.length})
                  </Text>

                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Description</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {archivedTypes.map((dt) => (
                          <tr key={dt.doc_type_id}>
                            <td><Text size="xs" weight="bold">{dt.doc_type_id}</Text></td>
                            <td><Text size="sm">{dt.name}</Text></td>
                            <td><Text size="xs" tone="textMuted">{dt.description || '—'}</Text></td>
                            <td>
                              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                <Button size="sm" variant="secondary" onClick={() => handleToggleStatus(dt)}>
                                  Restore to Active
                                </Button>
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
                </Stack>
              </div>
            )}
          </div>
        </div>
      </div>
    </DocDeskLayout>
  )
}
