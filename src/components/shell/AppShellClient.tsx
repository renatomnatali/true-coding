'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'

import { PUBLIC_ROUTE_PREFIXES } from '@/lib/routes'

import { ProductSidebar } from './ProductSidebar'
import type { PlatformTier } from './TierBadge'
import { ViewportGate } from './ViewportGate'

/**
 * TRC-14.4 — Wrapper client que decide se a sidebar global deve ser renderizada.
 *
 * Rotas públicas (home, sign-in/up, design-system) herdam o mesmo RootLayout
 * mas NÃO devem receber o shell. A lista vem de `src/lib/routes.ts`
 * (TRC-14.9), mesma fonte usada pelo Clerk middleware pra evitar divergência
 * entre "rota pública" e "rota sem shell".
 */

function isPublicPath(pathname: string | null): boolean {
  if (!pathname) return true
  if (pathname === '/') return true
  return PUBLIC_ROUTE_PREFIXES.some(
    (prefix) => prefix !== '/' && pathname.startsWith(prefix),
  )
}

type AppShellClientProps = {
  userName: string
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
      <ProductSidebar
        userName={userName}
        tier={tier}
        credits={credits}
        inboxCount={inboxCount}
        riskCount={riskCount}
        decisionCount={decisionCount}
      />
      {/* TRC-14.8 — gate desktop-first (ver Decision Log no Notion). Só
       * renderiza em <1280px e apenas dentro do shell autenticado (rotas
       * públicas saíram acima). */}
      <ViewportGate />
      {/* Sidebar flutua (fixed) e ocupa 56px base; expande em hover por cima.
       * Mantemos `pl-14` fixo para que o conteúdo nunca se desloque. */}
      <main className="pl-14">{children}</main>
    </div>
  )
}
