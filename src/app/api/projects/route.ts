import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'

const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
})

// GET /api/projects - List user's projects
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 })
    }

    const projects = await prisma.project.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        status: true,
        productionUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ projects, total: projects.length })
  } catch (error) {
    console.error('Error listing projects:', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

// POST /api/projects - Create new project
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const body = await request.json()
    const { name } = createProjectSchema.parse(body)

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      // Fetch user data from Clerk
      const client = await clerkClient()
      const clerkUser = await client.users.getUser(userId)
      const email = clerkUser.emailAddresses[0]?.emailAddress

      if (!email) {
        return NextResponse.json({ error: 'USER_EMAIL_NOT_FOUND' }, { status: 400 })
      }

      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email,
        },
      })
    }

    const project = await prisma.project.create({
      data: {
        name,
        userId: user.id,
        status: 'IDEATION',
      },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
