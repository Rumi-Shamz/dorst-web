'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { beers, venues, stats } from '@/lib/data'
import { WhaleHero } from '@/components/whale/WhaleHero'
import { ScrollReveal } from '@/components/ScrollReveal'
import { BeerLabel } from '@/components/beer/BeerLabel'
import { useLocale } from '@/components/LocaleProvider'
import { pickBeerText, pickVenueText } from '@/lib/locale-content'
import { fetchPublicLocations } from '@/lib/public-api'

// Core beers shown in the homepage grid (4 cans)
const HOMEPAGE_BEERS = ['lion-heart', 'hippy-shake', 'alexis', 'pulpa-fiction']

const STAT_KEYS = ['capacity', 'styles', 'rotation', 'established'] as const

type HomeVenue = {
  id: string
  name: string
  googleMapsUrl: string
  subtitle: string
}

/** Remember last ERP list so remounting home does not flash the old static sample venues. */
let cachedHomeVenues: HomeVenue[] | null = null

function fallbackVenues(locale: 'bg' | 'en'): HomeVenue[] {
  return venues.filter(v => v.active).map(v => ({
    id: v.id,
    name: v.name,
    googleMapsUrl: v.googleMapsUrl,
    subtitle: pickVenueText(v, locale),
  }))
}

export default function HomePage() {
  const t = useTranslations('Home')
  const tStats = useTranslations('Stats')
  const tLoc = useTranslations('Locations')
  const { locale } = useLocale()
  const homeBeers = beers.filter(b => HOMEPAGE_BEERS.includes(b.id))
  const seasonal = beers.find(b => b.seasonal && b.active) ?? beers[1]
  const seasonalText = pickBeerText(seasonal, locale)
  const [activeVenues, setActiveVenues] = useState<HomeVenue[]>(
    () => cachedHomeVenues ?? []
  )

  useEffect(() => {
    let cancelled = false
    fetchPublicLocations()
      .then((locations) => {
        if (cancelled) return
        if (locations.length === 0) {
          if (!cachedHomeVenues) setActiveVenues([])
          return
        }
        const next = locations.slice(0, 8).map((l) => ({
          id: l.id,
          name: l.name,
          googleMapsUrl: l.maps_url,
          subtitle: l.city ?? tLoc('cityFallback'),
        }))
        cachedHomeVenues = next
        setActiveVenues(next)
      })
      .catch(() => {
        if (cancelled || cachedHomeVenues) return
        setActiveVenues(fallbackVenues(locale))
      })
    return () => { cancelled = true }
  }, [tLoc, locale])

  return (
    <>
      {/* ── HERO ──────────────────────────────────────────────── */}
      <section
        style={{
          minHeight: '100vh',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          alignItems: 'center',
          padding: '0 48px',
          position: 'relative',
          overflow: 'hidden',
        }}
        className="hero-section"
      >
        {/* Radial glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 60% 80% at 80% 50%, rgba(210,200,180,0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Left: text */}
        <div className="hero-content" style={{ paddingTop: 72, zIndex: 2 }}>
          <p
            className="hero-eyebrow"
            style={{
              fontWeight: 600,
              textTransform: 'uppercase',
              color: 'var(--ink-soft)',
              marginBottom: 24,
              opacity: 0,
              animation: 'fadeUp 0.8s 0.2s forwards',
            }}
          >
            {t('eyebrow')}
          </p>

          <h1
            className="hero-headline"
            style={{
              fontWeight: 900,
              lineHeight: 0.95,
              letterSpacing: '-0.03em',
              marginBottom: 28,
              opacity: 0,
              animation: 'fadeUp 0.8s 0.4s forwards',
            }}
          >
            {t('headlineBefore')}<br />
            <em style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--ink-soft)' }}>{t('headlineEmphasis')}</em>
            {t('headlineAfter') && (<><br />{t('headlineAfter')}</>)}
          </h1>

          <p
            className="hero-body"
            style={{
              fontWeight: 300,
              color: 'var(--ink-soft)',
              lineHeight: 1.6,
              marginBottom: 44,
              opacity: 0,
              animation: 'fadeUp 0.8s 0.6s forwards',
            }}
          >
            {t('body')}
          </p>

          <div
            className="hero-ctas"
            style={{
              display: 'flex',
              gap: 14,
              alignItems: 'center',
              opacity: 0,
              animation: 'fadeUp 0.8s 0.8s forwards',
            }}
          >
            <Link
              href="/shop"
              style={{
                display: 'inline-block',
                background: 'var(--ink)',
                color: 'var(--foam)',
                border: '2px solid var(--ink)',
                padding: '14px 32px',
                fontSize: 15,
                fontWeight: 700,
                borderRadius: 'var(--radius-pill)',
                textDecoration: 'none',
                transition: 'background 0.2s, color 0.2s',
              }}
              onMouseEnter={undefined}
            >
              {t('cta')}
            </Link>
            <Link
              href="/partners"
              style={{
                display: 'inline-block',
                background: 'transparent',
                color: 'var(--ink)',
                border: '2px solid rgba(14,14,16,0.25)',
                padding: '14px 32px',
                fontSize: 15,
                fontWeight: 700,
                borderRadius: 'var(--radius-pill)',
                textDecoration: 'none',
                transition: 'border-color 0.2s',
              }}
            >
              {t('ctaPartner')}
            </Link>
          </div>
        </div>

        {/* Right: whale (desktop only) */}
        <div className="hero-whale">
          <WhaleHero />
        </div>

      </section>

      {/* ── BEER LINEUP ──────────────────────────────────────── */}
      <section className="site-section" style={{ padding: '100px 48px' }} id="beers">
        <ScrollReveal>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--ink-soft)',
              marginBottom: 48,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            {t('beersHeading')}
            <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          </div>
        </ScrollReveal>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
          }}
          className="beer-grid"
        >
          {homeBeers.map((beer, i) => {
            const beerText = pickBeerText(beer, locale)
            return (
            <ScrollReveal key={beer.id} delay={i + 1}>
              <Link
                href={`/beers/${beer.slug}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  borderRadius: 8,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  position: 'relative',
                  aspectRatio: '3/4',
                  textDecoration: 'none',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  border: '4px solid var(--ink)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  background: beer.accentHex,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-6px)'
                  e.currentTarget.style.boxShadow = '0 24px 48px rgba(0,0,0,0.18)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'
                }}
              >
                {/* Full-bleed card crop */}
                <BeerLabel beer={beer} variant="panel" preferCard nameOverride={beerText.name} />

                {/* Gradient overlay for text legibility */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(transparent 35%, rgba(0,0,0,0.72))',
                    zIndex: 1,
                    pointerEvents: 'none',
                  }}
                />

                {/* Content */}
                <div
                  style={{
                    position: 'relative',
                    zIndex: 2,
                    padding: '28px 24px',
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>
                    {beerText.style}
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: 'white', lineHeight: 1.1, marginBottom: 4 }}>
                    {beerText.name}
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                    {beer.abv}% ABV
                  </div>
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: 16,
                      background: 'white',
                      color: 'var(--ink)',
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      padding: '8px 16px',
                      borderRadius: 2,
                    }}
                  >
                    {t('viewBeer')}
                  </span>
                </div>
              </Link>
            </ScrollReveal>
          )})}
        </div>

        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <Link
            href="/beers"
            style={{
              display: 'inline-block',
              border: '2px solid var(--ink)',
              color: 'var(--ink)',
              padding: '13px 28px',
              fontSize: 14,
              fontWeight: 700,
              borderRadius: 'var(--radius-pill)',
              textDecoration: 'none',
              transition: 'background 0.2s, color 0.2s',
              letterSpacing: '0.02em',
            }}
            onMouseEnter={undefined}
          >
            {t('allBeers')}
          </Link>
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────────── */}
      <section
        style={{
          background: 'var(--aubergine-deep)',
          padding: '80px 48px',
          display: 'grid',
          gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
          position: 'relative',
          overflow: 'hidden',
        }}
        className="stats-grid"
      >
        {stats.map((stat, i) => (
          <div
            key={STAT_KEYS[i]}
            style={{
              textAlign: 'center',
              padding: '20px 40px',
              position: 'relative',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'clamp(52px, 6vw, 80px)',
                fontWeight: 900,
                color: 'white',
                lineHeight: 1,
                letterSpacing: '-0.03em',
              }}
            >
              {stat.value}
              {stat.unit && (
                <sup style={{ fontSize: '0.4em', fontWeight: 300, verticalAlign: 'super', opacity: 0.6 }}>
                  {stat.unit}
                </sup>
              )}
            </div>
            <div style={{ fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', marginTop: 10, textTransform: 'uppercase' }}>
              {tStats(STAT_KEYS[i])}
            </div>
          </div>
        ))}
      </section>

      {/* ── ORIGIN STORY ─────────────────────────────────────── */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: '5fr 4fr',
          gap: 80,
          padding: '120px 48px',
          alignItems: 'center',
        }}
        id="about"
        className="story-section"
      >
        <ScrollReveal>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--ink-soft)',
                marginBottom: 48,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              {t('storyHeading')}
              <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
            </div>

            <h2
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'clamp(36px, 4vw, 52px)',
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                marginBottom: 28,
              }}
            >
              {t('storyTitle')}
            </h2>

            <p style={{ fontSize: 17, fontWeight: 300, color: 'var(--ink-soft)', lineHeight: 1.75, marginBottom: 28 }}>
              {t('storyP1')}
            </p>
            <p style={{ fontSize: 17, fontWeight: 300, color: 'var(--ink-soft)', lineHeight: 1.75, marginBottom: 40 }}>
              {t('storyP2')}
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                paddingTop: 32,
                borderTop: '1px solid var(--line)',
              }}
            >
              <span style={{ fontSize: 28, lineHeight: 1 }}>🇧🇬 🇳🇱</span>
              <div>
                <strong style={{ fontSize: 14, fontWeight: 600 }}>{t('founders')}</strong><br />
                <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{t('foundersRole')}</span>
              </div>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={2}>
          <div
            style={{
              borderRadius: 8,
              overflow: 'hidden',
              aspectRatio: '4/5',
              background: 'var(--paper)',
              border: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, opacity: 0.3 }}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="4" y="8" width="40" height="32" rx="4" stroke="currentColor" strokeWidth="2" />
                <circle cx="17" cy="21" r="5" stroke="currentColor" strokeWidth="2" />
                <path d="M 4 36 L 16 26 L 24 33 L 32 24 L 44 36" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
              <span style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{t('breweryPhoto')}</span>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ── SEASONAL SPOTLIGHT ───────────────────────────────── */}
      <ScrollReveal>
        <div
          style={{
            margin: '0 48px',
            borderRadius: 12,
            background: seasonal.accentHex,
            padding: '80px 64px',
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            alignItems: 'center',
            gap: 60,
            position: 'relative',
            overflow: 'hidden',
          }}
          className="seasonal-card"
        >
          {/* Circle decoration */}
          <div
            style={{
              position: 'absolute',
              right: -60, top: -60,
              width: 300, height: 300,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.12)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <span
              style={{
                display: 'inline-block',
                background: 'rgba(0,0,0,0.15)',
                color: 'rgba(0,0,0,0.7)',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                padding: '6px 14px',
                borderRadius: 100,
                marginBottom: 20,
              }}
            >
              {t('seasonalLabel')}
            </span>

            <h2
              style={{
                fontSize: 'clamp(36px, 4vw, 54px)',
                fontWeight: 900,
                color: 'var(--ink)',
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
                marginBottom: 16,
              }}
            >
              {seasonalText.name}
            </h2>

            <p
              style={{
                fontSize: 17,
                fontWeight: 300,
                color: 'rgba(0,0,0,0.6)',
                lineHeight: 1.6,
                marginBottom: 36,
                maxWidth: 440,
              }}
            >
              {seasonalText.tagline} {t('seasonalLimited')}
            </p>

            <Link
              href={`/beers/${seasonal.slug}`}
              style={{
                display: 'inline-block',
                background: 'var(--ink)',
                color: 'white',
                padding: '14px 28px',
                fontSize: 14,
                fontWeight: 700,
                borderRadius: 'var(--radius-pill)',
                textDecoration: 'none',
                transition: 'transform 0.2s',
              }}
            >
              {t('discoverBeer', { name: seasonalText.name })}
            </Link>
          </div>

          <div className="desktop-only" style={{ flexShrink: 0 }}>
            <BeerLabel beer={seasonal} size="lg" preferCard nameOverride={seasonalText.name} style={{ width: 160, height: 240, borderRadius: 8, overflow: 'hidden', border: '4px solid var(--ink)' }} />
          </div>
        </div>
      </ScrollReveal>

      {/* ── LOCATIONS TEASER ─────────────────────────────────── */}
      <section
        style={{
          padding: '100px 48px',
        }}
        id="locations"
        className="locations-section"
      >
        <ScrollReveal>
          <div
            className="locations-header"
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 32,
              marginBottom: 48,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: '1 1 320px', minWidth: 0, maxWidth: 720 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-soft)',
                  marginBottom: 24,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                {t('venuesHeading')}
                <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
              </div>

              <h2
                style={{
                  fontSize: 'clamp(36px, 4vw, 52px)',
                  fontWeight: 700,
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                  marginBottom: 20,
                }}
              >
                {t('venuesTitle', { count: activeVenues.length || '…' })}
              </h2>

              <p style={{ fontSize: 16, color: 'var(--ink-soft)', lineHeight: 1.65, margin: 0 }}>
                {t('venuesBody')}
              </p>
            </div>

            <Link
              href="/locations"
              style={{
                display: 'inline-block',
                flexShrink: 0,
                border: '2px solid var(--ink)',
                color: 'var(--ink)',
                padding: '13px 28px',
                fontSize: 14,
                fontWeight: 700,
                borderRadius: 'var(--radius-pill)',
                textDecoration: 'none',
                transition: 'background 0.2s, color 0.2s',
                alignSelf: 'flex-end',
              }}
            >
              {t('venuesCta')}
            </Link>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={2}>
          <div
            className="locations-card-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 16,
            }}
          >
            {activeVenues.map((venue) => (
              <a
                key={venue.id}
                href={venue.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="location-card"
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
                  minHeight: 120,
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.25 }}>{venue.name}</span>
                  <span style={{ opacity: 0.35, fontSize: 16, flexShrink: 0 }}>→</span>
                </div>
                <span
                  style={{
                    marginTop: 'auto',
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--ink-soft)',
                  }}
                >
                  {venue.subtitle}
                </span>
              </a>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* ── B2B STRIP ─────────────────────────────────────────── */}
      <ScrollReveal>
        <div
          style={{
            margin: '0 48px 100px',
            background: 'rgba(14,14,16,0.06)',
            borderRadius: 8,
            padding: '56px 64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 40,
            border: '1px solid var(--line)',
          }}
          className="b2b-strip"
        >
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 10 }}>
              {t('partnersEyebrow')}
            </div>
            <h3 style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: 12 }}>
              {t('partnersTitle')}
            </h3>
            <p style={{ fontSize: 15, color: 'var(--ink-soft)', fontWeight: 300, maxWidth: 440, lineHeight: 1.6 }}>
              {t('partnersBody')}
            </p>
          </div>

          <Link
            href="/partners"
            style={{
              display: 'inline-block',
              flexShrink: 0,
              background: 'var(--ink)',
              color: 'var(--foam)',
              border: '2px solid var(--ink)',
              padding: '14px 28px',
              fontSize: 15,
              fontWeight: 700,
              borderRadius: 'var(--radius-pill)',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            {t('partnersCta')}
          </Link>
        </div>
      </ScrollReveal>

    </>
  )
}
