import type { Metadata } from 'next'
import { CheckoutClient } from './CheckoutClient'

export const metadata: Metadata = {
  title: 'Checkout — Dorst Brewery',
  description: 'Complete your Dorst can order for Sofia delivery.',
}

export default function CheckoutPage() {
  return (
    <div style={{ paddingTop: 72 }}>
      <CheckoutClient />
    </div>
  )
}
