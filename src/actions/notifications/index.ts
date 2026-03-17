'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

async function getSession() {
  return getServerSession(authOptions)
}

export async function getNotifications() {
  const session = await getSession()
  if (!session?.user?.id) return []

  return prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
}

export async function getUnreadCount() {
  const session = await getSession()
  if (!session?.user?.id) return 0

  return prisma.notification.count({
    where: { userId: session.user.id, read: false },
  })
}

export async function markAllRead() {
  const session = await getSession()
  if (!session?.user?.id) return

  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  })

  revalidatePath('/dashboard')
}

export async function markRead(id: string) {
  const session = await getSession()
  if (!session?.user?.id) return

  await prisma.notification.update({
    where: { id },
    data: { read: true },
  })
}

export async function createNotification(data: {
  userId: string
  type: string
  title: string
  message: string
  link?: string
}) {
  return prisma.notification.create({ data })
}

export async function deleteNotification(id: string) {
  const session = await getSession()
  if (!session?.user?.id) return

  await prisma.notification.delete({ where: { id } })
  revalidatePath('/dashboard')
}
