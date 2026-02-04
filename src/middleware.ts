import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextFetchEvent, NextRequest } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
])

const baseMiddleware = clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

const hasClerkKeys = () => {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  const secretKey = process.env.CLERK_SECRET_KEY
  if (!publishableKey || !secretKey) return false
  if (publishableKey.startsWith('pk_test_dummy')) return false
  return true
}

const buildClerkFallback = (request: NextRequest) => {
  const accept = request.headers.get('accept') || ''
  const isHtml = accept.includes('text/html') || request.headers.get('sec-fetch-dest') === 'document'
  const vercelId = request.headers.get('x-vercel-id') || 'unknown'
  const path = request.nextUrl?.pathname || request.url

  if (isHtml) {
    const body = `<!doctype html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"utf-8\" />\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n  <title>Configuration Error - Clerk</title>\n  <style>\n    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; margin: 0; background: #f9fafb; color: #111827; }\n    .wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }\n    .card { max-width: 560px; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }\n    h1 { font-size: 20px; margin: 0 0 12px; }\n    p { margin: 0 0 12px; color: #4b5563; }\n    code { background: #f3f4f6; padding: 2px 6px; border-radius: 6px; }\n    .meta { font-size: 12px; color: #6b7280; }\n  </style>\n</head>\n<body>\n  <div class=\"wrap\">\n    <div class=\"card\">\n      <h1>Clerk nao configurado</h1>\n      <p>As chaves de autenticacao nao foram encontradas no ambiente de deploy.</p>\n      <p>Configure <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> e <code>CLERK_SECRET_KEY</code> nas variaveis de ambiente.</p>\n      <p class=\"meta\">Path: ${path} | Vercel ID: ${vercelId}</p>\n    </div>\n  </div>\n</body>\n</html>`
    return new NextResponse(body, {
      status: 503,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
      },
    })
  }

  return NextResponse.json(
    {
      error: 'Clerk not configured',
      code: 'CLERK_NOT_CONFIGURED',
      path,
      vercelId,
    },
    { status: 503, headers: { 'cache-control': 'no-store' } },
  )
}

const buildPublicFallback = (request: NextRequest) => {
  const accept = request.headers.get('accept') || ''
  const isHtml = accept.includes('text/html') || request.headers.get('sec-fetch-dest') === 'document'
  const vercelId = request.headers.get('x-vercel-id') || 'unknown'
  const path = request.nextUrl?.pathname || request.url

  if (isHtml) {
    const body = `<!doctype html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"utf-8\" />\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n  <title>True Coding</title>\n  <style>\n    :root {\n      --primary: #2563eb;\n      --primary-hover: #1d4ed8;\n      --secondary: #f3f4f6;\n      --secondary-text: #111827;\n      --text: #111827;\n      --muted: #6b7280;\n      --bg: #ffffff;\n    }\n    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; margin: 0; background: var(--bg); color: var(--text); }\n    .wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 48px 24px; }\n    .content { text-align: center; max-width: 720px; }\n    h1 { font-size: 48px; margin: 0 0 12px; letter-spacing: -0.02em; }\n    p { margin: 0 0 16px; color: var(--muted); font-size: 18px; line-height: 1.6; }\n    .cta { display: inline-flex; gap: 12px; margin-top: 12px; flex-wrap: wrap; justify-content: center; }\n    .btn { display: inline-flex; align-items: center; justify-content: center; padding: 10px 18px; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none; }\n    .btn-primary { background: var(--primary); color: #fff; }\n    .btn-primary:hover { background: var(--primary-hover); }\n    .btn-secondary { background: var(--secondary); color: var(--secondary-text); }\n    .notice { margin-top: 20px; font-size: 14px; color: var(--muted); }\n    code { background: #f3f4f6; padding: 2px 6px; border-radius: 6px; }\n    .meta { font-size: 12px; color: #9ca3af; margin-top: 16px; }\n  </style>\n</head>\n<body>\n  <div class=\"wrap\">\n    <div class=\"content\">\n      <h1>True Coding</h1>\n      <p>Create professional web applications from natural language. Not vibe coding - true coding with tests, CI/CD, and best practices.</p>\n      <div class=\"cta\">\n        <a class=\"btn btn-primary\" href=\"/sign-in\">Sign In</a>\n        <a class=\"btn btn-secondary\" href=\"/sign-up\">Get Started</a>\n      </div>\n      <p class=\"notice\">Autenticacao indisponivel: configure <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> e <code>CLERK_SECRET_KEY</code>.</p>\n      <p class=\"meta\">Path: ${path} | Vercel ID: ${vercelId}</p>\n    </div>\n  </div>\n</body>\n</html>`
    return new NextResponse(body, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
      },
    })
  }

  return NextResponse.json(
    {
      error: 'Clerk not configured (public route)',
      code: 'CLERK_NOT_CONFIGURED_PUBLIC',
      path,
      vercelId,
    },
    { status: 200, headers: { 'cache-control': 'no-store' } },
  )
}

export default async function middleware(request: NextRequest, event: NextFetchEvent) {
  if (!hasClerkKeys()) {
    const vercelId = request.headers.get('x-vercel-id') || 'unknown'
    const isPublic = isPublicRoute(request)
    console.error('[middleware] Clerk keys missing', {
      path: request.nextUrl?.pathname || request.url,
      vercelId,
      publicRoute: isPublic,
    })
    return isPublic ? buildPublicFallback(request) : buildClerkFallback(request)
  }

  try {
    return await baseMiddleware(request, event)
  } catch (error) {
    const vercelId = request.headers.get('x-vercel-id') || 'unknown'
    console.error('[middleware] Unexpected error', {
      path: request.nextUrl?.pathname || request.url,
      vercelId,
      error,
    })
    return buildClerkFallback(request)
  }
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
