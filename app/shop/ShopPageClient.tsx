'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { Beer } from '@/lib/data'
import { ShopClient } from './ShopClient'
import { fetchPublicProducts, matchBeerProduct } from '@/lib/public-api'

interface Props {
  beers: Beer[]
}

export type ShopBeer = Beer & { productId?: string; shopAvailable: boolean }

export function ShopPageClient({ beers }: Props) {
  const t = useTranslations('Shop')
  const [shopBeers, setShopBeers] = useState<ShopBeer[]>(() =>
    beers
      .filter((b) => b.shopListed !== false && b.priceB2C != null)
      .map((b) => ({ ...b, shopAvailable: true }))
  )
  const [catalogReady, setCatalogReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchPublicProducts()
      .then(({ products }) => {
        if (cancelled) return
        const next: ShopBeer[] = []
        for (const beer of beers) {
          const match = matchBeerProduct(beer, products)
          const erpPrice =
            match?.unit_price_eur ??
            (match?.b2c_unit_price_eur_cents != null
              ? match.b2c_unit_price_eur_cents / 100
              : null)
          if (match && erpPrice != null) {
            next.push({
              ...beer,
              priceB2C: erpPrice,
              productId: match.id,
              shopAvailable: true,
            })
          }
        }
        // ERP is source of truth for what's buyable: only priced B2C SKUs.
        setShopBeers(next)
        setCatalogReady(true)
      })
      .catch(() => {
        if (cancelled) return
        // Offline fallback: marketing shopListed + priceB2C
        setShopBeers(
          beers
            .filter((b) => b.shopListed !== false && b.priceB2C != null)
            .map((b) => ({ ...b, shopAvailable: true }))
        )
        setCatalogReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [beers])

  return (
    <div style={{ paddingTop: 72 }}>
      <section className="page-pad" style={{ padding: '60px 48px 40px', borderBottom: '1px solid var(--line)' }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 16 }}>{t('eyebrow')}</p>
        <h1 style={{ fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 900, lineHeight: 0.95, letterSpacing: '-0.03em', marginBottom: 16 }}>{t('heading')}</h1>
        <p style={{ fontSize: 16, fontWeight: 300, color: 'var(--ink-soft)', lineHeight: 1.6, maxWidth: 480, marginBottom: 24 }}>{t('sub')}</p>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>
          <span>{t('legalStrip')}</span>
        </div>
      </section>

      {catalogReady && shopBeers.length === 0 ? (
        <p className="page-pad" style={{ padding: '40px 48px', color: 'var(--ink-soft)' }}>
          {t('catalogEmpty')}
        </p>
      ) : (
        <ShopClient beers={shopBeers} />
      )}
    </div>
  )
}
