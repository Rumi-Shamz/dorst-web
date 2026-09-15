const ERP_BASE = process.env.NEXT_PUBLIC_ERP_API_URL?.replace(/\/$/, "") ?? ""

export type PublicLocation = {
  id: string
  name: string
  maps_url: string
  lifecycle_stage: "regular_customer" | "repeat_customer"
  city: string | null
  volume_hl: number
  order_count: number
}

export type PublicProduct = {
  id: string
  name: string
  style: string | null
  abv_percent: number | null
  volume_unit: string
  description: string | null
  sku: string | null
  b2c_unit_price_eur_cents: number | null
  unit_price_eur_cents: number | null
  unit_price_eur: number | null
}

async function publicFetch<T>(path: string): Promise<T> {
  if (!ERP_BASE) {
    throw new Error("NEXT_PUBLIC_ERP_API_URL is not configured")
  }
  const res = await fetch(`${ERP_BASE}${path}`, {
    headers: { Accept: "application/json" },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error?.message ?? `ERP request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

export async function fetchPublicLocations(): Promise<PublicLocation[]> {
  const data = await publicFetch<{ locations: PublicLocation[] }>("/api/public/locations")
  return data.locations ?? []
}

export async function fetchPublicProducts(): Promise<{
  products: PublicProduct[]
  nra_store_reg_number: string | null
}> {
  const data = await publicFetch<{
    products: PublicProduct[]
    nra_store_reg_number?: string | null
  }>("/api/public/products")
  return {
    products: data.products ?? [],
    nra_store_reg_number: data.nra_store_reg_number ?? null,
  }
}

/** Match a marketing beer to an ERP can SKU by name (and optional sku=slug). */
export function matchBeerProduct(
  beer: { name: string; slug: string },
  products: PublicProduct[]
): PublicProduct | null {
  const needle = beer.name.toLowerCase()
  const slug = beer.slug.toLowerCase()

  const priced = products.filter(
    (p) => p.unit_price_eur != null || p.b2c_unit_price_eur_cents != null
  )
  const bySku = priced.find(
    (p) =>
      p.sku?.toLowerCase() === slug ||
      p.sku?.toLowerCase().includes(slug.replace(/-/g, ""))
  )
  if (bySku) return bySku

  const isRetailPack = (unit: string | undefined) => {
    const u = (unit ?? "").toLowerCase()
    return (
      u.includes("can") ||
      u.startsWith("bottle_") ||
      u === "bottle_330ml" ||
      u === "bottle_500ml"
    )
  }

  const cans = priced.filter(
    (p) => isRetailPack(p.volume_unit) && p.name.toLowerCase().includes(needle)
  )
  if (cans.length === 1) return cans[0]
  if (cans.length > 1) {
    return cans.sort((a, b) => a.name.length - b.name.length)[0]
  }

  return priced.find((p) => p.name.toLowerCase().includes(needle)) ?? null
}
