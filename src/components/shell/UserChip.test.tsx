import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import { UserChip } from './UserChip'

describe('UserChip', () => {
  it('mostra nome e label de plano derivado do tier em modo expandido', () => {
    render(<UserChip name="Maria Silva" tier="TRIAL" />)
    expect(screen.getByText('Maria Silva')).toBeInTheDocument()
    expect(screen.getByText('Free · Trial')).toBeInTheDocument()
  })

  it('oculta texto secundário no modo compacto (apenas avatar)', () => {
    render(<UserChip name="Maria Silva" tier="PRO" compact />)
    // Avatar mantido (inicial "M")
    expect(screen.getByText('M')).toBeInTheDocument()
    expect(screen.queryByText('Maria Silva')).not.toBeInTheDocument()
    expect(screen.queryByText('Free · Pro')).not.toBeInTheDocument()
  })

  it('deriva a inicial do nome (uppercase) mesmo quando escrito em minúsculas', () => {
    render(<UserChip name="renato natali" tier="START" />)
    expect(screen.getByText('R')).toBeInTheDocument()
  })

  it('faz fallback "?" quando o nome vem vazio', () => {
    render(<UserChip name="   " tier="TRIAL" />)
    expect(screen.getByText('?')).toBeInTheDocument()
  })
})
