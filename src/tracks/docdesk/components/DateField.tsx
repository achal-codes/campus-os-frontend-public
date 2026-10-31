import { useRef, useState, useId, type ChangeEvent, type KeyboardEvent } from 'react'
import { addDays, formatISOToDDMMYYYY, parseDDMMYYYY, todayIST } from '../utils/time'
import styles from './DateField.module.css'

export interface DateFieldProps {
  label?: string
  value: string // ISO "YYYY-MM-DD"
  onChange: (isoDate: string) => void
  min?: string // ISO "YYYY-MM-DD"
  required?: boolean
  error?: string
  hint?: string
  disabled?: boolean
  showChips?: boolean
  id?: string
  'data-testid'?: string
}

/**
 * Reusable DD/MM/YYYY date input with auto-formatting mask,
 * calendar button launcher, and quick chips.
 * Transmits and maintains state strictly as ISO YYYY-MM-DD.
 */
export function DateField({
  label = 'Expected by (DD/MM/YYYY)',
  value,
  onChange,
  min,
  required,
  error,
  hint,
  disabled,
  showChips = false,
  id,
  'data-testid': testId = 'date-field-input',
}: DateFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`
  const hintId = `${inputId}-hint`
  const hiddenPickerRef = useRef<HTMLInputElement>(null)

  // Track value during render without useEffect to comply with React Compiler / lint
  const [prevValue, setPrevValue] = useState(value)
  const [displayText, setDisplayText] = useState(() => formatISOToDDMMYYYY(value))
  const [isDeleting, setIsDeleting] = useState(false)

  if (value !== prevValue) {
    setPrevValue(value)
    setDisplayText(formatISOToDDMMYYYY(value))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      setIsDeleting(true)
    } else {
      setIsDeleting(false)
    }
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value

    if (isDeleting) {
      setDisplayText(raw)
      const parsedIso = parseDDMMYYYY(raw)
      onChange(parsedIso ?? '')
      return
    }

    // Auto-masking: extract digits and format with slashes
    const digits = raw.replace(/\D/g, '').slice(0, 8)
    let formatted = digits

    if (digits.length >= 5) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
    } else if (digits.length >= 3) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`
    }

    setDisplayText(formatted)

    if (formatted.length === 10) {
      const parsedIso = parseDDMMYYYY(formatted)
      if (parsedIso) {
        onChange(parsedIso)
      } else {
        onChange('')
      }
    } else if (formatted.length === 0) {
      onChange('')
    }
  }

  function openPicker() {
    if (!hiddenPickerRef.current || disabled) return
    if (typeof hiddenPickerRef.current.showPicker === 'function') {
      try {
        hiddenPickerRef.current.showPicker()
      } catch {
        hiddenPickerRef.current.focus()
      }
    } else {
      hiddenPickerRef.current.focus()
    }
  }

  function handlePickerChange(e: ChangeEvent<HTMLInputElement>) {
    const chosenIso = e.target.value
    if (chosenIso) {
      setDisplayText(formatISOToDDMMYYYY(chosenIso))
      onChange(chosenIso)
    }
  }

  // Quick chips
  const today = todayIST()
  const chip3Days = addDays(today, 3)
  const chip1Week = addDays(today, 7)
  const chip2Weeks = addDays(today, 14)

  const chips = [
    { label: '+3 days', iso: chip3Days },
    { label: '+1 week', iso: chip1Week },
    { label: '+2 weeks', iso: chip2Weeks },
  ]

  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={styles.container}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>

      <div className={styles.inputWrapper}>
        <input
          id={inputId}
          type="text"
          inputMode="numeric"
          placeholder="DD/MM/YYYY"
          maxLength={10}
          value={displayText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={styles.input}
          data-testid={testId}
        />

        <button
          type="button"
          onClick={openPicker}
          disabled={disabled}
          className={styles.calendarButton}
          aria-label="Choose date"
          tabIndex={0}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </button>

        {/* Visually hidden native picker */}
        <input
          ref={hiddenPickerRef}
          type="date"
          tabIndex={-1}
          aria-hidden="true"
          className={styles.hiddenPicker}
          value={value}
          min={min}
          disabled={disabled}
          onChange={handlePickerChange}
        />
      </div>

      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}

      {hint && !error && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}

      {showChips && (
        <div className={styles.chipsRow} role="group" aria-label="Quick date selection">
          <span className={styles.chipsLabel}>Quick select:</span>
          {chips.map((chip) => {
            const isSelected = value === chip.iso
            return (
              <button
                key={chip.label}
                type="button"
                disabled={disabled}
                aria-pressed={isSelected}
                className={[styles.chip, isSelected ? styles.chipSelected : ''].filter(Boolean).join(' ')}
                onClick={() => {
                  setDisplayText(formatISOToDDMMYYYY(chip.iso))
                  onChange(chip.iso)
                }}
              >
                {chip.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
