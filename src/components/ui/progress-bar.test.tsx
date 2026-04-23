import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import { ProgressBar } from './progress-bar'

describe('ProgressBar', () => {
  it('renderiza com role progressbar e valores ARIA', () => {
    render(<ProgressBar value={40} aria-label="Progresso da coleta" />)
    const bar = screen.getByRole('progressbar', { name: 'Progresso da coleta' })
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
    expect(bar).toHaveAttribute('aria-valuenow', '40')
  })

  it('aplica largura proporcional ao value no fill', () => {
    const { container } = render(<ProgressBar value={65} />)
    const fill = container.querySelector('[role="progressbar"] > div')
    expect(fill).not.toBeNull()
    expect(fill).toHaveStyle({ width: '65%' })
    expect(fill).toHaveClass('bg-brand-primary')
  })

  it('aplica variant success quando solicitada', () => {
    const { container } = render(<ProgressBar value={100} variant="success" />)
    const fill = container.querySelector('[role="progressbar"] > div')
    expect(fill).toHaveClass('bg-feedback-success')
  })

  it('clampa valores fora do intervalo [0, 100]', () => {
    const { container, rerender } = render(<ProgressBar value={150} />)
    let bar = screen.getByRole('progressbar')
    let fill = container.querySelector('[role="progressbar"] > div')
    expect(bar).toHaveAttribute('aria-valuenow', '100')
    expect(fill).toHaveStyle({ width: '100%' })

    rerender(<ProgressBar value={-25} />)
    bar = screen.getByRole('progressbar')
    fill = container.querySelector('[role="progressbar"] > div')
    expect(bar).toHaveAttribute('aria-valuenow', '0')
    expect(fill).toHaveStyle({ width: '0%' })
  })

  it('trata NaN como 0% (defensivo contra valores invalidos)', () => {
    const { container } = render(<ProgressBar value={Number.NaN} />)
    const bar = screen.getByRole('progressbar')
    const fill = container.querySelector('[role="progressbar"] > div')
    expect(bar).toHaveAttribute('aria-valuenow', '0')
    expect(fill).toHaveStyle({ width: '0%' })
  })

  it('aplica aria-label default "Progresso" quando omitido', () => {
    render(<ProgressBar value={50} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-label',
      'Progresso',
    )
  })

  it('propaga className adicional ao track', () => {
    render(<ProgressBar value={20} className="mt-4" />)
    expect(screen.getByRole('progressbar')).toHaveClass('mt-4')
  })
})
