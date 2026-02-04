'use client'

import * as React from 'react'
import { createContext, useContext, useCallback, useState } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// Toast variants following design tokens
const toastVariants = cva(
  'pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-lg border px-4 py-3 shadow-lg transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'border-gray-200 bg-white text-gray-900',
        success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
        error: 'border-red-200 bg-red-50 text-red-900',
        warning: 'border-amber-200 bg-amber-50 text-amber-900',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

const iconVariants = cva('h-5 w-5 flex-shrink-0', {
  variants: {
    variant: {
      default: 'text-gray-500',
      success: 'text-emerald-500',
      error: 'text-red-500',
      warning: 'text-amber-500',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

// Icons for each variant
function SuccessIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

// Types
export type ToastVariant = 'default' | 'success' | 'error' | 'warning'

export interface Toast {
  id: string
  message: string
  variant: ToastVariant
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (message: string, variant?: ToastVariant, duration?: number) => void
  removeToast: (id: string) => void
}

// Context
const ToastContext = createContext<ToastContextType | undefined>(undefined)

// Provider component
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const addToast = useCallback(
    (message: string, variant: ToastVariant = 'default', duration = 5000) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const toast: Toast = { id, message, variant, duration }

      setToasts((prev) => [...prev, toast])

      // Auto-remove after duration
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, duration)
      }
    },
    [removeToast]
  )

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

// Hook to use toasts
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  return {
    toast: context.addToast,
    success: (message: string, duration?: number) => context.addToast(message, 'success', duration),
    error: (message: string, duration?: number) => context.addToast(message, 'error', duration),
    warning: (message: string, duration?: number) => context.addToast(message, 'warning', duration),
    dismiss: context.removeToast,
  }
}

// Toast item component
interface ToastItemProps extends VariantProps<typeof toastVariants> {
  toast: Toast
  onDismiss: (id: string) => void
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const Icon = {
    default: InfoIcon,
    success: SuccessIcon,
    error: ErrorIcon,
    warning: WarningIcon,
  }[toast.variant]

  return (
    <div
      className={cn(toastVariants({ variant: toast.variant }))}
      role="alert"
      aria-live="polite"
    >
      <Icon className={iconVariants({ variant: toast.variant })} />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 rounded p-1 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Fechar notificacao"
      >
        <CloseIcon className="h-4 w-4" />
      </button>
    </div>
  )
}

// Container for all toasts
function ToastContainer() {
  const context = useContext(ToastContext)
  if (!context) return null

  const { toasts, removeToast } = context

  if (toasts.length === 0) return null

  return (
    <div
      className="pointer-events-none fixed bottom-0 right-0 z-[4000] flex flex-col gap-2 p-4"
      aria-label="Notificacoes"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  )
}

export { ToastContainer }
