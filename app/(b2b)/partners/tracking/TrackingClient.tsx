'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { WhaleSVG } from '@/components/whale/WhaleSVG'
import { PartnerFeedback } from '@/components/feedback/PartnerFeedback'
import {
  fetchPartnerOrder,
  fetchPartnerOrders,
  getPartnerToken,
  volumeUnitLabel,
  type PartnerOrderDetail,
} from '@/lib/partner-api'

type OrderStatus = 'pending' | 'preparing' | 'shipped' | 'delivered'

interface OrderLine {
  name: string
  qty: number
  size: string
}

interface TrackedOrder {
  orderNumber: string
  company: string
  status: OrderStatus
  createdAt: string
  estimatedDelivery: string
  lines: OrderLine[]
  totalExVat: number
  notes?: string
}

const STATUS_ORDER: OrderStatus[] = ['pending', 'preparing', 'shipped', 'delivered']

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending:   'var(--ink-soft)',
  preparing: 'var(--orange-nl)',
  shipped:   'var(--sea)',
  delivered: 'var(--hop)',
}

function mapErpStatus(status: string): OrderStatus {
  switch (status) {
    case 'in_preparation':
      return 'preparing'
    case 'ready_for_delivery':
      return 'shipped'
    case 'delivered':
    case 'invoiced':
    case 'closed':
      return 'delivered'
    case 'confirmed':
    case 'draft':
    default:
      return 'pending'
  }
}

function toTracked(order: PartnerOrderDetail, companyFallback: string): TrackedOrder {
  const created = new Date(order.created_at)
  const eta = new Date(created)
  eta.setDate(eta.getDate() + 4)

  return {
    orderNumber: order.order_number,
    company: companyFallback,
    status: mapErpStatus(order.status),
    createdAt: created.toISOString().slice(0, 10),
    estimatedDelivery: eta.toISOString().slice(0, 10),
    lines: (order.order_lines ?? []).map((line) => ({
      name: line.products?.name ?? 'Product',
      qty: line.quantity,
      size: volumeUnitLabel(line.products?.volume_unit ?? ''),
    })),
    totalExVat: (order.subtotal_eur_cents ?? 0) / 100,
    notes: order.status === 'cancelled' ? 'This order was cancelled.' : undefined,
  }
}

export function TrackingClient() {
  const t = useTranslations('B2B.tracking')
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<TrackedOrder | null | 'not-found' | 'need-login'>(null)
  const [loading, setLoading] = useState(false)
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    setSignedIn(!!getPartnerToken())
  }, [])

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const key = query.trim().toUpperCase()
    if (!key) return

    if (!getPartnerToken()) {
      setResult('need-login')
      return
    }

    setLoading(true)
    setResult(null)
    try {
      const { orders } = await fetchPartnerOrders()
      const match = orders.find((o) => o.order_number.toUpperCase() === key)
      if (!match) {
        setResult('not-found')
        return
      }
      const { order } = await fetchPartnerOrder(match.id)
      setResult(toTracked(order, 'Your company'))
    } catch {
      setResult('not-found')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--foam)', paddingTop: 72 }}>
      <PartnerFeedback active={signedIn} />
      <div style={{ background: 'var(--ink)', color: 'var(--foam)', padding: '48px 48px 40px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <WhaleSVG size="nav" fill="var(--foam)" />
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.5 }}>
              DORST B2B
            </span>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 8 }}>
            {t('heading')}
          </h1>
          <p style={{ fontSize: 15, opacity: 0.55, fontWeight: 300 }}>
            {t('sub')}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 48px 0' }}>
        <form onSubmit={handleSearch}>
          <label
            htmlFor="order-number"
            style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 8 }}
          >
            {t('label')}
          </label>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              id="order-number"
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t('placeholder')}
              style={{
                flex: 1,
                padding: '12px 16px',
                fontSize: 15,
                fontFamily: 'var(--font-mono)',
                border: '1.5px solid var(--line)',
                borderRadius: 2,
                background: 'white',
                color: 'var(--ink)',
                outline: 'none',
                letterSpacing: '0.06em',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--ink)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--line)')}
            />
            <button
              type="submit"
              disabled={!query.trim() || loading}
              style={{
                padding: '12px 28px',
                background: query.trim() ? 'var(--ink)' : 'rgba(14,14,16,0.15)',
                color: query.trim() ? 'var(--foam)' : 'var(--ink-soft)',
                border: 'none',
                borderRadius: 2,
                fontSize: 14,
                fontWeight: 700,
                fontFamily: 'var(--font-sans)',
                letterSpacing: '0.04em',
                cursor: query.trim() ? 'pointer' : 'not-allowed',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
            >
              {loading ? '...' : t('submit')}
            </button>
          </div>
        </form>

        <p style={{ marginTop: 10, fontSize: 12, color: 'var(--ink-soft)', opacity: 0.7 }}>
          Sign in on the partner portal first, then track one of your order numbers.
        </p>
      </div>

      {result === 'need-login' && (
        <div style={{ maxWidth: 760, margin: '32px auto 0', padding: '0 48px' }}>
          <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 2, padding: '16px 20px', fontSize: 14, color: '#92400E' }}>
            Sign in at the{' '}
            <Link href="/partners" style={{ fontWeight: 700, color: 'inherit' }}>partner portal</Link>
            {' '}to track your orders.
          </div>
        </div>
      )}

      {result === 'not-found' && (
        <div style={{ maxWidth: 760, margin: '32px auto 0', padding: '0 48px' }}>
          <div style={{ background: '#FFF3F3', border: '1px solid #F5C6C6', borderRadius: 2, padding: '16px 20px', fontSize: 14, color: '#9B2A2A' }}>
            {t('notFound')}
          </div>
        </div>
      )}

      {result && result !== 'not-found' && result !== 'need-login' && (
        <div style={{ maxWidth: 760, margin: '32px auto 80px', padding: '0 48px' }}>
          <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 4 }}>
                  {result.company}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, letterSpacing: '0.06em' }}>
                  {result.orderNumber}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>
                  {result.createdAt} → est. {result.estimatedDelivery}
                </div>
              </div>
              <StatusBadge status={result.status} label={t(`status${capitalize(result.status)}` as Parameters<typeof t>[0])} color={STATUS_COLORS[result.status]} />
            </div>

            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', gap: 0 }}>
                {STATUS_ORDER.map((s, i) => {
                  const currentIdx = STATUS_ORDER.indexOf(result.status)
                  const done = i <= currentIdx
                  const isLast = i === STATUS_ORDER.length - 1
                  return (
                    <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                      {!isLast && (
                        <div style={{
                          position: 'absolute',
                          top: 10,
                          left: '50%',
                          width: '100%',
                          height: 2,
                          background: i < currentIdx ? STATUS_COLORS[result.status] : 'var(--line)',
                          zIndex: 0,
                        }} />
                      )}
                      <div style={{
                        width: 20, height: 20,
                        borderRadius: '50%',
                        background: done ? STATUS_COLORS[result.status] : 'white',
                        border: `2px solid ${done ? STATUS_COLORS[result.status] : 'var(--line)'}`,
                        zIndex: 1,
                        flexShrink: 0,
                      }} />
                      <div style={{ fontSize: 10, fontWeight: done ? 700 : 400, letterSpacing: '0.08em', textTransform: 'uppercase', color: done ? 'var(--ink)' : 'var(--ink-soft)', marginTop: 6, textAlign: 'center', opacity: done ? 1 : 0.4 }}>
                        {t(`status${capitalize(s)}` as Parameters<typeof t>[0])}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--line)' }}>
              {result.lines.map((line, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14, color: 'var(--ink-soft)' }}>
                  <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{line.name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{line.qty} × {line.size}</span>
                </div>
              ))}
            </div>

            <div style={{ padding: '16px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Total (excl. VAT)</span>
              <span style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                €{result.totalExVat.toFixed(2)}
              </span>
            </div>

            {result.notes && (
              <div style={{ padding: '0 28px 20px' }}>
                <div style={{ background: 'var(--paper)', borderRadius: 2, padding: '10px 14px', fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                  {result.notes}
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: 24, display: 'flex', gap: 16 }}>
            <Link
              href="/partners"
              style={{ fontSize: 13, color: 'var(--ink-soft)', textDecoration: 'none', opacity: 0.6 }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
            >
              ← Back to portal
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function StatusBadge({ status, label, color }: { status: OrderStatus; label: string; color: string }) {
  const bg = `${color}18`
  return (
    <div style={{
      padding: '6px 14px',
      borderRadius: 'var(--radius-pill)',
      background: bg,
      border: `1.5px solid ${color}`,
      color,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      flexShrink: 0,
    }}>
      {label}
    </div>
  )
}
