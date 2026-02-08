'use client'

import { useState } from 'react'
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
    colors?: Record<string, string>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="rounded-lg border bg-white p-6 shadow-lg">
              <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                <p className="text-sm font-medium text-gray-700">
                  {activePlan === 'business' ? 'Gerando Plano Técnico...' :
                   activePlan === 'technical' ? 'Gerando Plano de UX...' :
                   'Aprovando...'}
                </p>
              </div>
            </div>
          </div>
        )}
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
                  {cat.technologies.map((tech, j) => (
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
                  {group.endpoints.map((ep, j) => (
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
                    {channel.events.map((ev, j) => (
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
              <p className="mb-2 text-sm font-semibold">Navegação Principal</p>
              <div className="space-y-2">
                {uxPlanParsed.informationArchitecture.navigation.map((nav, i) => (
                  <div key={i} className="rounded-lg bg-muted/50 p-3">
                    <p className="text-sm font-semibold">{nav.name}</p>
                    <p className="text-xs text-muted-foreground">{nav.description}</p>
                  </div>
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
          <div className="space-y-3">
            {uxPlanParsed.wireframes.map((wf, i) => (
              <div key={i} className="rounded-lg bg-muted/50 p-3">
                <p className="font-semibold">{wf.name}</p>
                <p className="text-sm text-muted-foreground">{wf.description}</p>
                {wf.layout && <p className="mt-1 text-xs text-gray-500">{wf.layout}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Biblioteca de Componentes */}
      {uxPlanParsed.componentLibrary && uxPlanParsed.componentLibrary.length > 0 && (
        <div className="rounded-xl border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">🧩 Biblioteca de Componentes</h3>
          <div className="space-y-4">
            {uxPlanParsed.componentLibrary.map((group, i) => (
              <div key={i}>
                <p className="mb-2 text-sm font-semibold">{group.name}</p>
                <div className="space-y-2 rounded-lg bg-muted/50 p-3">
                  {group.variants.map((variant, j) => (
                    <div key={j} className="flex items-center gap-3">
                      <span className="rounded-md bg-background px-2 py-1 text-xs font-medium">{variant.name}</span>
                      <span className="text-xs text-muted-foreground">{variant.description}</span>
                    </div>
                  ))}
                </div>
              </div>
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
                  {Object.entries(uxPlanParsed.designTokens.colors).map(([name, value]) => (
                    <div key={name} className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                      <div className="h-6 w-6 rounded-md border"
                        style={{ backgroundColor: isValidHexColor(value) ? value : undefined }} />
                      <div>
                        <p className="text-xs font-semibold capitalize">{name}</p>
                        <p className="text-xs text-muted-foreground">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {uxPlanParsed.designTokens.typography && uxPlanParsed.designTokens.typography.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold">Tipografia</p>
                <div className="space-y-1">
                  {uxPlanParsed.designTokens.typography.map((typo, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2 text-sm">
                      <span className="w-20 font-semibold">{typo.name}</span>
                      <span className="text-muted-foreground">{typo.font}</span>
                    </div>
                  ))}
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
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-black to-gray-800">
            <svg className="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 22.525H0l12-21.05 12 21.05z" />
            </svg>
          </div>
        </div>

        <h2 className="mb-3 text-2xl font-bold tracking-tight">
          Publicando na Vercel
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
