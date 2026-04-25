'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useProjectLayout } from './ProjectLayout'
import { PlanGenerationOverlay } from './PlanGenerationOverlay'
import { ExecutionFeedPanel } from './ExecutionFeedPanel'
import { FEATURES } from '@/config/features'
import { QUICK_REPLIES_BY_QUESTION } from '@/types'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

// Render **bold** spans in assistant messages
function renderBoldSpans(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    const boldMatch = part.match(/^\*\*(.+)\*\*$/)
    if (boldMatch) {
      return <strong key={i}>{boldMatch[1]}</strong>
    }
    return <React.Fragment key={i}>{part}</React.Fragment>
  })
}

// Remove JSON from message for display
function stripJsonFromDisplay(content: string): string {
  let result = content

  // 1. Remove complete markdown JSON blocks: ```json ... ```
  result = result.replace(/```json[\s\S]*?```/g, '')

  // 2. Remove incomplete markdown JSON blocks (streaming): ```json ... (no closing)
  result = result.replace(/```json[\s\S]*$/g, '')

  // 3. Remove standalone JSON objects that look like business plans
  // Match JSON objects that contain typical plan keys
  result = result.replace(/\{[\s\S]*"(coreFeatures|name|tagline|targetAudience)"[\s\S]*\}/g, '')

  return result.trim()
}

function isPlanGenerationConfirmationMessage(content: string): boolean {
  const normalized = content.trim().toLowerCase()
  if (!normalized) return false

  const patterns = [
    /^sim[\s!.,?]*$/,
    /^ok[\s!.,?]*$/,
    /^pode[\s!.,?]*$/,
    /confirm/i,
    /ger(ar|e)\s+(o\s+)?plano/i,
    /pode\s+(gerar|criar)/i,
    /seguir\s+com\s+o\s+plano/i,
  ]

  return patterns.some((pattern) => pattern.test(normalized))
}

interface QuestionProgress {
  current: number
  total: number
  completedQuestions?: number[]
}

interface ChatPanelProps {
  projectId: string
  projectName: string
  projectStatus?: string
  initialMessages?: Message[]
  /** STATE RESTORATION: If businessPlan exists, start in "plan ready" state */
  initialPlanReady?: boolean
  /** STATE RESTORATION: Progress from database, not default */
  initialQuestionProgress?: QuestionProgress | null
  onPlanReady?: (plan: Record<string, unknown>) => void
  onProgressUpdate?: (progress: QuestionProgress) => void
}

export function ChatPanel({
  projectId,
  projectName: _projectName,
  projectStatus = 'IDEATION',
  initialMessages = [],
  initialPlanReady = false,
  initialQuestionProgress = null,
  onPlanReady,
  onProgressUpdate,
}: ChatPanelProps) {
  const { user } = useUser()
  const userName = user?.firstName || 'Você'
  const { setChatOpen } = useProjectLayout()
  // STATE RESTORATION (per docs/ux/BEHAVIORS.md - CP-05): Load messages from DB
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  // STATE RESTORATION (per docs/ux/BEHAVIORS.md - CP-06): Progress from DB, not default
  const [questionProgress, setQuestionProgress] = useState<QuestionProgress | null>(initialQuestionProgress)
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false)
  // STATE RESTORATION (per docs/ux/BEHAVIORS.md - CP-01/02): If businessPlan exists, start in "plan ready"
  const [planReady, setPlanReady] = useState(initialPlanReady)
  const executionFeedEnabled =
    FEATURES.EXECUTION_CHAT_FEED && FEATURES.AUTONOMOUS_DEVELOPMENT_V1
  const [activeTab, setActiveTab] = useState<'discovery' | 'execution'>(
    executionFeedEnabled &&
    (projectStatus === 'GENERATING' || projectStatus === 'DEPLOYING')
      ? 'execution'
      : 'discovery'
  )
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const hasRespondedOnce = useRef(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!executionFeedEnabled) {
      setActiveTab('discovery')
      return
    }

    if (projectStatus === 'GENERATING' || projectStatus === 'DEPLOYING') {
      setActiveTab('execution')
    }
  }, [executionFeedEnabled, projectStatus])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [input])

  // Focus input after AI finishes responding (não no mount com mensagens restauradas)
  useEffect(() => {
    if (hasRespondedOnce.current && !isLoading) {
      textareaRef.current?.focus()
    }
  }, [isLoading])

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

    const completedCount = questionProgress?.completedQuestions?.length || 0
    const isConfirmationPhase = completedCount >= 5
    const shouldStartPlanGeneration =
      isConfirmationPhase &&
      !planReady &&
      isPlanGenerationConfirmationMessage(content)

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setIsGeneratingPlan(shouldStartPlanGeneration)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          message: content.trim(),
          phase: 'discovery',
        }),
      })

      if (!response.ok) throw new Error('Failed to send message')

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
      }

      setMessages((prev) => [...prev, assistantMessage])

      const decoder = new TextDecoder()
      let fullContent = ''
      let currentEvent = 'text'

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          // Parse event type
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim()
            console.log('[CHAT] Event type:', currentEvent)
            continue
          }

          // Parse data
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              console.log('[CHAT] Parsed data for event', currentEvent, ':', parsed)

              // Handle based on event type
              if (currentEvent === 'text' && parsed.content) {
                fullContent += parsed.content
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessage.id
                      ? { ...m, content: fullContent }
                      : m
                  )
                )
              } else if (currentEvent === 'question_progress' && parsed.progress) {
                console.log('[CHAT] Question progress update:', parsed.progress)
                setQuestionProgress(parsed.progress)
                // Notify parent component
                onProgressUpdate?.(parsed.progress)
              } else if (currentEvent === 'plan_ready' && parsed.plan) {
                console.log('[CHAT] Plan ready detected! Plan:', parsed.plan)
                setIsGeneratingPlan(false)
                setPlanReady(true)
                // Add a separate confirmation message (don't replace the streamed content — stripJsonFromDisplay handles display)
                setMessages((prev) => [
                  ...prev,
                  {
                    id: crypto.randomUUID(),
                    role: 'assistant' as const,
                    content: 'Plano gerado com sucesso! Veja o resumo ao lado e me diga se quer ajustar algo.',
                  },
                ])
                onPlanReady?.(parsed.plan)
              }
              // 'done' and 'error' events are handled implicitly
            } catch (e) {
              console.log('[CHAT] Failed to parse JSON:', data, e)
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Desculpe, ocorreu um erro. Tente novamente.',
        },
      ])
    } finally {
      hasRespondedOnce.current = true
      setIsLoading(false)
      setIsGeneratingPlan(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  // STATE DERIVATION (per docs/ux/STATES.md):
  // Get current question from progress, falling back to initial state
  const currentQuestionNumber = questionProgress?.current
    ?? (messages.length === 0 ? 0 : 1)

  // CONFIRMATION PHASE: Check if all 5 questions are completed
  const completedCount = questionProgress?.completedQuestions?.length || 0
  const isConfirmationPhase = completedCount >= 5

  // PROGRESS BAR RULES (per docs/ux/BEHAVIORS.md):
  // - 100% when plan is ready
  // - 100% when in confirmation phase (completed >= 5)
  // - Otherwise: (current / total) * 100
  // - Default: 20% (question 1)
  const progressPercent = planReady || isConfirmationPhase
    ? 100
    : questionProgress
      ? (questionProgress.current / questionProgress.total) * 100
      : 20

  // QUICK REPLIES RULES (per docs/ux/BEHAVIORS.md):
  // - CP-01: Se businessPlan existe → NÃO mostrar
  // - CP-03: Se completedQuestions.length >= 5 → NÃO mostrar (confirmação)
  const showQuickReplies = !planReady && !isConfirmationPhase && currentQuestionNumber <= 5
  const quickReplies = showQuickReplies
    ? (QUICK_REPLIES_BY_QUESTION[currentQuestionNumber] || [])
    : []

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-white">
      {/* Header - matching mockup */}
      <div className="border-b p-4">
        <div className="mb-3 flex items-center justify-between">
          {executionFeedEnabled ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('discovery')}
                className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
                  activeTab === 'discovery'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Discovery
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('execution')}
                className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
                  activeTab === 'execution'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Execução
              </button>
            </div>
          ) : (
            <h2 className="text-lg font-semibold text-gray-900">Discovery</h2>
          )}
          <button
            onClick={() => setChatOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
            title="Colapsar chat"
          >
            ◀
          </button>
        </div>
        {/* Progress Bar - visual like mockup */}
        {activeTab === 'discovery' && FEATURES.PROGRESS_TRACKING && (
          <div className="flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="whitespace-nowrap text-sm font-medium text-gray-600">
              {planReady
                ? 'Plano pronto'
                : `Pergunta ${questionProgress?.current || 1} de ${questionProgress?.total || 5}`}
            </span>
          </div>
        )}
      </div>

      {/* Messages - matching mockup */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'execution' ? (
          <ExecutionFeedPanel
            projectId={projectId}
            projectStatus={projectStatus}
          />
        ) : messages.length === 0 && !planReady ? (
          <div className="flex flex-col gap-3">
            {/* Initial AI message like mockup */}
            <div className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                AI
              </div>
              <div className="flex-1">
                <div className="mb-1 text-sm font-medium text-gray-900">True Coding</div>
                <div className="text-sm leading-relaxed text-gray-700">
                  Olá! Vamos criar algo incrível juntos! 🎉
                  <br /><br />
                  Para começar: <strong>O que você gostaria de criar?</strong>
                  <br /><br />
                  Pode ser um app, site, API, dashboard... Conta pra mim!
                </div>
              </div>
            </div>
          </div>
        ) : messages.length === 0 && planReady ? (
          <div className="flex flex-col gap-3">
            {/* STATE RESTORATION: Plan ready but no messages loaded - show confirmation */}
            <div className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                AI
              </div>
              <div className="flex-1">
                <div className="mb-1 text-sm font-medium text-gray-900">True Coding</div>
                <div className="text-sm leading-relaxed text-gray-700">
                  Plano gerado com sucesso! Veja o resumo ao lado e me diga se quer ajustar algo.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((message) => (
              <div key={message.id} className="flex gap-3">
                {/* Avatar */}
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    message.role === 'assistant'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {message.role === 'assistant' ? 'AI' : userName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="mb-1 text-sm font-medium text-gray-900">
                    {message.role === 'assistant' ? 'True Coding' : userName}
                  </div>
                  <div
                    className={`text-sm leading-relaxed ${
                      message.role === 'user'
                        ? 'inline-block rounded-lg bg-blue-50 px-3 py-2'
                        : 'text-gray-700'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">
                      {message.role === 'assistant'
                        ? renderBoldSpans(stripJsonFromDisplay(message.content))
                        : message.content}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                  AI
                </div>
                <div className="flex items-center gap-1 rounded-lg bg-gray-100 px-4 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0.1s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0.2s]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Quick Replies - matching mockup */}
      {activeTab === 'discovery' && FEATURES.QUICK_REPLIES && quickReplies.length > 0 && (
        <div className="border-t p-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            SUGESTÕES RÁPIDAS
          </div>
          <div className="flex flex-wrap gap-2">
            {quickReplies.map((reply, index) => (
              <button
                key={index}
                onClick={() => {
                  setInput(reply.long)
                  textareaRef.current?.focus()
                }}
                disabled={isLoading}
                className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {reply.short}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input - matching mockup */}
      {activeTab === 'discovery' && (
        <div className="border-t p-4">
          <div className="flex gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua resposta..."
              className="flex-1 resize-none rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Enviar
            </button>
          </div>
        </div>
      )}

      <PlanGenerationOverlay kind="business" visible={isGeneratingPlan} />
    </div>
  )
}
