import { describe, it, expect } from 'vitest'
import { extractJSON, isPlanReady, extractBusinessPlan } from './parsers'

describe('extractJSON', () => {
  it('should extract JSON from markdown code block', () => {
    const response = `Here is the plan:

\`\`\`json
{"name": "Test App", "description": "A test application"}
\`\`\`

Let me know if you want changes.`

    const { data, repaired } = extractJSON<{ name: string; description: string }>(response)
    expect(data).toEqual({
      name: 'Test App',
      description: 'A test application',
    })
    expect(repaired).toBe(false)
  })

  it('should extract direct JSON without code block', () => {
    const response = `The result is {"status": "success", "count": 42}`

    const { data, repaired } = extractJSON<{ status: string; count: number }>(response)
    expect(data).toEqual({ status: 'success', count: 42 })
    expect(repaired).toBe(false)
  })

  it('should return null data for invalid JSON', () => {
    const response = `\`\`\`json
{invalid json here}
\`\`\``

    const { data } = extractJSON(response)
    expect(data).toBeNull()
  })

  it('should return null data when no JSON found', () => {
    const response = 'This is just plain text without any JSON'

    const { data, repaired } = extractJSON(response)
    expect(data).toBeNull()
    expect(repaired).toBe(false)
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

    const { data, repaired } = extractJSON<{
      user: { name: string; settings: { theme: string } }
    }>(response)
    expect(data).toEqual({
      user: {
        name: 'John',
        settings: { theme: 'dark' },
      },
    })
    expect(repaired).toBe(false)
  })

  it('should repair truncated code block and set repaired flag', () => {
    // Simulates a response cut off mid-JSON (no closing ```)
    const response = `Here is the plan:

\`\`\`json
{"architecture": {"type": "monolith", "description": "Next.js"}, "stack": ["react", "prisma"]`

    const { data, repaired } = extractJSON<{ architecture: { type: string; description: string }; stack: string[] }>(response)
    expect(repaired).toBe(true)
    expect(data).toEqual({
      architecture: { type: 'monolith', description: 'Next.js' },
      stack: ['react', 'prisma'],
    })
  })

  it('should repair truncated bare JSON and set repaired flag', () => {
    // Bare JSON (no code block) that is incomplete
    const response = `Result: {"sections": [{"title": "Auth", "items": ["login"]`

    const { data, repaired } = extractJSON<{ sections: { title: string; items: string[] }[] }>(response)
    expect(repaired).toBe(true)
    expect(data).toEqual({ sections: [{ title: 'Auth', items: ['login'] }] })
  })

  it('should strip trailing comma before closing brace during repair', () => {
    const response = `\`\`\`json
{"name": "App", "version": "1.0",}`

    const { data, repaired } = extractJSON<{ name: string; version: string }>(response)
    // trailing comma is a malformed JSON but the closing ``` is present so level-1 fails,
    // falls to level-3 bare match which also fails parse, then repairs
    expect(data).toEqual({ name: 'App', version: '1.0' })
    expect(repaired).toBe(true)
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
