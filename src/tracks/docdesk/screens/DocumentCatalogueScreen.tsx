import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Alert, Button, Card, Spinner, Stack, Text } from '@/ui'
import { listDocTypes } from '../api/docTypes'
import { DocDeskNav } from '../components/DocDeskNav'
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
    <Stack gap={6} data-testid="docdesk-catalogue-screen">
      <DocDeskNav />

      <Stack gap={1}>
        <Text as="h1" size="2xl" weight="bold">
          Document Catalogue
        </Text>
        <Text tone="textMuted">
          Select an official institutional document to submit a request.
        </Text>
      </Stack>

      {error && (
        <Alert tone="danger" data-testid="catalogue-error">
          {error}
        </Alert>
      )}

      {loading ? (
        <Stack gap={4} style={{ padding: 'var(--space-8)', alignItems: 'center' }}>
          <Spinner label="Loading document types..." />
        </Stack>
      ) : docTypes.length === 0 ? (
        <Card>
          <Stack gap={2} style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
            <Text size="md" weight="medium">No document types currently available</Text>
            <Text size="sm" tone="textMuted">
              No active document types have been configured by Student Affairs.
            </Text>
          </Stack>
        </Card>
      ) : (
        <div className={styles.grid}>
          {docTypes.map((dt) => (
            <Card key={dt.doc_type_id} className={styles.docCard} data-testid={`doctype-card-${dt.doc_type_id}`}>
              <Stack gap={3}>
                <Stack gap={1}>
                  <Text as="h3" size="md" weight="bold">
                    📄 {dt.name}
                  </Text>
                  <Text size="xs" tone="textMuted">
                    ID: {dt.doc_type_id}
                  </Text>
                </Stack>

                <Text size="sm" tone="textMuted" style={{ flexGrow: 1 }}>
                  {dt.description || 'Official institutional document.'}
                </Text>

                <div style={{ marginTop: 'var(--space-3)' }}>
                  <Link
                    to={`/tracks/docdesk/new?doc_type_id=${encodeURIComponent(dt.doc_type_id)}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <Button variant="secondary" size="sm" fullWidth>
                      Request This Document
                    </Button>
                  </Link>
                </div>
              </Stack>
            </Card>
          ))}
        </div>
      )}
    </Stack>
  )
}
