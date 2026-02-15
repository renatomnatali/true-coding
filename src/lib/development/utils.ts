import crypto from 'crypto'

export function hashInput(input: unknown): string {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(input ?? {}))
    .digest('hex')
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 50)
}

export function toBranchName(runId: string, iterationIndex: number, name: string): string {
  const shortRun = runId.slice(0, 8)
  return `iter/${shortRun}-${iterationIndex}-${slugify(name) || 'scope'}`
}

export function toFeatureTag(name: string): string {
  return `@iter-${slugify(name).replace(/-/g, '_') || 'scope'}`
}

export const TERMINAL_RUN_STATUSES = new Set([
  'FAILED',
  'CANCELED',
  'SUCCEEDED',
])
