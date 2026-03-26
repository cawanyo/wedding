import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const apiKey = process.env.GROK_API_KEY
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

          const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages: [
                { role: "system", content: "Tu es un expert en mariage. Réponds uniquement en JSON." },
                { 
                  role: "user", 
                  content: prompt

                } 
               
              ],
              response_format: { type: "json_object" }
            }),
          });

          const data = await response.json();
          return NextResponse.json(JSON.parse(data.choices[0].message.content));
  } catch (err) {
    console.error('Roadmap summary error:', err)
    return NextResponse.json({ error: 'Erreur lors de la génération du résumé' }, { status: 500 })
  }
}
