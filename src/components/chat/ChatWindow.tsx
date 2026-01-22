'use client'

import { useEffect, useRef } from 'react'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import type { ChatMessage, BusinessPlan } from '@/types'
import { Loader2 } from 'lucide-react'

interface ChatWindowProps {
  messages: ChatMessage[]
  isLoading: boolean
  streamingContent: string
  onSendMessage: (message: string) => void
  onPlanReady?: (plan: BusinessPlan) => void
}

export function ChatWindow({
  messages,
  isLoading,
  streamingContent,
  onSendMessage,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent])

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* Streaming message */}
        {streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg bg-muted px-4 py-2">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {streamingContent.split('\n').map((line, i) => (
                  <p key={i} className="mb-1 last:mb-0">
                    {line || '\u00A0'}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && !streamingContent && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-muted px-4 py-2">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <MessageInput onSend={onSendMessage} disabled={isLoading} />
    </div>
  )
}
