'use client'

import { useCallback } from 'react'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { PlanReview } from './PlanReview'
import { useChat } from '@/hooks/useChat'
import { useWizardStore } from '@/stores/wizard'
import { Button } from '@/components/ui/button'
import type { BusinessPlan } from '@/types'
import { ArrowRight, Loader2 } from 'lucide-react'

interface DiscoveryWizardProps {
  onComplete: (plan: BusinessPlan) => void
}

export function DiscoveryWizard({ onComplete }: DiscoveryWizardProps) {
  const {
    currentStep,
    projectId,
    businessPlan,
    isLoading,
    setStep,
    setProjectId,
    setBusinessPlan,
    setLoading,
  } = useWizardStore()

  const {
    messages,
    isLoading: isChatLoading,
    streamingContent,
    sendMessage,
  } = useChat({
    projectId: projectId || '',
    phase: 'discovery',
    onPlanReady: (plan) => setBusinessPlan(plan),
  })

  const handleStart = useCallback(
    async (initialIdea: string) => {
      setLoading(true)
      try {
        // Create project
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Novo Projeto' }),
        })

        if (!response.ok) throw new Error('Failed to create project')

        const project = await response.json()
        setProjectId(project.id)
        setStep('chat')

        // Send initial message
        setTimeout(() => sendMessage(initialIdea), 100)
      } catch (error) {
        console.error('Error starting wizard:', error)
      } finally {
        setLoading(false)
      }
    },
    [setLoading, setProjectId, setStep, sendMessage]
  )

  const handleConfirm = useCallback(() => {
    if (businessPlan) {
      onComplete(businessPlan)
    }
  }, [businessPlan, onComplete])

  const handleEdit = useCallback(() => {
    setStep('chat')
  }, [setStep])

  // Initial step - idea input
  if (currentStep === 'initial') {
    return (
      <InitialStep onSubmit={handleStart} isLoading={isLoading} />
    )
  }

  // Chat step
  if (currentStep === 'chat') {
    return (
      <div className="h-[600px] border rounded-lg">
        <ChatWindow
          messages={messages}
          isLoading={isChatLoading}
          streamingContent={streamingContent}
          onSendMessage={sendMessage}
        />
      </div>
    )
  }

  // Review step
  if (currentStep === 'review' && businessPlan) {
    return (
      <PlanReview
        plan={businessPlan}
        onConfirm={handleConfirm}
        onEdit={handleEdit}
      />
    )
  }

  return null
}

function InitialStep({
  onSubmit,
  isLoading,
}: {
  onSubmit: (idea: string) => void
  isLoading: boolean
}) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const idea = formData.get('idea') as string
    if (idea?.trim()) {
      onSubmit(idea.trim())
    }
  }

  return (
    <div className="max-w-2xl mx-auto text-center space-y-6">
      <h1 className="text-3xl font-bold">O que voce quer criar?</h1>
      <p className="text-muted-foreground">
        Descreva sua ideia de aplicacao. Pode ser simples - vou fazer perguntas
        para entender melhor.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          name="idea"
          placeholder="Ex: Quero criar um site para gerenciar tarefas de uma equipe..."
          className="w-full h-32 p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={isLoading}
        />
        <Button type="submit" size="lg" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Criando projeto...
            </>
          ) : (
            <>
              Comecar
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
