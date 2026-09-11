# Dorst Brewery — website

Next.js site for [Dorst Brewery](https://dorst.top).

## Local development

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000 (or the port Next.js prints if 3000 is busy).

## Deploy

### Vercel (primary — dorst.top)

Connect the repo and deploy from `main`. Add custom domain **dorst.top**. Do **not** set `GITHUB_PAGES` on Vercel (that would add a `/dorst-web` basePath).

Copy `.env.example` to `.env.local` and fill in the values for local development.

Production env on Vercel must include:

```env
NEXT_PUBLIC_ERP_API_URL=https://app.dorst.top
```

Partner portal lives at **https://dorst.top/partners/** and calls the ERP at `app.dorst.top`.

### Brand assets

- Logo and beer labels live in `public/brand/` and `public/labels/`.
- The **brand book** is a single self-contained HTML file at `public/brand-book/index.html` (~8 MB), served at `/brand-book/`. Age-gate is skipped for that path. Partner-portal download for logged-in partners is planned next; keep this as the only copy of the asset.

Partner portal (`/partners`) authenticates against the ERP via `NEXT_PUBLIC_ERP_API_URL` (EIK + emailed password). That value is the **ERP website origin** (local `http://localhost:<erp-port>`, production `https://app.dorst.top`). Put it in `dorst-web/.env.local` for local, and as a Vercel env for `dorst.top`. Tracking at `/partners/tracking` uses the partner session.

### GitHub Pages (static preview only)

A workflow builds a **static export** for preview/demo. API routes and middleware do not run on Pages.

1. **Settings → Pages → Source:** GitHub Actions
2. Push to `main`, or run **Actions → Deploy to GitHub Pages**

Preview URL depends on the GitHub org that owns the Pages site (this repo’s `origin` is `Rumi-Shamz/dorst-web`).

To test the Pages build locally:

```bash
GITHUB_PAGES=true GITHUB_REPOSITORY=Rumi-Shamz/dorst-web pnpm build
npx serve out -p 3001
# → http://localhost:3001/dorst-web/
```
