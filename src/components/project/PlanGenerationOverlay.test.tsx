import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PlanGenerationOverlay } from './PlanGenerationOverlay'

describe('PlanGenerationOverlay - @geracao @loading', () => {
  it('@regressao: overlay NAO aparece antes de confirmar (visible=false)', () => {
    render(<PlanGenerationOverlay kind="business" visible={false} />)

    expect(screen.queryByTestId('plan-generation-overlay')).not.toBeInTheDocument()
    expect(screen.queryByText('Gerando Plano de Negócio...')).not.toBeInTheDocument()
  })

  it('ao confirmar (visible=true), exibe os 4 steps do plano de negocio', () => {
    render(<PlanGenerationOverlay kind="business" visible />)

    expect(screen.getByTestId('plan-generation-overlay')).toBeInTheDocument()
    expect(screen.getByText('Gerando Plano de Negócio...')).toBeInTheDocument()

    // Os 4 steps exatos
    expect(screen.getByText('Analisando respostas')).toBeInTheDocument()
    expect(screen.getByText('Estruturando plano')).toBeInTheDocument()
    expect(screen.getByText('Definindo features')).toBeInTheDocument()
    expect(screen.getByText('Finalizando')).toBeInTheDocument()
  })

  it('estado inicial: step 1 e "completed", step 2 e "current", demais "pending"', () => {
    render(<PlanGenerationOverlay kind="business" visible />)

    // step 1 ("Analisando respostas") ja marcado concluido (verde)
    const step1Label = screen.getByText('Analisando respostas')
    expect(step1Label.className).toContain('text-green-700')

    // step 2 ("Estruturando plano") ativo (azul)
    const step2Label = screen.getByText('Estruturando plano')
    expect(step2Label.className).toContain('text-blue-700')

    // step 3 e 4 pendentes (cinza)
    expect(screen.getByText('Definindo features').className).toContain('text-gray-500')
    expect(screen.getByText('Finalizando').className).toContain('text-gray-500')
  })
})
