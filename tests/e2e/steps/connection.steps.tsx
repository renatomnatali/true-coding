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
// Sub-estado: github (tela 01 — OAuth CTA)
// ---------------------------------------------------------------------------
describe('ConnectionPhase → sub-estado "github"', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders GitHub OAuth CTA when githubRepoUrl is null', () => {
    render(<ConnectionPhase {...baseProps()} />)

    // "Conectar com GitHub" appears in both heading and button
    expect(screen.getAllByText('Conectar com GitHub').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Permissões solicitadas:')).toBeDefined()
  })

  it('OAuth link points to /api/auth/github with projectId', () => {
    render(<ConnectionPhase {...baseProps()} />)

    // The CTA button is an <a> tag with the OAuth URL
    const links = document.querySelectorAll('a[href*="auth/github"]')
    expect(links.length).toBeGreaterThanOrEqual(1)
    expect(links[0].getAttribute('href')).toBe('/api/auth/github?projectId=proj-test-1')
  })

  it('shows permissions list: repositórios, usuário, email', () => {
    render(<ConnectionPhase {...baseProps()} />)

    expect(screen.getByText('Repositórios')).toBeDefined()
    expect(screen.getByText('Usuário')).toBeDefined()
    expect(screen.getByText('Email')).toBeDefined()
  })

  it('shows tip box', () => {
    render(<ConnectionPhase {...baseProps()} />)

    expect(screen.getByText(/Você será redirecionado para o GitHub/)).toBeDefined()
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

  it('shows "Conectar Vercel" button', () => {
    render(<ConnectionPhase {...repoProps} />)

    expect(screen.getByText('Conectar Vercel →')).toBeDefined()
  })

  it('calls POST /connect with service: vercel on Vercel button click', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ productionUrl: 'https://test-app.vercel.app' }),
    })

    render(<ConnectionPhase {...repoProps} />)

    fireEvent.click(screen.getByText('Conectar Vercel →'))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/projects/proj-test-1/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: 'vercel' }),
      })
    })
  })

  it('transitions to "connected" sub-state after successful Vercel connection', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ productionUrl: 'https://test-app.vercel.app' }),
    })

    render(<ConnectionPhase {...repoProps} />)

    fireEvent.click(screen.getByText('Conectar Vercel →'))

    await waitFor(() => {
      expect(screen.getByText('Tudo Conectado!')).toBeDefined()
    })
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
    productionUrl: 'https://test-app.vercel.app',
  })

  it('renders "Tudo Conectado!" alert', () => {
    render(<ConnectionPhase {...connectedProps} />)

    expect(screen.getByText('Tudo Conectado!')).toBeDefined()
  })

  it('shows GitHub and Vercel cards with check marks', () => {
    render(<ConnectionPhase {...connectedProps} />)

    expect(screen.getByText('GitHub')).toBeDefined()
    expect(screen.getByText('Vercel')).toBeDefined()
    expect(screen.getByText('Repositório conectado')).toBeDefined()
    expect(screen.getByText('Deploy configurado')).toBeDefined()
  })

  it('shows deploy pipeline with 3 steps', () => {
    render(<ConnectionPhase {...connectedProps} />)

    expect(screen.getByText('Geração de Código')).toBeDefined()
    expect(screen.getByText('Commit no GitHub')).toBeDefined()
    expect(screen.getByText('Deploy na Vercel')).toBeDefined()
  })

  it('shows tip about next step', () => {
    render(<ConnectionPhase {...connectedProps} />)

    expect(screen.getByText(/Tudo pronto!/)).toBeDefined()
  })

  it('shows "Analisar Complexidade" button (disabled — phase 4)', () => {
    render(<ConnectionPhase {...connectedProps} />)

    const btn = screen.getByText('Analisar Complexidade →')
    expect(btn).toBeDefined()
    // Button should be disabled since Assessment phase is not implemented
    const button = btn.closest('button')
    expect(button?.disabled).toBe(true)
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
