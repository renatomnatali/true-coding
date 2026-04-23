import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * TRC-14.3 — Primitiva Chip do design system True Coding.
 *
 * Espelha `.chip` + variantes do mockup `Spec/Jornada Coleta inicial/prototipo.html`
 * (linhas 85–94). A variante `error` usa `#b91c1c` para o texto (não há token
 * dedicado; o mockup aplica o hex literal).
 */

type ChipVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'error'

export type ChipProps = {
  variant?: ChipVariant
  children: React.ReactNode
  className?: string
}

const VARIANT_CLASSES: Record<ChipVariant, string> = {
  neutral: 'bg-surface-muted text-ink-secondary',
  primary: 'bg-brand-primary-light text-brand-primary',
  success: 'bg-feedback-success-light text-feedback-success-hover',
  warning: 'bg-feedback-warning-light text-feedback-warning-hover',
  error: 'bg-feedback-error-light text-[#b91c1c]',
}

const BASE_CLASSES =
  'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium'

export function Chip({ variant = 'neutral', children, className }: ChipProps) {
  return (
    <span className={cn(BASE_CLASSES, VARIANT_CLASSES[variant], className)}>
      {children}
    </span>
  )
}
