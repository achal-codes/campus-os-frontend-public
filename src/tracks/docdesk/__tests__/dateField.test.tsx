import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DateField } from '../components/DateField'
import { addDays, todayIST } from '../utils/time'

describe('DateField Component (DD/MM/YYYY)', () => {
  it('formats initial ISO value as DD/MM/YYYY', () => {
    const handleChange = vi.fn()
    render(
      <DateField
        label="Expected by (DD/MM/YYYY)"
        value="2026-10-31"
        onChange={handleChange}
        data-testid="test-date-input"
      />,
    )

    const input = screen.getByTestId('test-date-input') as HTMLInputElement
    expect(input.value).toBe('31/10/2026')
  })

  // 3. Typing "31102026" produces "31/10/2026" in the field
  it('3. typing "31102026" produces "31/10/2026" and calls onChange with ISO "2026-10-31"', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(
      <DateField
        label="Expected by (DD/MM/YYYY)"
        value=""
        onChange={handleChange}
        data-testid="test-date-input"
      />,
    )

    const input = screen.getByTestId('test-date-input') as HTMLInputElement
    await user.type(input, '31102026')

    expect(input.value).toBe('31/10/2026')
    expect(handleChange).toHaveBeenCalledWith('2026-10-31')
  })

  // 4. Picking a date through the calendar updates the visible field in DD/MM/YYYY
  it('4. picking a date through calendar picker updates visible field in DD/MM/YYYY and calls onChange with ISO', () => {
    const handleChange = vi.fn()
    const { container } = render(
      <DateField
        label="Expected by (DD/MM/YYYY)"
        value=""
        onChange={handleChange}
        data-testid="test-date-input"
      />,
    )

    const hiddenPicker = container.querySelector('input[type="date"]') as HTMLInputElement
    expect(hiddenPicker).toBeInTheDocument()

    // Simulate calendar selection of 2026-11-25
    fireEvent.change(hiddenPicker, { target: { value: '2026-11-25' } })

    const visibleInput = screen.getByTestId('test-date-input') as HTMLInputElement
    expect(visibleInput.value).toBe('25/11/2026')
    expect(handleChange).toHaveBeenCalledWith('2026-11-25')
  })

  // 5. Chips produce the correct date and DD/MM/YYYY display
  it('5. quick chips produce correct ISO date, update visible DD/MM/YYYY, and set aria-pressed', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    const today = todayIST()
    const expectedChipIso = addDays(today, 3)
    const [y, m, d] = expectedChipIso.split('-')
    const expectedChipDisplay = `${d}/${m}/${y}`

    const { rerender } = render(
      <DateField
        label="Expected by (DD/MM/YYYY)"
        value=""
        onChange={handleChange}
        showChips
        data-testid="test-date-input"
      />,
    )

    const chip3 = screen.getByRole('button', { name: '+3 days' })
    expect(chip3).toHaveAttribute('aria-pressed', 'false')

    await user.click(chip3)
    expect(handleChange).toHaveBeenCalledWith(expectedChipIso)

    // Rerender with the selected value
    rerender(
      <DateField
        label="Expected by (DD/MM/YYYY)"
        value={expectedChipIso}
        onChange={handleChange}
        showChips
        data-testid="test-date-input"
      />,
    )

    const visibleInput = screen.getByTestId('test-date-input') as HTMLInputElement
    expect(visibleInput.value).toBe(expectedChipDisplay)
    expect(screen.getByRole('button', { name: '+3 days' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('rejects invalid dates when typed', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(
      <DateField
        label="Expected by (DD/MM/YYYY)"
        value=""
        onChange={handleChange}
        data-testid="test-date-input"
      />,
    )

    const input = screen.getByTestId('test-date-input') as HTMLInputElement
    // 31/02/2026 is invalid
    await user.type(input, '31022026')
    expect(input.value).toBe('31/02/2026')
    // onChange should not be called with an invalid ISO date
    expect(handleChange).not.toHaveBeenCalledWith('2026-02-31')
  })
})

