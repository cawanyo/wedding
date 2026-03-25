'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createNotification } from '../notifications'
import Pusher from 'pusher'

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
})

async function getSession() {
  return getServerSession(authOptions)
}

// ─────────────────── COUPLE INVITATION FLOW ───────────────────

export async function searchUsersToInvite(query: string) {
  const session = await getSession()
  if (!session?.user?.id) return []
  if (query.length < 2) return []

  const users = await prisma.user.findMany({
    where: {
      AND: [
        { id: { not: session.user.id } },
        {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
      ],
    },
    select: { id: true, name: true, email: true, avatar: true },
    take: 10,
  })
  return users
}

export async function createCoupleWithInvitation(invitedUserId: string) {
  const session = await getSession()
  if (!session?.user?.id) return { error: 'Non autorisé' }

  if (invitedUserId === session.user.id) return { error: 'Vous ne pouvez pas vous inviter vous-même' }

  // Check if users already have active couple
  const existingActive = await prisma.couple.findFirst({
    where: {
      status: 'ACTIVE',
      OR: [
        { user1Id: session.user.id },
        { user2Id: session.user.id },
        { user1Id: invitedUserId },
        { user2Id: invitedUserId },
      ],
    },
  })
  if (existingActive) return { error: 'L\'un de vous est déjà en couple' }

  // Check if already has a pending invitation between these two
  const existingPending = await prisma.couple.findFirst({
    where: {
      status: 'PENDING',
      OR: [
        { user1Id: session.user.id, user2Id: invitedUserId },
        { user1Id: invitedUserId, user2Id: session.user.id },
      ],
    },
  })
  if (existingPending) return { error: 'Une invitation est déjà en attente avec cette personne' }

  // Check for previous (archived) couple with same users
  const archivedCouple = await prisma.couple.findFirst({
    where: {
      status: 'ARCHIVED',
      OR: [
        { user1Id: session.user.id, user2Id: invitedUserId },
        { user1Id: invitedUserId, user2Id: session.user.id },
      ],
    },
    orderBy: { archivedAt: 'desc' },
  })

  const couple = await prisma.couple.create({
    data: {
      user1Id: session.user.id,
      user2Id: invitedUserId,
      invitedUserId,
      status: 'PENDING',
      relationshipStatus: 'KNOWING',
    },
  })

  const inviter = await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true } })
  await createNotification({
    userId: invitedUserId,
    type: 'COUPLE_INVITATION',
    title: 'Invitation de couple',
    message: `${inviter?.name || 'Quelqu\'un'} vous invite à rejoindre son espace couple`,
    link: '/dashboard/couple',
  })

  await pusher.trigger(`user-${invitedUserId}`, 'couple:invitation', { coupleId: couple.id })

  revalidatePath('/dashboard/couple')
  return { success: true, couple, previousCouple: archivedCouple }
}

export async function reactivateArchivedCouple(archivedCoupleId: string, invitedUserId: string) {
  const session = await getSession()
  if (!session?.user?.id) return { error: 'Non autorisé' }

  const archived = await prisma.couple.findUnique({ where: { id: archivedCoupleId } })
  if (!archived || archived.status !== 'ARCHIVED') return { error: 'Couple archivé introuvable' }

  // Reactivate with PENDING status for partner to accept
  await prisma.couple.update({
    where: { id: archivedCoupleId },
    data: {
      status: 'PENDING',
      archivedAt: null,
      archivedBy: null,
      invitedUserId,
      updatedAt: new Date(),
    },
  })

  const inviter = await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true } })
  await createNotification({
    userId: invitedUserId,
    type: 'COUPLE_INVITATION',
    title: 'Invitation à reprendre votre espace couple',
    message: `${inviter?.name || 'Votre ancien partenaire'} vous invite à reprendre votre espace couple`,
    link: '/dashboard/couple',
  })

  revalidatePath('/dashboard/couple')
  return { success: true }
}

export async function acceptCoupleInvitation(coupleId: string) {
  const session = await getSession()
  if (!session?.user?.id) return { error: 'Non autorisé' }

  const couple = await prisma.couple.findUnique({ where: { id: coupleId } })
  if (!couple) return { error: 'Invitation introuvable' }
  if (couple.user2Id !== session.user.id) return { error: 'Cette invitation ne vous est pas destinée' }
  if (couple.status !== 'PENDING') return { error: 'Cette invitation n\'est plus valide' }

  await prisma.couple.update({
    where: { id: coupleId },
    data: { status: 'ACTIVE', invitedUserId: null },
  })

  const accepter = await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true } })
  await createNotification({
    userId: couple.user1Id,
    type: 'COUPLE_ACCEPTED',
    title: 'Invitation acceptée !',
    message: `${accepter?.name || 'Votre partenaire'} a accepté votre invitation. Votre espace couple est maintenant actif !`,
    link: '/dashboard/couple',
  })

  await pusher.trigger(`user-${couple.user1Id}`, 'couple:accepted', { coupleId })

  revalidatePath('/dashboard/couple')
  return { success: true }
}

export async function denyCoupleInvitation(coupleId: string) {
  const session = await getSession()
  if (!session?.user?.id) return { error: 'Non autorisé' }

  const couple = await prisma.couple.findUnique({ where: { id: coupleId } })
  if (!couple) return { error: 'Invitation introuvable' }
  if (couple.user2Id !== session.user.id) return { error: 'Cette invitation ne vous est pas destinée' }

  await prisma.couple.delete({ where: { id: coupleId } })

  const denier = await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true } })
  await createNotification({
    userId: couple.user1Id,
    type: 'COUPLE_DENIED',
    title: 'Invitation refusée',
    message: `${denier?.name || 'La personne invitée'} a décliné votre invitation de couple`,
    link: '/dashboard/couple',
  })

  await pusher.trigger(`user-${couple.user1Id}`, 'couple:denied', { coupleId })

  revalidatePath('/dashboard/couple')
  return { success: true }
}

export async function cancelCoupleInvitation(coupleId: string) {
  const session = await getSession()
  if (!session?.user?.id) return { error: 'Non autorisé' }

  const couple = await prisma.couple.findUnique({ where: { id: coupleId } })
  if (!couple || couple.user1Id !== session.user.id) return { error: 'Non autorisé' }

  await prisma.couple.delete({ where: { id: coupleId } })
  revalidatePath('/dashboard/couple')
  return { success: true }
}

// ─────────────────── GET COUPLE DATA ───────────────────

export async function getMyCouple() {
  const session = await getSession()
  if (!session?.user?.id) return null

  return prisma.couple.findFirst({
    where: {
      status: 'ACTIVE',
      OR: [{ user1Id: session.user.id }, { user2Id: session.user.id }],
    },
    include: {
      user1: true,
      user2: true,
      goals: { include: { user: true }, orderBy: { createdAt: 'desc' } },
      checkins: { include: { user: true }, orderBy: { week: 'desc' } },
      reflections: { include: { user: true }, orderBy: { date: 'desc' } },
    },
  })
}

export async function getPendingInvitation() {
  const session = await getSession()
  if (!session?.user?.id) return null

  return prisma.couple.findFirst({
    where: {
      status: 'PENDING',
      user2Id: session.user.id,
    },
    include: { user1: true },
  })
}

export async function getMyPendingCouple() {
  const session = await getSession()
  if (!session?.user?.id) return null

  return prisma.couple.findFirst({
    where: {
      status: 'PENDING',
      user1Id: session.user.id,
    },
    include: { user2: true },
  })
}

export async function getArchivedCouples() {
  const session = await getSession()
  if (!session?.user?.id) return []

  return prisma.couple.findMany({
    where: {
      status: 'ARCHIVED',
      OR: [{ user1Id: session.user.id }, { user2Id: session.user.id }],
    },
    include: {
      user1: true,
      user2: true,
      goals: true,
      checkins: { include: { user: true } },
      reflections: { include: { user: true } },
    },
    orderBy: { archivedAt: 'desc' },
  })
}

export async function checkPreviousCoupleWithUser(targetUserId: string) {
  const session = await getSession()
  if (!session?.user?.id) return null

  return prisma.couple.findFirst({
    where: {
      status: 'ARCHIVED',
      OR: [
        { user1Id: session.user.id, user2Id: targetUserId },
        { user1Id: targetUserId, user2Id: session.user.id },
      ],
    },
    include: { user1: true, user2: true },
    orderBy: { archivedAt: 'desc' },
  })
}

// ─────────────────── LEAVE / ARCHIVE ───────────────────

export async function leaveCouple(coupleId: string) {
  const session = await getSession()
  if (!session?.user?.id) return { error: 'Non autorisé' }

  const couple = await prisma.couple.findUnique({
    where: { id: coupleId },
    include: { user1: true, user2: true },
  })
  if (!couple) return { error: 'Espace couple introuvable' }

  const isUser1 = couple.user1Id === session.user.id
  const isUser2 = couple.user2Id === session.user.id
  if (!isUser1 && !isUser2) return { error: 'Vous ne faites pas partie de ce couple' }

  // Archive instead of delete
  await prisma.couple.update({
    where: { id: coupleId },
    data: {
      status: 'ARCHIVED',
      archivedAt: new Date(),
      archivedBy: session.user.id,
    },
  })

  // Notify the other partner
  const otherUserId = isUser1 ? couple.user2Id : couple.user1Id
  const leavingUser = isUser1 ? couple.user1 : couple.user2
  if (otherUserId) {
    await createNotification({
      userId: otherUserId,
      type: 'COUPLE_LEFT',
      title: 'Espace couple quitté',
      message: `${leavingUser?.name || 'Votre partenaire'} a quitté votre espace couple. Vous êtes maintenant célibataire.`,
      link: '/dashboard/couple',
    })
    await pusher.trigger(`user-${otherUserId}`, 'couple:left', { coupleId })
  }

  revalidatePath('/dashboard/couple')
  return { success: true }
}

// ─────────────────── RELATIONSHIP STATUS ───────────────────

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

// ─────────────────── QUESTIONS ───────────────────

export async function getQuestionCategories() {
  const session = await getSession()
  if (!session?.user?.id) return []
  const userId = session.user.id

  return prisma.questionCategory.findMany({
    where: { OR: [{ createdBy: null }, { createdBy: userId }] },
    include: {
      questions: {
        where: { OR: [{ isPublic: true }, { createdBy: userId }] },
      },
    },
  })
}

export async function getAvailableQuestions(categoryId: string, coupleId: string) {
  const userId = (await getServerSession(authOptions))?.user?.id
  return prisma.question.findMany({
    where: {
      categoryId,
      OR: [{ isPublic: true }, { createdBy: userId }],
      answers: { none: { coupleId } },
    },
  })
}

export async function submitAnswer(data: { questionId: string; coupleId: string; content: string }) {
  const session = await getSession()
  if (!session?.user?.id) return { error: 'Non autorisé' }

  await prisma.answer.create({
    data: { ...data, userId: session.user.id },
  })
  await pusher.trigger(`couple-${data.coupleId}`, 'new-answer', {
    questionId: data.questionId,
    answer: data.content,
  })

  revalidatePath('/dashboard/couple')
  return { success: true }
}

export async function getAnswersForQuestion(questionId: string, coupleId: string) {
  return prisma.answer.findMany({
    where: { questionId, coupleId },
    include: { user: true },
  })
}

export async function createCategory(title: string) {
  const session = await getSession()
  if (!session?.user) throw new Error('Non authentifié')

  const category = await prisma.questionCategory.create({
    data: { title, createdBy: session.user.id },
  })

  revalidatePath('/dashboard/couple')
  return category
}

export async function createCustomQuestion(categoryId: string, content: string, isPublic = false) {
  const session = await getSession()
  if (!session?.user) throw new Error('Non authentifié')

  const question = await prisma.question.create({
    data: { categoryId, content, isPublic, createdBy: session.user.id },
  })

  revalidatePath('/dashboard/couple')
  return question
}

// ─────────────────── GOALS ───────────────────

export async function addCoupleGoal(coupleId: string, data: {
  title: string; description?: string; deadline?: string
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

export async function updateCoupleGoal(goalId: string, data: {
  title: string; description?: string; deadline?: string; progress: number
}) {
  const session = await getSession()
  if (!session?.user) throw new Error('Non authentifié')

  const updatedGoal = await prisma.coupleGoal.update({
    where: { id: goalId },
    data: {
      title: data.title,
      description: data.description,
      deadline: data.deadline ? new Date(data.deadline) : null,
      progress: Number(data.progress),
      done: Number(data.progress) === 100,
    },
  })

  revalidatePath('/dashboard/couple')
  return updatedGoal
}

// ─────────────────── CHECK-IN / REFLECTIONS ───────────────────

export async function addWeeklyCheckin(coupleId: string, data: {
  score: number; feeling?: string; improvement?: string; gratitude?: string
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
  coupleId?: string; mood: number; gratitude?: string; note?: string
}) {
  const session = await getSession()
  if (!session?.user?.id) return { error: 'Non autorisé' }

  await prisma.dailyReflection.create({
    data: { userId: session.user.id, ...data },
  })

  revalidatePath('/dashboard/couple')
  return { success: true }
}

// ─────────────────── MESSAGING ───────────────────

export async function sendMessage(coupleId: string, content: string) {
  const session = await getSession()
  if (!session?.user?.id) return { error: 'Non autorisé' }
  if (!content.trim()) return { error: 'Message vide' }

  const message = await prisma.message.create({
    data: { coupleId, senderId: session.user.id, content: content.trim() },
    include: { sender: { select: { id: true, name: true, avatar: true } } },
  })

  await pusher.trigger(`couple-${coupleId}`, 'new-message', {
    id: message.id,
    content: message.content,
    senderId: message.senderId,
    senderName: message.sender.name,
    senderImage: message.sender.avatar,
    createdAt: message.createdAt,
  })

  return { success: true, message }
}

export async function getMessages(coupleId: string) {
  return prisma.message.findMany({
    where: { coupleId },
    include: { sender: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: 'asc' },
    take: 100,
  })
}

export async function markMessagesRead(coupleId: string) {
  const session = await getSession()
  if (!session?.user?.id) return

  await prisma.message.updateMany({
    where: { coupleId, senderId: { not: session.user.id }, read: false },
    data: { read: true },
  })
}

export async function getUnreadMessageCount(coupleId: string) {
  const session = await getSession()
  if (!session?.user?.id) return 0

  return prisma.message.count({
    where: { coupleId, senderId: { not: session.user.id }, read: false },
  })
}

// ─────────────────── COUPLE ROADMAPS ───────────────────

export async function getCoupleRoadmaps(coupleId: string) {
  return prisma.coupleRoadmap.findMany({
    where: { coupleId },
    include: {
      roadmap: {
        include: {
          sections: {
            include: { items: { orderBy: { order: 'asc' } } },
            orderBy: { order: 'asc' },
          },
        },
      },
      answers: { include: { user: true } },
    },
    orderBy: { startedAt: 'desc' },
  })
}

export async function startCoupleRoadmap(roadmapId: string, coupleId: string) {
  const session = await getSession()
  if (!session?.user?.id) return { error: 'Non autorisé' }

  const existing = await prisma.coupleRoadmap.findUnique({
    where: { coupleId_roadmapId: { coupleId, roadmapId } },
  })
  if (existing) return { success: true, coupleRoadmap: existing }

  const coupleRoadmap = await prisma.coupleRoadmap.create({
    data: { coupleId, roadmapId },
  })

  revalidatePath('/dashboard/couple')
  return { success: true, coupleRoadmap }
}

export async function saveCoupleRoadmapAnswer(coupleRoadmapId: string, itemId: string, content: string) {
  const session = await getSession()
  if (!session?.user?.id) return { error: 'Non autorisé' }

  await prisma.coupleRoadmapAnswer.upsert({
    where: { coupleRoadmapId_userId_itemId: { coupleRoadmapId, userId: session.user.id, itemId } },
    update: { content, updatedAt: new Date() },
    create: { coupleRoadmapId, userId: session.user.id, itemId, content },
  })

  const cr = await prisma.coupleRoadmap.findUnique({ where: { id: coupleRoadmapId }, select: { coupleId: true } })
  if (cr?.coupleId) {
    await pusher.trigger(`couple-${cr.coupleId}`, 'roadmap-answer', { coupleRoadmapId, itemId })
  }

  revalidatePath('/dashboard/couple')
  return { success: true }
}

export async function updateCoupleRoadmapSection(coupleRoadmapId: string, sectionIndex: number) {
  const session = await getSession()
  if (!session?.user?.id) return { error: 'Non autorisé' }

  await prisma.coupleRoadmap.update({
    where: { id: coupleRoadmapId },
    data: { currentSection: sectionIndex },
  })

  revalidatePath('/dashboard/couple')
  return { success: true }
}

export async function completeCoupleRoadmap(coupleRoadmapId: string) {
  const session = await getSession()
  if (!session?.user?.id) return { error: 'Non autorisé' }

  await prisma.coupleRoadmap.update({
    where: { id: coupleRoadmapId },
    data: { completedAt: new Date() },
  })

  revalidatePath('/dashboard/couple')
  return { success: true }
}

// ─────────────────── SEED ───────────────────

export async function seedQuestions() {
  const categories = [
    { title: 'Finances', questions: ['Comment gérez-vous vos finances personnelles ?', 'Qui gèrera le budget du foyer ?', 'Avez-vous des dettes que l\'autre devrait connaître ?', 'Quelle est votre relation avec l\'argent ?'] },
    { title: 'Communication', questions: ['Comment exprimez-vous vos besoins émotionnels ?', 'Que faites-vous lors d\'une dispute ?', 'Comment gérez-vous les désaccords ?', 'Quelle place donnez-vous au silence dans la relation ?'] },
    { title: 'Foi & Spiritualité', questions: ['Quelle place la foi a-t-elle dans votre vie quotidienne ?', 'Comment envisagez-vous l\'éducation spirituelle des enfants ?', 'Pratiquez-vous votre foi régulièrement ?'] },
    { title: 'Vie intime', questions: ['Quelles sont vos attentes en matière d\'intimité ?', 'Comment parler ouvertement de vos besoins ?', 'Quelles limites souhaitez-vous poser ?'] },
    { title: 'Vision de vie', questions: ['Où souhaitez-vous vivre dans 5 ans ?', 'Souhaitez-vous des enfants ? Combien ?', 'Quels sont vos objectifs professionnels ?', 'Comment imaginez-vous votre retraite ?'] },
  ]

  for (const cat of categories) {
    const existing = await prisma.questionCategory.findFirst({ where: { title: cat.title } })
    if (!existing) {
      await prisma.questionCategory.create({
        data: {
          title: cat.title,
          questions: { create: cat.questions.map(q => ({ content: q, isPublic: true })) },
        },
      })
    }
  }

  return { success: true }
}

export async function invitePartner(partnerEmail: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { error: 'Vous devez être connecté' }

  const partnerUser = await prisma.user.findUnique({ where: { email: partnerEmail } })
  if (!partnerUser) return { error: 'Cet utilisateur n\'existe pas sur la plateforme.' }
  if (partnerUser.id === session.user.id) return { error: 'Vous ne pouvez pas vous inviter vous-même.' }

  const existingCouple = await prisma.couple.findFirst({
    where: {
      status: { in: ['ACTIVE', 'PENDING'] },
      OR: [{ user1Id: session.user.id }, { user2Id: session.user.id }, { user1Id: partnerUser.id }, { user2Id: partnerUser.id }],
    },
  })
  if (existingCouple) return { error: 'L\'un de vous fait déjà partie d\'un couple.' }

  await prisma.couple.create({
    data: {
      user1Id: session.user.id,
      user2Id: partnerUser.id,
      invitedUserId: partnerUser.id,
      status: 'PENDING',
      relationshipStatus: 'KNOWING',
    },
  })

  await createNotification({
    userId: partnerUser.id,
    type: 'COUPLE_INVITATION',
    title: 'Nouvelle invitation de couple',
    message: `${session.user.name} vous invite à rejoindre son espace couple`,
    link: '/dashboard/couple',
  })

  revalidatePath('/dashboard/couple')
  return { success: true }
}
