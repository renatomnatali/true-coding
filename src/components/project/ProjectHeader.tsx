'use client'

import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { useProjectLayout } from './ProjectLayout'

interface ProjectHeaderProps {
  projectName: string
  status: string
}

const steps = [
  { id: 'IDEATION', label: 'Ideacao', shortLabel: 'Ideia' },
  { id: 'PLANNING', label: 'Planejamento', shortLabel: 'Plano' },
  { id: 'CONNECTING', label: 'GitHub', shortLabel: 'GitHub' },
  { id: 'GENERATING', label: 'Geracao', shortLabel: 'Gerar' },
  { id: 'DEPLOYING', label: 'Deploy', shortLabel: 'Deploy' },
  { id: 'LIVE', label: 'Online', shortLabel: 'Live' },
]

const statusLabels: Record<string, string> = {
  IDEATION: 'Em ideacao',
  PLANNING: 'Planejando',
  CONNECTING: 'Conectando',
  GENERATING: 'Gerando',
  DEPLOYING: 'Publicando',
  LIVE: 'Online',
  FAILED: 'Erro',
}

export function ProjectHeader({ projectName, status }: ProjectHeaderProps) {
  const { setSidebarOpen, sidebarOpen } = useProjectLayout()
  const currentStepIndex = steps.findIndex((s) => s.id === status)

  return (
    <header className="sticky top-0 z-50 border-b bg-background">
      {/* Top bar */}
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          {/* Menu button - mobile */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted lg:hidden"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Back + Logo */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm hidden sm:inline">Voltar</span>
          </Link>

          <div className="h-4 w-px bg-border hidden sm:block" />

          <Link href="/" className="font-semibold hidden sm:block">
            True Coding
          </Link>
        </div>

        {/* Project info - center on desktop */}
        <div className="flex items-center gap-3">
          <span className="font-medium truncate max-w-[150px] sm:max-w-[200px]">
            {projectName}
          </span>
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
            {statusLabels[status] || status}
          </span>
        </div>

        {/* User */}
        <div className="flex items-center gap-3">
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: 'h-8 w-8',
              },
            }}
          />
        </div>
      </div>

      {/* Progress bar */}
      <div className="border-t bg-muted/30 px-4 py-3">
        <div className="mx-auto max-w-3xl">
          {/* Desktop: full progress bar */}
          <div className="hidden sm:flex items-center justify-between">
            {steps.map((step, index) => {
              const isCompleted = index < currentStepIndex
              const isCurrent = step.id === status
              const isPending = index > currentStepIndex

              return (
                <div key={step.id} className="flex items-center">
                  {/* Step */}
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isCurrent
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isCompleted ? (
                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span
                      className={`text-sm ${
                        isCurrent
                          ? 'font-medium text-foreground'
                          : isPending
                            ? 'text-muted-foreground'
                            : 'text-foreground'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>

                  {/* Connector line */}
                  {index < steps.length - 1 && (
                    <div
                      className={`mx-3 h-0.5 w-8 lg:w-12 ${
                        index < currentStepIndex ? 'bg-green-500' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>

          {/* Mobile: compact progress */}
          <div className="flex items-center justify-between sm:hidden">
            <span className="text-sm font-medium">
              Passo {currentStepIndex + 1} de {steps.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {steps[currentStepIndex]?.label || 'Iniciando'}
            </span>
          </div>

          {/* Mobile: progress bar visual */}
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted sm:hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </header>
  )
}
