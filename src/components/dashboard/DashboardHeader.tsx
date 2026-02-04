'use client'

import { useUser } from '@clerk/nextjs'
import Link from 'next/link'

export function DashboardHeader() {
  const { user } = useUser()

  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.firstName?.[0] || 'U'

  const displayName = user?.fullName || user?.firstName || 'Usuario'
  const email = user?.primaryEmailAddress?.emailAddress || ''

  return (
    <header className="flex items-center justify-between border-b bg-white px-8 py-5">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-xl font-bold text-white">
          TC
        </div>
        <span className="text-xl font-bold text-blue-600">True Coding</span>
      </Link>

      {/* User Info */}
      <div className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50">
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900">{displayName}</div>
          <div className="text-xs text-gray-500">{email}</div>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
          {initials}
        </div>
      </div>
    </header>
  )
}
