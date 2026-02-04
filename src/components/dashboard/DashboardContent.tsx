'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'
import { StatsRow } from './StatsRow'
import { FilterTabs, FilterType, SortType } from './FilterTabs'
import { ProjectCard } from './ProjectCard'
import { QuickActions } from './QuickActions'
import { CreateProjectModal, DeleteProjectModal } from './ProjectModals'

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  updatedAt: Date
}

interface DashboardContentProps {
  projects: Project[]
}

export function DashboardContent({ projects }: DashboardContentProps) {
  const router = useRouter()
  const toast = useToast()
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [sortBy, setSortBy] = useState<SortType>('recent')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Calculate stats
  const stats = useMemo(() => {
    const total = projects.length
    const online = projects.filter((p) => p.status === 'LIVE').length
    const inProgress = projects.filter((p) =>
      ['IDEATION', 'PLANNING', 'CONNECTING', 'GENERATING', 'DEPLOYING'].includes(p.status)
    ).length
    return {
      total,
      online,
      inProgress,
      avgTime: '~12h', // TODO: Calculate from actual data
    }
  }, [projects])

  // Calculate filter counts
  const filterCounts = useMemo(() => ({
    all: projects.length,
    inProgress: projects.filter((p) =>
      ['IDEATION', 'PLANNING', 'CONNECTING', 'GENERATING', 'DEPLOYING'].includes(p.status)
    ).length,
    completed: projects.filter((p) => p.status === 'LIVE').length,
    archived: 0, // TODO: Add archived status
  }), [projects])

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let result = [...projects]

    // Filter
    switch (activeFilter) {
      case 'in_progress':
        result = result.filter((p) =>
          ['IDEATION', 'PLANNING', 'CONNECTING', 'GENERATING', 'DEPLOYING'].includes(p.status)
        )
        break
      case 'completed':
        result = result.filter((p) => p.status === 'LIVE')
        break
      case 'archived':
        result = [] // TODO: Add archived status
        break
    }

    // Sort
    switch (sortBy) {
      case 'oldest':
        result.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())
        break
      case 'alphabetical':
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'phase':
        const phaseOrder = ['IDEATION', 'PLANNING', 'CONNECTING', 'GENERATING', 'DEPLOYING', 'LIVE']
        result.sort((a, b) => phaseOrder.indexOf(a.status) - phaseOrder.indexOf(b.status))
        break
      default: // recent
        result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    }

    return result
  }, [projects, activeFilter, sortBy])

  // Get last in-progress project for quick actions
  const lastProject = useMemo(() => {
    const inProgress = projects.find((p) =>
      ['IDEATION', 'PLANNING', 'CONNECTING', 'GENERATING', 'DEPLOYING'].includes(p.status)
    )
    if (!inProgress) return null
    const phaseMap: Record<string, string> = {
      IDEATION: 'Fase 1: Ideacao',
      PLANNING: 'Fase 2: Planejamento',
      CONNECTING: 'Fase 3: Conexao',
      GENERATING: 'Fase 4: Geracao',
      DEPLOYING: 'Fase 5: Deploy',
    }
    return {
      id: inProgress.id,
      name: inProgress.name,
      phase: phaseMap[inProgress.status] || inProgress.status,
    }
  }, [projects])

  // Handle create project
  const handleCreate = async (name: string, description: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      })

      if (!response.ok) {
        throw new Error('Failed to create project')
      }

      const project = await response.json()
      setCreateModalOpen(false)
      toast.success('Projeto criado com sucesso!')
      router.push(`/project/${project.id}`)
    } catch (error) {
      console.error('Error creating project:', error)
      toast.error('Erro ao criar projeto. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle delete project
  const handleDelete = async () => {
    if (!deleteModal) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/projects/${deleteModal.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Delete failed:', response.status, errorData)
        throw new Error(errorData.error || 'Failed to delete project')
      }

      setDeleteModal(null)
      toast.success('Projeto excluido com sucesso!')
      router.refresh()
    } catch (error) {
      console.error('Error deleting project:', error)
      const message = error instanceof Error ? error.message : 'Erro desconhecido'
      toast.error(`Erro ao excluir projeto: ${message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <main className="mx-auto max-w-7xl px-8 py-8">
        {/* Title Row */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Meus Projetos</h1>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Novo projeto
          </button>
        </div>

        {/* Stats */}
        <StatsRow stats={stats} />

        {/* Filters */}
        <FilterTabs
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          counts={filterCounts}
        />

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed bg-white p-12 text-center">
            {activeFilter === 'all' ? (
              <>
                <h2 className="text-xl font-semibold text-gray-900">Nenhum projeto ainda</h2>
                <p className="mt-2 text-gray-500">
                  Crie seu primeiro projeto para começar
                </p>
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  + Criar projeto
                </button>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-gray-900">Nenhum projeto nesta categoria</h2>
                <p className="mt-2 text-gray-500">
                  Tente outro filtro ou crie um novo projeto
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                id={project.id}
                name={project.name}
                description={project.description}
                status={project.status}
                updatedAt={project.updatedAt}
                onDelete={(id, name) => setDeleteModal({ id, name })}
              />
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <QuickActions
          lastProject={lastProject}
          onCreateNew={() => setCreateModalOpen(true)}
        />
      </main>

      {/* Modals */}
      <CreateProjectModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreate}
        isLoading={isLoading}
      />

      <DeleteProjectModal
        isOpen={!!deleteModal}
        projectName={deleteModal?.name || ''}
        onClose={() => setDeleteModal(null)}
        onConfirm={handleDelete}
        isLoading={isLoading}
      />
    </>
  )
}
