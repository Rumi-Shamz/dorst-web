# Next session — Dorst Web

**Path:** `/home/ikigai/Dev/clients/dorst/dorst-web`  
**Engagement:** `freelance-gig` → **framework** `forge`  
**Venture:** `_inputs/venture.json` → Forge `proj03-dorst-web`

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
