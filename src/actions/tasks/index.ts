'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createNotification } from '@/actions/notifications'

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'VALIDATED'

async function getSession() {
  return getServerSession(authOptions)
}

export async function createTask(stepId: string, projectId: string, data: {
  title: string
  description?: string
  assignedTo?: string
  dueDate?: string
  budgetLimit?: number
}) {
  const session = await getSession()
  if (!session?.user?.id) return { error: 'Non autorisé' }

  const task = await prisma.task.create({
    data: {
      stepId,
      title: data.title,
      description: data.description,
      assignedTo: data.assignedTo,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      budgetLimit: data.budgetLimit,
    },
  })

  if (data.assignedTo && data.assignedTo !== session.user.id) {
    const assigner = await prisma.user.findUnique({ where: { id: session.user.id } })
    await createNotification({
      userId: data.assignedTo,
      type: 'TASK_ASSIGNED',
      title: 'Tâche assignée',
      message: `${assigner?.name ?? 'Quelqu\'un'} vous a assigné la tâche "${data.title}"`,
      link: `/dashboard/wedding/${projectId}`,
    })
  }

  revalidatePath(`/dashboard/wedding/${projectId}`)
  return { success: true, task }
}

export async function updateTask(taskId: string, projectId: string, data: {
  title?: string
  description?: string
  assignedTo?: string
  dueDate?: string
  budgetLimit?: number
  realCost?: number
  status?: TaskStatus
}) {
  const session = await getSession()
  if (!session?.user?.id) return { error: 'Non autorisé' }

  const prev = await prisma.task.findUnique({ where: { id: taskId } })

  await prisma.task.update({
    where: { id: taskId },
    data: {
      title: data.title,
      description: data.description,
      assignedTo: data.assignedTo,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      budgetLimit: data.budgetLimit,
      realCost: data.realCost,
      status: data.status,
    },
  })

  if (data.status === 'VALIDATED' && prev?.assignedTo && prev.assignedTo !== session.user.id) {
    await createNotification({
      userId: prev.assignedTo,
      type: 'TASK_VALIDATED',
      title: 'Tâche validée',
      message: `Votre tâche "${prev.title}" a été validée`,
      link: `/dashboard/wedding/${projectId}`,
    })
  }

  if (data.assignedTo && data.assignedTo !== prev?.assignedTo && data.assignedTo !== session.user.id) {
    const assigner = await prisma.user.findUnique({ where: { id: session.user.id } })
    await createNotification({
      userId: data.assignedTo,
      type: 'TASK_ASSIGNED',
      title: 'Tâche assignée',
      message: `${assigner?.name ?? 'Quelqu\'un'} vous a assigné la tâche "${data.title ?? prev?.title}"`,
      link: `/dashboard/wedding/${projectId}`,
    })
  }

  revalidatePath(`/dashboard/wedding/${projectId}`)
  return { success: true }
}

export async function deleteTask(taskId: string, projectId: string) {
  const session = await getSession()
  if (!session?.user?.id) return { error: 'Non autorisé' }

  await prisma.task.delete({ where: { id: taskId } })
  revalidatePath(`/dashboard/wedding/${projectId}`)
  return { success: true }
}

export async function addComment(taskId: string, message: string) {
  const session = await getSession()
  if (!session?.user?.id) return { error: 'Non autorisé' }

  const comment = await prisma.taskComment.create({
    data: { taskId, userId: session.user.id, message },
    include: { user: true },
  })

  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (task?.assignedTo && task.assignedTo !== session.user.id) {
    const commenter = await prisma.user.findUnique({ where: { id: session.user.id } })
    await createNotification({
      userId: task.assignedTo,
      type: 'TASK_COMMENT',
      title: 'Nouveau commentaire',
      message: `${commenter?.name ?? 'Quelqu\'un'} a commenté la tâche "${task.title}"`,
    })
  }

  return { success: true, comment }
}
