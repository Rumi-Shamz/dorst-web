# Dorst Website Project — Domain Knowledge & Decision Log

**Project type:** Full website rebuild (marketing + e-commerce + B2B portal)  
**Date of session:** June 2026  
**Status:** Architecture decided, prototypes built, ready to port into Next.js MPA

---

## 1. Company Context

- **Dorst** — craft brewery, Bankya, Bulgaria, est. 2017
- Co-founders: Dean (Bulgarian) + Erwin (Dutch)
- Name "Dorst" = thirst in Dutch
- Production: ~4,000L/month
- B2C: canned beer only, Sofia delivery only (for now)
- B2B: full range — cans + kegs (20L and 30L)
- Whale is the core brand character — not just a logo, a narrative device across all brand materials

---

## 2. Tech Stack (Decided)

| Layer | Tool | Notes |
|---|---|---|
| Framework | Next.js (static export) | Same stack as CRM system — shared components possible |
| CMS | Sanity (headless) | Non-dev friendly, multilingual BG/EN built-in |
| Payments | Stripe | Not integrated yet — architecture must support it. No live Stripe in v1. |
| Hosting | Vercel | Justified over GitHub Pages: next/image optimisation for photography-heavy site |
| BG Registry | Търговски регистър API | VAT auto-fill for B2B onboarding (ЕИК lookup) |
| Email | Resend | Reuse from CRM system |
| Analytics | Plausible (recommended) | Privacy-friendly, no cookie banner needed |

**Why Next.js over Astro:** B2B portal requires complex stateful React (multi-step flow). Astro would become a React island anyway. Also parallel CRM build in same stack — shared mental model, shared components.

**Why Vercel over GitHub Pages:** `next/image` handles WebP, lazy loading, responsive sizing automatically. Dropping this for a photography-heavy brand site would require manual image handling.

---

## 3. Site Architecture

```
/ (Homepage)
/beers              → full lineup, filterable. Click can → /beers/[slug]
/beers/[slug]       → individual beer page (reference: cohones.beer style)
/shop               → B2C can store, Sofia only. Stripe-ready architecture, not wired yet.
/locations          → city columns, venue rows, Google Maps links
/about              → extended from homepage section
partners.dorst.bg   → B2B portal (subdomain, separate deployment concern)
```

**Language:** BG + EN from day one. Toggle in nav, persistent across site. Content via Sanity (multilingual).

---

## 4. Visual Direction & Brand

### Brand Book Palette (extracted from brand book thumbnail)
- `#220C2C` — Dark aubergine (primary brand background/dark mode)
- `#F4EFE5` — Warm cream (text on dark backgrounds)
- `#F4D52A` — Yellow/gold (primary accent)
- `#D52A6E` — Magenta (secondary accent)

### Typography (brand book)
- Display: **Montserrat 900** (wordmark, headlines)
- Secondary: **Georgia italic** (subheadings, accents)

### Prototype typography (HTML prototype, to be reconciled with brand book)
- Display: Fraunces (optical serif, personality)
- Body: Outfit (clean geometric sans)

> **Note for next chat:** The HTML prototype was built before the brand book was reviewed. The brand book shows a dark aubergine palette. The user previously confirmed they prefer a light/bright base for the website ("light/bright with colors that demand attention"). These may coexist — aubergine for dark sections/stats bar, cream/white as the primary page background. Reconcile with brand book content.

### Beer accent color system
Each beer has one signature accent color pulled from its label, used for cards, CTAs, hover states:
- Lion Heart (West Coast IPA): `#D94F0A` orange
- Full Breakfast (Pastry Stout): `#1C0D00` near-black
- Alexis (Pale Ale): `#C8940E` gold
- Hippy Shake (NEIPA): `#2B5C1A` forest green
- Alma (Summer seasonal): `#E8B84B` golden yellow

### Whale
- Core recurring brand character — illustrated SVG, not just a logo stamp
- Appears in hero (large, floating animation), nav (small), footer
- Should appear across marketing materials and future campaigns

---

## 5. Design Reference Sites

| Site | What to use |
|---|---|
| alchemik.beer | Cinematic product photography, whitespace discipline |
| cometa.beer | Working shop, BG/EN toggle, dead-simple nav |
| tetrapod.beer | Services + locations page structure |
| idbrew.com | Scroll narrative, founder story section |
| **cohones.beer/ctrlaltdel-...** | Beer subpage structure — used as reference for individual beer pages |

---

## 6. Page Specifications

### Homepage (built — HTML prototype exists)
7 sections: Hero → Beer lineup → Stats bar → Origin story → Seasonal spotlight → Locations teaser → B2B strip → Footer

### Beers page + Beer subpages (to build)
- Grid, filterable by: All | Cans | Kegs | Seasonal
- Clicking a can image navigates to `/beers/[slug]`
- Subpage reference: cohones.beer individual beer page style
- Subpage should include: full description, tasting notes, ABV, IBU, ingredients, pairing suggestions, add to cart (cans only)

### Shop / Cart (to build)
- B2C cans only, Sofia delivery
- No Stripe integration in v1 — but architecture must support it (Stripe Checkout session pattern, webhook receiver)
- Guest checkout (no account required)
- Minimum order configurable via Sanity

### About page (to build — extends homepage section)
- Origin story (full length)
- Team: Dean + Erwin (photo + bio)
- Brewery section: equipment/tanks photo, production stats
- Whale brand section: visual identity narrative

### Locations page (to build)
- City headers as columns, venue cards below
- Name + one-line description, hyperlinked to Google Maps
- No map embed — deep links only
- Managed entirely in Sanity

---

## 7. B2B Partner Portal (partners.dorst.bg)

### Access control (4 layers)
1. Subdomain — not linked from main site, excluded from robots.txt
2. Shared access code — given to partners at onboarding (OR registration flow below)
3. VAT (ЕИК) verification — against Търговски регистър API
4. CRM cross-check — if VAT matches existing client, skip to order; if new, onboarding flow

### Registration flow (updated)
- New partners enter ЕИК
- System fetches: `https://portal.registryagency.bg/CR/en/Reports/ActiveConditionTabResult?uic={ЕИК}`
- Extracts: company name, representative person, VAT registration, address
- Partner manually adds: email (for confirmation + invoice delivery)
- On confirm → POST to CRM to create client record

### Existing partner flow (Step 2 — updated)
After ЕИK verification, verified partners see:
- **Invoices** — Archive (paid) + Pending payments
- **Order tracking** — see below

### Order flow (Step 3 — simplified)
- Product table: all SKUs (cans + 20L/30L kegs)
- Qty selectors → inventory check → confirm
- **Payment options: Cash invoice (pay at delivery) + Bank transfer invoice ONLY**
- Card payment via Stripe removed

### Confirmation / Order tracking (Step 4 — updated)
Progress bar with 4 stages:
1. **Confirmed** — Invoice generated, placed in courier tasks (system automated)
2. **Confirmed by courier** — tick off: courier has seen/accepted the job
3. **Dispatched** — tick off: goods left storage
4. **Delivered** — signed by client at delivery

---

## 8. Sanity CMS Content Model

Managed by Dean or non-technical team:
- **Beer** — name (BG+EN), style, ABV, IBU, description (BG+EN), tasting notes, ingredients, accent HEX, can image, label image, format (can/keg/both), keg sizes, seasonal flag + dates, active flag
- **Venue** — name, city, type, Google Maps URL, description (BG+EN), active flag
- **Page copy** — hero headline, tagline, brewery story, B2B pitch (all BG+EN pairs)
- **Team member** — name, role (BG+EN), bio (BG+EN), photo, order
- **Seasonal spotlight** — which beer, active dates

---

## 9. Pre-Launch Content Checklist

**Photography (per beer)**
- [ ] Front label shot — white background, high-res
- [ ] Lifestyle shot — beer in context
- [ ] Angled hero shot for cards

**Photography (brewery)**
- [ ] Equipment/tanks
- [ ] Team photo
- [ ] Exterior or interior

**Brand assets**
- [ ] Logo SVG — dark bg, light bg, icon-only, whale-only variants
- [ ] Per-beer label — vector or PNG transparent
- [ ] HEX color codes per beer (confirmed from brand book)

**Copy**
- [ ] Origin story (150–200 words, BG+EN)
- [ ] Per-beer description + tasting notes (BG+EN)
- [ ] Team bios (BG+EN)
- [ ] B2B partner pitch (BG+EN)

**Locations**
- [ ] Full venue list: name, city, type, Google Maps URL, description (BG+EN)

**Legal**
- [ ] Privacy policy
- [ ] Terms of sale
- [ ] Cookie policy

---

## 10. Files Produced in This Session

| File | Description |
|---|---|
| `dorst_website_spec.docx` | Full website technical spec — stack, pages, B2B portal, CMS, integrations |
| `dorst_website.html` | Homepage HTML prototype — our design direction |
| `dorst_partners.html` | B2B portal HTML prototype — 5-screen flow |

---

## 11. What the Next Chat Needs to Do

**Goal:** Port the HTML prototype design into a proper Next.js MPA with Sanity CMS, then build the 4 new pages.

**Priority order:**
1. Set up Next.js project with our CSS system (brand book palette + Fraunces/Outfit or Montserrat/Georgia per brand book)
2. Port homepage HTML → `app/page.tsx` + components
3. Build `/beers` + `/beers/[slug]` (cohones.beer reference for subpage)
4. Build `/shop` with cart state (Stripe-ready architecture, not wired)
5. Build `/about`
6. Build `/locations`
7. Finalise `partners.dorst.bg` portal with updated flows (registration, invoice/tracking view, no card payment, delivery progress bar)

**Key constraint:** Brand book palette must be applied. Reconcile with light-base preference stated by founder. Likely resolution: `#F4EFE5` cream as primary page bg, `#220C2C` aubergine for dark sections (stats bar, footer, hero overlay), `#F4D52A` yellow as primary CTA accent.
