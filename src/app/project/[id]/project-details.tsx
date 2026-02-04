'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
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
  uxPlan: JsonValue | null
  businessPlanApproved: boolean
  technicalPlanApproved: boolean
  uxPlanApproved: boolean
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
  const [status, setStatus] = useState(project.status)
  const [businessPlan, setBusinessPlan] = useState(project.businessPlan)
  const [technicalPlan, setTechnicalPlan] = useState(project.technicalPlan)
  const [uxPlan, setUxPlan] = useState(project.uxPlan)
  const [businessPlanApproved, setBusinessPlanApproved] = useState(project.businessPlanApproved)
  const [technicalPlanApproved, setTechnicalPlanApproved] = useState(project.technicalPlanApproved)
  const [uxPlanApproved, setUxPlanApproved] = useState(project.uxPlanApproved)
  const [discoveryProgress, setDiscoveryProgress] = useState<{ current: number; total: number } | null>(null)
  const [isApproving, setIsApproving] = useState(false)

  const searchParams = useSearchParams()
  const githubJustConnected = searchParams.get('github') === 'connected'
  const connectionError = searchParams.get('error') === 'github_auth_failed'

  // Clear URL params after reading (single-use flags)
  useEffect(() => {
    if (searchParams.get('github') || searchParams.get('error')) {
      const url = new URL(window.location.href)
      url.searchParams.delete('github')
      url.searchParams.delete('error')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])

  // If there's a connection error, show it; otherwise honour githubJustConnected
  const effectiveGithubConnected = connectionError ? false : githubJustConnected

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

  const technicalPlanStr = technicalPlan
    ? (typeof technicalPlan === 'string'
        ? technicalPlan
        : JSON.stringify(technicalPlan, null, 2))
    : null

  const uxPlanStr = uxPlan
    ? (typeof uxPlan === 'string'
        ? uxPlan
        : JSON.stringify(uxPlan, null, 2))
    : null

  const handlePlanReady = (plan: Record<string, unknown>) => {
    setBusinessPlan(plan as JsonValue)
    setStatus('PLANNING')
  }

  const handleProgressUpdate = (progress: { current: number; total: number }) => {
    setDiscoveryProgress(progress)
  }

  const handleApprovePlan = async (planType: 'business' | 'technical' | 'ux') => {
    if (isApproving) return
    setIsApproving(true)

    try {
      const response = await fetch(`/api/projects/${project.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.message || 'Falha ao aprovar plano')
      }

      const data = await response.json()

      if (planType === 'business') {
        setBusinessPlanApproved(true)
        setTechnicalPlan(data.technicalPlan as JsonValue)
      } else if (planType === 'technical') {
        setTechnicalPlanApproved(true)
        setUxPlan(data.uxPlan as JsonValue)
      } else {
        setUxPlanApproved(true)
        setStatus('CONNECTING')
      }
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
        uxPlan={uxPlanStr}
        businessPlanApproved={businessPlanApproved}
        technicalPlanApproved={technicalPlanApproved}
        uxPlanApproved={uxPlanApproved}
        repoUrl={project.githubRepoUrl}
        deployUrl={project.productionUrl}
        discoveryProgress={discoveryProgress}
        onApprove={() => handleApprovePlan('business')}
        onApproveTechnicalPlan={() => handleApprovePlan('technical')}
        onApproveUxPlan={() => handleApprovePlan('ux')}
        isApproving={isApproving}
        hasGitHubToken={hasGitHub}
        githubJustConnected={effectiveGithubConnected}
        hasOAuthError={connectionError}
      />
    </ProjectLayout>
  )
}
