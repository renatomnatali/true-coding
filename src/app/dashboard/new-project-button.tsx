'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'

export function NewProjectButton() {
  const [isCreating, setIsCreating] = useState(false)
  const [name, setName] = useState('')
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()
  const toast = useToast()

  const handleCreate = async () => {
    if (!name.trim()) return

    setIsCreating(true)
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })

      if (!response.ok) {
        throw new Error('Failed to create project')
      }

      const project = await response.json()
      router.push(`/project/${project.id}`)
    } catch (error) {
      console.error('Error creating project:', error)
      toast.error('Erro ao criar projeto. Tente novamente.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
      >
        New Project
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
            <h2 className="text-xl font-semibold">Create New Project</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Give your project a name to get started
            </p>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome App"
              className="mt-4 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate()
                if (e.key === 'Escape') setShowModal(false)
              }}
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-md px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!name.trim() || isCreating}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
