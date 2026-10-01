'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { WhaleSVG } from '@/components/whale/WhaleSVG'

const COOKIE = 'dorst-age-verified'

/** Same-origin relative path only (blocks open redirects). */
function getReturnPath() {
  if (typeof window === 'undefined') return '/'
  const raw = new URLSearchParams(window.location.search).get('return') ?? '/'
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/'
  return raw
}

function setVerifiedCookie() {
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${COOKIE}=1; max-age=31536000; path=/; samesite=lax${secure}`
}

export function AgeGate() {
  const router = useRouter()
  const t = useTranslations('AgeGate')

  useEffect(() => {
    const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=([^;]*)`))
    if (match?.[1] === '1') {
      // Hard navigate so middleware re-runs with the cookie (soft nav can reuse a
      // prefetched redirect-to-gate from Chrome/Safari Link prefetch).
      window.location.replace(getReturnPath())
    }
  }, [])

  function handleYes() {
    setVerifiedCookie()
    // Hard navigation is required: Navbar Link prefetch caches middleware's
    // redirect-to-gate for /, /beers, etc. router.push then reuses that cache
    // in Chrome/Safari and never leaves the gate. Firefox prefetches less.
    window.location.assign(getReturnPath())
  }

  function handleNo() {
    router.push('/age-gate/underage')
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--aubergine-deep)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.5px', marginBottom: 40, opacity: 0, animation: 'fadeUp 0.8s 0.1s forwards' }}>
        DORST
      </div>

      <div style={{ animation: 'whaleFloat 6s ease-in-out infinite', marginBottom: 48, opacity: 0, animationDelay: '0.3s', animationFillMode: 'forwards' }}>
        <WhaleSVG size="gate" fill="rgba(255,255,255,0.9)" />
      </div>

      <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 16, opacity: 0, animation: 'fadeUp 0.8s 0.5s forwards' }}>
        {t('eyebrow')}
      </p>
      <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 700, color: 'white', lineHeight: 1.2, marginBottom: 48, opacity: 0, animation: 'fadeUp 0.8s 0.6s forwards' }}>
        {t('heading')}
      </h1>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', opacity: 0, animation: 'fadeUp 0.8s 0.9s forwards' }}>
        <button
          type="button"
          onClick={handleYes}
          style={{
            padding: '14px 36px',
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: '0.05em',
            background: 'var(--sun)',
            color: 'var(--ink)',
            border: '2px solid var(--sun)',
            borderRadius: 'var(--radius-pill)',
            cursor: 'pointer',
            transition: 'background 0.2s, color 0.2s, border-color 0.2s',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {t('yes')}
        </button>

        <button
          type="button"
          onClick={handleNo}
          style={{
            padding: '14px 36px',
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: '0.05em',
            background: 'transparent',
            color: 'rgba(255,255,255,0.7)',
            border: '2px solid rgba(255,255,255,0.3)',
            borderRadius: 'var(--radius-pill)',
            cursor: 'pointer',
            transition: 'border-color 0.2s, color 0.2s',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {t('no')}
        </button>
      </div>
    </div>
  )
}
