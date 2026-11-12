'use client'

// pr-goblin "Feedback" tab for signed-in B2B partners. When `active`, trades
// the partner's ERP token for the feedback cookie (/api/feedback/session) and,
// if the feature is configured, loads the widget (a lazy chunk, so the public
// site never downloads it). When `active` turns false (sign-out) or the page
// unmounts, the widget is removed; on sign-out the cookie is cleared too
// (otherwise it expires on its own within the hour).
//
// Never mounts on the GitHub Pages static export, which has no API routes.

import { useEffect, useRef } from 'react'
import { getPartnerToken } from '@/lib/partner-api'

const STATIC_EXPORT = process.env.NEXT_PUBLIC_STATIC_EXPORT === '1'

export function PartnerFeedback({ active }: { active: boolean }) {
  const wasActive = useRef(false)

  useEffect(() => {
    if (STATIC_EXPORT) return
    if (active) {
      wasActive.current = true
    } else if (wasActive.current) {
      wasActive.current = false
      void fetch('/api/feedback/session', { method: 'DELETE', credentials: 'same-origin' }).catch(() => {})
    }
  }, [active])

  useEffect(() => {
    if (STATIC_EXPORT || !active) return
    const token = getPartnerToken()
    if (!token) return

    let cancelled = false
    let destroy: (() => void) | null = null

    ;(async () => {
      try {
        const res = await fetch('/api/feedback/session', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'same-origin',
        })
        if (!res.ok) return
        const session = (await res.json()) as { enabled?: boolean }
        if (cancelled || !session.enabled) return
        const { default: PrGoblin } = await import('@/vendor/pr-goblin/pr-goblin-widget.mjs')
        if (cancelled) return
        PrGoblin.init({
          endpoint: '/api/feedback',
          projectName: 'Dorst partner portal',
          // The reporter is signed server-side from the feedback cookie.
          user: null,
          // Issues on this repo are public: no screenshots, no captured logs.
          screenshot: false,
          captureLogs: false,
          variant: 'tab',
          side: 'right',
        })
        destroy = () => PrGoblin.destroy()
      } catch (err) {
        console.warn('[feedback] widget not loaded', err)
      }
    })()

    return () => {
      cancelled = true
      destroy?.()
    }
  }, [active])

  return null
}
