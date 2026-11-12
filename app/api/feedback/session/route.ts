// /api/feedback/session — lets a signed-in partner use the feedback widget.
//
// POST   (Authorization: Bearer <partner token>) → checks the token with the
//        ERP and sets the short-lived feedback cookie. Answers
//        { enabled: false } when the feature is not configured, so the widget
//        stays hidden.
// DELETE → clears the cookie (partner signed out).
//
// No GET on purpose: the GitHub Pages static export would try to prerender it.
// See lib/feedback/goblin.ts.

import { NextRequest, NextResponse } from 'next/server'
import {
  clearedSessionCookie,
  goblinConfig,
  mintSession,
  partnerClientId,
  sessionCookie,
} from '@/lib/feedback/goblin'

function isHttps(req: NextRequest): boolean {
  return new URL(req.url).protocol === 'https:'
}

export async function POST(req: NextRequest) {
  const config = goblinConfig()
  if (!config) return NextResponse.json({ enabled: false })

  const header = req.headers.get('authorization') ?? ''
  const bearer = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : ''
  if (!bearer) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Partner sign-in required' } }, { status: 401 })
  }

  const clientId = await partnerClientId(config.erpBase, bearer)
  if (!clientId) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Partner sign-in required' } }, { status: 401 })
  }

  const res = NextResponse.json({ enabled: true })
  res.headers.set('Set-Cookie', sessionCookie(mintSession(clientId, config.trustSecret), isHttps(req)))
  res.headers.set('Cache-Control', 'no-store')
  return res
}

export async function DELETE(req: NextRequest) {
  const res = new NextResponse(null, { status: 204 })
  res.headers.set('Set-Cookie', clearedSessionCookie(isHttps(req)))
  return res
}
