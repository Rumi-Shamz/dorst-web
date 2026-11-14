/**
 * Resolve an untrusted `?return=` value to a same-origin path.
 *
 * Returns `pathname + search + hash` (prefixed with `basePath` when the value
 * does not already carry it) or `/`-rooted fallback on any problem.
 * Pure function so it can be exercised without a browser.
 */
export function resolveReturnPath(
  raw: string | null | undefined,
  origin: string,
  basePath = '',
): string {
  const fallback = basePath ? `${basePath}/` : '/'
  if (!raw || !raw.startsWith('/')) return fallback
  // Backslashes and ASCII control chars (tab, CR, LF, ...) are normalised away by
  // URL parsers, turning e.g. "/\evil.com" or "/\t/evil.com" into another host.
  // eslint-disable-next-line no-control-regex
  if (/[\\\u0000-\u001f\u007f]/.test(raw)) return fallback
  try {
    const url = new URL(raw, origin)
    if (url.origin !== new URL(origin).origin) return fallback
    const path = url.pathname + url.search + url.hash
    if (!basePath) return path
    return path === basePath || path.startsWith(`${basePath}/`) || path.startsWith(`${basePath}?`)
      ? path
      : basePath + path
  } catch {
    return fallback
  }
}
