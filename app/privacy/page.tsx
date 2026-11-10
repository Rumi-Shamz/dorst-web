import type { Metadata } from 'next'
import { PrivacyPageClient } from './PrivacyPageClient'

export const metadata: Metadata = {
  title: 'Privacy Policy — Dorst Brewery',
  description: 'How Dorst Brewery (Кроубар ООД) collects, uses and protects personal data from the web shop and partner portal.',
}

export default function PrivacyPage() {
  return <PrivacyPageClient />
}
