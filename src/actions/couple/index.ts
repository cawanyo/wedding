'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { randomBytes } from 'crypto'
import { createNotification } from '../notifications'

async function getSession() {
  return getServerSession(authOptions)
}

export async function createCouple() {
  const session = await getSession()
  if (!session?.user?.id) return { error: 'Non autorisé' }

  const existing = await prisma.couple.findFirst({
    where: {
      OR: [{ user1Id: session.user.id }, { user2Id: session.user.id }],
    },
  })
  if (existing) return { error: 'Vous avez déjà un espace couple' }

  const token = randomBytes(16).toString('hex')
  const couple = await prisma.couple.create({
    data: { user1Id: session.user.id, inviteToken: token },
  })

  return { success: true, couple, inviteToken: token }
}

export async function joinCouple(token: string) {
  const session = await getSession()
  if (!session?.user?.id) return { error: 'Non autorisé' }

  const couple = await prisma.couple.findUnique({ where: { inviteToken: token } })
  if (!couple) return { error: 'Lien invalide' }
  if (couple.user1Id === session.user.id) return { error: 'Vous êtes déjà dans cet espace' }
  if (couple.user2Id) return { error: 'Cet espace est déjà complet' }

  await prisma.couple.update({
    where: { id: couple.id },
    data: { user2Id: session.user.id, inviteToken: null },
  })

  revalidatePath('/dashboard/couple')
  return { success: true }
}

export async function getMyCouple() {
  const session = await getSession()
  if (!session?.user?.id) return null

  return prisma.couple.findFirst({
    where: {
      OR: [{ user1Id: session.user.id }, { user2Id: session.user.id }],
    },
    include: {
      user1: true,
      user2: true,
      goals: { include: { user: true }, orderBy: { createdAt: 'desc' } },
      checkins: { include: { user: true }, orderBy: { week: 'desc' } },
      reflections: {
        include: { user: true },
        orderBy: { date: 'desc' }
      }
    },
  })
}

export async function updateRelationshipStatus(
  coupleId: string,
  status: 'UNDEFINED' | 'KNOWING' | 'ENGAGED' | 'MARRIED'
) {
  const session = await getSession()
  if (!session?.user?.id) return { error: 'Non autorisé' }

  await prisma.couple.update({
    where: { id: coupleId },
    data: { relationshipStatus: status },
  })

  revalidatePath('/dashboard/couple')
  return { success: true }
}

export async function getQuestionCategories() {
  const session = await getSession();
  if (!session?.user?.id) return []
  const userId = session?.user?.id || null;
  const categoriesRaw = await prisma.questionCategory.findMany({
    where: {
      OR: [
        { createdBy: null },
        { createdBy: userId }
      ]
    },
    include: {
      questions: {
        where: {
          OR: [
            { isPublic: true },
            { createdBy: userId }
          ]
        }
      }
    }
  });
  return categoriesRaw;
}


export async function getAvailableQuestions(categoryId: string, coupleId: string) {
  const userId = (await getServerSession(authOptions))?.user?.id;
  
  return await prisma.question.findMany({
    where: {
      categoryId,
      OR: [
        { isPublic: true },
        { createdBy: userId }
      ],
      answers: {
        none: { coupleId } 
      }
    }
  });
}

export async function submitAnswer(data: { questionId: string; coupleId: string; content: string }) {
  const session = await getSession()
  if (!session?.user?.id) return { error: 'Non autorisé' }

  // const existing = await prisma.answer.findFirst({
  //   where: { questionId: data.questionId, userId: session.user.id, coupleId: data.coupleId },
  // })

  // if (existing) {
  //   await prisma.answer.update({
  //     where: { id: existing.id },
  //     data: { content: data.content },
  //   })
  // } else {
    await prisma.answer.create({
      data: { ...data, userId: session.user.id },
    })
  // }

  revalidatePath('/dashboard/couple')
  return { success: true }
}

export async function getAnswersForQuestion(questionId: string, coupleId: string) {
  return prisma.answer.findMany({
    where: { questionId, coupleId },
    include: { user: true },
  })
}

export async function addCoupleGoal(coupleId: string, data: {
  title: string
  description?: string
  deadline?: string
}) {
  const session = await getSession()
  if (!session?.user?.id) return { error: 'Non autorisé' }

  await prisma.coupleGoal.create({
    data: {
      coupleId,
      userId: session.user.id,
      title: data.title,
      description: data.description,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
    },
  })

  revalidatePath('/dashboard/couple')
  return { success: true }
}

export async function toggleCoupleGoal(goalId: string, done: boolean) {
  const session = await getSession()
  if (!session?.user?.id) return { error: 'Non autorisé' }

  await prisma.coupleGoal.update({ where: { id: goalId }, data: { done } })
  revalidatePath('/dashboard/couple')
  return { success: true }
}

export async function addWeeklyCheckin(coupleId: string, data: {
  score: number
  feeling?: string
  improvement?: string
  gratitude?: string
}) {
  const session = await getSession()
  if (!session?.user?.id) return { error: 'Non autorisé' }

  await prisma.weeklyCheckin.create({
    data: { coupleId, userId: session.user.id, ...data },
  })

  revalidatePath('/dashboard/couple')
  return { success: true }
}

export async function addDailyReflection(data: {
  coupleId?: string
  mood: number
  gratitude?: string
  note?: string
}) {
  const session = await getSession()
  if (!session?.user?.id) return { error: 'Non autorisé' }

  await prisma.dailyReflection.create({
    data: { userId: session.user.id, ...data },
  })

  revalidatePath('/dashboard/couple')
  return { success: true }
}

export async function seedQuestions() {
  const categories = [
    {
      title: 'Finances',
      questions: [
        'Comment gérez-vous vos finances personnelles ?',
        'Qui gèrera le budget du foyer ?',
        'Avez-vous des dettes que l\'autre devrait connaître ?',
        'Quelle est votre relation avec l\'argent ?',
      ],
    },
    {
      title: 'Communication',
      questions: [
        'Comment exprimez-vous vos besoins émotionnels ?',
        'Que faites-vous lors d\'une dispute ?',
        'Comment gérez-vous les désaccords ?',
        'Quelle place donnez-vous au silence dans la relation ?',
      ],
    },
    {
      title: 'Foi & Spiritualité',
      questions: [
        'Quelle place la foi a-t-elle dans votre vie quotidienne ?',
        'Comment envisagez-vous l\'éducation spirituelle des enfants ?',
        'Pratiquez-vous votre foi régulièrement ?',
      ],
    },
    {
      title: 'Vie intime',
      questions: [
        'Quelles sont vos attentes en matière d\'intimité ?',
        'Comment parler ouvertement de vos besoins ?',
        'Quelles limites souhaitez-vous poser ?',
      ],
    },
    {
      title: 'Vision de vie',
      questions: [
        'Où souhaitez-vous vivre dans 5 ans ?',
        'Souhaitez-vous des enfants ? Combien ?',
        'Quels sont vos objectifs professionnels ?',
        'Comment imaginez-vous votre retraite ?',
      ],
    },
  ]

  for (const cat of categories) {
    const existing = await prisma.questionCategory.findFirst({ where: { title: cat.title } })
    if (!existing) {
      await prisma.questionCategory.create({
        data: {
          title: cat.title,
          questions: {
            create: cat.questions.map(q => ({ content: q, isPublic: true })),
          },
        },
      })
    }
  }

  return { success: true }
}


export async function invitePartner(partnerEmail: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {error: "Vous devez être connecté"};
  }

  // 1. Vérifier si l'utilisateur à inviter existe
  const partnerUser = await prisma.user.findUnique({
    where: { email: partnerEmail },
  });

  if (!partnerUser) {
    return {error: "Cet utilisateur n'existe pas sur la plateforme."};
  }

  // 2. Vérifier si l'utilisateur ne s'invite pas lui-même
  if (partnerUser.id === session.user.id) {
    return {error: "Vous ne pouvez pas vous inviter vous-même."};
  }

  // 3. Vérifier si l'utilisateur a déjà un couple
  const existingCouple = await prisma.couple.findFirst({
    where: {
      OR: [
        { user1Id: session.user.id },
        { user2Id: session.user.id },
        { user1Id: partnerUser.id },
        { user2Id: partnerUser.id },
      ],
    },
  });

  if (existingCouple) {
    return {error:"L'un de vous fait déjà partie d'un couple."};
  }

  // 4. Création du couple
  await prisma.couple.create({
    data: {
      user1Id: session.user.id,
      user2Id: partnerUser.id,
      relationshipStatus: "KNOWING", // Statut par défaut
    },
  });

  await createNotification({
    userId: partnerUser.id,
    type: "COUPLE_INVITATION", // Assure-t-on que ce type est géré ou utilise un string clair
    title: "Nouvelle invitation de couple",
    message: `${session.user.name} souhaite vous ajouter comme partenaire pour préparer votre mariage !`,
    link: "/dashboard/couple", // Le lien où il pourra accepter
  });
  revalidatePath("/dashboard/couple");
  return { success: true };
}



export async function createCategory(title: string, isPublic: boolean = false) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Non authentifié");

  const category = await prisma.questionCategory.create({
    data: {
      title,
      createdBy: session.user.id,
    },
  });

  revalidatePath("/dashboard/couple");
  return category;
}

export async function createCustomQuestion(categoryId: string, content: string, isPublic: boolean = false) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Non authentifié");

  const question = await prisma.question.create({
    data: {
      categoryId,
      content,
      isPublic,
      createdBy: session.user.id,
    },
  });

  revalidatePath("/dashboard/couple");
  return question;
}

export async function updateCoupleGoal(
  goalId: string, 
  data: { title: string; description?: string; deadline?: string }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Non authentifié");

  const updatedGoal = await prisma.coupleGoal.update({
    where: { id: goalId },
    data: {
      title: data.title,
      description: data.description,
      deadline: data.deadline ? new Date(data.deadline) : null,
    },
  });

  revalidatePath("/dashboard/couple");
  return updatedGoal;
}