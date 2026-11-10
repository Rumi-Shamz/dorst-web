'use client'

import { useTranslations } from 'next-intl'

type Section = { title: string; body: string }

export function PrivacyPageClient() {
  const t = useTranslations('Privacy')
  const sections = t.raw('sections') as Section[]

  return (
    <div style={{ paddingTop: 72 }}>
      <section className="page-pad" style={{ padding: '80px 48px', maxWidth: 820, margin: '0 auto' }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 24 }}>{t('heading')}</p>
        <h1 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900, lineHeight: 0.95, letterSpacing: '-0.03em', marginBottom: 16 }}>{t('title')}</h1>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 48 }}>{t('updated')}</p>
        {sections.map((s) => (
          <div key={s.title} style={{ paddingTop: 24, marginTop: 24, borderTop: '1px solid var(--line)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>{s.title}</h2>
            <p style={{ fontSize: 16, fontWeight: 300, color: 'var(--ink-soft)', lineHeight: 1.75 }}>{s.body}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
