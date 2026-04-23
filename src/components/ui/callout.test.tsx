import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import { Callout } from './callout'

describe('Callout', () => {
  it('renderiza com role note e variant info por padrão', () => {
    render(<Callout>Sua coleta foi salva.</Callout>)
    const note = screen.getByRole('note')
    expect(note).toHaveTextContent('Sua coleta foi salva.')
    expect(note).toHaveClass(
      'border-brand-primary-light',
      'bg-brand-primary-lighter',
      'text-brand-primary',
    )
  })

  it('aplica classes para cada variant', () => {
    const cases: Array<{
      variant: 'warning' | 'success' | 'error'
      expected: string[]
    }> = [
      {
        variant: 'warning',
        expected: ['border-feedback-warning', 'bg-feedback-warning-light'],
      },
      {
        variant: 'success',
        expected: ['border-feedback-success', 'bg-feedback-success-light'],
      },
      {
        variant: 'error',
        expected: ['border-feedback-error', 'bg-feedback-error-light'],
      },
    ]

    for (const { variant, expected } of cases) {
      const { unmount } = render(<Callout variant={variant}>Mensagem</Callout>)
      const note = screen.getByRole('note')
      expected.forEach((klass) => expect(note).toHaveClass(klass))
      unmount()
    }
  })

  it('renderiza título em negrito e marca ícone como decorativo', () => {
    render(
      <Callout
        title="Atenção"
        icon={<svg data-testid="icon" />}
        variant="warning"
      >
        Verifique os campos obrigatórios.
      </Callout>,
    )
    expect(screen.getByText('Atenção')).toHaveClass('font-semibold')
    expect(
      screen.getByText('Verifique os campos obrigatórios.'),
    ).toBeInTheDocument()
    const iconWrapper = screen.getByTestId('icon').parentElement
    expect(iconWrapper).toHaveAttribute('aria-hidden', 'true')
  })

  it('propaga className adicional', () => {
    render(<Callout className="mt-4">Conteúdo</Callout>)
    expect(screen.getByRole('note')).toHaveClass('mt-4')
  })
})
