import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WorkspacePanel } from './WorkspacePanel'

vi.mock('./ProjectLayout', () => ({
  useProjectLayout: () => ({
    setChatOpen: vi.fn(),
  }),
}))

vi.mock('@/config/features', () => ({
  FEATURES: {
    AUTONOMOUS_DEVELOPMENT_V1: true,
  },
}))

describe('WorkspacePanel - generating journey consistency', () => {
  it('shows paused workspace while awaiting resume confirmation', () => {
    render(
      <WorkspacePanel
        projectId="proj-1"
        projectName="Projeto Teste"
        status="GENERATING"
        developmentUiState="awaiting_confirmation"
      />
    )

    expect(screen.getByText('Operação pendente encontrada')).toBeInTheDocument()
    // New minimal workspace doesn't show "Gerando Código" anymore
    expect(screen.queryByText('Gerando Código')).not.toBeInTheDocument()
  })

  it('shows minimal generation workspace after resume confirmation', () => {
    render(
      <WorkspacePanel
        projectId="proj-1"
        projectName="Projeto Teste"
        status="GENERATING"
        developmentUiState="monitoring"
      />
    )

    // New minimal workspace shows breadcrumb and instruction
    expect(screen.getByText('Geração › Construindo')).toBeInTheDocument()
    expect(screen.getByText('Acompanhe o progresso no painel de pipeline abaixo.')).toBeInTheDocument()
  })
})
