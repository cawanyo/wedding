import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMyCouple, getQuestionCategories, seedQuestions } from '@/actions/couple'
import { CouplePageClient } from './CouplePageClient'
import { prisma } from '@/lib/prisma'

export default async function CouplePage() {
  const session = await getServerSession(authOptions)
  const couple = await getMyCouple()

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
                orderBy: { createdAt: 'desc' }, // Plus récent en premier
              })
            : [],
        }))
      ),
    }))
  );

  seedQuestions()
  return (
    <CouplePageClient
      couple={couple as any}
      categories={categoriesWithAnswers as any}
      userId={session?.user?.id ?? ''}
    />
  )
}
