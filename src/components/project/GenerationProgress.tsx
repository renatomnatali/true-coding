'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  CheckCircle,
  XCircle,
  FileCode,
  Github,
  ExternalLink,
} from 'lucide-react'

interface GeneratedFile {
  path: string
  content: string
  description?: string
}

interface GenerationEvent {
  type:
    | 'stage'
    | 'file_generated'
    | 'validation_started'
    | 'validation_result'
    | 'error'
    | 'done'
  stage?:
    | 'loading_templates'
    | 'generating_files'
    | 'validating'
    | 'committing'
  file?: GeneratedFile
  validation?: { valid: boolean; errors: Array<{ message: string }> }
  error?: string
  files?: GeneratedFile[]
}

interface GenerationProgressProps {
  projectId: string
  onComplete?: (repoUrl: string) => void
  onError?: (error: string) => void
}

const STAGE_LABELS: Record<string, string> = {
  loading_templates: 'Carregando templates...',
  generating_files: 'Gerando codigo...',
  validating: 'Validando codigo...',
  committing: 'Criando repositorio...',
}

export function GenerationProgress({
  projectId,
  onComplete,
  onError,
}: GenerationProgressProps) {
  const [status, setStatus] = useState<
    'idle' | 'generating' | 'success' | 'error'
  >('idle')
  const [currentStage, setCurrentStage] = useState<string | null>(null)
  const [files, setFiles] = useState<GeneratedFile[]>([])
  const [error, setError] = useState<string | null>(null)
  const [repoUrl, setRepoUrl] = useState<string | null>(null)

  const startGeneration = useCallback(async () => {
    setStatus('generating')
    setFiles([])
    setError(null)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Generation failed')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event: GenerationEvent = JSON.parse(line.slice(6))

              switch (event.type) {
                case 'stage':
                  setCurrentStage(event.stage || null)
                  break
                case 'file_generated':
                  if (event.file) {
                    setFiles((prev) => [...prev, event.file!])
                  }
                  break
                case 'error':
                  setError(event.error || 'Unknown error')
                  setStatus('error')
                  onError?.(event.error || 'Unknown error')
                  return
                case 'done':
                  setStatus('success')
                  // Fetch updated project to get repo URL
                  const projectResponse = await fetch(
                    `/api/projects/${projectId}`
                  )
                  if (projectResponse.ok) {
                    const project = await projectResponse.json()
                    if (project.githubRepoUrl) {
                      setRepoUrl(project.githubRepoUrl)
                      onComplete?.(project.githubRepoUrl)
                    }
                  }
                  break
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Generation failed'
      setError(errorMessage)
      setStatus('error')
      onError?.(errorMessage)
    }
  }, [projectId, onComplete, onError])

  useEffect(() => {
    startGeneration()
  }, [startGeneration])

  return (
    <div className="space-y-6 p-6 border rounded-lg">
      {/* Status Header */}
      <div className="flex items-center gap-3">
        {status === 'generating' && (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <div>
              <h3 className="font-semibold">Gerando projeto...</h3>
              {currentStage && (
                <p className="text-sm text-muted-foreground">
                  {STAGE_LABELS[currentStage] || currentStage}
                </p>
              )}
            </div>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="h-6 w-6 text-green-500" />
            <div>
              <h3 className="font-semibold">Projeto gerado com sucesso!</h3>
              <p className="text-sm text-muted-foreground">
                {files.length} arquivos criados
              </p>
            </div>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="h-6 w-6 text-red-500" />
            <div>
              <h3 className="font-semibold">Erro na geracao</h3>
              <p className="text-sm text-red-500">{error}</p>
            </div>
          </>
        )}
      </div>

      {/* Progress Stages */}
      <div className="space-y-2">
        {[
          'loading_templates',
          'generating_files',
          'validating',
          'committing',
        ].map((stage) => {
          const isActive = currentStage === stage
          const isComplete =
            status === 'success' ||
            (currentStage &&
              [
                'loading_templates',
                'generating_files',
                'validating',
                'committing',
              ].indexOf(stage) <
                [
                  'loading_templates',
                  'generating_files',
                  'validating',
                  'committing',
                ].indexOf(currentStage))

          return (
            <div
              key={stage}
              className={`flex items-center gap-2 text-sm ${
                isActive
                  ? 'text-primary font-medium'
                  : isComplete
                    ? 'text-green-600'
                    : 'text-muted-foreground'
              }`}
            >
              {isComplete ? (
                <CheckCircle className="h-4 w-4" />
              ) : isActive ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <div className="h-4 w-4 rounded-full border" />
              )}
              {STAGE_LABELS[stage]}
            </div>
          )
        })}
      </div>

      {/* Generated Files */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Arquivos gerados:</h4>
          <div className="max-h-48 overflow-y-auto space-y-1 text-sm">
            {files.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <FileCode className="h-3 w-3" />
                <span className="font-mono text-xs">{file.path}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Repository Link */}
      {repoUrl && (
        <div className="pt-4 border-t">
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full h-10 px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Github className="h-4 w-4 mr-2" />
            Ver repositorio no GitHub
            <ExternalLink className="h-4 w-4 ml-2" />
          </a>
        </div>
      )}

      {/* Retry Button */}
      {status === 'error' && (
        <Button onClick={startGeneration} variant="outline" className="w-full">
          Tentar novamente
        </Button>
      )}
    </div>
  )
}
