import * as React from 'react'

import { Chip } from '@/components/ui/chip'
import { Dot } from '@/components/ui/dot'
import { cn } from '@/lib/utils'

/**
 * TRC-14.4 — Chip de saldo de créditos no footer da sidebar global.
 *
 * Duas moedas distintas (TRC-ADR-013): este chip representa o saldo de créditos
 * consumíveis — independente do tier da plataforma. Cor varia por faixa:
 *   - neutral  (balance > 40)
 *   - warning  (10 <= balance <= 40)
 *   - error    (balance < 10)
 *
 * Expandida: mostra `{balance} créditos`. Colapsada: só ponto colorido + número.
 */

type CreditsTone = 'neutral' | 'warning' | 'error'

function toneFromBalance(balance: number): CreditsTone {
  if (balance < 10) return 'error'
  if (balance <= 40) return 'warning'
  return 'neutral'
}

const TONE_TO_CHIP: Record<CreditsTone, 'neutral' | 'warning' | 'error'> = {
  neutral: 'neutral',
  warning: 'warning',
  error: 'error',
}

const TONE_TO_DOT: Record<CreditsTone, 'muted' | 'warning' | 'error'> = {
  neutral: 'muted',
  warning: 'warning',
  error: 'error',
}

export type CreditsChipProps = {
  balance: number
  /** Modo colapsado (sem label textual). */
  compact?: boolean
  className?: string
}

export function CreditsChip({
  balance,
  compact = false,
  className,
}: CreditsChipProps) {
  const tone = toneFromBalance(balance)
  const safeBalance = Math.max(0, Math.floor(balance))

  return (
    <Chip
      variant={TONE_TO_CHIP[tone]}
      className={cn('gap-2 px-2.5 py-1 text-xs', className)}
    >
      <Dot
        variant={TONE_TO_DOT[tone]}
        aria-label={`Saldo ${safeBalance} créditos`}
      />
      <span className="font-medium" data-testid="credits-balance">
        {safeBalance}
        {compact ? '' : ' créditos'}
      </span>
    </Chip>
  )
}

export { toneFromBalance }
