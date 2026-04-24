import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import { ProductSidebar } from './ProductSidebar'

const pathnameMock = vi.fn<[], string>(() => '/dashboard')

vi.mock('next/navigation', () => ({
  usePathname: () => pathnameMock(),
}))

describe('ProductSidebar', () => {
  beforeEach(() => {
    pathnameMock.mockReset()
    pathnameMock.mockReturnValue('/dashboard')
  })

  it('renderiza por padrão em modo colapsado (data-expanded="false")', () => {
    render(
      <ProductSidebar userName="Maria Silva" tier="TRIAL" credits={60} />,
    )
    const aside = screen.getByTestId('app-sidebar')
    expect(aside).toHaveAttribute('data-expanded', 'false')
    expect(aside).toHaveClass('w-14')
    // Badge do tier aparece como inicial.
    expect(screen.getByText('T')).toBeInTheDocument()
  })

  it('expande em hover (mouseEnter troca data-expanded para true)', () => {
    render(
      <ProductSidebar userName="Maria Silva" tier="TRIAL" credits={60} />,
    )
    const aside = screen.getByTestId('app-sidebar')
    fireEvent.mouseEnter(aside)
    expect(aside).toHaveAttribute('data-expanded', 'true')
    expect(aside).toHaveClass('w-56')
    // Label completo do tier aparece só quando expandida.
    expect(screen.getByText('Trial')).toBeInTheDocument()
  })

  it('mostra apenas "Projetos" em rotas fora de /project', () => {
    pathnameMock.mockReturnValue('/dashboard')
    render(
      <ProductSidebar userName="Maria" tier="TRIAL" credits={60} />,
    )
    const aside = screen.getByTestId('app-sidebar')
    fireEvent.mouseEnter(aside)
    expect(screen.getByText('Projetos')).toBeInTheDocument()
    expect(screen.queryByText('Especificação')).not.toBeInTheDocument()
    expect(screen.queryByText('Decisões')).not.toBeInTheDocument()
    expect(screen.queryByText('Riscos')).not.toBeInTheDocument()
    expect(screen.queryByText('Inbox')).not.toBeInTheDocument()
  })

  it('adiciona itens contextuais em rotas /project/:id', () => {
    pathnameMock.mockReturnValue('/project/abc123')
    render(
      <ProductSidebar userName="Maria" tier="PRO" credits={60} />,
    )
    const aside = screen.getByTestId('app-sidebar')
    fireEvent.mouseEnter(aside)
    expect(screen.getByText('Especificação')).toBeInTheDocument()
    expect(screen.getByText('Decisões')).toBeInTheDocument()
    expect(screen.getByText('Riscos')).toBeInTheDocument()
    expect(screen.getByText('Inbox')).toBeInTheDocument()
  })

  it('renderiza active indicator no item cuja rota bate com pathname', () => {
    pathnameMock.mockReturnValue('/project/abc123/riscos')
    render(
      <ProductSidebar userName="Maria" tier="PRO" credits={60} riskCount={2} />,
    )
    const aside = screen.getByTestId('app-sidebar')
    fireEvent.mouseEnter(aside)

    const riscosLink = screen.getByRole('link', { name: /Riscos/ })
    expect(riscosLink).toHaveAttribute('aria-current', 'page')
    expect(riscosLink).toHaveAttribute('data-active', 'true')

    // Item "Projetos" do nav (não o link do logo) não deve estar ativo.
    const projetosLink = screen
      .getAllByRole('link', { name: /Projetos/ })
      .find((el) => el.textContent?.trim() === 'Projetos')
    expect(projetosLink).toBeDefined()
    expect(projetosLink).toHaveAttribute('data-active', 'false')
  })

  it('exibe badge numérico destacado quando inboxCount > 0', () => {
    pathnameMock.mockReturnValue('/project/abc123')
    render(
      <ProductSidebar userName="Maria" tier="PRO" credits={60} inboxCount={3} />,
    )
    const aside = screen.getByTestId('app-sidebar')
    fireEvent.mouseEnter(aside)

    const badge = screen.getByTestId('count-inbox')
    expect(badge).toHaveTextContent('3')
    // Highlight: fundo primary em azul.
    expect(badge).toHaveClass('bg-brand-primary', 'text-white')
  })

  it('não renderiza badge numérico quando o contador é zero', () => {
    pathnameMock.mockReturnValue('/project/abc123')
    render(
      <ProductSidebar userName="Maria" tier="PRO" credits={60} riskCount={0} />,
    )
    const aside = screen.getByTestId('app-sidebar')
    fireEvent.mouseEnter(aside)
    expect(screen.queryByTestId('count-riscos')).not.toBeInTheDocument()
  })

  it('expõe nav wrapper com aria-label principal de navegação', () => {
    render(<ProductSidebar userName="Maria" tier="TRIAL" credits={60} />)
    const nav = screen.getByLabelText('Navegação principal')
    expect(nav).toBeInTheDocument()
  })
})
