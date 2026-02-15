const ACTIVE_RUNS = new Set<string>()

export function markRunActive(runId: string): boolean {
  if (ACTIVE_RUNS.has(runId)) {
    return false
  }
  ACTIVE_RUNS.add(runId)
  return true
}

export function unmarkRunActive(runId: string): void {
  ACTIVE_RUNS.delete(runId)
}

export function isRunActive(runId: string): boolean {
  return ACTIVE_RUNS.has(runId)
}
