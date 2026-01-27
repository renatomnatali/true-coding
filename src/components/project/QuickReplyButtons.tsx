'use client'

import { QUICK_REPLIES_BY_QUESTION } from '@/types'

interface QuickReplyButtonsProps {
  currentQuestion: number | null
  onSelect: (text: string) => void
  disabled?: boolean
}

export function QuickReplyButtons({
  currentQuestion,
  onSelect,
  disabled = false,
}: QuickReplyButtonsProps) {
  // Don't show if no current question or question is out of range
  if (!currentQuestion || currentQuestion < 1 || currentQuestion > 5) {
    return null
  }

  const suggestions = QUICK_REPLIES_BY_QUESTION[currentQuestion]

  if (!suggestions || suggestions.length === 0) {
    return null
  }

  return (
    <div className="px-4 pb-2">
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        Sugestões rápidas:
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelect(suggestion)}
            disabled={disabled}
            className="rounded-full border bg-background px-3 py-1.5 text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  )
}
