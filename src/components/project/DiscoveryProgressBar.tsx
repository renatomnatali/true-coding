interface DiscoveryProgressBarProps {
  currentQuestion: number | null
  totalQuestions?: number
}

export function DiscoveryProgressBar({
  currentQuestion,
  totalQuestions = 5,
}: DiscoveryProgressBarProps) {
  const steps = Array.from({ length: totalQuestions }, (_, i) => i + 1)
  const progressPercentage = currentQuestion ? (currentQuestion / totalQuestions) * 100 : 0

  return (
    <div className="w-full">
      {/* Progress label */}
      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="font-semibold">Discovery Progress</span>
        <span className="text-muted-foreground">
          {currentQuestion ? `Pergunta ${currentQuestion} de ${totalQuestions}` : 'Iniciando...'}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step) => {
          const isCompleted = currentQuestion !== null && step < currentQuestion
          const isCurrent = step === currentQuestion
          const isPending = currentQuestion === null || step > currentQuestion

          return (
            <div key={step} className="flex flex-col items-center gap-2">
              {/* Circle */}
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-medium transition-all duration-300 ${
                  isCompleted
                    ? 'border-primary bg-primary text-primary-foreground'
                    : isCurrent
                      ? 'border-primary bg-background text-primary ring-4 ring-primary/20'
                      : 'border-muted bg-background text-muted-foreground'
                }`}
              >
                {isCompleted ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-sm">{step}</span>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-xs font-medium transition-colors ${
                  isCurrent ? 'text-foreground' : isPending ? 'text-muted-foreground' : 'text-primary'
                }`}
              >
                {step === 1 && 'Problema'}
                {step === 2 && 'Features'}
                {step === 3 && 'Diferenciais'}
                {step === 4 && 'Nice-to-Have'}
                {step === 5 && 'Monetização'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
