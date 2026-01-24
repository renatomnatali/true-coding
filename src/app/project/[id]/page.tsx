import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import { ProjectDetails } from './project-details'

interface ProjectPageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in')
  }

  const { id } = await params

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          clerkId: true,
          githubUsername: true,
        },
      },
    },
  })

  if (!project) {
    notFound()
  }

  if (project.user.clerkId !== userId) {
    notFound()
  }

  return <ProjectDetails project={project} />
}
