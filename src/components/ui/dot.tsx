import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * TRC-14.3 — Primitiva Dot do design system True Coding.
 *
 * Espelha `.dot` (6×6px, border-radius 9999) + variantes do mockup
 * `Spec/Jornada Coleta inicial/prototipo.html` (linhas 96–100).
 */

type DotVariant = 'muted' | 'primary' | 'success' | 'warning' | 'error'

export type DotProps = {
  variant?: DotVariant
  className?: string
  'aria-label'?: string
}

const VARIANT_CLASSES: Record<DotVariant, string> = {
  muted: 'bg-ink-quaternary',
  primary: 'bg-brand-primary',
  success: 'bg-feedback-success',
  warning: 'bg-feedback-warning',
  error: 'bg-feedback-error',
}

const BASE_CLASSES = 'inline-block h-1.5 w-1.5 rounded-full'

export function Dot({
  variant = 'muted',
  className,
  'aria-label': ariaLabel,
}: DotProps) {
  return (
    <span
      className={cn(BASE_CLASSES, VARIANT_CLASSES[variant], className)}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      role={ariaLabel ? 'img' : undefined}
    />
  )
}
