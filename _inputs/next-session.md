# Next session — Dorst Web

**Path:** `/home/ikigai/Dev/clients/dorst/dorst-web`  
**Engagement:** `freelance-gig` → **framework** `forge`  
**Venture:** `_inputs/venture.json` → Forge `proj03-dorst-web`

---

## Session — 15 Sep 2026 (B2C checkout + Find Dorst)

**Branch at wrap-up:** `main` @ `d53584c` (clean)  
**Related:** merge `feature/fix-b2c-partner-login-bugs` → `main`; branch deleted  
**Engagement:** `freelance-gig` → `forge`  
**Framework log:** `projects-feedback/proj03-dorst-web/logs/sessions/2026-09-15-b2c-checkout-find-dorst.md`

### What happened this session
- B2C shop: ERP-driven listing (`b2c_unit_price_eur_cents`); min 20 cans; typed qty; `localStorage` cart; real `/shop/checkout` + `/api/b2c/orders` proxy.
- Find Dorst: Bulgaria copy; header+CTA; card grid; `/locations` city separators.
- Partner login form wrap + friendlier duplicate-email / registry errors.
- Ops: captcha “missing config” fixed by setting `NEXT_PUBLIC_TURNSTILE_SITE_KEY` on **dorst-web** Vercel (not `_SITE`); `*.vercel.app` wildcards unsupported in Turnstile.
- Shipped to `main` (`d53584c`).

### Commits this session
| Commit | Summary |
|--------|---------|
| `88fe28e` | Ship B2C shop checkout, cart persistence, and Find Dorst redesign |
| `d53584c` | Merge feature/fix-b2c-partner-login-bugs into main |

### Next actions
#### Must do
- [ ] Partner portal brand-book download when logged in ([#8](https://github.com/Rumi-Shamz/dorst-web/issues/8))

#### Should do
- [ ] Prod smoke: full B2C order receives confirmation email ([#11](https://github.com/Rumi-Shamz/dorst-web/issues/11))
- [ ] Keep Turnstile hostname allowlist on `dorst.top` / `www.dorst.top` (no `*.vercel.app`)

#### Nice to have
- [ ] Whale jump animation (TODO in WhaleHero)
- [ ] Revisit local `NEXT_PUBLIC_ERP_API_URL` docs ([#5](https://github.com/Rumi-Shamz/dorst-web/issues/5))

### Human verification (if any)
- [ ] Place ≥20-can guest order on dorst.top with Turnstile; confirm success UI + email ([#11](https://github.com/Rumi-Shamz/dorst-web/issues/11))
- [ ] Find Dorst homepage + `/locations` look correct on mobile

**Branch policy:** already on `main`; merge N/A. **Verification class:** Human QA.

---

## Session — 11 Sep 2026 (cleanup + export fix)

**Branch at wrap-up:** `main` @ `4b17406`  
**Framework log:** `projects-feedback/proj03-dorst-web/logs/sessions/2026-09-11-web-cleanup-export-fix-close.md`

### What happened
- Cleanup to main (`17a5347`): no Sanity/Stripe/ui dump; brand-book kept under `public/brand-book/`.
- Dev fix (`4b17406`): export only for GitHub Pages; turbopack.root; client age-gate fallback.

### Next actions
#### Must do
- [ ] Partner portal brand-book download when logged in ([#8](https://github.com/Rumi-Shamz/dorst-web/issues/8))
#### Should do
- [ ] Commit `_inputs/venture.json` on main
- [ ] Drop obsolete remotes if unused
#### Nice to have
- [ ] Whale jump animation (TODO in WhaleHero)

### Human verification
- [ ] `npm run dev` on :3000 after killing orphan next processes; age gate redirects
