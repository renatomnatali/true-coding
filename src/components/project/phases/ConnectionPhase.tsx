'use client'

import { useState, useEffect, useCallback } from 'react'

// ---------------------------------------------------------------------------
// Sub-state derivation
// ---------------------------------------------------------------------------
// githubRepoUrl === null                          → "github"        (tela 01)
// githubRepoUrl !== null && productionUrl === null → "repo-created"  (tela 02)
// productionUrl !== null                          → "connected"     (tela 03)
// ---------------------------------------------------------------------------

type ConnectionSubState = 'github' | 'repo-created' | 'connected'

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
  /** Set to true when URL contains ?error=github_auth_failed */
  hasOAuthError?: boolean
}

export function ConnectionPhase({
  projectId,
  projectName,
  githubRepoUrl: initialRepoUrl,
  productionUrl: initialProductionUrl,
  hasGitHubToken: _hasGitHubToken,
  githubJustConnected,
  hasOAuthError = false,
}: ConnectionPhaseProps) {
  const [githubRepoUrl, setGithubRepoUrl] = useState(initialRepoUrl)
  const [productionUrl, setProductionUrl] = useState(initialProductionUrl)
  const [error, setError] = useState<string | null>(hasOAuthError ? 'github_auth_failed' : null)
  const [isCreatingRepo, setIsCreatingRepo] = useState(false)
  const [isConnectingVercel, setIsConnectingVercel] = useState(false)
  const [copied, setCopied] = useState(false)

  const subState = deriveSubState(githubRepoUrl, productionUrl)

  // Auto-trigger repo creation when returning from OAuth
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
  }, [projectId, githubRepoUrl, isCreatingRepo])

  useEffect(() => {
    if (githubJustConnected && !githubRepoUrl) {
      createRepo()
    }
  }, [githubJustConnected, githubRepoUrl, createRepo])

  // Error state — shown when ?error=github_auth_failed
  if (error && !githubRepoUrl) {
    return <ErrorView projectId={projectId} onRetry={createRepo} />
  }

  switch (subState) {
    case 'github':
      return <GitHubOAuthView projectId={projectId} isCreatingRepo={isCreatingRepo} />
    case 'repo-created':
      return (
        <RepoCreatedView
          githubRepoUrl={githubRepoUrl!}
          isConnectingVercel={isConnectingVercel}
          copied={copied}
          onCopy={() => {
            navigator.clipboard.writeText(githubRepoUrl!)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }}
          onConnectVercel={async () => {
            setIsConnectingVercel(true)
            setError(null)
            try {
              const res = await fetch(`/api/projects/${projectId}/connect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ service: 'vercel' }),
              })
              if (!res.ok) {
                const data = await res.json()
                setError(data.message || 'Erro ao conectar Vercel')
                return
              }
              const data = await res.json()
              setProductionUrl(data.productionUrl)
            } catch {
              setError('Erro de rede ao conectar Vercel. Tente novamente.')
            } finally {
              setIsConnectingVercel(false)
            }
          }}
        />
      )
    case 'connected':
      return <ConnectedView projectName={projectName} githubRepoUrl={githubRepoUrl!} productionUrl={productionUrl!} />
  }
}

// ---------------------------------------------------------------------------
// Tela 01: GitHub OAuth CTA
// ---------------------------------------------------------------------------
function GitHubOAuthView({ projectId, isCreatingRepo }: { projectId: string; isCreatingRepo: boolean }) {
  const oauthUrl = `/api/auth/github?projectId=${encodeURIComponent(projectId)}`

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-8">
      <div className="mx-auto max-w-lg">
        {/* GitHub icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-900 to-gray-700">
            <svg className="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </div>
        </div>

        {/* Title + description */}
        <h2 className="mb-2 text-center text-2xl font-bold text-gray-900">Conectar com GitHub</h2>
        <p className="mb-6 text-center text-sm text-gray-600">
          Conecte sua conta do GitHub para criar um repositório e armazenar o código gerado pelo True Coding.
        </p>

        {/* Permissions card */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Permissões solicitadas:</h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-700">✓</span>
              <div>
                <span className="text-sm font-medium text-gray-900">Repositórios</span>
                <p className="text-xs text-gray-500">Criar e gerenciar repositórios em seu nome</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-700">✓</span>
              <div>
                <span className="text-sm font-medium text-gray-900">Usuário</span>
                <p className="text-xs text-gray-500">Ler informações básicas do perfil</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-700">✓</span>
              <div>
                <span className="text-sm font-medium text-gray-900">Email</span>
                <p className="text-xs text-gray-500">Acessar endereços de email verificados</p>
              </div>
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

        {/* Tip box */}
        <div className="mt-6 rounded-md border-l-4 border-blue-600 bg-blue-50 p-4">
          <p className="text-sm text-gray-900">
            <strong>Dica:</strong> Você será redirecionado para o GitHub para autorizar o acesso.
            Após autorizar, voltará automaticamente para esta página.
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
  githubRepoUrl,
  isConnectingVercel,
  copied,
  onCopy,
  onConnectVercel,
}: {
  githubRepoUrl: string
  isConnectingVercel: boolean
  copied: boolean
  onCopy: () => void
  onConnectVercel: () => void
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
            Conecte seu projeto ao Vercel para que o código gerado seja publicado automaticamente.
            O deploy acontecerá de forma contínua a partir do repositório no GitHub.
          </p>
        </div>

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
          <button
            onClick={onConnectVercel}
            disabled={isConnectingVercel}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isConnectingVercel ? 'Conectando...' : 'Conectar Vercel →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tela 03: Tudo conectado — pipeline de deploy
// ---------------------------------------------------------------------------
function ConnectedView({
  projectName: _projectName,
  githubRepoUrl,
  productionUrl,
}: {
  projectName: string
  githubRepoUrl: string
  productionUrl: string
}) {
  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-8">
      <div className="mx-auto max-w-lg space-y-5">
        {/* Success alert */}
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <p className="text-sm font-semibold text-green-800">Tudo Conectado!</p>
          </div>
          <p className="mt-1 text-sm text-green-700">GitHub e Vercel estão conectados e prontos para receber o código.</p>
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
              <svg className="h-5 w-5 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 22.525H0l12-21.05 12 21.05z" />
              </svg>
              <span className="text-sm font-semibold text-gray-900">Vercel</span>
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
            <PipelineStep step={3} title="Deploy na Vercel" description={`Publicação em ${productionUrl}`} done={false} />
          </div>
        </div>

        {/* Tip */}
        <div className="rounded-md border-l-4 border-blue-600 bg-blue-50 p-4">
          <p className="text-sm text-gray-900">
            <strong>Tudo pronto!</strong> O próximo passo é a análise de complexidade e geração do código do seu projeto.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => window.history.back()}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            ← Voltar
          </button>
          <button
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            disabled
          >
            Analisar Complexidade →
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tela de erro: falha na conexão GitHub
// ---------------------------------------------------------------------------
function ErrorView({ projectId, onRetry: _onRetry }: { projectId: string; onRetry: () => void }) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-8">
      <div className="mx-auto max-w-lg space-y-5">
        {/* Error card */}
        <div className="rounded-lg border border-red-200 bg-red-50 p-5">
          <div className="flex items-center gap-2">
            <span className="text-red-600">✗</span>
            <h3 className="text-sm font-semibold text-red-900">Erro na Conexão com GitHub</h3>
          </div>
          <p className="mt-1 text-sm text-red-700">
            Não foi possível completar a autenticação com o GitHub. Isso pode acontecer por:
          </p>
        </div>

        {/* Causas card */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Causas prováveis:</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• A autorização foi negada no GitHub</li>
            <li>• A sessão OAuth expirou (mais de 10 minutos)</li>
            <li>• Parâmetros de retorno inválidos</li>
            <li>• Erro interno no servidor</li>
          </ul>
        </div>

        {/* Como resolver */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Como resolver:</h3>
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
              Aguarde a redirecionamento de volta para esta página
            </li>
          </ol>
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
                {`Projeto: ${projectId}\nEstado: error=github_auth_failed\nTimestamp: ${new Date().toISOString()}`}
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
          <a
            href={`/api/auth/github?projectId=${encodeURIComponent(projectId)}`}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            Reconectar GitHub
          </a>
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
