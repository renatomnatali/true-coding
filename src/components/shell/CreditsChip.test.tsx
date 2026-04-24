import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import { CreditsChip } from './CreditsChip'

describe('CreditsChip', () => {
  it('mostra o saldo com sufixo "créditos" em modo expandido', () => {
    render(<CreditsChip balance={60} />)
    const label = screen.getByTestId('credits-balance')
    expect(label).toHaveTextContent('60 créditos')
  })

  it('omite o sufixo em modo compacto', () => {
    render(<CreditsChip balance={60} compact />)
    const label = screen.getByTestId('credits-balance')
    expect(label).toHaveTextContent('60')
    expect(label.textContent).not.toMatch(/créditos/)
  })

  it('usa variante warning (fundo âmbar) quando o saldo está entre 7 e 12', () => {
    render(<CreditsChip balance={10} />)
    const label = screen.getByTestId('credits-balance')
    // O Chip wrapper (span pai) carrega as classes de variante.
    expect(label.parentElement).toHaveClass('bg-feedback-warning-light')
  })

  it('usa variante error (fundo vermelho) quando o saldo cai abaixo de 7', () => {
    render(<CreditsChip balance={3} />)
    const label = screen.getByTestId('credits-balance')
    expect(label.parentElement).toHaveClass('bg-feedback-error-light')
  })

  it('usa variante neutral quando o saldo é >= 13', () => {
    render(<CreditsChip balance={13} />)
    const label = screen.getByTestId('credits-balance')
    expect(label.parentElement).toHaveClass('bg-surface-muted')
  })

  it('protege contra saldos negativos exibindo zero', () => {
    render(<CreditsChip balance={-5} />)
    expect(screen.getByTestId('credits-balance')).toHaveTextContent('0 créditos')
  })
})
