import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** @type {import('next').NextConfig} */
const isGithubPages = process.env.GITHUB_PAGES === 'true'
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'dorst-web'
const basePath = isGithubPages ? `/${repoName}` : ''
const configDir = path.dirname(fileURLToPath(import.meta.url))

const nextConfig = {
  // Static export only for GitHub Pages. Local `next dev` and Vercel need a
  // normal Next server so middleware (age gate) can run.
  ...(isGithubPages ? { output: 'export' } : {}),
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Avoid picking up /home/.../Dev/package-lock.json as the workspace root.
  turbopack: {
    root: configDir,
  },
}

export default nextConfig
