import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * TRC-14.3 — Primitiva TypingDots do design system True Coding.
 *
 * Espelha `.typing-dots` do mockup `Spec/Jornada Coleta inicial/prototipo.html`
 * (linhas 131–138): três bolinhas 5×5px com animação `bounce` staggered em
 * 200ms. Usa a animação `typing-bounce` registrada no Tailwind (TRC-14.1), que
 * é keyframe própria para não colidir com a `animate-bounce` built-in.
 */

export type TypingDotsProps = {
  'aria-label'?: string
  className?: string
}

const DOT_BASE =
  'h-[5px] w-[5px] rounded-full bg-ink-tertiary animate-typing-bounce'

export function TypingDots({
  'aria-label': ariaLabel = 'Carregando',
  className,
}: TypingDotsProps) {
  return (
    <span
      role="status"
      aria-label={ariaLabel}
      className={cn('inline-flex items-center gap-[3px]', className)}
    >
      <span className={DOT_BASE} />
      <span className={cn(DOT_BASE, '[animation-delay:0.2s]')} />
      <span className={cn(DOT_BASE, '[animation-delay:0.4s]')} />
    </span>
  )
}
