// lib/feedback/goblin.ts
// Server side of the pr-goblin feedback widget on the partner portal: config,
// the short-lived feedback session, the trusted-reporter proof, and the checks
// /api/feedback makes before handing a report to pr-goblin's intake
// (vendor/pr-goblin).
//
// Who can report: signed-in B2B partners only. The partner's ERP bearer token
// lives in sessionStorage and the widget cannot send it, so the portal trades
// it once for a signed HttpOnly cookie (POST /api/feedback/session, which
// checks the token against the ERP's /api/partner/me), and the widget's report
// rides on that cookie.
//
// This repo is PUBLIC, and so are its issues. A report therefore names the
// partner only by an opaque id (`partner:<ERP client id>`), and never carries a
// screenshot, captured console/network logs or the referrer. What the partner
// types is published as-is.
//
// Plain TypeScript with no path aliases, so `node --test` can load it directly.

import { createHmac, timingSafeEqual } from "node:crypto"

export const DEFAULT_GOBLIN_REPO = "Rumi-Shamz/dorst-web"
/** Reports carry no screenshot, so a few hundred KB is plenty. */
export const MAX_REPORT_BYTES = 256 * 1024
export const SESSION_COOKIE = "dorst_feedback"
export const SESSION_COOKIE_PATH = "/api/feedback"
export const SESSION_TTL_SECONDS = 60 * 60

export interface GoblinConfig {
  githubToken: string
  githubRepo: string
  trustSecret: string
  erpBase: string
}

/**
 * null when the feature is not configured: the session route answers
 * `{ enabled: false }` (so the widget never mounts) and the report route 503.
 */
export function goblinConfig(env: Record<string, string | undefined> = process.env): GoblinConfig | null {
  const githubToken = env.PR_GOBLIN_GITHUB_TOKEN?.trim()
  const trustSecret = env.PR_GOBLIN_TRUST_SECRET?.trim()
  const erpBase = env.NEXT_PUBLIC_ERP_API_URL?.trim().replace(/\/$/, "")
  if (!githubToken || !trustSecret || !erpBase) return null
  return {
    githubToken,
    trustSecret,
    erpBase,
    githubRepo: env.PR_GOBLIN_GITHUB_REPO?.trim() || DEFAULT_GOBLIN_REPO,
  }
}

const CLIENT_ID = /^[0-9A-Za-z-]{8,64}$/

export function isClientId(value: unknown): value is string {
  return typeof value === "string" && CLIENT_ID.test(value)
}

/** Same wire format as pr-goblin's signReporter: hex HMAC-SHA256 of the login. */
export function signLogin(login: string, secret: string): string {
  return createHmac("sha256", secret).update(login).digest("hex")
}

export interface Reporter {
  name: null
  login: string
  proof: string
}

/** The partner as they appear on the (public) issue: an opaque ERP client id, no company name. */
export function reporterFor(clientId: string, secret: string): Reporter {
  const login = `partner:${clientId}`
  return { name: null, login, proof: signLogin(login, secret) }
}

// ── Feedback session cookie ─────────────────────────────────────────────────
// `<base64url {"c":clientId,"e":expiry}>.<hex HMAC>`. The HMAC input is
// prefixed, so a session value can never double as a reporter proof.

function sessionMac(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(`dorst-feedback-session:${payload}`).digest("hex")
}

export function mintSession(clientId: string, secret: string, nowSeconds = Math.floor(Date.now() / 1000)): string {
  const payload = Buffer.from(JSON.stringify({ c: clientId, e: nowSeconds + SESSION_TTL_SECONDS })).toString("base64url")
  return `${payload}.${sessionMac(payload, secret)}`
}

/** The client id the cookie was minted for, or null if it is missing, forged or expired. */
export function readSession(
  value: string | null | undefined,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): string | null {
  if (!value) return null
  const dot = value.indexOf(".")
  if (dot <= 0) return null
  const payload = value.slice(0, dot)
  const mac = Buffer.from(value.slice(dot + 1), "hex")
  const expected = Buffer.from(sessionMac(payload, secret), "hex")
  if (mac.length !== expected.length || !timingSafeEqual(mac, expected)) return null
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { c?: unknown; e?: unknown }
    if (!isClientId(data.c) || typeof data.e !== "number" || data.e <= nowSeconds) return null
    return data.c
  } catch {
    return null
  }
}

export function sessionCookie(value: string, secure: boolean): string {
  return [
    `${SESSION_COOKIE}=${value}`,
    `Path=${SESSION_COOKIE_PATH}`,
    `Max-Age=${SESSION_TTL_SECONDS}`,
    "HttpOnly",
    "SameSite=Strict",
    ...(secure ? ["Secure"] : []),
  ].join("; ")
}

export function clearedSessionCookie(secure: boolean): string {
  return [`${SESSION_COOKIE}=`, `Path=${SESSION_COOKIE_PATH}`, "Max-Age=0", "HttpOnly", "SameSite=Strict", ...(secure ? ["Secure"] : [])].join("; ")
}

// ── Partner check against the ERP ───────────────────────────────────────────

/**
 * The ERP client id behind a partner bearer token, via the ERP's own partner
 * auth (Supabase session + partner_portal_enabled client). null when the ERP
 * says no or cannot be reached.
 */
export async function partnerClientId(erpBase: string, bearer: string, fetchImpl: typeof fetch = fetch): Promise<string | null> {
  try {
    const res = await fetchImpl(`${erpBase}/api/partner/me`, {
      headers: { Authorization: `Bearer ${bearer}`, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const me = (await res.json()) as { id?: unknown }
    return isClientId(me.id) ? me.id : null
  } catch {
    return null
  }
}

// ── Report checks ───────────────────────────────────────────────────────────

export type PreparedReport =
  | { ok: true; body: Record<string, unknown> }
  | { ok: false; status: number; code: string; message: string }

/**
 * Parses a raw report and makes it safe for a public issue: the reporter is
 * always the session's partner (signed here, never trusted from the page), and
 * the screenshot, captured logs and referrer are dropped.
 */
export function prepareReport(raw: string, reporter: Reporter): PreparedReport {
  if (raw.length > MAX_REPORT_BYTES) {
    return { ok: false, status: 413, code: "TOO_LARGE", message: "Report is too large" }
  }
  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return { ok: false, status: 400, code: "INVALID_JSON", message: "Invalid JSON body" }
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, status: 400, code: "INVALID_BODY", message: "Invalid report" }
  }
  const report = body as Record<string, unknown>
  const context =
    report.context && typeof report.context === "object" && !Array.isArray(report.context)
      ? { ...(report.context as Record<string, unknown>), logs: [], referrer: null }
      : report.context
  return { ok: true, body: { ...report, context, user: reporter, screenshot: null } }
}

// ── Per-partner rate limit ──────────────────────────────────────────────────
// Best effort: in memory, per server instance. Reports already need a valid
// partner session, so this only stops a runaway loop or an over-eager partner.

const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 5
const recent = new Map<string, number[]>()

export function allowReport(clientId: string, nowMs = Date.now()): boolean {
  const kept = (recent.get(clientId) ?? []).filter((t) => nowMs - t < WINDOW_MS)
  if (kept.length >= MAX_PER_WINDOW) {
    recent.set(clientId, kept)
    return false
  }
  kept.push(nowMs)
  recent.set(clientId, kept)
  if (recent.size > 1000) recent.clear()
  return true
}
