'use client'

import { useEffect, useMemo, useState } from 'react'

export type PlanGenerationKind = 'business' | 'technical' | 'ux'

interface PlanLoadingConfig {
  title: string
  description: string
  steps: string[]
}

const PLAN_LOADING_CONFIG: Record<PlanGenerationKind, PlanLoadingConfig> = {
  business: {
    title: 'Gerando Plano de Negócio...',
    description: 'Analisando suas respostas e estruturando um plano completo.',
    steps: [
      'Analisando respostas',
      'Estruturando plano',
      'Definindo features',
      'Finalizando',
    ],
  },
  technical: {
    title: 'Gerando Plano Técnico...',
    description: 'Montando arquitetura, stack e estrutura técnica do projeto.',
    steps: [
      'Analisando arquitetura',
      'Definindo stack tecnológica',
      'Planejando banco de dados',
      'Criando endpoints',
      'Finalizando plano técnico',
    ],
  },
  ux: {
    title: 'Gerando Plano de UX...',
    description: 'Definindo personas, jornadas e estrutura de interface.',
    steps: [
      'Analisando requisitos',
      'Definindo personas',
      'Mapeando jornadas',
      'Estruturando wireframes',
      'Finalizando plano de UX',
    ],
  },
}

interface PlanGenerationOverlayProps {
  kind: PlanGenerationKind
  visible: boolean
}

function getInitialCurrentStep(totalSteps: number): number {
  if (totalSteps <= 1) return 0
  return 1
}

export function PlanGenerationOverlay({
  kind,
  visible,
}: PlanGenerationOverlayProps) {
  const config = PLAN_LOADING_CONFIG[kind]

  const initialStep = useMemo(
    () => getInitialCurrentStep(config.steps.length),
    [config.steps.length]
  )
  const [currentStep, setCurrentStep] = useState(initialStep)

  useEffect(() => {
    if (!visible) return

    setCurrentStep(initialStep)

    const interval = setInterval(() => {
      setCurrentStep((previous) => {
        if (previous >= config.steps.length - 1) return previous
        return previous + 1
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [visible, initialStep, config.steps.length])

  if (!visible) return null

  return (
    <div
      data-testid="plan-generation-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow-2xl">
        <div className="flex flex-col items-center">
          <div className="mb-5 h-16 w-16 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          <h3 className="mb-2 text-center text-2xl font-bold text-gray-900">
            {config.title}
          </h3>
          <p className="mb-6 text-center text-sm text-gray-600">
            {config.description}
          </p>
        </div>

        <div className="rounded-lg bg-gray-50 p-4">
          <ul className="space-y-3">
            {config.steps.map((step, index) => {
              const status =
                index < currentStep
                  ? 'completed'
                  : index === currentStep
                    ? 'current'
                    : 'pending'

              return (
                <li key={step} className="flex items-center gap-3">
                  {status === 'completed' && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-xs font-semibold text-white">
                      ✓
                    </div>
                  )}
                  {status === 'current' && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                      {index + 1}
                    </div>
                  )}
                  {status === 'pending' && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-500">
                      {index + 1}
                    </div>
                  )}
                  <span
                    className={
                      status === 'completed'
                        ? 'text-sm font-medium text-green-700'
                        : status === 'current'
                          ? 'text-sm font-medium text-blue-700'
                          : 'text-sm text-gray-500'
                    }
                  >
                    {step}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>

        <p className="mt-4 text-center text-sm text-gray-500">
          Isso pode levar alguns segundos...
        </p>
      </div>
    </div>
  )
}
