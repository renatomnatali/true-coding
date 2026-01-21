import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          True Coding
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Create professional web applications from natural language.
          Not vibe coding - true coding with tests, CI/CD, and best practices.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/sign-in"
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="rounded-md bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground shadow-sm hover:bg-secondary/90"
          >
            Get Started
          </Link>
        </div>
      </div>
    </main>
  )
}
