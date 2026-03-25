import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Clé API Gemini non configurée' }, { status: 500 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    const fileBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(fileBuffer).toString('base64')
    const mimeType = file.type || 'application/pdf'

    const prompt = `Tu es un expert en développement personnel. Analyse ce document PDF et crée un roadmap de découverte de soi structuré.

Retourne UNIQUEMENT un JSON valide avec cette structure exacte, sans texte supplémentaire :
{
  "title": "Titre du roadmap (basé sur le contenu du PDF)",
  "description": "Description courte du roadmap (2-3 phrases)",
  "icon": "Un emoji représentatif",
  "color": "from-blue-400 to-indigo-500",
  "sections": [
    {
      "title": "Titre de la section",
      "description": "Description courte de la section",
      "items": [
        {
          "type": "EXPLANATION",
          "title": "Titre de l'item",
          "content": "Contenu détaillé (explication, exercice ou question)"
        }
      ]
    }
  ]
}

Types d'items possibles :
- EXPLANATION : explication théorique ou concept clé
- EXERCISE : exercice pratique à réaliser
- QUESTION : question de réflexion personnelle à répondre par écrit
- REFLECTION : réflexion profonde de synthèse

Crée 3 à 5 sections, chaque section ayant 3 à 5 items de types variés. Le contenu doit être en français, personnel, inspirant et actionnable.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64,
                  },
                },
                { text: prompt },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
          },
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('Gemini API error:', error)
      return NextResponse.json({ error: 'Erreur de l\'API Gemini' }, { status: 500 })
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      return NextResponse.json({ error: 'Réponse vide de l\'IA' }, { status: 500 })
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Impossible de parser la réponse de l\'IA' }, { status: 500 })
    }

    const roadmapData = JSON.parse(jsonMatch[0])
    return NextResponse.json({ success: true, roadmap: roadmapData })
  } catch (err) {
    console.error('Error processing PDF:', err)
    return NextResponse.json({ error: 'Erreur lors du traitement du fichier' }, { status: 500 })
  }
}
