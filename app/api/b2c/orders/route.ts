import { NextRequest, NextResponse } from 'next/server'
import { MINIMUM_CANS } from '@/lib/shop'

const ERP_BASE = process.env.NEXT_PUBLIC_ERP_API_URL?.replace(/\/$/, '') ?? ''

/**
 * Same-origin proxy so the browser can submit B2C orders without CORS,
 * while ERP still owns Turnstile verification, pricing, and order insert.
 */
export async function POST(req: NextRequest) {
  if (!ERP_BASE) {
    return NextResponse.json(
      { error: { code: 'CONFIG', message: 'NEXT_PUBLIC_ERP_API_URL is not configured' } },
      { status: 500 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Invalid JSON' } },
      { status: 400 }
    )
  }

  const lines = (body as { lines?: unknown })?.lines
  if (!Array.isArray(lines) || lines.length === 0) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Order must include at least one line' } },
      { status: 400 }
    )
  }

  const totalQty = lines.reduce((sum: number, line: unknown) => {
    const qty = Number((line as { quantity?: unknown })?.quantity ?? 0)
    return sum + (Number.isFinite(qty) ? qty : 0)
  }, 0)

  if (totalQty < MINIMUM_CANS) {
    return NextResponse.json(
      {
        error: {
          code: 'MINIMUM_ORDER',
          message: `Minimum order is ${MINIMUM_CANS} cans`,
        },
      },
      { status: 400 }
    )
  }

  let res: Response
  try {
    res = await fetch(`${ERP_BASE}/api/public/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    })
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'network error'
    return NextResponse.json(
      {
        error: {
          code: 'UPSTREAM',
          message: `Cannot reach ERP order API (${detail})`,
        },
      },
      { status: 502 }
    )
  }

  const text = await res.text()
  return new NextResponse(text, {
    status: res.status,
    headers: {
      'Content-Type': res.headers.get('Content-Type') ?? 'application/json',
      ...(res.headers.get('Retry-After')
        ? { 'Retry-After': res.headers.get('Retry-After')! }
        : {}),
    },
  })
}
