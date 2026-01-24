'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { GenerationProgress } from '@/components/project/GenerationProgress'
import {
  Github,
  ExternalLink,
  FileCode,
  Rocket,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react'

import type { JsonValue } from '@prisma/client/runtime/library'

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  businessPlan: JsonValue | null
  technicalPlan: JsonValue | null
  githubRepoUrl: string | null
  productionUrl: string | null
  user: {
    githubUsername: string | null
  }
}

interface ProjectDetailsProps {
  project: Project
}

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; color: string }
> = {
  IDEATION: {
    label: 'Em ideacao',
    icon: <Clock className="h-4 w-4" />,
    color: 'text-yellow-500',
  },
  PLANNING: {
    label: 'Planejando',
    icon: <FileCode className="h-4 w-4" />,
    color: 'text-blue-500',
  },
  CONNECTING: {
    label: 'Conectando',
    icon: <Github className="h-4 w-4" />,
    color: 'text-purple-500',
  },
  GENERATING: {
    label: 'Gerando',
    icon: <Rocket className="h-4 w-4" />,
    color: 'text-orange-500',
  },
  DEPLOYING: {
    label: 'Publicando',
    icon: <Rocket className="h-4 w-4" />,
    color: 'text-blue-500',
  },
  LIVE: {
    label: 'Online',
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'text-green-500',
  },
  FAILED: {
    label: 'Falhou',
    icon: <AlertCircle className="h-4 w-4" />,
    color: 'text-red-500',
  },
}

export function ProjectDetails({ project }: ProjectDetailsProps) {
  const [showGeneration, setShowGeneration] = useState(false)
  const [repoUrl, setRepoUrl] = useState(project.githubRepoUrl)

  const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG.IDEATION
  const hasGitHub = !!project.user.githubUsername
  const hasTechnicalPlan = !!project.technicalPlan
  const canGenerate =
    hasGitHub && hasTechnicalPlan && !repoUrl && project.status !== 'GENERATING'

  const handleGenerationComplete = (url: string) => {
    setRepoUrl(url)
    setShowGeneration(false)
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <div className={`flex items-center gap-2 ${statusConfig.color}`}>
            {statusConfig.icon}
            <span className="text-sm font-medium">{statusConfig.label}</span>
          </div>
        </div>
        {project.description && (
          <p className="text-muted-foreground">{project.description}</p>
        )}
      </div>

      {/* Quick Links */}
      <div className="flex gap-4 mb-8">
        {repoUrl && (
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-10 px-4 py-2 rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground"
          >
            <Github className="h-4 w-4 mr-2" />
            Repositorio
            <ExternalLink className="h-4 w-4 ml-2" />
          </a>
        )}
        {project.productionUrl && (
          <a
            href={project.productionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-10 px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Rocket className="h-4 w-4 mr-2" />
            Ver online
            <ExternalLink className="h-4 w-4 ml-2" />
          </a>
        )}
      </div>

      {/* Generation Section */}
      {canGenerate && !showGeneration && (
        <div className="p-6 border rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-2">Gerar codigo</h2>
          <p className="text-muted-foreground mb-4">
            Seu plano tecnico esta pronto. Clique abaixo para gerar o codigo e
            criar o repositorio no GitHub.
          </p>
          <Button onClick={() => setShowGeneration(true)}>
            <Rocket className="h-4 w-4 mr-2" />
            Gerar projeto
          </Button>
        </div>
      )}

      {showGeneration && (
        <div className="mb-8">
          <GenerationProgress
            projectId={project.id}
            onComplete={handleGenerationComplete}
            onError={(error) => console.error('Generation error:', error)}
          />
        </div>
      )}

      {/* Business Plan */}
      {project.businessPlan && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Plano de Negocio</h2>
          <div className="p-4 border rounded-lg bg-muted/50">
            <pre className="text-sm overflow-x-auto">
              {JSON.stringify(project.businessPlan, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Technical Plan */}
      {project.technicalPlan && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Plano Tecnico</h2>
          <div className="p-4 border rounded-lg bg-muted/50">
            <pre className="text-sm overflow-x-auto">
              {JSON.stringify(project.technicalPlan, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Warnings */}
      {!hasGitHub && hasTechnicalPlan && (
        <div className="p-4 border border-yellow-500 rounded-lg bg-yellow-50 dark:bg-yellow-950">
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            Conecte sua conta do GitHub para gerar o codigo do projeto.
          </p>
        </div>
      )}
    </div>
  )
}
