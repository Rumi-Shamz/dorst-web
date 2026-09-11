# Dorst Website — Next.js Build Handoff

## Context
Building a full website for Dorst Brewery (Bankya, Bulgaria). Previous chat produced architecture decisions, a technical spec (dorst_website_spec.docx), an HTML homepage prototype (dorst_website.html), and a B2B portal prototype (dorst_partners.html). All three are uploaded to this project.

The brand book (Dorst_Brand_Book.html) is also uploaded. It contains full brand guidelines.

## What is already done
- Full technical spec document
- HTML homepage prototype — design direction is confirmed and preferred by the founder
- HTML B2B portal prototype — 5-screen flow (access → VAT verify → order → payment → confirm)
- Architecture decision: **Next.js (static export) + Sanity CMS + Vercel**

## Goal for this chat
Port the HTML prototype design into a proper **Next.js 16 MPA** with Sanity CMS, using the brand book palette, then build all required pages.

## Brand palette (extracted from brand book)
- `#220C2C` — Dark aubergine (brand signature, dark sections, footer, hero overlays)
- `#F4EFE5` — Warm cream (primary page background + text on dark)
- `#F4D52A` — Yellow/gold (primary CTA accent)
- `#D52A6E` — Magenta (secondary accent)
- Typography display: **Montserrat 900** (wordmark/headlines per brand book)
- Typography body: Outfit or DM Sans (clean, readable)
- **Reconciliation note:** Founder confirmed preference for a light/bright website base. Use `#F4EFE5` cream as primary bg, `#220C2C` for dark sections (stats bar, footer, hero area). NOT a fully dark site.

## Beer accent color system
Each beer has its own HEX accent used for cards, CTAs, subpages:
- Lion Heart (West Coast IPA): `#D94F0A`
- Full Breakfast (Pastry Stout): `#1C0D00`
- Alexis (Pale Ale): `#C8940E`
- Hippy Shake (NEIPA): `#2B5C1A`
- Alma (Summer seasonal): `#E8B84B`

## Pages to build (in priority order)

### 1. Homepage — `app/page.tsx`
Port from HTML prototype. 7 sections:
Hero → Beer lineup → Stats bar → Origin story → Seasonal spotlight → Locations teaser → B2B strip → Footer
Whale SVG is a core illustrated element — floating animation in hero, small in nav/footer.

### 2. Beers page + subpages — `app/beers/page.tsx` + `app/beers/[slug]/page.tsx`
- Grid, filterable: All | Cans | Kegs | Seasonal
- Clicking can image → individual beer subpage
- Subpage reference: https://cohones.beer/ctrlaltdel-cbd-infuzed-hazy-ipa/ (competitor, for structure inspiration)
- Subpage: full description, tasting notes, ABV, IBU, ingredients, pairing, add to cart (cans only)

### 3. Shop + Cart — `app/shop/page.tsx`
- B2C cans only, Sofia delivery
- **No live Stripe in v1** — but architect for it: Stripe Checkout session pattern, webhook receiver stub
- Guest checkout, no account
- Cart state in React (useState/useReducer), not localStorage
- Minimum order configurable in Sanity

### 4. About — `app/about/page.tsx`
- Origin story (full)
- Team: Dean + Erwin
- Brewery section
- Whale brand narrative section

### 5. Locations — `app/locations/page.tsx`
- City headers as columns
- Venue cards: name + description + Google Maps deep link
- No map embed
- Content from Sanity

### 6. B2B Portal — `app/(b2b)/` served on partners.dorst.bg

**Updated flows from original prototype:**

**Step 1 — Identify / Register**
- Existing partners: enter ЕИК → system recognises → proceed
- New partners: enter ЕИК → system fetches from Trade Register: `https://portal.registryagency.bg/CR/en/Reports/ActiveConditionTabResult?uic={ЕИК}` → extract company name, representative, VAT, address → partner manually adds email → confirm → POST to CRM

**Step 2 — Dashboard (existing partners)**
After verification, show:
- Invoices: Archive (paid) + Pending payments
- Order tracking (see Step 4)

**Step 3 — Order**
- All SKUs: cans + kegs 20L/30L
- Qty selectors → live inventory check → confirm
- Payment options: Cash invoice (pay at delivery) | Bank transfer invoice
- **Remove card/Stripe payment entirely from B2B flow**

**Step 4 — Delivery tracking progress bar**
4 stages:
1. Confirmed — invoice generated, placed in courier tasks (automated)
2. Confirmed by courier — courier tick-off (seen/accepted)
3. Dispatched — goods left storage (tick-off)
4. Delivered — signed by client at delivery

## Sanity CMS content types needed
- Beer (name BG+EN, style, ABV, IBU, description, tasting notes, ingredients, accentHex, canImage, labelImage, format, kegSizes, seasonal, seasonalStart, seasonalEnd, active)
- Venue (name, city, type, googleMapsUrl, description BG+EN, active)
- PageCopy (heroHeadline, tagline, story, b2bPitch — all BG+EN)
- TeamMember (name, role BG+EN, bio BG+EN, photo, order)

## Language
BG + EN from day one. Persistent toggle in nav. Content via Sanity multilingual fields.

## Key constraints
- All placeholder text/images are fine — founder will replace with real content
- Cart: in-memory React state only (no browser storage APIs — they don't work in Claude artifacts)
- Stripe: design the API route structure (`app/api/stripe/checkout.ts`, `app/api/stripe/webhook.ts`) but don't wire live keys
- CRM integration stubs: `app/api/b2b/verify-vat.ts`, `app/api/b2b/check-inventory.ts`, `app/api/b2b/create-order.ts`

## Files to reference (uploaded to project)
- `dorst_website_domain_knowledge.md` — full context, decisions, beer data, venue list
- `dorst_website_spec.docx` — original technical spec
- `dorst_website.html` — homepage HTML prototype (design source of truth)
- `dorst_partners.html` — B2B portal HTML prototype (update with new flows above)
- `Dorst_Brand_Book.html` — brand guidelines (render in browser to see full content)

## Start here
1. Read the domain knowledge doc and brand book
2. Set up the Next.js project CSS vars with the brand palette
3. Extract and componentise the whale SVG, nav, and footer from the HTML prototype
4. Then proceed page by page in priority order above
