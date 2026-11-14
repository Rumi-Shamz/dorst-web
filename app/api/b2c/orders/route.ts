import { isIP } from 'node:net'
import { NextRequest, NextResponse } from 'next/server'
import { MINIMUM_CANS } from '@/lib/shop'

const ERP_BASE = process.env.NEXT_PUBLIC_ERP_API_URL?.replace(/\/$/, '') ?? ''

/** Server-only. Must match the ERP's B2C_PROXY_SECRET (>= 32 chars). */
const PROXY_SECRET = process.env.B2C_PROXY_SECRET ?? ''

const MAX_BODY_BYTES = 32 * 1024
const UPSTREAM_TIMEOUT_MS = 15_000

/** Shopper IP from platform-set headers; undefined unless it parses as an IP. */
function getClientIp(req: NextRequest): string | undefined {
  const candidates = [
    req.headers.get('x-vercel-forwarded-for'),
    req.headers.get('x-forwarded-for')?.split(',')[0],
    req.headers.get('x-real-ip'),
  ]
  for (const c of candidates) {
    const ip = c?.trim()
    if (ip && isIP(ip) !== 0) return ip
  }
  return undefined
}

/** Read the request body as text, aborting once it exceeds `max` bytes. */
async function readBodyCapped(req: NextRequest, max: number): Promise<string | null> {
  const declared = Number(req.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > max) return null
  if (!req.body) return ''
  const reader = req.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > max) {
      await reader.cancel().catch(() => {})
      return null
    }
    chunks.push(value)
  }
  return Buffer.concat(chunks).toString('utf8')
}

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

  let rawBody: string | null
  try {
    rawBody = await readBodyCapped(req, MAX_BODY_BYTES)
  } catch {
    rawBody = ''
  }
  if (rawBody === null) {
    return NextResponse.json(
      { error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body too large' } },
      { status: 413 }
    )
  }

  let body: unknown
  try {
    body = JSON.parse(rawBody)
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

  const upstreamHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
  if (PROXY_SECRET) {
    upstreamHeaders['x-dorst-proxy-secret'] = PROXY_SECRET
    const ip = getClientIp(req)
    if (ip) upstreamHeaders['x-dorst-client-ip'] = ip
  }

  let res: Response
  let text: string
  try {
    res = await fetch(`${ERP_BASE}/api/public/orders`, {
      method: 'POST',
      headers: upstreamHeaders,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    })
    text = await res.text()
  } catch (err) {
    console.error('[b2c/orders] upstream request failed:', err)
    return NextResponse.json(
      {
        error: {
          code: 'UPSTREAM',
          message: 'Order service is temporarily unavailable. Please try again later.',
        },
      },
      { status: 502 }
    )
  }

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
