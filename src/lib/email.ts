import nodemailer from 'nodemailer'

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  const host = process.env.EMAIL_SERVER_HOST
  const port = Number(process.env.EMAIL_SERVER_PORT) || 587
  const user = process.env.EMAIL_SERVER_USER
  const pass = process.env.EMAIL_SERVER_PASSWORD

  if (!user || !pass) {
    // Dev fallback: just log the email
    console.log('\n📧 EMAIL (dev mode — configure EMAIL_SERVER_* in .env)')
    console.log('To:', to)
    console.log('Subject:', subject)
    console.log('Body:', html.replace(/<[^>]+>/g, ''))
    console.log('---')
    return
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || user,
    to,
    subject,
    html,
  })
}
