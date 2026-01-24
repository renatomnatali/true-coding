import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        githubUsername: true,
        githubTokenExpiry: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 })
    }

    const isConnected = !!user.githubUsername
    const isExpired = user.githubTokenExpiry
      ? new Date() > user.githubTokenExpiry
      : false

    return NextResponse.json({
      connected: isConnected && !isExpired,
      username: user.githubUsername,
      expired: isExpired,
    })
  } catch (error) {
    console.error('Error fetching GitHub status:', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
