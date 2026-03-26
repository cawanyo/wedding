import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const apiKey = process.env.GROK_API_KEY
  console.log('GROK_API_KEY loaded:', !!apiKey) // Log to confirm if the key is loaded
  if (!apiKey) return NextResponse.json({ error: 'API_KEY non configurée' }, { status: 500 })

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
    "personalizedTips": ["Conseil personnalisé 1", "Conseil personnalisé 2", "Conseil personnalisé 3"],
    "inspirationMoodboard": ["Style 1", "Style 2", "Style 3", "Style 4", "Style 5"]
  }

  Adapte TOUT au budget, style et préférences décrits. Calcule les montants réels dans budgetBreakdown basés sur le budget total. Réponds en français.`
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "Tu es un expert en mariage. Réponds uniquement en JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }, // Forces valid JSON!
      max_tokens: 4096, 
      temperature: 0.7
    }),
  });

  const data = await response.json();
  const plan = JSON.parse(data.choices[0].message.content);
  return NextResponse.json({ success: true, plan });

  } catch (err: any) {
    console.error('Wedding AI error:', err)
    // Detailed error logging to help you debug 404s or other API issues
    return NextResponse.json({ 
      error: 'Erreur lors de la génération du plan',
      details: err.message 
    }, { status: 500 })
  }
}