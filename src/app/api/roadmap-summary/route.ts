import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Clé API Gemini non configurée (GEMINI_API_KEY)' }, { status: 500 })

  try {
    const { answers, roadmapTitle, isCouple, partnerName } = await req.json()

    const answersText = answers.map((a: { question: string; answer: string; author?: string }) =>
      `${a.author ? `[${a.author}] ` : ''}**${a.question}**\n${a.answer}`
    ).join('\n\n')

    const prompt = isCouple
      ? `Tu es un coach de couple bienveillant et perspicace. Analyse les réponses de ce couple au roadmap "${roadmapTitle}" et génère un résumé profond et constructif.

Réponses du couple :
${answersText}

Génère un résumé en JSON avec cette structure exacte (sans texte supplémentaire) :
{
  "title": "Titre inspirant du résumé",
  "synthesis": "Synthèse générale en 2-3 paragraphes sur le couple d'après leurs réponses",
  "strengths": ["Force 1 du couple observée", "Force 2", "Force 3"],
  "growthAreas": ["Axe de croissance 1", "Axe de croissance 2"],
  "recommendations": ["Recommandation pratique 1", "Recommandation pratique 2", "Recommandation pratique 3"],
  "coupleMessage": "Un message d'encouragement personnalisé pour ce couple"
}`
      : `Tu es un coach de développement personnel bienveillant. Analyse les réponses de cette personne au roadmap "${roadmapTitle}" et génère un résumé profond et constructif.

Réponses :
${answersText}

Génère un résumé en JSON avec cette structure exacte (sans texte supplémentaire) :
{
  "title": "Titre inspirant du résumé",
  "synthesis": "Synthèse générale en 2-3 paragraphes sur la personne d'après ses réponses",
  "strengths": ["Force 1 observée", "Force 2", "Force 3"],
  "growthAreas": ["Axe de croissance 1", "Axe de croissance 2"],
  "recommendations": ["Recommandation pratique 1", "Recommandation pratique 2", "Recommandation pratique 3"],
  "personalMessage": "Un message d'encouragement personnalisé"
}`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 2048 },
        }),
      }
    )

    if (!response.ok) return NextResponse.json({ error: 'Erreur API Gemini' }, { status: 500 })

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) return NextResponse.json({ error: 'Réponse vide' }, { status: 500 })

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'Format invalide' }, { status: 500 })

    const summary = JSON.parse(jsonMatch[0])
    return NextResponse.json({ success: true, summary })
  } catch (err) {
    console.error('Roadmap summary error:', err)
    return NextResponse.json({ error: 'Erreur lors de la génération du résumé' }, { status: 500 })
  }
}
