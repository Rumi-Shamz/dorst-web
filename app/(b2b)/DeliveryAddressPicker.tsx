'use client'

import { useState } from 'react'
import { searchPartnerPlaces, setPartnerDeliveryAddress, type PlaceSuggestion } from '@/lib/partner-api'

type Saved = { address: Record<string, string>; mapsUrl: string }

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  border: '1.5px solid var(--line)',
  borderRadius: 5,
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  color: 'var(--ink)',
  background: 'white',
  outline: 'none',
}

const buttonStyle: React.CSSProperties = {
  padding: '11px 16px',
  border: 'none',
  borderRadius: 5,
  cursor: 'pointer',
  background: 'var(--ink)',
  color: 'white',
  fontSize: 14,
  fontWeight: 600,
  whiteSpace: 'nowrap',
}

/** Checkout step when no delivery address is on file: paste a Maps link or search the venue. */
export function DeliveryAddressPicker({ onSaved }: { onSaved: (saved: Saved) => void }) {
  const [mode, setMode] = useState<'search' | 'link'>('search')
  const [query, setQuery] = useState('')
  const [link, setLink] = useState('')
  const [results, setResults] = useState<PlaceSuggestion[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run<T>(fn: () => Promise<T>): Promise<T | null> {
    setBusy(true)
    setError(null)
    try {
      return await fn()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      return null
    } finally {
      setBusy(false)
    }
  }

  async function save(body: { maps_url: string } | { place_id: string }) {
    const res = await run(() => setPartnerDeliveryAddress(body))
    if (res) onSaved({ address: res.delivery_address, mapsUrl: res.place.maps_url })
  }

  async function search() {
    const res = await run(() => searchPartnerPlaces(query.trim()))
    if (res) setResults(res.places)
  }

  const tab = (id: 'search' | 'link', label: string) => (
    <button
      type="button"
      onClick={() => { setMode(id); setError(null) }}
      style={{
        background: 'none',
        border: 'none',
        padding: '4px 0',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 600,
        color: mode === id ? 'var(--ink)' : '#706E66',
        borderBottom: `2px solid ${mode === id ? 'var(--ink)' : 'transparent'}`,
      }}
    >
      {label}
    </button>
  )

  return (
    <div>
      <p style={{ fontSize: 14, marginBottom: 12 }}>
        We don&apos;t have a delivery address for you yet. Find your venue on Google Maps:
      </p>
      <div style={{ display: 'flex', gap: 20, marginBottom: 12 }}>
        {tab('search', 'Search for your venue')}
        {tab('link', 'Paste a Google Maps link')}
      </div>

      {mode === 'search' ? (
        <form
          onSubmit={(e) => { e.preventDefault(); if (query.trim().length >= 3) void search() }}
          style={{ display: 'flex', gap: 8 }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Venue name and city, e.g. Crafter Bar Sofia"
            style={inputStyle}
          />
          <button type="submit" disabled={busy || query.trim().length < 3} style={{ ...buttonStyle, opacity: busy || query.trim().length < 3 ? 0.5 : 1 }}>
            Search
          </button>
        </form>
      ) : (
        <form
          onSubmit={(e) => { e.preventDefault(); if (link.trim()) void save({ maps_url: link.trim() }) }}
          style={{ display: 'flex', gap: 8 }}
        >
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://maps.app.goo.gl/…"
            style={inputStyle}
          />
          <button type="submit" disabled={busy || !link.trim()} style={{ ...buttonStyle, opacity: busy || !link.trim() ? 0.5 : 1 }}>
            Use this place
          </button>
        </form>
      )}

      {mode === 'search' && results && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {results.length === 0 && <p style={{ fontSize: 13, color: '#706E66' }}>No places found. Try another name or paste a Maps link.</p>}
          {results.map((p) => (
            <button
              key={p.place_id}
              type="button"
              disabled={busy}
              onClick={() => void save({ place_id: p.place_id })}
              style={{ textAlign: 'left', background: 'white', border: '1.5px solid var(--line)', borderRadius: 5, padding: '10px 14px', cursor: 'pointer' }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{p.name}</div>
              <div style={{ fontSize: 13, color: '#706E66' }}>{p.address}</div>
            </button>
          ))}
        </div>
      )}

      {busy && <p style={{ fontSize: 13, color: '#706E66', marginTop: 10 }}>Working…</p>}
      {error && <p style={{ fontSize: 13, color: '#B42318', marginTop: 10 }}>{error}</p>}
    </div>
  )
}
