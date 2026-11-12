# pr-goblin (vendored)

Built files from [pr-goblin](https://github.com/Rumi-Shamz/pr-goblin) **v0.1.0** (tag `v0.1.0`, commit `b64685e588ab8613330e25c3da25bf9432dd63a6`), the feedback widget → GitHub issue → agent PR module. Do not edit them here; change pr-goblin, release, and re-vendor.

| File | Built by (in pr-goblin) | sha256 | Used by |
|---|---|---|---|
| `pr-goblin-intake.mjs` | `cd intake && pnpm build:lib` (byte-identical to the release asset `pr-goblin-intake-v0.1.0.mjs`) | `16d34528b47d8977772493075bd130ce8f408a544e0cff5bdba5ecec38ab69e0` | `app/api/feedback/route.ts` (server only) |
| `pr-goblin-widget.mjs` | `cd widget && pnpm build` → `dist/pr-goblin.es.js` (the release ships only the IIFE build) | `39e1673b6488945f5cbec7fba271ff7a155bbf056a88cbf82804f82e85019678` | `components/feedback/PartnerFeedback.tsx` (client, lazy-loaded) |

The `.d.mts` files are hand-written types covering only what this app uses.

To update: check out the new tag in pr-goblin, build both, copy them over these two files, and update the version, commit and hashes above. Keep the runner pin in `.github/workflows/goblin.yml` on the same release.
