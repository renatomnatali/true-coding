/**
 * connection.steps.tsx — TDD step definitions for connection.feature
 *
 * These are unit-level tests that verify the ConnectionPhase component
 * renders the correct sub-state and the /connect endpoint behaves correctly.
 *
 * Sub-states under test:
 *   github        → githubRepoUrl === null
 *   repo-created  → githubRepoUrl !== null && productionUrl === null
 *   connected     → productionUrl !== null
 *   error         → hasOAuthError === true
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ConnectionPhase } from '@/components/project/phases/ConnectionPhase'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// ---------------------------------------------------------------------------
// Helper: base props
// ---------------------------------------------------------------------------
function baseProps(overrides: Record<string, unknown> = {}) {
  return {
    projectId: 'proj-test-1',
    projectName: 'Test App',
    githubRepoUrl: null as string | null,
    productionUrl: null as string | null,
    hasGitHubToken: true,
    githubJustConnected: false,
    hasOAuthError: false,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Sub-estado: github — Checkpoint (triagem pré-OAuth)
// ---------------------------------------------------------------------------
describe('ConnectionPhase → checkpoint (triagem)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders checkpoint when githubRepoUrl is null (estado default)', () => {
    render(<ConnectionPhase {...baseProps()} />)

    expect(screen.getByText('Hora de guardar seu código')).toBeDefined()
  })

  it('shows "Você já tem uma conta no GitHub?"', () => {
    render(<ConnectionPhase {...baseProps()} />)

    expect(screen.getByText('Você já tem uma conta no GitHub?')).toBeDefined()
  })

  it('shows buttons "Sim, já tenho" and "Ainda não tenho"', () => {
    render(<ConnectionPhase {...baseProps()} />)

    expect(screen.getByText('Sim, já tenho')).toBeDefined()
    expect(screen.getByText('Ainda não tenho')).toBeDefined()
  })

  it('shows expandable "O que é GitHub?"', () => {
    render(<ConnectionPhase {...baseProps()} />)

    expect(screen.getByText('O que é GitHub?')).toBeDefined()
  })

  it('clicking "Sim, já tenho" shows OAuth view', () => {
    render(<ConnectionPhase {...baseProps()} />)

    fireEvent.click(screen.getByText('Sim, já tenho'))

    // "Conectar com GitHub" appears as both heading and button text
    expect(screen.getAllByText('Conectar com GitHub').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/Permissões Necessárias/)).toBeDefined()
  })

  it('clicking "Ainda não tenho" shows create account view', () => {
    render(<ConnectionPhase {...baseProps()} />)

    fireEvent.click(screen.getByText('Ainda não tenho'))

    expect(screen.getByText('Criar sua conta no GitHub')).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Sub-estado: github — Criar conta GitHub
// ---------------------------------------------------------------------------
describe('ConnectionPhase → criar conta GitHub', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function renderAndGoToCreateAccount() {
    render(<ConnectionPhase {...baseProps()} />)
    fireEvent.click(screen.getByText('Ainda não tenho'))
  }

  it('shows "Criar sua conta no GitHub" title', () => {
    renderAndGoToCreateAccount()

    expect(screen.getByText('Criar sua conta no GitHub')).toBeDefined()
  })

  it('shows 3 numbered steps', () => {
    renderAndGoToCreateAccount()

    expect(screen.getByText(/Acesse github.com e clique em/)).toBeDefined()
    expect(screen.getByText(/Preencha email, senha e nome de usuário/)).toBeDefined()
    expect(screen.getByText(/Confirme seu email e volte aqui/)).toBeDefined()
  })

  it('"Abrir GitHub" link points to github.com/signup with target _blank', () => {
    renderAndGoToCreateAccount()

    const links = document.querySelectorAll('a')
    const ghLink = Array.from(links).find((a) => a.textContent?.includes('Abrir GitHub'))
    expect(ghLink).toBeDefined()
    expect(ghLink?.getAttribute('href')).toBe('https://github.com/signup')
    expect(ghLink?.getAttribute('target')).toBe('_blank')
  })

  it('clicking "Já criei minha conta, continuar" shows OAuth view', () => {
    renderAndGoToCreateAccount()

    fireEvent.click(screen.getByText('Já criei minha conta, continuar'))

    // "Conectar com GitHub" appears as both heading and button text
    expect(screen.getAllByText('Conectar com GitHub').length).toBeGreaterThanOrEqual(1)
  })
})

// ---------------------------------------------------------------------------
// Sub-estado: github — OAuth CTA (após checkpoint)
// ---------------------------------------------------------------------------
describe('ConnectionPhase → tela OAuth (após checkpoint)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function renderAndGoToOAuth() {
    render(<ConnectionPhase {...baseProps()} />)
    fireEvent.click(screen.getByText('Sim, já tenho'))
  }

  it('OAuth link points to /api/auth/github with projectId', () => {
    renderAndGoToOAuth()

    const links = document.querySelectorAll('a[href*="auth/github"]')
    expect(links.length).toBeGreaterThanOrEqual(1)
    expect(links[0].getAttribute('href')).toBe('/api/auth/github?projectId=proj-test-1')
  })

  it('shows permissions list', () => {
    renderAndGoToOAuth()

    expect(screen.getByText('Criar repositório')).toBeDefined()
    expect(screen.getByText('Ver seu perfil')).toBeDefined()
    expect(screen.getByText('Verificar email')).toBeDefined()
  })

  it('shows redirect note', () => {
    renderAndGoToOAuth()

    expect(screen.getByText(/Você será redirecionado para github.com/)).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Sub-estado: repo-created (tela 02)
// ---------------------------------------------------------------------------
describe('ConnectionPhase → sub-estado "repo-created"', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const repoProps = baseProps({
    githubRepoUrl: 'https://github.com/testuser/test-app',
  })

  it('renders success alert when githubRepoUrl is set', () => {
    render(<ConnectionPhase {...repoProps} />)

    expect(screen.getByText('GitHub Conectado com Sucesso!')).toBeDefined()
  })

  it('shows repository URL', () => {
    render(<ConnectionPhase {...repoProps} />)

    expect(screen.getByText('https://github.com/testuser/test-app')).toBeDefined()
  })

  it('shows visibility as Privado', () => {
    render(<ConnectionPhase {...repoProps} />)

    expect(screen.getByText('Privado')).toBeDefined()
  })

  it('shows branch as main', () => {
    render(<ConnectionPhase {...repoProps} />)

    expect(screen.getByText('main')).toBeDefined()
  })

  it('shows "Ver no GitHub" link pointing to repo URL', () => {
    render(<ConnectionPhase {...repoProps} />)

    const links = document.querySelectorAll('a')
    const ghLink = Array.from(links).find((a) => a.textContent?.includes('Ver no GitHub'))
    expect(ghLink).toBeDefined()
    expect(ghLink?.getAttribute('href')).toBe('https://github.com/testuser/test-app')
  })

  it('shows "Conectar Netlify" link pointing to Netlify OAuth', () => {
    render(<ConnectionPhase {...repoProps} />)

    expect(screen.getByText('Conectar Netlify →')).toBeDefined()

    const links = document.querySelectorAll('a[href*="auth/netlify"]')
    expect(links.length).toBeGreaterThanOrEqual(1)
    expect(links[0].getAttribute('href')).toBe('/api/auth/netlify?projectId=proj-test-1')
  })
})

// ---------------------------------------------------------------------------
// Sub-estado: connected (tela 03)
// ---------------------------------------------------------------------------
describe('ConnectionPhase → sub-estado "connected"', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const connectedProps = baseProps({
    githubRepoUrl: 'https://github.com/testuser/test-app',
    productionUrl: 'https://test-app.netlify.app',
  })

  it('renders "Tudo Conectado!" alert', () => {
    render(<ConnectionPhase {...connectedProps} />)

    expect(screen.getByText('Tudo Conectado!')).toBeDefined()
  })

  it('shows GitHub and Netlify cards with check marks', () => {
    render(<ConnectionPhase {...connectedProps} />)

    expect(screen.getByText('GitHub')).toBeDefined()
    expect(screen.getByText('Netlify')).toBeDefined()
    expect(screen.getByText('Repositório conectado')).toBeDefined()
    expect(screen.getByText('Deploy configurado')).toBeDefined()
  })

  it('shows deploy pipeline with 3 steps', () => {
    render(<ConnectionPhase {...connectedProps} />)

    expect(screen.getByText('Geração de Código')).toBeDefined()
    expect(screen.getByText('Commit no GitHub')).toBeDefined()
    expect(screen.getByText('Deploy na Netlify')).toBeDefined()
  })

  it('shows tip about next step', () => {
    render(<ConnectionPhase {...connectedProps} />)

    expect(screen.getByText(/Tudo pronto!/)).toBeDefined()
  })

  it('shows "Iniciar Desenvolvimento" button enabled', () => {
    render(<ConnectionPhase {...connectedProps} />)

    const button = screen.getByRole('button', { name: 'Iniciar Desenvolvimento →' })
    expect(button).toBeDefined()
    expect(button).not.toBeDisabled()
  })

  it('clicking "Iniciar Desenvolvimento" calls assessment endpoint and shows error when it fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Falha ao analisar complexidade' }),
    } as Response)

    render(<ConnectionPhase {...connectedProps} />)

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar Desenvolvimento →' }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/projects/proj-test-1/development/assessment')
    expect(init.method).toBe('POST')
    expect(screen.getByText('Falha ao analisar complexidade')).toBeDefined()
  })

  it('shows assessment result and enables "Continuar para Desenvolvimento" after analysis', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          assessment: {
            complexityScore: 62,
            complexityLevel: 'complex',
            factors: [
              {
                name: 'API',
                score: 4,
                maxScore: 5,
                detail: '8 endpoints',
              },
            ],
            recommendedIterations: 4,
          },
          iterations: [
            {
              index: 1,
              name: 'Fundacao',
              slug: 'fundacao',
              scope: {
                goals: ['Base do projeto'],
                featureTags: ['@fundacao'],
                risks: ['Acoplamento inicial'],
              },
              gherkinPath: 'docs/specifications/generated/iter-1-fundacao.feature',
            },
          ],
        }),
      } as Response)

    render(<ConnectionPhase {...connectedProps} />)

    expect(screen.queryByRole('button', { name: 'Continuar para Desenvolvimento →' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar Desenvolvimento →' }))

    await waitFor(() => {
      expect(screen.getByText('Resultado da Análise')).toBeDefined()
    })

    expect(screen.getByText(/Iterações recomendadas:/)).toBeDefined()
    expect(screen.getByText(/Iteração 1: Fundacao/)).toBeDefined()
    expect(screen.getByRole('button', { name: 'Continuar para Desenvolvimento →' })).not.toBeDisabled()
  })

  it('starts autonomous run only after user confirms continuation', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          assessment: {
            complexityScore: 40,
            complexityLevel: 'medium',
            factors: [],
            recommendedIterations: 3,
          },
          iterations: [
            {
              index: 1,
              name: 'Fundacao',
              slug: 'fundacao',
              scope: { goals: ['Base'], featureTags: ['@fundacao'], risks: [] },
              gherkinPath: 'docs/specifications/generated/iter-1-fundacao.feature',
            },
          ],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Falha ao iniciar run' }),
      } as Response)

    render(<ConnectionPhase {...connectedProps} />)

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar Desenvolvimento →' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Continuar para Desenvolvimento →' })).not.toBeDisabled()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Continuar para Desenvolvimento →' }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    const [url, init] = mockFetch.mock.calls[1] as [string, RequestInit]
    expect(url).toBe('/api/projects/proj-test-1/development/runs')
    expect(init.method).toBe('POST')
    const payload = JSON.parse(String(init.body))
    expect(payload.assessmentConfirmed).toBe(true)
    expect(payload.approvedAssessment.complexityScore).toBe(40)
    expect(payload.approvedAssessment.recommendedIterations).toBe(3)
    expect(Array.isArray(payload.approvedIterations)).toBe(true)
    expect(payload.approvedIterations[0].name).toBe('Fundacao')
    expect(screen.getByText('Falha ao iniciar run')).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Estado de erro: OAuth falhou
// ---------------------------------------------------------------------------
describe('ConnectionPhase → estado de erro', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const errorProps = baseProps({
    hasOAuthError: true,
  })

  it('renders error card when hasOAuthError is true', () => {
    render(<ConnectionPhase {...errorProps} />)

    expect(screen.getByText('Erro na Conexão com GitHub')).toBeDefined()
  })

  it('shows list of probable causes', () => {
    render(<ConnectionPhase {...errorProps} />)

    expect(screen.getByText(/autorização foi negada/)).toBeDefined()
    expect(screen.getByText(/sessão OAuth expirou/)).toBeDefined()
  })

  it('shows numbered resolution steps', () => {
    render(<ConnectionPhase {...errorProps} />)

    expect(screen.getByText(/Verifique se sua conta do GitHub/)).toBeDefined()
    // "Reconectar GitHub" appears in both the step text and the button — verify at least one exists
    expect(screen.getAllByText(/Reconectar GitHub/).length).toBeGreaterThanOrEqual(1)
  })

  it('"Reconectar GitHub" links back to OAuth with projectId', () => {
    render(<ConnectionPhase {...errorProps} />)

    const links = document.querySelectorAll('a')
    const reconnectLink = Array.from(links).find((a) => a.textContent?.includes('Reconectar GitHub'))
    expect(reconnectLink).toBeDefined()
    expect(reconnectLink?.getAttribute('href')).toBe('/api/auth/github?projectId=proj-test-1')
  })
})

// ---------------------------------------------------------------------------
// Loading state: githubJustConnected → mostra "Criando seu repositório..."
// ---------------------------------------------------------------------------
describe('ConnectionPhase → loading durante criação do repositório', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows "Criando seu repositório..." when githubJustConnected and no repo', () => {
    // Never resolve the fetch so we stay in loading state
    mockFetch.mockReturnValue(new Promise(() => {}))

    render(<ConnectionPhase {...baseProps({ githubJustConnected: true })} />)

    expect(screen.getByText('Criando seu repositório...')).toBeDefined()
  })

  it('shows success message about GitHub connection', () => {
    mockFetch.mockReturnValue(new Promise(() => {}))

    render(<ConnectionPhase {...baseProps({ githubJustConnected: true })} />)

    expect(screen.getByText(/Conectamos seu GitHub com sucesso/)).toBeDefined()
  })

  it('does NOT show checkpoint "Você já tem uma conta no GitHub?"', () => {
    mockFetch.mockReturnValue(new Promise(() => {}))

    render(<ConnectionPhase {...baseProps({ githubJustConnected: true })} />)

    expect(screen.queryByText('Você já tem uma conta no GitHub?')).toBeNull()
  })

  it('shows a spinner (animated element)', () => {
    mockFetch.mockReturnValue(new Promise(() => {}))

    render(<ConnectionPhase {...baseProps({ githubJustConnected: true })} />)

    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeDefined()
    expect(spinner).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Auto-trigger: githubJustConnected → cria repo
// ---------------------------------------------------------------------------
describe('ConnectionPhase → auto-trigger repo creation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls POST /connect github when githubJustConnected is true and no repo', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        githubRepoUrl: 'https://github.com/testuser/test-app',
        githubRepoOwner: 'testuser',
        githubRepoName: 'test-app',
      }),
    })

    render(<ConnectionPhase {...baseProps({ githubJustConnected: true })} />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/projects/proj-test-1/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: 'github' }),
      })
    })
  })

  it('transitions to repo-created after successful repo creation', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        githubRepoUrl: 'https://github.com/testuser/test-app',
        githubRepoOwner: 'testuser',
        githubRepoName: 'test-app',
      }),
    })

    render(<ConnectionPhase {...baseProps({ githubJustConnected: true })} />)

    await waitFor(() => {
      expect(screen.getByText('GitHub Conectado com Sucesso!')).toBeDefined()
    })
  })

  it('does NOT call /connect when githubRepoUrl already exists', async () => {
    render(<ConnectionPhase {...baseProps({ githubJustConnected: true, githubRepoUrl: 'https://github.com/u/r' })} />)

    await waitFor(() => {
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })
})

// ---------------------------------------------------------------------------
// Auto-trigger: netlifyJustConnected → cria site Netlify
// ---------------------------------------------------------------------------
describe('ConnectionPhase → auto-trigger Netlify site creation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const netlifyTriggerProps = baseProps({
    githubRepoUrl: 'https://github.com/testuser/test-app',
    netlifyJustConnected: true,
  })

  it('calls POST /connect netlify when netlifyJustConnected is true', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ productionUrl: 'https://test-app.netlify.app', netlifySiteId: 'site_123' }),
    })

    render(<ConnectionPhase {...netlifyTriggerProps} />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/projects/proj-test-1/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: 'netlify' }),
      })
    })
  })

  it('transitions to "connected" after successful Netlify site creation', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ productionUrl: 'https://test-app.netlify.app', netlifySiteId: 'site_123' }),
    })

    render(<ConnectionPhase {...netlifyTriggerProps} />)

    await waitFor(() => {
      expect(screen.getByText('Tudo Conectado!')).toBeDefined()
    })
  })

  it('does NOT call /connect when productionUrl already exists', async () => {
    render(<ConnectionPhase {...baseProps({
      githubRepoUrl: 'https://github.com/testuser/test-app',
      productionUrl: 'https://test-app.netlify.app',
      netlifyJustConnected: true,
    })} />)

    await waitFor(() => {
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })
})

// ---------------------------------------------------------------------------
// Erro na criação do repositório — COMPORTAMENTO
// ---------------------------------------------------------------------------
describe('ConnectionPhase → erro na criação do repositório', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * @erro @comportamento
   * Cenário: API retorna erro durante criação do repo
   */
  it('Exibe ErrorView quando API retorna não-OK durante criação do repo', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: 'Failed to create repository' }),
    })

    render(<ConnectionPhase {...baseProps({ githubJustConnected: true })} />)

    // Aguarda a chamada de API e o erro
    await waitFor(() => {
      expect(screen.getByText('Erro na Conexão com GitHub')).toBeDefined()
    })

    // Verifica que a mensagem de erro específica é exibida
    expect(screen.getByText('Failed to create repository')).toBeDefined()
    // "Reconectar GitHub" no botão
    const reconnectElements = screen.getAllByText(/Reconectar GitHub/)
    expect(reconnectElements.length).toBeGreaterThanOrEqual(1)
  })

  /**
   * @erro @comportamento
   * Cenário: Erro de rede durante criação do repo
   */
  it('Exibe ErrorView quando ocorre erro de rede durante criação do repo', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    render(<ConnectionPhase {...baseProps({ githubJustConnected: true })} />)

    // Aguarda a rejeição e renderização do erro
    await waitFor(() => {
      expect(screen.getByText('Erro na Conexão com GitHub')).toBeDefined()
    })
  })

  /**
   * @erro @comportamento
   * Cenário: Link "Reconectar GitHub" aparece após falha
   */
  it('"Reconectar GitHub" aparece após falha na criação do repo', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: 'Repository creation failed' }),
    })

    render(<ConnectionPhase {...baseProps({ githubJustConnected: true })} />)

    await waitFor(() => {
      expect(screen.getByText('Erro na Conexão com GitHub')).toBeDefined()
    })

    // Verifica que o link "Reconectar GitHub" está presente
    const links = document.querySelectorAll('a')
    const reconnectLink = Array.from(links).find((a) => a.textContent?.includes('Reconectar GitHub'))
    expect(reconnectLink).toBeDefined()
    expect(reconnectLink?.getAttribute('href')).toBe('/api/auth/github?projectId=proj-test-1')
  })

  /**
   * @erro @rate-limit
   * Cenário: Rate limit do GitHub mostra botão "Tentar Novamente"
   */
  it('Exibe "Tentar Novamente" quando erro é rate limit', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'RATE_LIMITED', message: 'O GitHub bloqueou temporariamente a criação de repositórios. Aguarde alguns minutos e tente novamente.' }),
    })

    render(<ConnectionPhase {...baseProps({ githubJustConnected: true })} />)

    await waitFor(() => {
      expect(screen.getByText('Erro na Conexão com GitHub')).toBeDefined()
    })

    // Mostra mensagem de rate limit
    expect(screen.getByText(/bloqueou temporariamente/)).toBeDefined()
    // Mostra botão "Tentar Novamente" em vez de "Reconectar GitHub"
    expect(screen.getByText('Tentar Novamente')).toBeDefined()
    // Mostra instruções de aguardar
    expect(screen.getByText(/Aguarde 5 a 10 minutos/)).toBeDefined()
  })
})
