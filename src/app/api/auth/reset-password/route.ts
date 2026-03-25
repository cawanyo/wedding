import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { email, code, password } = await req.json()
  if (!email || !code || !password) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Mot de passe trop court (min. 6 caractères)' }, { status: 400 })
  }

  const tokens = await prisma.passwordResetToken.findMany({
    where: { email, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
    take: 3,
  })

  let validToken = null
  for (const t of tokens) {
    const match = await bcrypt.compare(code, t.token)
    if (match) { validToken = t; break }
  }

  if (!validToken) {
    return NextResponse.json({ error: 'Code invalide ou expiré' }, { status: 400 })
  }

  await prisma.passwordResetToken.update({
    where: { id: validToken.id },
    data: { used: true },
  })

  const hashed = await bcrypt.hash(password, 12)
  await prisma.user.update({
    where: { email },
    data: { password: hashed },
  })

  return NextResponse.json({ success: true })
}
