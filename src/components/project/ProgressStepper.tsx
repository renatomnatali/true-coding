'use client'

interface Step {
  id: string
  label: string
  description: string
}

const steps: Step[] = [
  { id: 'IDEATION', label: 'Ideacao', description: 'Descreva seu app' },
  { id: 'PLANNING', label: 'Planejamento', description: 'Revise o plano' },
  { id: 'CONNECTING', label: 'GitHub', description: 'Conecte sua conta' },
  { id: 'GENERATING', label: 'Geracao', description: 'Codigo sendo criado' },
  { id: 'DEPLOYING', label: 'Deploy', description: 'Publicando o app' },
  { id: 'LIVE', label: 'Online', description: 'Seu app esta no ar!' },
]

interface ProgressStepperProps {
  currentStatus: string
  onStepClick?: (stepId: string) => void
}

export function ProgressStepper({
  currentStatus,
  onStepClick,
}: ProgressStepperProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStatus)

  return (
    <nav className="w-64 shrink-0 border-r bg-muted/30 p-4">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Progresso
      </h2>

      <ol className="space-y-1">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex
          const isCurrent = step.id === currentStatus
          const isPending = index > currentIndex

          return (
            <li key={step.id}>
              <button
                onClick={() => isCompleted && onStepClick?.(step.id)}
                disabled={isPending}
                className={`w-full flex items-start gap-3 rounded-lg p-3 text-left transition-colors ${
                  isCurrent
                    ? 'bg-primary/10 text-primary'
                    : isCompleted
                      ? 'hover:bg-muted cursor-pointer'
                      : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <div
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>

                <div className="min-w-0">
                  <div
                    className={`text-sm font-medium ${
                      isPending ? 'text-muted-foreground' : ''
                    }`}
                  >
                    {step.label}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {step.description}
                  </div>
                </div>
              </button>
            </li>
          )
        })}
      </ol>

      {/* Quick help */}
      <div className="mt-8 rounded-lg bg-muted p-4">
        <h3 className="text-sm font-medium mb-2">Precisa de ajuda?</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Descreva seu app em linguagem natural. A AI vai te guiar pelo resto!
        </p>
        <a
          href="/docs"
          className="text-xs text-primary hover:underline"
          target="_blank"
        >
          Ver documentacao →
        </a>
      </div>
    </nav>
  )
}
