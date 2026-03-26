import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { extractText, getDocumentProxy } from 'unpdf';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const apiKey = process.env.GROK_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'API_KEY non configurée' }, { status: 500 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

  

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // 2. Extraire le texte avec unpdf
    const pdf = await getDocumentProxy(buffer);
    const { text } = await extractText(pdf, { mergePages: true });

    const prompt = `Tu es un expert en développement personnel. Analyse ce document PDF suivant délimité par deux @: @
    ${text}@
     et crée un roadmap de découverte de soi structuré.

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

          Crée le nombre de section convenable en fonction de la longueur du document et de la segementation, que le nombre de section corresonde au nombre de chapitre dans le document , chaque section ayant 3 à 5 items de types variés. Le contenu doit être en français, personnel, inspirant et actionnable.`

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
          return NextResponse.json({ success: true, plan});
        

  } catch (err) {
    console.error('Error processing PDF:', err)
    return NextResponse.json({ error: 'Erreur lors du traitement du fichier' }, { status: 500 })
  }
}
