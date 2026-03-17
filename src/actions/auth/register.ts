'use server'

import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signupSchema } from '@/lib/validations'

export async function registerUser(data: {
  name: string
  email: string
  password: string
  confirmPassword: string
}) {
  const parsed = signupSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const existing = await prisma.user.findUnique({ where: { email: data.email } })
  if (existing) {
    return { error: 'Cet email est déjà utilisé' }
  }

  const hashed = await bcrypt.hash(data.password, 12)

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashed,
    },
  })

  return { success: true, userId: user.id }
}
