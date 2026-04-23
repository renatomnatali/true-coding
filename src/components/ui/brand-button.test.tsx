import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { BrandButton } from './brand-button'

describe('BrandButton', () => {
  it('renderiza com variant primary e size default por padrão', () => {
    render(<BrandButton>Enviar</BrandButton>)
    const button = screen.getByRole('button', { name: 'Enviar' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-brand-primary', 'h-9')
    expect(button).toHaveAttribute('type', 'button')
  })

  it('aplica classes da variant secondary', () => {
    render(<BrandButton variant="secondary">Cancelar</BrandButton>)
    const button = screen.getByRole('button', { name: 'Cancelar' })
    expect(button).toHaveClass('bg-surface', 'border', 'border-line', 'text-ink')
  })

  it('aplica classes da variant success', () => {
    render(<BrandButton variant="success">Confirmar</BrandButton>)
    expect(screen.getByRole('button')).toHaveClass(
      'bg-feedback-success',
      'text-white',
    )
  })

  it('aplica classes do size sm', () => {
    render(
      <BrandButton size="sm" variant="ghost">
        Ação
      </BrandButton>,
    )
    expect(screen.getByRole('button')).toHaveClass('h-[30px]', 'px-2.5', 'text-xs')
  })

  it('renderiza o ícone marcando-o como decorativo', () => {
    render(
      <BrandButton icon={<svg data-testid="icon" />}>Avançar</BrandButton>,
    )
    const iconWrapper = screen.getByTestId('icon').parentElement
    expect(iconWrapper).toHaveAttribute('aria-hidden', 'true')
  })

  it('dispara onClick e respeita disabled', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    const { rerender } = render(
      <BrandButton onClick={onClick}>Clique</BrandButton>,
    )
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)

    rerender(
      <BrandButton disabled onClick={onClick}>
        Clique
      </BrandButton>,
    )
    const disabledBtn = screen.getByRole('button')
    expect(disabledBtn).toBeDisabled()
    expect(disabledBtn).toHaveClass('disabled:opacity-50')
    await user.click(disabledBtn)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('propaga aria-label e className', () => {
    render(
      <BrandButton aria-label="Enviar formulário" className="mt-2">
        Enviar
      </BrandButton>,
    )
    const button = screen.getByRole('button', { name: 'Enviar formulário' })
    expect(button).toHaveClass('mt-2')
  })

  it('encaminha ref para o elemento button', () => {
    const ref = { current: null as HTMLButtonElement | null }
    render(<BrandButton ref={ref}>Enviar</BrandButton>)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })
})
