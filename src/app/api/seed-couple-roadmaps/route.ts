import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const existingCouple = await prisma.roadmap.findFirst({ where: { isPublic: true, category: 'COUPLE' } })
  if (existingCouple) return NextResponse.json({ success: true, message: 'Already seeded' })

  const coupleRoadmaps = [
    {
      title: 'Communication Profonde à Deux',
      description: 'Apprenez à vous exprimer avec vulnérabilité et à écouter avec empathie pour créer une connexion authentique.',
      category: 'COUPLE',
      icon: '💬',
      color: 'from-pink-400 to-rose-500',
      isPublic: true,
      sections: [
        {
          title: "Les bases d'une communication saine",
          description: 'Comprendre les styles de communication.',
          items: [
            { type: 'EXPLANATION', title: 'Pourquoi la communication est difficile', content: "Chaque personne a grandi avec des codes de communication différents. La clé : comprendre le style de l'autre avant de réagir." },
            { type: 'QUESTION', title: 'Mon style de communication', content: "Comment gères-tu les conflits ? As-tu tendance à te fermer, à attaquer, à éviter ou à chercher la solution ? D'où vient ce pattern selon toi ?" },
            { type: 'QUESTION', title: "Ce que je n'ose pas dire", content: "Y a-t-il des choses importantes que tu n'as jamais osé exprimer à ton/ta partenaire ? Qu'est-ce qui t'en empêche ?" },
            { type: 'EXERCISE', title: "L'écoute active", content: "Pendant 10 minutes, l'un(e) parle d'un sujet qui lui tient à cœur. L'autre écoute SANS interrompre. Ensuite, reformule ce que tu as entendu." },
          ],
        },
        {
          title: 'Besoins et attentes',
          description: "Exprimer ses besoins sans accusation.",
          items: [
            { type: 'EXPLANATION', title: 'La CNV', content: "La Communication Non-Violente : Observation → Émotion → Besoin → Demande concrète et positive." },
            { type: 'QUESTION', title: 'Mes besoins fondamentaux', content: 'Quels sont tes 3 besoins les plus importants dans cette relation ?' },
            { type: 'QUESTION', title: 'Ce qui me blesse le plus', content: 'Décris une situation récurrente qui te blesse. En CNV : "Quand X se passe, je ressens Y, parce que j\'ai besoin de Z."' },
          ],
        },
        {
          title: 'Gérer les conflits',
          description: 'Transformer les conflits en croissance.',
          items: [
            { type: 'EXPLANATION', title: 'Les 4 cavaliers de Gottman', content: "4 comportements destructeurs : Critique, Mépris, Défensive et Mur (se fermer). Les reconnaître c'est les combattre." },
            { type: 'QUESTION', title: 'Nos patterns de conflit', content: 'Lequel de ces 4 cavaliers reconnais-tu le plus en toi-même ?' },
            { type: 'REFLECTION', title: 'Le conflit comme croissance', content: "Pensez à un conflit passé qui vous a rapproché. Qu'avez-vous appris grâce à cette tension ?" },
          ],
        },
      ],
    },
    {
      title: 'Valeurs et Vision Commune',
      description: 'Explorez ce qui vous unit profondément et construisez une vision partagée pour votre avenir.',
      category: 'COUPLE',
      icon: '🧭',
      color: 'from-violet-400 to-purple-600',
      isPublic: true,
      sections: [
        {
          title: 'Vos valeurs individuelles',
          description: 'Comprendre ce qui guide chacun de vous.',
          items: [
            { type: 'EXPLANATION', title: 'Pourquoi les valeurs comptent', content: 'Les valeurs sont la boussole de nos décisions. Quand deux personnes ont des valeurs alignées, les conflits majeurs disparaissent.' },
            { type: 'QUESTION', title: 'Mes 5 valeurs fondamentales', content: 'Choisis tes 5 valeurs les plus importantes parmi : Famille, Liberté, Sécurité, Aventure, Foi, Loyauté, Ambition, Paix, Amour, Intégrité, Créativité, Service, Santé, Authenticité...' },
            { type: 'QUESTION', title: 'Comment mes valeurs se manifestent', content: 'Donne un exemple concret de comment chacune de tes 5 valeurs influence tes décisions quotidiennes.' },
          ],
        },
        {
          title: 'Vision à long terme',
          description: "Co-créer l'avenir que vous voulez ensemble.",
          items: [
            { type: 'QUESTION', title: "Dans 10 ans, j'imagine notre vie...", content: 'Décris en détail ta vision idéale de votre vie dans 10 ans.' },
            { type: 'QUESTION', title: 'Nos non-négociables', content: 'Quelles sont les 3 choses absolument non-négociables pour toi dans cette relation ?' },
            { type: 'REFLECTION', title: 'Notre mission commune', content: 'Si votre couple était une entreprise, quelle serait sa mission ? En une phrase : "Ensemble, nous existons pour..."' },
          ],
        },
      ],
    },
    {
      title: "Les 5 Langages de l'Amour",
      description: "Découvrez vos langages d'amour respectifs et apprenez à parler le langage de l'autre.",
      category: 'COUPLE',
      icon: '💖',
      color: 'from-rose-400 to-pink-600',
      isPublic: true,
      sections: [
        {
          title: 'Comprendre les 5 langages',
          description: "Gary Chapman identifie 5 façons d'exprimer l'amour.",
          items: [
            { type: 'EXPLANATION', title: 'Les 5 langages', content: "1. Paroles valorisantes\n2. Temps de qualité\n3. Cadeaux\n4. Services rendus\n5. Contact physique\n\nParler le langage de l'autre, c'est la clé." },
            { type: 'QUESTION', title: 'Mon langage principal', content: "Quel est ton langage d'amour principal ? Comment te sens-tu le plus aimé(e) ?" },
            { type: 'QUESTION', title: 'Ce qui me vide émotionnellement', content: "Quelle chose fait (ou ne fait pas) ton/ta partenaire qui te laisse avec un réservoir d'amour vide ?" },
          ],
        },
        {
          title: 'Pratiquer les langages',
          description: "Mettre en œuvre le langage de l'autre.",
          items: [
            { type: 'EXERCISE', title: 'La semaine des langages', content: "Cette semaine, chacun exprime son amour dans le langage PRINCIPAL de l'autre, pas dans le sien. Notez ce que vous observez." },
            { type: 'QUESTION', title: 'Ce qui a changé', content: "Après avoir pratiqué le langage de l'autre, qu'avez-vous observé ?" },
            { type: 'REFLECTION', title: 'Notre plan d\'amour', content: "Définissez 3 actions régulières pour nourrir le réservoir de l'autre, basées sur son langage principal." },
          ],
        },
      ],
    },
    {
      title: 'Grandir Ensemble — Couple Chrétien',
      description: "Fondé sur les Écritures, construisez votre maison sur le Roc et grandissez spirituellement ensemble.",
      category: 'COUPLE',
      icon: '✝️',
      color: 'from-amber-400 to-yellow-500',
      isPublic: true,
      sections: [
        {
          title: 'Fondations spirituelles',
          description: "Qu'est-ce que Dieu dit sur le couple ?",
          items: [
            { type: 'EXPLANATION', title: 'Le couple selon Éphésiens 5', content: '"Soumettez-vous les uns aux autres dans la crainte de Christ." — Éph 5:21\n\nLe couple chrétien est une danse de service mutuel.' },
            { type: 'QUESTION', title: 'Notre vision de Dieu dans notre relation', content: 'Quelle place occupe Dieu concrètement dans votre relation ? Priez-vous ensemble ?' },
            { type: 'EXERCISE', title: 'La prière commune', content: 'Priez ensemble 5 minutes par jour pendant une semaine. Partagez ce que vous avez ressenti.' },
          ],
        },
        {
          title: 'Pardon et grâce',
          description: 'La capacité à pardonner est le fondement de tout couple durable.',
          items: [
            { type: 'EXPLANATION', title: 'Le pardon selon Colossiens 3:13', content: '"Pardonnez-vous réciproquement. De même que Christ vous a pardonné, pardonnez-vous aussi."' },
            { type: 'QUESTION', title: "Y a-t-il quelque chose à pardonner ?", content: "Y a-t-il une blessure passée dans votre relation qui n'est pas complètement guérie ?" },
            { type: 'REFLECTION', title: 'La grâce comme choix quotidien', content: 'Comment pouvez-vous pratiquer la grâce — donner plus que ce que l\'autre mérite — concrètement cette semaine ?' },
          ],
        },
      ],
    },
    {
      title: 'Projet de Vie à Deux',
      description: 'Co-construisez votre feuille de route : carrières, finances, famille, rêves.',
      category: 'COUPLE',
      icon: '🗺️',
      color: 'from-emerald-400 to-teal-500',
      isPublic: true,
      sections: [
        {
          title: 'Bilan de vie actuel',
          description: "Où en êtes-vous aujourd'hui ?",
          items: [
            { type: 'QUESTION', title: 'Notre satisfaction actuelle', content: 'Notez de 1 à 10 : Vie pro, Finances, Logement, Vie sociale, Santé, Spiritualité, Épanouissement, Relation. Où sont les déséquilibres ?' },
            { type: 'QUESTION', title: 'Ce que nous réussissons déjà', content: 'Quelles sont les 3 forces majeures de votre relation et de votre vie commune ?' },
            { type: 'QUESTION', title: 'Ce qui nous freine', content: 'Quels sont les 2-3 obstacles principaux qui vous empêchent de vivre la vie que vous voulez ensemble ?' },
          ],
        },
        {
          title: 'Construire votre feuille de route',
          description: 'Objectifs à 1 an, 5 ans, 10 ans.',
          items: [
            { type: 'QUESTION', title: 'Nos objectifs à 1 an', content: "D'ici 1 an, qu'est-ce que vous voulez avoir accompli ensemble ? Soyez très concrets." },
            { type: 'QUESTION', title: 'Notre Grand Rêve à 10 ans', content: "Si tout était possible, décrivez votre vie idéale dans 10 ans. N'autocensurez pas." },
            { type: 'EXERCISE', title: 'Le Vision Board commun', content: "Créez ensemble un vision board de votre vie dans 5 ans. Affichez-le quelque part visible." },
            { type: 'REFLECTION', title: 'Le premier pas concret', content: 'Quel est LE premier pas que vous vous engagez à faire ensemble dans les 30 prochains jours ?' },
          ],
        },
      ],
    },
  ]

  for (const roadmap of coupleRoadmaps) {
    const { sections, ...roadmapData } = roadmap
    await prisma.roadmap.create({
      data: {
        ...roadmapData,
        sections: {
          create: sections.map((s, si) => ({
            title: s.title,
            description: s.description,
            order: si,
            items: {
              create: s.items.map((item, ii) => ({
                type: item.type,
                title: item.title,
                content: item.content,
                order: ii,
              })),
            },
          })),
        },
      },
    })
  }

  return NextResponse.json({ success: true, message: 'Couple roadmaps seeded' })
}
