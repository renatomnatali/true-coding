import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { DevelopmentActivityPanel } from './DevelopmentActivityPanel'

// TRC-05.1: cenário com a pipeline de Code Generation desligada (MVP
// Spec-as-a-Service). O componente deve sumir silenciosamente — sem
// hooks, sem fetches, sem placeholder. Mock isolado em arquivo próprio
// para não conflitar com o mock flag=true do suite principal.
vi.mock('@/config/features', () => ({
  FEATURES: {
    AUTONOMOUS_DEVELOPMENT_V1: true,
    ENABLE_CODE_GENERATION: false,
  },
  ENABLE_CODE_GENERATION: false,
}))

describe('DevelopmentActivityPanel — ENABLE_CODE_GENERATION desligada', () => {
  it('não renderiza nada quando a flag está OFF', () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    const { container } = render(
      <DevelopmentActivityPanel
        projectId="proj-1"
        projectStatus="GENERATING"
        projectName="Projeto teste"
      />
    )

    // Sem markup: o componente desaparece silenciosamente.
    expect(container.innerHTML).toBe('')

    // Garantia extra: nenhum efeito colateral (nenhum fetch disparado).
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
