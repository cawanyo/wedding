'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

async function getSession() {
  return getServerSession(authOptions)
}

export async function createWeddingProject(data: {
  title: string
  description?: string
  weddingDate?: string
}) {
  const session = await getSession()
  if (!session?.user?.id) return { error: 'Non autorisé' }

  const project = await prisma.weddingProject.create({
    data: {
      title: data.title,
      description: data.description,
      weddingDate: data.weddingDate ? new Date(data.weddingDate) : undefined,
      ownerId: session.user.id,
      members: {
        create: { userId: session.user.id, role: 'EDITOR' },
      },
    },
  })

  revalidatePath('/dashboard/wedding')
  return { success: true, project }
}

export async function getMyProjects() {
  const session = await getSession()
  if (!session?.user?.id) return []

  return prisma.weddingProject.findMany({
    where: {
      members: { some: { userId: session.user.id } },
    },
    include: {
      members: { include: { user: true } },
      steps: {
        include: {
          tasks: true,
        },
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getProjectById(projectId: string) {
  const session = await getSession()
  if (!session?.user?.id) return null

  return prisma.weddingProject.findFirst({
    where: {
      id: projectId,
      members: { some: { userId: session.user.id } },
    },
    include: {
      owner: true,
      members: { include: { user: true } },
      steps: {
        include: {
          tasks: {
            include: { assignee: true, comments: { include: { user: true } } },
          },
        },
        orderBy: { order: 'asc' },
      },
      vendors: true,
      guests: true,
    },
  })
}

export async function updateWeddingProject(
  projectId: string,
  data: { title?: string; description?: string; weddingDate?: string }
) {
  const session = await getSession()
  if (!session?.user?.id) return { error: 'Non autorisé' }

  await prisma.weddingProject.update({
    where: { id: projectId },
    data: {
      title: data.title,
      description: data.description,
      weddingDate: data.weddingDate ? new Date(data.weddingDate) : undefined,
    },
  })

  revalidatePath('/dashboard/wedding')
  return { success: true }
}

export async function inviteMember(projectId: string, email: string) {
  const session = await getSession()
  if (!session?.user?.id) return { error: 'Non autorisé' }

  const invitee = await prisma.user.findUnique({ where: { email } })
  if (!invitee) return { error: 'Utilisateur introuvable' }

  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: invitee.id } },
  })
  if (existing) return { error: 'Déjà membre' }

  await prisma.projectMember.create({
    data: { projectId, userId: invitee.id, role: 'READER' },
  })

  revalidatePath(`/dashboard/wedding/${projectId}`)
  return { success: true }
}
