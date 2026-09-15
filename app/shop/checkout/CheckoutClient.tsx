'use client'

import type { CSSProperties, FormEvent, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Turnstile } from '@marsidev/react-turnstile'
import { useCart } from '@/contexts/CartContext'
import { beers as allBeers } from '@/lib/data'
import { fetchPublicProducts, matchBeerProduct, type PublicProduct } from '@/lib/public-api'
import { MINIMUM_CANS, VAT_RATE } from '@/lib/shop'

type Line = {
  beerId: string
  name: string
  quantity: number
  unitPriceEur: number
  productId: string
}

export function CheckoutClient() {
  const t = useTranslations('Checkout')
  const shopT = useTranslations('Shop')
  const router = useRouter()
  const { cart, clearCart, totalItems, hydrated } = useCart()

  const [products, setProducts] = useState<PublicProduct[]>([])
  const [nra, setNra] = useState<string | null>(null)
  const [catalogError, setCatalogError] = useState('')
  const [loadingCatalog, setLoadingCatalog] = useState(true)

  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [line1, setLine1] = useState('')
  const [city, setCity] = useState('Sofia')
  const [postalCode, setPostalCode] = useState('')
  const [notes, setNotes] = useState('')
  const [ageOk, setAgeOk] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [orderNumber, setOrderNumber] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchPublicProducts()
      .then(({ products, nra_store_reg_number }) => {
        if (cancelled) return
        setProducts(products)
        if (nra_store_reg_number) setNra(nra_store_reg_number)
      })
      .catch((err) => {
        if (!cancelled) {
          setCatalogError(err instanceof Error ? err.message : 'Could not load catalog')
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingCatalog(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const lines: Line[] = useMemo(() => {
    const result: Line[] = []
    for (const beer of allBeers) {
      const qty = cart[beer.id] ?? 0
      if (qty <= 0) continue
      const match = matchBeerProduct(beer, products)
      if (!match?.id) continue
      const unit =
        match.unit_price_eur ??
        (match.b2c_unit_price_eur_cents != null ? match.b2c_unit_price_eur_cents / 100 : beer.priceB2C ?? 0)
      result.push({
        beerId: beer.id,
        name: beer.name,
        quantity: qty,
        unitPriceEur: unit,
        productId: match.id,
      })
    }
    return result
  }, [cart, products])

  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPriceEur, 0)
  const vat = subtotal * VAT_RATE
  const total = subtotal + vat
  const lineQty = lines.reduce((s, l) => s + l.quantity, 0)

  useEffect(() => {
    if (!hydrated) return
    if (totalItems === 0 && !orderNumber) {
      router.replace('/shop/')
    }
  }, [hydrated, totalItems, orderNumber, router])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')

    if (lineQty < MINIMUM_CANS) {
      setFormError(shopT('empty', { min: MINIMUM_CANS }))
      return
    }
    if (lines.length === 0) {
      setFormError(t('missingProducts'))
      return
    }
    if (!ageOk) {
      setFormError(t('ageRequired'))
      return
    }
    if (!captchaToken) {
      setFormError(t('captchaRequired'))
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/b2c/orders/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkbox_18plus: true,
          captcha_token: captchaToken,
          contact_email: email.trim(),
          contact_phone: phone.trim() || undefined,
          notes: notes.trim() || undefined,
          delivery_address: {
            line1: line1.trim(),
            line2: null,
            city: city.trim(),
            postal_code: postalCode.trim(),
            country: 'BG',
          },
          lines: lines.map((l) => ({
            product_id: l.productId,
            quantity: l.quantity,
          })),
        }),
      })

      const body = await res.json().catch(() => null)
      if (res.status === 429) {
        const retry = res.headers.get('Retry-After') ?? '60'
        setFormError(t('rateLimited', { seconds: retry }))
        return
      }
      if (!res.ok) {
        setFormError(body?.error?.message ?? t('submitFailed'))
        return
      }

      setOrderNumber(body?.order_number ?? body?.order_id ?? 'OK')
      if (body?.nra_store_reg_number) setNra(String(body.nra_store_reg_number))
      clearCart()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('submitFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  if (orderNumber) {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '48px 24px 80px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12 }}>{t('successTitle')}</h1>
        <p style={{ fontSize: 15, color: 'var(--ink-soft)', marginBottom: 8 }}>{t('successBody')}</p>
        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 28 }}>
          {t('orderRef', { ref: orderNumber })}
        </p>
        {nra && (
          <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 28 }}>
            NRA reg. No.: {nra}
          </p>
        )}
        <Link
          href="/shop/"
          style={{
            display: 'inline-block',
            background: 'var(--ink)',
            color: 'var(--foam)',
            padding: '12px 24px',
            borderRadius: 'var(--radius-pill)',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          {t('backToShop')}
        </Link>
      </div>
    )
  }

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '40px 24px 80px' }}>
      <Link href="/shop/" style={{ fontSize: 13, color: 'var(--ink-soft)', textDecoration: 'none' }}>
        ← {t('backToShop')}
      </Link>
      <h1 style={{ fontSize: 36, fontWeight: 800, margin: '16px 0 8px' }}>{t('heading')}</h1>
      <p style={{ fontSize: 15, color: 'var(--ink-soft)', marginBottom: 32 }}>{t('sub')}</p>

      {(formError || catalogError) && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 5, padding: '12px 16px', color: '#991B1B', fontSize: 13, marginBottom: 20 }}>
          {formError || catalogError}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 32, alignItems: 'start' }} className="shop-layout">
        <form onSubmit={(e) => void onSubmit(e)} style={{ display: 'grid', gap: 16 }}>
          <Field label={t('email')} required>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} autoComplete="email" />
          </Field>
          <Field label={t('phone')}>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} autoComplete="tel" />
          </Field>
          <Field label={t('address')} required>
            <input type="text" required value={line1} onChange={(e) => setLine1(e.target.value)} style={inputStyle} autoComplete="street-address" />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label={t('city')} required>
              <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle} autoComplete="address-level2" />
            </Field>
            <Field label={t('postal')} required>
              <input type="text" required value={postalCode} onChange={(e) => setPostalCode(e.target.value)} style={inputStyle} autoComplete="postal-code" />
            </Field>
          </div>
          <Field label={t('notes')}>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </Field>

          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, lineHeight: 1.4 }}>
            <input type="checkbox" checked={ageOk} onChange={(e) => setAgeOk(e.target.checked)} style={{ marginTop: 3 }} />
            <span>{t('ageConfirm')}</span>
          </label>

          {siteKey ? (
            <Turnstile siteKey={siteKey} onSuccess={setCaptchaToken} onExpire={() => setCaptchaToken('')} options={{ theme: 'light' }} />
          ) : (
            <p style={{ fontSize: 13, color: '#991B1B' }}>{t('captchaMissing')}</p>
          )}

          <button
            type="submit"
            disabled={submitting || loadingCatalog || lineQty < MINIMUM_CANS || !siteKey}
            style={{
              ...btnStyle,
              opacity: submitting || loadingCatalog || lineQty < MINIMUM_CANS || !siteKey ? 0.6 : 1,
              cursor: submitting ? 'wait' : 'pointer',
            }}
          >
            {submitting ? t('submitting') : t('placeOrder')}
          </button>
        </form>

        <aside style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 2, padding: 24 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 16 }}>
            {shopT('orderSummary')}
          </h2>
          {loadingCatalog ? (
            <p style={{ fontSize: 14, color: 'var(--ink-soft)' }}>{t('loading')}</p>
          ) : lines.length === 0 ? (
            <p style={{ fontSize: 14, color: 'var(--ink-soft)' }}>{t('missingProducts')}</p>
          ) : (
            <>
              {lines.map((l) => (
                <div key={l.beerId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '6px 0', color: 'var(--ink-soft)' }}>
                  <span>{l.name} × {l.quantity}</span>
                  <span>€{(l.quantity * l.unitPriceEur).toFixed(2)}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--line)', marginTop: 12, paddingTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--ink-soft)', marginBottom: 6 }}>
                  <span>{shopT('subtotal')}</span>
                  <span>€{subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--ink-soft)', marginBottom: 12 }}>
                  <span>{shopT('vat')}</span>
                  <span>€{vat.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700 }}>
                  <span>{shopT('total')}</span>
                  <span>€{total.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
          {nra && (
            <p style={{ marginTop: 16, fontSize: 11, color: 'var(--ink-soft)' }}>NRA reg. No.: {nra}</p>
          )}
        </aside>
      </div>
    </div>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 600 }}>
        {label}
        {required ? ' *' : ''}
      </span>
      {children}
    </label>
  )
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  border: '1.5px solid var(--line)',
  borderRadius: 5,
  fontFamily: 'var(--font-sans)',
  fontSize: 15,
  color: 'var(--ink)',
  background: 'white',
  outline: 'none',
}

const btnStyle: CSSProperties = {
  marginTop: 8,
  background: 'var(--ink)',
  color: 'var(--foam)',
  border: '2px solid var(--ink)',
  padding: '14px 24px',
  fontSize: 15,
  fontWeight: 700,
  borderRadius: 'var(--radius-pill)',
  fontFamily: 'var(--font-sans)',
}
