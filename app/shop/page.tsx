import type { Metadata } from 'next'
import { beers } from '@/lib/data'
import { ShopPageClient } from './ShopPageClient'

export const metadata: Metadata = {
  title: 'Shop — Dorst Brewery',
  description: 'Order Dorst craft beer online. Cans delivered to Sofia. Minimum 20 cans per order.',
}

export default function ShopPage() {
  const shopBeers = beers.filter(
    (b) =>
      b.active &&
      (b.format === 'can' || b.format === 'both') &&
      b.shopListed !== false &&
      b.priceB2C != null
  )
  return <ShopPageClient beers={shopBeers} />
}
