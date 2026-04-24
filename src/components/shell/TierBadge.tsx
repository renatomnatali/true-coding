import * as React from 'react'

import { Chip } from '@/components/ui/chip'
import { cn } from '@/lib/utils'

/**
 * TRC-14.4 — Badge de tier exibido abaixo do logo na sidebar global.
 *
 * Representa a assinatura da plataforma (TRC-ADR-013 — tier fixo, independente
 * de créditos). Em sidebar colapsada mostra só a inicial; expandida mostra o
 * label completo ("Trial", "Start", "Pro", "Scale").
 */

export type PlatformTier = 'TRIAL' | 'START' | 'PRO' | 'SCALE'

type ChipVariant = 'neutral' | 'primary' | 'success' | 'warning'

type TierMeta = {
  label: string
  initial: string
  variant: ChipVariant
}

const TIER_META: Record<PlatformTier, TierMeta> = {
  TRIAL: { label: 'Trial', initial: 'T', variant: 'neutral' },
  START: { label: 'Start', initial: 'S', variant: 'primary' },
  PRO: { label: 'Pro', initial: 'P', variant: 'success' },
  SCALE: { label: 'Scale', initial: 'S', variant: 'warning' },
}

export type TierBadgeProps = {
  tier: PlatformTier
  /** Se `true`, exibe só a inicial (modo colapsado da sidebar). */
  compact?: boolean
  className?: string
}

export function TierBadge({ tier, compact = false, className }: TierBadgeProps) {
  const meta = TIER_META[tier]
  const display = compact ? meta.initial : meta.label
  return (
    <Chip
      variant={meta.variant}
      className={cn('uppercase tracking-[0.04em]', className)}
    >
      <span aria-label={`Plano ${meta.label}`}>{display}</span>
    </Chip>
  )
}

export function tierLabel(tier: PlatformTier): string {
  return TIER_META[tier].label
}
