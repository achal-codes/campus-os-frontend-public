import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Alert, Button, Card, SelectField, Spinner, Stack, Text, TextField } from '@/ui'
import { listDocTypes } from '../api/docTypes'
import { createRequest } from '../api/requests'
import { DocDeskNav } from '../components/DocDeskNav'
import type { DocType } from '../types'
import styles from './RequestFormScreen.module.css'

export function RequestFormScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedDocTypeId = searchParams.get('doc_type_id') ?? ''

  const [docTypes, setDocTypes] = useState<DocType[]>([])
  const [loadingDocTypes, setLoadingDocTypes] = useState(true)
  const [selectedDocTypeId, setSelectedDocTypeId] = useState(preselectedDocTypeId)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function loadCatalogue() {
      try {
        const res = await listDocTypes()
        if (active) {
          const activeOnly = res.items.filter((d) => d.status === 'active')
          setDocTypes(activeOnly)
          if (!selectedDocTypeId && activeOnly.length > 0) {
            setSelectedDocTypeId(activeOnly[0].doc_type_id)
          }
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load document types')
        }
      } finally {
        if (active) setLoadingDocTypes(false)
      }
    }
    loadCatalogue()
    return () => {
      active = false
    }
  }, [selectedDocTypeId])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!selectedDocTypeId) {
      setError('Please select a valid document type.')
      return
    }

    if (reason.trim().length < 5 || reason.trim().length > 1000) {
      setError('Please provide a reason between 5 and 1000 characters.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const created = await createRequest({
        doc_type_id: selectedDocTypeId,
        reason: reason.trim(),
      })
      navigate(`/tracks/docdesk/requests/${created.request_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit document request')
    } finally {
      setSubmitting(false)
    }
  }

  const options = docTypes.map((dt) => ({
    value: dt.doc_type_id,
    label: dt.name,
  }))

  return (
    <Stack gap={6} className={styles.container} data-testid="docdesk-request-form-screen">
      <DocDeskNav />

      <Stack gap={1}>
        <Text as="h1" size="2xl" weight="bold">
          Submit Document Request
        </Text>
        <Text tone="textMuted">
          Requests are reviewed and processed by the Student Affairs department.
        </Text>
      </Stack>

      <Card>
        {loadingDocTypes ? (
          <Stack gap={3} style={{ padding: 'var(--space-6)', alignItems: 'center' }}>
            <Spinner label="Loading document catalogue..." />
          </Stack>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <Stack gap={4}>
              {error && <Alert tone="danger" data-testid="request-form-error">{error}</Alert>}

              {docTypes.length === 0 ? (
                <Alert tone="info">
                  No active document types are available to request. Please contact Student Affairs.
                </Alert>
              ) : (
                <>
                  <SelectField
                    label="Select Document Type"
                    value={selectedDocTypeId}
                    options={options}
                    onChange={(e) => setSelectedDocTypeId(e.target.value)}
                    required
                    data-testid="request-doc-type-select"
                  />

                  <TextField
                    label="Purpose / Detailed Reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    hint="Explain clearly why you need this document (5 - 1000 characters)."
                    data-testid="request-reason-input"
                  />

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                    <Button
                      variant="secondary"
                      onClick={() => navigate('/tracks/docdesk')}
                      type="button"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      loading={submitting}
                      disabled={docTypes.length === 0}
                      data-testid="submit-request-button"
                    >
                      Submit Request
                    </Button>
                  </div>
                </>
              )}
            </Stack>
          </form>
        )}
      </Card>
    </Stack>
  )
}
