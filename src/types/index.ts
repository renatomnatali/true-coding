// Business Plan (Output do Discovery)
export interface BusinessPlan {
  name: string
  tagline: string
  description: string
  problemStatement: string
  targetAudience: TargetAudience
  coreFeatures: Feature[]
  niceToHaveFeatures: Feature[]
  monetization?: MonetizationStrategy
  competitors?: Competitor[]
  successMetrics: SuccessMetric[]
}

export interface TargetAudience {
  primary: string
  secondary?: string
  painPoints: string[]
}

export interface Feature {
  id: string
  name: string
  description: string
  priority: 'must-have' | 'should-have' | 'nice-to-have'
  complexity: 'low' | 'medium' | 'high'
}

export interface MonetizationStrategy {
  model: 'free' | 'freemium' | 'subscription' | 'one-time' | 'usage-based'
  description: string
  pricing?: string
}

export interface Competitor {
  name: string
  url?: string
  differentiator: string
}

export interface SuccessMetric {
  name: string
  target: string
  timeframe: string
}

// Chat
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: Date
}

export interface ChatRequest {
  projectId: string
  message: string
  phase: 'discovery' | 'planning'
}

export type ChatStreamEventType = 'text' | 'done' | 'error' | 'plan_ready'

export interface ChatStreamEvent {
  type: ChatStreamEventType
  content?: string
  plan?: BusinessPlan
  error?: string
  messageId?: string
}

// Project Status
export type ProjectStatus =
  | 'IDEATION'
  | 'PLANNING'
  | 'CONNECTING'
  | 'GENERATING'
  | 'DEPLOYING'
  | 'LIVE'
  | 'FAILED'

export type ConversationPhase = 'discovery' | 'planning' | 'iteration'
