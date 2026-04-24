import type { ReactNode } from 'react'

import type { PlatformTier } from './TierBadge'
import { AppShellClient } from './AppShellClient'

/**
 * TRC-14.4 — Shell global da aplicação autenticada.
 *
 * Server component: consulta Clerk + Prisma uma vez por request para obter
 * nome, tier e saldo de créditos do usuário, e repassa à sidebar via props.
 * O filtro de rotas públicas (não renderizar em `/`, `/sign-in`, `/sign-up`,
 * `/design-system`) é feito no client (`AppShellClient`) com `usePathname`,
 * porque esses segmentos compartilham o mesmo `RootLayout`.
 *
 * Falhas de auth/DB degradam para valores default seguros (usuário "Você",
 * tier TRIAL, 0 créditos) em vez de quebrar a página.
 */

type ShellData = {
  userName: string
  userInitial: string | undefined
  tier: PlatformTier
  credits: number
}

async function loadShellData(): Promise<ShellData> {
  const fallback: ShellData = {
    userName: 'Você',
    userInitial: undefined,
    tier: 'TRIAL',
    credits: 0,
  }

  try {
    // Imports dinâmicos: em ambiente sem Clerk configurado (CI builds), os
    // módulos falham na resolução — degradamos para o fallback.
    const { auth, clerkClient } = await import('@clerk/nextjs/server')
    const { prisma } = await import('@/lib/db/prisma')

    const { userId } = await auth()
    if (!userId) return fallback

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { creditLedger: true },
    })

    let name = user?.name ?? undefined
    if (!name) {
      try {
        const client = await clerkClient()
        const clerkUser = await client.users.getUser(userId)
        const first = clerkUser.firstName ?? ''
        const last = clerkUser.lastName ?? ''
        name = `${first} ${last}`.trim() || clerkUser.username || undefined
      } catch {
        // Ignora e cai no fallback textual.
      }
    }

    return {
      userName: name ?? fallback.userName,
      userInitial: undefined,
      tier: (user?.creditLedger?.tier ?? 'TRIAL') as PlatformTier,
      credits: user?.creditLedger?.balance ?? 0,
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[AppShell] falhou ao carregar dados do usuário:', error)
    }
    return fallback
  }
}

export async function AppShell({ children }: { children: ReactNode }) {
  const data = await loadShellData()

  return (
    <AppShellClient
      userName={data.userName}
      userInitial={data.userInitial}
      tier={data.tier}
      credits={data.credits}
    >
      {children}
    </AppShellClient>
  )
}
