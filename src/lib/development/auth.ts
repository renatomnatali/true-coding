import { prisma } from '@/lib/db/prisma'

export async function assertProjectOwnership(projectId: string, clerkId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      user: {
        select: {
          clerkId: true,
        },
      },
    },
  })

  if (!project) {
    throw new Error('PROJECT_NOT_FOUND')
  }

  if (project.user.clerkId !== clerkId) {
    throw new Error('FORBIDDEN')
  }

  return project
}
