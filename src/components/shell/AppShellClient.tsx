'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'

import { Sidebar } from './Sidebar'
import type { PlatformTier } from './TierBadge'
import { ViewportGate } from './ViewportGate'

/**
 * TRC-14.4 — Wrapper client que decide se a sidebar global deve ser renderizada.
 *
 * Rotas públicas (home, sign-in/up, design-system) herdam o mesmo RootLayout
 * mas NÃO devem receber o shell. Mantemos essa lista sincronizada com o
 * `createRouteMatcher` de `src/middleware.ts` (tb alvo de checagem no review).
 */

const PUBLIC_PREFIXES = [
  '/sign-in',
  '/sign-up',
  '/design-system',
]

function isPublicPath(pathname: string | null): boolean {
  if (!pathname) return true
  if (pathname === '/') return true
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

type AppShellClientProps = {
  userName: string
  userInitial?: string
  tier: PlatformTier
  credits: number
  /** Contadores reais viram props reais em TRC-19; default 0 no MVP. */
  inboxCount?: number
  riskCount?: number
  decisionCount?: number
  children: React.ReactNode
}

export function AppShellClient({
  userName,
  userInitial,
  tier,
  credits,
  inboxCount = 0,
  riskCount = 0,
  decisionCount = 0,
  children,
}: AppShellClientProps) {
  const pathname = usePathname()

  if (isPublicPath(pathname)) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-surface-canvas">
      <Sidebar
        userName={userName}
        userInitial={userInitial}
        tier={tier}
        credits={credits}
        inboxCount={inboxCount}
        riskCount={riskCount}
        decisionCount={decisionCount}
      />
      {/* TRC-14.8 — gate desktop-first (ADR-016). Só renderiza em <1280px e
       * apenas dentro do shell autenticado (rotas públicas saíram acima). */}
      <ViewportGate />
      {/* Sidebar flutua (fixed) e ocupa 56px base; expande em hover por cima.
       * Mantemos `pl-14` fixo para que o conteúdo nunca se desloque. */}
      <main className="pl-14">{children}</main>
    </div>
  )
}
