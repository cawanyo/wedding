'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

async function getSession() {
  return getServerSession(authOptions)
}

export async function getFinance(projectId: string) {
  const session = await getSession()
  if (!session?.user?.id) return null

  const records = await prisma.financeRecord.findMany({
    where: { projectId },
    include: { step: true, task: true },
    orderBy: { createdAt: 'desc' },
  })

  const totalBudget = records.filter(r => r.type === 'BUDGET').reduce((s, r) => s + r.amount, 0)
  const totalExpense = records.filter(r => r.type === 'EXPENSE').reduce((s, r) => s + r.amount, 0)

  return { records, totalBudget, totalExpense, diff: totalBudget - totalExpense }
}

export async function addFinanceRecord(projectId: string, data: {
  label: string
  amount: number
  type: 'BUDGET' | 'EXPENSE'
  stepId?: string
  taskId?: string
}) {
  const session = await getSession()
  if (!session?.user?.id) return { error: 'Non autorisé' }

  await prisma.financeRecord.create({
    data: { projectId, ...data },
  })

  revalidatePath(`/dashboard/wedding/${projectId}`)
  return { success: true }
}

export async function deleteFinanceRecord(id: string, projectId: string) {
  const session = await getSession()
  if (!session?.user?.id) return { error: 'Non autorisé' }

  await prisma.financeRecord.delete({ where: { id } })
  revalidatePath(`/dashboard/wedding/${projectId}`)
  return { success: true }
}

export async function addVendor(projectId: string, data: {
  name: string
  category: string
  contact?: string
  price?: number
  notes?: string
}) {
  const session = await getSession()
  if (!session?.user?.id) return { error: 'Non autorisé' }

  await prisma.vendor.create({ data: { projectId, ...data } })
  revalidatePath(`/dashboard/wedding/${projectId}`)
  return { success: true }
}

export async function addGuest(projectId: string, data: {
  name: string
  phone?: string
  email?: string
  confirmed?: boolean
  table?: string
}) {
  const session = await getSession()
  if (!session?.user?.id) return { error: 'Non autorisé' }

  await prisma.guest.create({ data: { projectId, ...data } })
  revalidatePath(`/dashboard/wedding/${projectId}`)
  return { success: true }
}

export async function updateGuest(guestId: string, data: { confirmed?: boolean; table?: string }) {
  const session = await getSession()
  if (!session?.user?.id) return { error: 'Non autorisé' }

  await prisma.guest.update({ where: { id: guestId }, data })
  return { success: true }
}
