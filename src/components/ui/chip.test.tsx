import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import { Chip } from './chip'

describe('Chip', () => {
  it('renderiza com variant neutral por padrão', () => {
    render(<Chip>Rascunho</Chip>)
    const chip = screen.getByText('Rascunho')
    expect(chip).toHaveClass(
      'bg-surface-muted',
      'text-ink-secondary',
      'rounded-full',
    )
  })

  it('aplica classes corretas para cada variant', () => {
    const { rerender } = render(<Chip variant="primary">Primária</Chip>)
    expect(screen.getByText('Primária')).toHaveClass(
      'bg-brand-primary-light',
      'text-brand-primary',
    )

    rerender(<Chip variant="success">Sucesso</Chip>)
    expect(screen.getByText('Sucesso')).toHaveClass(
      'bg-feedback-success-light',
      'text-feedback-success-hover',
    )

    rerender(<Chip variant="warning">Alerta</Chip>)
    expect(screen.getByText('Alerta')).toHaveClass(
      'bg-feedback-warning-light',
      'text-feedback-warning-hover',
    )

    rerender(<Chip variant="error">Erro</Chip>)
    expect(screen.getByText('Erro')).toHaveClass(
      'bg-feedback-error-light',
      'text-[#b91c1c]',
    )
  })

  it('propaga className adicional', () => {
    render(<Chip className="ml-2">Rótulo</Chip>)
    expect(screen.getByText('Rótulo')).toHaveClass('ml-2')
  })
})
