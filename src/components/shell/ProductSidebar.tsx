'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Logo } from '@/components/brand/Logo'
import { cn } from '@/lib/utils'

import { CreditsChip } from './CreditsChip'
import { TierBadge, type PlatformTier } from './TierBadge'
import { UserChip } from './UserChip'

/**
 * TRC-14.4 / TRC-14.9 — ProductSidebar: nav global de produto 56/224px
 * (modelo Linear/Notion). Nome explícito pra deixar claro que é a nav do app
 * autenticado — não uma primitiva genérica de UI.
 *
 * Espelha 1:1 `Spec/Jornada Coleta inicial/src/sidebar.jsx`:
 *   - 56px colapsada (default), 224px expandida no hover (200ms ease).
 *   - Header com logo mark (colapsada) ou wordmark (expandida) + badge de tier.
 *   - Nav contextual: "Projetos" sempre; `/project/*` adiciona Especificação,
 *     Decisões, Riscos, Inbox (com contadores opcionais).
 *   - Footer com CreditsChip + UserChip.
 *   - Active indicator: barra vertical 3px brand-primary à esquerda do item.
 *
 * Flutua sobre o conteúdo: quando expande, cobre temporariamente sem empurrar
 * o `<main>` (AppShellClient mantém `pl-14` fixo).
 */

export type ProductSidebarProps = {
  userName: string
  tier: PlatformTier
  credits: number
  inboxCount?: number
  riskCount?: number
  decisionCount?: number
  className?: string
}

type NavItem = {
  id: string
  label: string
  href: string
  icon: React.ReactNode
  count?: number
  /** Quando `true`, badge fica destacado (primary). Usado em Inbox com itens. */
  highlightCount?: boolean
}

function isProjectRoute(pathname: string | null): boolean {
  return typeof pathname === 'string' && pathname.startsWith('/project/')
}

function projectIdFromPathname(pathname: string | null): string | null {
  if (!pathname) return null
  const match = pathname.match(/^\/project\/([^/]+)/)
  return match ? (match[1] ?? null) : null
}

/** Ícones inline (stroke currentColor) para herdar cor por estado. */
const ICONS = {
  folder: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  ),
  fileText: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8M8 17h8M8 9h2" />
    </svg>
  ),
  gavel: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m14 13-7.5 7.5a2.12 2.12 0 0 1-3-3L11 10" />
      <path d="m16 16 6-6" />
      <path d="m8 8 6-6" />
      <path d="m9 7 8 8" />
      <path d="m21 11-8-8" />
    </svg>
  ),
  shield: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5z" />
    </svg>
  ),
  inbox: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  ),
} as const

function buildNavItems(params: {
  isProjectActive: boolean
  projectId: string | null
  inboxCount: number
  riskCount: number
  decisionCount: number
}): NavItem[] {
  const base: NavItem[] = [
    {
      id: 'projetos',
      label: 'Projetos',
      href: '/dashboard',
      icon: ICONS.folder,
    },
  ]

  if (!params.isProjectActive || !params.projectId) return base

  const projectBase = `/project/${params.projectId}`
  return [
    ...base,
    {
      id: 'especificacao',
      label: 'Especificação',
      href: `${projectBase}/especificacao`,
      icon: ICONS.fileText,
    },
    {
      id: 'decisoes',
      label: 'Decisões',
      href: `${projectBase}/decisoes`,
      icon: ICONS.gavel,
      count: params.decisionCount,
    },
    {
      id: 'riscos',
      label: 'Riscos',
      href: `${projectBase}/riscos`,
      icon: ICONS.shield,
      count: params.riskCount,
    },
    {
      id: 'inbox',
      label: 'Inbox',
      href: `${projectBase}/inbox`,
      icon: ICONS.inbox,
      count: params.inboxCount,
      highlightCount: params.inboxCount > 0,
    },
  ]
}

function isItemActive(item: NavItem, pathname: string | null): boolean {
  if (!pathname) return false
  if (item.id === 'projetos') {
    return pathname === '/dashboard' || pathname.startsWith('/dashboard/')
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

export function ProductSidebar({
  userName,
  tier,
  credits,
  inboxCount = 0,
  riskCount = 0,
  decisionCount = 0,
  className,
}: ProductSidebarProps) {
  const pathname = usePathname()
  const [hover, setHover] = React.useState(false)

  // Controla via `data-expanded` para permitir testes determinísticos (sem
  // depender de evento real de hover fora do jsdom).
  const expanded = hover

  const projectActive = isProjectRoute(pathname)
  const projectId = projectIdFromPathname(pathname)

  const items = React.useMemo(
    () =>
      buildNavItems({
        isProjectActive: projectActive,
        projectId,
        inboxCount,
        riskCount,
        decisionCount,
      }),
    [projectActive, projectId, inboxCount, riskCount, decisionCount],
  )

  return (
    <aside
      aria-label="Navegação principal"
      data-expanded={expanded}
      data-testid="app-sidebar"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={(event) => {
        // Mantém expandida enquanto algum filho estiver focado.
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setHover(false)
        }
      }}
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-line bg-surface transition-[width] duration-200 ease-out overflow-hidden',
        expanded ? 'w-56' : 'w-14',
        className,
      )}
    >
      {/* Header */}
      <div className="flex h-14 items-center border-b border-line px-3">
        <Link
          href="/dashboard"
          aria-label="Ir para Projetos"
          className="flex w-full items-center gap-2 rounded-brand-sm focus-visible:outline-2 focus-visible:outline-brand-primary focus-visible:outline-offset-2"
        >
          {expanded ? (
            <Logo variant="wordmark" size={120} />
          ) : (
            <Logo variant="mark" size={24} />
          )}
        </Link>
      </div>

      {/* Tier badge */}
      <div
        className={cn(
          'border-b border-line px-3 py-2',
          expanded ? 'flex justify-start' : 'flex justify-center',
        )}
      >
        <TierBadge tier={tier} compact={!expanded} />
      </div>

      {/* Nav items */}
      <nav
        aria-label="Seções"
        className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3"
      >
        <ul className="flex flex-col gap-0.5">
          {items.map((item) => {
            const active = isItemActive(item, pathname)
            return (
              <li key={item.id}>
                <SideItem item={item} active={active} expanded={expanded} />
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="flex flex-col gap-1 border-t border-line p-2">
        <div className={cn('flex', expanded ? 'justify-start' : 'justify-center')}>
          <CreditsChip balance={credits} compact={!expanded} />
        </div>
        <UserChip
          name={userName}
          tier={tier}
          compact={!expanded}
        />
      </div>
    </aside>
  )
}

type SideItemProps = {
  item: NavItem
  active: boolean
  expanded: boolean
}

function SideItem({ item, active, expanded }: SideItemProps) {
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      data-active={active}
      className={cn(
        'relative flex h-9 items-center gap-2.5 rounded-brand-md px-2.5 text-[13px] transition-colors',
        'focus-visible:outline-2 focus-visible:outline-brand-primary focus-visible:outline-offset-2',
        active
          ? 'bg-brand-primary-light text-brand-primary font-medium'
          : 'text-ink-secondary hover:bg-surface-muted hover:text-ink',
      )}
    >
      {active && (
        <span
          aria-hidden
          className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-brand-primary"
          data-testid="active-indicator"
        />
      )}
      <span className="flex h-4 w-4 shrink-0 items-center justify-center">
        {item.icon}
      </span>
      {expanded && (
        <span className="flex-1 truncate">{item.label}</span>
      )}
      {expanded && item.count !== undefined && item.count > 0 && (
        <span
          data-testid={`count-${item.id}`}
          className={cn(
            'inline-flex min-w-4 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
            item.highlightCount
              ? 'bg-brand-primary text-white'
              : 'bg-surface-muted text-ink-tertiary',
          )}
        >
          {item.count}
        </span>
      )}
      {!expanded && item.highlightCount && (item.count ?? 0) > 0 && (
        <span
          aria-hidden
          data-testid={`dot-${item.id}`}
          className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-brand-primary"
        />
      )}
    </Link>
  )
}
