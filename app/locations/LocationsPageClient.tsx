'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { venues } from '@/lib/data'
import { useLocale } from '@/components/LocaleProvider'
import { fetchPublicLocations, type PublicLocation } from '@/lib/public-api'

type DisplayVenue = {
  id: string
  name: string
  googleMapsUrl: string
  city: string
  badge: string
}

type Source = 'loading' | 'erp' | 'erp-empty' | 'static-fallback'

function fallbackVenues(locale: 'bg' | 'en', t: ReturnType<typeof useTranslations<'Locations'>>): DisplayVenue[] {
  return venues
    .filter((v) => v.active)
    .map((v) => ({
      id: v.id,
      name: v.name,
      googleMapsUrl: v.googleMapsUrl,
      city: v.city || t('cityFallback'),
      badge: t(`types.${v.type}`),
    }))
}

function fromErp(loc: PublicLocation, t: ReturnType<typeof useTranslations<'Locations'>>): DisplayVenue {
  const badge =
    loc.lifecycle_stage === 'regular_customer' ? t('tiers.regular') : t('tiers.repeat')
  return {
    id: loc.id,
    name: loc.name,
    googleMapsUrl: loc.maps_url,
    city: loc.city?.trim() || t('cityFallback'),
    badge,
  }
}

function groupByCity(list: DisplayVenue[]): { city: string; venues: DisplayVenue[] }[] {
  const map = new Map<string, DisplayVenue[]>()
  for (const venue of list) {
    const key = venue.city
    const bucket = map.get(key)
    if (bucket) bucket.push(venue)
    else map.set(key, [venue])
  }

  return [...map.entries()]
    .map(([city, cityVenues]) => ({
      city,
      venues: cityVenues.sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => {
      // Sofia first when present, then alphabetical
      if (a.city === 'Sofia' || a.city === 'София') return -1
      if (b.city === 'Sofia' || b.city === 'София') return 1
      return a.city.localeCompare(b.city)
    })
}

export function LocationsPageClient() {
  const t = useTranslations('Locations')
  const { locale } = useLocale()
  const [list, setList] = useState<DisplayVenue[]>([])
  const [source, setSource] = useState<Source>('loading')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setSource('loading')
    setErrorMsg(null)
    fetchPublicLocations()
      .then((locations) => {
        if (cancelled) return
        if (locations.length === 0) {
          setList([])
          setSource('erp-empty')
          return
        }
        setList(locations.map((l) => fromErp(l, t)))
        setSource('erp')
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setList(fallbackVenues(locale, t))
        setSource('static-fallback')
        setErrorMsg(err instanceof Error ? err.message : 'ERP unavailable')
      })
    return () => {
      cancelled = true
    }
  }, [locale, t])

  const display = source === 'loading' ? [] : list
  const count = source === 'loading' ? '…' : source === 'erp-empty' ? 0 : display.length
  const byCity = useMemo(() => groupByCity(display), [display])

  return (
    <div style={{ paddingTop: 72 }}>
      <section className="page-pad" style={{ padding: '60px 48px 40px', borderBottom: '1px solid var(--line)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 32,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: '1 1 320px', minWidth: 0, maxWidth: 720 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 16 }}>
              {t('heading')}
            </p>
            <h1 style={{ fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 900, lineHeight: 0.95, letterSpacing: '-0.03em', marginBottom: 20 }}>
              {t('title', { count })}
            </h1>
            <p style={{ fontSize: 17, fontWeight: 300, color: 'var(--ink-soft)', lineHeight: 1.6, margin: 0 }}>
              {t('intro')}
            </p>
          </div>
        </div>
        {source === 'static-fallback' && (
          <p style={{ marginTop: 16, fontSize: 13, color: 'var(--ink-soft)' }}>
            {t('erpFallbackNote')}{errorMsg ? ` (${errorMsg})` : ''}
          </p>
        )}
        {source === 'erp-empty' && (
          <p style={{ marginTop: 16, fontSize: 13, color: 'var(--ink-soft)' }}>{t('erpEmptyNote')}</p>
        )}
      </section>

      <section className="page-pad" style={{ padding: '48px 48px 0' }}>
        {byCity.map((group) => (
          <div key={group.city} style={{ marginBottom: 48 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--ink-soft)',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              {group.city}
              <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
              <span style={{ fontWeight: 600, letterSpacing: '0.08em' }}>{group.venues.length}</span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: 16,
              }}
            >
              {group.venues.map((venue) => (
                <VenueCard key={venue.id} venue={venue} openLabel={t('openMaps')} />
              ))}
            </div>
          </div>
        ))}
      </section>

      <div className="page-pad" style={{ padding: '40px 48px 80px' }}>
        <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 2, padding: '24px 28px', maxWidth: 560, fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.65 }}>
          <strong style={{ color: 'var(--ink)', fontWeight: 700 }}>{t('stockPrompt')}</strong>{' '}
          {t.rich('stockBody', {
            emailLink: (chunks) => (
              <a href="mailto:sales@dorst.bg" style={{ color: 'var(--ink)', fontWeight: 600, textDecoration: 'underline' }}>{chunks}</a>
            ),
            portalLink: (chunks) => (
              <a href="/partners" style={{ color: 'var(--ink)', fontWeight: 600, textDecoration: 'underline' }}>{chunks}</a>
            ),
          })}
        </div>
      </div>
    </div>
  )
}

function VenueCard({ venue, openLabel }: { venue: DisplayVenue; openLabel: string }) {
  return (
    <a
      href={venue.googleMapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '22px 20px',
        border: '1.5px solid var(--line)',
        borderRadius: 2,
        background: 'var(--paper)',
        textDecoration: 'none',
        color: 'var(--ink)',
        transition: 'border-color 0.2s, transform 0.2s',
        minHeight: 132,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--ink)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--line)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.25 }}>{venue.name}</span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--ink-soft)',
            background: 'rgba(14,14,16,0.06)',
            padding: '4px 8px',
            borderRadius: 2,
            flexShrink: 0,
          }}
        >
          {venue.badge}
        </span>
      </div>
      <span style={{ marginTop: 'auto', fontSize: 13, color: 'var(--ink-soft)', fontWeight: 500 }}>
        {openLabel} →
      </span>
    </a>
  )
}
