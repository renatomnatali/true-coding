import { describe, it, expect } from 'vitest'
import {
  extractJSON,
  isPlanReady,
  extractBusinessPlan,
  extractQuestionNumber,
} from './parsers'

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
  it('should return true when response has valid business plan', () => {
    const response = `Here is your plan:

\`\`\`json
{
  "name": "My App",
  "tagline": "Great app tagline",
  "description": "A comprehensive application",
  "problemStatement": "Solves major problem",
  "targetAudience": {
    "primary": "Developers",
    "painPoints": ["Complexity", "Time"]
  },
  "coreFeatures": [{
    "id": "1",
    "name": "Login",
    "description": "User authentication",
    "priority": "must-have",
    "complexity": "low"
  }],
  "successMetrics": [{
    "name": "Users",
    "target": "1000",
    "timeframe": "6 months"
  }]
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

describe('extractQuestionNumber', () => {
  it('should extract question number from HTML marker', () => {
    const content = 'Qual problema você quer resolver? 🎯 <!--Q:1-->'
    expect(extractQuestionNumber(content)).toBe(1)
  })

  it('should extract question number from middle of text', () => {
    const content = 'Some text before <!--Q:3--> and more text after'
    expect(extractQuestionNumber(content)).toBe(3)
  })

  it('should extract question 5 correctly', () => {
    const content = `
      Perfeito! ✅

      Última pergunta! Como pretende monetizar? 💰

      <!--Q:5-->
    `
    expect(extractQuestionNumber(content)).toBe(5)
  })

  it('should return null when no marker present', () => {
    const content = 'This is a message without any question marker'
    expect(extractQuestionNumber(content)).toBeNull()
  })

  it('should return null for question number 0', () => {
    const content = 'Invalid question <!--Q:0-->'
    expect(extractQuestionNumber(content)).toBeNull()
  })

  it('should return null for question number 6', () => {
    const content = 'Out of range <!--Q:6-->'
    expect(extractQuestionNumber(content)).toBeNull()
  })

  it('should return null for question number greater than 5', () => {
    const content = 'Way out of range <!--Q:99-->'
    expect(extractQuestionNumber(content)).toBeNull()
  })

  it('should return null for negative question numbers', () => {
    const content = 'Negative <!--Q:-1-->'
    expect(extractQuestionNumber(content)).toBeNull()
  })

  it('should return null for malformed marker without closing', () => {
    const content = 'Malformed <!--Q:3'
    expect(extractQuestionNumber(content)).toBeNull()
  })

  it('should return null for malformed marker without number', () => {
    const content = 'No number <!--Q:-->'
    expect(extractQuestionNumber(content)).toBeNull()
  })

  it('should extract first marker when multiple present', () => {
    const content = 'First <!--Q:2--> and second <!--Q:4-->'
    expect(extractQuestionNumber(content)).toBe(2)
  })

  it('should handle whitespace in marker', () => {
    const content = 'With spaces <!-- Q:3 -->'
    expect(extractQuestionNumber(content)).toBeNull() // Should be strict
  })
})
