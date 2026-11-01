import { SANDBOX_BANNER_TEXT, isSandbox } from '@/lib/sandbox'

/** Fixed bottom strip on sandbox builds (see lib/sandbox.ts). */
export function SandboxBanner() {
  if (!isSandbox) return null
  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-[1000] flex h-7 items-center justify-center bg-[var(--sun)] px-4 text-xs font-semibold text-[var(--ink)]"
    >
      {SANDBOX_BANNER_TEXT}
    </div>
  )
}
