import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { exchangeCodeForToken } from '@/lib/github/oauth'
import { createGitHubClient, getAuthenticatedUser } from '@/lib/github/client'
import { prisma } from '@/lib/db/prisma'

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

    // Check for OAuth error from GitHub
    if (error) {
      const errorDescription = url.searchParams.get('error_description')
      console.error('GitHub OAuth error:', error, errorDescription)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=github_auth_failed`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=missing_params`
      )
    }

    // Verify state matches cookie
    const cookieStore = await cookies()
    const savedState = cookieStore.get('github_oauth_state')?.value

    if (!savedState || savedState !== state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=invalid_state`
      )
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

    // Save tokens to user record
    await prisma.user.update({
      where: { clerkId: userId },
      data: {
        githubAccessToken: tokenResponse.access_token,
        githubRefreshToken: tokenResponse.refresh_token || null,
        githubTokenExpiry: tokenExpiry,
        githubUsername: githubUser.login,
      },
    })

    // Redirect to dashboard with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?github=connected`
    )
  } catch (error) {
    console.error('GitHub OAuth callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=github_auth_failed`
    )
  }
}
