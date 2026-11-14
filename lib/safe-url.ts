/**
 * Return `value` (normalised) only when it is an absolute https: URL, or an
 * http: URL pointing at localhost. Anything else (javascript:, data:, relative
 * values, garbage, empty) yields `undefined`, so it can be used directly as
 * `href={safeExternalUrl(x)}` and in `window.open` guards.
 *
 * Meant for API-sourced links. Do NOT pass browser-created `blob:` URLs
 * through it; those never come from the network.
 */
export function safeExternalUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  let url: URL
  try {
    url = new URL(value.trim())
  } catch {
    return undefined
  }
  if (url.protocol === 'https:') return url.href
  if (
    url.protocol === 'http:' &&
    (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]')
  ) {
    return url.href
  }
  return undefined
}
