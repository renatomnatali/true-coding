import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'

import { Dot } from './dot'

describe('Dot', () => {
  it('renderiza com variant muted por padrão e aria-hidden', () => {
    const { container } = render(<Dot />)
    const dot = container.firstElementChild
    expect(dot).not.toBeNull()
    expect(dot).toHaveClass('bg-ink-quaternary', 'h-1.5', 'w-1.5', 'rounded-full')
    expect(dot).toHaveAttribute('aria-hidden', 'true')
  })

  it('aplica classes corretas para cada variant', () => {
    const cases: Array<{
      variant: 'primary' | 'success' | 'warning' | 'error'
      expected: string
    }> = [
      { variant: 'primary', expected: 'bg-brand-primary' },
      { variant: 'success', expected: 'bg-feedback-success' },
      { variant: 'warning', expected: 'bg-feedback-warning' },
      { variant: 'error', expected: 'bg-feedback-error' },
    ]

    for (const { variant, expected } of cases) {
      const { container } = render(<Dot variant={variant} />)
      expect(container.firstElementChild).toHaveClass(expected)
    }
  })

  it('expõe role img e aria-label quando rotulado', () => {
    const { container } = render(
      <Dot variant="success" aria-label="Status conectado" />,
    )
    const dot = container.firstElementChild
    expect(dot).toHaveAttribute('role', 'img')
    expect(dot).toHaveAttribute('aria-label', 'Status conectado')
    expect(dot).not.toHaveAttribute('aria-hidden')
  })

  it('propaga className adicional', () => {
    const { container } = render(<Dot className="mr-1" />)
    expect(container.firstElementChild).toHaveClass('mr-1')
  })
})
