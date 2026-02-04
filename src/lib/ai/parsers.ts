import type { BusinessPlan } from '@/types'

export interface ExtractionResult<T> {
  data: T | null
  repaired: boolean
}

export function extractJSON<T>(response: string): ExtractionResult<T> {
  // 1. Complete code block: ```json ... ```
  const completeBlock = response.match(/```json\s*\n?([\s\S]*?)\n?\s*```/)
  if (completeBlock) {
    try {
      return { data: JSON.parse(completeBlock[1].trim()), repaired: false }
    } catch {
      // fall through — block content might be malformed
    }
  }

  // 2. Truncated code block: ```json ... (no closing ```)
  //    Grab everything after ```json and try to repair by closing open braces/brackets
  const truncatedBlock = response.match(/```json\s*\n?([\s\S]*)$/)
  if (truncatedBlock) {
    const repaired = repairJSON(truncatedBlock[1].trim())
    if (repaired) return { data: repaired as T, repaired: true }
  }

  // 3. Bare JSON object anywhere in the response (greedy — last valid object wins)
  const directMatch = response.match(/\{[\s\S]*\}/)
  if (directMatch) {
    try {
      return { data: JSON.parse(directMatch[0]), repaired: false }
    } catch {
      const repaired = repairJSON(directMatch[0])
      if (repaired) return { data: repaired as T, repaired: true }
    }
  }

  // 4. Bare truncated JSON: { sem fechamento — tudo desde o primeiro { até o fim
  const bareOpen = response.match(/\{[\s\S]*$/)
  if (bareOpen) {
    const repaired = repairJSON(bareOpen[0])
    if (repaired) return { data: repaired as T, repaired: true }
  }

  return { data: null, repaired: false }
}

/**
 * Best-effort repair of truncated JSON: closes any unclosed braces and brackets,
 * strips trailing commas before closing delimiters, and removes incomplete key-value pairs.
 */
function repairJSON(raw: string): unknown | null {
  let s = raw
    .replace(/,\s*([}\]])/g, '$1')   // trailing commas
    .replace(/,\s*$/g, '')            // trailing comma at end

  // Remove an incomplete last property (key with no value or partial string)
  // e.g. `"foo": "bar` or `"foo":` at the very end
  s = s.replace(/,?\s*"[^"]*":\s*"[^"]*$/, '')
  s = s.replace(/,?\s*"[^"]*":\s*$/, '')

  // Close unclosed braces and brackets in reverse order
  const stack: string[] = []
  let inString = false
  let escape = false
  for (const ch of s) {
    if (escape) { escape = false; continue }
    if (ch === '\\') { escape = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue
    if (ch === '{' || ch === '[') stack.push(ch === '{' ? '}' : ']')
    if (ch === '}' || ch === ']') stack.pop()
  }
  // Close everything that's still open
  s += stack.reverse().join('')

  try {
    return JSON.parse(s)
  } catch {
    return null
  }
}

export function isPlanReady(response: string): boolean {
  return (
    response.includes('```json') &&
    (response.includes('"coreFeatures"') || response.includes('"architecture"'))
  )
}

export function extractBusinessPlan(response: string): BusinessPlan | null {
  return extractJSON<BusinessPlan>(response).data
}
