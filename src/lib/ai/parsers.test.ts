import { describe, it, expect } from 'vitest'
import { extractJSON, isPlanReady, extractBusinessPlan } from './parsers'

describe('extractJSON', () => {
  it('should extract JSON from markdown code block', () => {
    const response = `Here is the plan:

\`\`\`json
{"name": "Test App", "description": "A test application"}
\`\`\`

Let me know if you want changes.`

    const result = extractJSON<{ name: string; description: string }>(response)
    expect(result).toEqual({
      name: 'Test App',
      description: 'A test application',
    })
  })

  it('should extract direct JSON without code block', () => {
    const response = `The result is {"status": "success", "count": 42}`

    const result = extractJSON<{ status: string; count: number }>(response)
    expect(result).toEqual({ status: 'success', count: 42 })
  })

  it('should return null for invalid JSON', () => {
    const response = `\`\`\`json
{invalid json here}
\`\`\``

    const result = extractJSON(response)
    expect(result).toBeNull()
  })

  it('should return null when no JSON found', () => {
    const response = 'This is just plain text without any JSON'

    const result = extractJSON(response)
    expect(result).toBeNull()
  })

  it('should handle nested JSON objects', () => {
    const response = `\`\`\`json
{
  "user": {
    "name": "John",
    "settings": {
      "theme": "dark"
    }
  }
}
\`\`\``

    const result = extractJSON<{
      user: { name: string; settings: { theme: string } }
    }>(response)
    expect(result).toEqual({
      user: {
        name: 'John',
        settings: { theme: 'dark' },
      },
    })
  })
})

describe('isPlanReady', () => {
  it('should return true when response has json block with coreFeatures', () => {
    const response = `Here is your plan:

\`\`\`json
{
  "name": "My App",
  "coreFeatures": [{"id": "1", "name": "Login"}]
}
\`\`\``

    expect(isPlanReady(response)).toBe(true)
  })

  it('should return true when response has json block with architecture', () => {
    const response = `\`\`\`json
{
  "name": "My App",
  "architecture": {"frontend": "React"}
}
\`\`\``

    expect(isPlanReady(response)).toBe(true)
  })

  it('should return false when no json block', () => {
    const response = 'The coreFeatures are important but no JSON here'

    expect(isPlanReady(response)).toBe(false)
  })

  it('should return false when json block without required fields', () => {
    const response = `\`\`\`json
{"name": "App", "description": "Test"}
\`\`\``

    expect(isPlanReady(response)).toBe(false)
  })
})

describe('extractBusinessPlan', () => {
  it('should extract a valid business plan', () => {
    const response = `\`\`\`json
{
  "name": "TaskManager",
  "tagline": "Manage tasks easily",
  "description": "A task management app",
  "problemStatement": "People struggle with task organization",
  "targetAudience": {
    "primary": "Small teams",
    "painPoints": ["Disorganization", "Missed deadlines"]
  },
  "coreFeatures": [
    {
      "id": "f1",
      "name": "Task Creation",
      "description": "Create and assign tasks",
      "priority": "must-have",
      "complexity": "low"
    }
  ],
  "niceToHaveFeatures": [],
  "successMetrics": [
    {"name": "DAU", "target": "1000", "timeframe": "3 months"}
  ]
}
\`\`\``

    const result = extractBusinessPlan(response)
    expect(result).not.toBeNull()
    expect(result?.name).toBe('TaskManager')
    expect(result?.coreFeatures).toHaveLength(1)
    expect(result?.coreFeatures[0].name).toBe('Task Creation')
  })

  it('should return null for invalid business plan', () => {
    const response = 'No JSON here'

    const result = extractBusinessPlan(response)
    expect(result).toBeNull()
  })
})
