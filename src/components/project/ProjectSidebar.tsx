'use client'

import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { useProjectLayout } from './ProjectLayout'

// Phase configuration matching the mockup
const PHASES = [
  { key: 'IDEATION', label: 'Ideacao', number: 1 },
  { key: 'PLANNING', label: 'Planejamento', number: 2 },
  { key: 'CONNECTING', label: 'Conexao', number: 3 },
  { key: 'GENERATING', label: 'Geracao', number: 4 },
  { key: 'DEPLOYING', label: 'Deploy', number: 5 },
  { key: 'LIVE', label: 'Online', number: 6 },
] as const

type PhaseKey = (typeof PHASES)[number]['key']

// Get phase state based on current status
function getPhaseState(
  phaseKey: PhaseKey,
  currentStatus: string
): 'completed' | 'in-progress' | 'blocked' {
  const currentIndex = PHASES.findIndex((p) => p.key === currentStatus)
  const phaseIndex = PHASES.findIndex((p) => p.key === phaseKey)

  if (phaseIndex < currentIndex) return 'completed'
  if (phaseIndex === currentIndex) return 'in-progress'
  return 'blocked'
}

// Get current phase number (1-6)
function getCurrentPhaseNumber(status: string): number {
  const phase = PHASES.find((p) => p.key === status)
  return phase?.number ?? 1
}

interface ProjectSidebarProps {
  projectId: string
  projectName: string
  status: string
  hasGitHub: boolean
  hasVercel: boolean
  repoUrl?: string | null
  deployUrl?: string | null
}

export function ProjectSidebar({
  projectId: _projectId,
  projectName,
  status,
  hasGitHub: _hasGitHub,
  hasVercel: _hasVercel,
  repoUrl: _repoUrl,
  deployUrl: _deployUrl,
}: ProjectSidebarProps) {
  const { setSidebarOpen } = useProjectLayout()
  const { user } = useUser()

  const closeOnMobile = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }

  // User info
  const userName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName || user?.username || 'Usuario'
  const userEmail = user?.primaryEmailAddress?.emailAddress || ''
  const userInitials =
    user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`
      : user?.firstName?.[0] || 'U'

  const currentPhaseNumber = getCurrentPhaseNumber(status)

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b p-5">
        {/* Logo */}
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-xs font-bold text-white">
            TC
          </div>
          <span className="text-lg font-bold text-blue-600">True Coding</span>
        </div>

        {/* Project Name */}
        <div className="mb-2 text-sm font-semibold text-gray-900">{projectName}</div>

        {/* Back Link */}
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700"
          onClick={closeOnMobile}
        >
          ← Dashboard
        </Link>

        {/* Journey Progress */}
        <div className="mt-4 rounded-md bg-gray-50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              JORNADA
            </span>
            <span className="text-sm font-semibold text-gray-900">
              Fase {currentPhaseNumber}/6
            </span>
          </div>
          <div className="flex gap-2">
            {PHASES.map((phase) => {
              const state = getPhaseState(phase.key, status)
              return (
                <div
                  key={phase.key}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    state === 'completed'
                      ? 'bg-emerald-500'
                      : state === 'in-progress'
                        ? 'bg-blue-600'
                        : 'bg-gray-300'
                  }`}
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
          FASES
        </div>
        <ul className="space-y-1">
          {PHASES.map((phase) => {
            const state = getPhaseState(phase.key, status)
            return (
              <li key={phase.key}>
                <PhaseNavItem
                  label={phase.label}
                  state={state}
                  onClick={closeOnMobile}
                />
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer - User Info */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-gray-50">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
            {userInitials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-gray-900">{userName}</div>
            <div className="truncate text-xs text-gray-500">{userEmail}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface PhaseNavItemProps {
  label: string
  state: 'completed' | 'in-progress' | 'blocked'
  onClick?: () => void
}

function PhaseNavItem({ label, state, onClick }: PhaseNavItemProps) {
  const baseClasses =
    'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors'

  const stateClasses = {
    'in-progress': 'bg-blue-50 font-medium text-blue-600',
    completed: 'text-emerald-600 hover:bg-gray-50',
    blocked: 'cursor-not-allowed text-gray-400 opacity-50',
  }

  const iconClasses = {
    'in-progress': 'text-blue-600',
    completed: 'text-emerald-500',
    blocked: 'text-gray-400',
  }

  // Phase icons using unicode characters like in the mockup
  const icons = {
    'in-progress': '◐',
    completed: '✓',
    blocked: '○',
  }

  return (
    <button
      className={`${baseClasses} ${stateClasses[state]}`}
      onClick={state !== 'blocked' ? onClick : undefined}
      disabled={state === 'blocked'}
    >
      <span className={`text-base ${iconClasses[state]}`}>{icons[state]}</span>
      <span>{label}</span>
    </button>
  )
}
