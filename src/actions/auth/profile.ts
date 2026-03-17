'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getSession() {
  return getServerSession(authOptions)
}

export async function updateProfile(data: {
  name?: string
  gender?: string
  birthday?: string
  location?: string
}) {
  const session = await getSession()
  if (!session?.user?.id) return { error: 'Non autorisé' }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: data.name,
      gender: data.gender,
      birthday: data.birthday ? new Date(data.birthday) : undefined,
      location: data.location,
    },
  })

  revalidatePath('/dashboard/profile')
  return { success: true }
}
