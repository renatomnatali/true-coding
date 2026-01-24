import { SignIn } from '@clerk/nextjs'
import { ClerkGuard } from '@/components/clerk-guard'

export default function SignInPage() {
  return (
    <ClerkGuard>
      <div className="flex min-h-screen items-center justify-center">
        <SignIn />
      </div>
    </ClerkGuard>
  )
}
