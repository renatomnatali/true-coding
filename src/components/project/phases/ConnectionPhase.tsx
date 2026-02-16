'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { AssessmentResult, IterationPlanItem } from '@/types'

// ---------------------------------------------------------------------------
// Sub-state derivation
// ---------------------------------------------------------------------------
// githubRepoUrl === null                          → "github"        (tela 01)
// githubRepoUrl !== null && productionUrl === null → "repo-created"  (tela 02)
// productionUrl !== null                          → "connected"     (tela 03)
// ---------------------------------------------------------------------------

type ConnectionSubState = 'github' | 'repo-created' | 'connected'

type AssessmentAgentName = 'AssessmentAgent' | 'IterationPlannerAgent'
type AssessmentAgentStatus = 'idle' | 'running' | 'succeeded' | 'failed'

interface AssessmentAgentStep {
  agentName: AssessmentAgentName
  label: string
  status: AssessmentAgentStatus
}

const INITIAL_ASSESSMENT_STEPS: AssessmentAgentStep[] = [
  {
    agentName: 'AssessmentAgent',
    label: 'AssessmentAgent está analisando a complexidade',
    status: 'idle',
  },
  {
    agentName: 'IterationPlannerAgent',
    label: 'IterationPlannerAgent está montando o plano de iterações',
    status: 'idle',
  },
]

function deriveSubState(githubRepoUrl: string | null, productionUrl: string | null): ConnectionSubState {
  if (!githubRepoUrl) return 'github'
  if (!productionUrl) return 'repo-created'
  return 'connected'
}

interface ConnectionPhaseProps {
  projectId: string
  projectName: string
  githubRepoUrl: string | null
  productionUrl: string | null
  hasGitHubToken: boolean
  /** Set to true when URL contains ?github=connected (triggers repo creation) */
  githubJustConnected: boolean
  /** Set to true when URL contains ?netlify=connected (triggers Netlify site creation) */
  netlifyJustConnected?: boolean
  /** Set to true when URL contains ?error=github_auth_failed or ?error=netlify_auth_failed */
  hasOAuthError?: boolean
}

export function ConnectionPhase({
  projectId,
  projectName,
  githubRepoUrl: initialRepoUrl,
  productionUrl: initialProductionUrl,
  hasGitHubToken: _hasGitHubToken,
  githubJustConnected,
  netlifyJustConnected = false,
  hasOAuthError = false,
}: ConnectionPhaseProps) {
  const [githubRepoUrl, setGithubRepoUrl] = useState(initialRepoUrl)
  const [productionUrl, setProductionUrl] = useState(initialProductionUrl)
  const [error, setError] = useState<string | null>(hasOAuthError ? 'oauth_error' : null)
  const [isCreatingRepo, setIsCreatingRepo] = useState(false)
  const [isConnectingNetlify, setIsConnectingNetlify] = useState(false)
  const [copied, setCopied] = useState(false)
  const [checkpointStep, setCheckpointStep] = useState<'checkpoint' | 'create-account' | 'oauth'>('checkpoint')
  const [isAnalyzingComplexity, setIsAnalyzingComplexity] = useState(false)
  const [assessmentError, setAssessmentError] = useState<string | null>(null)
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null)
  const [iterationPlan, setIterationPlan] = useState<IterationPlanItem[]>([])
  const [assessmentSteps, setAssessmentSteps] = useState<AssessmentAgentStep[]>(INITIAL_ASSESSMENT_STEPS)
  const [isStartingDevelopment, setIsStartingDevelopment] = useState(false)
  const [startDevelopmentError, setStartDevelopmentError] = useState<string | null>(null)

  const subState = deriveSubState(githubRepoUrl, productionUrl)

  // Refs to prevent retry loops — each auto-trigger runs exactly once
  const repoAttemptedRef = useRef(false)
  const netlifyAttemptedRef = useRef(false)

  // Auto-trigger repo creation when returning from GitHub OAuth
  const createRepo = useCallback(async () => {
    if (isCreatingRepo || githubRepoUrl) return
    setIsCreatingRepo(true)
    setError(null)

    try {
      const res = await fetch(`/api/projects/${projectId}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: 'github' }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.message || 'Erro ao criar repositório')
        return
      }

      const data = await res.json()
      setGithubRepoUrl(data.githubRepoUrl)
    } catch {
      setError('Erro de rede ao criar repositório. Tente novamente.')
    } finally {
      setIsCreatingRepo(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  // Auto-trigger Netlify site creation when returning from Netlify OAuth
  const createNetlifySite = useCallback(async () => {
    if (isConnectingNetlify || productionUrl) return
    setIsConnectingNetlify(true)
    setError(null)

    try {
      const res = await fetch(`/api/projects/${projectId}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: 'netlify' }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.message || 'Erro ao criar site na Netlify')
        return
      }

      const data = await res.json()
      setProductionUrl(data.productionUrl)
    } catch {
      setError('Erro de rede ao conectar Netlify. Tente novamente.')
    } finally {
      setIsConnectingNetlify(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const analyzeComplexity = useCallback(async () => {
    if (isAnalyzingComplexity) return

    setIsAnalyzingComplexity(true)
    setAssessmentError(null)
    setStartDevelopmentError(null)
    setAssessmentResult(null)
    setIterationPlan([])
    setAssessmentSteps([
      { ...INITIAL_ASSESSMENT_STEPS[0], status: 'running' },
      { ...INITIAL_ASSESSMENT_STEPS[1], status: 'idle' },
    ])

    try {
      const res = await fetch(`/api/projects/${projectId}/development/assessment`, {
        method: 'POST',
      })

      if (!res.ok) {
        let message = 'Erro ao analisar a complexidade.'
        try {
          const data = await res.json()
          if (typeof data?.message === 'string' && data.message) {
            message = data.message
          }
        } catch {
          // ignore parse failures
        }

        setAssessmentError(message)
        setAssessmentSteps([
          { ...INITIAL_ASSESSMENT_STEPS[0], status: 'failed' },
          { ...INITIAL_ASSESSMENT_STEPS[1], status: 'idle' },
        ])
        return
      }

      const data = await res.json()
      const assessment = data?.assessment as AssessmentResult | undefined
      const iterations = Array.isArray(data?.iterations)
        ? (data.iterations as IterationPlanItem[])
        : []

      if (!assessment) {
        setAssessmentError('Resposta inválida da análise de complexidade.')
        setAssessmentSteps([
          { ...INITIAL_ASSESSMENT_STEPS[0], status: 'failed' },
          { ...INITIAL_ASSESSMENT_STEPS[1], status: 'idle' },
        ])
        return
      }

      setAssessmentSteps([
        { ...INITIAL_ASSESSMENT_STEPS[0], status: 'succeeded' },
        { ...INITIAL_ASSESSMENT_STEPS[1], status: 'running' },
      ])

      setAssessmentResult(assessment)
      setIterationPlan(iterations)
      setAssessmentSteps([
        { ...INITIAL_ASSESSMENT_STEPS[0], status: 'succeeded' },
        { ...INITIAL_ASSESSMENT_STEPS[1], status: 'succeeded' },
      ])
    } catch {
      setAssessmentError('Erro de rede ao analisar a complexidade. Tente novamente.')
      setAssessmentSteps([
        { ...INITIAL_ASSESSMENT_STEPS[0], status: 'failed' },
        { ...INITIAL_ASSESSMENT_STEPS[1], status: 'idle' },
      ])
    } finally {
      setIsAnalyzingComplexity(false)
    }
  }, [projectId, isAnalyzingComplexity])

  const startDevelopment = useCallback(async () => {
    if (isStartingDevelopment) return

    if (!assessmentResult || iterationPlan.length === 0) {
      setStartDevelopmentError('Conclua a análise de complexidade para continuar o desenvolvimento.')
      return
    }

    setIsStartingDevelopment(true)
    setStartDevelopmentError(null)

    try {
      const res = await fetch(`/api/projects/${projectId}/development/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentConfirmed: true,
          approvedAssessment: assessmentResult,
          approvedIterations: iterationPlan,
        }),
      })

      if (!res.ok) {
        let message = 'Erro ao iniciar o desenvolvimento autônomo.'
        try {
          const data = await res.json()
          if (typeof data?.message === 'string' && data.message) {
            message = data.message
          }
        } catch {
          // ignore parse failures
        }
        setStartDevelopmentError(message)
        return
      }

      window.location.reload()
    } catch {
      setStartDevelopmentError('Erro de rede ao iniciar o desenvolvimento. Tente novamente.')
    } finally {
      setIsStartingDevelopment(false)
    }
  }, [projectId, isStartingDevelopment, assessmentResult, iterationPlan])

  useEffect(() => {
    if (githubJustConnected && !githubRepoUrl && !repoAttemptedRef.current) {
      repoAttemptedRef.current = true
      createRepo()
    }
  }, [githubJustConnected, githubRepoUrl, createRepo])

  useEffect(() => {
    if (netlifyJustConnected && githubRepoUrl && !productionUrl && !netlifyAttemptedRef.current) {
      netlifyAttemptedRef.current = true
      createNetlifySite()
    }
  }, [netlifyJustConnected, githubRepoUrl, productionUrl, createNetlifySite])

  // Error state — shown when OAuth failed and no repo yet
  if (error && !githubRepoUrl) {
    return <ErrorView projectId={projectId} errorMessage={error !== 'oauth_error' ? error : undefined} onRetry={() => { repoAttemptedRef.current = false; createRepo() }} />
  }

  // Loading state — repo creation in progress after OAuth return
  if ((githubJustConnected || isCreatingRepo) && !githubRepoUrl) {
    return <CreatingRepoView />
  }

  switch (subState) {
    case 'github':
      return (
        <GitHubCheckpointFlow
          projectId={projectId}
          projectName={projectName}
          isCreatingRepo={isCreatingRepo}
          step={checkpointStep}
          onStepChange={setCheckpointStep}
        />
      )
    case 'repo-created':
      return (
        <RepoCreatedView
          projectId={projectId}
          githubRepoUrl={githubRepoUrl!}
          isConnectingNetlify={isConnectingNetlify}
          netlifyError={error}
          onRetryNetlify={() => { netlifyAttemptedRef.current = false; createNetlifySite() }}
          copied={copied}
          onCopy={() => {
            navigator.clipboard.writeText(githubRepoUrl!)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }}
        />
      )
    case 'connected':
      return (
        <ConnectedView
          projectId={projectId}
          projectName={projectName}
          githubRepoUrl={githubRepoUrl!}
          productionUrl={productionUrl!}
          isAnalyzingComplexity={isAnalyzingComplexity}
          assessmentError={assessmentError}
          assessmentResult={assessmentResult}
          iterationPlan={iterationPlan}
          assessmentSteps={assessmentSteps}
          onAnalyzeComplexity={analyzeComplexity}
          isStartingDevelopment={isStartingDevelopment}
          startDevelopmentError={startDevelopmentError}
          onStartDevelopment={startDevelopment}
        />
      )
  }
}

// ---------------------------------------------------------------------------
// Checkpoint Flow: triagem pré-OAuth
// ---------------------------------------------------------------------------
type CheckpointStep = 'checkpoint' | 'create-account' | 'oauth'

function GitHubCheckpointFlow({
  projectId,
  projectName,
  isCreatingRepo,
  step,
  onStepChange,
}: {
  projectId: string
  projectName: string
  isCreatingRepo: boolean
  step: CheckpointStep
  onStepChange: (step: CheckpointStep) => void
}) {
  switch (step) {
    case 'checkpoint':
      return (
        <CheckpointView
          projectName={projectName}
          onHasAccount={() => onStepChange('oauth')}
          onNoAccount={() => onStepChange('create-account')}
        />
      )
    case 'create-account':
      return <CreateAccountView onContinue={() => onStepChange('oauth')} />
    case 'oauth':
      return <GitHubOAuthView projectId={projectId} projectName={projectName} isCreatingRepo={isCreatingRepo} />
  }
}

// ---------------------------------------------------------------------------
// Tela Checkpoint: "Você já tem GitHub?"
// ---------------------------------------------------------------------------
function CheckpointView({
  projectName,
  onHasAccount,
  onNoAccount,
}: {
  projectName: string
  onHasAccount: () => void
  onNoAccount: () => void
}) {
  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-2 text-xs font-medium text-gray-500">Conexão › Preparação</div>
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Hora de guardar seu código</h2>
        <p className="mb-6 text-sm text-gray-600">
          Precisamos conectar sua conta do GitHub para criar o repositório do projeto <strong>{projectName}</strong>.
        </p>

        <p className="mb-2 text-sm leading-relaxed text-gray-600">
          O GitHub é como um cofre digital para o código do seu aplicativo. É lá que seu projeto vai morar.
        </p>

        <h3 className="mb-6 mt-8 text-xl font-semibold text-gray-900">
          Você já tem uma conta no GitHub?
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={onHasAccount}
            className="flex flex-col items-center gap-3 rounded-xl border-2 border-gray-200 bg-white p-6 text-center transition-all hover:-translate-y-0.5 hover:border-blue-600 hover:shadow-md"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-900 text-white">
              <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-gray-900">Sim, já tenho</span>
            <span className="text-sm text-gray-500">Vamos conectar sua conta existente</span>
          </button>

          <button
            onClick={onNoAccount}
            className="flex flex-col items-center gap-3 rounded-xl border-2 border-gray-200 bg-white p-6 text-center transition-all hover:-translate-y-0.5 hover:border-blue-600 hover:shadow-md"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-gray-900">Ainda não tenho</span>
            <span className="text-sm text-gray-500">Vou te ajudar a criar uma conta</span>
          </button>
        </div>

        <details className="mt-6 overflow-hidden rounded-lg border border-gray-200">
          <summary className="cursor-pointer bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-100">
            O que é GitHub?
          </summary>
          <div className="border-t border-gray-200 px-4 py-3 text-sm leading-relaxed text-gray-600">
            GitHub é a maior plataforma do mundo para armazenar código de forma segura. Empresas como Microsoft, Google e Netflix usam. É gratuito para projetos pessoais.
          </div>
        </details>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tela Criar Conta: tutorial 3 passos
// ---------------------------------------------------------------------------
function CreateAccountView({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-2 text-xs font-medium text-gray-500">Conexão › Criar Conta</div>
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Criar sua conta no GitHub</h2>
        <p className="mb-6 text-sm text-gray-600">É rápido, leva menos de 2 minutos</p>

        <div className="space-y-4">
          <div className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">1</div>
            <p className="text-sm text-gray-900">Acesse github.com e clique em <strong>Sign up</strong></p>
          </div>
          <div className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">2</div>
            <p className="text-sm text-gray-900">Preencha email, senha e nome de usuário</p>
          </div>
          <div className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">3</div>
            <p className="text-sm text-gray-900">Confirme seu email e volte aqui</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <a
            href="https://github.com/signup"
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Abrir GitHub (nova aba)
          </a>
          <button
            onClick={onContinue}
            className="w-full rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Já criei minha conta, continuar
          </button>
        </div>

        <div className="mt-6 rounded-md border-l-4 border-blue-600 bg-blue-50 p-4">
          <p className="text-sm text-gray-900">
            💡 <strong>Dica:</strong> Escolha o plano <strong>gratuito</strong> (Free). É tudo que você precisa.
          </p>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tela 01: GitHub OAuth CTA
// ---------------------------------------------------------------------------
function GitHubOAuthView({ projectId, projectName, isCreatingRepo }: { projectId: string; projectName: string; isCreatingRepo: boolean }) {
  const oauthUrl = `/api/auth/github?projectId=${encodeURIComponent(projectId)}`

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-2 text-xs font-medium text-gray-500">Conexão › GitHub</div>
        <h2 className="mb-2 text-center text-2xl font-bold text-gray-900">Conectar com GitHub</h2>
        <p className="mb-6 text-center text-sm text-gray-600">
          Vamos criar o repositório <strong>{projectName}</strong> automaticamente após a conexão.
        </p>

        {/* GitHub icon */}
        <div className="mb-6 flex justify-center">
          <svg className="h-20 w-20 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
        </div>

        {/* Permissions card */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">🔐 Permissões Necessárias:</h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-3 border-b border-gray-200 pb-2 text-sm text-gray-600">
              <span className="font-medium text-gray-900">Criar repositório</span>
              <span>— Um repositório privado será criado para seu projeto</span>
            </li>
            <li className="flex items-start gap-3 border-b border-gray-200 pb-2 text-sm text-gray-600">
              <span className="font-medium text-gray-900">Ver seu perfil</span>
              <span>— Precisamos saber seu nome de usuário</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-gray-600">
              <span className="font-medium text-gray-900">Verificar email</span>
              <span>— Para vincular ao repositório</span>
            </li>
          </ul>
        </div>

        {/* CTA button */}
        <a
          href={oauthUrl}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-6 py-3 font-medium text-white transition-colors hover:bg-gray-800"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          Conectar com GitHub
        </a>

        {isCreatingRepo && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            Criando repositório...
          </div>
        )}

        <p className="mt-4 text-center text-xs text-gray-400">
          Você será redirecionado para github.com e voltará automaticamente.
        </p>

        <p className="mt-6 text-center text-xs text-gray-400">
          Você pode revogar o acesso a qualquer momento nas configurações do GitHub.
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tela de loading: criando repositório após OAuth
// ---------------------------------------------------------------------------
function CreatingRepoView() {
  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-2 text-xs font-medium text-gray-500">Conexão › GitHub</div>

        {/* Success badge */}
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <p className="text-sm font-semibold text-green-800">GitHub conectado!</p>
          </div>
          <p className="mt-1 text-sm text-green-700">
            Conectamos seu GitHub com sucesso. Agora estamos criando o repositório...
          </p>
        </div>

        {/* Loading animation */}
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="relative">
            <svg className="h-16 w-16 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Criando seu repositório...</h2>
          <p className="text-center text-sm text-gray-500">
            Isso pode levar alguns segundos. Não feche esta página.
          </p>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tela 02: Repositório criado com sucesso
// ---------------------------------------------------------------------------
function RepoCreatedView({
  projectId,
  githubRepoUrl,
  isConnectingNetlify,
  netlifyError,
  onRetryNetlify,
  copied,
  onCopy,
}: {
  projectId: string
  githubRepoUrl: string
  isConnectingNetlify: boolean
  netlifyError: string | null
  onRetryNetlify: () => void
  copied: boolean
  onCopy: () => void
}) {
  // Derive owner/name from URL for display (https://github.com/owner/name)
  const urlParts = githubRepoUrl.replace('https://github.com/', '').split('/')
  const repoOwner = urlParts[0] || ''
  const repoName = urlParts[1] || ''

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-8">
      <div className="mx-auto max-w-lg space-y-5">
        {/* Success alert */}
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <p className="text-sm font-semibold text-green-800">GitHub Conectado com Sucesso!</p>
          </div>
          <p className="mt-1 text-sm text-green-700">O repositório foi criado e está pronto para receber o código.</p>
        </div>

        {/* Repo info card */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Repositório Criado</h3>

          {/* URL + copy button */}
          <div className="mb-3 flex items-center gap-2">
            <code className="flex-1 truncate rounded-md bg-gray-100 px-3 py-1.5 text-xs text-gray-700">
              {githubRepoUrl}
            </code>
            <button
              onClick={onCopy}
              className="rounded-md border px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>

          <ul className="space-y-1.5 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <span className="w-24 text-xs font-medium text-gray-500">Visibilidade</span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">Privado</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-24 text-xs font-medium text-gray-500">Branch</span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">main</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-24 text-xs font-medium text-gray-500">Owner</span>
              <span className="text-xs text-gray-700">{repoOwner}</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-24 text-xs font-medium text-gray-500">Nome</span>
              <span className="text-xs text-gray-700">{repoName}</span>
            </li>
          </ul>

          {/* Initial files */}
          <div className="mt-3 border-t pt-3">
            <p className="mb-1.5 text-xs font-medium text-gray-500">Arquivos iniciais (auto_init):</p>
            <ul className="space-y-0.5 text-xs text-gray-600">
              <li>📄 README.md</li>
              <li>📄 .gitignore</li>
              <li>📄 LICENSE</li>
            </ul>
          </div>
        </div>

        {/* Next step card */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-5">
          <h3 className="mb-1 text-sm font-semibold text-blue-900">Próximo Passo</h3>
          <p className="text-sm text-blue-800">
            Conecte seu projeto ao Netlify para que o código gerado seja publicado automaticamente.
            O deploy acontecerá de forma contínua a partir do repositório no GitHub.
          </p>
        </div>

        {/* Netlify error alert */}
        {netlifyError && netlifyError !== 'oauth_error' && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2">
              <span className="text-red-600">✗</span>
              <p className="text-sm font-semibold text-red-900">Erro ao conectar Netlify</p>
            </div>
            <p className="mt-1 text-sm text-red-700">{netlifyError}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <a
            href={githubRepoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Ver no GitHub →
          </a>
          {isConnectingNetlify ? (
            <div className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white opacity-60">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Conectando...
            </div>
          ) : netlifyError ? (
            <button
              onClick={onRetryNetlify}
              className="flex-1 rounded-lg bg-teal-600 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-teal-700"
            >
              Tentar Novamente →
            </button>
          ) : (
            <a
              href={`/api/auth/netlify?projectId=${encodeURIComponent(projectId)}`}
              className="flex-1 rounded-lg bg-teal-600 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-teal-700"
            >
              Conectar Netlify →
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tela 03: Tudo conectado — pipeline de deploy
// ---------------------------------------------------------------------------
function ConnectedView({
  projectId: _projectId,
  projectName: _projectName,
  githubRepoUrl,
  productionUrl,
  isAnalyzingComplexity,
  assessmentError,
  assessmentResult,
  iterationPlan,
  assessmentSteps,
  onAnalyzeComplexity,
  isStartingDevelopment,
  startDevelopmentError,
  onStartDevelopment,
}: {
  projectId: string
  projectName: string
  githubRepoUrl: string
  productionUrl: string
  isAnalyzingComplexity: boolean
  assessmentError: string | null
  assessmentResult: AssessmentResult | null
  iterationPlan: IterationPlanItem[]
  assessmentSteps: AssessmentAgentStep[]
  onAnalyzeComplexity: () => void
  isStartingDevelopment: boolean
  startDevelopmentError: string | null
  onStartDevelopment: () => void
}) {
  const complexityLevelLabel =
    assessmentResult?.complexityLevel === 'complex'
      ? 'COMPLEXA'
      : assessmentResult?.complexityLevel === 'medium'
        ? 'MÉDIA'
        : 'SIMPLES'

  const complexityBadgeStyles =
    assessmentResult?.complexityLevel === 'complex'
      ? 'bg-amber-100 text-amber-900'
      : assessmentResult?.complexityLevel === 'medium'
        ? 'bg-blue-100 text-blue-900'
        : 'bg-green-100 text-green-900'

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-8">
      <div className="mx-auto max-w-lg space-y-5">
        {/* Success alert */}
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <p className="text-sm font-semibold text-green-800">Tudo Conectado!</p>
          </div>
          <p className="mt-1 text-sm text-green-700">GitHub e Netlify estão conectados e prontos para receber o código.</p>
        </div>

        {/* Integration status cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-green-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span className="text-sm font-semibold text-gray-900">GitHub</span>
              <span className="ml-auto text-green-600">✓</span>
            </div>
            <p className="mt-1 text-xs text-gray-500">Repositório conectado</p>
          </div>
          <div className="rounded-lg border border-green-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-teal-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.3 6.3L12 1 6.7 6.3 12 11.7 17.3 6.3zM6.3 6.7L1 12l5.3 5.3L11.7 12 6.3 6.7zM17.7 6.7L12.3 12l5.3 5.3L23 12l-5.3-5.3zM6.7 17.7L12 23l5.3-5.3L12 12.3 6.7 17.7z" />
              </svg>
              <span className="text-sm font-semibold text-gray-900">Netlify</span>
              <span className="ml-auto text-green-600">✓</span>
            </div>
            <p className="mt-1 text-xs text-gray-500">Deploy configurado</p>
          </div>
        </div>

        {/* Deploy pipeline card */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Pipeline de Deploy</h3>
          <div className="space-y-3">
            <PipelineStep step={1} title="Geração de Código" description="A IA gera o código do projeto" done={false} />
            <PipelineStep step={2} title="Commit no GitHub" description={`Push para ${githubRepoUrl}`} done={false} />
            <PipelineStep step={3} title="Deploy na Netlify" description={`Publicação em ${productionUrl}`} done={false} />
          </div>
        </div>

        {/* Tip */}
        <div className="rounded-md border-l-4 border-blue-600 bg-blue-50 p-4">
          <p className="text-sm text-gray-900">
            <strong>Tudo pronto!</strong> Ao clicar em iniciar desenvolvimento, vamos analisar a complexidade e montar o plano de iterações.
          </p>
        </div>

        {(isAnalyzingComplexity || assessmentResult || assessmentError) && (
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Análise de Complexidade</h3>

            <div className="space-y-2">
              {assessmentSteps.map((step) => (
                <div key={step.agentName} className="flex items-center gap-2 text-sm text-gray-700">
                  {step.status === 'running' ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  ) : step.status === 'succeeded' ? (
                    <span className="text-green-600">✓</span>
                  ) : step.status === 'failed' ? (
                    <span className="text-red-600">✗</span>
                  ) : (
                    <span className="text-gray-400">○</span>
                  )}
                  <span>{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {assessmentError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {assessmentError}
          </div>
        )}

        {assessmentResult && (
          <>
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Resultado da Análise</h3>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${complexityBadgeStyles}`}>
                  Complexidade {complexityLevelLabel}
                </span>
              </div>

              <p className="mb-3 text-sm text-gray-700">
                Score: <strong>{assessmentResult.complexityScore}/100</strong> · Iterações recomendadas:{' '}
                <strong>{assessmentResult.recommendedIterations}</strong>
              </p>

              {assessmentResult.factors.length > 0 && (
                <ul className="space-y-1.5 text-sm text-gray-600">
                  {assessmentResult.factors.map((factor) => (
                    <li key={factor.name}>
                      <strong>{factor.name}</strong>: {factor.score}/{factor.maxScore} · {factor.detail}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">Plano de Iterações</h3>
              {iterationPlan.length === 0 ? (
                <p className="text-sm text-gray-600">
                  Nenhuma iteração foi retornada pela análise.
                </p>
              ) : (
                <div className="space-y-3">
                  {iterationPlan.map((iteration) => (
                    <div key={iteration.index} className="rounded-md border border-gray-200 p-3">
                      <p className="text-sm font-semibold text-gray-900">
                        Iteração {iteration.index}: {iteration.name}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Tag BDD: {iteration.scope.featureTags.join(', ')}
                      </p>
                      <ul className="mt-2 space-y-1 text-xs text-gray-600">
                        {iteration.scope.goals.slice(0, 3).map((goal) => (
                          <li key={goal}>• {goal}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {startDevelopmentError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {startDevelopmentError}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => window.history.back()}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            ← Voltar
          </button>
          {!assessmentResult ? (
            <button
              onClick={onAnalyzeComplexity}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isAnalyzingComplexity || isStartingDevelopment}
            >
              {isAnalyzingComplexity ? 'Analisando...' : 'Iniciar Desenvolvimento →'}
            </button>
          ) : (
            <button
              onClick={onStartDevelopment}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={iterationPlan.length === 0 || isAnalyzingComplexity || isStartingDevelopment}
            >
              {isStartingDevelopment ? 'Iniciando...' : 'Continuar para Desenvolvimento →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tela de erro: falha na conexão GitHub
// ---------------------------------------------------------------------------
function ErrorView({ projectId, errorMessage, onRetry }: { projectId: string; errorMessage?: string; onRetry: () => void }) {
  const [showDetails, setShowDetails] = useState(false)
  const isRateLimit = errorMessage?.includes('temporariamente') || errorMessage?.includes('rate limit')

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-8">
      <div className="mx-auto max-w-lg space-y-5">
        {/* Error card */}
        <div className="rounded-lg border border-red-200 bg-red-50 p-5">
          <div className="flex items-center gap-2">
            <span className="text-red-600">✗</span>
            <h3 className="text-sm font-semibold text-red-900">Erro na Conexão com GitHub</h3>
          </div>
          {errorMessage ? (
            <p className="mt-1 text-sm text-red-700">{errorMessage}</p>
          ) : (
            <p className="mt-1 text-sm text-red-700">
              Não foi possível completar a autenticação com o GitHub. Isso pode acontecer por:
            </p>
          )}
        </div>

        {/* Causas card — only for generic errors */}
        {!errorMessage && (
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Causas prováveis:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• A autorização foi negada no GitHub</li>
              <li>• A sessão OAuth expirou (mais de 10 minutos)</li>
              <li>• Parâmetros de retorno inválidos</li>
              <li>• Erro interno no servidor</li>
            </ul>
          </div>
        )}

        {/* Como resolver */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Como resolver:</h3>
          {isRateLimit ? (
            <ol className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">1</span>
                Aguarde 5 a 10 minutos
              </li>
              <li className="flex gap-2">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">2</span>
                Clique em &ldquo;Tentar Novamente&rdquo; abaixo
              </li>
            </ol>
          ) : (
            <ol className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">1</span>
                Verifique se sua conta do GitHub está logada no navegador
              </li>
              <li className="flex gap-2">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">2</span>
                Clique no botão &ldquo;Reconectar GitHub&rdquo; abaixo
              </li>
              <li className="flex gap-2">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">3</span>
                No GitHub, autorize todas as permissões solicitadas
              </li>
              <li className="flex gap-2">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">4</span>
                Aguarde o redirecionamento de volta para esta página
              </li>
            </ol>
          )}
        </div>

        {/* Technical details (expandable) */}
        <details className="rounded-lg border border-gray-200 bg-white" open={showDetails}>
          <summary
            className="cursor-pointer rounded-lg p-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
            onClick={(e) => { e.preventDefault(); setShowDetails(!showDetails) }}
          >
            Informações técnicas {showDetails ? '▲' : '▼'}
          </summary>
          {showDetails && (
            <div className="border-t p-4">
              <code className="block whitespace-pre-wrap text-xs text-gray-600">
                {`Projeto: ${projectId}\nErro: ${errorMessage || 'oauth_error'}\nTimestamp: ${new Date().toISOString()}`}
              </code>
            </div>
          )}
        </details>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => window.history.back()}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            ← Voltar
          </button>
          {isRateLimit ? (
            <button
              onClick={onRetry}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Tentar Novamente
            </button>
          ) : (
            <a
              href={`/api/auth/github?projectId=${encodeURIComponent(projectId)}`}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              Reconectar GitHub
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helper: Pipeline step indicator
// ---------------------------------------------------------------------------
function PipelineStep({ step, title, description, done }: { step: number; title: string; description: string; done: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
        done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
      }`}>
        {done ? '✓' : step}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  )
}
