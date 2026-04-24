'use client'

import { useState, createContext, useContext, useEffect } from 'react'

/**
 * ProjectLayout — wrapper do espaço interno de um projeto.
 *
 * TRC-14.4: a sidebar global do produto agora vive no AppShell (rota-level).
 * Este componente continua existindo apenas para:
 *   - prover o `useProjectLayout()` consumido por ChatPanel, WorkspacePanel e
 *     ProjectHeader (drawer mobile do chat e estado `sidebarOpen` legado);
 *   - gerenciar o layout interno de 2 colunas (workspace + chat) e o drawer
 *     mobile do chat.
 *
 * A coluna esquerda com `ProjectSidebar` foi descontinuada. O estado
 * `sidebarOpen` permanece no contexto para compatibilidade com consumidores
 * que ainda leem/escrevem (ProjectHeader mobile toggle), mas não tem mais
 * efeito visual no layout.
 */

interface ProjectLayoutContextType {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  chatOpen: boolean
  setChatOpen: (open: boolean) => void
}

const ProjectLayoutContext = createContext<ProjectLayoutContextType | null>(null)

export function useProjectLayout() {
  const context = useContext(ProjectLayoutContext)
  if (!context) {
    throw new Error('useProjectLayout must be used within ProjectLayout')
  }
  return context
}

interface ProjectLayoutProps {
  children: React.ReactNode
  chat: React.ReactNode
}

export function ProjectLayout({
  children,
  chat,
}: ProjectLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <ProjectLayoutContext.Provider
      value={{ sidebarOpen, setSidebarOpen, chatOpen, setChatOpen }}
    >
      <div className="flex h-screen bg-background">
        <div className="flex flex-1 overflow-hidden">
          {/* Workspace - área central */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>

          {/* Chat - Desktop: parte do flex; Mobile: drawer */}
          <aside className="hidden lg:flex lg:w-96 lg:min-h-0 lg:flex-col lg:border-l lg:bg-background">
            {chat}
          </aside>

          {/* Mobile drawer */}
          {isMobile && chatOpen && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/50"
                onClick={() => setChatOpen(false)}
              />
              <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-background border-l flex flex-col">
                {chat}
              </aside>
            </>
          )}

          {/* Chat FAB - mobile only */}
          {isMobile && !chatOpen && (
            <button
              onClick={() => setChatOpen(true)}
              className="fixed bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
              aria-label="Abrir chat"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </ProjectLayoutContext.Provider>
  )
}
