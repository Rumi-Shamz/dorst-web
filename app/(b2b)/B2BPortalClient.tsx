'use client'

import { useState, useReducer, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { WhaleSVG } from '@/components/whale/WhaleSVG'
import { DorstLogo } from '@/components/brand/DorstLogo'
import {
  checkAvailability,
  clearPartnerSession,
  downloadInvoicePdf,
  fetchPartnerInvoices,
  fetchPartnerMe,
  fetchPartnerOrders,
  fetchPartnerProducts,
  getPartnerToken,
  partnerLogin,
  placePartnerOrder,
  PARTNER_CATALOG_GROUPS,
  productGroup,
  registerConfirm,
  registerLookup,
  resendPartnerPassword,
  setPartnerSession,
  validateDiscount,
  volumeUnitLabel,
  type PartnerInvoiceSummary,
  type PartnerOrderSummary,
  type PartnerProduct,
  type RegistryDraft,
} from '@/lib/partner-api'

type QtyState = Record<string, number>
type QtyAction = { type: 'SET'; id: string; qty: number } | { type: 'CLEAR' }

function qtyReducer(state: QtyState, action: QtyAction): QtyState {
  if (action.type === 'CLEAR') return {}
  return { ...state, [action.id]: Math.max(0, action.qty) }
}

type Screen = 1 | 2 | 3 | 4 | 5

const STEP_KEYS = ['access', 'verify', 'order', 'payment', 'confirm'] as const

export function B2BPortalClient() {
  const t = useTranslations('B2B')
  const [screen, setScreen] = useState<Screen>(1)
  const [mode, setMode] = useState<'onboard' | 'login'>('onboard')
  const [eikInput, setEikInput] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  const [passwordSent, setPasswordSent] = useState(false)
  const [registryDraft, setRegistryDraft] = useState<RegistryDraft | null>(null)
  const [companyName, setCompanyName] = useState('')
  const [mapsUrl, setMapsUrl] = useState('')
  const [phoneInput, setPhoneInput] = useState('')
  const [products, setProducts] = useState<PartnerProduct[]>([])
  const [deliveryAddress, setDeliveryAddress] = useState<Record<string, string> | null>(null)
  const [qty, dispatchQty] = useReducer(qtyReducer, {})
  const [stockNotes, setStockNotes] = useState<Record<string, string>>({})
  const [discountCode, setDiscountCode] = useState('')
  const [discountCents, setDiscountCents] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | null>(null)
  const [addressConfirmed, setAddressConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [confirmOrder, setConfirmOrder] = useState('')
  const [confirmInvoice, setConfirmInvoice] = useState('')
  const [confirmInvoiceId, setConfirmInvoiceId] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [orders, setOrders] = useState<PartnerOrderSummary[]>([])
  const [invoices, setInvoices] = useState<PartnerInvoiceSummary[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => {
    if (getPartnerToken()) {
      setLoggedIn(true)
      void bootstrapSession()
    }
  }, [])

  async function bootstrapSession() {
    try {
      const [me, catalog] = await Promise.all([fetchPartnerMe(), fetchPartnerProducts()])
      setCompanyName(me.name)
      setEikInput(me.eik ?? '')
      setMapsUrl(me.maps_url ?? '')
      setDeliveryAddress(me.delivery_address)
      setProducts(catalog.products)
      setScreen(3)
    } catch (err) {
      clearPartnerSession()
      setLoggedIn(false)
      setFormError(err instanceof Error ? err.message : 'Session restore failed')
    }
  }

  const catalogProducts = useMemo(
    () => products.filter((p) => productGroup(p.volume_unit, p.name) != null),
    [products]
  )

  const subtotalCents = useMemo(() =>
    catalogProducts.reduce((sum, p) => sum + Math.round((qty[p.id] ?? 0) * p.unit_price_eur_cents), 0),
  [catalogProducts, qty])

  const subtotalAfterDiscount = Math.max(0, subtotalCents - discountCents)
  const vatCents = Math.round(subtotalAfterDiscount * 0.2)
  const totalCents = subtotalAfterDiscount + vatCents

  const groups = useMemo(() => {
    const present = new Set(
      catalogProducts
        .map((p) => productGroup(p.volume_unit, p.name))
        .filter((g): g is NonNullable<typeof g> => g != null)
    )
    return PARTNER_CATALOG_GROUPS.filter((g) => present.has(g))
  }, [catalogProducts])

  async function onRegisterLookup() {
    setFormError('')
    if (!eikInput.trim() || !emailInput.trim()) {
      setFormError('Enter EIK and email')
      return
    }
    setLoading(true)
    try {
      const res = await registerLookup(eikInput.trim(), emailInput.trim())
      if (res.status === 'password_sent') {
        setPasswordSent(true)
        setCompanyName(res.company_name ?? '')
        setMode('login')
      } else if (res.draft) {
        setRegistryDraft(res.draft)
        setCompanyName(res.draft.legal_name)
        setEmailInput(res.draft.email)
        setScreen(2)
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Lookup failed')
    } finally {
      setLoading(false)
    }
  }

  async function onRegisterConfirm() {
    if (!registryDraft) return
    setLoading(true)
    setFormError('')
    try {
      const billing = registryDraft.billing_address ?? {
        line1: companyName,
        city: 'Sofia',
        postal_code: '1000',
        country: 'BG',
      }
      await registerConfirm({
        eik: registryDraft.eik,
        email: emailInput.trim(),
        legal_name: companyName,
        phone: phoneInput || undefined,
        maps_url: mapsUrl || undefined,
        billing_address: billing,
        vat_number: registryDraft.vat_number ?? undefined,
        confirm_details: true,
      })
      setPasswordSent(true)
      setMode('login')
      setScreen(1)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  async function onLogin() {
    setFormError('')
    setLoading(true)
    try {
      const session = await partnerLogin(eikInput.trim(), passwordInput)
      setPartnerSession(session.access_token, session.refresh_token)
      setLoggedIn(true)
      setCompanyName(session.client.name)
      await bootstrapSession()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function onResendPassword() {
    setFormError('')
    if (!eikInput.trim() || !emailInput.trim()) {
      setFormError('Enter EIK and email to resend your password')
      return
    }
    setLoading(true)
    try {
      await resendPartnerPassword(eikInput.trim(), emailInput.trim())
      setPasswordSent(true)
      setMode('login')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not resend password')
    } finally {
      setLoading(false)
    }
  }

  async function loadHistory() {
    setHistoryLoading(true)
    setFormError('')
    try {
      const [o, i] = await Promise.all([fetchPartnerOrders(), fetchPartnerInvoices()])
      setOrders(o.orders)
      setInvoices(i.invoices)
      setShowHistory(true)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not load history')
    } finally {
      setHistoryLoading(false)
    }
  }

  async function onQtyBlur(productId: string) {
    const requested = qty[productId] ?? 0
    if (requested <= 0) {
      setStockNotes((prev) => {
        const next = { ...prev }
        delete next[productId]
        return next
      })
      return
    }
    try {
      const res = await checkAvailability(productId, requested)
      if (res.limited || res.out_of_stock) {
        dispatchQty({ type: 'SET', id: productId, qty: res.adjusted_quantity })
        const name = products.find((p) => p.id === productId)?.name ?? 'Product'
        setStockNotes((prev) => ({
          ...prev,
          [productId]: `${name}: only ${res.available} available — quantity adjusted to ${res.adjusted_quantity}.`,
        }))
      } else {
        setStockNotes((prev) => {
          const next = { ...prev }
          delete next[productId]
          return next
        })
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Stock check failed')
    }
  }

  async function applyDiscount() {
    if (!discountCode.trim()) {
      setDiscountCents(0)
      return
    }
    try {
      const res = await validateDiscount(discountCode.trim(), subtotalCents)
      setDiscountCents(res.discount_eur_cents)
    } catch (err) {
      setDiscountCents(0)
      setFormError(err instanceof Error ? err.message : 'Invalid discount code')
    }
  }

  function proceedToPayment() {
    if (!products.some((p) => (qty[p.id] ?? 0) > 0)) {
      setFormError('Add at least one product')
      return
    }
    setFormError('')
    setScreen(4)
  }

  async function submitOrder() {
    if (!paymentMethod || !addressConfirmed) return
    setSubmitting(true)
    setFormError('')
    try {
      const lines = products
        .filter((p) => (qty[p.id] ?? 0) > 0)
        .map((p) => ({ product_id: p.id, quantity: qty[p.id] ?? 0 }))

      const result = await placePartnerOrder({
        lines,
        discount_code: discountCode.trim() || undefined,
        payment_method: paymentMethod === 'cash' ? 'cash' : 'bank_transfer',
        confirm_delivery_address: true,
      })

      setConfirmOrder(result.order.order_number)
      setConfirmInvoice(String(result.invoice.invoice_number))
      setConfirmInvoiceId(result.invoice.id)
      setScreen(5)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Order failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function onDownloadInvoice() {
    try {
      const result = await downloadInvoicePdf(confirmInvoiceId)
      if (result.type === 'url' && result.url) {
        window.open(result.url, '_blank')
        return
      }
      if (result.type === 'pdf') {
        const url = URL.createObjectURL(result.blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-${confirmInvoice}.pdf`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Download failed')
    }
  }

  function resetPortal() {
    dispatchQty({ type: 'CLEAR' })
    setPaymentMethod(null)
    setAddressConfirmed(false)
    setDiscountCode('')
    setDiscountCents(0)
    setStockNotes({})
    setScreen(3)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '13px 16px',
    border: '1.5px solid var(--line)',
    borderRadius: 5,
    fontFamily: 'var(--font-sans)',
    fontSize: 15,
    color: 'var(--ink)',
    background: 'white',
    outline: 'none',
  }

  const btnPrimary: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '14px 28px',
    fontFamily: 'var(--font-sans)',
    fontSize: 15,
    fontWeight: 600,
    border: 'none',
    borderRadius: 5,
    cursor: 'pointer',
    background: 'var(--ink)',
    color: 'white',
    width: '100%',
  }

  const addressLine = deliveryAddress
    ? [deliveryAddress.line1, deliveryAddress.city, deliveryAddress.postal_code].filter(Boolean).join(', ')
    : 'No delivery address on file'

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF5', fontFamily: 'var(--font-sans)' }}>
      <header style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 48px', borderBottom: '1px solid var(--line)', background: '#FAFAF5', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--ink)' }}>
          <DorstLogo height={28} />
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#706E66', background: '#E8E5DC', padding: '3px 8px', borderRadius: 100 }}>
            {t('badge')}
          </span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {loggedIn && (
            <>
              <button
                type="button"
                onClick={() => { void loadHistory() }}
                style={{ fontSize: 13, color: '#706E66', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {historyLoading ? 'Loading…' : 'Orders & invoices'}
              </button>
              <Link href="/partners/tracking" style={{ fontSize: 13, color: '#706E66', textDecoration: 'none' }}>
                Track order
              </Link>
              <button
                type="button"
                onClick={() => { clearPartnerSession(); setLoggedIn(false); setShowHistory(false); setScreen(1) }}
                style={{ fontSize: 13, color: '#706E66', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Sign out
              </button>
            </>
          )}
          <Link href="/" style={{ fontSize: 13, color: '#706E66', textDecoration: 'none' }}>{t('backToSite')}</Link>
        </div>
      </header>

      <div style={{ padding: '28px 48px 0', display: 'flex', alignItems: 'center', maxWidth: 700, margin: '0 auto' }}>
        {[1, 2, 3, 4, 5].map((step, i) => (
          <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1, position: 'relative' }}>
            {i < 4 && (
              <div style={{ position: 'absolute', top: 16, left: 'calc(50% + 20px)', right: 'calc(-50% + 20px)', height: 1, background: screen > step ? 'var(--ink)' : 'var(--line)' }} />
            )}
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              border: `1.5px solid ${screen >= step ? 'var(--ink)' : 'var(--line)'}`,
              background: screen >= step ? 'var(--ink)' : 'white',
              color: screen >= step ? 'white' : '#706E66',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: screen > step ? 0 : 13, fontWeight: 600, position: 'relative', zIndex: 1,
            }}>
              {screen > step ? <span style={{ fontSize: 14 }}>✓</span> : step}
            </div>
            <span style={{ fontSize: 11, fontWeight: screen === step ? 600 : 500, color: screen === step ? 'var(--ink)' : '#706E66' }}>
              {t(`steps.${STEP_KEYS[i]}`)}
            </span>
          </div>
        ))}
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '48px 48px 80px' }}>
        {formError && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 5, padding: '12px 16px', color: '#991B1B', fontSize: 13, marginBottom: 20 }}>
            {formError}
          </div>
        )}

        {screen === 1 && (
          <div>
            <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 10 }}>{mode === 'login' ? 'Partner login' : 'Partner access'}</h1>
            <p style={{ fontSize: 15, color: '#706E66', marginBottom: 32 }}>
              {passwordSent ? 'Password sent — check your email and sign in.' : 'Enter your company EIK and email to get started.'}
            </p>
            <div style={{ background: 'white', border: '1.5px solid var(--line)', borderRadius: 10, padding: 44 }}>
              <WhaleSVG size="nav" style={{ marginBottom: 28 } as React.CSSProperties} />
              <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                {(['onboard', 'login'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setMode(tab)}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: 5,
                      border: '1.5px solid var(--line)',
                      background: mode === tab ? 'var(--ink)' : 'white',
                      color: mode === tab ? 'white' : 'var(--ink)',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {tab === 'onboard' ? 'First visit' : 'Login'}
                  </button>
                ))}
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>ЕИК</label>
                <input type="text" value={eikInput} onChange={(e) => setEikInput(e.target.value)} style={inputStyle} />
              </div>
              {mode === 'onboard' && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Email</label>
                  <input type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} style={inputStyle} />
                </div>
              )}
              {mode === 'login' && (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Email (for password resend)</label>
                    <input type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} style={inputStyle} />
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Password</label>
                    <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} style={inputStyle} />
                  </div>
                </>
              )}
              <button
                onClick={mode === 'login' ? onLogin : onRegisterLookup}
                disabled={loading}
                style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }}
              >
                {loading ? 'Please wait…' : mode === 'login' ? 'Sign in →' : 'Continue →'}
              </button>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => void onResendPassword()}
                  disabled={loading}
                  style={{ ...btnPrimary, marginTop: 12, background: 'white', color: 'var(--ink)', border: '1.5px solid var(--line)' }}
                >
                  Resend password by email
                </button>
              )}
            </div>
          </div>
        )}

        {screen === 2 && registryDraft && (
          <div>
            <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 10 }}>Verify company details</h1>
            <p style={{ fontSize: 15, color: '#706E66', marginBottom: 28 }}>
              Confirm Trade Registry data before we create your account. Edit contact fields if needed.
            </p>
            <div style={{ background: 'white', border: '1.5px solid var(--line)', borderRadius: 10, padding: 44, display: 'grid', gap: 16 }}>
              <div style={{ background: '#F7F5F0', borderRadius: 8, padding: 16, display: 'grid', gap: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#706E66' }}>
                  From Trade Registry
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, fontSize: 14 }}>
                  <span style={{ color: '#706E66' }}>ЕИК</span>
                  <span style={{ fontWeight: 600 }}>{registryDraft.eik}</span>
                  <span style={{ color: '#706E66' }}>Legal name</span>
                  <span style={{ fontWeight: 600 }}>{registryDraft.legal_name}</span>
                  {registryDraft.latin_name && (
                    <>
                      <span style={{ color: '#706E66' }}>Latin name</span>
                      <span>{registryDraft.latin_name}</span>
                    </>
                  )}
                  <span style={{ color: '#706E66' }}>VAT</span>
                  <span>
                    {registryDraft.vat_number
                      ? registryDraft.vat_number
                      : registryDraft.vat_registered
                        ? 'Registered'
                        : 'Not registered'}
                  </span>
                  {registryDraft.billing_address && (
                    <>
                      <span style={{ color: '#706E66' }}>Address</span>
                      <span>
                        {[
                          registryDraft.billing_address.line1,
                          registryDraft.billing_address.line2,
                          `${registryDraft.billing_address.postal_code} ${registryDraft.billing_address.city}`.trim(),
                          registryDraft.billing_address.country,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </>
                  )}
                  {registryDraft.representative_name && (
                    <>
                      <span style={{ color: '#706E66' }}>Representative</span>
                      <span>{registryDraft.representative_name}</span>
                    </>
                  )}
                  {registryDraft.owner_name && (
                    <>
                      <span style={{ color: '#706E66' }}>Owner(s)</span>
                      <span>{registryDraft.owner_name}</span>
                    </>
                  )}
                </div>
                {registryDraft.registry_url && (
                  <a
                    href={registryDraft.registry_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginTop: 4 }}
                  >
                    Open in Trade Registry ↗
                  </a>
                )}
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Display name (editable)</label>
                <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Email</label>
                <input value={emailInput} onChange={(e) => setEmailInput(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Phone</label>
                <input value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Google Maps URL (delivery location)</label>
                <input value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} placeholder="https://maps.google.com/..." style={inputStyle} />
              </div>
              <button onClick={onRegisterConfirm} disabled={loading} style={btnPrimary}>
                {loading ? 'Creating account…' : 'Confirm & receive password →'}
              </button>
            </div>
          </div>
        )}

        {screen === 3 && loggedIn && (
          <div>
            <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 10 }}>Place your order</h1>
            <p style={{ fontSize: 15, color: '#706E66', marginBottom: 28 }}>Prices are set by Dorst. Stock is checked live when you leave each row.</p>
            <div style={{ background: '#E8E5DC', borderRadius: 10, padding: '18px 24px', marginBottom: 28 }}>
              <div style={{ fontWeight: 600 }}>{companyName}</div>
              <div style={{ fontSize: 13, color: '#706E66' }}>ЕИК: {eikInput}</div>
            </div>
            {catalogProducts.length === 0 && <p style={{ color: '#706E66' }}>No products available for ordering.</p>}
            {groups.map((group) => (
              <div key={group} style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#706E66', marginBottom: 8 }}>{group}</div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 88px 96px 80px',
                    gap: 12,
                    alignItems: 'center',
                    padding: '0 0 8px',
                    borderBottom: '1px solid #E8E5DC',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#706E66',
                  }}
                >
                  <div>Product</div>
                  <div style={{ textAlign: 'right' }}>Price</div>
                  <div style={{ textAlign: 'center' }}>Qty</div>
                  <div style={{ textAlign: 'right' }}>Total</div>
                </div>
                {catalogProducts.filter((p) => productGroup(p.volume_unit, p.name) === group).map((p) => {
                  const q = qty[p.id] ?? 0
                  return (
                    <div
                      key={p.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 88px 96px 80px',
                        gap: 12,
                        alignItems: 'center',
                        padding: '12px 0',
                        borderBottom: '1px solid #E8E5DC',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: '#706E66' }}>
                          {[p.style, volumeUnitLabel(p.volume_unit)].filter(Boolean).join(' · ')}
                        </div>
                        {stockNotes[p.id] && <div style={{ fontSize: 12, color: '#B45309', marginTop: 4 }}>{stockNotes[p.id]}</div>}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 15, textAlign: 'right', color: 'var(--ink)' }}>
                        €{(p.unit_price_eur_cents / 100).toFixed(2)}
                      </div>
                      <div>
                        <input
                          type="number"
                          min={0}
                          aria-label={`Quantity for ${p.name}`}
                          title="Quantity"
                          value={q}
                          onChange={(e) => dispatchQty({ type: 'SET', id: p.id, qty: Number(e.target.value) })}
                          onBlur={() => void onQtyBlur(p.id)}
                          style={{ ...inputStyle, width: '100%', textAlign: 'center', marginBottom: 0 }}
                        />
                      </div>
                      <div style={{ fontWeight: 600, textAlign: 'right' }}>
                        {q > 0 ? `€${((q * p.unit_price_eur_cents) / 100).toFixed(2)}` : '—'}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
            <div style={{ background: 'white', border: '1.5px solid var(--line)', borderRadius: 10, padding: 24, marginTop: 16 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input value={discountCode} onChange={(e) => setDiscountCode(e.target.value.toUpperCase())} placeholder="Discount code" style={{ ...inputStyle, flex: 1 }} />
                <button type="button" onClick={() => void applyDiscount()} style={{ ...btnPrimary, width: 'auto' }}>Apply</button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#706E66', padding: '6px 0' }}>
                <span>Subtotal</span><span>€{(subtotalCents / 100).toFixed(2)}</span>
              </div>
              {discountCents > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#1A6B3A', padding: '6px 0' }}>
                  <span>Discount</span><span>−€{(discountCents / 100).toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#706E66', padding: '6px 0' }}>
                <span>VAT (20%)</span><span>€{(vatCents / 100).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700, borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 12 }}>
                <span>Total</span><span>€{(totalCents / 100).toFixed(2)}</span>
              </div>
            </div>
            <button onClick={proceedToPayment} style={{ ...btnPrimary, marginTop: 24 }}>Continue to payment →</button>
          </div>
        )}

        {screen === 4 && (
          <div>
            <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 10 }}>Payment & delivery</h1>
            <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 10, padding: 20, marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Confirm delivery address</div>
              <p style={{ fontSize: 14, marginBottom: 12 }}>{addressLine}</p>
              {mapsUrl && (
                <a href={mapsUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 600 }}>View on Google Maps ↗</a>
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, fontSize: 14 }}>
                <input type="checkbox" checked={addressConfirmed} onChange={(e) => setAddressConfirmed(e.target.checked)} />
                I confirm delivery to this location
              </label>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {[
                { id: 'cash' as const, label: 'Cash on delivery' },
                { id: 'bank' as const, label: 'Bank transfer invoice' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPaymentMethod(opt.id)}
                  style={{
                    ...btnPrimary,
                    background: paymentMethod === opt.id ? 'var(--ink)' : 'white',
                    color: paymentMethod === opt.id ? 'white' : 'var(--ink)',
                    border: '1.5px solid var(--line)',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setScreen(3)} style={{ ...btnPrimary, width: 'auto', background: '#E8E5DC', color: 'var(--ink)' }}>← Back</button>
              <button onClick={() => void submitOrder()} disabled={!paymentMethod || !addressConfirmed || submitting} style={{ ...btnPrimary, flex: 1, opacity: (!paymentMethod || !addressConfirmed || submitting) ? 0.5 : 1 }}>
                {submitting ? 'Placing order…' : 'Confirm order →'}
              </button>
            </div>
          </div>
        )}

        {screen === 5 && (
          <div style={{ background: 'white', border: '1.5px solid var(--line)', borderRadius: 10, padding: '52px 44px', textAlign: 'center' }}>
            <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>Order confirmed</h1>
            <p style={{ color: '#706E66', marginBottom: 20 }}>Order #{confirmOrder} · Invoice #{confirmInvoice}</p>
            <button onClick={() => void onDownloadInvoice()} style={{ ...btnPrimary, width: 'auto', marginBottom: 16 }}>Download invoice PDF</button>
            <button onClick={resetPortal} style={{ ...btnPrimary, width: 'auto', background: '#E8E5DC', color: 'var(--ink)' }}>Place another order</button>
          </div>
        )}

        {showHistory && loggedIn && (
          <div style={{ marginTop: 40, background: 'white', border: '1.5px solid var(--line)', borderRadius: 10, padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Orders & invoices</h2>
              <button type="button" onClick={() => setShowHistory(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#706E66', fontSize: 13 }}>Close</button>
            </div>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#706E66', marginBottom: 12 }}>Recent orders</div>
              {orders.length === 0 && <p style={{ color: '#706E66', fontSize: 14 }}>No orders yet.</p>}
              {orders.map((o) => (
                <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid #E8E5DC', fontSize: 14 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{o.order_number}</div>
                    <div style={{ color: '#706E66', fontSize: 12 }}>{new Date(o.created_at).toLocaleDateString()} · {o.status}</div>
                  </div>
                  <div style={{ fontWeight: 600 }}>€{(o.total_eur_cents / 100).toFixed(2)}</div>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#706E66', marginBottom: 12 }}>Invoices</div>
              {invoices.length === 0 && <p style={{ color: '#706E66', fontSize: 14 }}>No invoices yet.</p>}
              {invoices.map((inv) => (
                <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #E8E5DC', fontSize: 14 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>#{inv.invoice_number}</div>
                    <div style={{ color: '#706E66', fontSize: 12 }}>{inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString() : '—'} · {inv.status}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontWeight: 600 }}>€{(inv.total_eur_cents / 100).toFixed(2)}</span>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const result = await downloadInvoicePdf(inv.id)
                          if (result.type === 'url' && result.url) {
                            window.open(result.url, '_blank')
                            return
                          }
                          if (result.type === 'pdf') {
                            const url = URL.createObjectURL(result.blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = `invoice-${inv.invoice_number}.pdf`
                            a.click()
                            URL.revokeObjectURL(url)
                          }
                        } catch (err) {
                          setFormError(err instanceof Error ? err.message : 'Download failed')
                        }
                      }}
                      style={{ fontSize: 12, fontWeight: 600, background: 'none', border: '1px solid var(--line)', borderRadius: 4, padding: '6px 10px', cursor: 'pointer' }}
                    >
                      PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
