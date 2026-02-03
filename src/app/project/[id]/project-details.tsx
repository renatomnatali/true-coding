'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProjectLayout } from '@/components/project/ProjectLayout'
import { ProjectSidebar } from '@/components/project/ProjectSidebar'
import { ChatPanel } from '@/components/project/ChatPanel'
import { WorkspacePanel } from '@/components/project/WorkspacePanel'
import type { JsonValue } from '@prisma/client/runtime/library'

interface Message {
  id: string
  role: 'USER' | 'ASSISTANT' | 'SYSTEM'
  content: string
  createdAt: Date
}

interface Conversation {
  id: string
  phase: string
  status: string
  currentQuestion: number | null
  completedQuestions: number[]
  messages: Message[]
}

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
  conversations: Conversation[]
}

interface ProjectDetailsProps {
  project: Project
}

export function ProjectDetails({ project }: ProjectDetailsProps) {
  const router = useRouter()
  const [status, setStatus] = useState(project.status)
  const [businessPlan, setBusinessPlan] = useState(project.businessPlan)
  const [discoveryProgress, setDiscoveryProgress] = useState<{ current: number; total: number } | null>(null)
  const [isApproving, setIsApproving] = useState(false)

  const hasGitHub = !!project.user.githubUsername
  const hasVercel = !!project.productionUrl

  // STATE RESTORATION: Derive initial state from database (per docs/ux/STATES.md)
  const discoveryConversation = project.conversations?.[0] || null

  // REGRA CP-05/CP-06: Initial messages from database, not empty
  const initialMessages = discoveryConversation?.messages.map(m => ({
    id: m.id,
    role: m.role.toLowerCase() as 'user' | 'assistant',
    content: m.content,
  })) || []

  // REGRA: If businessPlan exists, plan is ready
  const initialPlanReady = project.businessPlan !== null

  // REGRA: Progress from database, not default
  const initialQuestionProgress = discoveryConversation
    ? {
        current: discoveryConversation.currentQuestion ?? 1,
        total: 5,
        completedQuestions: discoveryConversation.completedQuestions ?? [],
      }
    : null

  // Convert JSON plans to string for display
  const businessPlanStr = businessPlan
    ? (typeof businessPlan === 'string'
        ? businessPlan
        : JSON.stringify(businessPlan, null, 2))
    : null

  const technicalPlanStr = project.technicalPlan
    ? (typeof project.technicalPlan === 'string'
        ? project.technicalPlan
        : JSON.stringify(project.technicalPlan, null, 2))
    : null

  const handlePlanReady = (plan: Record<string, unknown>) => {
    setBusinessPlan(plan as JsonValue)
    setStatus('PLANNING')
  }

  const handleProgressUpdate = (progress: { current: number; total: number }) => {
    setDiscoveryProgress(progress)
  }

  const handleApprove = async () => {
    if (isApproving) return
    setIsApproving(true)

    try {
      // Update project status to next phase
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONNECTING' }),
      })

      if (!response.ok) {
        throw new Error('Falha ao aprovar plano')
      }

      setStatus('CONNECTING')
      router.refresh()
    } catch (error) {
      console.error('Erro ao aprovar plano:', error)
      alert('Erro ao aprovar plano. Tente novamente.')
    } finally {
      setIsApproving(false)
    }
  }

  return (
    <ProjectLayout
      sidebar={
        <ProjectSidebar
          projectId={project.id}
          projectName={project.name}
          status={status}
          hasGitHub={hasGitHub}
          hasVercel={hasVercel}
          repoUrl={project.githubRepoUrl}
          deployUrl={project.productionUrl}
        />
      }
      chat={
        <ChatPanel
          projectId={project.id}
          projectName={project.name}
          initialMessages={initialMessages}
          initialPlanReady={initialPlanReady}
          initialQuestionProgress={initialQuestionProgress}
          onPlanReady={handlePlanReady}
          onProgressUpdate={handleProgressUpdate}
        />
      }
    >
      <WorkspacePanel
        projectId={project.id}
        projectName={project.name}
        status={status}
        businessPlan={businessPlanStr}
        technicalPlan={technicalPlanStr}
        repoUrl={project.githubRepoUrl}
        deployUrl={project.productionUrl}
        discoveryProgress={discoveryProgress}
        onApprove={handleApprove}
      />
    </ProjectLayout>
  )
}
