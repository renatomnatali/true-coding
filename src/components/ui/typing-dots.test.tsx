import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import { TypingDots } from './typing-dots'

describe('TypingDots', () => {
  it('renderiza com role status e aria-label padrão "Carregando"', () => {
    render(<TypingDots />)
    const status = screen.getByRole('status', { name: 'Carregando' })
    expect(status).toBeInTheDocument()
  })

  it('permite customizar aria-label', () => {
    render(<TypingDots aria-label="True Coding está digitando" />)
    expect(
      screen.getByRole('status', { name: 'True Coding está digitando' }),
    ).toBeInTheDocument()
  })

  it('renderiza 3 pontos com animação staggered', () => {
    const { container } = render(<TypingDots />)
    const dots = container.querySelectorAll('span > span')
    expect(dots).toHaveLength(3)
    dots.forEach((dot) => {
      expect(dot).toHaveClass('animate-typing-bounce')
    })
    expect(dots[1]).toHaveClass('[animation-delay:0.2s]')
    expect(dots[2]).toHaveClass('[animation-delay:0.4s]')
  })

  it('propaga className ao container', () => {
    render(<TypingDots className="ml-1" />)
    expect(screen.getByRole('status')).toHaveClass('ml-1')
  })
})
