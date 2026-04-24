import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

import { ViewportGate } from './ViewportGate'
import type { ViewportState } from '@/hooks/use-viewport'

const viewportMock = vi.fn<[], ViewportState>(() => ({
  width: 1920,
  isAppSized: true,
  hasMeasured: true,
}))

vi.mock('@/hooks/use-viewport', async () => {
  const actual =
    await vi.importActual<typeof import('@/hooks/use-viewport')>(
      '@/hooks/use-viewport',
    )
  return {
    ...actual,
    useViewport: () => viewportMock(),
  }
})

describe('ViewportGate', () => {
  beforeEach(() => {
    viewportMock.mockReset()
  })

  it('não renderiza nada antes da primeira medição (hasMeasured=false)', () => {
    viewportMock.mockReturnValue({
      width: 0,
      isAppSized: true,
      hasMeasured: false,
    })
    const { container } = render(<ViewportGate />)
    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('não renderiza em viewport adequado (isAppSized=true)', () => {
    viewportMock.mockReturnValue({
      width: 1920,
      isAppSized: true,
      hasMeasured: true,
    })
    const { container } = render(<ViewportGate />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renderiza banner com role="dialog" em viewport pequeno', () => {
    viewportMock.mockReturnValue({
      width: 1024,
      isAppSized: false,
      hasMeasured: true,
    })
    render(<ViewportGate />)

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByText('Melhor em desktop')).toBeInTheDocument()
  })

  it('CTA "Voltar pra landing" é um link para /', () => {
    viewportMock.mockReturnValue({
      width: 1024,
      isAppSized: false,
      hasMeasured: true,
    })
    render(<ViewportGate />)

    const cta = screen.getByRole('link', { name: 'Voltar pra landing' })
    expect(cta).toHaveAttribute('href', '/')
  })

  it('aria-labelledby aponta para elemento real com id correto', () => {
    viewportMock.mockReturnValue({
      width: 1024,
      isAppSized: false,
      hasMeasured: true,
    })
    const { container } = render(<ViewportGate />)

    const dialog = screen.getByRole('dialog')
    const labelId = dialog.getAttribute('aria-labelledby')
    expect(labelId).toBeTruthy()
    const labelEl = container.querySelector(`#${labelId}`)
    expect(labelEl).not.toBeNull()
    expect(labelEl?.textContent).toBeTruthy()
  })
})
