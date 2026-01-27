'use client'

import { useState, useRef, useEffect } from 'react'
import { useProjectLayout } from './ProjectLayout'
import { QuickReplyButtons } from './QuickReplyButtons'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
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

interface QuestionProgress {
  current: number
  total: number
}

interface ChatPanelProps {
  projectId: string
  projectName: string
  initialMessages?: Message[]
  onPlanReady?: (plan: Record<string, unknown>) => void
}

export function ChatPanel({
  projectId,
  projectName,
  initialMessages = [],
  onPlanReady,
}: ChatPanelProps) {
  const { setChatOpen } = useProjectLayout()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [questionProgress, setQuestionProgress] = useState<QuestionProgress | null>(null)
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

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
                // Check if this is question 5 (last question before plan generation)
                if (parsed.progress.current === 5) {
                  setIsGeneratingPlan(true)
                }
              } else if (currentEvent === 'plan_ready' && parsed.plan) {
                console.log('[CHAT] Plan ready detected! Plan:', parsed.plan)
                setIsGeneratingPlan(false)
                // Replace message with confirmation instead of showing JSON
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessage.id
                      ? { ...m, content: 'Plano gerado com sucesso! Veja o resumo ao lado e me diga se quer ajustar algo.' }
                      : m
                  )
                )
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

  return (
    <div className="relative flex flex-1 flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h2 className="font-semibold">Discovery</h2>
          {questionProgress ? (
            <p className="text-xs text-muted-foreground">
              Pergunta {questionProgress.current} de {questionProgress.total}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Converse com a AI</p>
          )}
        </div>
        {/* Close button - mobile only */}
        <button
          onClick={() => setChatOpen(false)}
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted lg:hidden"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div
        className="custom-scrollbar flex-1 overflow-y-auto p-4"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgb(203 213 225) transparent'
        }}
      >
        {messages.length === 0 ? (
          <div className="pt-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="mb-1 font-medium">Comece a conversa</h3>
            <p className="max-w-[200px] text-sm text-muted-foreground">
              Descreva o app que voce quer criar para {projectName}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="whitespace-pre-wrap">
                    {message.role === 'assistant'
                      ? stripJsonFromDisplay(message.content)
                      : message.content}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-muted px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0.1s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0.2s]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Quick Reply Buttons */}
      <QuickReplyButtons
        currentQuestion={questionProgress?.current ?? null}
        onSelect={(text) => sendMessage(text)}
        disabled={isLoading}
      />

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Descreva seu app..."
            className="flex-1 resize-none rounded-xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="flex h-auto w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Enter para enviar · Shift+Enter para nova linha
        </p>
      </div>

      {/* Loading Overlay - Plan Generation */}
      {isGeneratingPlan && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="rounded-lg bg-card p-6 shadow-lg border">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <div className="text-center">
                <h3 className="font-semibold">Gerando Business Plan...</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Isso pode levar alguns segundos
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
