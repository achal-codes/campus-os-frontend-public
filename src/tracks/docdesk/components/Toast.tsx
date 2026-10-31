/* oxlint-disable react/only-export-components */
import { useEffect, useState } from 'react'
import styles from './Toast.module.css'

interface ToastItem {
  id: number
  message: string
}

type ToastListener = (toasts: ToastItem[]) => void

let toasts: ToastItem[] = []
let nextId = 1
const listeners = new Set<ToastListener>()

function emit() {
  for (const listener of listeners) {
    listener([...toasts])
  }
}

export function showToast(message: string): void {
  const id = nextId++
  toasts = [...toasts, { id, message }]
  emit()

  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    emit()
  }, 4000)
}

export function ToastContainer() {
  const [activeToasts, setActiveToasts] = useState<ToastItem[]>(toasts)

  useEffect(() => {
    listeners.add(setActiveToasts)
    return () => {
      listeners.delete(setActiveToasts)
    }
  }, [])

  if (activeToasts.length === 0) return null

  return (
    <div className={styles.container} role="region" aria-label="Notifications">
      {activeToasts.map((toast) => (
        <div key={toast.id} className={styles.toast} role="status">
          {toast.message}
        </div>
      ))}
    </div>
  )
}
