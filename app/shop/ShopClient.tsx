'use client'

import type { CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCart } from '@/contexts/CartContext'
import type { Beer } from '@/lib/data'
import { useLocale } from '@/components/LocaleProvider'
import { pickBeerText } from '@/lib/locale-content'
import { BeerLabel } from '@/components/beer/BeerLabel'
import { MINIMUM_CANS, VAT_RATE } from '@/lib/shop'

interface Props {
  beers: Beer[]
}

export function ShopClient({ beers }: Props) {
  const t = useTranslations('Shop')
  const router = useRouter()
  const { locale } = useLocale()
  const { cart, addToCart, removeFromCart, setQuantity, totalItems } = useCart()

  const subtotal = beers.reduce((sum, b) => sum + (cart[b.id] ?? 0) * (b.priceB2C ?? 0), 0)
  const vat = subtotal * VAT_RATE
  const total = subtotal + vat

  function handleCheckout() {
    if (totalItems < MINIMUM_CANS) return
    router.push('/shop/checkout/')
  }

  return (
    <div style={{ padding: '40px 48px 80px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 40, alignItems: 'start' }} className="shop-layout">
      <div>
        {beers.map((beer) => {
          const beerText = pickBeerText(beer, locale)
          const qty = cart[beer.id] ?? 0
          return (
            <div
              key={beer.id}
              className="shop-product-row"
              style={{
                padding: '20px 0',
                borderBottom: '1px solid var(--line)',
              }}
            >
              <BeerLabel beer={beer} size="sm" variant="card" preferCard nameOverride={beerText.name} style={{ width: 56, height: 80, borderRadius: 4 }} />

              <div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 4 }}>
                  {beerText.style}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{beerText.name}</h3>
                <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)' }}>
                  {beer.abv}% · {beer.plato}° · {beer.ml.map((m) => `${m}ml`).join(' / ')}
                </div>
              </div>

              <div style={{ textAlign: 'right', minWidth: 64 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>€{beer.priceB2C?.toFixed(2)}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{t('perCan')}</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => removeFromCart(beer.id)}
                  style={qtyBtnStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--ink)'
                    e.currentTarget.style.background = 'var(--ink)'
                    e.currentTarget.style.color = 'white'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--line)'
                    e.currentTarget.style.background = 'white'
                    e.currentTarget.style.color = 'var(--ink)'
                  }}
                >
                  −
                </button>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  aria-label={`${beerText.name} quantity`}
                  value={qty}
                  onChange={(e) => {
                    const raw = e.target.value
                    if (raw === '') {
                      setQuantity(beer.id, 0)
                      return
                    }
                    setQuantity(beer.id, Number(raw))
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') setQuantity(beer.id, 0)
                  }}
                  style={{
                    width: 56,
                    height: 32,
                    textAlign: 'center',
                    fontSize: 16,
                    fontWeight: 700,
                    fontFamily: 'var(--font-sans)',
                    border: '1.5px solid var(--line)',
                    borderRadius: 5,
                    background: 'white',
                    color: 'var(--ink)',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => addToCart(beer.id)}
                  style={qtyBtnStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--ink)'
                    e.currentTarget.style.background = 'var(--ink)'
                    e.currentTarget.style.color = 'white'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--line)'
                    e.currentTarget.style.background = 'white'
                    e.currentTarget.style.color = 'var(--ink)'
                  }}
                >
                  +
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ position: 'sticky', top: 88 }}>
        <div
          style={{
            background: 'var(--paper)',
            border: '1px solid var(--line)',
            borderRadius: 2,
            padding: '28px',
          }}
        >
          <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 20 }}>
            {t('orderSummary')}
          </h2>

          {totalItems === 0 ? (
            <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 20 }}>
              {t('empty', { min: MINIMUM_CANS })}
            </p>
          ) : (
            <>
              {beers.filter((b) => (cart[b.id] ?? 0) > 0).map((b) => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '6px 0', color: 'var(--ink-soft)' }}>
                  <span>{b.name} × {cart[b.id]}</span>
                  <span>€{((cart[b.id] ?? 0) * (b.priceB2C ?? 0)).toFixed(2)}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--line)', marginTop: 12, paddingTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--ink-soft)', marginBottom: 6 }}>
                  <span>{t('subtotal')}</span>
                  <span>€{subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--ink-soft)', marginBottom: 12 }}>
                  <span>{t('vat')}</span>
                  <span>€{vat.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700 }}>
                  <span>{t('total')}</span>
                  <span>€{total.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}

          {totalItems < MINIMUM_CANS && totalItems > 0 && (
            <div
              style={{
                background: '#FFF9E6',
                border: '1px solid #E8D48A',
                borderRadius: 2,
                padding: '10px 14px',
                fontSize: 12,
                color: '#7A6010',
                marginTop: 12,
              }}
            >
              {t('moreCans', { n: MINIMUM_CANS - totalItems })}
            </div>
          )}

          <button
            type="button"
            onClick={handleCheckout}
            disabled={totalItems < MINIMUM_CANS}
            style={{
              display: 'block',
              width: '100%',
              marginTop: 20,
              background: totalItems >= MINIMUM_CANS ? 'var(--ink)' : 'rgba(14,14,16,0.15)',
              color: totalItems >= MINIMUM_CANS ? 'var(--foam)' : 'var(--ink-soft)',
              border: `2px solid ${totalItems >= MINIMUM_CANS ? 'var(--ink)' : 'transparent'}`,
              padding: '14px 24px',
              fontSize: 15,
              fontWeight: 700,
              borderRadius: 'var(--radius-pill)',
              cursor: totalItems >= MINIMUM_CANS ? 'pointer' : 'not-allowed',
              transition: 'background 0.2s, color 0.2s',
              fontFamily: 'var(--font-sans)',
              letterSpacing: '0.02em',
            }}
          >
            {totalItems >= MINIMUM_CANS ? t('checkout') : t('addMinimum', { min: MINIMUM_CANS })}
          </button>

          <p style={{ marginTop: 16, fontSize: 12, color: 'var(--ink-soft)', textAlign: 'center', lineHeight: 1.5 }}>
            {t('deliveryNote')}
          </p>
        </div>
      </div>
    </div>
  )
}

const qtyBtnStyle: CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: '50%',
  border: '1.5px solid var(--line)',
  background: 'white',
  fontSize: 18,
  fontWeight: 300,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  lineHeight: 1,
  transition: 'border-color 0.2s, background 0.2s, color 0.2s',
  color: 'var(--ink)',
  flexShrink: 0,
}
