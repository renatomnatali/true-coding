import type { BusinessPlan } from '@/types'

export function extractJSON<T>(response: string): T | null {
  // Find JSON code block
  const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/)

  if (!jsonMatch) {
    // Try to find direct JSON
    const directMatch = response.match(/\{[\s\S]*\}/)
    if (directMatch) {
      try {
        return JSON.parse(directMatch[0])
      } catch {
        return null
      }
    }
    return null
  }

  try {
    return JSON.parse(jsonMatch[1])
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
  return extractJSON<BusinessPlan>(response)
}
