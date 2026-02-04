'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

const PHASES = [
  'Ideacao',
  'Planejamento',
  'Conexao',
  'Geracao',
  'Deploy',
  'Online',
]

interface ProjectCardProps {
  id: string
  name: string
  description?: string | null
  status: string
  updatedAt: Date
  onDelete?: (id: string, name: string) => void
}

export function ProjectCard({
  id,
  name,
  description,
  status,
  updatedAt,
  onDelete,
}: ProjectCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Map status to phase index (0-5)
  const phaseIndex = getPhaseIndex(status)
  const phaseName = PHASES[phaseIndex] || 'Ideacao'

  // Format relative time
  const timeAgo = formatTimeAgo(updatedAt)

  return (
    <div className="group relative rounded-lg border bg-white p-4 transition-shadow hover:shadow-md">
      {/* Menu Button */}
      <div ref={menuRef} className="absolute right-4 top-4">
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setMenuOpen(!menuOpen)
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          aria-label="Menu de opcoes"
        >
          <span className="text-xl leading-none">&#8942;</span>
        </button>

        {/* Dropdown Menu */}
        {menuOpen && (
          <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border bg-white py-1 shadow-lg">
            <Link
              href={`/project/${id}`}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setMenuOpen(false)}
            >
              <span>&#9998;</span> Editar
            </Link>
            <Link
              href={`/project/${id}`}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setMenuOpen(false)}
            >
              <span>&#128065;</span> Ver detalhes
            </Link>
            <div className="my-1 border-t" />
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setMenuOpen(false)
                onDelete?.(id, name)
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <span>&#128465;</span> Excluir
            </button>
          </div>
        )}
      </div>

      {/* Card Content - Clickable */}
      <Link href={`/project/${id}`} className="block">
        {/* Project Name */}
        <h3 className="mb-2 pr-10 text-base font-semibold text-gray-900">
          {name}
        </h3>

        {/* Description */}
        {description && (
          <p className="mb-4 line-clamp-2 text-sm text-gray-500">
            {description}
          </p>
        )}

        {/* Progress */}
        <div className="mb-3">
          <div className="mb-2 flex gap-2">
            {PHASES.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full ${
                  index < phaseIndex
                    ? 'bg-green-500'
                    : index === phaseIndex
                      ? 'bg-blue-600'
                      : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <div className="text-sm text-gray-600">
            Fase {phaseIndex + 1}: {phaseName}
            {status === 'LIVE' && ' ✨'}
          </div>
        </div>

        {/* Meta */}
        <div className="text-xs text-gray-400">Atualizado {timeAgo}</div>
      </Link>
    </div>
  )
}

function getPhaseIndex(status: string): number {
  const statusMap: Record<string, number> = {
    IDEATION: 0,
    PLANNING: 1,
    CONNECTING: 2,
    GENERATING: 3,
    DEPLOYING: 4,
    LIVE: 5,
  }
  return statusMap[status] ?? 0
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'agora'
  if (diffMins < 60) return `ha ${diffMins} min`
  if (diffHours < 24) return `ha ${diffHours}h`
  if (diffDays === 1) return 'ontem'
  if (diffDays < 7) return `ha ${diffDays} dias`
  return new Date(date).toLocaleDateString('pt-BR')
}
