'use client'

import { useState, useCallback } from 'react'
import type { ChatMessage, BusinessPlan, ConversationPhase } from '@/types'

interface UseChatOptions {
  projectId: string
  phase: ConversationPhase
  onPlanReady?: (plan: BusinessPlan) => void
}

export function useChat({ projectId, phase, onPlanReady }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(
    async (content: string) => {
      setIsLoading(true)
      setError(null)
      setStreamingContent('')

      // Add user message optimistically
      const userMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content,
        createdAt: new Date(),
      }
      setMessages((prev) => [...prev, userMessage])

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId,
            message: content,
            phase,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to send message')
        }

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('No response body')
        }

        const decoder = new TextDecoder()
        let buffer = ''
        let fullContent = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              const eventType = line.slice(7)
              const dataLine = lines[lines.indexOf(line) + 1]

              if (dataLine?.startsWith('data: ')) {
                try {
                  const data = JSON.parse(dataLine.slice(6))

                  switch (eventType) {
                    case 'text':
                      fullContent += data.content
                      setStreamingContent(fullContent)
                      break
                    case 'done':
                      // Add assistant message
                      const assistantMessage: ChatMessage = {
                        id: data.messageId || `msg-${Date.now()}`,
                        role: 'assistant',
                        content: fullContent,
                        createdAt: new Date(),
                      }
                      setMessages((prev) => [...prev, assistantMessage])
                      setStreamingContent('')
                      break
                    case 'plan_ready':
                      if (onPlanReady && data.plan) {
                        onPlanReady(data.plan)
                      }
                      break
                    case 'error':
                      setError(data.message)
                      break
                  }
                } catch {
                  // Ignore JSON parse errors
                }
              }
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    },
    [projectId, phase, onPlanReady]
  )

  const clearMessages = useCallback(() => {
    setMessages([])
    setStreamingContent('')
    setError(null)
  }, [])

  return {
    messages,
    isLoading,
    streamingContent,
    error,
    sendMessage,
    clearMessages,
  }
}
