import type { GateRunOutput } from './types'

const MAX_DIAGNOSTIC_SNIPPET_CHARS = 1500

const ROOT_CAUSE_PATTERNS = [
  /failed to resolve import/i,
  /cannot find module/i,
  /should not be imported outside/i,
  /error occurred prerendering page/i,
  /next\.js build worker exited/i,
  /\berror:/i,
  /does not exist/i,
  /workspace_not_prepared/i,
]

const NOISY_LINE_PATTERNS = [
  /^▲\s+next\.js/i,
  /^-\s+environments:/i,
  /^creating an optimized production build/i,
  /^collecting page data/i,
  /^generating static pages/i,
  /^finalizing page optimization/i,
  /^>\s/,
  /^run\s+v/i,
  /^test files\s+/i,
  /^tests?\s+/i,
  /^start at\s+/i,
  /^duration\s+/i,
  /^⎯+/,
  /^✓\s+/,
  /^⚠\s+/,
  /^\s*at\s+/,
]

function normalizeLines(snippet: string): string[] {
  return snippet
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

function pickRootCauseLine(lines: string[]): string | null {
  for (const pattern of ROOT_CAUSE_PATTERNS) {
    const match = lines.find((line) => pattern.test(line))
    if (match) return match
  }
  return null
}

function pickFallbackLine(lines: string[]): string | null {
  for (const line of lines) {
    const noisy = NOISY_LINE_PATTERNS.some((pattern) => pattern.test(line))
    if (!noisy) return line
  }
  return null
}

function getReportReason(gate: GateRunOutput): string | null {
  if (!gate.report) return null
  return typeof gate.report.reason === 'string' ? gate.report.reason : null
}

function getReportSnippet(gate: GateRunOutput): string | null {
  if (!gate.report) return null
  return typeof gate.report.snippet === 'string' ? gate.report.snippet : null
}

export function extractPrimaryGateFailureDetail(gate: GateRunOutput): string | null {
  if (gate.passed) return null

  const reason = getReportReason(gate)
  if (reason) return reason

  const snippet = getReportSnippet(gate)
  if (!snippet) return null

  const lines = normalizeLines(snippet)
  if (lines.length === 0) return null

  const rootCause = pickRootCauseLine(lines)
  if (rootCause) return rootCause.slice(0, 220)

  const fallback = pickFallbackLine(lines)
  if (fallback) return fallback.slice(0, 220)

  return lines[0].slice(0, 220)
}

export function extractGateFailureDiagnosticSnippet(gate: GateRunOutput): string | null {
  if (gate.passed) return null

  const snippet = getReportSnippet(gate)
  if (!snippet) return null

  const normalized = snippet.trim()
  if (!normalized) return null

  if (normalized.length <= MAX_DIAGNOSTIC_SNIPPET_CHARS) {
    return normalized
  }

  return normalized.slice(-MAX_DIAGNOSTIC_SNIPPET_CHARS)
}

export function buildGateEventDiagnostics(gate: GateRunOutput): {
  summary?: string
  reason?: string
  diagnosticSnippet?: string
} {
  if (gate.passed) return {}

  const summary = extractPrimaryGateFailureDetail(gate)
  const reason = getReportReason(gate)
  const diagnosticSnippet = extractGateFailureDiagnosticSnippet(gate)

  return {
    ...(summary ? { summary } : {}),
    ...(reason ? { reason } : {}),
    ...(diagnosticSnippet ? { diagnosticSnippet } : {}),
  }
}

export function buildFailedGateSummary(gates: GateRunOutput[]): string {
  return gates
    .filter((gate) => {
      if (gate.passed) return false
      const reason = getReportReason(gate)
      return reason !== 'skipped_due_to_previous_failure'
    })
    .map((gate) => {
      const detail = extractPrimaryGateFailureDetail(gate)
      return detail ? `${gate.gateType} (${detail})` : gate.gateType
    })
    .join(', ')
}
