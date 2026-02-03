'use client'

import { useState } from 'react'
import { useProjectLayout } from './ProjectLayout'

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
  onApproveUxPlan?: () => void
}

export function WorkspacePanel({
  projectId: _projectId,
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
  onApproveUxPlan,
}: WorkspacePanelProps) {
  const { setChatOpen } = useProjectLayout()

  // Render different content based on phase
  switch (status) {
    case 'IDEATION':
      return <IdeationWorkspace projectName={projectName} discoveryProgress={discoveryProgress} onStartChat={() => setChatOpen(true)} />
    case 'PLANNING':
      return <PlanningWorkspace businessPlan={businessPlan} technicalPlan={technicalPlan} uxPlan={uxPlan} businessPlanApproved={businessPlanApproved} technicalPlanApproved={technicalPlanApproved} uxPlanApproved={uxPlanApproved} onApprove={onApprove} onSavePlan={onSavePlan} onApproveTechnicalPlan={onApproveTechnicalPlan} onApproveUxPlan={onApproveUxPlan} />
    case 'CONNECTING':
      return <ConnectingWorkspace />
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

// Parse technical plan from JSON string
interface ParsedTechnicalPlan {
  stack?: {
    frontend?: { name: string; version?: string; description?: string }
    backend?: { name: string; description?: string }
    database?: { name: string; provider?: string; description?: string }
    deploy?: { name: string; description?: string }
  }
  architecture?: { pattern?: string; description?: string }
  folderStructure?: string[]
  dataModel?: { entities?: string[]; description?: string }
}

function parseTechnicalPlan(planStr: string): ParsedTechnicalPlan | null {
  try {
    return JSON.parse(planStr)
  } catch {
    return null
  }
}

// Parse UX plan from JSON string
interface ParsedUxPlan {
  personas?: Array<{
    name: string
    age?: number
    role?: string
    goals?: string[]
    painPoints?: string[]
  }>
  journeys?: Array<{
    name: string
    steps?: string[]
  }>
  wireframes?: string[]
  designTokens?: {
    colors?: { primary?: string; secondary?: string }
    typography?: { fontFamily?: string; fontSize?: { base?: string } }
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

// Phase: PLANNING
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
  onApproveUxPlan,
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
  onApproveUxPlan?: () => void
}) {
  // Parse business plan JSON
  const plan = businessPlan ? parsePlan(businessPlan) : null

  // Parse technical plan JSON
  const techPlan = technicalPlan ? parseTechnicalPlan(technicalPlan) : null

  // Parse UX plan JSON
  const uxPlanParsed = uxPlan ? parseUxPlan(uxPlan) : null

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [editedPlan, setEditedPlan] = useState<ParsedPlan | null>(null)

  // Enter edit mode
  const handleEdit = () => {
    if (plan) {
      setEditedPlan({ ...plan })
      setIsEditing(true)
    }
  }

  // Cancel edit
  const handleCancel = () => {
    setEditedPlan(null)
    setIsEditing(false)
  }

  // Save changes
  const handleSave = () => {
    if (editedPlan && onSavePlan) {
      onSavePlan(editedPlan)
    }
    setIsEditing(false)
    setEditedPlan(null)
  }

  // Update field in edit mode
  const updateField = (field: keyof ParsedPlan, value: string) => {
    if (editedPlan) {
      setEditedPlan({ ...editedPlan, [field]: value })
    }
  }

  // Use edited plan in edit mode, otherwise original
  const displayPlan = isEditing ? editedPlan : plan

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h2 className="mb-2 text-xl font-bold">Plano do Projeto</h2>
          <p className="text-sm text-muted-foreground">
            Revise o plano gerado. Peça ajustes no chat se necessário.
          </p>
        </div>

        {displayPlan ? (
          <>
            {/* Header */}
            <div className="rounded-xl border bg-card p-6">
              <div className="flex items-start justify-between">
                <h3 className="text-2xl font-bold">{displayPlan.name}</h3>
                {businessPlanApproved && (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                    Aprovado
                  </span>
                )}
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={editedPlan?.tagline || ''}
                  onChange={(e) => updateField('tagline', e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-lg text-muted-foreground focus:border-blue-500 focus:outline-none"
                  placeholder="Tagline do projeto"
                />
              ) : (
                displayPlan.tagline && (
                  <p className="mt-1 text-lg text-muted-foreground">{displayPlan.tagline}</p>
                )
              )}
              {displayPlan.description && (
                <p className="mt-3 text-sm">{displayPlan.description}</p>
              )}
            </div>

            {/* Problem & Audience */}
            <div className="grid gap-4 md:grid-cols-2">
              {displayPlan.problemStatement && (
                <div className="rounded-xl border bg-card p-5">
                  <h4 className="mb-2 flex items-center gap-2 font-semibold">
                    <span className="text-lg">🎯</span> Problema
                  </h4>
                  <p className="text-sm text-muted-foreground">{displayPlan.problemStatement}</p>
                </div>
              )}
              {displayPlan.targetAudience && (
                <div className="rounded-xl border bg-card p-5">
                  <h4 className="mb-2 flex items-center gap-2 font-semibold">
                    <span className="text-lg">👥</span> Público-Alvo
                  </h4>
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

            {/* Features */}
            {displayPlan.coreFeatures && displayPlan.coreFeatures.length > 0 && (
              <div className="rounded-xl border bg-card p-5">
                <h4 className="mb-4 flex items-center gap-2 font-semibold">
                  <span className="text-lg">⚡</span> Funcionalidades Principais
                </h4>
                <div className="space-y-3">
                  {displayPlan.coreFeatures.map((feature: { id: string; name: string; description: string; priority: string }, i: number) => (
                    <div key={feature.id || i} className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-medium">{feature.name}</p>
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Monetization */}
            {displayPlan.monetization && (
              <div className="rounded-xl border bg-card p-5">
                <h4 className="mb-2 flex items-center gap-2 font-semibold">
                  <span className="text-lg">💰</span> Monetização
                </h4>
                <p className="text-sm">
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    {displayPlan.monetization.model}
                  </span>
                  <span className="ml-2 text-muted-foreground">{displayPlan.monetization.description}</span>
                </p>
              </div>
            )}

            {/* CTA - Different buttons based on state */}
            {!businessPlanApproved && (
              <div className="flex justify-end gap-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleCancel}
                      className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSave}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      Salvar Alterações
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleEdit}
                      className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
                    >
                      Editar Plano
                    </button>
                    <button
                      onClick={onApprove}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      Aprovar e Continuar
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="rounded-xl border bg-card p-6">
            <div className="rounded-lg bg-muted/50 p-4 text-center text-sm text-muted-foreground">
              Aguardando geração do plano...
            </div>
          </div>
        )}

        {/* Technical Plan */}
        <div className="rounded-xl border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Plano Técnico</h3>
                <p className="text-xs text-muted-foreground">Arquitetura e tecnologias</p>
              </div>
            </div>
            {technicalPlanApproved && (
              <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                Aprovado
              </span>
            )}
          </div>
          {techPlan ? (
            <>
              {/* Stack display */}
              <div className="space-y-3">
                {techPlan.stack?.frontend && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="font-medium">{techPlan.stack.frontend.name}</p>
                    <p className="text-xs text-muted-foreground">{techPlan.stack.frontend.description}</p>
                  </div>
                )}
                {techPlan.stack?.database && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="font-medium">{techPlan.stack.database.name}</p>
                    <p className="text-xs text-muted-foreground">{techPlan.stack.database.description}</p>
                  </div>
                )}
              </div>

              {/* CTA buttons for Technical Plan */}
              {!technicalPlanApproved && (
                <div className="mt-4 flex justify-end gap-3">
                  <button className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted">
                    Editar Stack
                  </button>
                  <button
                    onClick={onApproveTechnicalPlan}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Aprovar e Continuar
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-lg bg-muted/50 p-4 text-center text-sm text-muted-foreground">
              Aguardando geração do plano...
            </div>
          )}
        </div>

        {/* UX Plan */}
        <div className="rounded-xl border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-100 text-pink-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Plano de UX</h3>
                <p className="text-xs text-muted-foreground">Personas e design tokens</p>
              </div>
            </div>
            {uxPlanApproved && (
              <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                Aprovado
              </span>
            )}
          </div>
          {uxPlanParsed ? (
            <>
              {/* Personas section */}
              {uxPlanParsed.personas && uxPlanParsed.personas.length > 0 && (
                <div className="mb-4">
                  <h4 className="mb-3 font-medium">Personas</h4>
                  <div className="space-y-3">
                    {uxPlanParsed.personas.map((persona, i) => (
                      <div key={i} className="rounded-lg bg-muted/50 p-3">
                        <p className="font-medium">{persona.name}</p>
                        {persona.role && (
                          <p className="text-xs text-muted-foreground">{persona.role}</p>
                        )}
                        {persona.goals && persona.goals.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {persona.goals.map((goal, j) => (
                              <li key={j} className="text-xs text-muted-foreground">• {goal}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Design Tokens section */}
              {uxPlanParsed.designTokens && (
                <div className="mb-4">
                  <h4 className="mb-3 font-medium">Design Tokens</h4>
                  <div className="rounded-lg bg-muted/50 p-3">
                    {uxPlanParsed.designTokens.colors?.primary && (
                      <div className="flex items-center gap-2">
                        <div
                          className="h-4 w-4 rounded"
                          style={{ backgroundColor: isValidHexColor(uxPlanParsed.designTokens.colors.primary) ? uxPlanParsed.designTokens.colors.primary : undefined }}
                        />
                        <p className="text-xs text-muted-foreground">
                          Primary: {uxPlanParsed.designTokens.colors.primary}
                        </p>
                      </div>
                    )}
                    {uxPlanParsed.designTokens.typography?.fontFamily && (
                      <p className="text-xs text-muted-foreground">
                        Font: {uxPlanParsed.designTokens.typography.fontFamily}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* CTA buttons for UX Plan */}
              {!uxPlanApproved && (
                <div className="mt-4 flex justify-end gap-3">
                  <button
                    onClick={onApproveUxPlan}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Aprovar e Continuar
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-lg bg-muted/50 p-4 text-center text-sm text-muted-foreground">
              Aguardando geração do plano...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Phase: CONNECTING
function ConnectingWorkspace() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-900 to-gray-700">
            <svg className="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </div>
        </div>

        <h2 className="mb-3 text-2xl font-bold tracking-tight">
          Conectando ao GitHub
        </h2>

        <p className="mb-6 text-muted-foreground">
          Estamos criando o repositório e configurando o projeto.
          Isso pode levar alguns segundos.
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
