import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY non configurée' }, { status: 500 })

  try {
    const { description, budget, style, guestCount, date } = await req.json()

    const prompt = `Tu es un expert en organisation de mariage. Génère un plan de mariage complet et détaillé basé sur ces informations :

Description : ${description}
Budget total : ${budget ? `${budget} €` : 'Non précisé'}
Style souhaité : ${style || 'Non précisé'}
Nombre d'invités : ${guestCount || 'Non précisé'}
Date envisagée : ${date || 'Non précisée'}

Génère un plan en JSON avec cette structure exacte (sans texte supplémentaire) :
{
  "title": "Titre poétique pour ce mariage",
  "description": "Description inspirante du concept de ce mariage",
  "budgetBreakdown": [
    { "category": "Lieu de réception", "percentage": 30, "estimatedAmount": 0, "tips": "Conseil pour économiser" }
  ],
  "timeline": [
    { "period": "12 mois avant", "tasks": ["Tâche 1", "Tâche 2", "Tâche 3"] },
    { "period": "9 mois avant", "tasks": ["Tâche 1", "Tâche 2"] },
    { "period": "6 mois avant", "tasks": ["Tâche 1", "Tâche 2", "Tâche 3"] },
    { "period": "3 mois avant", "tasks": ["Tâche 1", "Tâche 2", "Tâche 3"] },
    { "period": "1 mois avant", "tasks": ["Tâche 1", "Tâche 2"] },
    { "period": "La semaine du mariage", "tasks": ["Tâche 1", "Tâche 2", "Tâche 3"] }
  ],
  "keyVendors": [
    { "type": "Traiteur", "description": "Ce qu'il faut rechercher", "budgetTip": "Conseil budget" }
  ],
  "personalizedTips": ["Conseil personnalisé 1 basé sur leur description", "Conseil personnalisé 2", "Conseil personnalisé 3"],
  "inspirationMoodboard": ["Mot-clé style 1", "Mot-clé style 2", "Mot-clé style 3", "Mot-clé style 4", "Mot-clé style 5"]
}

Adapte TOUT au budget, style et préférences décrits. Calcule les montants réels dans budgetBreakdown basés sur le budget total. Réponds en français.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.9, maxOutputTokens: 4096 },
        }),
      }
    )

    if (!response.ok) return NextResponse.json({ error: 'Erreur API Gemini' }, { status: 500 })

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) return NextResponse.json({ error: 'Réponse vide' }, { status: 500 })

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'Format invalide' }, { status: 500 })

    const plan = JSON.parse(jsonMatch[0])
    return NextResponse.json({ success: true, plan })
  } catch (err) {
    console.error('Wedding AI error:', err)
    return NextResponse.json({ error: 'Erreur lors de la génération du plan' }, { status: 500 })
  }
}
