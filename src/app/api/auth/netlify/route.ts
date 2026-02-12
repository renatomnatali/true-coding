import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAuthorizationUrl, generateState } from '@/lib/netlify/oauth'
import { prisma } from '@/lib/db/prisma'

// GET /api/auth/netlify?projectId=<id> - Initiate Netlify OAuth flow
export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 })
    }

    // Generate state for CSRF protection
    const state = generateState()

    // Store state in cookie for verification
    const cookieStore = await cookies()
    cookieStore.set('netlify_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    })

    // If projectId is provided, save it so callback can redirect back to the project
    const projectId = new URL(request.url).searchParams.get('projectId')
    if (projectId) {
      cookieStore.set('netlify_oauth_project_id', projectId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 10, // 10 minutes
        path: '/',
      })
    }

    // Redirect to Netlify authorization
    const authUrl = getAuthorizationUrl(state)

    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Netlify OAuth init error:', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

// DELETE /api/auth/netlify - Disconnect Netlify
export async function DELETE() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    await prisma.user.update({
      where: { clerkId: userId },
      data: {
        netlifyAccessToken: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Netlify disconnect error:', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
