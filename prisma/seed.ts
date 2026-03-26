import { prisma } from "@/lib/prisma";

const main = async () => {

    const categories = [
        { title: 'Finances', questions: ['Comment gérez-vous vos finances personnelles ?', 'Qui gèrera le budget du foyer ?', 'Avez-vous des dettes que l\'autre devrait connaître ?', 'Quelle est votre relation avec l\'argent ?'] },
        { title: 'Communication', questions: ['Comment exprimez-vous vos besoins émotionnels ?', 'Que faites-vous lors d\'une dispute ?', 'Comment gérez-vous les désaccords ?', 'Quelle place donnez-vous au silence dans la relation ?'] },
        { title: 'Foi & Spiritualité', questions: ['Quelle place la foi a-t-elle dans votre vie quotidienne ?', 'Comment envisagez-vous l\'éducation spirituelle des enfants ?', 'Pratiquez-vous votre foi régulièrement ?'] },
        { title: 'Vie intime', questions: ['Quelles sont vos attentes en matière d\'intimité ?', 'Comment parler ouvertement de vos besoins ?', 'Quelles limites souhaitez-vous poser ?'] },
        { title: 'Vision de vie', questions: ['Où souhaitez-vous vivre dans 5 ans ?', 'Souhaitez-vous des enfants ? Combien ?', 'Quels sont vos objectifs professionnels ?', 'Comment imaginez-vous votre retraite ?'] },
      ]
    
      for (const cat of categories) {
        const existing = await prisma.questionCategory.findFirst({ where: { title: cat.title } })
        if (!existing) {
          await prisma.questionCategory.create({
            data: {
              title: cat.title,
              questions: { create: cat.questions.map(q => ({ content: q, isPublic: true })) },
            },
          })
        }
      }




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


    
        const roadmaps = [
            {
              title: 'IKIGAI — Trouve ton raison d\'être',
              description: 'Méthode japonaise ancestrale pour découvrir ta mission de vie à l\'intersection de ce que tu aimes, ce pour quoi tu es doué, ce dont le monde a besoin et ce pour quoi tu peux être rémunéré.',
              category: 'IKIGAI',
              icon: '⛩️',
              color: 'from-rose-400 to-orange-400',
              isPublic: true,
              sections: [
                {
                  title: 'Ce que tu Aimes (Passion)',
                  description: 'Explore tes passions profondes — les activités qui t\'illuminent de l\'intérieur.',
                  items: [
                    { type: 'EXPLANATION', title: 'Comprendre la Passion', content: 'Dans la philosophie ikigai, la passion représente les activités qui te font perdre la notion du temps. Ce ne sont pas seulement des hobbies, mais des états d\'être où tu te sens pleinement vivant. Les Japonais parlent de "jikan ga tatsu no wo wasureru" — oublier que le temps passe.' },
                    { type: 'EXERCISE', title: 'L\'inventaire de tes passions', content: 'Prends 15 minutes. Écris sans filtrer : quelles activités ferais-tu toute la journée si l\'argent n\'était pas un problème ? Quand était la dernière fois que tu étais tellement absorbé par quelque chose que tu as oublié de manger ? Qu\'est-ce qui te donnait de la joie à 8 ans ?' },
                    { type: 'QUESTION', title: 'Tes passions profondes', content: 'Parmi tout ce que tu as exploré, quelles sont les 3 activités qui te procurent le plus de joie et de vie intérieure ? Pourquoi celles-ci en particulier ?' },
                    { type: 'REFLECTION', title: 'La passion qui résiste', content: 'Si tu devais choisir UNE seule passion à cultiver pour le reste de ta vie, laquelle serait-ce ? Qu\'est-ce que ça révèle sur qui tu es vraiment ?' },
                  ],
                },
                {
                  title: 'Ce en quoi tu es Doué (Mission)',
                  description: 'Identifie tes talents naturels et les compétences que tu as développées.',
                  items: [
                    { type: 'EXPLANATION', title: 'Talents vs Compétences', content: 'Il y a une différence entre un talent (une aptitude naturelle) et une compétence (quelque chose d\'appris). Ton ikigai émerge souvent à l\'intersection des deux. Les talents sont souvent invisibles pour nous-mêmes car ils semblent "trop faciles" — ce qui vient naturellement à toi surprend parfois les autres.' },
                    { type: 'EXERCISE', title: 'Le regard des autres', content: 'Contacte (ou souviens-toi) de 3 personnes qui te connaissent bien. Demande-leur : "Pour quoi est-ce que tu me demanderais de l\'aide ?" Leurs réponses révèlent souvent des talents que tu ignores avoir.' },
                    { type: 'QUESTION', title: 'Tes forces naturelles', content: 'Qu\'est-ce que tu fais naturellement bien, sans effort particulier, que d\'autres trouvent difficile ? Dans quels domaines as-tu reçu des compliments récurrents tout au long de ta vie ?' },
                    { type: 'REFLECTION', title: 'Le talent qui te définit', content: 'Si tu devais enseigner quelque chose à des enfants, quel talent ou connaissance partagerais-tu ? Ce que tu pourrais enseigner avec enthousiasme révèle ton excellence.' },
                  ],
                },
                {
                  title: 'Ce dont le Monde a Besoin (Vocation)',
                  description: 'Découvre comment tes dons peuvent servir quelque chose de plus grand que toi.',
                  items: [
                    { type: 'EXPLANATION', title: 'La vocation comme service', content: 'L\'ikigai n\'est pas égocentrique — il s\'ouvre sur le monde. Tes talents et passions ont une valeur lorsqu\'ils répondent à un besoin réel. La question n\'est pas "qu\'est-ce que je veux ?" mais "comment puis-je contribuer ?"' },
                    { type: 'EXERCISE', title: 'Cartographier les besoins', content: 'Observe ton environnement immédiat : ta famille, ton quartier, ta communauté. Quels problèmes vois-tu régulièrement ? Quelles douleurs entends-tu souvent ? Quels manques existent que personne ne semble combler ?' },
                    { type: 'QUESTION', title: 'Ton impact souhaité', content: 'Quel problème dans le monde te touche profondément et te donne envie d\'agir ? Si tu pouvais changer UNE chose dans ta communauté ou dans le monde, laquelle serait-ce ?' },
                    { type: 'REFLECTION', title: 'Ton empreinte', content: 'Dans 20 ans, qu\'est-ce que tu veux que les gens disent de toi ? Quel changement veux-tu avoir apporté dans la vie des autres ?' },
                  ],
                },
                {
                  title: 'Ce pour quoi tu peux être Rémunéré (Profession)',
                  description: 'Explore comment transformer tes talents et passions en valeur économique.',
                  items: [
                    { type: 'EXPLANATION', title: 'La dimension économique', content: 'L\'ikigai n\'ignore pas la réalité économique. Si une activité est passion, talent et service, mais ne peut pas te nourrir, elle reste un hobby. La question est : comment créer de la valeur suffisamment pour que la société soit prête à te rémunérer ?' },
                    { type: 'EXERCISE', title: 'L\'investigation de marché personnelle', content: 'Recherche des personnes qui ont construit une carrière autour de passions similaires aux tiennes. Comment ont-ils monétisé ? Quels modèles économiques ont-ils utilisés ? (Freelance, entreprise, salarié, créateur de contenu, etc.)' },
                    { type: 'QUESTION', title: 'Ta valeur économique', content: 'Parmi tes talents et passions, lesquels ont déjà une valeur marchande prouvée ? Pour lesquels des gens ont-ils déjà payé ou seraient prêts à payer ?' },
                    { type: 'REFLECTION', title: 'Le modèle idéal', content: 'Quel modèle de rémunération résonne le plus avec qui tu es ? (Entreprendre, être expert salarié, créer, enseigner, soigner, construire...) Pourquoi ?' },
                  ],
                },
                {
                  title: 'Ton IKIGAI — La synthèse',
                  description: 'Intègre les 4 dimensions pour formuler ta raison d\'être personnelle.',
                  items: [
                    { type: 'EXPLANATION', title: 'L\'intersection sacrée', content: 'Ton ikigai se trouve là où tes 4 cercles se rejoignent. C\'est un équilibre vivant, pas une destination figée. Il peut évoluer au fil de ta vie. L\'objectif est d\'avoir une boussole intérieure, pas une carte routière rigide.' },
                    { type: 'EXERCISE', title: 'La carte Ikigai', content: 'Sur une feuille, dessine 4 cercles qui se chevauchent. Dans chaque cercle, note les éléments clés que tu as découverts dans les étapes précédentes. Observe les intersections : Passion + Mission = Ce que tu aimes ET ce dont le monde a besoin. Mission + Vocation = Ce dont le monde a besoin ET ce pour quoi tu es doué. Qu\'est-ce que tu vois au centre ?' },
                    { type: 'QUESTION', title: 'Ta déclaration d\'Ikigai', content: 'En t\'appuyant sur tout ce que tu as exploré, essaie de compléter cette phrase : "Mon ikigai est de [ACTION] pour [BÉNÉFICIAIRES] en utilisant [TALENT/PASSION], afin de [IMPACT]." Écris plusieurs versions. Laquelle résonne le plus ?' },
                    { type: 'REFLECTION', title: 'Les premiers pas concrets', content: 'Ton ikigai n\'est pas un rêve lointain — il commence maintenant. Quelle est UNE action concrète, petite mais significative, que tu pourrais faire cette semaine pour te rapprocher de ton ikigai ? Quels obstacles anticipes-tu et comment les surmonter ?' },
                  ],
                },
              ],
            },
            {
              title: 'Connais-toi comme Dieu te connaît',
              description: 'Un voyage intérieur inspiré par la sagesse biblique pour découvrir ton identité profonde, tes dons et ta vocation selon les Écritures.',
              category: 'CHRISTIAN',
              icon: '✝️',
              color: 'from-amber-400 to-yellow-300',
              isPublic: true,
              sections: [
                {
                  title: 'Ton identité en Christ',
                  description: 'Découvre qui tu es vraiment aux yeux de Dieu.',
                  items: [
                    { type: 'EXPLANATION', title: 'L\'identité fondamentale', content: 'Avant toute chose, tu es fait à l\'image de Dieu (Genèse 1:27). Cette vérité fondamentale précède tous tes rôles, accomplissements ou échecs. L\'apôtre Paul rappelle en Galates 2:20 : "Ce n\'est plus moi qui vis, c\'est Christ qui vit en moi." Comprendre ton identité en Christ est le fondement d\'une connaissance de soi saine et libératrice.' },
                    { type: 'QUESTION', title: 'Qui es-tu vraiment ?', content: 'Comment te définirais-tu sans utiliser ton travail, tes relations ou tes accomplissements ? Quand tu penses à l\'affirmation "tu es aimé de Dieu inconditionnellement", qu\'est-ce que ça provoque en toi ? De la joie ? Du scepticisme ? Une résistance ?' },
                    { type: 'EXERCISE', title: 'Les vérités sur ton identité', content: 'Lis ces affirmations et note ta réaction honnête à chacune :\n• Je suis enfant de Dieu (Jean 1:12)\n• Je suis nouvelle créature (2 Cor 5:17)\n• Je suis l\'œuvre de Dieu, créé pour de bonnes œuvres (Éph 2:10)\n• Je suis plus que vainqueur (Rom 8:37)\n\nLaquelle tu as du mal à croire pour toi-même ? Pourquoi ?' },
                    { type: 'REFLECTION', title: 'L\'image miroir', content: 'Comment la manière dont tu te vois influence-t-elle tes choix quotidiens ? Y a-t-il des mensonges sur toi-même que tu as crus pendant longtemps ? Qu\'est-ce que Dieu dirait pour les corriger ?' },
                  ],
                },
                {
                  title: 'Tes Dons Spirituels',
                  description: 'Identifie les dons que Dieu t\'a accordés pour servir sa gloire.',
                  items: [
                    { type: 'EXPLANATION', title: 'Les dons de l\'Esprit', content: 'Romains 12, 1 Corinthiens 12 et Éphésiens 4 décrivent différents dons spirituels : prophétie, service, enseignement, exhortation, générosité, direction, miséricorde, sagesse, foi, guérison, langues, etc. Ces dons ne sont pas pour notre gloire mais pour l\'édification du Corps du Christ (1 Cor 12:7).' },
                    { type: 'EXERCISE', title: 'L\'inventaire des dons', content: 'Pour chaque domaine, évalue ton niveau de 1 à 5 (1 = peu développé, 5 = fort) :\n• Enseigner / expliquer des vérités spirituelles\n• Encourager / exhorter les autres\n• Servir concrètement dans les besoins pratiques\n• Diriger / organiser des projets\n• Montrer de la miséricorde et de la compassion\n• Donner généreusement\n• Évangéliser / partager sa foi naturellement\n• Prier avec ferveur et intercéder\n\nLes 2-3 domaines avec les scores les plus hauts sont probablement tes dons principaux.' },
                    { type: 'QUESTION', title: 'Confirmation des dons', content: 'Les dons spirituels sont souvent confirmés par trois choses : le désir intérieur, l\'efficacité (ça produit des fruits) et la reconnaissance des autres. Y a-t-il des dons que tu sembles avoir d\'après cette grille ? Des membres de ta communauté ou famille t\'ont-ils dit que tu étais particulièrement doué pour quelque chose ?' },
                    { type: 'REFLECTION', title: 'Dons et responsabilité', content: '1 Pierre 4:10 dit : "Comme de bons dispensateurs des diverses grâces de Dieu, que chacun de vous mette au service des autres le don qu\'il a reçu." Comment utilises-tu actuellement tes dons ? Où pourrais-tu les déployer davantage ?' },
                  ],
                },
                {
                  title: 'Ta Vocation et Mission',
                  description: 'Découvre le plan unique que Dieu a pour ta vie.',
                  items: [
                    { type: 'EXPLANATION', title: 'Vocation vs Occupation', content: 'La vocation (du latin "vocatio" — appel) est plus large que ton métier. C\'est la manière dont tu vis et sers, quel que soit ton domaine. Martin Luther a révolutionné la théologie en enseignant que chaque chrétien, dans son travail ordinaire, répond à un appel divin. Ton vrai appel embrasse toute ta vie.' },
                    { type: 'EXERCISE', title: 'Les indices de l\'appel', content: 'Réponds à ces 4 questions de Frédérick Buechner sur la vocation :\n1. Qu\'est-ce qui te fait le plus pleurer quand tu vois le monde ?\n2. Qu\'est-ce qui t\'indigne profondément ?\n3. Qu\'est-ce qui te donne une joie profonde quand tu le fais ?\n4. Pour quel problème es-tu particulièrement équipé ?\nL\'intersection de ces 4 réponses pointe souvent vers ta vocation.' },
                    { type: 'QUESTION', title: 'Jérémie 29:11', content: '"Car je connais les projets que j\'ai formés sur vous, dit l\'Éternel, projets de paix et non de malheur, afin de vous donner un avenir et de l\'espérance." Comment vis-tu cette promesse dans ta vie actuelle ? Quels projets sens-tu que Dieu a pour toi ?' },
                    { type: 'REFLECTION', title: 'L\'obéissance progressive', content: 'La vocation se découvre souvent en marchant, pas en restant immobile. Quelle est la prochaine étape d\'obéissance que tu sens Dieu t\'appeler à faire, même si tu ne vois pas encore toute la route ?' },
                  ],
                },
              ],
            },
            {
              title: 'Les Dons de Dieu — Romans 12',
              description: 'Un approfondissement pratique des dons motivationnels selon Romains 12, pour comprendre comment tu es câblé par Dieu et comment ton profil unique sert le Royaume.',
              category: 'CHRISTIAN',
              icon: '🕊️',
              color: 'from-blue-400 to-indigo-500',
              isPublic: true,
              sections: [
                {
                  title: 'Les 7 dons motivationnels',
                  description: 'Comprendre les dons de Romains 12 et lequel est le tien.',
                  items: [
                    { type: 'EXPLANATION', title: 'Qu\'est-ce qu\'un don motivationnel ?', content: 'Les dons de Romains 12:6-8 (prophétie, service, enseignement, exhortation, générosité, direction, miséricorde) sont appelés "dons motivationnels" car ils influencent la manière dont tu perçois le monde et ce qui te motive à agir. Ce n\'est pas ce que tu FAIS mais comment tu es CÂBLÉ intérieurement.' },
                    { type: 'EXERCISE', title: 'Ton profil de don', content: 'Pour chaque don, note si la description te correspond (Oui/Parfois/Non) :\n\n• PROPHÉTIE : Tu vois clairement le bien et le mal, tu ressens le besoin de dire la vérité même si elle dérange\n• SERVICE : Tu es toujours en train de penser à comment aider concrètement, tu remarques les besoins pratiques\n• ENSEIGNEMENT : Tu veux comprendre en profondeur avant d\'agir, tu aimes expliquer et clarifier\n• EXHORTATION : Tu vois naturellement le potentiel des gens et tu veux les encourager à avancer\n• GÉNÉROSITÉ : Tu penses spontanément à comment donner, tu as une joie particulière à bénir les autres\n• DIRECTION : Tu vois naturellement comment organiser et amener un groupe vers un objectif\n• MISÉRICORDE : Tu ressens profondément la douleur des autres, tu attires les personnes blessées' },
                    { type: 'QUESTION', title: 'Ton don principal', content: 'D\'après ton profil, quel(s) don(s) te semblent les plus naturels ? Comment ce don se manifeste-t-il dans ta vie quotidienne, dans tes relations, dans tes réactions spontanées ?' },
                    { type: 'REFLECTION', title: 'Don et ombre', content: 'Chaque don a une "ombre" — un aspect qui peut devenir problématique sans maturité. Le don de prophétie peut devenir jugement. Le don de miséricorde peut devenir codépendance. Quelle est l\'ombre de ton don principal et comment la gères-tu ?' },
                  ],
                },
                {
                  title: 'Vivre selon ton don',
                  description: 'Appliquer la connaissance de ton don dans ta vie concrète.',
                  items: [
                    { type: 'EXERCISE', title: 'Là où ton don s\'exprime naturellement', content: 'Pense aux 3 dernières semaines. Quand as-tu été le plus vivant, le plus "toi-même" dans tes interactions ? Quand as-tu eu l\'impression d\'agir depuis ta vraie nature ? Décris ces moments en détail — qu\'est-ce qui se passait ?' },
                    { type: 'QUESTION', title: 'Don et communion', content: '1 Corinthiens 12 dit que les dons sont pour l\'édification commune. Comment ton don particulier contribue-t-il à la communauté autour de toi (famille, église, travail, amis) ? Où vois-tu les fruits de ton don dans la vie des autres ?' },
                    { type: 'REFLECTION', title: 'Le déploiement intentionnel', content: 'Y a-t-il des sphères de ta vie où tu n\'utilises pas encore ton don ? Quelle serait UNE façon concrète de le déployer davantage dans les 30 prochains jours ?' },
                  ],
                },
              ],
            },
            {
              title: 'Big Five — La science de ta personnalité',
              description: 'Basé sur le modèle OCEAN, le plus validé scientifiquement. Explore tes 5 grands traits de personnalité et ce qu\'ils révèlent sur toi.',
              category: 'SCIENTIFIC',
              icon: '🧬',
              color: 'from-emerald-400 to-cyan-500',
              isPublic: true,
              sections: [
                {
                  title: 'Ouverture à l\'expérience (O)',
                  description: 'Ta curiosité intellectuelle, ton imagination et ton attrait pour la nouveauté.',
                  items: [
                    { type: 'EXPLANATION', title: 'Comprendre l\'Ouverture', content: 'L\'Ouverture à l\'expérience mesure ton appétit pour la nouveauté, la créativité et les idées abstraites. Les personnes à haute ouverture sont curieuses, imaginatives, artistes ou intellectuelles. Celles à basse ouverture préfèrent la routine, la praticité et la tradition. Aucun extrême n\'est "meilleur" — chaque profil a ses forces.' },
                    { type: 'EXERCISE', title: 'Auto-évaluation O', content: 'Sur une échelle de 1 (pas du tout) à 10 (tout à fait), évalue-toi :\n• J\'aime explorer de nouvelles idées et concepts\n• J\'apprécie l\'art, la musique ou la littérature de manière profonde\n• J\'ai une imagination active et j\'aime rêver\n• J\'aime les discussions philosophiques ou abstraites\n• J\'aime sortir de mes habitudes et découvrir de nouvelles choses\n\nFais la moyenne — c\'est ton score approximatif d\'Ouverture (1-10).' },
                    { type: 'QUESTION', title: 'Ton profil d\'Ouverture', content: 'Avec un score de [ton score], que cela révèle-t-il sur toi ? Comment cette caractéristique se manifeste-t-elle dans tes choix de loisirs, de travail, de relations ? Y a-t-il des moments où elle t\'a aidé ou au contraire gêné ?' },
                  ],
                },
                {
                  title: 'Consciencieux (C)',
                  description: 'Ta discipline, ton organisation et ta fiabilité.',
                  items: [
                    { type: 'EXPLANATION', title: 'Comprendre la Conscienciosité', content: 'Ce trait mesure ta tendance à être organisé, discipliné, fiable et orienté vers les objectifs. C\'est le trait le plus corrélé au succès professionnel selon les recherches. Les personnes très consciencieuses planifient, s\'autodisciplinent et persévèrent. Celles à faible conscienciosité sont plus spontanées et flexibles.' },
                    { type: 'EXERCISE', title: 'Auto-évaluation C', content: 'Évalue de 1 à 10 :\n• Je termine toujours ce que je commence\n• Je suis organisé(e) et ordonné(e) dans mon espace et mes tâches\n• Je planifie avant d\'agir\n• Je suis ponctuel(le) et fiable\n• Je résiste aux distractions quand j\'ai un objectif\n\nFais la moyenne pour ton score de Conscienciosité.' },
                    { type: 'QUESTION', title: 'Discipline et liberté', content: 'Comment ton niveau de conscienciosité impacte-t-il tes projets personnels ? Quels systèmes et habitudes fonctionnent le mieux pour toi compte tenu de ton profil naturel ?' },
                  ],
                },
                {
                  title: 'Extraversion (E)',
                  description: 'Ton niveau d\'énergie sociale et ton orientation vers le monde extérieur.',
                  items: [
                    { type: 'EXPLANATION', title: 'Comprendre l\'Extraversion', content: 'L\'extraversion n\'est pas seulement "est-ce que j\'aime les gens" — c\'est la source de ton énergie. Les extravertis se rechargent en étant avec d\'autres et s\'ennuient seuls. Les introvertis (faible extraversion) se rechargent dans la solitude et peuvent être épuisés par les interactions sociales prolongées. L\'ambiversion est le milieu.' },
                    { type: 'EXERCISE', title: 'Auto-évaluation E', content: 'Évalue de 1 à 10 :\n• Je me sens énergisé(e) après avoir passé du temps en groupe\n• J\'aime être le centre de l\'attention dans les réunions sociales\n• Je parle avant de penser (vs penser avant de parler)\n• Je m\'ennuie facilement seul(e)\n• Je noue facilement des conversations avec des inconnus\n\nFais la moyenne pour ton score d\'Extraversion.' },
                    { type: 'QUESTION', title: 'Ton écologie sociale', content: 'Comment ton niveau d\'extraversion influence-t-il tes relations, ton style de travail et ta vie sociale ? Quelles conditions de vie et de travail sont optimales pour ton profil ?' },
                  ],
                },
                {
                  title: 'Agréabilité (A)',
                  description: 'Ta tendance à la coopération, l\'empathie et la bienveillance.',
                  items: [
                    { type: 'EXPLANATION', title: 'Comprendre l\'Agréabilité', content: 'L\'agréabilité mesure ta tendance à être coopératif, empathique et à éviter les conflits. Les personnes très agréables priorisent l\'harmonie et le bien des autres. Celles à faible agréabilité sont plus compétitives, directes et sceptiques. Les deux profils sont utiles selon les contextes.' },
                    { type: 'EXERCISE', title: 'Auto-évaluation A', content: 'Évalue de 1 à 10 :\n• Je mets facilement de côté mes besoins pour ceux des autres\n• J\'évite les conflits même quand j\'ai raison\n• Je fais confiance spontanément aux gens\n• Je suis naturellement empathique et je ressens ce que les autres vivent\n• Je préfère collaborer plutôt que compétitionner\n\nFais la moyenne pour ton score d\'Agréabilité.' },
                    { type: 'QUESTION', title: 'Frontières et bienveillance', content: 'Comment ton niveau d\'agréabilité influence-t-il tes relations ? Y a-t-il des situations où ce trait t\'a servi ? D\'autres où il t\'a desservi (trop agréable = manque de frontières, ou trop peu = relations difficiles) ?' },
                  ],
                },
                {
                  title: 'Névrosisme / Stabilité émotionnelle (N)',
                  description: 'Ta sensibilité au stress et ta stabilité émotionnelle.',
                  items: [
                    { type: 'EXPLANATION', title: 'Comprendre le Névrosisme', content: 'Le névrosisme mesure la tendance à vivre des émotions négatives (anxiété, tristesse, irritabilité). Un score élevé ne signifie pas une pathologie — c\'est simplement une sensibilité émotionnelle plus forte. Ces personnes sont souvent plus créatives, empathiques et conscientes des risques. Un faible névrosisme indique une stabilité émotionnelle et une résistance au stress.' },
                    { type: 'EXERCISE', title: 'Auto-évaluation N', content: 'Évalue de 1 à 10 :\n• Je m\'inquiète souvent à propos de beaucoup de choses\n• Mon humeur change fréquemment et peut m\'impacter fortement\n• Je suis facilement stressé(e) par les imprévus\n• Je rumine sur des erreurs passées ou des scénarios futurs\n• Je réagis fortement aux critiques ou aux conflits\n\nFais la moyenne pour ton score de Névrosisme.' },
                    { type: 'QUESTION', title: 'Ton système émotionnel', content: 'Comment ta sensibilité émotionnelle impacte-t-elle ta vie ? Quelles stratégies t\'aident à gérer tes émotions de manière saine ? Qu\'est-ce que tu apprécies dans ta sensibilité ?' },
                    { type: 'REFLECTION', title: 'Ton portrait OCEAN complet', content: 'En rassemblant tes 5 scores (O, C, E, A, N), décris ton profil de personnalité en quelques phrases. Qu\'est-ce que cette image révèle sur tes forces ? Tes zones de croissance ? Comment ce profil s\'exprime-t-il dans tes relations et tes choix de vie ?' },
                  ],
                },
              ],
            },
            {
              title: 'Les Valeurs de Caractère — VIA',
              description: 'Basé sur les recherches de Martin Seligman et Christopher Peterson. Identifie tes 5 forces de caractère dominantes parmi les 24 vertus universelles.',
              category: 'SCIENTIFIC',
              icon: '💎',
              color: 'from-violet-400 to-purple-600',
              isPublic: true,
              sections: [
                {
                  title: 'Comprendre les forces de caractère',
                  description: 'Introduction à la psychologie positive et aux forces VIA.',
                  items: [
                    { type: 'EXPLANATION', title: 'La psychologie positive', content: 'Martin Seligman a co-développé avec Christopher Peterson le modèle VIA (Values in Action) après avoir étudié 54 cultures à travers l\'histoire. Ils ont identifié 24 forces de caractère universelles, regroupées en 6 vertus : Sagesse, Courage, Humanité, Justice, Tempérance, Transcendance. Tes 5 "forces de signature" sont celles qui t\'apportent de l\'énergie, de la joie et un sentiment d\'authenticité quand tu les exerces.' },
                    { type: 'EXERCISE', title: 'Identifier tes forces de signature', content: 'Parmi ces 24 forces, coche celles qui résonnent le plus avec toi (choisir 7-8 au maximum) :\n\nSAGESSE : Créativité, Curiosité, Jugement critique, Amour d\'apprendre, Sagesse/Perspective\nCOURAGE : Bravoure, Persévérance, Honnêteté, Enthousiasme\nHUMANITÉ : Amour, Bonté, Intelligence sociale\nJUSTICE : Travail d\'équipe, Impartialité, Leadership\nTEMPÉRANCE : Pardon, Humilité, Prudence, Maîtrise de soi\nTRANSCENDANCE : Appréciation de la beauté, Gratitude, Espoir, Humour, Spiritualité' },
                    { type: 'QUESTION', title: 'Tes forces de signature', content: 'Parmi celles que tu as cochées, lesquelles sont vraiment "toi" ? Les vraies forces de signature ont 3 caractéristiques : elles te semblent naturelles ("c\'est juste moi"), elles te donnent de l\'énergie quand tu les exerces, et elles te manquent quand tu ne peux pas les exprimer. Quelles sont TES 5 forces de signature ?' },
                    { type: 'REFLECTION', title: 'Forces et épanouissement', content: 'La recherche montre que les personnes les plus épanouies utilisent leurs forces de signature tous les jours, de nouvelles façons. Comment tes forces de signature se manifestent-elles déjà dans ta vie ? Y a-t-il des contextes où elles sont bridées ? Comment pourrais-tu les exercer davantage ?' },
                  ],
                },
                {
                  title: 'Forces et vie quotidienne',
                  description: 'Appliquer tes forces de caractère dans tous les domaines de ta vie.',
                  items: [
                    { type: 'EXERCISE', title: 'Forces et domaines de vie', content: 'Pour chacun de tes 5 domaines principaux (travail, famille, amitié, santé, croissance personnelle), réponds :\n• Comment ma force de [FORCE] s\'exprime-t-elle ici ?\n• Cette force est-elle bien utilisée ou sous-utilisée ?\n• Comment pourrais-je l\'utiliser de manière nouvelle ce mois-ci ?' },
                    { type: 'QUESTION', title: 'Forces sous pression', content: 'Seligman a montré que sous stress, nos forces peuvent devenir des faiblesses (sur-utilisation). La bravoure devient imprudence, la bonté devient complaisance, la créativité devient procrastination. Comment géres-tu l\'excès de tes forces dans les moments difficiles ?' },
                    { type: 'REFLECTION', title: 'Ton plan de floraison', content: 'En t\'appuyant sur tes forces de signature, décris ta vision d\'une vie épanouie. Pas parfaite — épanouie. Quelle serait une semaine type où tu utiliserais pleinement tes forces ? Quelle est une première action concrète pour y tendre ?' },
                  ],
                },
              ],
            },
            {
              title: 'La Roue de Vie — Équilibre et intention',
              description: 'Outil de coaching reconnu pour évaluer ton niveau de satisfaction dans les grands domaines de ta vie et définir tes priorités de développement.',
              category: 'SCIENTIFIC',
              icon: '⚖️',
              color: 'from-teal-400 to-green-500',
              isPublic: true,
              sections: [
                {
                  title: 'Évaluer ta vie actuelle',
                  description: 'Un bilan honnête de tous les domaines de ta vie.',
                  items: [
                    { type: 'EXPLANATION', title: 'La Roue de Vie', content: 'La Roue de Vie est un outil de coaching utilisé mondialement. L\'idée est simple : une vie équilibrée est comme une roue bien ronde — si certains "rayons" sont très courts, la roue roule difficilement. L\'objectif n\'est pas d\'être parfait partout, mais d\'être conscient et intentionnel dans tes choix.' },
                    { type: 'EXERCISE', title: 'Ton évaluation de satisfaction', content: 'Pour chaque domaine, donne un score de 1 (très insatisfait) à 10 (pleinement satisfait) :\n\n🏥 Santé physique / Énergie vitale : /10\n💪 Santé mentale / Équilibre émotionnel : /10\n💑 Relations amoureuses / Vie de couple : /10\n👨‍👩‍👧 Famille / Relations proches : /10\n👥 Amitié / Vie sociale : /10\n💼 Travail / Carrière : /10\n💰 Finances / Sécurité économique : /10\n🌱 Croissance personnelle / Apprentissage : /10\n🎯 Sens / Spiritualité / Mission : /10\n🎨 Loisirs / Épanouissement créatif : /10' },
                    { type: 'QUESTION', title: 'Lecture de ta roue', content: 'En regardant tes scores, quelles sont les 3 domaines les plus faibles ? Et les 3 plus élevés ? Où y a-t-il un écart surprenant entre ce que tu valorises intellectuellement et le niveau de satisfaction réel ?' },
                    { type: 'REFLECTION', title: 'La prochaine montée', content: 'Parmi les domaines peu satisfaisants, lequel, s\'il s\'améliorait de 2 points, aurait le plus d\'impact positif sur ta vie globale ? Pourquoi ? Qu\'est-ce qui t\'a empêché jusqu\'ici de progresser dans ce domaine ?' },
                  ],
                },
                {
                  title: 'Définir tes intentions de vie',
                  description: 'Construire une vision et un plan d\'action équilibré.',
                  items: [
                    { type: 'EXERCISE', title: 'Ta vie dans 3 ans', content: 'Imagine que tu es dans 3 ans et que tu te regardes avec fierté. Dans chaque domaine de la Roue, décris concrètement où tu voudrais être :\n\nSanté : ...\nRelations : ...\nTravail : ...\nFinances : ...\nCroissance : ...\nSens : ...\n\nCette vision doit être désirée (pas imposée) et suffisamment précise pour être motivante.' },
                    { type: 'QUESTION', title: 'Priorités vs Réalité', content: 'Ton emploi du temps actuel est le reflet de tes vraies priorités. Est-ce que tes actions hebdomadaires sont alignées avec la vision que tu viens de décrire ? Quel écart observes-tu entre ce que tu veux et ce que tu fais concrètement ?' },
                    { type: 'REFLECTION', title: 'Le premier trimestre', content: 'Choisis UN domaine prioritaire pour les 90 prochains jours. Définis :\n1. Un objectif SMART pour ce domaine\n2. 3 habitudes ou actions hebdomadaires\n3. Comment tu mesureras tes progrès\n4. Qui pourrait t\'accompagner ou te rendre des comptes' },
                  ],
                },
              ],
            },
          ]

          for (const roadmap of roadmaps) {
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
        
          console.log('✅ Seed terminé avec succès !')



}


main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });