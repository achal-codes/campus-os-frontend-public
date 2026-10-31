import { useEffect, useRef, type ReactNode } from 'react'
import { Button, Stack, Text } from '@/ui'
import styles from './ConfirmModal.module.css'

export interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: 'primary' | 'danger'
  loading?: boolean
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const cancelBtnRef = useRef<HTMLButtonElement>(null)

  // Focus Cancel on open
  useEffect(() => {
    if (isOpen) {
      // Defer to next tick so element is mounted
      const timer = setTimeout(() => {
        cancelBtnRef.current?.focus()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // ESC key dismiss
  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) {
        onCancel()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, loading, onCancel])

  if (!isOpen) return null

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onCancel()
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
    >
      <div className={styles.modal}>
        <Stack gap={2}>
          <Text id="confirm-modal-title" as="h2" size="lg" weight="bold" className={styles.title}>
            {title}
          </Text>
          <div id="confirm-modal-desc" className={styles.body}>
            {typeof message === 'string' ? <Text size="sm" tone="textMuted">{message}</Text> : message}
          </div>
        </Stack>

        <div className={styles.actions}>
          <Button
            ref={cancelBtnRef}
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

