'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Github, Check, Loader2, X } from 'lucide-react'

interface GitHubStatus {
  connected: boolean
  username: string | null
  expired: boolean
}

export function ConnectGitHub() {
  const [status, setStatus] = useState<GitHubStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/user/github-status')
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (error) {
      console.error('Error fetching GitHub status:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const handleConnect = () => {
    window.location.href = '/api/auth/github'
  }

  const handleDisconnect = async () => {
    setIsDisconnecting(true)
    try {
      const response = await fetch('/api/auth/github', { method: 'DELETE' })
      if (response.ok) {
        setStatus({ connected: false, username: null, expired: false })
      }
    } catch (error) {
      console.error('Error disconnecting GitHub:', error)
    } finally {
      setIsDisconnecting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-4 border rounded-lg">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Verificando conexao...</span>
      </div>
    )
  }

  if (status?.connected) {
    return (
      <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 dark:bg-green-950">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900">
            <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="font-medium">GitHub conectado</p>
            <p className="text-sm text-muted-foreground">
              @{status.username}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
          disabled={isDisconnecting}
        >
          {isDisconnecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4" />
          )}
          <span className="ml-2">Desconectar</span>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
          <Github className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium">Conectar GitHub</p>
          <p className="text-sm text-muted-foreground">
            Necessario para criar repositorios
          </p>
        </div>
      </div>
      <Button onClick={handleConnect}>
        <Github className="h-4 w-4 mr-2" />
        Conectar
      </Button>
    </div>
  )
}
