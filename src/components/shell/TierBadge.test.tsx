import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import { TierBadge, tierLabel } from './TierBadge'

describe('TierBadge', () => {
  it('exibe o label completo para cada tier em modo expandido', () => {
    const { rerender } = render(<TierBadge tier="TRIAL" />)
    expect(screen.getByText('Trial')).toBeInTheDocument()

    rerender(<TierBadge tier="START" />)
    expect(screen.getByText('Start')).toBeInTheDocument()

    rerender(<TierBadge tier="PRO" />)
    expect(screen.getByText('Pro')).toBeInTheDocument()

    rerender(<TierBadge tier="SCALE" />)
    expect(screen.getByText('Scale')).toBeInTheDocument()
  })

  it('exibe apenas a inicial no modo compacto', () => {
    render(<TierBadge tier="PRO" compact />)
    expect(screen.getByText('P')).toBeInTheDocument()
    expect(screen.queryByText('Pro')).not.toBeInTheDocument()
  })

  it('inclui aria-label com o nome do plano por acessibilidade', () => {
    render(<TierBadge tier="START" />)
    expect(screen.getByLabelText('Plano Start')).toBeInTheDocument()
  })

  it('tierLabel retorna o label humano de cada tier', () => {
    expect(tierLabel('TRIAL')).toBe('Trial')
    expect(tierLabel('SCALE')).toBe('Scale')
  })
})
