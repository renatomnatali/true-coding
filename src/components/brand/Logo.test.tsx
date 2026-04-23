import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Logo } from './Logo'

describe('Logo', () => {
  it('renderiza o mark por padrao com aria-label "True Coding"', () => {
    render(<Logo />)
    const svg = screen.getByRole('img', { name: 'True Coding' })
    expect(svg).toBeInTheDocument()
    expect(svg.getAttribute('viewBox')).toBe('0 0 80 80')
  })

  it('usa tamanho default de 24 para mark quando size nao informado', () => {
    render(<Logo />)
    const svg = screen.getByRole('img', { name: 'True Coding' })
    expect(svg.getAttribute('width')).toBe('24')
    expect(svg.getAttribute('height')).toBe('24')
  })

  it('aplica size customizado mantendo proporcao quadrada no mark', () => {
    render(<Logo variant="mark" size={48} />)
    const svg = screen.getByRole('img', { name: 'True Coding' })
    expect(svg.getAttribute('width')).toBe('48')
    expect(svg.getAttribute('height')).toBe('48')
  })

  it('renderiza o wordmark com viewBox 0 0 320 80 e proporcao 4:1', () => {
    render(<Logo variant="wordmark" size={160} />)
    const svg = screen.getByRole('img', { name: 'True Coding' })
    expect(svg.getAttribute('viewBox')).toBe('0 0 320 80')
    expect(svg.getAttribute('width')).toBe('160')
    expect(svg.getAttribute('height')).toBe('40')
  })

  it('aceita aria-label customizado para contextos especificos', () => {
    render(<Logo aria-label="Ir para o dashboard" />)
    expect(
      screen.getByRole('img', { name: 'Ir para o dashboard' })
    ).toBeInTheDocument()
  })

  it('propaga className para o svg', () => {
    render(<Logo className="h-6 w-6" />)
    const svg = screen.getByRole('img', { name: 'True Coding' })
    expect(svg).toHaveClass('h-6', 'w-6')
  })
})
