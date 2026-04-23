import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * TRC-14.3 — Primitiva ProgressBar do design system True Coding.
 *
 * Espelha `.progress-track` + `.progress-fill` do mockup
 * `Spec/Jornada Coleta inicial/prototipo.html` (linhas 127–128): track cinza
 * (bg-line, 4px de altura) com fill azul que transiciona a largura em 400ms.
 */

type ProgressBarVariant = 'primary' | 'success'

export type ProgressBarProps = {
  value: number
  variant?: ProgressBarVariant
  className?: string
  'aria-label'?: string
}

const FILL_VARIANT_CLASSES: Record<ProgressBarVariant, string> = {
  primary: 'bg-brand-primary',
  success: 'bg-feedback-success',
}

function clampPercent(value: number): number {
  if (Number.isNaN(value)) return 0
  if (value < 0) return 0
  if (value > 100) return 100
  return value
}

export function ProgressBar({
  value,
  variant = 'primary',
  className,
  'aria-label': ariaLabel,
}: ProgressBarProps) {
  const percent = clampPercent(value)

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-label={ariaLabel}
      className={cn(
        'h-1 w-full overflow-hidden rounded-full bg-line',
        className,
      )}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-[400ms] ease-out',
          FILL_VARIANT_CLASSES[variant],
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
