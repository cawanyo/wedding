'use client'

import { Key, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, progress } from 'framer-motion'
import {
  Heart, Users, Plus, CheckCircle, Target, MessageSquare,
  BookOpen, TrendingUp, Copy, Check, Calendar,
  Clock,
  ChevronUp,
  ChevronDown,
  Edit2
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Avatar } from '@/components/ui/Avatar'
import { FadeIn, StaggerChildren, StaggerItem } from '@/components/animations/transitions'
import {
  createCouple, joinCouple, updateRelationshipStatus,
  submitAnswer, addCoupleGoal, toggleCoupleGoal,
  addWeeklyCheckin, addDailyReflection,
  invitePartner,
  createCustomQuestion,
  createCategory,
  updateCoupleGoal
} from '@/actions/couple'
import Pusher from 'pusher-js'
import { revalidatePath } from 'next/cache'

const STATUS_LABELS: Record<string, string> = {
  UNDEFINED: 'Non défini',
  KNOWING: 'On se découvre',
  ENGAGED: 'Fiancés',
  MARRIED: 'Mariés',
}

const STATUS_COLORS: Record<string, string> = {
  UNDEFINED: 'bg-gray-100 text-gray-600',
  KNOWING: 'bg-blue-100 text-blue-600',
  ENGAGED: 'bg-purple-100 text-purple-600',
  MARRIED: 'bg-pink-100 text-pink-600',
}

type Question = { id: string; content: string; answers: {
  id: Key | null | undefined
  createdAt: string | number | Date; userId: string; content: string; user: { name: string | null } 
}[] }
type Category = { id: string; title: string; questions: Question[] }
type Goal = { id: string; title: string; description: string | null; done: boolean; deadline: Date | null; user: { name: string | null }, progress: number }
type Checkin = { id: string; score: number; feeling: string | null; week: Date; user: { name: string | null } }
type Reflection = { id: string; mood: number; gratitude: string | null; note: string | null; date: Date; user: { name: string | null } }
type Couple = {
  id: string
  relationshipStatus: string
  inviteToken: string | null
  user1: { id: string; name: string | null; avatar: string | null }
  user2: { id: string; name: string | null; avatar: string | null } | null
  goals: Goal[]
  checkins: Checkin[]
  reflections: Reflection[]
}

export function CouplePageClient({
  couple, categories, userId
}: {
  couple: Couple | null
  categories: Category[]
  userId: string
}) {
  const router = useRouter()
  const [tab, setTab] = useState<'overview' | 'questions' | 'goals' | 'checkin' | 'reflections'>('overview')
  const [joinToken, setJoinToken] = useState('')
  const [goalModal, setGoalModal] = useState(false)
  const [checkinModal, setCheckinModal] = useState(false)
  const [inviteModal, setInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [reflectionModal, setReflectionModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [goalForm, setGoalForm] = useState({ title: '', description: '', deadline: '', progress: 0 })
  const [checkinForm, setCheckinForm] = useState({ score: 7, feeling: '', improvement: '', gratitude: '' })
  const [reflectionForm, setReflectionForm] = useState({ mood: 3, gratitude: '', note: '' })
  const [answerForms, setAnswerForms] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'themes' | 'questions' | 'feed'>('themes');
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [newQuestionContent, setNewQuestionContent] = useState('');
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
  const [launchMode, setLaunchMode] = useState<'select' | 'create'>('select');
  const [selectedQuestionId, setSelectedQuestionId] = useState('');
  const [customQuestion, setCustomQuestion] = useState({ content: '', isPublic: false });
  const [launchAnswer, setLaunchAnswer] = useState('');
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCat, setNewCat] = useState({ title: '', isPublic: false });
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);


  
  // 2. Fonction pour ouvrir le modal en mode édition
  const openEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setGoalForm({
      title: goal.title,
      description: goal.description || '',
      deadline: goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '',
      progress: goal.progress || 0
    });
    setGoalModal(true);
  };

  const handleSaveGoal = async () => {
    if (!couple || !goalForm.title) return;
  
    if (editingGoal) {
      // Mode Édition
      await updateCoupleGoal(editingGoal.id, goalForm);
    } else {
      // Mode Création
      await addCoupleGoal(couple.id, goalForm);
    }
  
    // Reset
    setGoalForm({ title: '', description: '', deadline: '' , progress: 0});
    setEditingGoal(null);
    setGoalModal(false);
    router.refresh();
  };

  const toggleExpand = (qId: string) => {
    setExpandedQuestions(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  const copyToken = () => {
    if (couple?.inviteToken) {
      navigator.clipboard.writeText(`${window.location.origin}/couple/join/${couple.inviteToken}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCreate = async () => {
    setLoading(true)
    await createCouple()
    setLoading(false)
    router.refresh()
  }

  const handleCreateCategory = async () => {
    if (!newCat.title.trim()) return;
    await createCategory(newCat.title, newCat.isPublic);
    setNewCat({ title: '', isPublic: false });
    setIsCatModalOpen(false);
    router.refresh();
  };

  const handleJoin = async () => {
    if (!joinToken.trim()) return
    setLoading(true)
    await joinCouple(joinToken.trim())
    setLoading(false)
    router.refresh()
  }

  const handleStatusChange = async (status: string) => {
    if (!couple) return
    await updateRelationshipStatus(couple.id, status as any)
    router.refresh()
  }

  const handleAnswer = async (questionId: string) => {
    if (!couple || !answerForms[questionId]?.trim()) return
    await submitAnswer({ questionId, coupleId: couple.id, content: answerForms[questionId] })
    setAnswerForms(p => ({ ...p, [questionId]: '' }))
    router.refresh()
  }

  const handleAddGoal = async () => {
    if (!couple || !goalForm.title) return
    await addCoupleGoal(couple.id, goalForm)
    setGoalForm({ title: '', description: '', deadline: '' , progress:0})
    setGoalModal(false)
    router.refresh()
  }

  const handleCheckin = async () => {
    if (!couple) return
    await addWeeklyCheckin(couple.id, checkinForm)
    setCheckinForm({ score: 7, feeling: '', improvement: '', gratitude: '' })
    setCheckinModal(false)
    router.refresh()
  }

  const handleReflection = async () => {
    await addDailyReflection({ coupleId: couple?.id, ...reflectionForm })
    setReflectionForm({ mood: 3, gratitude: '', note: '' })
    setReflectionModal(false)
    router.refresh()
  }

  const handleInvite = async () => {
    if (!couple || !inviteEmail.trim()) return
      const res = await invitePartner(inviteEmail);
      if (res.success) {
        // Afficher un message de succès
      }
      if (res.error) { setInviteError(res.error); return }
      setInviteEmail('')
      setInviteModal(false)
      router.refresh()
  };


  const handleLaunch = async () => {
    if (!couple || !launchAnswer.trim()) return;

    let questionId = selectedQuestionId;

    // Si on crée une nouvelle question
    if (launchMode === 'create') {
      const newQ = await createCustomQuestion(
        selectedCat!.id, 
        customQuestion.content, 
        customQuestion.isPublic
      );
      questionId = newQ.id;
    }

    // On lance la question en posant la première réponse
    await submitAnswer({ 
      questionId, 
      coupleId: couple.id, 
      content: launchAnswer 
    });

    // Reset et fermeture
    setIsLaunchModalOpen(false);
    setLaunchAnswer('');
    setSelectedQuestionId('');
    setCustomQuestion({ content: '', isPublic: false });
    router.refresh();
  };


  const scrollRef = useRef<HTMLDivElement>(null);

  // Fonction pour scroller vers le bas
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };


  useEffect(() => {
    
    if (!couple?.id) return
    
    // Initialisation de Pusher
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    })

    // S'abonner au canal du couple
    const channel = pusher.subscribe(`couple-${couple.id}`)

    // Écouter les nouveaux messages ou objectifs
    channel.bind('new-answer', () => {
      revalidatePath('/dashboard/couple'); // Rafraîchit les Server Components sans recharger la page
    })

    channel.bind('goal-updated', () => {
      router.refresh()
    })

    return () => {
      pusher.unsubscribe(`couple-${couple.id}`)
    }
  }, [couple?.id, router])
  

  if (!couple) {
    return (
      <div className="p-6 max-w-lg mx-auto w-full">
        <FadeIn>
          <div className="text-center mb-10">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 mb-4">
              <Heart size={40} className="text-pink-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Espace couple</h1>
            <p className="text-gray-500 mt-2">Créez votre espace ou rejoignez celui de votre partenaire</p>
          </div>

          <div className="grid gap-4">
            <Card hover>
              <h3 className="font-semibold text-gray-900 mb-2">Créer un espace</h3>
              <p className="text-sm text-gray-500 mb-4">Créez votre espace et invitez votre partenaire via un lien unique.</p>
              <Button onClick={handleCreate} loading={loading} className="w-full">
                <Plus size={16} />
                Créer mon espace couple
              </Button>
            </Card>

            <Card>
              <h3 className="font-semibold text-gray-900 mb-2">Rejoindre un espace</h3>
              <p className="text-sm text-gray-500 mb-4">Entrez le token d'invitation de votre partenaire.</p>
              <div className="flex gap-2">
                <Input placeholder="Token d'invitation..." value={joinToken}
                  onChange={e => setJoinToken(e.target.value)} className="flex-1" />
                <Button onClick={handleJoin} loading={loading}>Rejoindre</Button>
              </div>
            </Card>
          </div>
        </FadeIn>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: Heart },
    { id: 'questions', label: 'Questions', icon: BookOpen },
    { id: 'goals', label: 'Objectifs', icon: Target },
    { id: 'checkin', label: 'Check-in', icon: TrendingUp },
    { id: 'reflections', label: 'Réflexions', icon: MessageSquare },
  ]

  const doneGoals = couple.goals.filter(g => g.done).length
  const avgScore = couple.checkins.length
    ? Math.round(couple.checkins.slice(0, 4).reduce((s, c) => s + c.score, 0) / Math.min(4, couple.checkins.length))
    : 0

  return (
    <div className="p-6 max-w-4xl mx-auto w-full">
      <FadeIn>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notre couple</h1>
            <div className="flex items-center gap-2 mt-1">
              <select
                value={couple.relationshipStatus}
                onChange={e => handleStatusChange(e.target.value)}
                className={`text-xs font-medium rounded-full px-3 py-1 border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-300 ${STATUS_COLORS[couple.relationshipStatus]}`}
              >
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <Avatar src={couple.user1.avatar} name={couple.user1.name} size="md" />
              {couple.user2
                ? <Avatar src={couple.user2.avatar} name={couple.user2.name} size="md" />
                : <div className="h-10 w-10 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-gray-400 text-xs">?</div>
              }
            </div>
            {/* {!couple.user2 && couple.inviteToken && (
              <Button variant="secondary" size="sm" onClick={copyToken}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copié !' : 'Copier le lien'}
              </Button>
            )} */}

            {!couple.user2 && (
              <Button variant="secondary" size="sm" onClick={() => setInviteModal(true)}>
                <Users size={14} />
                Inviter
              </Button>
            )}
          </div>
        </div>
      </FadeIn>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon size={14} />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <StaggerChildren className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StaggerItem>
            <Card gradient className="text-center">
              <Heart size={28} className="mx-auto text-pink-500 mb-2" />
              <p className="text-sm text-gray-500">Relation</p>
              <p className="font-bold text-gray-900">{STATUS_LABELS[couple.relationshipStatus]}</p>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card className="text-center">
              <Target size={28} className="mx-auto text-purple-500 mb-2" />
              <p className="text-sm text-gray-500">Objectifs complétés</p>
              <p className="text-2xl font-bold text-gray-900">{doneGoals}/{couple.goals.length}</p>
              {couple.goals.length > 0 && (
                <ProgressBar value={Math.round((doneGoals / couple.goals.length) * 100)} size="sm" className="mt-2" />
              )}
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card className="text-center">
              <TrendingUp size={28} className="mx-auto text-indigo-500 mb-2" />
              <p className="text-sm text-gray-500">Score relationnel moyen</p>
              <p className="text-2xl font-bold text-gray-900">{avgScore > 0 ? `${avgScore}/10` : '-'}</p>
            </Card>
          </StaggerItem>
          <StaggerItem className="sm:col-span-3">
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setCheckinModal(true)}>
                <TrendingUp size={14} />
                Check-in hebdomadaire
              </Button>
              <Button variant="secondary" onClick={() => setReflectionModal(true)}>
                <BookOpen size={14} />
                Journal du jour
              </Button>
            </div>
          </StaggerItem>
        </StaggerChildren>
      )}

      

      {tab === 'questions' && (
      <div className="space-y-6">
        {view === 'themes' ? (
          /* VUE 1 : GRILLE DES THÈMES */
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Choisissez un thème</h2>
              <Button size="sm" variant="secondary" onClick={() => setIsCatModalOpen(true)}>
                <Plus size={14} className="mr-1" /> Nouveau thème
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {categories.map(cat => (

                <div onClick={() => { setSelectedCat(cat); setView('questions'); }} className=' cursor-pointer'>
                <Card key={cat.id} hover  className="cursor-pointer border-2 border-transparent hover:border-purple-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-gray-900">{cat.title}</h3>
                      <p className="text-xs text-gray-500">
                        {cat.questions.filter(q => q.answers.length > 0).length} discussions actives
                      </p>
                    </div>
                    <Heart size={16} className="text-pink-400" />
                  </div>
                </Card>
                </div>
              ))}
            </div>


            {/* MODAL : CRÉER UN THÈME (CATÉGORIE) */}
            <Modal open={isCatModalOpen} onClose={() => setIsCatModalOpen(false)} title="Créer un nouveau thème">
                <div className="space-y-4">
                  <Input 
                    label="Nom du thème" 
                    placeholder="Ex: Projets de vie, Éducation..." 
                    value={newCat.title}
                    onChange={e => setNewCat({...newCat, title: e.target.value})}
                  />
                  <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <input 
                      type="checkbox" 
                      id="catPublic"
                      checked={newCat.isPublic}
                      onChange={e => setNewCat({...newCat, isPublic: e.target.checked})}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <label htmlFor="catPublic" className="text-sm text-gray-600 cursor-pointer">
                      Rendre ce thème public (visible par tous les couples)
                    </label>
                  </div>
                  <Button className="w-full" onClick={handleCreateCategory} disabled={!newCat.title.trim()}>
                    Créer le thème
                  </Button>
                </div>
              </Modal>

          </div>
        ) : (
          /* VUE 2 : FEED DES QUESTIONS LANCÉES */
          <FadeIn>
            <div className="flex justify-between items-center mb-6">
              <Button variant="ghost" onClick={() => setView('themes')}>← Thèmes</Button>
              <Button onClick={() => setIsLaunchModalOpen(true)}>
                <Plus size={16} className="mr-2" /> Lancer une discussion
              </Button>
            </div>

            <div className="space-y-6">
              {/* On ne filtre ici que les questions qui ont déjà des réponses */}
              {selectedCat?.questions
              .filter(q => q.answers.length > 0)
              .map(q => {
                const isExpanded = expandedQuestions[q.id];
                
                return (
                  
                  <Card key={q.id} className="border-l-4 border-l-purple-500 overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                      <p className="font-bold text-gray-900 flex-1">{q.content}</p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => toggleExpand(q.id)}
                        className="ml-2 text-purple-600 hover:bg-purple-50"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        <span className="ml-1 text-xs">{isExpanded ? 'Réduire' : 'Voir l\'historique'}</span>
                      </Button>
                    </div>

                    {/* Zone de Scroll pour les réponses */}
                    <div 
                      className={`space-y-3 transition-all duration-300 ease-in-out overflow-y-auto pr-2
                        ${isExpanded ? 'max-h-80 opacity-100' : 'max-h-24 opacity-80'}`}
                      style={{ scrollbarWidth: 'thin' }}
                      ref={scrollRef}
                    >
                      {/* Tri par date : les plus anciennes en haut, les nouvelles en bas pour une lecture naturelle */}
                      {[...q.answers]
                        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                        .map(ans => (
                          <div key={ans.id} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
                                {ans.user.name}
                              </span>
                              <div className="flex items-center text-[10px] text-gray-400">
                                <Clock size={10} className="mr-1" />
                                {new Date(ans.createdAt).toLocaleString('fr-FR', { 
                                  day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
                                })}
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">{ans.content} </p>
                          </div>
                        ))}
                    </div>

                    {/* Champ de réponse toujours visible en bas de la carte */}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                      <Input 
                        placeholder="Ajouter une réponse au fil..." 
                        value={answerForms[q.id] ?? ''}
                        onChange={e => setAnswerForms(p => ({ ...p, [q.id]: e.target.value }))}
                        className="flex-1"
                      />
                      <Button size="sm" onClick={() => handleAnswer(q.id)}>Répondre</Button>
                    </div>
                  </Card>
                  
                );
              })}
            </div>

              
            {/* MODAL DE LANCEMENT */}
            <Modal open={isLaunchModalOpen} onClose={() => setIsLaunchModalOpen(false)} title="Lancer une nouvelle discussion">
              <div className="space-y-4">
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button className={`flex-1 py-1 text-sm rounded ${launchMode === 'select' ? 'bg-white shadow' : ''}`} onClick={() => setLaunchMode('select')}>Choisir</button>
                  <button className={`flex-1 py-1 text-sm rounded ${launchMode === 'create' ? 'bg-white shadow' : ''}`} onClick={() => setLaunchMode('create')}>Créer</button>
                </div>

                {launchMode === 'select' ? (
                  <select 
                    className="w-full border rounded-lg p-2 text-sm"
                    value={selectedQuestionId}
                    onChange={(e) => setSelectedQuestionId(e.target.value)}
                  >
                    <option value="">Sélectionner une question disponible...</option>
                    {/* On affiche les questions de la catégorie qui n'ont pas encore de réponses */}
                    {selectedCat?.questions.filter(q => q.answers.length === 0).map(q => (
                      <option key={q.id} value={q.id}>{q.content}</option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-3">
                    <Input 
                      placeholder="Votre question personnalisée..." 
                      value={customQuestion.content}
                      onChange={e => setCustomQuestion({...customQuestion, content: e.target.value})}
                    />
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input 
                        type="checkbox" 
                        checked={customQuestion.isPublic}
                        onChange={e => setCustomQuestion({...customQuestion, isPublic: e.target.checked})}
                      />
                      Rendre cette question publique pour la communauté
                    </label>
                  </div>
                )}

                <div className="pt-2">
                  <label className="text-xs font-bold text-gray-500 block mb-1">VOTRE PREMIÈRE RÉPONSE</label>
                  <textarea 
                    className="w-full border rounded-lg p-2 text-sm" 
                    rows={3}
                    placeholder="Pour lancer la discussion, donnez votre avis..."
                    value={launchAnswer}
                    onChange={e => setLaunchAnswer(e.target.value)}
                  />
                </div>

                <Button className="w-full" onClick={handleLaunch} disabled={!launchAnswer.trim()}>
                  Lancer la discussion
                </Button>
              </div>
            </Modal>
          </FadeIn>
        )}
      </div>
    )}

      {tab === 'reflections' && (
        <div className="mt-8">
          <h3 className="font-semibold text-gray-900 mb-4">Dernières réflexions</h3>
          <div className="space-y-3">
            {couple.reflections?.map(ref => (
              <Card key={ref.id}>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{['😔', '😕', '😐', '🙂', '😊'][ref.mood - 1]}</span>
                    <span className="text-sm font-medium">{ref.user.name}</span>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(ref.date).toLocaleDateString()}</span>
                </div>
                {ref.note && <p className="text-sm text-gray-700 mt-2">{ref.note}</p>}
                {ref.gratitude && (
                  <p className="text-xs text-pink-600 mt-1">✨ Reconnaissant pour : {ref.gratitude}</p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === 'goals' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-gray-900">Objectifs du couple</h2>
            <Button size="sm" onClick={() => setGoalModal(true)}>
              <Plus size={14} />
              Ajouter
            </Button>
          </div>
          {couple.goals.length === 0 ? (
            <Card className="text-center py-8">
              <Target size={36} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Aucun objectif pour l'instant</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {couple.goals.map(g => (
                <motion.div
                  key={g.id}
                  layout
                  className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${g.done ? 'bg-green-50 border-green-100' : 'bg-white border-gray-100 shadow-sm'}`}
                >
                  <button
                    onClick={async () => { await toggleCoupleGoal(g.id, !g.done); router.refresh() }}
                    className={`h-5 w-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${g.done ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-purple-400'}`}
                  >
                    {g.done && <CheckCircle size={12} />}
                  </button>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${g.done ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{g.title}</p>
                    {g.description && <p className="text-xs text-gray-500 mt-0.5">{g.description}</p>}
                    <div className="flex gap-3 mt-1 text-xs text-gray-400">
                      <span>{g.user.name}</span>
                      {g.deadline && <span className="flex items-center gap-0.5"><Calendar size={10} /> {new Date(g.deadline).toLocaleDateString('fr-FR')}</span>}
                    </div>
                    <div className="mt-2 mb-4">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-purple-600 font-medium">{goalForm.progress}% atteint</span>
                        {goalForm.deadline && <span>Échéance : {new Date(goalForm.deadline).toLocaleDateString()}</span>}
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div 
                          className="bg-purple-500 h-1.5 rounded-full transition-all duration-500" 
                          style={{ width: `${goalForm.progress}%` }}
                        ></div>
                      </div>
                    </div>

                  </div>

                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => openEditGoal(g)}
                    className="text-gray-400 hover:text-purple-600"
                  >
                    <Edit2 size={14} />
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'checkin' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-gray-900">Check-ins hebdomadaires</h2>
            <Button size="sm" onClick={() => setCheckinModal(true)}>
              <Plus size={14} />
              Nouveau
            </Button>
          </div>
          {couple.checkins.length === 0 ? (
            <Card className="text-center py-8">
              <TrendingUp size={36} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Aucun check-in pour l'instant</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {couple.checkins.slice(0, 10).map(c => (
                <Card key={c.id} className="flex items-center gap-4">
                  <div className={`text-2xl font-bold w-12 text-center flex-shrink-0 ${c.score >= 7 ? 'text-green-600' : c.score >= 4 ? 'text-amber-500' : 'text-red-500'}`}>
                    {c.score}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>{c.user.name}</span>
                      <span>{new Date(c.week).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <ProgressBar value={c.score * 10} size="sm" color={c.score >= 7 ? 'green' : c.score >= 4 ? 'rose' : 'rose'} showPercent={false} />
                    {c.feeling && <p className="text-xs text-gray-500 mt-1">{c.feeling}</p>}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal open={goalModal} onClose={() => setGoalModal(false)} title="Nouvel objectif">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Niveau d'avancement : {goalForm.progress}%
          </label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            step="5"
            value={goalForm.progress}
            onChange={e => setGoalForm(p => ({ ...p, progress: parseInt(e.target.value) }))}
            className="w-full accent-purple-600 h-2 bg-gray-200 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>Début</span>
            <span>En cours</span>
            <span>Atteint</span>
          </div>
        </div>
        <div className="space-y-4">
          <Input label="Titre" placeholder="Ex: Voyager au Japon" value={goalForm.title}
            onChange={e => setGoalForm(p => ({ ...p, title: e.target.value }))} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-200" rows={2}
              value={goalForm.description} onChange={e => setGoalForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <Input label="Date limite" type="date" value={goalForm.deadline}
            onChange={e => setGoalForm(p => ({ ...p, deadline: e.target.value }))} />
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setGoalModal(false)} className="flex-1">Annuler</Button>
            <Button onClick={handleSaveGoal} className="flex-1">
              {editingGoal ? "Enregistrer les modifications" : "Ajouter l'objectif"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={checkinModal} onClose={() => setCheckinModal(false)} title="Check-in hebdomadaire">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Comment évaluez-vous votre relation cette semaine ? ({checkinForm.score}/10)
            </label>
            <input type="range" min={1} max={10} value={checkinForm.score}
              onChange={e => setCheckinForm(p => ({ ...p, score: parseInt(e.target.value) }))}
              className="w-full accent-purple-600" />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1</span><span>5</span><span>10</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Comment te sens-tu ?</label>
            <textarea className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-200" rows={2}
              value={checkinForm.feeling} onChange={e => setCheckinForm(p => ({ ...p, feeling: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Quelque chose à améliorer ?</label>
            <textarea className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-200" rows={2}
              value={checkinForm.improvement} onChange={e => setCheckinForm(p => ({ ...p, improvement: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Gratitude</label>
            <input className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
              value={checkinForm.gratitude} onChange={e => setCheckinForm(p => ({ ...p, gratitude: e.target.value }))}
              placeholder="Je suis reconnaissant(e) pour..." />
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setCheckinModal(false)} className="flex-1">Annuler</Button>
            <Button onClick={handleCheckin} className="flex-1">Enregistrer</Button>
          </div>
        </div>
      </Modal>

      <Modal open={reflectionModal} onClose={() => setReflectionModal(false)} title="Journal du jour">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Humeur ({reflectionForm.mood}/5)</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setReflectionForm(p => ({ ...p, mood: n }))}
                  className={`flex-1 py-2 rounded-xl text-lg transition-all ${reflectionForm.mood === n ? 'bg-purple-100 scale-110' : 'bg-gray-50 hover:bg-gray-100'}`}>
                  {['😔', '😕', '😐', '🙂', '😊'][n - 1]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Gratitude</label>
            <input className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
              value={reflectionForm.gratitude} onChange={e => setReflectionForm(p => ({ ...p, gratitude: e.target.value }))}
              placeholder="Je suis reconnaissant(e) pour..." />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Note du jour</label>
            <textarea className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-200" rows={3}
              value={reflectionForm.note} onChange={e => setReflectionForm(p => ({ ...p, note: e.target.value }))} />
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setReflectionModal(false)} className="flex-1">Annuler</Button>
            <Button onClick={handleReflection} className="flex-1">Enregistrer</Button>
          </div>
        </div>
      </Modal>


        <Modal open={inviteModal} onClose={() => setInviteModal(false)} title="Inviter un membre">
          <div className="space-y-4">
            <Input label="Email" type="email" placeholder="partenaire@email.com" value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)} />
            {inviteError && <p className="text-sm text-red-500">{inviteError}</p>}
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setInviteModal(false)} className="flex-1">Annuler</Button>
              <Button onClick={handleInvite} className="flex-1">Inviter</Button>
            </div>
          </div>
        </Modal>
    </div>
  )
}
