import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * TRC-14.3 — Primitiva Callout do design system True Coding.
 *
 * O mockup `Spec/Jornada Coleta inicial/prototipo.html` não define uma classe
 * `.callout`, mas os JSX do canvas/chat (`src/canvas.jsx`) usam o padrão:
 * bloco com fundo + borda tingidos pela cor do feedback (info, warning,
 * success, error) e um slot de ícone à esquerda com o texto à direita.
 *
 * Variante `info` usa a paleta `brand-primary-*` (o mockup trata mensagens
 * neutras/informacionais com o azul da marca).
 */

type CalloutVariant = 'info' | 'warning' | 'success' | 'error'

export type CalloutProps = {
  variant?: CalloutVariant
  icon?: React.ReactNode
  title?: string
  children: React.ReactNode
  className?: string
}

// border usa a cor-base (mais saturada) e bg usa a variante -light/-lighter
// para que a borda fique visivel sobre o fundo (pattern alinhado ao mockup).
const VARIANT_CLASSES: Record<CalloutVariant, string> = {
  info: 'border-brand-primary-light bg-brand-primary-lighter text-brand-primary',
  warning:
    'border-feedback-warning bg-feedback-warning-light text-feedback-warning-hover',
  success:
    'border-feedback-success bg-feedback-success-light text-feedback-success-hover',
  error: 'border-feedback-error bg-feedback-error-light text-feedback-error',
}

const BASE_CLASSES = 'flex gap-3 rounded-brand-lg border p-3 text-sm'

export function Callout({
  variant = 'info',
  icon,
  title,
  children,
  className,
}: CalloutProps) {
  return (
    <div
      role="note"
      className={cn(BASE_CLASSES, VARIANT_CLASSES[variant], className)}
    >
      {icon ? (
        <div className="flex-shrink-0" aria-hidden>
          {icon}
        </div>
      ) : null}
      <div className="flex-1">
        {title ? <div className="font-semibold">{title}</div> : null}
        <div className={cn(title ? 'mt-0.5' : undefined)}>{children}</div>
      </div>
    </div>
  )
}
