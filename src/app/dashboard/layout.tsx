import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { TopBar } from '@/components/layout/TopBar'
import { MessageFloating } from '@/components/widgets/MessageFloating'
import { prisma } from '@/lib/prisma'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const activeCouple = await prisma.couple.findFirst({
    where: {
      status: 'ACTIVE',
      OR: [{ user1Id: session.user.id }, { user2Id: session.user.id }],
    },
    include: {
      user1: { select: { id: true, name: true, avatar: true } },
      user2: { select: { id: true, name: true, avatar: true } },
    },
  })

  const partner = activeCouple
    ? activeCouple.user1Id === session.user.id
      ? activeCouple.user2
      : activeCouple.user1
    : null

  const unreadCount = activeCouple
    ? await prisma.message.count({
        where: { coupleId: activeCouple.id, senderId: { not: session.user.id }, read: false },
      })
    : 0

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-col min-h-screen pb-16 md:pb-0">
        <TopBar />
        <div className="flex-1">
          {children}
        </div>
      </main>
      <BottomNav />
      {activeCouple && partner && (
        <MessageFloating
          coupleId={activeCouple.id}
          currentUserId={session.user.id}
          partnerName={partner.name}
          partnerImage={partner.avatar}
          initialUnread={unreadCount}
        />
      )}
    </div>
  )
}
