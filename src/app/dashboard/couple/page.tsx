import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  getMyCouple, getQuestionCategories, seedQuestions,
  getCoupleRoadmaps, getPendingInvitation, getMyPendingCouple,
  getArchivedCouples, getUnreadMessageCount,
} from '@/actions/couple'
import { getPublicRoadmaps, getUserRoadmaps } from '@/actions/discovery'
import { CouplePageClient } from './CouplePageClient'
import { prisma } from '@/lib/prisma'

export default async function CouplePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  await seedQuestions()

  const [couple, pendingInvitation, myPendingCouple, archivedCouples] = await Promise.all([
    getMyCouple(),
    getPendingInvitation(),
    getMyPendingCouple(),
    getArchivedCouples(),
  ])

  const categoriesRaw = await getQuestionCategories()

  const categoriesWithAnswers = await Promise.all(
    categoriesRaw.map(async cat => ({
      ...cat,
      questions: await Promise.all(
        cat.questions.map(async q => ({
          ...q,
          answers: couple
            ? await prisma.answer.findMany({
                where: { questionId: q.id, coupleId: couple.id },
                include: { user: true },
                orderBy: { createdAt: 'desc' },
              })
            : [],
        }))
      ),
    }))
  )

  const [coupleRoadmaps, publicRoadmaps, userRoadmaps, unreadMessages] = await Promise.all([
    couple ? getCoupleRoadmaps(couple.id) : Promise.resolve([]),
    getPublicRoadmaps(),
    getUserRoadmaps(session.user.id),
    couple ? getUnreadMessageCount(couple.id) : Promise.resolve(0),
  ])

  const allRoadmaps = [...publicRoadmaps, ...userRoadmaps]

  return (
    <CouplePageClient
      couple={couple as any}
      pendingInvitation={pendingInvitation as any}
      myPendingCouple={myPendingCouple as any}
      archivedCouples={archivedCouples as any}
      categories={categoriesWithAnswers as any}
      userId={session.user.id}
      coupleRoadmaps={coupleRoadmaps as any}
      availableRoadmaps={allRoadmaps as any}
      unreadMessages={unreadMessages}
    />
  )
}
