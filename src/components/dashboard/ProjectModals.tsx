'use client'

import { useState, useEffect } from 'react'

// Create Project Modal
interface CreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (name: string, description: string) => void
  isLoading?: boolean
}

export function CreateProjectModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: CreateModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('')
      setDescription('')
    }
  }, [isOpen])

  // Close on ESC
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onSubmit(name.trim(), description.trim())
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Criar novo projeto
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 px-6 py-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Nome do projeto <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Meu App Incrivel"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Descrição (opcional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Uma breve descrição do que você quer criar..."
                rows={3}
                className="w-full resize-none rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? 'Criando...' : 'Criar projeto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Delete Project Modal
interface DeleteModalProps {
  isOpen: boolean
  projectName: string
  onClose: () => void
  onConfirm: () => void
  isLoading?: boolean
}

export function DeleteProjectModal({
  isOpen,
  projectName,
  onClose,
  onConfirm,
  isLoading,
}: DeleteModalProps) {
  // Close on ESC
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Excluir projeto?
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <p className="leading-relaxed text-gray-600">
            Tem certeza que deseja excluir o projeto{' '}
            <strong className="text-gray-900">{projectName}</strong>?
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Esta ação não pode ser desfeita. Todo o código gerado e
            configurações serão perdidos.
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Excluindo...' : 'Excluir projeto'}
          </button>
        </div>
      </div>
    </div>
  )
}
