import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getPublicRoadmaps, getUserRoadmaps, getMyActiveRoadmaps } from '@/actions/discovery'
import { DiscoveryPageClient } from './DiscoveryPageClient'

export default async function DiscoveryPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const [publicRoadmaps, userRoadmaps, activeRoadmaps] = await Promise.all([
    getPublicRoadmaps(),
    getUserRoadmaps(session.user.id),
    getMyActiveRoadmaps(),
  ])

  return (
    <DiscoveryPageClient
      publicRoadmaps={publicRoadmaps}
      userRoadmaps={userRoadmaps}
      activeRoadmaps={activeRoadmaps}
      userId={session.user.id}
    />
  )
}
