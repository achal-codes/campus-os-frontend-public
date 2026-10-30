# DocDesk Design Direction & System Aesthetics

## 1. Personality & Principles
- **Calm, trustworthy, official, modern**: DocDesk is an institutional tool for official university records.
- **Strict Brand Purple**: Uses the existing CSS token primitives (`--purple-500`, `--purple-600`, `--purple-100`, etc.) without introducing raw hex values.
- **First-Class Dark Theme**: Every component explicitly references CSS custom variables (`var(--color-bg)`, `var(--color-surface)`, `var(--color-text)`, etc.) ensuring zero visual contrast glitches in dark mode.
- **Restrained Typography & Layout**:
  - Semantic HTML (`<main>`, `<header>`, `<table>`, `<form>`, `<fieldset>`)
  - No decorative gradients, glassmorphism, or artificial animations.
  - Clear visual indicators that never rely solely on color (includes icons and text badges).

## 2. Breakpoints & Responsiveness
- **360px (Mobile)**: Single column forms, card-based list layouts, full-width buttons, horizontal overflow containment on tables.
- **768px (Tablet)**: Balanced two-column metadata displays, compact toolbar controls.
- **1280px (Desktop)**: Dense operational tables for staff, multi-panel split view for request inspection and communication timeline.
