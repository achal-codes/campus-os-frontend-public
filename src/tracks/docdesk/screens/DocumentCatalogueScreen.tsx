import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '@/core/auth'
import { Alert, Button, Spinner, Stack, Text } from '@/ui'
import { listDocTypes } from '../api/docTypes'
import { DocDeskLayout } from '../components/DocDeskLayout'
import glass from '../theme/glass.module.css'
import type { DocType } from '../types'
import styles from './DocumentCatalogueScreen.module.css'

export interface CanonicalDocType {
  name: string
  purpose: string
  isScholarship?: boolean
}

/** Official student-facing document types and explanations specified in CampusOS (§5) */
const STUDENT_CATALOG_SPEC: CanonicalDocType[] = [
  { name: 'Bonafide Certificate', purpose: 'Scholarship applications, education loans, or proof of enrollment.' },
  { name: 'Academic Transcript', purpose: 'Higher studies or university applications.' },
  { name: 'Marksheet', purpose: 'Proof of examination results.' },
  { name: 'Transfer Certificate (TC)', purpose: 'Transferring to another institution.' },
  { name: 'Migration Certificate', purpose: 'Moving to another university.' },
  { name: 'Fee Receipt / Fee Certificate', purpose: 'Scholarship applications or reimbursement.' },
  { name: 'Fee Structure Certificate', purpose: 'Education loan applications.' },
  { name: 'Character Certificate', purpose: 'Applications requiring proof of conduct.' },
  { name: 'Course Completion Certificate', purpose: 'Proof of completing a course.' },
  { name: 'Attendance Certificate', purpose: 'Proof of attendance when required.' },
  { name: 'Scholarship Application', purpose: 'Apply for a campus scholarship.', isScholarship: true },
]

export function DocumentCatalogueScreen() {
  const { user } = useAuth()
  const isStudent = user?.role === 'student'

  const [activeDocTypes, setActiveDocTypes] = useState<DocType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        const res = await listDocTypes({ status: 'active', limit: 100 })
        if (active) {
          setActiveDocTypes(res.items.filter((d) => d.status === 'active'))
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

  // Map canonical types to backend entries
  const matchedCanonicalNames = new Set<string>()
  const canonicalEntries = STUDENT_CATALOG_SPEC.map((spec) => {
    const matched = activeDocTypes.find(
      (d) =>
        d.name.trim().toLowerCase() === spec.name.trim().toLowerCase() ||
        (spec.isScholarship && d.name.toLowerCase().includes('scholarship')),
    )
    if (matched) {
      matchedCanonicalNames.add(matched.doc_type_id)
    }
    return {
      spec,
      matched,
      isAvailable: Boolean(matched),
    }
  })

  // Additional custom active types present in backend that are not in canonical list
  const customBackendTypes = activeDocTypes.filter((d) => !matchedCanonicalNames.has(d.doc_type_id))

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
          <div className={`${glass.panel} ${glass.tintBlue}`} style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
            <Spinner label="Loading document catalogue..." />
          </div>
        ) : (
          <div className={styles.grid}>
            {/* Canonical Student Document Types */}
            {canonicalEntries.map(({ spec, matched, isAvailable }) => (
              <div
                key={spec.name}
                className={styles.docCard}
                data-testid={`doctype-card-${matched?.doc_type_id ?? spec.name}`}
              >
                <Stack gap={3} style={{ height: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <Text as="h3" size="md" weight="bold">
                      {spec.name}
                    </Text>
                    {isAvailable ? (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: '#dcfce7',
                          color: '#15803d',
                        }}
                      >
                        Available
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: '#fef3c7',
                          color: '#b45309',
                        }}
                      >
                        Not Configured
                      </span>
                    )}
                  </div>

                  <Text size="sm" tone="textMuted" style={{ flexGrow: 1, lineHeight: 1.5 }}>
                    {matched?.description || spec.purpose}
                  </Text>

                  {!isAvailable && (
                    <Text size="xs" tone="textMuted" style={{ fontStyle: 'italic' }}>
                      This document type has not been enabled on the CampusOS server yet. Contact Student Affairs to enable it in the Document Types Manager.
                    </Text>
                  )}

                  <div style={{ marginTop: 'var(--space-3)' }}>
                    {isAvailable ? (
                      isStudent ? (
                        spec.isScholarship ? (
                          <Link to="/tracks/docdesk/scholarship" style={{ textDecoration: 'none' }}>
                            <Button variant="primary" size="sm" fullWidth>
                              Apply for Scholarship →
                            </Button>
                          </Link>
                        ) : (
                          <Link
                            to={`/tracks/docdesk/new?doc_type_id=${encodeURIComponent(matched!.doc_type_id)}`}
                            style={{ textDecoration: 'none' }}
                          >
                            <Button variant="primary" size="sm" fullWidth>
                              Request This Document →
                            </Button>
                          </Link>
                        )
                      ) : (
                        <Button variant="secondary" size="sm" fullWidth disabled title="Student only">
                          Student Only
                        </Button>
                      )
                    ) : (
                      <Button variant="secondary" size="sm" fullWidth disabled>
                        Currently Unavailable
                      </Button>
                    )}
                  </div>
                </Stack>
              </div>
            ))}

            {/* Any extra active types from backend */}
            {customBackendTypes.map((dt) => (
              <div key={dt.doc_type_id} className={styles.docCard} data-testid={`doctype-card-${dt.doc_type_id}`}>
                <Stack gap={3} style={{ height: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <Text as="h3" size="md" weight="bold">
                      {dt.name}
                    </Text>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: '#dcfce7',
                        color: '#15803d',
                      }}
                    >
                      Available
                    </span>
                  </div>

                  <Text size="sm" tone="textMuted" style={{ flexGrow: 1, lineHeight: 1.5 }}>
                    {dt.description || 'Official institutional document template managed by Student Affairs.'}
                  </Text>

                  <div style={{ marginTop: 'var(--space-3)' }}>
                    {isStudent ? (
                      <Link
                        to={`/tracks/docdesk/new?doc_type_id=${encodeURIComponent(dt.doc_type_id)}`}
                        style={{ textDecoration: 'none' }}
                      >
                        <Button variant="primary" size="sm" fullWidth>
                          Request This Document →
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="secondary" size="sm" fullWidth disabled>
                        Student Only
                      </Button>
                    )}
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
