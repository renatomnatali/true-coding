/**
 * TRC-05.2 — ConnectionPhase com ENABLE_CODE_GENERATION=false.
 *
 * Cobre os cenários do connection.feature marcados @trc-05-2:
 * - Checkpoint exibe GitHub como opcional (header "(opcional)" + botão skip).
 * - Pular conexão a partir do checkpoint avança para sub-estado "skipped".
 * - "Pular e conectar depois" também aparece na tela de OAuth.
 * - Desfazer skip volta ao checkpoint.
 * - Sub-estado "github-only" substitui "connected" (sem Netlify).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

vi.mock('@/config/features', () => ({
  ENABLE_CODE_GENERATION: false,
  FEATURES: {
    STRUCTURED_DISCOVERY: false,
    QUICK_REPLIES: true,
    PROGRESS_TRACKING: true,
    AUTONOMOUS_DEVELOPMENT_V1: true,
    PIPELINE_V2: false,
    ENABLE_CODE_GENERATION: false,
  },
}))

import { ConnectionPhase } from './ConnectionPhase'

describe('ConnectionPhase — ENABLE_CODE_GENERATION=false (TRC-05.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn())
  })

  it('shows checkpoint with optional header and "Pular conexão" button', () => {
    render(
      <ConnectionPhase
        projectId="proj-1"
        projectName="Meu Projeto"
        githubRepoUrl={null}
        productionUrl={null}
        hasGitHubToken={false}
        githubJustConnected={false}
      />
    )

    expect(screen.getByText(/Conexão › Preparação \(opcional\)/i)).toBeInTheDocument()
    expect(screen.getByText('Hora de guardar seu código')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pular conexão por enquanto' })).toBeInTheDocument()
    expect(
      screen.getByText('Você pode conectar GitHub depois quando precisar exportar o código.')
    ).toBeInTheDocument()
    // Netlify não aparece em nenhum lugar do checkpoint.
    expect(screen.queryByText(/Netlify/i)).not.toBeInTheDocument()
  })

  it('skipping from checkpoint advances to "skipped" view', () => {
    render(
      <ConnectionPhase
        projectId="proj-1"
        projectName="Meu Projeto"
        githubRepoUrl={null}
        productionUrl={null}
        hasGitHubToken={false}
        githubJustConnected={false}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Pular conexão por enquanto' }))

    expect(screen.getByText('Conexão dispensada por enquanto')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Conectar agora' })).toBeInTheDocument()
    // Conteúdo de OAuth não deve aparecer.
    expect(screen.queryByText('Hora de guardar seu código')).not.toBeInTheDocument()
  })

  it('"Pular e conectar depois" link also appears on OAuth screen', () => {
    render(
      <ConnectionPhase
        projectId="proj-1"
        projectName="Meu Projeto"
        githubRepoUrl={null}
        productionUrl={null}
        hasGitHubToken={false}
        githubJustConnected={false}
      />
    )

    // Avançar do checkpoint para a tela de OAuth.
    fireEvent.click(screen.getByRole('button', { name: /Sim, já tenho/ }))

    const skipLink = screen.getByRole('button', { name: 'Pular e conectar depois' })
    expect(skipLink).toBeInTheDocument()

    fireEvent.click(skipLink)
    expect(screen.getByText('Conexão dispensada por enquanto')).toBeInTheDocument()
  })

  it('"Conectar agora" on skipped view returns to checkpoint', () => {
    render(
      <ConnectionPhase
        projectId="proj-1"
        projectName="Meu Projeto"
        githubRepoUrl={null}
        productionUrl={null}
        hasGitHubToken={false}
        githubJustConnected={false}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Pular conexão por enquanto' }))
    expect(screen.getByText('Conexão dispensada por enquanto')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Conectar agora' }))
    expect(screen.getByText('Hora de guardar seu código')).toBeInTheDocument()
  })

  it('renders "github-only" view (sem Netlify) when GitHub is connected and flag is OFF', () => {
    render(
      <ConnectionPhase
        projectId="proj-1"
        projectName="Meu Projeto"
        githubRepoUrl="https://github.com/acme/meu-projeto"
        productionUrl={null}
        hasGitHubToken
        githubJustConnected={false}
      />
    )

    expect(screen.getByText('GitHub conectado!')).toBeInTheDocument()
    expect(screen.getByText('https://github.com/acme/meu-projeto')).toBeInTheDocument()
    // Não deve renderizar nada de Netlify.
    expect(screen.queryByText(/Conectar Netlify/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Tudo Conectado/i)).not.toBeInTheDocument()
    // Mensagem do "Próximo passo" mistura <strong> + texto, então
    // procuramos pelas duas peças separadas.
    expect(screen.getByText(/Próximo passo:/i)).toBeInTheDocument()
    expect(screen.getByText(/fase de Especificação/i)).toBeInTheDocument()
  })
})
