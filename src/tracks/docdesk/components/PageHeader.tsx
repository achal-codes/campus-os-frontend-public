import { useEffect, useRef, type ReactNode } from 'react'
import { Link } from 'react-router'
import styles from './PageHeader.module.css'

export interface BreadcrumbItem {
  label: string
  to?: string
}

interface PageHeaderProps {
  title: string
  helperText?: ReactNode
  breadcrumbs?: BreadcrumbItem[]
  actions?: ReactNode
  documentTitle?: string
}

export function PageHeader({
  title,
  helperText,
  breadcrumbs,
  actions,
  documentTitle,
}: PageHeaderProps) {
  const h1Ref = useRef<HTMLHeadingElement>(null)

  // Update document title and move focus to H1
  useEffect(() => {
    const pageTitle = documentTitle ?? title
    document.title = `${pageTitle} · DocDesk · Campus OS`

    // Focus H1 without scrolling
    if (h1Ref.current) {
      h1Ref.current.focus({ preventScroll: true })
    }
  }, [title, documentTitle])

  return (
    <div className={styles.container}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className={styles.breadcrumbNav}>
          <ol className={styles.breadcrumbList}>
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1
              return (
                <li key={crumb.label + idx} className={styles.breadcrumbItem}>
                  {idx > 0 && <span className={styles.breadcrumbSeparator} aria-hidden="true">/</span>}
                  {isLast || !crumb.to ? (
                    <span className={styles.breadcrumbCurrent} aria-current="page">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link to={crumb.to} className={styles.breadcrumbLink}>
                      {crumb.label}
                    </Link>
                  )}
                </li>
              )
            })}
          </ol>
        </nav>
      )}

      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <h1 ref={h1Ref} tabIndex={-1} className={styles.title}>
            {title}
          </h1>
          {helperText && <p className={styles.helperText}>{helperText}</p>}
        </div>

        {actions && <div className={styles.actionsArea}>{actions}</div>}
      </div>
    </div>
  )
}

