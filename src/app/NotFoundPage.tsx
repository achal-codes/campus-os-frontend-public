import { Link } from 'react-router'
import { Card, Stack, Text } from '@/ui'

export function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'grid',
        placeItems: 'center',
        padding: 'var(--space-8) var(--space-4)',
      }}
    >
      <Card padding={7} style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <Stack gap={4} align="center">
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary-subtle)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 'bold',
            }}
          >
            404
          </div>
          <Stack gap={2} align="center">
            <Text as="h1" size="2xl" weight="bold">
              Page not found
            </Text>
            <Text tone="textMuted">
              The page you were looking for doesn&apos;t exist or has moved.
            </Text>
          </Stack>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '8px 18px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-on-primary)',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: 'var(--text-sm)',
            }}
          >
            Go home
          </Link>
        </Stack>
      </Card>
    </div>
  )
}
