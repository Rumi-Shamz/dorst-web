'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { MIN_PASSWORD_LENGTH, resetPartnerPassword } from '@/lib/partner-api'

/** Reads `token` from a `#token=…` fragment. */
function tokenFromHash(hash: string): string {
  return new URLSearchParams(hash.replace(/^#/, '')).get('token') ?? ''
}

export function ResetPasswordClient() {
  const t = useTranslations('B2B.auth.reset')
  const [token, setToken] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  // Take the token out of the fragment once, then clear it from the address bar and history.
  useEffect(() => {
    const found = tokenFromHash(window.location.hash)
    setToken(found)
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!token) {
      setError(t('missingToken'))
      return
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t('tooShort'))
      return
    }
    if (password !== repeat) {
      setError(t('mismatch'))
      return
    }
    setLoading(true)
    try {
      await resetPartnerPassword(token, password)
      setToken('')
      setDone(true)
    } catch {
      setError(t('failed'))
    } finally {
      setLoading(false)
    }
  }

  const input: React.CSSProperties = {
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
  const button: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '14px 28px',
    fontFamily: 'var(--font-sans)',
    fontSize: 15,
    fontWeight: 600,
    border: 'none',
    borderRadius: 5,
    cursor: 'pointer',
    background: 'var(--ink)',
    color: 'white',
    textDecoration: 'none',
  }
  const label: React.CSSProperties = { fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: '80px 20px' }}>
      <div style={{ background: 'white', border: '1.5px solid var(--line)', borderRadius: 10, padding: 44 }}>
        {done ? (
          <>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 10 }}>{t('successTitle')}</h1>
            <p style={{ fontSize: 15, color: '#706E66', marginBottom: 24 }}>{t('successBody')}</p>
            <Link href="/partners/" style={button}>
              {t('goToLogin')}
            </Link>
          </>
        ) : (
          <form onSubmit={onSubmit}>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 10 }}>{t('heading')}</h1>
            <p style={{ fontSize: 15, color: '#706E66', marginBottom: 24 }}>{t('sub')}</p>
            {token === '' && <p role="alert" style={{ color: '#B42318', marginBottom: 16 }}>{t('missingToken')}</p>}
            <div style={{ marginBottom: 16 }}>
              <label style={label} htmlFor="new-password">{t('password')}</label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                minLength={MIN_PASSWORD_LENGTH}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={input}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={label} htmlFor="repeat-password">{t('confirm')}</label>
              <input
                id="repeat-password"
                type="password"
                autoComplete="new-password"
                value={repeat}
                onChange={(e) => setRepeat(e.target.value)}
                style={input}
              />
            </div>
            {error && <p role="alert" style={{ color: '#B42318', fontSize: 14, marginBottom: 16 }}>{error}</p>}
            <button type="submit" disabled={loading || !token} style={{ ...button, opacity: loading || !token ? 0.6 : 1 }}>
              {loading ? t('saving') : t('submit')}
            </button>
            {(error === t('failed') || token === '') && (
              <Link href="/partners/" style={{ ...button, marginTop: 12, background: 'white', color: 'var(--ink)', border: '1.5px solid var(--line)' }}>
                {t('requestNew')}
              </Link>
            )}
          </form>
        )}
      </div>
    </main>
  )
}
