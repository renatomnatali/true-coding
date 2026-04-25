import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ConnectionPhase } from './ConnectionPhase'

describe('ConnectionPhase - assessment journey', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
    vi.stubGlobal('fetch', mockFetch)
  })

  it('starts complexity analysis and does not start development before explicit confirmation', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        assessment: {
          complexityScore: 62,
          complexityLevel: 'complex',
          factors: [
            {
              name: 'Schema',
              score: 4,
              maxScore: 5,
              detail: 'Schema de dados com múltiplas entidades',
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
              goals: ['Base do app'],
              featureTags: ['@iter-fundacao'],
              risks: [],
            },
            gherkinPath: 'docs/specifications/generated/iter-1-fundacao.feature',
          },
        ],
      }),
    } as Response)

    render(
      <ConnectionPhase
        projectId="proj-1"
        projectName="Projeto 1"
        githubRepoUrl="https://github.com/acme/projeto-1"
        productionUrl="https://projeto-1.netlify.app"
        hasGitHubToken
        githubJustConnected={false}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar Desenvolvimento →' }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/projects/proj-1/development/assessment', {
        method: 'POST',
      })
    })

    expect(
      screen.getByRole('button', { name: 'Continuar para Desenvolvimento →' })
    ).toBeInTheDocument()

    const developmentStartCalls = mockFetch.mock.calls.filter(
      ([url]) => url === '/api/projects/proj-1/development/runs'
    )
    expect(developmentStartCalls).toHaveLength(0)
  })

  it('shows analysis error and does not render continue button', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Falha ao analisar complexidade' }),
    } as Response)

    render(
      <ConnectionPhase
        projectId="proj-1"
        projectName="Projeto 1"
        githubRepoUrl="https://github.com/acme/projeto-1"
        productionUrl="https://projeto-1.netlify.app"
        hasGitHubToken
        githubJustConnected={false}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar Desenvolvimento →' }))

    await waitFor(() => {
      expect(screen.getByText('Falha ao analisar complexidade')).toBeInTheDocument()
    })

    expect(
      screen.queryByRole('button', { name: 'Continuar para Desenvolvimento →' })
    ).not.toBeInTheDocument()
  })

  it('starts development with approved assessment and iteration plan after explicit continue', async () => {
    const approvedAssessment = {
      complexityScore: 56,
      complexityLevel: 'medium',
      factors: [],
      recommendedIterations: 3,
    }

    const approvedIterations = [
      {
        index: 1,
        name: 'Fundacao',
        slug: 'fundacao',
        scope: {
          goals: ['Base do app'],
          featureTags: ['@iter-fundacao'],
          risks: [],
        },
        gherkinPath: 'docs/specifications/generated/iter-1-fundacao.feature',
      },
    ]

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          assessment: approvedAssessment,
          iterations: approvedIterations,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          message: 'Erro ao iniciar o desenvolvimento autônomo.',
        }),
      } as Response)

    render(
      <ConnectionPhase
        projectId="proj-1"
        projectName="Projeto 1"
        githubRepoUrl="https://github.com/acme/projeto-1"
        productionUrl="https://projeto-1.netlify.app"
        hasGitHubToken
        githubJustConnected={false}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar Desenvolvimento →' }))

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Continuar para Desenvolvimento →' })
      ).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Continuar para Desenvolvimento →' }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/projects/proj-1/development/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentConfirmed: true,
          approvedAssessment,
          approvedIterations,
        }),
      })
    })
  })
})

describe('ConnectionPhase - @github @checkpoint', () => {
  it('exibe botoes "Sim, ja tenho" e "Ainda nao tenho" no checkpoint inicial', () => {
    render(
      <ConnectionPhase
        projectId="proj-1"
        projectName="Projeto 1"
        githubRepoUrl={null}
        productionUrl={null}
        hasGitHubToken={false}
        githubJustConnected={false}
      />
    )

    expect(screen.getByText('Sim, já tenho')).toBeInTheDocument()
    expect(screen.getByText('Ainda não tenho')).toBeInTheDocument()
  })

  it('clicar em "Sim, ja tenho" avanca para o passo OAuth (nao exibe mais o checkpoint)', () => {
    render(
      <ConnectionPhase
        projectId="proj-1"
        projectName="Projeto 1"
        githubRepoUrl={null}
        productionUrl={null}
        hasGitHubToken={false}
        githubJustConnected={false}
      />
    )

    fireEvent.click(screen.getByText('Sim, já tenho'))

    // A pergunta inicial do checkpoint nao deve mais estar presente
    expect(
      screen.queryByText('Você já tem uma conta no GitHub?')
    ).not.toBeInTheDocument()
  })

  it('clicar em "Ainda nao tenho" avanca para tutorial de criacao de conta', () => {
    render(
      <ConnectionPhase
        projectId="proj-1"
        projectName="Projeto 1"
        githubRepoUrl={null}
        productionUrl={null}
        hasGitHubToken={false}
        githubJustConnected={false}
      />
    )

    fireEvent.click(screen.getByText('Ainda não tenho'))

    expect(
      screen.queryByText('Você já tem uma conta no GitHub?')
    ).not.toBeInTheDocument()
  })
})

describe('ConnectionPhase - @erro @github (hasOAuthError)', () => {
  it('com hasOAuthError=true exibe card "Erro na Conexão com GitHub" e botao "Reconectar GitHub"', () => {
    render(
      <ConnectionPhase
        projectId="proj-1"
        projectName="Projeto 1"
        githubRepoUrl={null}
        productionUrl={null}
        hasGitHubToken={false}
        githubJustConnected={false}
        hasOAuthError
      />
    )

    expect(screen.getByText('Erro na Conexão com GitHub')).toBeInTheDocument()

    const reconnect = screen.getByText('Reconectar GitHub') as HTMLAnchorElement
    expect(reconnect).toBeInTheDocument()
    expect(reconnect.getAttribute('href')).toBe('/api/auth/github?projectId=proj-1')
  })
})
