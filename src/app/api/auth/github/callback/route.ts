import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { exchangeCodeForToken } from '@/lib/github/oauth'
import { createGitHubClient, getAuthenticatedUser } from '@/lib/github/client'
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
    const projectId = cookieStore.get('github_oauth_project_id')?.value

    // Helper: build redirect target (project page or dashboard)
    const baseRedirect = projectId
      ? `${process.env.NEXT_PUBLIC_APP_URL}/project/${projectId}`
      : `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`

    // Check for OAuth error from GitHub
    if (error) {
      const errorDescription = url.searchParams.get('error_description')
      console.error('GitHub OAuth error:', error, errorDescription)
      if (projectId) cookieStore.delete('github_oauth_project_id')
      return NextResponse.redirect(`${baseRedirect}?error=github_auth_failed`)
    }

    if (!code || !state) {
      if (projectId) cookieStore.delete('github_oauth_project_id')
      return NextResponse.redirect(`${baseRedirect}?error=missing_params`)
    }

    // Verify state matches cookie
    const savedState = cookieStore.get('github_oauth_state')?.value

    if (!savedState || savedState !== state) {
      if (projectId) cookieStore.delete('github_oauth_project_id')
      return NextResponse.redirect(`${baseRedirect}?error=invalid_state`)
    }

    // Clear state cookie
    cookieStore.delete('github_oauth_state')

    // Exchange code for tokens
    const tokenResponse = await exchangeCodeForToken(code)

    // Get GitHub user info
    const octokit = createGitHubClient(tokenResponse.access_token)
    const githubUser = await getAuthenticatedUser(octokit)

    // Calculate token expiry if provided
    let tokenExpiry: Date | null = null
    if (tokenResponse.expires_in) {
      tokenExpiry = new Date(Date.now() + tokenResponse.expires_in * 1000)
    }

    // Save tokens to user record (encrypted)
    await prisma.user.update({
      where: { clerkId: userId },
      data: {
        githubAccessToken: encrypt(tokenResponse.access_token),
        githubRefreshToken: tokenResponse.refresh_token
          ? encrypt(tokenResponse.refresh_token)
          : null,
        githubTokenExpiry: tokenExpiry,
        githubUsername: githubUser.login,
      },
    })

    // Clear project cookie and redirect with success
    if (projectId) cookieStore.delete('github_oauth_project_id')
    return NextResponse.redirect(`${baseRedirect}?github=connected`)
  } catch (error) {
    console.error('GitHub OAuth callback error:', error)
    // On unexpected errors, try to redirect to project if cookie was set
    try {
      const cookieStore = await cookies()
      const projectId = cookieStore.get('github_oauth_project_id')?.value
      if (projectId) {
        cookieStore.delete('github_oauth_project_id')
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/project/${projectId}?error=github_auth_failed`
        )
      }
    } catch {
      // cookie access failed — fall through to dashboard
    }
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=github_auth_failed`
    )
  }
}
