// /api/feedback — pr-goblin feedback widget → GitHub issue on this repo.
//
// POST only: a report from the partner-portal widget, handed to pr-goblin's
// intake, which files it as a GitHub issue. Requires the feedback cookie set
// by /api/feedback/session (signed-in partners only). The reporter is signed
// here from that cookie, so partner reports are trusted and labelled `goblin`.
//
// Issues on this repo are PUBLIC: no screenshot, logs or referrer is sent, and
// the partner is named only by an opaque ERP client id. See
// lib/feedback/goblin.ts.

import { NextRequest, NextResponse } from 'next/server'
import {
  MAX_REPORT_BYTES,
  SESSION_COOKIE,
  allowReport,
  goblinConfig,
  prepareReport,
  readSession,
  reporterFor,
} from '@/lib/feedback/goblin'
import { envFromRecord, handleFeedbackRequest } from '@/vendor/pr-goblin/pr-goblin-intake.mjs'

export const runtime = 'nodejs'

function error(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function POST(req: NextRequest) {
  const config = goblinConfig()
  if (!config) return error('FEEDBACK_DISABLED', 'Feedback is not configured', 503)

  const clientId = readSession(req.cookies.get(SESSION_COOKIE)?.value, config.trustSecret)
  if (!clientId) return error('UNAUTHORIZED', 'Partner sign-in required', 401)

  // The cookie is SameSite=Strict; this also refuses a cross-site POST outright.
  const origin = new URL(req.url).origin
  const sentOrigin = req.headers.get('origin')
  if (sentOrigin && sentOrigin !== origin) return error('FORBIDDEN', 'Cross-origin report', 403)

  if (Number(req.headers.get('content-length') ?? 0) > MAX_REPORT_BYTES) {
    return error('TOO_LARGE', 'Report is too large', 413)
  }
  if (!allowReport(clientId)) return error('RATE_LIMITED', 'Too many reports, try again in a few minutes', 429)

  const prepared = prepareReport(await req.text(), reporterFor(clientId, config.trustSecret))
  if (!prepared.ok) return error(prepared.code, prepared.message, prepared.status)

  const env = envFromRecord({
    ALLOWED_ORIGIN: origin,
    GITHUB_TOKEN: config.githubToken,
    GITHUB_REPO: config.githubRepo,
    TRUST_SECRET: config.trustSecret,
    SCREENSHOTS: 'off',
  })
  return handleFeedbackRequest(
    new Request(req.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: origin },
      body: JSON.stringify(prepared.body),
    }),
    env,
  )
}
