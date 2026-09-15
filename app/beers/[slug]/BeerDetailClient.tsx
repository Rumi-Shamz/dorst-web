'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { Beer } from '@/lib/data'
import { useLocale } from '@/components/LocaleProvider'
import { pickBeerText } from '@/lib/locale-content'
import { BeerLabel } from '@/components/beer/BeerLabel'
import { assetPath } from '@/lib/asset-path'
import Image from 'next/image'

interface Props {
  beer: Beer
  relatedBeers: Beer[]
}

const TAG_PILL: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  padding: '6px 14px',
  border: '1.5px solid var(--ink)',
  borderRadius: 'var(--radius-pill)',
  color: 'var(--ink)',
  background: 'var(--foam)',
}

const HOP_PILL: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  padding: '6px 14px',
  background: 'rgba(255,255,255,0.22)',
  border: '1.5px solid rgba(14,14,16,0.35)',
  borderRadius: 'var(--radius-pill)',
  color: 'var(--ink)',
}

export function BeerDetailClient({ beer, relatedBeers }: Props) {
  const t = useTranslations('Beers')
  const { locale } = useLocale()
  const text = pickBeerText(beer, locale)
  const fullLabel = beer.labelSrc && beer.labelType === 'image' ? beer.labelSrc : beer.labelCardSrc

  const bottomStats = [
    { label: t('abv'), value: `${beer.abv}%` },
    { label: t('plato'), value: `${beer.plato}°` },
    ...(beer.ibu ? [{ label: t('ibu'), value: String(beer.ibu) }] : []),
    { label: t('serve'), value: beer.serveTemp },
    { label: t('size'), value: beer.ml.map(m => `${m}ml`).join(' / ') },
    { label: t('glass'), value: beer.glass },
  ]

  return (
    <div style={{ paddingTop: 72 }}>
      <section
        className="beer-hero"
        style={{
          background: beer.accentHex,
          minHeight: 'calc(100vh - 72px)',
          maxHeight: 'calc(100vh - 72px)',
          padding: '40px 48px 28px',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Main row: left copy + right label */}
        <div
          className="beer-hero-main"
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: fullLabel ? 'minmax(280px, 1fr) minmax(320px, 1.15fr)' : '1fr',
            gap: 40,
            alignItems: 'center',
            minHeight: 0,
          }}
        >
          <div style={{ position: 'relative', zIndex: 2, maxWidth: 520 }}>
            {beer.seasonal && (
              <span style={{
                display: 'inline-block',
                marginBottom: 14,
                background: 'var(--foam)',
                color: 'var(--ink)',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                padding: '5px 12px',
                borderRadius: 100,
                border: '1.5px solid var(--ink)',
              }}>
                {t('seasonal')}
              </span>
            )}

            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: `${beer.contrastHex}99`, marginBottom: 12 }}>
              {text.style}
            </p>
            <h1 style={{ fontSize: 'clamp(42px, 6vw, 72px)', fontWeight: 900, lineHeight: 0.95, letterSpacing: '-0.03em', color: beer.contrastHex, marginBottom: 16 }}>
              {text.name}
            </h1>
            <p style={{ fontSize: 17, fontWeight: 300, color: `${beer.contrastHex}CC`, lineHeight: 1.55, marginBottom: 28, maxWidth: 440 }}>
              {text.tagline}
            </p>

            {beer.tags.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {beer.tags.map(tag => (
                  <span key={tag} style={TAG_PILL}>
                    {t(`tags.${tag}`)}
                  </span>
                ))}
              </div>
            )}

            {beer.hops.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <h3 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: `${beer.contrastHex}99`, marginBottom: 12 }}>
                  {t('hops')}
                </h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {beer.hops.map(hop => (
                    <span key={hop} style={HOP_PILL}>{hop}</span>
                  ))}
                </div>
              </div>
            )}

            {(beer.format === 'can' || beer.format === 'both') &&
              beer.shopListed !== false &&
              beer.priceB2C && (
              <Link
                href={`/shop?beer=${beer.slug}`}
                style={{
                  display: 'inline-block',
                  background: 'var(--ink)',
                  color: 'var(--foam)',
                  border: '2px solid var(--ink)',
                  padding: '13px 26px',
                  fontSize: 15,
                  fontWeight: 700,
                  borderRadius: 'var(--radius-pill)',
                  textDecoration: 'none',
                  letterSpacing: '0.02em',
                }}
              >
                {t('addToCart', { price: beer.priceB2C.toFixed(2) })}
              </Link>
            )}
          </div>

          <div
            className="beer-hero-label"
            style={{
              position: 'relative',
              height: '100%',
              minHeight: 280,
              maxHeight: 'calc(100vh - 220px)',
              zIndex: 1,
            }}
          >
            {fullLabel ? (
              <div
                className="beer-label-merge"
                style={{ position: 'absolute', inset: '-6% -4% -8% -2%', '--merge-accent': beer.accentHex } as React.CSSProperties}
              >
                <Image
                  src={assetPath(fullLabel)}
                  alt={`${text.name} label`}
                  fill
                  style={{ objectFit: 'contain', objectPosition: 'center right' }}
                  sizes="(max-width: 900px) 100vw, 55vw"
                  priority
                />
              </div>
            ) : (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BeerLabel beer={beer} size="hero" nameOverride={text.name} />
              </div>
            )}
          </div>
        </div>

        {/* Bottom stats bar inside colour strip */}
        <div
          className="beer-hero-footer"
          style={{
            position: 'relative',
            zIndex: 2,
            marginTop: 24,
            paddingTop: 18,
            borderTop: `1px solid ${beer.contrastHex}33`,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 20,
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 28px' }}>
            {bottomStats.map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: `${beer.contrastHex}88`, marginBottom: 4 }}>
                  {label}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: beer.contrastHex, letterSpacing: '-0.02em' }}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/beers"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: beer.contrastHex,
              textDecoration: 'none',
              opacity: 0.75,
              whiteSpace: 'nowrap',
            }}
          >
            {t('backToAll')}
          </Link>
        </div>
      </section>

      {/* Light background: history + pairing only */}
      <section className="page-pad" style={{ padding: '56px 48px 72px', maxWidth: 860 }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 20, letterSpacing: '-0.01em' }}>{t('story')}</h2>
        <p style={{ fontSize: 17, fontWeight: 300, lineHeight: 1.75, color: 'var(--ink-soft)', marginBottom: 48 }}>{text.story}</p>

        <h3 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 12 }}>{t('pairing')}</h3>
        <p style={{ fontSize: 15, color: 'var(--ink-soft)', lineHeight: 1.6 }}>{text.pairing}</p>
      </section>

      {relatedBeers.length > 0 && (
        <section className="page-pad" style={{ padding: '40px 48px 80px', borderTop: '1px solid var(--line)' }}>
          <h3 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 24 }}>{t('moreBeers')}</h3>
          <div className="related-beers-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {relatedBeers.map(b => {
              const rel = pickBeerText(b, locale)
              return (
                <Link key={b.id} href={`/beers/${b.slug}`} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 2, textDecoration: 'none', color: 'var(--ink)' }} className="related-beer-link">
                  <BeerLabel beer={b} size="sm" variant="card" preferCard nameOverride={rel.name} style={{ width: 48, height: 64, borderRadius: 4 }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{rel.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-soft)', letterSpacing: '0.08em' }}>{b.abv}% · {rel.style}</div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      <style>{`
        .beer-label-merge {
          -webkit-mask-image:
            linear-gradient(to right, transparent 0%, #000 8%, #000 92%, transparent 100%),
            linear-gradient(to bottom, transparent 0%, #000 10%, #000 90%, transparent 100%);
          mask-image:
            linear-gradient(to right, transparent 0%, #000 8%, #000 92%, transparent 100%),
            linear-gradient(to bottom, transparent 0%, #000 10%, #000 90%, transparent 100%);
          -webkit-mask-composite: source-in;
          mask-composite: intersect;
          filter: drop-shadow(0 0 28px color-mix(in srgb, var(--merge-accent) 55%, transparent));
        }
        .related-beer-link:hover { border-color: var(--ink) !important; }
        @media (max-width: 900px) {
          .beer-hero {
            max-height: none !important;
            min-height: auto !important;
            padding: 32px 24px 24px !important;
          }
          .beer-hero-main {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .beer-hero-label {
            min-height: 220px !important;
            max-height: 280px !important;
          }
        }
        @media (max-width: 640px) {
          .related-beers-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
