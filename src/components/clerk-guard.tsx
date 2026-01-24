'use client'

interface ClerkGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ClerkGuard({ children, fallback }: ClerkGuardProps) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

  if (!publishableKey || publishableKey.startsWith('pk_test_dummy')) {
    return (
      fallback ?? (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="max-w-md space-y-4 text-center">
            <h1 className="text-2xl font-bold">Clerk Not Configured</h1>
            <p className="text-muted-foreground">
              Authentication is not configured. Please add your Clerk keys to
              <code className="mx-1 rounded bg-muted px-1 py-0.5">
                .env.local
              </code>
            </p>
            <div className="rounded-lg bg-muted p-4 text-left text-sm">
              <pre className="whitespace-pre-wrap">
                {`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...`}
              </pre>
            </div>
            <p className="text-sm text-muted-foreground">
              Get your keys at{' '}
              <a
                href="https://dashboard.clerk.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                dashboard.clerk.com
              </a>
            </p>
          </div>
        </div>
      )
    )
  }

  return <>{children}</>
}
