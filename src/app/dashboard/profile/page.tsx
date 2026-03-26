import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ProfilePageClient } from './ProfilePageClient'
import { seedQuestions } from '@/actions/couple'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) redirect('/login')

 
  const archivedCouples = await prisma.couple.findMany({
    where: {
      status: 'ARCHIVED',
      OR: [{ user1Id: session.user.id }, { user2Id: session.user.id }],
    },
    include: {
      user1: { select: { id: true, name: true, avatar: true, email: true } },
      user2: { select: { id: true, name: true, avatar: true, email: true } },
      goals: true,
      checkins: true,
      reflections: { orderBy: { date: 'desc' } },
      messages: { orderBy: { createdAt: 'desc' }, take: 50, include: { sender: { select: { id: true, name: true, avatar: true } } } },
    },
    orderBy: { archivedAt: 'desc' },
  })

  return <ProfilePageClient user={user as any} archivedCouples={archivedCouples as any} userId={session.user.id} />
}
