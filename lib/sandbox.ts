// Staging/preview builds of the website talk to the staging ERP (sandbox data).
// Opt-in only: set NEXT_PUBLIC_SANDBOX=1 on the Vercel *Preview* environment.
// Never on a production build, even if the flag leaks into Production env.
export const SANDBOX_BANNER_TEXT = 'Sandbox: changes are wiped on reset'

export const isSandbox =
  process.env.NEXT_PUBLIC_SANDBOX === '1' && process.env.NEXT_PUBLIC_VERCEL_ENV !== 'production'
