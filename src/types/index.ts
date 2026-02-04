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

export type ChatStreamEventType = 'text' | 'done' | 'error' | 'plan_ready' | 'question_progress'

export interface ChatStreamEvent {
  type: ChatStreamEventType
  content?: string
  plan?: BusinessPlan
  error?: string
  messageId?: string
  progress?: QuestionProgress
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

// ============================================================================
// DISCOVERY FLOW (ADR-0001, ADR-0002)
// ============================================================================

/**
 * Estado completo do Discovery estruturado com 5 perguntas
 * Armazenado em Conversation.discoveryState (JSONB)
 */
export interface DiscoveryState {
  questions: Record<string, QuestionData>
  metadata: DiscoveryMetadata
}

/**
 * Dados de uma pergunta individual do Discovery
 */
export interface QuestionData {
  /** Pergunta foi feita pela AI? */
  asked: boolean
  /** Usuário respondeu? */
  answered: boolean
  /** Resposta literal do usuário */
  userResponse: string
  /** Dados estruturados extraídos da resposta pela AI */
  extractedData: Record<string, unknown>
  /** Timestamp da resposta */
  timestamp: string
}

/**
 * Metadata do processo de Discovery
 */
export interface DiscoveryMetadata {
  /** Quando iniciou o discovery */
  startedAt: string
  /** Última atividade (resposta ou mensagem) */
  lastActivity: string
  /** Tempo total gasto em segundos */
  totalTimeSeconds: number
}

/**
 * Progresso atual do Discovery (para UI)
 */
export interface QuestionProgress {
  /** Pergunta atual (1-5) */
  current: number
  /** Total de perguntas (sempre 5) */
  total: number
}

/**
 * Estrutura das 5 perguntas do Discovery
 */
export const DISCOVERY_QUESTIONS = {
  1: {
    key: 'problem_and_audience',
    label: 'Problema e Público-Alvo',
    prompt: 'Qual problema você quer resolver e para quem?',
    example: 'Ajudar freelancers a organizar projetos e clientes',
  },
  2: {
    key: 'core_features',
    label: 'Features Core',
    prompt: 'Quais são as 3-5 funcionalidades principais (must-have)?',
    example: 'Autenticação, Dashboard, CRUD de tarefas',
  },
  3: {
    key: 'differentiators',
    label: 'Diferenciais',
    prompt: 'O que vai diferenciar seu projeto dos concorrentes?',
    example: 'Interface mais simples que Trello, foco em pequenos times',
  },
  4: {
    key: 'nice_to_have',
    label: 'Nice-to-Have',
    prompt: 'Quais features seriam "nice-to-have" para o futuro?',
    example: 'Integrações com Slack, relatórios avançados, app mobile',
  },
  5: {
    key: 'monetization',
    label: 'Monetização',
    prompt: 'Como pretende monetizar o projeto?',
    example: 'Freemium - grátis até 5 usuários, pago acima disso',
  },
} as const

/**
 * Quick replies contextuais por pergunta
 *
 * IMPORTANTE: A pergunta 0 corresponde à mensagem inicial "O que você quer criar?"
 * As perguntas 1-5 são as perguntas estruturadas do discovery.
 */
export const QUICK_REPLIES_BY_QUESTION: Record<number, string[]> = {
  // Pergunta inicial: "O que você quer criar?"
  0: ['📱 App de gestão', '🛒 E-commerce', '📊 Dashboard', '🎨 Portfolio'],
  // Q1: "Qual problema você quer resolver e para quem?"
  1: ['Para pequenas empresas', 'Para freelancers', 'Para times remotos', 'Para lojistas online'],
  // Q2: "Quais são as 3-5 funcionalidades principais?"
  2: ['Login e cadastro de usuários', 'Dashboard com métricas', 'CRUD completo', 'Sistema de notificações'],
  // Q3: "O que vai diferenciar dos concorrentes?"
  3: ['Interface mais simples que os concorrentes', 'Preço mais acessível', 'Mais rápido na execução', 'Mais focado no nicho'],
  // Q4: "Quais features seriam nice-to-have?"
  4: ['Integrações com outras ferramentas', 'Relatórios detalhados', 'Versão mobile', 'Automações inteligentes'],
  // Q5: "Como pretende monetizar?"
  5: ['Modelo freemium', 'Assinatura mensal', '100% gratuito', 'Cobrança por usuário'],
}
