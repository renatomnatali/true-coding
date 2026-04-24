'use client'

import Link from 'next/link'

import { Callout } from '@/components/ui/callout'
import { APP_MIN_WIDTH_PX, useViewport } from '@/hooks/use-viewport'

/**
 * TRC-14.8 — Gate visual para viewports abaixo de {@link APP_MIN_WIDTH_PX}.
 *
 * Segue a ADR-016 (desktop-first app ≥ 1280px). Renderiza um overlay com
 * `role="dialog"` cobrindo as rotas autenticadas quando o usuário abre o app
 * numa tela pequena. O `AppShellClient` já filtra rotas públicas, então este
 * componente só aparece dentro do shell — landing/sign-in/design-system ficam
 * de fora por construção.
 *
 * Decisão client-side (SSR não sabe a largura do cliente). O primeiro render
 * devolve `null` para evitar flash antes da primeira medição.
 */
export function ViewportGate() {
  const { isAppSized, hasMeasured } = useViewport()

  if (!hasMeasured || isAppSized) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="viewport-gate-title"
      data-testid="viewport-gate"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-surface-canvas/95 p-6 backdrop-blur-sm"
    >
      <Callout variant="warning" title="Melhor em desktop" className="max-w-md">
        <p id="viewport-gate-title" className="sr-only">
          Aviso de tamanho de tela
        </p>
        <p className="mb-3 text-sm">
          A True Coding é otimizada pra telas a partir de {APP_MIN_WIDTH_PX}px.
          Em telas menores, alguns elementos podem ficar comprimidos.
        </p>
        <Link
          href="/"
          className="inline-block rounded-brand-md bg-brand-primary px-3.5 py-1.5 text-sm font-medium text-white hover:bg-brand-primary-hover"
        >
          Voltar pra landing
        </Link>
      </Callout>
    </div>
  )
}
