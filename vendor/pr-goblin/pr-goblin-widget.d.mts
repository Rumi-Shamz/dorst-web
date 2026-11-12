// Types for the vendored pr-goblin widget (widget/src/index.js). Only what this app uses.

export interface PrGoblinUser {
  name?: string | null
  login?: string | null
  proof?: string | null
}

export interface PrGoblinConfig {
  endpoint: string
  projectName?: string
  user?: PrGoblinUser | null
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left"
  variant?: "pill" | "tab"
  side?: "left" | "right"
  triggerLabel?: string
  captureLogs?: boolean
  screenshot?: boolean
  theme?: "auto" | "none"
  color?: string
}

declare const PrGoblin: {
  version: string
  init(config: PrGoblinConfig): unknown
  open(): void
  close(): void
  destroy(): void
}

export default PrGoblin
