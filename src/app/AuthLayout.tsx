import { Outlet } from 'react-router'
import { Card, ThemeToggle } from '@/ui'
import styles from './AuthLayout.module.css'

export function AuthLayout() {
  return (
    <main className={styles.page}>
      <div className={styles.toggle}>
        <ThemeToggle />
      </div>

      <div className={styles.layoutWrapper}>
        {/* Left Column: Brand & Feature Highlights */}
        <section className={styles.brandPanel} aria-label="Campus OS Overview">
          <div className={styles.brandKicker}>
            Campus OS • Unified Platform
          </div>

          <h1 className={styles.brandHeroTitle}>
            Modern document infrastructure for higher education.
          </h1>

          <p className={styles.brandHeroDescription}>
            Streamlined credential requests, turnaround time transparency, and direct Student Affairs fulfillment in one integrated platform.
          </p>

          <div className={styles.featureList}>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>⚡</div>
              <div className={styles.featureText}>
                <div className={styles.featureTitle}>Real-Time Request Lifecycle</div>
                <div className={styles.featureDesc}>Track status instantly across pending, answered, and acknowledged milestones.</div>
              </div>
            </div>

            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>📋</div>
              <div className={styles.featureText}>
                <div className={styles.featureTitle}>Student Affairs Workflow</div>
                <div className={styles.featureDesc}>Official responses with PDF/DOCX templates, bidirectional forms, and bulk turnaround time SLAs.</div>
              </div>
            </div>

            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>🔒</div>
              <div className={styles.featureText}>
                <div className={styles.featureTitle}>Role-Enforced Security</div>
                <div className={styles.featureDesc}>Protected access for students, faculty, office staff, and system administrators.</div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Authentication Card */}
        <div className={styles.formColumn}>
          <div className={styles.glassCardWrapper}>
            <Card padding={7}>
              <Outlet />
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
