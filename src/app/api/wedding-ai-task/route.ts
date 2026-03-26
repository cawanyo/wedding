import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const apiKey = process.env.GROK_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Clé API manquante' }, { status: 500 })

  try {
    const { taskTitle, taskDescription, projectContext, message, history } = await req.json()

    const systemPrompt = `Tu es un expert en organisation de mariage. L'utilisateur organise son mariage et a des questions sur une tâche spécifique.
Contexte du projet : ${projectContext || ''}
Tâche : ${taskTitle}
Description : ${taskDescription || ''}

Quand on te demande des prestataires, donne des conseils généraux sur le type de prestataires à chercher et les fourchettes de prix typiques en France.
Réponds de manière concise et pratique en français.`

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []),
      { role: 'user', content: message },
    ]

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    })

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || 'Désolé, je ne peux pas répondre pour le moment.'
    return NextResponse.json({ success: true, reply })
  } catch (err: unknown) {
    console.error('Wedding AI task error:', err)
    return NextResponse.json({ error: 'Erreur lors de la réponse IA' }, { status: 500 })
  }
}
