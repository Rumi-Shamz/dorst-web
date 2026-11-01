import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
// Fonts are self-hosted (no build-time fetch from Google Fonts).
import '@fontsource-variable/montserrat'
import '@fontsource/anonymous-pro/400.css'
import '@fontsource/anonymous-pro/700.css'
import './globals.css'
import { CartProvider } from '@/contexts/CartContext'
import { LocaleProvider } from '@/components/LocaleProvider'
import { SiteShell } from './SiteShell'
import { SandboxBanner } from '@/components/SandboxBanner'
import { isSandbox } from '@/lib/sandbox'

export const metadata: Metadata = {
  title: 'Dorst — Drink Well, Drink Whale',
  description: 'Craft brewery from Bankya, Bulgaria. Est. 2017 by Dean and Erwin. Bold styles, honest ingredients, no compromise.',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
  // Sandbox builds must never be indexed.
  ...(isSandbox ? { robots: { index: false, follow: false } } : {}),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bg">
      <body className={isSandbox ? 'pb-7' : undefined}>
        <LocaleProvider>
          <CartProvider>
            <SiteShell>{children}</SiteShell>
          </CartProvider>
        </LocaleProvider>
        <SandboxBanner />
        {process.env.NODE_ENV === 'production' && !isSandbox && <Analytics />}
      </body>
    </html>
  )
}
