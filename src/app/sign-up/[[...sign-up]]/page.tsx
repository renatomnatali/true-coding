import { SignUp } from '@clerk/nextjs'
import { ClerkGuard } from '@/components/clerk-guard'

export default function SignUpPage() {
  return (
    <ClerkGuard>
      <div className="flex min-h-screen items-center justify-center">
        <SignUp />
      </div>
    </ClerkGuard>
  )
}
