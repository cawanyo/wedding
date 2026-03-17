'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

async function getSession() {
  return getServerSession(authOptions)
}

export async function createStep(projectId: string, data: {
  title: string
  description?: string
  dueDate?: string
  budgetLimit?: number
  order?: number
}) {
  const session = await getSession()
  if (!session?.user?.id) return { error: 'Non autorisé' }

  const step = await prisma.weddingStep.create({
    data: {
      projectId,
      title: data.title,
      description: data.description,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      budgetLimit: data.budgetLimit,
      order: data.order ?? 0,
    },
  })

  revalidatePath(`/dashboard/wedding/${projectId}`)
  return { success: true, step }
}

export async function updateStep(stepId: string, data: {
  title?: string
  description?: string
  dueDate?: string
  budgetLimit?: number
}) {
  const session = await getSession()
  if (!session?.user?.id) return { error: 'Non autorisé' }

  await prisma.weddingStep.update({
    where: { id: stepId },
    data: {
      title: data.title,
      description: data.description,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      budgetLimit: data.budgetLimit,
    },
  })

  return { success: true }
}

export async function deleteStep(stepId: string) {
  const session = await getSession()
  if (!session?.user?.id) return { error: 'Non autorisé' }

  await prisma.weddingStep.delete({ where: { id: stepId } })
  return { success: true }
}
