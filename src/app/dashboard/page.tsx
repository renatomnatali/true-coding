import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import { NewProjectButton } from './new-project-button'

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Get or create user
  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  if (!user) {
    // Create user on first visit
    const { clerkClient } = await import('@clerk/nextjs/server')
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(userId)
    const email = clerkUser.emailAddresses[0]?.emailAddress

    if (!email) {
      throw new Error('User email not found')
    }

    user = await prisma.user.create({
      data: {
        clerkId: userId,
        email,
      },
    })
  }

  // Get user's projects
  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
  })

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold">
            True Coding
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.email}</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Projects</h1>
          <NewProjectButton />
        </div>

        {projects.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <h2 className="text-xl font-semibold">No projects yet</h2>
            <p className="mt-2 text-muted-foreground">
              Create your first project to get started
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/project/${project.id}`}
                className="rounded-lg border p-6 transition-colors hover:border-primary"
              >
                <h3 className="font-semibold">{project.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {project.description || 'No description'}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      project.status === 'LIVE'
                        ? 'bg-green-100 text-green-800'
                        : project.status === 'GENERATING'
                          ? 'bg-blue-100 text-blue-800'
                          : project.status === 'FAILED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {project.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
