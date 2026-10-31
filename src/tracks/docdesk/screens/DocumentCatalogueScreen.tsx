import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Alert, Button, Spinner, Stack, Text } from '@/ui'
import { listDocTypes } from '../api/docTypes'
import { DocDeskLayout } from '../components/DocDeskLayout'
import type { DocType } from '../types'
import styles from './DocumentCatalogueScreen.module.css'

export function DocumentCatalogueScreen() {
  const [docTypes, setDocTypes] = useState<DocType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        const res = await listDocTypes()
        if (active) {
          // Filter to active types for requester view
          setDocTypes(res.items.filter((d) => d.status === 'active'))
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load document catalogue')
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    loadData()
    return () => {
      active = false
    }
  }, [])

  return (
    <DocDeskLayout activeItem="catalogue">
      <Stack gap={6} data-testid="docdesk-catalogue-screen">
        <Stack gap={1}>
          <Text as="h1" size="2xl" weight="bold">
            Institutional Document Catalogue
          </Text>
          <Text tone="textMuted">
            Select an official institutional document to submit a request with official tracking.
          </Text>
        </Stack>

        {error && (
          <Alert tone="danger" data-testid="catalogue-error">
            {error}
          </Alert>
        )}

        {loading ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
            <Spinner label="Loading document catalogue..." />
          </div>
        ) : docTypes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-6)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
            <Stack gap={2} style={{ alignItems: 'center' }}>
              <Text size="md" weight="medium">No document types currently available</Text>
              <Text size="sm" tone="textMuted">
                No active document types have been configured by Student Affairs.
              </Text>
            </Stack>
          </div>
        ) : (
          <div className={styles.grid}>
            {docTypes.map((dt) => (
              <div key={dt.doc_type_id} className={styles.docCard} data-testid={`doctype-card-${dt.doc_type_id}`}>
                <Stack gap={3} style={{ height: '100%' }}>
                  <Stack gap={1}>
                    <Text as="h3" size="md" weight="bold">
                      {dt.name}
                    </Text>
                    <Text size="xs" tone="textMuted">
                      Catalog Code: {dt.doc_type_id}
                    </Text>
                  </Stack>

                  <Text size="sm" tone="textMuted" style={{ flexGrow: 1, lineHeight: 1.5 }}>
                    {dt.description || 'Official institutional document template managed by Student Affairs.'}
                  </Text>

                  <div style={{ marginTop: 'var(--space-3)' }}>
                    <Link
                      to={`/tracks/docdesk/new?doc_type_id=${encodeURIComponent(dt.doc_type_id)}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <Button variant="primary" size="sm" fullWidth>
                        New Request
                      </Button>
                    </Link>
                  </div>
                </Stack>
              </div>
            ))}
          </div>
        )}
      </Stack>
    </DocDeskLayout>
  )
}
