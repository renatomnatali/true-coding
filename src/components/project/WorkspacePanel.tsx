'use client'

import { useState, useEffect } from 'react'
import { useProjectLayout } from './ProjectLayout'
import { ConnectionPhase } from './phases/ConnectionPhase'

// Parse business plan from JSON string
interface ParsedPlan {
  name: string
  tagline?: string
  description?: string
  problemStatement?: string
  targetAudience?: {
    primary: string
    secondary?: string
    painPoints?: string[]
  }
  coreFeatures?: Array<{
    id: string
    name: string
    description: string
    priority: string
  }>
  monetization?: {
    model: string
    description: string
  }
}

function parsePlan(planStr: string): ParsedPlan | null {
  try {
    return JSON.parse(planStr)
  } catch {
    return null
  }
}

interface WorkspacePanelProps {
  projectId: string
  projectName: string
  status: string
  businessPlan?: string | null
  technicalPlan?: string | null
  uxPlan?: string | null
  businessPlanApproved?: boolean
  technicalPlanApproved?: boolean
  uxPlanApproved?: boolean
  repoUrl?: string | null
  deployUrl?: string | null
  discoveryProgress?: { current: number; total: number } | null
  onApprove?: () => void
  onSavePlan?: (plan: ParsedPlan) => void
  onApproveTechnicalPlan?: () => void
  onSaveTechnicalPlan?: (selections: Record<string, string>) => void
  onApproveUxPlan?: () => void
  isApproving?: boolean
  // Connection phase
  hasGitHubToken?: boolean
  githubJustConnected?: boolean
  netlifyJustConnected?: boolean
  hasOAuthError?: boolean
}

export function WorkspacePanel({
  projectId,
  projectName,
  status,
  businessPlan,
  technicalPlan,
  uxPlan,
  businessPlanApproved,
  technicalPlanApproved,
  uxPlanApproved,
  repoUrl,
  deployUrl,
  discoveryProgress,
  onApprove,
  onSavePlan,
  onApproveTechnicalPlan,
  onSaveTechnicalPlan,
  onApproveUxPlan,
  isApproving,
  hasGitHubToken = false,
  githubJustConnected = false,
  netlifyJustConnected = false,
  hasOAuthError = false,
}: WorkspacePanelProps) {
  const { setChatOpen } = useProjectLayout()

  // Render different content based on phase
  switch (status) {
    case 'IDEATION':
      return <IdeationWorkspace projectName={projectName} discoveryProgress={discoveryProgress} onStartChat={() => setChatOpen(true)} />
    case 'PLANNING':
      return <PlanningWorkspace businessPlan={businessPlan} technicalPlan={technicalPlan} uxPlan={uxPlan} businessPlanApproved={businessPlanApproved} technicalPlanApproved={technicalPlanApproved} uxPlanApproved={uxPlanApproved} onApprove={onApprove} onSavePlan={onSavePlan} onApproveTechnicalPlan={onApproveTechnicalPlan} onSaveTechnicalPlan={onSaveTechnicalPlan} onApproveUxPlan={onApproveUxPlan} isApproving={isApproving} />
    case 'CONNECTING':
      return (
        <ConnectionPhase
          projectId={projectId}
          projectName={projectName}
          githubRepoUrl={repoUrl ?? null}
          productionUrl={deployUrl ?? null}
          hasGitHubToken={hasGitHubToken}
          githubJustConnected={githubJustConnected}
          netlifyJustConnected={netlifyJustConnected}
          hasOAuthError={hasOAuthError}
        />
      )
    case 'GENERATING':
      return <GeneratingWorkspace />
    case 'DEPLOYING':
      return <DeployingWorkspace />
    case 'LIVE':
      return <LiveWorkspace repoUrl={repoUrl} deployUrl={deployUrl} projectName={projectName} />
    default:
      return <IdeationWorkspace projectName={projectName} onStartChat={() => setChatOpen(true)} />
  }
}

// Phase: IDEATION - matching mockup exactly
function IdeationWorkspace({
  projectName: _projectName,
  discoveryProgress: _discoveryProgress,
  onStartChat,
}: {
  projectName: string
  discoveryProgress?: { current: number; total: number } | null
  onStartChat: () => void
}) {
  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-8">
      {/* Workspace Header - matching mockup */}
      <div className="mb-6">
        <div className="mb-2 text-sm text-gray-500">Ideação</div>
        <h2 className="mb-2 text-3xl font-bold text-gray-900">Vamos começar! 🚀</h2>
        <p className="text-base text-gray-600">
          Responda algumas perguntas para eu entender melhor sua ideia e criar um plano completo.
        </p>
      </div>

      {/* Discovery Card - matching mockup */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-1 text-lg font-semibold text-gray-900">Discovery</h3>
        <p className="mb-4 text-sm text-gray-600">
          Vou fazer 5 perguntas para entender o que você quer criar.
          Você pode responder livremente ou usar as sugestões rápidas.
        </p>
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">
            <strong>O que vamos fazer:</strong>
          </p>
          <ul className="space-y-1 text-sm text-gray-600">
            <li>• Entender o problema que você quer resolver</li>
            <li>• Definir as funcionalidades principais</li>
            <li>• Identificar seu público-alvo</li>
            <li>• Descobrir seus diferenciais</li>
            <li>• Definir modelo de monetização</li>
          </ul>
        </div>
      </div>

      {/* Tip Box - matching mockup (blue bg with left border) */}
      <div className="rounded-md border-l-4 border-blue-600 bg-blue-50 p-4">
        <p className="text-sm text-gray-900">
          💡 <strong>Dica:</strong> Seja específico nas respostas. Quanto mais detalhes você der,
          melhor será o plano gerado.
        </p>
      </div>

      {/* Mobile CTA - opens chat drawer */}
      <button
        onClick={onStartChat}
        className="mt-6 w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 lg:hidden"
      >
        Começar Conversa
      </button>
    </div>
  )
}

// Parse technical plan from JSON string - nova estrutura baseada no mockup
interface ParsedTechnicalPlan {
  stack?: {
    categories?: Array<{
      name: string
      technologies: string[]
    }>
  }
  architecture?: {
    pattern?: string
    organization?: string
    stateManagement?: string
    fileStructure?: string
  }
  database?: {
    description?: string
    prismaSchema?: string
    summary?: string
  }
  apiEndpoints?: Array<{
    category: string
    endpoints: Array<{
      method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
      path: string
      description: string
    }>
  }>
  realtime?: {
    provider?: string
    description?: string
    channels?: Array<{
      name: string
      events: Array<{
        name: string
        description: string
      }>
    }>
    scalability?: string
  }
  security?: {
    authentication?: string[]
    apiProtection?: string[]
    sensitiveData?: string[]
    compliance?: string[]
  }
  performance?: {
    caching?: Array<{
      name: string
      description: string
    }>
    database?: string[]
    frontend?: string[]
    goals?: {
      fcp?: string
      lcp?: string
      tti?: string
      cls?: string
    }
  }
  integrations?: Array<{
    name: string
    description: string
    details?: string
  }>
}

function parseTechnicalPlan(planStr: string): ParsedTechnicalPlan | null {
  try {
    return JSON.parse(planStr)
  } catch {
    return null
  }
}

// Parse UX plan from JSON string - nova estrutura baseada no mockup 07-ux-plan.html
interface ParsedUxPlan {
  personas?: Array<{
    name: string
    initials?: string
    age?: number
    location?: string
    bio?: string
    painPoints?: string[]
    goals?: string[]
    jobsToBeDone?: string[]
    triggers?: string
  }>
  informationArchitecture?: {
    sitemap?: string
    navigation?: Array<{
      name: string
      description: string
    }>
  }
  journeys?: Array<{
    name: string
    persona?: string
    steps: Array<{
      title: string
      description: string
      emotion?: string
    }>
  }>
  wireframes?: Array<{
    name: string
    description: string
    layout?: string
  }>
  componentLibrary?: Array<{
    name: string
    variants: Array<{
      name: string
      description: string
    }>
  }>
  accessibility?: {
    colorContrast?: string[]
    keyboard?: string[]
    semantics?: string[]
    aria?: string[]
    screenReaders?: string[]
  }
  uiStates?: {
    loading?: string[]
    error?: string[]
    empty?: string[]
  }
  designTokens?: {
    colors?: Record<string, string | Record<string, string>>
    typography?: Array<{
      name: string
      font: string
    }>
    spacing?: Array<{
      name: string
      value: string
    }>
  }
}

function parseUxPlan(planStr: string): ParsedUxPlan | null {
  try {
    return JSON.parse(planStr)
  } catch {
    return null
  }
}

// Validate hex color to prevent CSS injection
function isValidHexColor(value: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value)
}

// Derive which plan sub-phase is active
// Business → Technical → UX (sequential, per planning.feature)
function getActivePlanPhase(businessPlanApproved: boolean, technicalPlanApproved: boolean): 'business' | 'technical' | 'ux' {
  if (!businessPlanApproved) return 'business'
  if (!technicalPlanApproved) return 'technical'
  return 'ux'
}

// Phase: PLANNING — renders only the current active sub-plan
function PlanningWorkspace({
  businessPlan,
  technicalPlan,
  uxPlan,
  businessPlanApproved = false,
  technicalPlanApproved = false,
  uxPlanApproved = false,
  onApprove,
  onSavePlan,
  onApproveTechnicalPlan,
  onSaveTechnicalPlan,
  onApproveUxPlan,
  isApproving = false,
}: {
  businessPlan?: string | null
  technicalPlan?: string | null
  uxPlan?: string | null
  businessPlanApproved?: boolean
  technicalPlanApproved?: boolean
  uxPlanApproved?: boolean
  onApprove?: () => void
  onSavePlan?: (plan: ParsedPlan) => void
  onApproveTechnicalPlan?: () => void
  onSaveTechnicalPlan?: (selections: Record<string, string>) => void
  onApproveUxPlan?: () => void
  isApproving?: boolean
}) {
  const activePlan = getActivePlanPhase(businessPlanApproved, technicalPlanApproved)

  // Sub-phase breadcrumb
  const SUB_PHASES = [
    { key: 'business', label: 'Plano de Negócio', state: businessPlanApproved ? 'completed' : activePlan === 'business' ? 'active' : 'blocked' },
    { key: 'technical', label: 'Plano Técnico', state: technicalPlanApproved ? 'completed' : activePlan === 'technical' ? 'active' : 'blocked' },
    { key: 'ux', label: 'Plano de UX', state: uxPlanApproved ? 'completed' : activePlan === 'ux' ? 'active' : 'blocked' },
  ] as const

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Sub-phase progress strip */}
        <div className="flex items-center gap-2">
          {SUB_PHASES.map((phase, i) => (
            <div key={phase.key} className="flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                phase.state === 'completed' ? 'bg-green-100 text-green-700' :
                phase.state === 'active' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-400'
              }`}>
                {phase.state === 'completed' ? '✓' : i + 1}
              </div>
              <span className={`text-sm ${
                phase.state === 'active' ? 'font-semibold text-gray-900' :
                phase.state === 'completed' ? 'text-green-700' :
                'text-gray-400'
              }`}>{phase.label}</span>
              {i < SUB_PHASES.length - 1 && <span className="mx-1 text-gray-300">→</span>}
            </div>
          ))}
        </div>

        {/* Render only the active sub-plan */}
        {activePlan === 'business' && (
          <BusinessPlanView
            businessPlan={businessPlan}
            businessPlanApproved={businessPlanApproved}
            onApprove={onApprove}
            onSavePlan={onSavePlan}
            isApproving={isApproving}
          />
        )}

        {activePlan === 'technical' && (
          <TechnicalPlanView
            technicalPlan={technicalPlan}
            technicalPlanApproved={technicalPlanApproved}
            onApprove={onApproveTechnicalPlan}
            onSaveTechnicalPlan={onSaveTechnicalPlan}
            isApproving={isApproving}
          />
        )}

        {activePlan === 'ux' && (
          <UxPlanView
            uxPlan={uxPlan}
            uxPlanApproved={uxPlanApproved}
            onApprove={onApproveUxPlan}
            isApproving={isApproving}
          />
        )}

        {/* Loading overlay while generating next plan */}
        {isApproving && (
          <PlanGenerationOverlay activePlan={activePlan} />
        )}
      </div>
    </div>
  )
}

// Progressive loading overlay for plan generation
const UX_PLAN_STEPS = [
  'Analisando requisitos...',
  'Criando Personas...',
  'Definindo Arquitetura de Informação...',
  'Planejando Jornadas de Usuário...',
  'Criando Wireframes...',
  'Montando Biblioteca de Componentes...',
  'Definindo Acessibilidade...',
  'Gerando Design Tokens...',
  'Finalizando Plano de UX...',
]

function PlanGenerationOverlay({ activePlan }: { activePlan: string }) {
  const isUxGeneration = activePlan === 'technical'
  const staticMessage = activePlan === 'business' ? 'Gerando Plano Técnico...' : 'Aprovando...'
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    if (!isUxGeneration) return
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev < UX_PLAN_STEPS.length - 1 ? prev + 1 : prev))
    }, 15000)
    return () => clearInterval(interval)
  }, [isUxGeneration])

  const message = isUxGeneration ? UX_PLAN_STEPS[stepIndex] : staticMessage

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="rounded-lg border bg-white p-8 shadow-lg">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm font-medium text-gray-700">{message}</p>
          {isUxGeneration && (
            <div className="flex gap-1">
              {UX_PLAN_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${i <= stepIndex ? 'bg-blue-600' : 'bg-gray-200'}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Sub-component: Business Plan
function BusinessPlanView({
  businessPlan,
  businessPlanApproved,
  onApprove,
  onSavePlan,
  isApproving,
}: {
  businessPlan?: string | null
  businessPlanApproved?: boolean
  onApprove?: () => void
  onSavePlan?: (plan: ParsedPlan) => void
  isApproving?: boolean
}) {
  const plan = businessPlan ? parsePlan(businessPlan) : null
  const [isEditing, setIsEditing] = useState(false)
  const [editedPlan, setEditedPlan] = useState<ParsedPlan | null>(null)

  const handleEdit = () => { if (plan) { setEditedPlan({ ...plan }); setIsEditing(true) } }
  const handleCancel = () => { setEditedPlan(null); setIsEditing(false) }
  const handleSave = () => { if (editedPlan && onSavePlan) onSavePlan(editedPlan); setIsEditing(false); setEditedPlan(null) }
  const updateField = (field: keyof ParsedPlan, value: string) => { if (editedPlan) setEditedPlan({ ...editedPlan, [field]: value }) }

  const displayPlan = isEditing ? editedPlan : plan

  return (
    <>
      <div>
        <h2 className="mb-1 text-xl font-bold">Plano de Negócio</h2>
        <p className="text-sm text-muted-foreground">Revise o plano gerado. Peça ajustes no chat se necessário.</p>
      </div>

      {displayPlan ? (
        <>
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-start justify-between">
              <h3 className="text-2xl font-bold">{displayPlan.name}</h3>
              {businessPlanApproved && <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">Aprovado</span>}
            </div>
            {isEditing ? (
              <input type="text" value={editedPlan?.tagline || ''} onChange={(e) => updateField('tagline', e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-lg text-muted-foreground focus:border-blue-500 focus:outline-none" placeholder="Tagline do projeto" />
            ) : displayPlan.tagline && <p className="mt-1 text-lg text-muted-foreground">{displayPlan.tagline}</p>}
            {displayPlan.description && <p className="mt-3 text-sm">{displayPlan.description}</p>}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {displayPlan.problemStatement && (
              <div className="rounded-xl border bg-card p-5">
                <h4 className="mb-2 flex items-center gap-2 font-semibold"><span className="text-lg">🎯</span> Problema</h4>
                <p className="text-sm text-muted-foreground">{displayPlan.problemStatement}</p>
              </div>
            )}
            {displayPlan.targetAudience && (
              <div className="rounded-xl border bg-card p-5">
                <h4 className="mb-2 flex items-center gap-2 font-semibold"><span className="text-lg">👥</span> Público-Alvo</h4>
                <p className="text-sm font-medium">{displayPlan.targetAudience.primary}</p>
                {displayPlan.targetAudience.painPoints && (
                  <ul className="mt-2 space-y-1">
                    {displayPlan.targetAudience.painPoints.map((pain: string, i: number) => (
                      <li key={i} className="text-xs text-muted-foreground">• {pain}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {displayPlan.coreFeatures && displayPlan.coreFeatures.length > 0 && (
            <div className="rounded-xl border bg-card p-5">
              <h4 className="mb-4 flex items-center gap-2 font-semibold"><span className="text-lg">⚡</span> Funcionalidades Principais</h4>
              <div className="space-y-3">
                {displayPlan.coreFeatures.map((feature: { id: string; name: string; description: string; priority: string }, i: number) => (
                  <div key={feature.id || i} className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">{i + 1}</div>
                    <div>
                      <p className="font-medium">{feature.name}</p>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {displayPlan.monetization && (
            <div className="rounded-xl border bg-card p-5">
              <h4 className="mb-2 flex items-center gap-2 font-semibold"><span className="text-lg">💰</span> Monetização</h4>
              <p className="text-sm">
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">{displayPlan.monetization.model}</span>
                <span className="ml-2 text-muted-foreground">{displayPlan.monetization.description}</span>
              </p>
            </div>
          )}

          {!businessPlanApproved && (
            <div className="flex justify-end gap-3">
              {isEditing ? (
                <>
                  <button onClick={handleCancel} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted">Cancelar</button>
                  <button onClick={handleSave} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Salvar Alterações</button>
                </>
              ) : (
                <>
                  <button onClick={handleEdit} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted">Editar Plano</button>
                  <button onClick={onApprove} disabled={isApproving}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">
                    Aprovar e Continuar
                  </button>
                </>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border bg-card p-6">
          <div className="rounded-lg bg-muted/50 p-4 text-center text-sm text-muted-foreground">Aguardando geração do plano...</div>
        </div>
      )}
    </>
  )
}

// Helper: Badge de método HTTP com cor
function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: 'bg-blue-600',
    POST: 'bg-green-600',
    PATCH: 'bg-amber-500',
    DELETE: 'bg-red-600',
    PUT: 'bg-amber-500',
  }
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold text-white ${colors[method] || 'bg-gray-500'}`}>
      {method}
    </span>
  )
}

// Opções de edição do Technical Plan (baseado no mockup 05-technical-plan-edit.html)
const TECH_OPTIONS: Record<string, Array<{ name: string; description: string }>> = {
  'Frontend Framework': [
    { name: 'Next.js 15 + React 19', description: 'Framework full-stack moderno com SSR, API routes e otimizações automáticas.' },
    { name: 'Vite + React', description: 'Build tool ultrarrápido. Melhor para SPAs sem SSR. Requer backend separado.' },
    { name: 'Vue.js + Nuxt', description: 'Alternativa ao React com sintaxe mais simples. Boa para equipes pequenas.' },
  ],
  'Banco de Dados': [
    { name: 'PostgreSQL (Supabase)', description: 'Banco relacional robusto. Supabase oferece hosting gratuito + auth + real-time.' },
    { name: 'MongoDB (Atlas)', description: 'NoSQL flexível. Bom para dados não estruturados. Mais fácil para prototipagem.' },
    { name: 'MySQL (PlanetScale)', description: 'Relacional tradicional. PlanetScale oferece branching de schema.' },
  ],
  'Real-time': [
    { name: 'Pusher', description: 'Serviço gerenciado. Setup simples, escalável. Plano gratuito generoso.' },
    { name: 'Socket.io (self-hosted)', description: 'Controle total. Requer servidor Node.js dedicado. Mais complexo.' },
  ],
}

// Sub-component: Technical Plan - Nova versão completa baseada no mockup
function TechnicalPlanView({
  technicalPlan,
  technicalPlanApproved,
  onApprove,
  onSaveTechnicalPlan,
  isApproving,
}: {
  technicalPlan?: string | null
  technicalPlanApproved?: boolean
  onApprove?: () => void
  onSaveTechnicalPlan?: (selections: Record<string, string>) => void
  isApproving?: boolean
}) {
  const techPlan = technicalPlan ? parseTechnicalPlan(technicalPlan) : null
  const [isEditing, setIsEditing] = useState(false)
  const [selections, setSelections] = useState<Record<string, string>>({})

  const handleEdit = () => {
    // Initialize selections from current stack categories
    const initial: Record<string, string> = {}
    if (techPlan?.stack?.categories) {
      for (const cat of techPlan.stack.categories) {
        const catName = cat.name
        // Match current tech to an option
        for (const [optKey, options] of Object.entries(TECH_OPTIONS)) {
          const match = options.find(opt => cat.technologies.some(t => opt.name.toLowerCase().includes(t.toLowerCase())))
          if (match) initial[optKey] = match.name
          else if (!initial[catName]) initial[optKey] = options[0].name
        }
      }
    }
    // Default all unset categories
    for (const [key, options] of Object.entries(TECH_OPTIONS)) {
      if (!initial[key]) initial[key] = options[0].name
    }
    setSelections(initial)
    setIsEditing(true)
  }

  const handleCancel = () => { setIsEditing(false); setSelections({}) }
  const handleSave = () => { if (onSaveTechnicalPlan) onSaveTechnicalPlan(selections); setIsEditing(false); setSelections({}) }

  if (!techPlan) {
    return (
      <>
        <div>
          <h2 className="mb-1 text-xl font-bold">Plano Técnico</h2>
          <p className="text-sm text-muted-foreground">Arquitetura e tecnologias do projeto.</p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <div className="rounded-lg bg-muted/50 p-4 text-center text-sm text-muted-foreground">Aguardando geração do plano...</div>
        </div>
      </>
    )
  }

  // Edit mode
  if (isEditing) {
    return (
      <>
        <div>
          <h2 className="mb-1 text-xl font-bold">Editando Plano Técnico</h2>
          <p className="text-sm text-muted-foreground">Ajuste a stack e arquitetura do projeto</p>
        </div>

        <div className="rounded-lg border-l-4 border-blue-600 bg-blue-50 p-4 dark:bg-blue-950">
          <p className="text-sm">
            ✏️ <strong>Modo de Edição:</strong> Escolha as tecnologias ideais para seu projeto.
          </p>
        </div>

        {Object.entries(TECH_OPTIONS).map(([category, options]) => (
          <div key={category} className="rounded-xl border bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold">{category}</h3>
            <div className="space-y-3">
              {options.map((option) => {
                const isSelected = selections[category] === option.name
                return (
                  <button
                    key={option.name}
                    type="button"
                    onClick={() => setSelections(prev => ({ ...prev, [category]: option.name }))}
                    className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${
                      isSelected ? 'border-blue-600 bg-blue-50 dark:bg-blue-950' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{option.name}</span>
                      {isSelected && <span className="text-blue-600">✓</span>}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        <div className="flex justify-end gap-3">
          <button onClick={handleCancel} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted">Cancelar</button>
          <button onClick={handleSave} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Salvar Alterações
          </button>
        </div>
      </>
    )
  }

  // View mode
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mb-1 text-xl font-bold">Arquitetura Técnica</h2>
          <p className="text-sm text-muted-foreground">Stack e estrutura do projeto</p>
        </div>
        {technicalPlanApproved && <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">Aprovado</span>}
      </div>

      {/* 1. Stack de Tecnologia */}
      {techPlan.stack?.categories && techPlan.stack.categories.length > 0 && (
        <div className="rounded-xl border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">🛠️ Stack de Tecnologia</h3>
          <div className="space-y-4">
            {techPlan.stack.categories.map((cat, i) => (
              <div key={i}>
                <p className="mb-2 text-xs font-semibold uppercase text-gray-500">{cat.name}</p>
                <div className="flex flex-wrap gap-2">
                  {cat.technologies?.map((tech, j) => (
                    <span key={j} className="rounded-md bg-muted px-2 py-1 text-sm">{tech}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Arquitetura */}
      {techPlan.architecture && (
        <div className="rounded-xl border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">🏗️ Arquitetura</h3>
          <div className="mb-4 space-y-1 text-sm text-muted-foreground">
            {techPlan.architecture.pattern && <p><strong>Padrão:</strong> {techPlan.architecture.pattern}</p>}
            {techPlan.architecture.organization && <p><strong>Organização:</strong> {techPlan.architecture.organization}</p>}
            {techPlan.architecture.stateManagement && <p><strong>Estado:</strong> {techPlan.architecture.stateManagement}</p>}
          </div>
          {techPlan.architecture.fileStructure && (
            <pre className="overflow-x-auto rounded-lg bg-gray-100 p-4 font-mono text-xs leading-relaxed dark:bg-gray-800">
              {techPlan.architecture.fileStructure.replace(/\\n/g, '\n')}
            </pre>
          )}
        </div>
      )}

      {/* 3. Database Schema (Prisma) */}
      {techPlan.database && (
        <div className="rounded-xl border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">💾 Schema do Banco de Dados (Prisma)</h3>
          {techPlan.database.description && (
            <p className="mb-3 text-sm text-muted-foreground">{techPlan.database.description}</p>
          )}
          {techPlan.database.prismaSchema && (
            <pre className="max-h-96 overflow-auto rounded-lg bg-[#1e1e1e] p-4 font-mono text-xs leading-relaxed text-gray-300">
              {techPlan.database.prismaSchema.replace(/\\n/g, '\n')}
            </pre>
          )}
          {techPlan.database.summary && (
            <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm dark:bg-blue-950">
              <strong>Relacionamentos:</strong> {techPlan.database.summary}
            </div>
          )}
        </div>
      )}

      {/* 4. API Endpoints */}
      {techPlan.apiEndpoints && techPlan.apiEndpoints.length > 0 && (
        <div className="rounded-xl border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">🌐 API Endpoints</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            <strong>Padrão REST</strong> com autenticação JWT (Clerk) e rate limiting
          </p>
          <div className="space-y-6">
            {techPlan.apiEndpoints.map((group, i) => (
              <div key={i}>
                <p className="mb-2 text-xs font-semibold uppercase text-gray-500">{group.category}</p>
                <div className="space-y-2">
                  {group.endpoints?.map((ep, j) => (
                    <div key={j} className="rounded-lg bg-muted/50 p-3 font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <MethodBadge method={ep.method} />
                        <span className="font-medium">{ep.path}</span>
                      </div>
                      <p className="mt-1 font-sans text-muted-foreground">{ep.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Real-time Architecture (opcional) */}
      {techPlan.realtime && (
        <div className="rounded-xl border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">⚡ Arquitetura Real-time</h3>
          {techPlan.realtime.description && (
            <p className="mb-4 text-sm text-muted-foreground">{techPlan.realtime.description}</p>
          )}
          {techPlan.realtime.channels && techPlan.realtime.channels.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase text-gray-500">Canais e Eventos</p>
              {techPlan.realtime.channels.map((channel, i) => (
                <div key={i} className="rounded-lg bg-muted/50 p-3">
                  <p className="mb-2 font-semibold"><code className="rounded bg-black/10 px-1 py-0.5">{channel.name}</code></p>
                  <ul className="space-y-1 pl-4 text-xs text-muted-foreground">
                    {channel.events?.map((ev, j) => (
                      <li key={j}><code>{ev.name}</code> - {ev.description}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
          {techPlan.realtime.scalability && (
            <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm dark:bg-blue-950">
              <strong>Escalabilidade:</strong> {techPlan.realtime.scalability}
            </div>
          )}
        </div>
      )}

      {/* 6. Segurança */}
      {techPlan.security && (
        <div className="rounded-xl border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">🔐 Segurança</h3>
          <div className="space-y-4">
            {techPlan.security.authentication && techPlan.security.authentication.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold">Autenticação e Autorização</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {techPlan.security.authentication.map((item, i) => <li key={i}>• {item}</li>)}
                </ul>
              </div>
            )}
            {techPlan.security.apiProtection && techPlan.security.apiProtection.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold">Proteção de API</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {techPlan.security.apiProtection.map((item, i) => <li key={i}>• {item}</li>)}
                </ul>
              </div>
            )}
            {techPlan.security.sensitiveData && techPlan.security.sensitiveData.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold">Dados Sensíveis</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {techPlan.security.sensitiveData.map((item, i) => <li key={i}>• {item}</li>)}
                </ul>
              </div>
            )}
            {techPlan.security.compliance && techPlan.security.compliance.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold">Compliance</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {techPlan.security.compliance.map((item, i) => <li key={i}>• {item}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. Performance */}
      {techPlan.performance && (
        <div className="rounded-xl border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">⚡ Performance e Otimizações</h3>
          <div className="space-y-4">
            {techPlan.performance.caching && techPlan.performance.caching.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold">Caching Strategy</p>
                <div className="space-y-2">
                  {techPlan.performance.caching.map((item, i) => (
                    <div key={i} className="rounded-lg bg-muted/50 p-2 text-sm">
                      <strong>{item.name}:</strong> <span className="text-muted-foreground">{item.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {techPlan.performance.database && techPlan.performance.database.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold">Database Optimizations</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {techPlan.performance.database.map((item, i) => <li key={i}>• {item}</li>)}
                </ul>
              </div>
            )}
            {techPlan.performance.frontend && techPlan.performance.frontend.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold">Frontend Optimizations</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {techPlan.performance.frontend.map((item, i) => <li key={i}>• {item}</li>)}
                </ul>
              </div>
            )}
            {techPlan.performance.goals && (
              <div className="rounded-lg bg-green-50 p-3 text-sm dark:bg-green-950">
                <strong>Metas de Performance:</strong>
                <ul className="mt-2 space-y-1">
                  {techPlan.performance.goals.fcp && <li>• First Contentful Paint (FCP) {techPlan.performance.goals.fcp}</li>}
                  {techPlan.performance.goals.lcp && <li>• Largest Contentful Paint (LCP) {techPlan.performance.goals.lcp}</li>}
                  {techPlan.performance.goals.tti && <li>• Time to Interactive (TTI) {techPlan.performance.goals.tti}</li>}
                  {techPlan.performance.goals.cls && <li>• Cumulative Layout Shift (CLS) {techPlan.performance.goals.cls}</li>}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. Integrações Externas (opcional) */}
      {techPlan.integrations && techPlan.integrations.length > 0 && (
        <div className="rounded-xl border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">🔌 Integrações Externas</h3>
          <div className="space-y-3">
            {techPlan.integrations.map((integration, i) => (
              <div key={i} className="rounded-lg bg-muted/50 p-3">
                <p className="font-semibold">{integration.name}</p>
                <p className="text-sm text-muted-foreground">{integration.description}</p>
                {integration.details && <p className="mt-1 text-xs text-gray-500">{integration.details}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botões de ação */}
      {!technicalPlanApproved && (
        <div className="flex justify-end gap-3">
          <button onClick={handleEdit} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted">Editar Plano</button>
          <button onClick={onApprove} disabled={isApproving}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">
            Aprovar e Continuar →
          </button>
        </div>
      )}
    </>
  )
}

// Cores para avatar de personas (cicla entre elas)
const PERSONA_COLORS = ['bg-blue-600', 'bg-green-600', 'bg-amber-500', 'bg-purple-600', 'bg-pink-600']
const PERSONA_BORDER_COLORS = ['border-blue-600', 'border-green-600', 'border-amber-500', 'border-purple-600', 'border-pink-600']

// Sub-component: UX Plan - Nova versão completa baseada no mockup 07-ux-plan.html
function UxPlanView({
  uxPlan,
  uxPlanApproved,
  onApprove,
  isApproving,
}: {
  uxPlan?: string | null
  uxPlanApproved?: boolean
  onApprove?: () => void
  isApproving?: boolean
}) {
  const uxPlanParsed = uxPlan ? parseUxPlan(uxPlan) : null

  if (!uxPlanParsed) {
    return (
      <>
        <div>
          <h2 className="mb-1 text-xl font-bold">Plano de UX</h2>
          <p className="text-sm text-muted-foreground">Personas, jornadas e especificações UX.</p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <div className="rounded-lg bg-muted/50 p-4 text-center text-sm text-muted-foreground">Aguardando geração do plano...</div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mb-1 text-xl font-bold">Design de Experiência</h2>
          <p className="text-sm text-muted-foreground">Personas, jornadas e especificações UX</p>
        </div>
        {uxPlanApproved && <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">Aprovado</span>}
      </div>

      {/* 1. Personas */}
      {uxPlanParsed.personas && uxPlanParsed.personas.length > 0 && (
        <div className="rounded-xl border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">👤 Personas</h3>
          <div className="space-y-4">
            {uxPlanParsed.personas.map((persona, i) => (
              <div key={i} className={`rounded-lg border-l-4 bg-muted/50 p-4 ${PERSONA_BORDER_COLORS[i % PERSONA_BORDER_COLORS.length]}`}>
                <div className="mb-3 flex items-center gap-3">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${PERSONA_COLORS[i % PERSONA_COLORS.length]}`}>
                    {persona.initials || persona.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{persona.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {persona.age && `${persona.age} anos`}{persona.age && persona.location && ' • '}{persona.location}
                    </p>
                  </div>
                </div>
                {persona.bio && <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{persona.bio}</p>}
                {persona.painPoints && persona.painPoints.length > 0 && (
                  <div className="mb-2">
                    <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Dores</p>
                    <ul className="space-y-0.5 pl-4 text-sm">
                      {persona.painPoints.map((pain, j) => <li key={j} className="list-disc">{pain}</li>)}
                    </ul>
                  </div>
                )}
                {persona.goals && persona.goals.length > 0 && (
                  <div className="mb-2">
                    <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Objetivos</p>
                    <ul className="space-y-0.5 pl-4 text-sm">
                      {persona.goals.map((goal, j) => <li key={j} className="list-disc">{goal}</li>)}
                    </ul>
                  </div>
                )}
                {persona.jobsToBeDone && persona.jobsToBeDone.length > 0 && (
                  <div className="mb-2">
                    <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Jobs-to-be-done</p>
                    <ul className="space-y-0.5 pl-4 text-sm">
                      {persona.jobsToBeDone.map((job, j) => <li key={j} className="list-disc">{job}</li>)}
                    </ul>
                  </div>
                )}
                {persona.triggers && (
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Triggers de Uso</p>
                    <p className="text-sm">{persona.triggers}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Arquitetura de Informação */}
      {uxPlanParsed.informationArchitecture && (
        <div className="rounded-xl border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">🗂️ Arquitetura de Informação</h3>
          {uxPlanParsed.informationArchitecture.sitemap && (
            <div className="mb-4">
              <p className="mb-2 text-sm font-semibold">Sitemap</p>
              <pre className="overflow-x-auto rounded-lg bg-muted/50 p-4 font-mono text-xs leading-relaxed">
                {uxPlanParsed.informationArchitecture.sitemap.replace(/\\n/g, '\n')}
              </pre>
            </div>
          )}
          {uxPlanParsed.informationArchitecture.navigation && uxPlanParsed.informationArchitecture.navigation.length > 0 && (
            <div>
              <p className="mb-3 text-sm font-semibold">Navegação Principal</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {uxPlanParsed.informationArchitecture.navigation.map((nav, i) => (
                  <NavigationPatternCard key={i} name={nav.name} description={nav.description} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Jornadas do Usuário */}
      {uxPlanParsed.journeys && uxPlanParsed.journeys.length > 0 && (
        <div className="rounded-xl border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">🗺️ Jornadas do Usuário</h3>
          <div className="space-y-6">
            {uxPlanParsed.journeys.map((journey, i) => (
              <div key={i}>
                <div className="mb-3 rounded-lg bg-blue-50 p-3 text-sm font-semibold dark:bg-blue-950">
                  {journey.name}{journey.persona && ` (${journey.persona})`}
                </div>
                <div className="space-y-2">
                  {journey.steps.map((step, j) => (
                    <div key={j} className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                        {j + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{step.title}</p>
                        <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                        {step.emotion && <p className="mt-1 text-xs text-green-600">{step.emotion}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Wireframes */}
      {uxPlanParsed.wireframes && uxPlanParsed.wireframes.length > 0 && (
        <div className="rounded-xl border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">📐 Wireframes e Fluxos</h3>
          <p className="mb-4 text-xs text-muted-foreground">Representação esquemática dos layouts principais</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {uxPlanParsed.wireframes.map((wf, i) => (
              <WireframeCard key={i} name={wf.name} description={wf.description} layout={wf.layout} />
            ))}
          </div>
        </div>
      )}

      {/* 5. Biblioteca de Componentes */}
      {uxPlanParsed.componentLibrary && uxPlanParsed.componentLibrary.length > 0 && (
        <div className="rounded-xl border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">🧩 Biblioteca de Componentes</h3>
          <p className="mb-4 text-xs text-muted-foreground">Preview das variantes de UI definidas para o projeto</p>
          <div className="space-y-5">
            {uxPlanParsed.componentLibrary.map((group, i) => (
              <ComponentGroupPreview key={i} name={group.name} variants={group.variants} />
            ))}
          </div>
        </div>
      )}

      {/* 6. Acessibilidade */}
      {uxPlanParsed.accessibility && (
        <div className="rounded-xl border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">♿ Acessibilidade (WCAG 2.1 AA)</h3>
          <div className="space-y-4">
            {uxPlanParsed.accessibility.colorContrast && uxPlanParsed.accessibility.colorContrast.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold">Contraste de Cores</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {uxPlanParsed.accessibility.colorContrast.map((item, i) => <li key={i}>• {item}</li>)}
                </ul>
              </div>
            )}
            {uxPlanParsed.accessibility.keyboard && uxPlanParsed.accessibility.keyboard.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold">Navegação por Teclado</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {uxPlanParsed.accessibility.keyboard.map((item, i) => <li key={i}>• {item}</li>)}
                </ul>
              </div>
            )}
            {uxPlanParsed.accessibility.semantics && uxPlanParsed.accessibility.semantics.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold">Semântica HTML</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {uxPlanParsed.accessibility.semantics.map((item, i) => <li key={i}>• {item}</li>)}
                </ul>
              </div>
            )}
            {uxPlanParsed.accessibility.aria && uxPlanParsed.accessibility.aria.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold">ARIA Labels</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {uxPlanParsed.accessibility.aria.map((item, i) => <li key={i}>• {item}</li>)}
                </ul>
              </div>
            )}
            {uxPlanParsed.accessibility.screenReaders && uxPlanParsed.accessibility.screenReaders.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold">Leitores de Tela</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {uxPlanParsed.accessibility.screenReaders.map((item, i) => <li key={i}>• {item}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. Estados de UI */}
      {uxPlanParsed.uiStates && (
        <div className="rounded-xl border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">🎭 Estados de UI</h3>
          <div className="space-y-4">
            {uxPlanParsed.uiStates.loading && uxPlanParsed.uiStates.loading.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold">Loading States</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {uxPlanParsed.uiStates.loading.map((item, i) => <li key={i}>• {item}</li>)}
                </ul>
              </div>
            )}
            {uxPlanParsed.uiStates.error && uxPlanParsed.uiStates.error.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold">Error States</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {uxPlanParsed.uiStates.error.map((item, i) => <li key={i}>• {item}</li>)}
                </ul>
              </div>
            )}
            {uxPlanParsed.uiStates.empty && uxPlanParsed.uiStates.empty.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold">Empty States</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {uxPlanParsed.uiStates.empty.map((item, i) => <li key={i}>• {item}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. Design Tokens */}
      {uxPlanParsed.designTokens && (
        <div className="rounded-xl border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">🎨 Design Tokens</h3>
          <div className="space-y-4">
            {uxPlanParsed.designTokens.colors && Object.keys(uxPlanParsed.designTokens.colors).length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold">Paleta de Cores</p>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(uxPlanParsed.designTokens.colors).map(([name, value]) => {
                    if (typeof value === 'object' && value !== null) {
                      // Color scale (e.g. gray: {50: "#f8fafc", 100: "#f1f5f9", ...})
                      const shades = Object.entries(value as Record<string, string>)
                      return (
                        <div key={name} className="w-full rounded-lg bg-muted/50 px-3 py-2">
                          <p className="mb-2 text-xs font-semibold capitalize">{name}</p>
                          <div className="flex flex-wrap gap-1">
                            {shades.map(([shade, color]) => (
                              <div key={shade} className="flex flex-col items-center">
                                <div className="h-6 w-6 rounded-md border"
                                  style={{ backgroundColor: typeof color === 'string' && isValidHexColor(color) ? color : undefined }} />
                                <span className="mt-0.5 text-[9px] text-muted-foreground">{shade}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    }
                    // Simple color (e.g. primary: "#2563eb")
                    return (
                      <div key={name} className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                        <div className="h-6 w-6 rounded-md border"
                          style={{ backgroundColor: typeof value === 'string' && isValidHexColor(value) ? value : undefined }} />
                        <div>
                          <p className="text-xs font-semibold capitalize">{name}</p>
                          <p className="text-xs text-muted-foreground">{typeof value === 'string' ? value : ''}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            {uxPlanParsed.designTokens.typography && uxPlanParsed.designTokens.typography.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold">Tipografia</p>
                <div className="space-y-1">
                  {uxPlanParsed.designTokens.typography.map((typo, i) => {
                    const sizeMatch = typo.font.match(/(\d+)px/)
                    const weightMatch = typo.font.match(/\b(\d{3})\b/)
                    const fontSize = sizeMatch ? Math.min(parseInt(sizeMatch[1]), 36) : undefined
                    const fontWeight = weightMatch ? parseInt(weightMatch[1]) : undefined
                    return (
                      <div key={i} className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2">
                        <span
                          className="min-w-[5rem] font-semibold"
                          style={{ fontSize: fontSize ? `${fontSize}px` : undefined, fontWeight, lineHeight: 1.3 }}
                        >
                          {typo.name}
                        </span>
                        <span className="text-sm text-muted-foreground">{typo.font}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            {uxPlanParsed.designTokens.spacing && uxPlanParsed.designTokens.spacing.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold">Espaçamento</p>
                <div className="flex flex-wrap gap-2">
                  {uxPlanParsed.designTokens.spacing.map((sp, i) => (
                    <div key={i} className="rounded-lg bg-muted/50 px-3 py-1 text-xs">
                      <span className="font-semibold">{sp.name}:</span> <span className="text-muted-foreground">{sp.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Botões de ação */}
      {!uxPlanApproved && (
        <div className="flex justify-end gap-3">
          <button onClick={onApprove} disabled={isApproving}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">
            Aprovar e Continuar
          </button>
        </div>
      )}
    </>
  )
}

// Phase: GENERATING
function GeneratingWorkspace() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="relative flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 animate-spin rounded-2xl border-4 border-primary/20 border-t-primary" />
            <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
        </div>

        <h2 className="mb-3 text-2xl font-bold tracking-tight">
          Gerando Código
        </h2>

        <p className="mb-6 text-muted-foreground">
          A IA está escrevendo o código do seu projeto.
          Você pode acompanhar o progresso no repositório.
        </p>

        <div className="space-y-2 rounded-xl border bg-card p-4 text-left">
          <FileProgress name="package.json" status="done" />
          <FileProgress name="src/app/page.tsx" status="done" />
          <FileProgress name="src/components/..." status="generating" />
          <FileProgress name="prisma/schema.prisma" status="pending" />
        </div>
      </div>
    </div>
  )
}

// Phase: DEPLOYING
function DeployingWorkspace() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700">
            <svg className="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.3 6.3L12 1 6.7 6.3 12 11.7 17.3 6.3zM6.3 6.7L1 12l5.3 5.3L11.7 12 6.3 6.7zM17.7 6.7L12.3 12l5.3 5.3L23 12l-5.3-5.3zM6.7 17.7L12 23l5.3-5.3L12 12.3 6.7 17.7z" />
            </svg>
          </div>
        </div>

        <h2 className="mb-3 text-2xl font-bold tracking-tight">
          Publicando na Netlify
        </h2>

        <p className="mb-6 text-muted-foreground">
          Seu projeto está sendo publicado. Em instantes
          você terá um link para acessar.
        </p>

        <div className="flex items-center justify-center gap-2">
          <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
          <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
          <div className="h-2 w-2 animate-bounce rounded-full bg-primary" />
        </div>
      </div>
    </div>
  )
}

// Phase: LIVE
function LiveWorkspace({
  repoUrl,
  deployUrl,
  projectName,
}: {
  repoUrl?: string | null
  deployUrl?: string | null
  projectName: string
}) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600">
            <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h2 className="mb-3 text-2xl font-bold tracking-tight">
          {projectName} está no ar!
        </h2>

        <p className="mb-8 text-muted-foreground">
          Seu projeto foi publicado com sucesso.
          Acesse os links abaixo para ver o resultado.
        </p>

        <div className="space-y-3">
          {deployUrl && (
            <a
              href={deployUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Abrir Site
            </a>
          )}

          {repoUrl && (
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl border bg-card px-6 py-3 font-medium transition-colors hover:bg-muted"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Ver Repositório
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper Components
function FileProgress({ name, status }: { name: string; status: 'done' | 'generating' | 'pending' }) {
  return (
    <div className="flex items-center gap-3">
      {status === 'done' && (
        <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
      {status === 'generating' && (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      )}
      {status === 'pending' && <div className="h-4 w-4 rounded-full border-2 border-muted" />}
      <span className={`text-sm ${status === 'pending' ? 'text-muted-foreground' : ''}`}>{name}</span>
    </div>
  )
}

// ============================================================
// Visual Preview Components for UX Plan (Issue #39)
// ============================================================

// --- Navigation Pattern Card ---
function NavigationPatternCard({ name, description }: { name: string; description: string }) {
  const key = name.toLowerCase()
  return (
    <div className="group rounded-lg border bg-muted/30 p-3 transition-colors hover:border-blue-200">
      <div className="mb-2 flex aspect-[16/10] items-center justify-center rounded bg-gray-50" aria-hidden="true">
        {key.includes('sidebar') ? <SidebarWireframe /> :
         key.includes('bottom') || key.includes('tab bar') ? <BottomBarWireframe /> :
         key.includes('tab') ? <TopTabsWireframe /> :
         key.includes('breadcrumb') ? <BreadcrumbWireframe /> :
         <GenericNavWireframe />}
      </div>
      <p className="text-sm font-semibold">{name}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  )
}

function SidebarWireframe() {
  return (
    <svg viewBox="0 0 200 140" className="h-full w-full max-h-[100px]" role="img" aria-label="Wireframe de navegação sidebar">
      <rect x="2" y="2" width="50" height="136" rx="4" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="1" />
      {[20, 38, 56, 74, 92].map((y) => (
        <rect key={y} x="10" y={y} width="34" height="8" rx="2" fill={y === 20 ? '#93c5fd' : '#d1d5db'} />
      ))}
      <rect x="60" y="2" width="138" height="136" rx="4" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1" />
      <rect x="70" y="14" width="80" height="8" rx="2" fill="#d1d5db" />
      <rect x="70" y="32" width="118" height="40" rx="4" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1" />
      <rect x="70" y="82" width="56" height="40" rx="4" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1" />
      <rect x="132" y="82" width="56" height="40" rx="4" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1" />
    </svg>
  )
}

function BottomBarWireframe() {
  return (
    <svg viewBox="0 0 200 140" className="h-full w-full max-h-[100px]" role="img" aria-label="Wireframe de navegação bottom bar">
      <rect x="2" y="2" width="196" height="108" rx="4" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1" />
      <rect x="12" y="14" width="80" height="8" rx="2" fill="#d1d5db" />
      <rect x="12" y="32" width="176" height="30" rx="4" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1" />
      <rect x="12" y="70" width="84" height="30" rx="4" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1" />
      <rect x="104" y="70" width="84" height="30" rx="4" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1" />
      <rect x="2" y="114" width="196" height="24" rx="4" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="1" />
      {[30, 70, 110, 150].map((x) => (
        <circle key={x} cx={x} cy="126" r="6" fill="#d1d5db" />
      ))}
      <circle cx="70" cy="126" r="6" fill="#93c5fd" />
    </svg>
  )
}

function TopTabsWireframe() {
  return (
    <svg viewBox="0 0 200 140" className="h-full w-full max-h-[100px]" role="img" aria-label="Wireframe de navegação por tabs">
      <rect x="2" y="2" width="196" height="136" rx="4" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1" />
      <rect x="2" y="2" width="196" height="28" rx="4" fill="#e5e7eb" />
      <rect x="10" y="8" width="40" height="16" rx="3" fill="#93c5fd" />
      <rect x="56" y="8" width="40" height="16" rx="3" fill="#d1d5db" />
      <rect x="102" y="8" width="40" height="16" rx="3" fill="#d1d5db" />
      <rect x="12" y="42" width="176" height="40" rx="4" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1" />
      <rect x="12" y="92" width="176" height="36" rx="4" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1" />
    </svg>
  )
}

function BreadcrumbWireframe() {
  return (
    <svg viewBox="0 0 200 140" className="h-full w-full max-h-[100px]" role="img" aria-label="Wireframe de navegação breadcrumb">
      <rect x="2" y="2" width="196" height="136" rx="4" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1" />
      <rect x="10" y="10" width="30" height="10" rx="2" fill="#93c5fd" />
      <text x="46" y="18" fontSize="10" fill="#9ca3af">&gt;</text>
      <rect x="56" y="10" width="40" height="10" rx="2" fill="#93c5fd" />
      <text x="102" y="18" fontSize="10" fill="#9ca3af">&gt;</text>
      <rect x="112" y="10" width="50" height="10" rx="2" fill="#6b7280" />
      <rect x="10" y="30" width="180" height="100" rx="4" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1" />
    </svg>
  )
}

function GenericNavWireframe() {
  return (
    <svg viewBox="0 0 200 140" className="h-full w-full max-h-[100px]" role="img" aria-label="Wireframe de navegação genérica">
      <rect x="2" y="2" width="196" height="136" rx="4" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1" />
      <rect x="10" y="10" width="20" height="12" rx="2" fill="#d1d5db" />
      <rect x="10" y="30" width="180" height="100" rx="4" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1" />
    </svg>
  )
}

// --- Wireframe Card ---
function WireframeCard({ name, description, layout }: { name: string; description: string; layout?: string }) {
  const key = (layout || '').toLowerCase()
  return (
    <div className="group rounded-lg border bg-card p-3 transition-colors hover:border-blue-200 hover:shadow-sm">
      <p className="mb-2 text-sm font-semibold">{name}</p>
      <div className="mb-2 flex aspect-[16/10] items-center justify-center rounded bg-gray-50" aria-hidden="true">
        {key.includes('sidebar') ? <SidebarLayoutWireframe /> :
         key.includes('card') || key.includes('grid') ? <GridLayoutWireframe /> :
         key.includes('list') || key.includes('table') || key.includes('lista') ? <ListLayoutWireframe /> :
         key.includes('form') || key.includes('formulário') || key.includes('formulario') ? <FormLayoutWireframe /> :
         key.includes('mobile') || key.includes('app') ? <MobileLayoutWireframe /> :
         <GenericLayoutWireframe />}
      </div>
      <p className="line-clamp-2 text-xs text-muted-foreground">{description}</p>
      {layout && <p className="mt-1 text-xs text-gray-400">Layout: {layout}</p>}
    </div>
  )
}

function SidebarLayoutWireframe() {
  return (
    <svg viewBox="0 0 200 125" className="h-full w-full max-h-[90px]" role="img" aria-label="Wireframe com sidebar">
      <rect x="2" y="2" width="45" height="121" rx="3" fill="#e5e7eb" />
      {[14, 30, 46, 62].map((y) => (
        <rect key={y} x="8" y={y} width="33" height="8" rx="2" fill="#d1d5db" />
      ))}
      <rect x="55" y="2" width="143" height="121" rx="3" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1" />
      <rect x="63" y="12" width="60" height="6" rx="2" fill="#d1d5db" />
      <rect x="63" y="26" width="127" height="35" rx="3" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1" />
      <rect x="63" y="69" width="60" height="45" rx="3" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1" />
      <rect x="130" y="69" width="60" height="45" rx="3" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1" />
    </svg>
  )
}

function GridLayoutWireframe() {
  return (
    <svg viewBox="0 0 200 125" className="h-full w-full max-h-[90px]" role="img" aria-label="Wireframe com grid de cards">
      <rect x="2" y="2" width="196" height="20" rx="3" fill="#e5e7eb" />
      <rect x="8" y="7" width="50" height="10" rx="2" fill="#d1d5db" />
      {[[8, 30], [104, 30], [8, 78], [104, 78]].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="88" height="40" rx="4" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1" />
      ))}
    </svg>
  )
}

function ListLayoutWireframe() {
  return (
    <svg viewBox="0 0 200 125" className="h-full w-full max-h-[90px]" role="img" aria-label="Wireframe com layout de lista">
      <rect x="2" y="2" width="196" height="20" rx="3" fill="#e5e7eb" />
      <rect x="8" y="7" width="50" height="10" rx="2" fill="#d1d5db" />
      {[30, 52, 74, 96].map((y) => (
        <g key={y}>
          <rect x="8" y={y} width="184" height="16" rx="3" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1" />
          <rect x="14" y={y + 4} width="60" height="8" rx="2" fill="#d1d5db" />
          <rect x="80" y={y + 4} width="40" height="8" rx="2" fill="#e5e7eb" />
        </g>
      ))}
    </svg>
  )
}

function FormLayoutWireframe() {
  return (
    <svg viewBox="0 0 200 125" className="h-full w-full max-h-[90px]" role="img" aria-label="Wireframe com layout de formulário">
      <rect x="30" y="2" width="140" height="121" rx="4" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1" />
      <rect x="40" y="10" width="60" height="6" rx="2" fill="#d1d5db" />
      {[24, 50, 76].map((y) => (
        <g key={y}>
          <rect x="40" y={y} width="30" height="5" rx="1" fill="#9ca3af" />
          <rect x="40" y={y + 8} width="120" height="14" rx="3" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1" />
        </g>
      ))}
      <rect x="110" y="104" width="50" height="14" rx="3" fill="#93c5fd" />
    </svg>
  )
}

function MobileLayoutWireframe() {
  return (
    <svg viewBox="0 0 200 125" className="h-full w-full max-h-[90px]" role="img" aria-label="Wireframe de layout mobile">
      <rect x="65" y="2" width="70" height="121" rx="10" fill="#f9fafb" stroke="#d1d5db" strokeWidth="1.5" />
      <rect x="85" y="6" width="30" height="4" rx="2" fill="#e5e7eb" />
      <rect x="72" y="16" width="56" height="10" rx="2" fill="#e5e7eb" />
      <rect x="72" y="32" width="56" height="30" rx="3" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1" />
      <rect x="72" y="68" width="56" height="20" rx="3" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1" />
      <rect x="72" y="94" width="56" height="10" rx="2" fill="#93c5fd" />
      <rect x="72" y="110" width="56" height="8" rx="2" fill="#e5e7eb" />
    </svg>
  )
}

function GenericLayoutWireframe() {
  return (
    <svg viewBox="0 0 200 125" className="h-full w-full max-h-[90px]" role="img" aria-label="Wireframe de layout genérico">
      <rect x="2" y="2" width="196" height="20" rx="3" fill="#e5e7eb" />
      <rect x="8" y="7" width="50" height="10" rx="2" fill="#d1d5db" />
      <rect x="8" y="30" width="184" height="60" rx="4" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1" />
      <rect x="8" y="98" width="184" height="20" rx="3" fill="#e5e7eb" />
    </svg>
  )
}

// --- Component Group Preview ---
function ComponentGroupPreview({ name, variants }: { name: string; variants: Array<{ name: string; description: string }> }) {
  const key = name.toLowerCase()
  const isButton = key.includes('button') || key.includes('botão') || key.includes('botao') || key.includes('botões') || key.includes('botoes')
  const isBadge = key.includes('badge') || key.includes('status') || key.includes('tag')
  const isCard = key.includes('card')
  const isInput = key.includes('input') || key.includes('form') || key.includes('campo')

  return (
    <div>
      <p className="mb-2 text-sm font-semibold">{name}</p>
      <div className="rounded-lg bg-muted/30 p-4">
        {isButton ? <ButtonVariantsPreview variants={variants} /> :
         isBadge ? <BadgeVariantsPreview variants={variants} /> :
         isCard ? <CardVariantsPreview variants={variants} /> :
         isInput ? <InputVariantsPreview variants={variants} /> :
         <DefaultVariantsPreview variants={variants} />}
      </div>
    </div>
  )
}

function ButtonVariantsPreview({ variants }: { variants: Array<{ name: string; description: string }> }) {
  const buttonStyles: Record<string, string> = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
    destructive: 'bg-red-500 text-white hover:bg-red-600',
    ghost: 'text-gray-600 hover:bg-gray-100',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    disabled: 'bg-gray-200 text-gray-400 cursor-not-allowed',
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {variants.map((v, i) => {
          const vKey = v.name.toLowerCase()
          const style = Object.entries(buttonStyles).find(([k]) => vKey.includes(k))?.[1] || buttonStyles.secondary
          return (
            <button key={i} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${style}`} disabled={vKey.includes('disabled')}>
              {v.name}
            </button>
          )
        })}
      </div>
      <div className="space-y-1">
        {variants.map((v, i) => (
          <p key={i} className="text-xs text-muted-foreground"><span className="font-medium text-foreground">{v.name}</span> — {v.description}</p>
        ))}
      </div>
    </div>
  )
}

function BadgeVariantsPreview({ variants }: { variants: Array<{ name: string; description: string }> }) {
  const badgeColors: Record<string, string> = {
    pend: 'bg-amber-100 text-amber-800',
    prepar: 'bg-blue-100 text-blue-800',
    process: 'bg-blue-100 text-blue-800',
    ready: 'bg-amber-100 text-amber-800',
    pronto: 'bg-amber-100 text-amber-800',
    deliver: 'bg-purple-100 text-purple-800',
    entreg: 'bg-green-100 text-green-800',
    done: 'bg-green-100 text-green-800',
    success: 'bg-green-100 text-green-800',
    cancel: 'bg-red-100 text-red-800',
    error: 'bg-red-100 text-red-800',
    warning: 'bg-amber-100 text-amber-800',
    info: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
  }

  function getBadgeColor(variantName: string) {
    const k = variantName.toLowerCase()
    for (const [pattern, color] of Object.entries(badgeColors)) {
      if (k.includes(pattern)) return color
    }
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {variants.map((v, i) => (
          <span key={i} className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getBadgeColor(v.name)}`}>
            {v.name}
          </span>
        ))}
      </div>
      <div className="space-y-1">
        {variants.map((v, i) => (
          <p key={i} className="text-xs text-muted-foreground"><span className="font-medium text-foreground">{v.name}</span> — {v.description}</p>
        ))}
      </div>
    </div>
  )
}

function CardVariantsPreview({ variants }: { variants: Array<{ name: string; description: string }> }) {
  return (
    <div className="space-y-3">
      {variants.map((v, i) => {
        const vKey = v.name.toLowerCase()
        const borderClass = vKey.includes('highlight') ? 'border-blue-300 shadow-blue-100' : vKey.includes('elevat') ? 'shadow-md' : ''
        return (
          <div key={i} className={`rounded-lg border bg-white p-3 ${borderClass}`}>
            <p className="text-xs font-semibold text-gray-700">{v.name}</p>
            <p className="text-xs text-gray-400">{v.description}</p>
          </div>
        )
      })}
    </div>
  )
}

function InputVariantsPreview({ variants }: { variants: Array<{ name: string; description: string }> }) {
  return (
    <div className="space-y-3">
      {variants.map((v, i) => {
        const vKey = v.name.toLowerCase()
        const isError = vKey.includes('error') || vKey.includes('erro')
        const isDisabled = vKey.includes('disabled') || vKey.includes('desab')
        const isFocused = vKey.includes('focus') || vKey.includes('foco')
        const borderClass = isError ? 'border-red-400 bg-red-50' : isFocused ? 'border-blue-500 ring-2 ring-blue-100' : isDisabled ? 'border-gray-200 bg-gray-100 text-gray-400' : 'border-gray-300'
        return (
          <div key={i}>
            <label className={`mb-1 block text-xs font-medium ${isError ? 'text-red-600' : 'text-gray-600'}`}>{v.name}</label>
            <input
              type="text"
              readOnly
              disabled={isDisabled}
              placeholder={v.description}
              className={`w-full rounded-md border px-3 py-1.5 text-xs ${borderClass}`}
            />
          </div>
        )
      })}
    </div>
  )
}

function DefaultVariantsPreview({ variants }: { variants: Array<{ name: string; description: string }> }) {
  return (
    <div className="space-y-2">
      {variants.map((v, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="rounded-md bg-background px-2 py-1 text-xs font-medium">{v.name}</span>
          <span className="text-xs text-muted-foreground">{v.description}</span>
        </div>
      ))}
    </div>
  )
}
