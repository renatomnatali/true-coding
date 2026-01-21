import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata: Metadata = {
  title: 'True Coding',
  description: 'Create professional web applications from natural language',
}

function ClerkWrapper({ children }: { children: React.ReactNode }) {
  // Skip ClerkProvider if no valid key (for CI builds)
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  if (!publishableKey || publishableKey.startsWith('pk_test_dummy')) {
    return <>{children}</>
  }
  return <ClerkProvider>{children}</ClerkProvider>
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ClerkWrapper>{children}</ClerkWrapper>
      </body>
    </html>
  )
}
