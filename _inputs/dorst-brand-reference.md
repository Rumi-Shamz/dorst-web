# Dorst Craft Beer — Brand Reference
> Internal brand toolkit · v1 · Sofia, Bulgaria · est. 2017
> Use this file as persistent project knowledge in Claude.ai chats.

---

## 1. Who is Dorst

**Founded:** 2017 by Dean (Bulgarian) and Erwin (Dutch), met in Oxford.
**Location:** Brews in Bankya, near Sofia.
**Capacity:** 4000+ L/month · 20+ styles brewed · 10 beers in rotation.
**Tagline:** "Drink well, drink whale!"
**Sub-tagline:** "Bulgarian-Dutch beer love."

**The persona in one line:** Two friends in a brewery, talking to you across the bar.

**Four brand traits:**
- Fond of hops — ingredients are characters with names and families
- Deeply European — Bulgarian-Dutch, trilingual by habit
- Transparent — proudly from 2017, unfiltered, unpasteurised, vegan
- Mildly anarchic — pop-culture puns, beers brewed "just because"

**The whale:** The brand mascot. Hand-drawn, appears on every label in a different scene (breaching, winged, swimming through stars). The logo is the DORST wordmark + "Est. 2017". Never redraw the whale as a flat vector or emoji.

---

## 2. Color System

### Core palette
| Token | Hex | Use |
|---|---|---|
| `--ink` | `#0E0E10` | Default text, borders, wordmark on light |
| `--ink-soft` | `#25232A` | Secondary text |
| `--foam` | `#F4EFE5` | Default page/background color (warm cream) |
| `--paper` | `#FBF7EC` | Card backgrounds |
| `--sun` | `#F4D52A` | Brand accent — highlights, kickers |
| `--magenta` | `#D52A6E` | Brand accent — active states, chapter markers |
| `--aubergine` | `#3D1B4A` | Dark surfaces, sidebar |
| `--aubergine-deep` | `#220C2C` | Darkest brand surface (hero backgrounds) |
| `--sea` | `#1E4DA0` | Secondary — whale, footer, pan-brand dark |
| `--hop` | `#7CB342` | Supporting green accent |
| `--orange-nl` | `#F08A1E` | **Dutch orange — reserved for limited/special editions only** |

### Per-beer colors (sampled from real label artwork)
| Beer | Dominant `--b-*` | Contrast ink | Status |
|---|---|---|---|
| Lion Heart | `#00ACF0` | `#0E0E10` | Final label |
| Alma | `#1C4D4A` | `#D9A441` | Final label |
| Hippy Shake | `#F5832A` | `#2A2C72` | Final label |
| Alexis | `#EA236D` | `#FFC41C` | Final label |
| Pulpa Fiction | `#ED1848` | `#FFDE02` | Final label |
| Full Breakfast Stout | `#5B3A8C` | `#7BC4A4` | Final label |
| Karl | `#5BC0EB` | `#0E2A66` | No label yet — provisional |
| Evrozona | `#102050` | `#F4C430` | Draft artwork |
| .bit | `#7A431F` | `#E2A03F` | No label yet — provisional |
| .wit | `#E2C24E` | `#5A6E2A` | No label yet — provisional |

### The one-color rule
On any single surface (label, poster, product page): use **one** beer color + cream paper + ink. Never mix two beer colors. Loudness comes from commitment to one hue, not from mixing many.

---

## 3. Typography

### The workhorse: Montserrat
- Body, UI, headlines, captions, navigation — if it isn't a beer name or the wordmark, it's Montserrat
- Weights: 400 · 500 · 600 · 700 · 800 · 900
- Covers full Cyrillic — never switch fonts for Bulgarian copy
- Google Fonts CDN: `family=Montserrat:wght@400;500;600;700;800;900`

### Type scale
| Size / Weight | Role |
|---|---|
| 96px / 900 | Hero display |
| 48px / 700 | Page title H1 |
| 36px / 700 | Section heading H2 |
| 28px / 600 | Subsection H3 |
| 18px / 500 | Lead paragraph |
| 16px / 400 | Body copy |
| 12px / 600 uppercase | Microcaps — UNFILTERED · VEGAN |

### Spec voice: Anonymous Pro Bold
- For can spec strips, batch numbers, best-before dates
- Always uppercase, letter-spaced
- Big number in Montserrat Black, unit label in mono
- Separator: mid-dot `·`
- Example: `5.5% · 12.5° · 330ml`

### Display library (one face per beer, never mix two)
| Font | Locked to |
|---|---|
| Resagokr | Lion Heart · Karl |
| Yarin | Alma |
| Satellite | Alexis |
| Koshey | Pulpa Fiction |
| Blogger Sans | Evrozona |
| Caviar Dreams | Hippy Shake |
| Days | .wit |
| Meta | Full Breakfast Stout · .bit |

**Rule:** One display face per composition. Display faces are for beer names only — never body copy. When a new beer needs a face, pick from this list before adding a new font.

### Intro Script
- For the brand line only: *"drink well, drink whale!"*
- And chalkboard CTAs at events
- Never use for headings, beer names, or paragraphs

---

## 4. Voice & Tone

### The whole voice in one line
Two friends in a brewery, talking to you across the bar.

### Three habits
1. **"We" & "you"** — First-person plural for the brewery, second-person for the reader. Never "the company" or "Dorst is committed to…"
2. **Hops are characters** — Ingredients have families, ranks and personalities. Tell a tiny story, never a flavour list. Example: *"Two hop brothers Amarillo and Mosaic come together… backed by their sister Hallertau…"*
3. **Be specific** — Name the hop, the year, the quirky fact. Generic craft language is the enemy.

### Two non-negotiable rules
- **No emoji. Anywhere.** The brand has illustration. If you need a glyph: `° % / ·`
- **Mid-dot spec separators:** `5.5% · 12.5° · 330ml` — never commas or `5.5%, 12.5 plato`

### Trilingual rule
All packaging: **English / Français / Български** — in that order.
Web: Bulgarian-first, English fallback.
Never machine-translate brand puns — "лъвско сърце" is a deliberate Lion Heart pun.

### Words we never use
`premium` · `curated` · `elevated` · `experience` · `crafted with passion` · `artisanal` · `journey` · `hand-crafted`

### Real copy examples to reference
- Tagline: *"Citrus, clarity and character. The beer everyone orders twice."*
- Mini-story: *"Mosaic brings blueberry and mango, Simcoe layers in pine and citrus, Columbus closes with depth and backbone."*
- Wry: *"Welcome to the Eurozone. At least the beer is official."*
- Punchline: *"Not a compromise. A choice."*

---

## 5. Beer Profiles

### LION HEART — New England IPA
**Color:** `#00ACF0` · **Display font:** Resagokr
**Specs:** 5.5% · 12.5° · IBU 40–50 · 330/500ml · Serve 6–8°C · Tulip
**Hops:** Amarillo, Mosaic, Hallertau Blanc · **Colour:** Yellow, clear
**EN tagline:** Citrus, clarity and character. The beer everyone orders twice.
**BG tagline:** Цитруси, светлина и характер. Бирата, която всички поръчват повторно.
**Story:** Some beers need explaining. Lion Heart just gets ordered — twice. Amarillo brings orange and grapefruit, Mosaic layers in tropical depth, Hallertau Blanc finishes with white grape and florals. Light on the body, complex on the palate.
**Pairing:** Asian cuisine — Thai curry, sushi, pad thai. Grilled chicken, light cheeses.

---

### ALMA — Vienna Hazy IPA
**Color:** `#1C4D4A` · **Display font:** Yarin
**Specs:** 5.1% · 12.4° · IBU 35–45 · 330ml · Serve 6–8°C · Tulip
**Hops:** Centennial, Mosaic · **Colour:** Pale amber
**EN tagline:** Classic malt, modern hops. Vienna, reimagined.
**BG tagline:** Класически малц, модерни хмелове. Виена, преосмислена.
**Story:** Vienna malt is an old craft — aromatic, warm, with a delicate sweetness. Centennial and Mosaic are modernists: citrus, tropics, intensity. Alma is where the two worlds meet — structured like a classic IPA, juicy like a contemporary Hazy. Sunset in a glass.
**Pairing:** Mexican cuisine, spiced burgers, aged cheeses.

---

### HIPPY SHAKE — New England IPA
**Color:** `#F5832A` · **Display font:** Caviar Dreams
**Specs:** 6.9% · 15.5° · IBU 50–60 · 500ml · Serve 6–8°C · Tulip
**Hops:** Mosaic, Simcoe, Columbus · **Colour:** Yellow
**EN tagline:** Bulgaria's first NEIPA. Still unmatched.
**BG tagline:** Първата NEIPA в България. Все още незаменима.
**Story:** 2017. NEIPA is a new style, barely known in Bulgaria. Hippy Shake changes that — dense, juicy, uncompromising. Mosaic brings blueberry and mango, Simcoe layers in pine and citrus, Columbus closes with depth and backbone. Years later, the recipe hasn't changed, because there's been no reason to.
**Pairing:** Spicy wings, BBQ, cheddar burgers.

---

### ALEXIS — Pale Ale
**Color:** `#EA236D` · **Display font:** Satellite
**Specs:** 4.9% · 11.5° · IBU 25–35 · 500ml · Serve 8–10°C · Pint
**Hops:** Simcoe, Loral · **Colour:** Pale yellow
**EN tagline:** Fresh, light, uncomplicated. A Pale Ale for every occasion.
**BG tagline:** Свежа, лека, без излишно. Pale Ale за всеки повод.
**Story:** Not every beer needs to impress with intensity. Alexis impresses with balance. Simcoe adds light citrus character, Loral brings floral and grassy nuance. Brewed for a birthday, kept for its character.
**Pairing:** Salads, grilled fish, light pasta.

---

### KARL — Session NEPA
**Color:** `#5BC0EB` (provisional) · **Display font:** Resagokr
**Specs:** 5.0% · 11.5° · IBU 30–40 · 500ml · Serve 6–8°C · Tulip
**Hops:** Amarillo, Mosaic, Hallertau Blanc · **Colour:** Yellow
**EN tagline:** The familiar flavour. Less alcohol.
**BG tagline:** Познатият вкус. По-малко алкохол.
**Story:** Lion Heart is the legend. Karl is the version that lets you have more. The same hop trio, the same aromas — but at 5.0% the body is lighter and built for longer evenings. Not a compromise. A choice.
**Pairing:** Chicken wings, light starters, margherita pizza.
**Note:** No final label artwork yet.

---

### EVROZONA — Brussels Pale Ale
**Color:** `#102050` (draft) · **Display font:** Blogger Sans
**Specs:** 4.9% · 10° · IBU 20–30 · 500ml · Serve 8–10°C · Belgian glass
**Hops:** Kazbek, Styrian Wolf, Magnum · **Colour:** Golden yellow
**EN tagline:** Welcome to the Eurozone. At least the beer is official.
**BG tagline:** Добре дошли в еврозоната. Поне бирата е официална.
**Story:** Brewed with Belgian yeast and European hops to mark Bulgaria's entry into the Eurozone. Moderate bitterness, grassy and lightly fruity, with a barely-there estery note from the Belgian yeast. Golden like the stars on the flag.
**Pairing:** Belgian mussels, herb chicken, soft cheeses.
**Note:** Draft artwork — final label pending.

---

### .BIT — English Best Bitter
**Color:** `#7A431F` (provisional) · **Display font:** Meta
**Specs:** 4.2% · 10.9° · IBU 25–35 · 500ml · Serve 10–12°C · Pint
**Hops:** East Kent Golding, Godiva, Magnum · **Colour:** Dark amber
**EN tagline:** Earthy, honest, English. Nothing more.
**BG tagline:** Земен, честен, английски. Без излишно.
**Story:** English Best Bitter is the style that built British pub culture: earthy, moderately bitter, dark amber and unapologetically authentic. East Kent Golding is the classic English hop — floral, earthy, understated. A beer with character and without pretension.
**Pairing:** Roast meats, beef pie, aged hard cheeses.
**Note:** No final label artwork yet.

---

### .WIT — Witbier
**Color:** `#E2C24E` (provisional) · **Display font:** Days
**Specs:** 4.7% · 10.1° · IBU 10–15 · 500ml · Serve 4–6°C · Wheat glass
**Hops:** Hallertau Blanc, Magnum · **Colour:** Pale golden, hazy
**EN tagline:** Tradition with a hop twist.
**BG tagline:** Традиция с хмелов обрат.
**Story:** Wheat beer is an old style. Witbier is its modern update — Hallertau Blanc adds elderflower, lime and white-wine aromas over the classic base of banana, clove and coriander. Light, hazy and surprisingly complex.
**Pairing:** Seafood, lemon chicken, fresh salads.
**Note:** No final label artwork yet.

---

### PULPA FICTION — Sour NEIPA
**Color:** `#ED1848` · **Display font:** Koshey
**Specs:** 7.0% · 13.8° · IBU 20–30 · 500ml · Serve 6–8°C · Tulip
**Hops:** Centennial, Mosaic, Hallertau Blanc · **Colour:** Deep yellow
**EN tagline:** Sour, fruity, hoppy. All at once.
**BG tagline:** Кисело, плодово, хмелено. Всичко наведнъж.
**Story:** Sour and hoppy rarely meet in balance. Pulpa Fiction is the exception — Dorst's first sour (2025). Centennial brings grapefruit and orange, Mosaic layers in tropical depth, Hallertau Blanc finishes with florals, and over it all sits a bright acidity that refreshes rather than dominates.
**Pairing:** Goat's cheese, Thai cuisine, citrus desserts.

---

### FULL BREAKFAST STOUT — Imperial Stout
**Color:** `#5B3A8C` · **Display font:** Meta
**Specs:** 9.0% · 24.0° · 500ml · Serve 8–14°C · Snifter
**Hops:** Earthy hops · **Colour:** Black
**EN tagline:** Sometimes bigger is better.
**Story:** We took our fan-favourite Breakfast Stout and super-sized it, so there's even more to love. Creamy body, chocolate aromas and earthy hops at a warming 9.0%. Indulge.
**Pairing:** Chocolate desserts, roasted coffee, blue cheese.

---

## 6. Label Anatomy (the brief for the template project)

### What every can must contain (fixed)
1. **DORST wordmark** — supplied lockup, centre-top, never re-typeset
2. **Beer name** — in the one display face locked to that beer
3. **Whale / hero illustration** — hand-drawn, beer-specific
4. **Style + hop bill** — e.g. "NEIPA · Amarillo & Mosaic"
5. **Mini-story blurb** — one paragraph, brand voice
6. **Ingredients trilingual** — EN / FR / BG with hop illustration
7. **Barcode + batch number** — mono, best-before line
8. **Legal triad** — UNFILTERED · UNPASTEURISED · VEGAN
9. **Spec panel** — ABV · ml · plato, gridded
10. **Serving temp** — "BEST ENJOYED COLD 6°–10°C"
11. **Compliance icons** — recycling, ALU, –18, no-drive · CAN/CANETTE/КЕНЧЕ

### Fixed vs. free
**Fixed by the template:** wordmark, spec panel grid, legal triad, trilingual ingredients, barcode/batch, compliance icons, type system (Montserrat + Anonymous Pro), mid-dot separators.

**Free per beer:** hero illustration & scene, dominant background color, beer-name display face (from library), mini-story copy, illustration medium, accent color.

### The drift problem
Labels currently range from systematic grid (Lion Heart, Alexis, Pulpa Fiction) to painterly/figurative (Alma), graphic vector (Hippy Shake), and AI photoreal (Evrozona). The template should lock the structural skeleton, not the art direction.

---

## 7. Digital Tokens (web handoff)

```css
:root {
  /* Core */
  --ink: #0E0E10;
  --ink-soft: #25232A;
  --foam: #F4EFE5;
  --paper: #FBF7EC;
  --sun: #F4D52A;
  --magenta: #D52A6E;
  --aubergine: #3D1B4A;
  --aubergine-deep: #220C2C;
  --sea: #1E4DA0;
  --hop: #7CB342;
  --orange-nl: #F08A1E; /* limited editions only */

  /* Per-beer */
  --b-lion: #00ACF0;
  --b-alma: #1C4D4A;
  --b-hippy: #F5832A;
  --b-alexis: #EA236D;
  --b-pulpa: #ED1848;
  --b-stout: #5B3A8C;
  --b-karl: #5BC0EB;
  --b-evrozona: #102050;
  --b-bit: #7A431F;
  --b-wit: #E2C24E;

  /* Type */
  --font-sans: 'Montserrat', system-ui, sans-serif;
  --font-mono: 'Anonymous Pro', ui-monospace, monospace;

  /* Radius — crisp, never silicon-valley */
  --radius-xs: 2px;
  --radius-pill: 999px;

  /* Motion */
  --ease-out: cubic-bezier(.22, .61, .36, 1);
  --dur: 200ms;
}
```

### Component rules
- **Buttons:** pill radius · 2px ink border · **invert on hover** (ink↔foam) — this inversion is the signature interaction
- **Cards:** `background: var(--paper); border: 1px solid var(--line); border-radius: 2px` — cream on cream, never the rounded-card + left-colored-border pattern
- **Label card variant:** swap hairline for `4px solid var(--ink)`, drop shadow — the can-aware product tile
- **Tags/pills:** Montserrat, uppercase, letter-spaced, pill radius
- **Spec strip:** big number in Montserrat Black, unit in Anonymous Pro, mid-dot separators

### Forbidden on brand surfaces
- Frosted-glass blur
- Gradient backgrounds (exception: single vertical foam→ink photo-protection gradient)
- Neon glow / drop shadows on print elements
- Bounce/spring animations, parallax, particle effects
- Rounded cards with left-colored-border accent (generic AI/web pattern)
- Any radius above 2px on label-aware components

### Allowed motion
- Fade-up on scroll: 8px · 220ms · `--ease-out`
- Color cross-fade on hover: 200ms
- Scroll-locked horizontal product carousels

---

## 8. Assets status

| Asset | Location | Status |
|---|---|---|
| DORST wordmark (transparent) | `assets/brand/logo-dorst.png` | ✓ |
| Whale mark | `assets/brand/whale-only.png` | ✓ |
| Lion Heart label | `assets/labels/lion-heart.png` | ✓ Final |
| Alma label | `assets/labels/alma.png` | ✓ Final |
| Hippy Shake label | `assets/labels/hippy-shake.png` | ✓ Final |
| Alexis label | `assets/labels/alexis.png` | ✓ Final |
| Pulpa Fiction label | `assets/labels/pulpa-fiction.jpg` | ✓ Final |
| Full Breakfast Stout label | `assets/labels/stout.png` | ✓ Final |
| Evrozona label | `assets/labels/evrozona.png` | Draft |
| Karl label | — | Pending |
| .bit label | — | Pending |
| .wit label | — | Pending |

---

*Dorst Brand Book v1 · Internal use · Extend for partners later*
*Next project: single master label template (Illustrator/Figma) with locked frames and swappable zones*
