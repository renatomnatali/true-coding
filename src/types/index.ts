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
 * Quick reply com texto curto (botão) e texto completo (campo de entrada).
 * Fonte futura: geração dinâmica pela IA — ver issue #28.
 */
export interface QuickReply {
  short: string
  long: string
}

/**
 * Quick replies contextuais por pergunta.
 *
 * IMPORTANTE: A pergunta 0 corresponde à mensagem inicial "O que você quer criar?"
 * As perguntas 1-5 são as perguntas estruturadas do discovery.
 */
export const QUICK_REPLIES_BY_QUESTION: Record<number, QuickReply[]> = {
  // Pergunta inicial: "O que você quer criar?"
  0: [
    { short: '📱 App de gestão',  long: 'Quero criar um app de gestão' },
    { short: '🛒 E-commerce',     long: 'Quero criar uma plataforma de e-commerce' },
    { short: '📊 Dashboard',      long: 'Quero criar um dashboard analítico' },
    { short: '🎨 Portfolio',      long: 'Quero criar um portfolio pessoal' },
  ],
  // Q1: "Qual problema você quer resolver e para quem?"
  1: [
    { short: '👥 Pequenas empresas', long: 'O problema afeta pequenas empresas que precisam organizar seus processos' },
    { short: '🎯 Freelancers',       long: 'O problema afeta freelancers que gerenciam múltiplos clientes' },
    { short: '🏢 Times remotos',     long: 'O problema afeta times remotos que precisam colaborar à distância' },
    { short: '🛍️ Lojistas',          long: 'O problema afeta lojistas online que precisam gerenciar suas vendas' },
  ],
  // Q2: "Quais são as 3-5 funcionalidades principais?"
  2: [
    { short: '🔐 Login/cadastro',  long: 'Sistema de autenticação com login e cadastro de usuários' },
    { short: '📊 Dashboard',       long: 'Dashboard com métricas e visão geral dos dados' },
    { short: '📝 CRUD completo',   long: 'Funcionalidades completas de criar, ler, atualizar e deletar registros' },
    { short: '🔔 Notificações',    long: 'Sistema de notificações para alertar usuários sobre eventos importantes' },
  ],
  // Q3: "O que vai diferenciar dos concorrentes?"
  3: [
    { short: '🎨 Mais simples',    long: 'A interface será muito mais simples e intuitiva que os concorrentes' },
    { short: '💰 Preço melhor',    long: 'O preço será mais acessível que as alternativas do mercado' },
    { short: '⚡ Mais rápido',     long: 'A plataforma será muito mais rápida na execução das tarefas' },
    { short: '🎯 Mais focado',     long: 'Vai ser mais focado no nicho específico que os concorrentes não atendem bem' },
  ],
  // Q4: "Quais features seriam nice-to-have?"
  4: [
    { short: '🔗 Integrações',   long: 'Integrações com outras ferramentas populares como Slack e email' },
    { short: '📊 Relatórios',    long: 'Relatórios detalhados e exportáveis para acompanhamento' },
    { short: '📱 App mobile',    long: 'Versão mobile nativa para uso no celular' },
    { short: '🤖 Automações',    long: 'Automações inteligentes para reduzir trabalho repetitivo' },
  ],
  // Q5: "Como pretende monetizar?"
  5: [
    { short: '💳 Freemium',       long: 'Modelo freemium com funcionalidades básicas gratuitas e planos pagos' },
    { short: '📅 Assinatura mensal', long: 'Assinatura mensal com diferentes níveis de acesso' },
    { short: '🎁 100% gratuito',  long: 'A plataforma será 100% gratuita, monetizada por outra forma' },
    { short: '💼 Por usuário',    long: 'Cobrança por usuário com preço proporcional ao uso' },
  ],
}
