function normalizeSummary(summary: string): string {
  return summary.trim().replace(/\s+/g, ' ')
}

export function isDeterministicGateFailure(
  currentSummary: string,
  previousSummary: string | null
): boolean {
  if (previousSummary === null) return false

  const normalizedCurrent = normalizeSummary(currentSummary)
  const normalizedPrevious = normalizeSummary(previousSummary)

  if (normalizedCurrent.length === 0 || normalizedPrevious.length === 0) return false

  return normalizedCurrent === normalizedPrevious
}
