import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import { DashboardHeader, DashboardContent } from '@/components/dashboard'

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
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <DashboardContent projects={projects} />
    </div>
  )
}
