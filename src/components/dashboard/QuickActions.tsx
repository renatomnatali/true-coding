'use client'

import Link from 'next/link'

interface QuickAction {
  icon: string
  label: string
  hint: string
  href?: string
  onClick?: () => void
}

interface QuickActionsProps {
  lastProject?: {
    id: string
    name: string
    phase: string
  } | null
  onCreateNew?: () => void
}

export function QuickActions({ lastProject, onCreateNew }: QuickActionsProps) {
  const actions: QuickAction[] = [
    ...(lastProject
      ? [
          {
            icon: '▶️',
            label: `Continuar "${truncate(lastProject.name, 15)}"`,
            hint: `${lastProject.phase} em andamento`,
            href: `/project/${lastProject.id}`,
          },
        ]
      : []),
    {
      icon: '📋',
      label: 'Duplicar projeto',
      hint: 'Use como base para novo app',
      onClick: onCreateNew,
    },
    {
      icon: '📚',
      label: 'Ver tutoriais',
      hint: 'Aprenda a usar a plataforma',
      href: '#',
    },
    {
      icon: '🎨',
      label: 'Explorar templates',
      hint: 'Comece com projetos prontos',
      href: '#',
    },
  ]

  return (
    <div className="mt-8 rounded-lg border bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Acoes rapidas
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((action, index) => (
          <QuickActionButton key={index} action={action} />
        ))}
      </div>
    </div>
  )
}

function QuickActionButton({ action }: { action: QuickAction }) {
  const className =
    'flex items-center gap-3 rounded-lg border bg-gray-50 px-4 py-3 text-left transition-all hover:border-blue-500 hover:bg-blue-50'

  const content = (
    <>
      <span className="text-lg">{action.icon}</span>
      <div>
        <div className="text-sm font-medium text-gray-900">{action.label}</div>
        <div className="text-xs text-gray-500">{action.hint}</div>
      </div>
    </>
  )

  if (action.href) {
    return (
      <Link href={action.href} className={className}>
        {content}
      </Link>
    )
  }

  return (
    <button onClick={action.onClick} className={className}>
      {content}
    </button>
  )
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '...'
}
