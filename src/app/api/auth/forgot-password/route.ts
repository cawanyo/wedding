import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email requis' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return NextResponse.json({ success: true })

  await prisma.passwordResetToken.updateMany({
    where: { email, used: false },
    data: { used: true },
  })

  const code = String(Math.floor(100000 + Math.random() * 900000))
  const hashedCode = await bcrypt.hash(code, 10)
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

  await prisma.passwordResetToken.create({
    data: { email, token: hashedCode, expiresAt },
  })

  await sendEmail({
    to: email,
    subject: 'Votre code de réinitialisation',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:16px">
        <div style="text-align:center;margin-bottom:24px">
          <div style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#ec4899);border-radius:12px;padding:12px 20px">
            <span style="font-size:24px">💍</span>
          </div>
        </div>
        <h2 style="color:#111;text-align:center;margin-bottom:8px">Réinitialisation du mot de passe</h2>
        <p style="color:#555;text-align:center;font-size:14px;margin-bottom:32px">
          Utilisez ce code pour réinitialiser votre mot de passe. Valable 15 minutes.
        </p>
        <div style="background:#f5f3ff;border:2px dashed #7c3aed;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px">
          <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#7c3aed">${code}</span>
        </div>
        <p style="color:#888;font-size:12px;text-align:center">
          Ce code expire dans 15 minutes. Si vous n'avez pas fait cette demande, ignorez cet email.
        </p>
      </div>
    `,
  })

  const isDev = process.env.NODE_ENV === 'development' && !process.env.EMAIL_SERVER_USER
  return NextResponse.json({ success: true, ...(isDev && { devCode: code }) })
}
