// Types for the vendored pr-goblin intake library (intake/src/lib.ts).

export interface Env {
  ALLOWED_ORIGIN: string
  GITHUB_TOKEN?: string
  GITHUB_REPO?: string
  LINEAR_API_KEY?: string
  LINEAR_TEAM_KEY?: string
  LINEAR_PROJECT?: string
  TRUST_SECRET?: string
  WEBHOOK_SECRET?: string
  SCREENSHOTS?: string
}

export function envFromRecord(record: Record<string, string | undefined>): Env
export function handleFeedbackRequest(request: Request, env: Env): Promise<Response>
export function signReporter(login: string, secret: string): Promise<string>
export function isTrustedReporter(
  login: string | null | undefined,
  proof: string | null | undefined,
  secret: string | null | undefined,
): Promise<boolean>
export const READY_LABEL: string
export const UNTRUSTED_LABEL: string
