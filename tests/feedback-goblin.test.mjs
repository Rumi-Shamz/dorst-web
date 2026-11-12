// pr-goblin partner feedback: the app's side (session cookie, signing, report
// scrubbing) against the vendored intake, with GitHub faked at fetch.
// Run: node --test tests/   (Node 22.18+ loads the .ts file directly)

import { afterEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_GOBLIN_REPO,
  MAX_REPORT_BYTES,
  SESSION_TTL_SECONDS,
  allowReport,
  clearedSessionCookie,
  goblinConfig,
  mintSession,
  partnerClientId,
  prepareReport,
  readSession,
  reporterFor,
  sessionCookie,
  signLogin,
} from '../lib/feedback/goblin.ts'
import { envFromRecord, handleFeedbackRequest, signReporter } from '../vendor/pr-goblin/pr-goblin-intake.mjs'

const CLIENT = '3f2a9c1e-7b4d-4e8a-9c2f-1a2b3c4d5e6f'
const SECRET = 'test-trust-secret'
const NOW = 1_800_000_000

function report(extra = {}) {
  return {
    type: 'bug',
    description: 'Order button does nothing',
    expectedBehavior: 'The order is placed',
    screenshot: 'data:image/png;base64,iVBORw0KGgo=',
    user: { name: 'Acme Ltd', login: 'someone@else.example', proof: 'ab'.repeat(32) },
    context: {
      url: 'https://dorst.top/partners/',
      viewport: { w: 1280, h: 800 },
      userAgent: 'UA',
      browser: 'Firefox',
      os: 'Linux',
      timestamp: '2026-11-12T10:00:00.000Z',
      referrer: 'https://dorst.top/partners/?eik=123456789',
      logs: [{ level: 'error', message: 'GET /api/partner/orders/abc 500', ts: '10:00:00' }],
    },
    ...extra,
  }
}

const realFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = realFetch
})

function stubGitHub() {
  const calls = []
  globalThis.fetch = async (input, init = {}) => {
    const url = String(input)
    const method = (init.method ?? 'GET').toUpperCase()
    calls.push({ method, url, body: init.body ? JSON.parse(init.body) : undefined })
    if (method === 'POST' && url.endsWith('/issues')) {
      return new Response(JSON.stringify({ html_url: 'https://github.com/o/r/issues/5', number: 5 }), { status: 201 })
    }
    return new Response('{}', { status: 200 })
  }
  return calls
}

describe('goblinConfig', () => {
  it('is off unless the GitHub token, trust secret and ERP URL are all set', () => {
    const full = { PR_GOBLIN_GITHUB_TOKEN: 't', PR_GOBLIN_TRUST_SECRET: 's', NEXT_PUBLIC_ERP_API_URL: 'https://erp.example/' }
    assert.equal(goblinConfig({}), null)
    for (const key of Object.keys(full)) {
      assert.equal(goblinConfig({ ...full, [key]: '' }), null, `missing ${key}`)
    }
    assert.deepEqual(goblinConfig(full), {
      githubToken: 't',
      trustSecret: 's',
      erpBase: 'https://erp.example',
      githubRepo: DEFAULT_GOBLIN_REPO,
    })
  })
})

describe('reporter', () => {
  it('names the partner only by client id, signed the way pr-goblin checks it', async () => {
    const r = reporterFor(CLIENT, SECRET)
    assert.deepEqual(r, { name: null, login: `partner:${CLIENT}`, proof: signLogin(`partner:${CLIENT}`, SECRET) })
    assert.equal(r.proof, await signReporter(r.login, SECRET))
  })
})

describe('feedback session cookie', () => {
  it('round-trips the client id until it expires', () => {
    const value = mintSession(CLIENT, SECRET, NOW)
    assert.equal(readSession(value, SECRET, NOW + 10), CLIENT)
    assert.equal(readSession(value, SECRET, NOW + SESSION_TTL_SECONDS), null)
  })

  it('refuses a forged, re-signed or garbled cookie', () => {
    const value = mintSession(CLIENT, SECRET, NOW)
    const [payload, mac] = value.split('.')
    const other = Buffer.from(JSON.stringify({ c: 'aaaaaaaa-0000', e: NOW + 999 })).toString('base64url')
    assert.equal(readSession(`${other}.${mac}`, SECRET, NOW), null)
    assert.equal(readSession(mintSession(CLIENT, 'wrong-secret', NOW), SECRET, NOW), null)
    assert.equal(readSession(`${payload}.zz`, SECRET, NOW), null)
    assert.equal(readSession(payload, SECRET, NOW), null)
    assert.equal(readSession('', SECRET, NOW), null)
    assert.equal(readSession(undefined, SECRET, NOW), null)
  })

  it('a reporter proof is not a valid session signature', () => {
    const payload = Buffer.from(JSON.stringify({ c: CLIENT, e: NOW + 999 })).toString('base64url')
    assert.equal(readSession(`${payload}.${signLogin(payload, SECRET)}`, SECRET, NOW), null)
  })

  it('is HttpOnly, SameSite=Strict, scoped to /api/feedback, Secure on https', () => {
    const c = sessionCookie('v', true)
    for (const part of ['dorst_feedback=v', 'Path=/api/feedback', 'HttpOnly', 'SameSite=Strict', 'Secure', `Max-Age=${SESSION_TTL_SECONDS}`]) {
      assert.ok(c.includes(part), part)
    }
    assert.ok(!sessionCookie('v', false).includes('Secure'))
    assert.ok(clearedSessionCookie(true).includes('Max-Age=0'))
  })
})

describe('partnerClientId', () => {
  it("asks the ERP's /api/partner/me with the partner's bearer", async () => {
    let seen
    const id = await partnerClientId('https://erp.example', 'tok', async (url, init) => {
      seen = { url: String(url), auth: init.headers.Authorization }
      return new Response(JSON.stringify({ id: CLIENT, name: 'Acme' }), { status: 200 })
    })
    assert.equal(id, CLIENT)
    assert.deepEqual(seen, { url: 'https://erp.example/api/partner/me', auth: 'Bearer tok' })
  })

  it('is null when the ERP refuses, is unreachable, or returns no usable id', async () => {
    assert.equal(await partnerClientId('https://e', 't', async () => new Response('{}', { status: 401 })), null)
    assert.equal(await partnerClientId('https://e', 't', async () => { throw new Error('down') }), null)
    assert.equal(await partnerClientId('https://e', 't', async () => new Response('{"id":"x"}')), null)
    assert.equal(await partnerClientId('https://e', 't', async () => new Response('not json')), null)
  })
})

describe('prepareReport', () => {
  it('replaces the reporter and drops screenshot, logs and referrer', () => {
    const out = prepareReport(JSON.stringify(report()), reporterFor(CLIENT, SECRET))
    assert.ok(out.ok)
    assert.deepEqual(out.body.user, reporterFor(CLIENT, SECRET))
    assert.equal(out.body.screenshot, null)
    assert.deepEqual(out.body.context.logs, [])
    assert.equal(out.body.context.referrer, null)
    assert.equal(out.body.context.url, 'https://dorst.top/partners/')
  })

  it('refuses bad JSON and oversized bodies', () => {
    const r = reporterFor(CLIENT, SECRET)
    assert.equal(prepareReport('{', r).status, 400)
    assert.equal(prepareReport('[]', r).status, 400)
    assert.equal(prepareReport('x'.repeat(MAX_REPORT_BYTES + 1), r).status, 413)
  })
})

describe('allowReport', () => {
  it('lets a partner file 5 reports per 10 minutes', () => {
    const id = 'ratelimit-test-client'
    for (let i = 0; i < 5; i++) assert.ok(allowReport(id, 1000 + i))
    assert.equal(allowReport(id, 2000), false)
    assert.ok(allowReport(id, 1000 + 10 * 60 * 1000))
  })
})

describe('partner report through the vendored intake', () => {
  const env = () =>
    envFromRecord({ ALLOWED_ORIGIN: 'https://dorst.top', GITHUB_TOKEN: 't', GITHUB_REPO: 'o/r', TRUST_SECRET: SECRET, SCREENSHOTS: 'off' })

  function post(body) {
    return handleFeedbackRequest(
      new Request('https://dorst.top/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: 'https://dorst.top' },
        body: JSON.stringify(body),
      }),
      env(),
    )
  }

  it('becomes a trusted goblin issue with no company name, logs, referrer or screenshot', async () => {
    const calls = stubGitHub()
    const prepared = prepareReport(JSON.stringify(report()), reporterFor(CLIENT, SECRET))
    assert.ok(prepared.ok)
    const res = await post(prepared.body)

    assert.equal(res.status, 201)
    const json = await res.json()
    assert.equal(json.trusted, true)
    const issue = calls.find((c) => c.method === 'POST' && c.url.endsWith('/repos/o/r/issues'))
    assert.deepEqual(issue.body.labels, ['user-feedback', 'bug', 'goblin'])
    const text = issue.body.body
    assert.ok(text.includes(`partner:${CLIENT}`))
    assert.ok(text.includes('Order button does nothing'))
    for (const leak of ['Acme', 'someone@else.example', 'eik=123456789', '/api/partner/orders', reporterFor(CLIENT, SECRET).proof]) {
      assert.ok(!text.includes(leak), `issue body leaks ${leak}`)
    }
    assert.ok(!calls.some((c) => c.method === 'PUT' || c.url.includes('bug-report-screenshots')))
  })

  it('a report with a forged proof is still filed, but untrusted', async () => {
    const calls = stubGitHub()
    const login = `partner:${CLIENT}`
    const res = await post({ ...report(), screenshot: null, user: { name: null, login, proof: signLogin(login, 'wrong') } })
    assert.equal((await res.json()).trusted, false)
    const issue = calls.find((c) => c.method === 'POST' && c.url.endsWith('/issues'))
    // The runner holds anything labelled `untrusted` until a human removes it.
    assert.ok(issue.body.labels.includes('untrusted'))
  })
})
