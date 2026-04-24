'use client'

import * as React from 'react'
import Link from 'next/link'

import { CreditsChip } from '@/components/shell/CreditsChip'
import { Sidebar } from '@/components/shell/Sidebar'
import { TierBadge, type PlatformTier } from '@/components/shell/TierBadge'
import { UserChip } from '@/components/shell/UserChip'
import { Callout } from '@/components/ui/callout'
import { APP_MIN_WIDTH_PX } from '@/hooks/use-viewport'

/**
 * TRC-14.4 — Showcase da Sidebar + auxiliares no /design-system.
 *
 * Renderiza a sidebar em 4 tiers + estado expandido forçado via hover simulado,
 * sem depender da rota real (cada wrapper ocupa uma caixa relativa e a sidebar
 * fica `absolute` dentro dela para evitar sobrepor o restante da página).
 */

const TIERS: PlatformTier[] = ['TRIAL', 'START', 'PRO', 'SCALE']

export function ShellShowcase() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-[0.04em] text-ink-tertiary">
          TierBadge
        </h3>
        <p className="mt-1 text-xs text-ink-tertiary">
          Identidade de plano exibida abaixo do logo. Compact = modo colapsado
          (só inicial).
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-brand-lg border border-line bg-surface p-4">
          {TIERS.map((tier) => (
            <TierBadge key={tier} tier={tier} />
          ))}
          <span className="mx-2 h-5 w-px bg-line" aria-hidden />
          {TIERS.map((tier) => (
            <TierBadge key={`${tier}-compact`} tier={tier} compact />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold uppercase tracking-[0.04em] text-ink-tertiary">
          CreditsChip
        </h3>
        <p className="mt-1 text-xs text-ink-tertiary">
          Cor varia por faixa: neutral (&gt;40), warning (10–40), error
          (&lt;10).
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-brand-lg border border-line bg-surface p-4">
          <CreditsChip balance={60} />
          <CreditsChip balance={20} />
          <CreditsChip balance={5} />
          <span className="mx-2 h-5 w-px bg-line" aria-hidden />
          <CreditsChip balance={60} compact />
          <CreditsChip balance={20} compact />
          <CreditsChip balance={5} compact />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold uppercase tracking-[0.04em] text-ink-tertiary">
          UserChip
        </h3>
        <p className="mt-1 text-xs text-ink-tertiary">
          Avatar circular + nome + rótulo derivado do tier. Modo compacto
          mostra só o avatar.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-4 rounded-brand-lg border border-line bg-surface p-4">
          <UserChip name="Maria Silva" tier="TRIAL" />
          <UserChip name="Renato" tier="PRO" />
          <span className="mx-2 h-5 w-px bg-line" aria-hidden />
          <UserChip name="Maria Silva" tier="TRIAL" compact />
          <UserChip name="Renato" tier="PRO" compact />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold uppercase tracking-[0.04em] text-ink-tertiary">
          Sidebar
        </h3>
        <p className="mt-1 text-xs text-ink-tertiary">
          56px colapsada → 224px expandida no hover (200ms). Passe o mouse
          sobre o bloco abaixo para ver a expansão.
        </p>
        <div className="mt-3 flex flex-wrap gap-4">
          {TIERS.map((tier) => (
            <SidebarPreview key={tier} tier={tier} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold uppercase tracking-[0.04em] text-ink-tertiary">
          ViewportGate
        </h3>
        <p className="mt-1 text-xs text-ink-tertiary">
          Overlay exibido em viewports abaixo de {APP_MIN_WIDTH_PX}px dentro do
          app autenticado (ADR-016 / TRC-14.8). Preview inline abaixo — em
          produção o container é <code>fixed inset-0</code>.
        </p>
        <ViewportGatePreview />
      </div>
    </div>
  )
}

/**
 * TRC-14.8 — Preview inline do ViewportGate.
 *
 * Reproduz visualmente o overlay sem depender do hook useViewport. Ficou
 * aqui (e não dentro de `ViewportGate.tsx`) para manter o componente real
 * simples: ele só renderiza quando o viewport é pequeno de verdade.
 */
function ViewportGatePreview() {
  return (
    <div className="mt-3 overflow-hidden rounded-brand-lg border border-line bg-surface">
      <div className="relative h-[320px] bg-surface-canvas">
        {/* Conteúdo fantasma ao fundo para simular a rota autenticada. */}
        <div className="absolute inset-0 p-6 text-xs text-ink-quaternary">
          <div className="mb-2 h-4 w-40 rounded bg-surface-muted" />
          <div className="mb-2 h-4 w-64 rounded bg-surface-muted" />
          <div className="h-4 w-52 rounded bg-surface-muted" />
        </div>
        {/* Overlay: mesma estrutura do ViewportGate real, porém absolute. */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="viewport-gate-preview-title"
          className="absolute inset-0 z-10 flex items-center justify-center bg-surface-canvas/95 p-6 backdrop-blur-sm"
        >
          <Callout
            variant="warning"
            title="Melhor em desktop"
            className="max-w-md"
          >
            <p id="viewport-gate-preview-title" className="sr-only">
              Aviso de tamanho de tela
            </p>
            <p className="mb-3 text-sm">
              A True Coding é otimizada pra telas a partir de {APP_MIN_WIDTH_PX}
              px. Em telas menores, alguns elementos podem ficar comprimidos.
            </p>
            <Link
              href="/"
              className="inline-block rounded-brand-md bg-brand-primary px-3.5 py-1.5 text-sm font-medium text-white hover:bg-brand-primary-hover"
            >
              Voltar pra landing
            </Link>
          </Callout>
        </div>
      </div>
    </div>
  )
}

function SidebarPreview({ tier }: { tier: PlatformTier }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-tertiary">
        Tier {tier.toLowerCase()}
      </div>
      <div className="relative h-[480px] w-[260px] overflow-hidden rounded-brand-lg border border-line bg-surface-canvas">
        {/*
         * A Sidebar é `fixed` por design; aqui isolamos via `style: position
         * absolute` no wrapper para preview local. Tailwind não permite
         * alterar `position` de um componente filho via className externo,
         * então envelopamos em um div `relative` com overflow hidden.
         */}
        <div className="pointer-events-auto">
          <div
            className="absolute inset-0"
            style={{ contain: 'layout paint' }}
          >
            <ScopedSidebar tier={tier} />
          </div>
        </div>
      </div>
    </div>
  )
}

/** Variante da Sidebar confinada ao preview (não `fixed` global). */
function ScopedSidebar({ tier }: { tier: PlatformTier }) {
  return (
    <div className="absolute inset-y-0 left-0">
      <Sidebar
        userName="Maria Silva"
        tier={tier}
        credits={tier === 'TRIAL' ? 60 : 40}
        inboxCount={tier === 'PRO' ? 3 : 0}
        riskCount={2}
        decisionCount={1}
        className="!static !h-full"
      />
    </div>
  )
}
