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
    expect(screen.queryByText('Gerando Código')).not.toBeInTheDocument()
  })

  it('shows generation animation after resume confirmation', () => {
    render(
      <WorkspacePanel
        projectId="proj-1"
        projectName="Projeto Teste"
        status="GENERATING"
        developmentUiState="monitoring"
      />
    )

    expect(screen.getByText('Gerando Código')).toBeInTheDocument()
  })
})
