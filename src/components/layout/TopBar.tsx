'use client'

import { useSession } from 'next-auth/react'
import { Avatar } from '@/components/ui/Avatar'
import { NotificationBell } from '@/components/widgets/NotificationBell'
import Link from 'next/link'

export function TopBar() {
  const { data: session } = useSession()

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-3 flex items-center justify-between">
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <NotificationBell />
        <Link href="/dashboard/profile">
          <Avatar src={session?.user?.image} name={session?.user?.name} size="sm" />
        </Link>
      </div>
    </header>
  )
}
