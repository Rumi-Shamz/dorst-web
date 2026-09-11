'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Navbar } from '@/components/nav/Navbar'
import { Footer } from '@/components/footer/Footer'

const COOKIE = 'dorst-age-verified'

function isAgeGateExempt(pathname: string) {
  return (
    pathname.startsWith('/age-gate') ||
    pathname.startsWith('/partners') ||
    pathname.startsWith('/brand-book')
  )
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const isB2B = pathname.startsWith('/partners')

  // Client fallback when middleware is unavailable (static GitHub Pages export).
  // On Vercel / local, middleware still runs first; this is a no-op if already verified.
  useEffect(() => {
    if (isAgeGateExempt(pathname)) return
    const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=([^;]*)`))
    if (match?.[1] === '1') return
    const returnPath = pathname || '/'
    router.replace(`/age-gate/?return=${encodeURIComponent(returnPath)}`)
  }, [pathname, router])

  if (isB2B) {
    return <>{children}</>
  }

  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  )
}
