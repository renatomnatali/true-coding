import * as React from 'react'

import { cn } from '@/lib/utils'

import { tierLabel, type PlatformTier } from './TierBadge'

/**
 * TRC-14.4 — Chip do usuário autenticado no footer da sidebar.
 *
 * Avatar 28×28 circular com inicial + nome e rótulo secundário ("Free · Trial").
 * Em modo colapsado, só o avatar. O rótulo de plano é derivado do `tier` para
 * manter consistência com o `<TierBadge>` exibido no topo (TRC-ADR-013).
 */

export type UserChipProps = {
  name: string
  tier: PlatformTier
  /** Modo colapsado: só o avatar. */
  compact?: boolean
  className?: string
}

function resolveInitial(name: string): string {
  const trimmed = name.trim()
  return trimmed ? trimmed.charAt(0).toUpperCase() : '?'
}

export function UserChip({
  name,
  tier,
  compact = false,
  className,
}: UserChipProps) {
  const avatarInitial = resolveInitial(name)
  const planLabel = `Free · ${tierLabel(tier)}`

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-brand-md px-2.5 py-2',
        className,
      )}
      data-testid="user-chip"
    >
      <div
        aria-hidden
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold text-ink"
      >
        {avatarInitial}
      </div>
      {!compact && (
        <div className="min-w-0">
          <div className="truncate text-xs font-medium text-ink">{name}</div>
          <div className="truncate text-[10px] text-ink-tertiary">{planLabel}</div>
        </div>
      )}
    </div>
  )
}
