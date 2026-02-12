import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { exchangeCodeForToken } from '@/lib/netlify/oauth'
import { prisma } from '@/lib/db/prisma'
import { encrypt } from '@/lib/crypto'

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/sign-in`
      )
    }

    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')

    // Read project cookie for project-scoped redirects
    const cookieStore = await cookies()
    const projectId = cookieStore.get('netlify_oauth_project_id')?.value

    // Helper: build redirect target (project page or dashboard)
    const baseRedirect = projectId
      ? `${process.env.NEXT_PUBLIC_APP_URL}/project/${projectId}`
      : `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`

    // Read and clear state cookie early to prevent reuse
    const savedState = cookieStore.get('netlify_oauth_state')?.value
    cookieStore.delete('netlify_oauth_state')
    cookieStore.delete('netlify_oauth_project_id')

    // Check for OAuth error from Netlify
    if (error) {
      const errorDescription = url.searchParams.get('error_description')
      console.error('Netlify OAuth error:', error, errorDescription)
      return NextResponse.redirect(`${baseRedirect}?error=netlify_auth_failed`)
    }

    if (!code || !state) {
      return NextResponse.redirect(`${baseRedirect}?error=missing_params`)
    }

    // Verify state matches saved cookie
    if (!savedState || savedState !== state) {
      return NextResponse.redirect(`${baseRedirect}?error=invalid_state`)
    }

    // Exchange code for token (Netlify tokens are long-lived, no refresh needed)
    const tokenResponse = await exchangeCodeForToken(code)

    // Save token to user record (encrypted)
    await prisma.user.update({
      where: { clerkId: userId },
      data: {
        netlifyAccessToken: encrypt(tokenResponse.access_token),
      },
    })

    // Redirect with success (cookies already cleaned up above)
    return NextResponse.redirect(`${baseRedirect}?netlify=connected`)
  } catch (error) {
    console.error('Netlify OAuth callback error:', error)
    // On unexpected errors, try to redirect to project if cookie was set
    try {
      const cookieStore = await cookies()
      const projectId = cookieStore.get('netlify_oauth_project_id')?.value
      if (projectId) {
        cookieStore.delete('netlify_oauth_project_id')
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/project/${projectId}?error=netlify_auth_failed`
        )
      }
    } catch {
      // cookie access failed — fall through to dashboard
    }
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=netlify_auth_failed`
    )
  }
}
