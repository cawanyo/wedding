'use client'

import React, { useState, useTransition, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Pusher from 'pusher-js'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, Users, Plus, CheckCircle, Target, MessageSquare,
  BookOpen, TrendingUp, Copy, Check, Calendar, Clock,
  ChevronUp, ChevronDown, Edit2, LogOut, AlertTriangle,
  Compass, Layers, HelpCircle, Sparkles, ChevronLeft,
  ArrowRight, Trophy, Loader2, Star, CheckCircle2, Search,
  UserPlus, X, Archive, RotateCcw, Upload, PenLine,
  Eye, ChevronRight, Zap, Lock, Send,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import { FadeIn, StaggerChildren, StaggerItem } from '@/components/animations/transitions'
import {
  createCoupleWithInvitation, searchUsersToInvite,
  acceptCoupleInvitation, denyCoupleInvitation, cancelCoupleInvitation,
  reactivateArchivedCouple, checkPreviousCoupleWithUser,
  updateRelationshipStatus, leaveCouple,
  submitAnswer, addCoupleGoal, toggleCoupleGoal, updateCoupleGoal,
  addWeeklyCheckin, addDailyReflection,
  createCustomQuestion, createCategory,
  startCoupleRoadmap, saveCoupleRoadmapAnswer, updateCoupleRoadmapSection,
  completeCoupleRoadmap,
} from '@/actions/couple'
import { createCustomRoadmap } from '@/actions/discovery'

// ─── Types ────────────────────────────────────────────────────────────────────

type UserBasic = { id: string; name: string | null; email?: string | null; avatar?: string | null }

type Goal = { id: string; title: string; description?: string | null; deadline?: string | null; done: boolean; progress: number; user: UserBasic }
type Checkin = { id: string; score: number; feeling?: string | null; improvement?: string | null; gratitude?: string | null; user: UserBasic; week: string }
type Reflection = { id: string; mood: number; note?: string | null; gratitude?: string | null; date: string; user: UserBasic }
type Answer = { id: string; content: string; user: UserBasic }
type Question = { id: string; content: string; answers: Answer[] }
type Category = { id: string; title: string; questions: Question[] }

type Couple = {
  id: string
  relationshipStatus: string
  status: string
  user1: UserBasic
  user2: UserBasic | null
  goals: Goal[]
  checkins: Checkin[]
  reflections: Reflection[]
}

type PendingInvitation = {
  id: string
  user1: UserBasic
  status: string
}

type PendingCouple = {
  id: string
  user2: UserBasic | null
  status: string
}

type ArchivedCouple = {
  id: string
  user1: UserBasic
  user2: UserBasic | null
  archivedAt: string | null
  goals: any[]
  checkins: any[]
  reflections: any[]
}

type RoadmapItem = { id: string; type: string; title: string; content: string; order: number }
type RoadmapSection = { id: string; title: string; description: string | null; order: number; items: RoadmapItem[] }
type Roadmap = { id: string; title: string; description: string | null; category: string; icon: string | null; color: string | null; sections: RoadmapSection[] }
type CoupleRoadmapAnswer = { id: string; itemId: string; userId: string; content: string; user: { name: string | null; avatar?: string | null } }
type CoupleRoadmapType = { id: string; roadmapId: string; currentSection: number; completedAt: Date | null; roadmap: Roadmap; answers: CoupleRoadmapAnswer[] }

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, { label: string; color: string; emoji: string }> = {
  UNDEFINED:  { label: 'En découverte', color: 'text-gray-500',  emoji: '💫' },
  KNOWING:    { label: 'On se découvre', color: 'text-blue-500',  emoji: '🌱' },
  ENGAGED:    { label: 'Fiancés',        color: 'text-pink-500',  emoji: '💍' },
  MARRIED:    { label: 'Mariés',         color: 'text-purple-600', emoji: '👑' },
}

const CATEGORY_COLORS: Record<string, string> = {
  IKIGAI: 'from-rose-400 to-orange-400',
  CHRISTIAN: 'from-amber-400 to-yellow-300',
  SCIENTIFIC: 'from-emerald-400 to-cyan-500',
  COUPLE: 'from-pink-400 to-purple-500',
  CUSTOM: 'from-violet-400 to-purple-500',
}
const CATEGORY_LABELS: Record<string, string> = {
  IKIGAI: 'Ikigai', CHRISTIAN: 'Chrétien', SCIENTIFIC: 'Science',
  COUPLE: 'Couple', CUSTOM: 'Personnalisé',
}
const ITEM_TYPE_CONFIG: Record<string, { icon: React.ElementType; label: string; bg: string; text: string; border: string }> = {
  EXPLANATION: { icon: BookOpen, label: 'Explication', bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200' },
  EXERCISE:    { icon: Target,   label: 'Exercice',    bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  QUESTION:    { icon: HelpCircle, label: 'Question',  bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  REFLECTION:  { icon: Sparkles, label: 'Réflexion',   bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200' },
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function CouplePageClient({
  couple,
  pendingInvitation,
  myPendingCouple,
  archivedCouples,
  categories,
  userId,
  coupleRoadmaps,
  availableRoadmaps,
  unreadMessages,
}: {
  couple: Couple | null
  pendingInvitation: PendingInvitation | null
  myPendingCouple: PendingCouple | null
  archivedCouples: ArchivedCouple[]
  categories: Category[]
  userId: string
  coupleRoadmaps: CoupleRoadmapType[]
  availableRoadmaps: Roadmap[]
  unreadMessages: number
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const refresh = () => startTransition(() => { router.refresh() })

  // ── Real-time: auto-refresh on couple events ──────────────────────────────
  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu',
    })
    const channel = pusher.subscribe(`user-${userId}`)
    const events = ['couple:invitation', 'couple:accepted', 'couple:denied', 'couple:left']
    events.forEach(ev => channel.bind(ev, () => router.refresh()))
    return () => { pusher.unsubscribe(`user-${userId}`); pusher.disconnect() }
  }, [userId, router])

  // ── If user has a pending invitation to accept ───────────────────────────
  if (pendingInvitation && !couple) {
    return <InvitationScreen invitation={pendingInvitation} onRefresh={refresh} />
  }

  // ── If user has no couple yet ─────────────────────────────────────────────
  if (!couple) {
    return (
      <NoCoupleScreen
        myPendingCouple={myPendingCouple}
        archivedCouples={archivedCouples}
        userId={userId}
        onRefresh={refresh}
      />
    )
  }

  // ── Active couple ─────────────────────────────────────────────────────────
  return (
    <ActiveCoupleScreen
      couple={couple}
      categories={categories}
      userId={userId}
      coupleRoadmaps={coupleRoadmaps}
      availableRoadmaps={availableRoadmaps}
      archivedCouples={archivedCouples}
      unreadMessages={unreadMessages}
      onRefresh={refresh}
    />
  )
}

// ─── Invitation Screen ────────────────────────────────────────────────────────

function InvitationScreen({ invitation, onRefresh }: { invitation: PendingInvitation; onRefresh: () => void }) {
  const [loading, setLoading] = useState(false)

  const handleAccept = async () => {
    setLoading(true)
    await acceptCoupleInvitation(invitation.id)
    setLoading(false)
    onRefresh()
  }

  const handleDeny = async () => {
    setLoading(true)
    await denyCoupleInvitation(invitation.id)
    setLoading(false)
    onRefresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <FadeIn>
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-pink-100 overflow-hidden">
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-8 text-white text-center">
            <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
              <Heart size={36} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold">Invitation de couple</h1>
            <p className="text-white/80 mt-2 text-sm">Quelqu'un vous invite à construire quelque chose de beau ensemble</p>
          </div>
          <div className="p-8">
            <div className="flex items-center gap-4 bg-pink-50 rounded-2xl p-4 mb-6">
              <Avatar src={invitation.user1.avatar} name={invitation.user1.name} size="lg" />
              <div>
                <p className="font-bold text-gray-900 text-lg">{invitation.user1.name}</p>
                <p className="text-gray-500 text-sm">{invitation.user1.email}</p>
                <p className="text-pink-500 text-xs mt-1 font-medium">vous invite dans son espace couple 💝</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-6 text-center leading-relaxed">
              En acceptant, vous pourrez partager vos réflexions, objectifs et parcours ensemble dans un espace privé.
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={handleDeny} disabled={loading} className="flex-1 border border-gray-200">
                <X size={16} /> Décliner
              </Button>
              <Button onClick={handleAccept} disabled={loading} className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Heart size={16} />}
                Accepter
              </Button>
            </div>
          </div>
        </div>
      </FadeIn>
    </div>
  )
}

// ─── No Couple Screen ─────────────────────────────────────────────────────────

function NoCoupleScreen({
  myPendingCouple,
  archivedCouples,
  userId,
  onRefresh,
}: {
  myPendingCouple: PendingCouple | null
  archivedCouples: ArchivedCouple[]
  userId: string
  onRefresh: () => void
}) {
  const [inviteModal, setInviteModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserBasic[]>([])
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserBasic | null>(null)
  const [previousCouple, setPreviousCouple] = useState<any>(null)
  const [previousCoupleChoice, setPreviousCoupleChoice] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async (q: string) => {
    setSearchQuery(q)
    if (q.length < 2) { setSearchResults([]); return }
    setSearching(true)
    const results = await searchUsersToInvite(q)
    setSearchResults(results as UserBasic[])
    setSearching(false)
  }

  const handleSelectUser = async (user: UserBasic) => {
    setSelectedUser(user)
    setSearchResults([])
    setSearchQuery(user.name || user.email || '')
    // Check for previous couple
    const prev = await checkPreviousCoupleWithUser(user.id)
    if (prev) setPreviousCouple(prev)
  }

  const handleInvite = async (continueOld = false) => {
    if (!selectedUser) return
    setLoading(true)
    setError('')

    if (continueOld && previousCouple) {
      const res = await reactivateArchivedCouple(previousCouple.id, selectedUser.id)
      if (res.error) { setError(res.error); setLoading(false); return }
    } else {
      const res = await createCoupleWithInvitation(selectedUser.id)
      if (res.error) { setError(res.error); setLoading(false); return }
    }
    setLoading(false)
    setInviteModal(false)
    onRefresh()
  }

  const handleCancel = async () => {
    if (!myPendingCouple) return
    setLoading(true)
    await cancelCoupleInvitation(myPendingCouple.id)
    setLoading(false)
    onRefresh()
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        <FadeIn>
          {myPendingCouple ? (
            // Waiting for partner to accept
            <div className="bg-white rounded-3xl shadow-lg border border-amber-100 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-400 to-orange-400 p-8 text-white text-center">
                <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                  <Clock size={28} className="text-white" />
                </div>
                <h2 className="text-xl font-bold">Invitation envoyée</h2>
                <p className="text-white/80 text-sm mt-1">En attente de réponse</p>
              </div>
              <div className="p-8 text-center">
                <div className="flex items-center gap-3 bg-amber-50 rounded-2xl p-4 mb-6">
                  <Avatar src={myPendingCouple.user2?.avatar} name={myPendingCouple.user2?.name} size="lg" />
                  <div className="text-left">
                    <p className="font-bold text-gray-900">{myPendingCouple.user2?.name}</p>
                    <p className="text-amber-600 text-xs mt-1">En attente d'acceptation...</p>
                  </div>
                </div>
                <p className="text-gray-500 text-sm mb-6">
                  {myPendingCouple.user2?.name} recevra une notification et pourra accepter ou décliner votre invitation.
                </p>
                <Button variant="ghost" onClick={handleCancel} disabled={loading} className="text-red-500 border border-red-200 hover:bg-red-50">
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                  Annuler l'invitation
                </Button>
              </div>
            </div>
          ) : (
            // No couple at all
            <div className="text-center">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-pink-200">
                <Heart size={40} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Votre espace couple</h1>
              <p className="text-gray-500 text-sm max-w-sm mx-auto mb-8 leading-relaxed">
                Créez un espace partagé pour explorer vos valeurs, construire vos objectifs et grandir ensemble.
              </p>

              <Button
                size="lg"
                onClick={() => setInviteModal(true)}
                className="bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-200"
              >
                <UserPlus size={18} />
                Inviter mon partenaire
              </Button>

              {archivedCouples.length > 0 && (
                <div className="mt-8 bg-gray-50 rounded-2xl p-4">
                  <p className="text-xs text-gray-500 font-medium mb-3 flex items-center justify-center gap-1">
                    <Archive size={12} /> Anciens espaces couple
                  </p>
                  {archivedCouples.slice(0, 2).map(ac => {
                    const partner = ac.user1.id !== userId ? ac.user1 : ac.user2
                    return (
                      <div key={ac.id} className="flex items-center gap-3 bg-white rounded-xl p-3 mb-2 border border-gray-100">
                        <Avatar src={partner?.avatar} name={partner?.name} size="sm" />
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-gray-700">{partner?.name}</p>
                          <p className="text-xs text-gray-400">
                            Archivé {ac.archivedAt ? new Date(ac.archivedAt).toLocaleDateString('fr-FR') : ''}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </FadeIn>
      </div>

      {/* Invite Modal */}
      <Modal open={inviteModal} onClose={() => { setInviteModal(false); setSelectedUser(null); setSearchQuery(''); setPreviousCouple(null) }} title="Inviter mon partenaire">
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            </div>
            <input
              type="text"
              className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
              placeholder="Rechercher par nom ou email..."
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
            />
          </div>

          {searchResults.length > 0 && (
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              {searchResults.map(u => (
                <button key={u.id} onClick={() => handleSelectUser(u)} className="flex items-center gap-3 w-full px-4 py-3 hover:bg-pink-50 transition-colors border-b border-gray-50 last:border-0">
                  <Avatar src={u.avatar} name={u.name} size="sm" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-800">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {selectedUser && (
            <div className="bg-pink-50 rounded-xl p-4 flex items-center gap-3">
              <Avatar src={selectedUser.avatar} name={selectedUser.name} size="md" />
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{selectedUser.name}</p>
                <p className="text-xs text-gray-500">{selectedUser.email}</p>
              </div>
              <button onClick={() => { setSelectedUser(null); setSearchQuery(''); setPreviousCouple(null) }} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
          )}

          {previousCouple && selectedUser && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-amber-700 flex items-center gap-2 mb-2">
                <RotateCcw size={14} /> Vous avez déjà un espace avec {selectedUser.name}
              </p>
              <p className="text-xs text-amber-600 mb-3">
                Archivé le {previousCouple.archivedAt ? new Date(previousCouple.archivedAt).toLocaleDateString('fr-FR') : ''}.
                Voulez-vous continuer cet espace ou en créer un nouveau ?
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => handleInvite(true)} disabled={loading} className="flex-1 text-xs">
                  <RotateCcw size={12} /> Continuer l'ancien
                </Button>
                <Button size="sm" onClick={() => handleInvite(false)} disabled={loading} className="flex-1 text-xs">
                  <Plus size={12} /> Nouveau départ
                </Button>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          {selectedUser && !previousCouple && (
            <Button onClick={() => handleInvite(false)} disabled={loading || !selectedUser} className="w-full">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Heart size={16} />}
              Envoyer l'invitation à {selectedUser.name}
            </Button>
          )}
        </div>
      </Modal>
    </div>
  )
}

// ─── Active Couple Screen ──────────────────────────────────────────────────────

type TabId = 'overview' | 'questions' | 'goals' | 'checkin' | 'reflections' | 'roadmaps'

function ActiveCoupleScreen({
  couple, categories, userId, coupleRoadmaps, availableRoadmaps, archivedCouples, unreadMessages, onRefresh,
}: {
  couple: Couple
  categories: Category[]
  userId: string
  coupleRoadmaps: CoupleRoadmapType[]
  availableRoadmaps: Roadmap[]
  archivedCouples: ArchivedCouple[]
  unreadMessages: number
  onRefresh: () => void
}) {
  const router = useRouter()
  const [tab, setTab] = useState<TabId>('overview')
  const [loading, setLoading] = useState(false)
  const [leaveModal, setLeaveModal] = useState(false)
  const [statusModal, setStatusModal] = useState(false)
  const [goalModal, setGoalModal] = useState(false)
  const [goalForm, setGoalForm] = useState({ title: '', description: '', deadline: '', progress: 0 })
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [checkinModal, setCheckinModal] = useState(false)
  const [checkinForm, setCheckinForm] = useState({ score: 5, feeling: '', improvement: '', gratitude: '' })
  const [reflectionForm, setReflectionForm] = useState({ mood: 5, note: '', gratitude: '' })
  const [activeAnswerQ, setActiveAnswerQ] = useState<string | null>(null)
  const [answerText, setAnswerText] = useState('')
  const [copiedToken, setCopiedToken] = useState(false)
  const [activeRoadmap, setActiveRoadmap] = useState<CoupleRoadmapType | null>(null)
  const [roadmapAnswers, setRoadmapAnswers] = useState<Record<string, string>>({})
  const [savingRoadmapItem, setSavingRoadmapItem] = useState<string | null>(null)
  const [roadmapPickerModal, setRoadmapPickerModal] = useState(false)
  const [roadmapCreateModal, setRoadmapCreateModal] = useState(false)
  const [pdfModal, setPdfModal] = useState(false)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState('')
  const [pdfDragging, setPdfDragging] = useState(false)
  const [createForm, setCreateForm] = useState({
    title: '', description: '', icon: '💑', color: 'from-pink-400 to-purple-500',
    sections: [{ title: '', description: '', items: [{ type: 'QUESTION', title: '', content: '' }] }],
  })

  const partner = couple.user1.id === userId ? couple.user2 : couple.user1
  const statusInfo = STATUS_LABELS[couple.relationshipStatus] || STATUS_LABELS.UNDEFINED

  const tabs: { id: TabId; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'overview', label: 'Ensemble', icon: Heart },
    { id: 'questions', label: 'Questions', icon: BookOpen },
    { id: 'goals', label: 'Objectifs', icon: Target, badge: couple.goals.filter(g => !g.done).length },
    { id: 'checkin', label: 'Check-in', icon: TrendingUp },
    { id: 'reflections', label: 'Réflexions', icon: MessageSquare },
    { id: 'roadmaps', label: 'Roadmaps', icon: Compass, badge: coupleRoadmaps.length },

  ]

  const openRoadmap = (cr: CoupleRoadmapType) => {
    const preloaded: Record<string, string> = {}
    cr.answers.forEach(a => { preloaded[a.itemId + '_' + a.userId] = a.content })
    setRoadmapAnswers(preloaded)
    setActiveRoadmap(cr)
  }

  const handleStartCoupleRoadmap = async (roadmapId: string) => {
    await startCoupleRoadmap(roadmapId, couple.id)
    onRefresh()
  }

  const handleSaveCoupleAnswer = async (coupleRoadmapId: string, itemId: string) => {
    const content = roadmapAnswers[itemId + '_' + userId]
    if (!content?.trim()) return
    setSavingRoadmapItem(itemId)
    await saveCoupleRoadmapAnswer(coupleRoadmapId, itemId, content)
    setSavingRoadmapItem(null)
    onRefresh()
  }

  const handleCoupleRoadmapSectionChange = async (coupleRoadmapId: string, idx: number) => {
    await updateCoupleRoadmapSection(coupleRoadmapId, idx)
    if (activeRoadmap) setActiveRoadmap({ ...activeRoadmap, currentSection: idx })
  }

  const handleCompleteCoupleRoadmap = async (coupleRoadmapId: string) => {
    await completeCoupleRoadmap(coupleRoadmapId)
    onRefresh()
    setActiveRoadmap(null)
  }

  const handleLeave = async () => {
    setLoading(true)
    await leaveCouple(couple.id)
    setLoading(false)
    setLeaveModal(false)
    onRefresh()
  }

  const handleAddGoal = async () => {
    if (!goalForm.title.trim()) return
    if (editingGoal) {
      await updateCoupleGoal(editingGoal.id, { ...goalForm, progress: Number(goalForm.progress) })
    } else {
      await addCoupleGoal(couple.id, goalForm)
    }
    setGoalModal(false)
    setEditingGoal(null)
    setGoalForm({ title: '', description: '', deadline: '', progress: 0 })
    onRefresh()
  }

  const handleSubmitAnswer = async (questionId: string) => {
    if (!answerText.trim()) return
    await submitAnswer({ questionId, coupleId: couple.id, content: answerText })
    setAnswerText('')
    setActiveAnswerQ(null)
    onRefresh()
  }

  const handleAddCheckin = async () => {
    await addWeeklyCheckin(couple.id, checkinForm)
    setCheckinModal(false)
    setCheckinForm({ score: 5, feeling: '', improvement: '', gratitude: '' })
    onRefresh()
  }

  const handleAddReflection = async () => {
    await addDailyReflection({ coupleId: couple.id, ...reflectionForm })
    setReflectionForm({ mood: 5, note: '', gratitude: '' })
    onRefresh()
  }

  const handlePdfSubmit = async () => {
    if (!pdfFile) return
    setPdfLoading(true)
    setPdfError('')
    try {
      const formData = new FormData()
      formData.append('file', pdfFile)
      const res = await fetch('/api/roadmap-from-pdf', { method: 'POST', body: formData })
      const data = await res.json()
      if (!data.success) { setPdfError(data.error || 'Erreur'); return }
      const result = await createCustomRoadmap(data.roadmap)
      if (result.success) {
        setPdfModal(false)
        setPdfFile(null)
        onRefresh()
      }
    } catch { setPdfError('Erreur lors du traitement') }
    finally { setPdfLoading(false) }
  }

  const handleCreateRoadmap = async () => {
    if (!createForm.title.trim()) return
    const res = await createCustomRoadmap({
      ...createForm,
      sections: createForm.sections.filter(s => s.title.trim()).map(s => ({
        ...s,
        items: s.items.filter(i => i.title.trim() && i.content.trim()),
      })),
    })
    if (res.success) {
      setRoadmapCreateModal(false)
      setCreateForm({ title: '', description: '', icon: '💑', color: 'from-pink-400 to-purple-500', sections: [{ title: '', description: '', items: [{ type: 'QUESTION', title: '', content: '' }] }] })
      onRefresh()
    }
  }

  if (activeRoadmap) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto w-full">
        <CoupleRoadmapViewer
          cr={activeRoadmap}
          userId={userId}
          partnerName={partner?.name || 'Partenaire'}
          answers={roadmapAnswers}
          setAnswers={setRoadmapAnswers}
          savingItem={savingRoadmapItem}
          onSaveAnswer={handleSaveCoupleAnswer}
          onSectionChange={handleCoupleRoadmapSectionChange}
          onComplete={handleCompleteCoupleRoadmap}
          onClose={() => setActiveRoadmap(null)}
        />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <FadeIn>
        <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-2xl p-6 mb-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-2 right-8 text-7xl">💑</div>
          </div>
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                <Avatar src={couple.user1.avatar} name={couple.user1.name} size="lg" className="border-3 border-white ring-2 ring-white/50" />
                <Avatar src={couple.user2?.avatar} name={couple.user2?.name} size="lg" className="border-3 border-white ring-2 ring-white/50" />
              </div>
              <div>
                <h1 className="font-bold text-xl">
                  {couple.user1.name} & {couple.user2?.name || 'En attente'}
                </h1>
                <button onClick={() => setStatusModal(true)} className="flex items-center gap-1 text-white/80 hover:text-white text-sm transition-colors">
                  <span>{statusInfo.emoji}</span>
                  <span>{statusInfo.label}</span>
                  <ChevronDown size={12} />
                </button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLeaveModal(true)}
              className="text-white/70 hover:text-white hover:bg-white/10 border border-white/20"
            >
              <LogOut size={14} /> Quitter
            </Button>
          </div>
        </div>
      </FadeIn>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-6 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative flex-shrink-0 flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
              tab === t.id ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <t.icon size={14} />
            {t.label}
            {t.badge && t.badge > 0 && (
              <span className={`h-4 min-w-[16px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center ${tab === t.id ? 'bg-white/30 text-white' : 'bg-pink-100 text-pink-600'}`}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>

          {/* OVERVIEW */}
          {tab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Partner card */}
              <Card className="p-5">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Votre partenaire</h2>
                <div className="flex items-center gap-4">
                  <Avatar src={partner?.avatar} name={partner?.name} size="xl" />
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{partner?.name || 'En attente'}</p>
                    <p className="text-gray-500 text-sm">{partner?.email}</p>
                    <p className="text-pink-500 text-xs mt-1 font-medium flex items-center gap-1">
                      <Heart size={10} /> {statusInfo.emoji} {statusInfo.label}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Stats card */}
              <Card className="p-5">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Votre parcours</h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Objectifs', value: couple.goals.length, icon: Target, color: 'text-purple-500' },
                    { label: 'Complétés', value: couple.goals.filter(g => g.done).length, icon: CheckCircle, color: 'text-emerald-500' },
                    { label: 'Questions', value: categories.reduce((s, c) => s + c.questions.filter(q => q.answers.length > 0).length, 0), icon: BookOpen, color: 'text-blue-500' },
                    { label: 'Roadmaps', value: coupleRoadmaps.length, icon: Compass, color: 'text-pink-500' },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                      <s.icon size={18} className={`mx-auto mb-1 ${s.color}`} />
                      <p className="text-xl font-bold text-gray-900">{s.value}</p>
                      <p className="text-xs text-gray-400">{s.label}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Recent goals */}
              <Card className="p-5 md:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Objectifs récents</h2>
                  <Button size="sm" onClick={() => setTab('goals')}>Voir tous</Button>
                </div>
                {couple.goals.slice(0, 3).map(g => (
                  <div key={g.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${g.done ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                      {g.done ? <CheckCircle size={14} className="text-emerald-500" /> : <Target size={14} className="text-gray-400" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{g.title}</p>
                      <div className="mt-1 h-1 bg-gray-100 rounded-full overflow-hidden w-32">
                        <div className="h-full bg-gradient-to-r from-pink-400 to-purple-500 rounded-full" style={{ width: `${g.progress}%` }} />
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{g.progress}%</span>
                  </div>
                ))}
                {couple.goals.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Aucun objectif pour l'instant</p>}
              </Card>
            </div>
          )}

          {/* QUESTIONS */}
          {tab === 'questions' && (
            <div className="space-y-4">
              {categories.map(cat => (
                <Card key={cat.id} className="overflow-hidden">
                  <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800 text-sm">{cat.title}</h3>
                    <p className="text-xs text-gray-400">{cat.questions.filter(q => q.answers.length > 0).length}/{cat.questions.length} répondues</p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {cat.questions.map(q => {
                      const myAnswer = q.answers.find(a => a.user.id === userId)
                      const partnerAnswer = q.answers.find(a => a.user.id !== userId)
                      const isOpen = activeAnswerQ === q.id
                      return (
                        <div key={q.id} className="p-4">
                          <button onClick={() => setActiveAnswerQ(isOpen ? null : q.id)} className="flex items-start gap-3 w-full text-left">
                            <div className={`h-6 w-6 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center ${q.answers.length === 2 ? 'bg-emerald-100' : q.answers.length === 1 ? 'bg-amber-100' : 'bg-gray-100'}`}>
                              {q.answers.length === 2 ? <CheckCircle size={12} className="text-emerald-500" /> : q.answers.length === 1 ? <Clock size={12} className="text-amber-500" /> : <HelpCircle size={12} className="text-gray-400" />}
                            </div>
                            <p className="flex-1 text-sm text-gray-800 font-medium leading-snug">{q.content}</p>
                            {isOpen ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
                          </button>
                          <AnimatePresence>
                            {isOpen && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className="pt-3 pl-9 space-y-3">
                                  {myAnswer ? (
                                    <div className="bg-pink-50 rounded-xl p-3">
                                      <p className="text-xs font-bold text-pink-500 mb-1">Ma réponse</p>
                                      <p className="text-sm text-gray-700">{myAnswer.content}</p>
                                    </div>
                                  ) : (
                                    <div>
                                      <textarea
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-200"
                                        rows={3}
                                        placeholder="Votre réponse..."
                                        value={answerText}
                                        onChange={e => setAnswerText(e.target.value)}
                                      />
                                      <Button size="sm" onClick={() => handleSubmitAnswer(q.id)} disabled={!answerText.trim()} className="mt-2">
                                        <Send size={12} /> Soumettre
                                      </Button>
                                    </div>
                                  )}
                                  {partnerAnswer && (
                                    <div className="bg-purple-50 rounded-xl p-3">
                                      <p className="text-xs font-bold text-purple-500 mb-1">Réponse de {partner?.name}</p>
                                      <p className="text-sm text-gray-700">{partnerAnswer.content}</p>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* GOALS */}
          {tab === 'goals' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => { setEditingGoal(null); setGoalForm({ title: '', description: '', deadline: '', progress: 0 }); setGoalModal(true) }}>
                  <Plus size={14} /> Nouvel objectif
                </Button>
              </div>
              {couple.goals.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <Target size={40} className="mx-auto text-gray-200 mb-3" />
                  <p className="text-gray-400">Aucun objectif commun pour l'instant</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {couple.goals.map(g => (
                    <Card key={g.id} className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-2 flex-1">
                          <button onClick={() => toggleCoupleGoal(g.id, !g.done).then(onRefresh)} className="mt-0.5 flex-shrink-0">
                            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${g.done ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
                              {g.done && <CheckCircle size={12} className="text-white" />}
                            </div>
                          </button>
                          <h3 className={`font-semibold text-sm ${g.done ? 'line-through text-gray-400' : 'text-gray-900'}`}>{g.title}</h3>
                        </div>
                        <button onClick={() => { setEditingGoal(g); setGoalForm({ title: g.title, description: g.description || '', deadline: g.deadline || '', progress: g.progress }); setGoalModal(true) }} className="text-gray-300 hover:text-gray-500">
                          <Edit2 size={14} />
                        </button>
                      </div>
                      {g.description && <p className="text-xs text-gray-500 mb-3 pl-7">{g.description}</p>}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-400 pl-7">
                          <span>Progression</span>
                          <span className="text-purple-600 font-medium">{g.progress}%</span>
                        </div>
                        <div className="pl-7 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-pink-400 to-purple-500 rounded-full" style={{ width: `${g.progress}%` }} />
                        </div>
                      </div>
                      {g.deadline && (
                        <p className="text-xs text-gray-400 mt-2 pl-7 flex items-center gap-1">
                          <Calendar size={10} /> Échéance : {new Date(g.deadline).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CHECK-IN */}
          {tab === 'checkin' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => setCheckinModal(true)}><Plus size={14} /> Nouveau check-in</Button>
              </div>
              {couple.checkins.slice(0, 5).map(c => (
                <Card key={c.id} className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Avatar src={c.user.avatar} name={c.user.name} size="sm" />
                      <span className="text-sm font-medium text-gray-700">{c.user.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-purple-600">{c.score}/10</span>
                      <span className="text-xs text-gray-400">{c.week}</span>
                    </div>
                  </div>
                  {c.feeling && <p className="text-sm text-gray-600 mb-1"><span className="font-medium text-gray-400">Ressenti :</span> {c.feeling}</p>}
                  {c.gratitude && <p className="text-sm text-gray-600"><span className="font-medium text-gray-400">Gratitude :</span> {c.gratitude}</p>}
                </Card>
              ))}
              {couple.checkins.length === 0 && (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <TrendingUp size={40} className="mx-auto text-gray-200 mb-3" />
                  <p className="text-gray-400">Aucun check-in cette semaine</p>
                </div>
              )}
            </div>
          )}

          {/* REFLECTIONS */}
          {tab === 'reflections' && (
            <div className="space-y-4">
              <Card className="p-5">
                <h2 className="font-bold text-gray-800 mb-4">Réflexion du jour</h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 font-medium block mb-1">Humeur ({reflectionForm.mood}/10)</label>
                    <input type="range" min={1} max={10} value={reflectionForm.mood} onChange={e => setReflectionForm(p => ({ ...p, mood: Number(e.target.value) }))} className="w-full accent-pink-500" />
                    <div className="flex justify-between text-xs text-gray-300 mt-0.5">
                      <span>😔</span><span>😐</span><span>😊</span><span>🤩</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium block mb-1">Gratitude du jour</label>
                    <input type="text" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" placeholder="Je suis reconnaissant(e) pour..." value={reflectionForm.gratitude} onChange={e => setReflectionForm(p => ({ ...p, gratitude: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium block mb-1">Note libre</label>
                    <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-200" rows={3} placeholder="Vos pensées du jour..." value={reflectionForm.note} onChange={e => setReflectionForm(p => ({ ...p, note: e.target.value }))} />
                  </div>
                  <Button onClick={handleAddReflection} className="w-full"><Sparkles size={14} /> Enregistrer</Button>
                </div>
              </Card>
              {couple.reflections.slice(0, 6).map(r => (
                <Card key={r.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar src={r.user.avatar} name={r.user.name} size="sm" />
                      <span className="text-sm font-medium text-gray-700">{r.user.name}</span>
                    </div>
                    <span className="text-lg">{r.mood >= 8 ? '🤩' : r.mood >= 6 ? '😊' : r.mood >= 4 ? '😐' : '😔'} {r.mood}/10</span>
                  </div>
                  {r.gratitude && <p className="text-sm text-gray-600 mb-1">✨ {r.gratitude}</p>}
                  {r.note && <p className="text-sm text-gray-500">{r.note}</p>}
                </Card>
              ))}
            </div>
          )}

          {/* ROADMAPS */}
          {tab === 'roadmaps' && (
            <CoupleRoadmapsTab
              coupleRoadmaps={coupleRoadmaps}
              availableRoadmaps={availableRoadmaps}
              userId={userId}
              roadmapPickerModal={roadmapPickerModal}
              setRoadmapPickerModal={setRoadmapPickerModal}
              roadmapCreateModal={roadmapCreateModal}
              setRoadmapCreateModal={setRoadmapCreateModal}
              pdfModal={pdfModal}
              setPdfModal={setPdfModal}
              pdfFile={pdfFile}
              setPdfFile={setPdfFile}
              pdfLoading={pdfLoading}
              pdfError={pdfError}
              pdfDragging={pdfDragging}
              setPdfDragging={setPdfDragging}
              createForm={createForm}
              setCreateForm={setCreateForm}
              onStart={handleStartCoupleRoadmap}
              onOpen={openRoadmap}
              onPdfSubmit={handlePdfSubmit}
              onCreateRoadmap={handleCreateRoadmap}
            />
          )}

          {/* ARCHIVES */}


        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      <Modal open={statusModal} onClose={() => setStatusModal(false)} title="Statut de la relation">
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(STATUS_LABELS).map(([key, info]) => (
            <button key={key} onClick={async () => { await updateRelationshipStatus(couple.id, key as any); setStatusModal(false); onRefresh() }}
              className={`p-4 rounded-2xl border-2 transition-all text-center ${couple.relationshipStatus === key ? 'border-pink-400 bg-pink-50' : 'border-gray-100 hover:border-pink-200'}`}>
              <span className="text-2xl block mb-1">{info.emoji}</span>
              <span className="text-sm font-medium text-gray-700">{info.label}</span>
            </button>
          ))}
        </div>
      </Modal>

      <Modal open={goalModal} onClose={() => { setGoalModal(false); setEditingGoal(null) }} title={editingGoal ? 'Modifier l\'objectif' : 'Nouvel objectif'}>
        <div className="space-y-4">
          <Input label="Titre" placeholder="Notre objectif" value={goalForm.title} onChange={e => setGoalForm(p => ({ ...p, title: e.target.value }))} />
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Description</label>
            <textarea className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-200" rows={2} value={goalForm.description} onChange={e => setGoalForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <Input label="Échéance" type="date" value={goalForm.deadline} onChange={e => setGoalForm(p => ({ ...p, deadline: e.target.value }))} />
          {editingGoal && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Progression ({goalForm.progress}%)</label>
              <input type="range" min={0} max={100} value={goalForm.progress} onChange={e => setGoalForm(p => ({ ...p, progress: Number(e.target.value) }))} className="w-full accent-pink-500" />
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setGoalModal(false)} className="flex-1">Annuler</Button>
            <Button onClick={handleAddGoal} disabled={!goalForm.title.trim()} className="flex-1">Enregistrer</Button>
          </div>
        </div>
      </Modal>

      <Modal open={checkinModal} onClose={() => setCheckinModal(false)} title="Check-in de la semaine">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Score global ({checkinForm.score}/10)</label>
            <input type="range" min={1} max={10} value={checkinForm.score} onChange={e => setCheckinForm(p => ({ ...p, score: Number(e.target.value) }))} className="w-full accent-pink-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Comment vous sentez-vous ensemble ?</label>
            <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-200" rows={2} value={checkinForm.feeling} onChange={e => setCheckinForm(p => ({ ...p, feeling: e.target.value }))} />
          </div>
          <Input label="Ce qu'on pourrait améliorer" value={checkinForm.improvement} onChange={e => setCheckinForm(p => ({ ...p, improvement: e.target.value }))} />
          <Input label="Gratitude" value={checkinForm.gratitude} onChange={e => setCheckinForm(p => ({ ...p, gratitude: e.target.value }))} />
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setCheckinModal(false)} className="flex-1">Annuler</Button>
            <Button onClick={handleAddCheckin} className="flex-1">Enregistrer</Button>
          </div>
        </div>
      </Modal>

      <Modal open={leaveModal} onClose={() => setLeaveModal(false)} title="Quitter l'espace couple">
        <div className="space-y-4">
          <div className="flex gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">Espace archivé, pas supprimé</p>
              <p className="text-sm text-red-600 mt-1">Votre espace sera archivé et {partner?.name} sera notifié(e). Vous pourrez y accéder dans les archives. Vous redeviendrez tous les deux célibataires.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setLeaveModal(false)} className="flex-1">Annuler</Button>
            <Button onClick={handleLeave} disabled={loading} className="flex-1 bg-red-500 hover:bg-red-600 text-white">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
              Quitter et archiver
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── Couple Roadmaps Tab ───────────────────────────────────────────────────────

function CoupleRoadmapsTab({
  coupleRoadmaps, availableRoadmaps, userId,
  roadmapPickerModal, setRoadmapPickerModal,
  roadmapCreateModal, setRoadmapCreateModal,
  pdfModal, setPdfModal, pdfFile, setPdfFile, pdfLoading, pdfError, pdfDragging, setPdfDragging,
  createForm, setCreateForm,
  onStart, onOpen, onPdfSubmit, onCreateRoadmap,
}: {
  coupleRoadmaps: CoupleRoadmapType[]
  availableRoadmaps: Roadmap[]
  userId: string
  roadmapPickerModal: boolean
  setRoadmapPickerModal: (v: boolean) => void
  roadmapCreateModal: boolean
  setRoadmapCreateModal: (v: boolean) => void
  pdfModal: boolean
  setPdfModal: (v: boolean) => void
  pdfFile: File | null
  setPdfFile: (f: File | null) => void
  pdfLoading: boolean
  pdfError: string
  pdfDragging: boolean
  setPdfDragging: (v: boolean) => void
  createForm: any
  setCreateForm: (f: any) => void
  onStart: (roadmapId: string) => void
  onOpen: (cr: CoupleRoadmapType) => void
  onPdfSubmit: () => void
  onCreateRoadmap: () => void
}) {
  const activeIds = new Set(coupleRoadmaps.map(cr => cr.roadmapId))

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setPdfDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file?.type === 'application/pdf') setPdfFile(file)
  }

  return (
    <div className="space-y-6">
      {/* Actions row */}
      <div className="flex flex-wrap gap-2 justify-end">
        <Button variant="secondary" size="sm" onClick={() => setPdfModal(true)}>
          <Upload size={14} /> PDF → Roadmap IA
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setRoadmapCreateModal(true)}>
          <PenLine size={14} /> Créer un roadmap
        </Button>
        <Button size="sm" onClick={() => setRoadmapPickerModal(true)}>
          <Plus size={14} /> Ajouter un parcours
        </Button>
      </div>

      {coupleRoadmaps.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-b from-pink-50 to-purple-50 rounded-2xl border border-pink-100">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center mx-auto mb-4">
            <Compass size={28} className="text-white" />
          </div>
          <p className="font-semibold text-gray-700">Aucun parcours commun</p>
          <p className="text-gray-400 text-sm mt-1 max-w-xs mx-auto">Explorez-vous ensemble à travers des roadmaps guidés — chacun répond, puis vous comparez vos visions</p>
          <Button className="mt-4" onClick={() => setRoadmapPickerModal(true)}><Compass size={14} /> Choisir un parcours</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coupleRoadmaps.map(cr => {
            const color = cr.roadmap.color || CATEGORY_COLORS[cr.roadmap.category] || 'from-pink-400 to-purple-500'
            const totalItems = cr.roadmap.sections.reduce((s, sec) => s + sec.items.filter(i => i.type !== 'EXPLANATION').length, 0)
            const myAnswers = cr.answers.filter(a => a.userId === userId).length
            const partnerAnswers = cr.answers.filter(a => a.userId !== userId).length
            const progress = totalItems > 0 ? Math.round((cr.answers.length / (totalItems * 2)) * 100) : 0

            return (
              <motion.div key={cr.id} whileHover={{ y: -2 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer" onClick={() => onOpen(cr)}>
                <div className={`h-1.5 bg-gradient-to-r ${color}`} />
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-2xl flex-shrink-0`}>{cr.roadmap.icon || '🗺️'}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm">{cr.roadmap.title}</h3>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full bg-gradient-to-r ${color} text-white`}>{CATEGORY_LABELS[cr.roadmap.category] || cr.roadmap.category}</span>
                    </div>
                    {cr.completedAt && <Trophy size={18} className="text-amber-500" />}
                  </div>
                  <div className="flex gap-2 mb-3">
                    {[{ label: 'Moi', v: myAnswers, c: 'pink' }, { label: 'Partner', v: partnerAnswers, c: 'purple' }, { label: 'Total', v: totalItems, c: 'gray' }].map(s => (
                      <div key={s.label} className={`flex-1 bg-${s.c}-50 rounded-lg p-2 text-center`}>
                        <p className={`text-base font-bold text-${s.c}-600`}>{s.v}</p>
                        <p className={`text-[10px] text-${s.c}-400`}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className={`h-full bg-gradient-to-r ${color} rounded-full`} />
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-400">Section {cr.currentSection + 1}/{cr.roadmap.sections.length}</span>
                    <span className="text-xs text-pink-500 font-medium flex items-center gap-1">Continuer <ArrowRight size={11} /></span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* PDF Modal */}
      <Modal open={pdfModal} onClose={() => { setPdfModal(false); setPdfFile(null) }} title="PDF → Roadmap IA">
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-700">
            Charge un PDF et l'IA va créer un roadmap couple structuré avec des exercices et questions à deux.
            <p className="text-xs text-blue-500 mt-1">Nécessite GEMINI_API_KEY configurée.</p>
          </div>
          <div
            onDragOver={e => { e.preventDefault(); setPdfDragging(true) }}
            onDragLeave={() => setPdfDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('pdf-couple-upload')?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${pdfDragging ? 'border-pink-400 bg-pink-50' : 'border-gray-200 hover:border-pink-300 hover:bg-pink-50'}`}
          >
            {pdfFile ? (
              <div className="flex items-center justify-center gap-2 text-pink-700">
                <BookOpen size={20} />
                <span className="font-medium text-sm">{pdfFile.name}</span>
              </div>
            ) : (
              <>
                <Upload size={32} className={`mx-auto mb-2 ${pdfDragging ? 'text-pink-400' : 'text-gray-300'}`} />
                <p className="text-sm text-gray-500">{pdfDragging ? 'Dépose ici !' : 'Clique ou glisse un PDF ici'}</p>
                <p className="text-xs text-gray-400 mt-1">Max 10 MB</p>
              </>
            )}
            <input id="pdf-couple-upload" type="file" accept=".pdf" className="hidden" onChange={e => setPdfFile(e.target.files?.[0] || null)} />
          </div>
          {pdfError && <p className="text-sm text-red-500">{pdfError}</p>}
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setPdfModal(false)} className="flex-1">Annuler</Button>
            <Button onClick={onPdfSubmit} disabled={!pdfFile || pdfLoading} className="flex-1">
              {pdfLoading ? <><Loader2 size={14} className="animate-spin" /> Génération...</> : <><Sparkles size={14} /> Générer</>}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Roadmap Modal */}
      <Modal open={roadmapCreateModal} onClose={() => setRoadmapCreateModal(false)} title="Créer notre roadmap">
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          <Input label="Titre" placeholder="Ex: Notre parcours spirituel" value={createForm.title} onChange={(e: any) => setCreateForm((p: any) => ({ ...p, title: e.target.value }))} />
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Description</label>
            <textarea className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-200" rows={2} value={createForm.description} onChange={(e: any) => setCreateForm((p: any) => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 block mb-1">Emoji</label>
              <input className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xl focus:outline-none" value={createForm.icon} onChange={(e: any) => setCreateForm((p: any) => ({ ...p, icon: e.target.value }))} />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 block mb-1">Couleur</label>
              <select className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none" value={createForm.color} onChange={(e: any) => setCreateForm((p: any) => ({ ...p, color: e.target.value }))}>
                <option value="from-pink-400 to-purple-500">Rose-Violet</option>
                <option value="from-rose-400 to-orange-400">Rose-Orange</option>
                <option value="from-emerald-400 to-teal-500">Vert</option>
                <option value="from-blue-400 to-indigo-500">Bleu</option>
                <option value="from-amber-400 to-orange-500">Ambre</option>
              </select>
            </div>
          </div>
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm text-gray-800">Sections</h3>
              <Button size="sm" variant="secondary" onClick={() => setCreateForm((p: any) => ({ ...p, sections: [...p.sections, { title: '', description: '', items: [{ type: 'QUESTION', title: '', content: '' }] }] }))}>
                <Plus size={12} /> Section
              </Button>
            </div>
            {createForm.sections.map((section: any, si: number) => (
              <div key={si} className="bg-gray-50 rounded-xl p-4 mb-3 border border-gray-100">
                <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm mb-3 focus:outline-none" placeholder={`Titre de la section ${si + 1}`} value={section.title} onChange={(e: any) => setCreateForm((p: any) => { const s = [...p.sections]; s[si] = { ...s[si], title: e.target.value }; return { ...p, sections: s } })} />
                {section.items.map((item: any, ii: number) => (
                  <div key={ii} className="bg-white rounded-lg p-3 border border-gray-100 mb-2">
                    <div className="flex gap-2 mb-2">
                      <select className="rounded-lg border border-gray-200 px-2 py-1 text-xs focus:outline-none" value={item.type} onChange={(e: any) => setCreateForm((p: any) => { const s = [...p.sections]; const items = [...s[si].items]; items[ii] = { ...items[ii], type: e.target.value }; s[si] = { ...s[si], items }; return { ...p, sections: s } })}>
                        <option value="EXPLANATION">Explication</option>
                        <option value="EXERCISE">Exercice</option>
                        <option value="QUESTION">Question</option>
                        <option value="REFLECTION">Réflexion</option>
                      </select>
                      <input className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-xs focus:outline-none" placeholder="Titre" value={item.title} onChange={(e: any) => setCreateForm((p: any) => { const s = [...p.sections]; const items = [...s[si].items]; items[ii] = { ...items[ii], title: e.target.value }; s[si] = { ...s[si], items }; return { ...p, sections: s } })} />
                    </div>
                    <textarea className="w-full rounded-lg border border-gray-200 px-2 py-1 text-xs resize-none focus:outline-none" rows={2} placeholder="Contenu..." value={item.content} onChange={(e: any) => setCreateForm((p: any) => { const s = [...p.sections]; const items = [...s[si].items]; items[ii] = { ...items[ii], content: e.target.value }; s[si] = { ...s[si], items }; return { ...p, sections: s } })} />
                  </div>
                ))}
                <Button size="sm" variant="ghost" className="w-full text-xs" onClick={() => setCreateForm((p: any) => { const s = [...p.sections]; s[si] = { ...s[si], items: [...s[si].items, { type: 'QUESTION', title: '', content: '' }] }; return { ...p, sections: s } })}>
                  <Plus size={11} /> Ajouter un item
                </Button>
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setRoadmapCreateModal(false)} className="flex-1">Annuler</Button>
            <Button onClick={onCreateRoadmap} disabled={!createForm.title.trim()} className="flex-1"><PenLine size={14} /> Créer</Button>
          </div>
        </div>
      </Modal>

      {/* Picker Modal */}
      <Modal open={roadmapPickerModal} onClose={() => setRoadmapPickerModal(false)} title="Choisir un parcours couple">
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {availableRoadmaps.map(r => {
            const isActive = activeIds.has(r.id)
            const color = r.color || CATEGORY_COLORS[r.category] || 'from-pink-400 to-purple-500'
            return (
              <div key={r.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isActive ? 'border-purple-200 bg-purple-50' : 'border-gray-100 hover:border-pink-200 hover:bg-pink-50 cursor-pointer'}`}
                onClick={() => { if (!isActive) { onStart(r.id); setRoadmapPickerModal(false) } }}>
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-lg flex-shrink-0`}>{r.icon || '🗺️'}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900">{r.title}</p>
                  <p className="text-xs text-gray-400">{CATEGORY_LABELS[r.category] || r.category} · {r.sections.length} sections</p>
                </div>
                {isActive ? <CheckCircle2 size={16} className="text-purple-500 flex-shrink-0" /> : <Plus size={16} className="text-gray-300 flex-shrink-0" />}
              </div>
            )
          })}
        </div>
      </Modal>
    </div>
  )
}

// ─── Couple Roadmap Viewer ─────────────────────────────────────────────────────

function CoupleRoadmapViewer({ cr, userId, partnerName, answers, setAnswers, savingItem, onSaveAnswer, onSectionChange, onComplete, onClose }: {
  cr: CoupleRoadmapType; userId: string; partnerName: string
  answers: Record<string, string>; setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>
  savingItem: string | null
  onSaveAnswer: (id: string, itemId: string) => void
  onSectionChange: (id: string, idx: number) => void
  onComplete: (id: string) => void
  onClose: () => void
}) {
  const roadmap = cr.roadmap
  const sections = roadmap.sections
  const section = sections[cr.currentSection]
  const color = roadmap.color || CATEGORY_COLORS[roadmap.category] || 'from-pink-400 to-purple-500'
  const interactiveItems = section?.items.filter(i => i.type !== 'EXPLANATION') || []
  const [itemIdx, setItemIdx] = useState(0)
  const [aiSummary, setAiSummary] = useState<any>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [showSummary, setShowSummary] = useState(false)

  const totalInteractive = sections.reduce((s, sec) => s + sec.items.filter(i => i.type !== 'EXPLANATION').length, 0)
  const totalAnswers = cr.answers.length
  const progress = totalInteractive > 0 ? Math.round((totalAnswers / (totalInteractive * 2)) * 100) : 0
  const isLastSection = cr.currentSection === sections.length - 1

  const handleGetSummary = async () => {
    setLoadingSummary(true)
    const answersFormatted = cr.answers.map(a => {
      const item = sections.flatMap(s => s.items).find(i => i.id === a.itemId)
      return { question: item?.title || '', answer: a.content, author: a.user?.name || '' }
    })
    try {
      const res = await fetch('/api/roadmap-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answersFormatted, roadmapTitle: roadmap.title, isCouple: true }),
      })
      const data = await res.json()
      if (data.success) { setAiSummary(data.summary); setShowSummary(true) }
    } catch { }
    setLoadingSummary(false)
  }

  if (showSummary && aiSummary) {
    return (
      <div className="space-y-6">
        <button onClick={() => setShowSummary(false)} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm">
          <ChevronLeft size={16} /> Retour au roadmap
        </button>
        <div className={`rounded-2xl bg-gradient-to-r ${color} p-6 text-white`}>
          <Sparkles size={24} className="mb-2" />
          <h2 className="text-xl font-bold">{aiSummary.title}</h2>
          <p className="text-white/80 text-sm mt-1">Résumé IA de votre parcours commun</p>
        </div>
        <Card className="p-5">
          <h3 className="font-bold text-gray-800 mb-2">Synthèse</h3>
          <p className="text-gray-600 text-sm leading-relaxed">{aiSummary.synthesis}</p>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5">
            <h3 className="font-bold text-emerald-700 mb-3 flex items-center gap-2"><CheckCircle2 size={16} /> Vos forces</h3>
            <ul className="space-y-2">{aiSummary.strengths?.map((s: string, i: number) => <li key={i} className="flex items-start gap-2 text-sm text-gray-700"><span className="text-emerald-400 mt-0.5">✓</span>{s}</li>)}</ul>
          </Card>
          <Card className="p-5">
            <h3 className="font-bold text-amber-700 mb-3 flex items-center gap-2"><ArrowRight size={16} /> Axes de croissance</h3>
            <ul className="space-y-2">{aiSummary.growthAreas?.map((s: string, i: number) => <li key={i} className="flex items-start gap-2 text-sm text-gray-700"><span className="text-amber-400 mt-0.5">→</span>{s}</li>)}</ul>
          </Card>
        </div>
        <Card className="p-5">
          <h3 className="font-bold text-purple-700 mb-3 flex items-center gap-2"><Star size={16} /> Recommandations</h3>
          <ul className="space-y-2">{aiSummary.recommendations?.map((s: string, i: number) => <li key={i} className="flex items-start gap-2 text-sm text-gray-700"><span className="text-purple-400 font-bold">{i + 1}.</span>{s}</li>)}</ul>
        </Card>
        {aiSummary.coupleMessage && (
          <div className={`bg-gradient-to-r ${color} rounded-2xl p-5 text-white text-center`}>
            <Heart size={20} className="mx-auto mb-2" />
            <p className="text-sm font-medium italic">"{aiSummary.coupleMessage}"</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className={`rounded-2xl bg-gradient-to-r ${color} p-5 text-white relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10">
          <button onClick={onClose} className="flex items-center gap-1 text-white/70 hover:text-white text-sm mb-3 transition-colors">
            <ChevronLeft size={16} /> Retour
          </button>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{roadmap.icon || '🗺️'}</span>
            <div>
              <h1 className="font-bold text-lg">{roadmap.title}</h1>
              <p className="text-white/70 text-xs">Parcours à deux · {progress}% complété</p>
            </div>
          </div>
          <div className="mt-3 h-1.5 bg-white/30 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-white rounded-full" />
          </div>
        </div>
      </div>

      {/* Section pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {sections.map((s, idx) => (
          <button key={s.id} onClick={() => { onSectionChange(cr.id, idx); setItemIdx(0) }}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${idx === cr.currentSection ? `bg-gradient-to-r ${color} text-white` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {idx + 1}. {s.title}
          </button>
        ))}
      </div>

      {section && (
        <AnimatePresence mode="wait">
          <motion.div key={cr.currentSection} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="text-lg font-bold text-gray-900 mb-1">{section.title}</h2>
            {section.description && <p className="text-gray-500 text-sm mb-4">{section.description}</p>}

            {/* Explanations first */}
            {section.items.filter(i => i.type === 'EXPLANATION').map(item => {
              const config = ITEM_TYPE_CONFIG.EXPLANATION
              return (
                <div key={item.id} className={`rounded-2xl border ${config.border} ${config.bg} mb-4`}>
                  <div className={`flex items-center gap-2 px-4 py-2 border-b ${config.border}`}>
                    <BookOpen size={13} className={config.text} />
                    <span className={`text-xs font-bold uppercase ${config.text}`}>Explication</span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-sm text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{item.content}</p>
                  </div>
                </div>
              )
            })}

            {/* One by one interactive items */}
            {interactiveItems.length > 0 && (
              <div>
                {/* Progress dots */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex gap-1.5">
                    {interactiveItems.map((_, i) => (
                      <button key={i} onClick={() => setItemIdx(i)}
                        className={`h-2 rounded-full transition-all ${i === itemIdx ? `w-6 bg-gradient-to-r ${color}` : i < itemIdx ? 'w-2 bg-gray-300' : 'w-2 bg-gray-200'}`} />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">{itemIdx + 1} / {interactiveItems.length}</span>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div key={itemIdx} initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} transition={{ duration: 0.2 }}>
                    {(() => {
                      const item = interactiveItems[itemIdx]
                      const config = ITEM_TYPE_CONFIG[item.type] || ITEM_TYPE_CONFIG.QUESTION
                      const ItemIcon = config.icon
                      const myAnswer = cr.answers.find(a => a.itemId === item.id && a.userId === userId)
                      const partnerAnswer = cr.answers.find(a => a.itemId === item.id && a.userId !== userId)
                      const currentVal = answers[item.id + '_' + userId] ?? myAnswer?.content ?? ''

                      return (
                        <div className={`rounded-2xl border ${config.border} ${config.bg} overflow-hidden`}>
                          <div className={`flex items-center gap-2 px-4 py-2.5 border-b ${config.border}`}>
                            <ItemIcon size={13} className={config.text} />
                            <span className={`text-xs font-bold uppercase ${config.text}`}>{config.label}</span>
                            {myAnswer && <CheckCircle2 size={12} className="ml-auto text-emerald-500" />}
                          </div>
                          <div className="p-5">
                            <h3 className="font-bold text-sm text-gray-900 mb-2">{item.title}</h3>
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-4">{item.content}</p>

                            <div className="space-y-3 pt-3 border-t border-current border-opacity-20">
                              <div>
                                <label className="text-xs font-bold text-pink-500 flex items-center gap-1 mb-1.5">
                                  <Heart size={10} /> Ma réponse
                                  {myAnswer && <CheckCircle2 size={11} className="text-emerald-500 ml-1" />}
                                </label>
                                <textarea
                                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-200 min-h-[80px]"
                                  placeholder="Écris ta réponse..."
                                  value={currentVal}
                                  onChange={e => setAnswers(p => ({ ...p, [item.id + '_' + userId]: e.target.value }))}
                                />
                                <div className="flex justify-end mt-1.5">
                                  <Button size="sm" onClick={() => onSaveAnswer(cr.id, item.id)} disabled={!currentVal.trim() || savingItem === item.id}>
                                    {savingItem === item.id ? <Loader2 size={12} className="animate-spin" /> : myAnswer ? <><CheckCircle2 size={12} /> Mis à jour</> : <><Star size={12} /> Sauvegarder</>}
                                  </Button>
                                </div>
                              </div>
                              {partnerAnswer ? (
                                <div className="bg-purple-50 border border-purple-100 rounded-xl p-3">
                                  <p className="text-xs font-bold text-purple-500 mb-1">{partnerAnswer.user?.name || 'Partenaire'}</p>
                                  <p className="text-sm text-gray-700">{partnerAnswer.content}</p>
                                </div>
                              ) : (
                                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                                  <p className="text-xs text-gray-400"><Users size={11} className="inline mr-1" />{partnerName} n'a pas encore répondu</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </motion.div>
                </AnimatePresence>

                {/* Item navigation */}
                <div className="flex justify-between mt-4">
                  <Button variant="secondary" size="sm" disabled={itemIdx === 0} onClick={() => setItemIdx(i => i - 1)}>
                    <ChevronLeft size={14} /> Précédent
                  </Button>
                  {itemIdx < interactiveItems.length - 1 ? (
                    <Button size="sm" onClick={() => setItemIdx(i => i + 1)}>
                      Suivant <ChevronRight size={14} />
                    </Button>
                  ) : null}
                </div>
              </div>
            )}

            {/* Section navigation */}
            <div className="flex justify-between items-center mt-6">
              <Button variant="secondary" disabled={cr.currentSection === 0} onClick={() => { onSectionChange(cr.id, cr.currentSection - 1); setItemIdx(0) }}>
                <ChevronLeft size={16} /> Section préc.
              </Button>
              {isLastSection ? (
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={handleGetSummary} disabled={loadingSummary}>
                    {loadingSummary ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    Résumé IA
                  </Button>
                  <Button onClick={() => onComplete(cr.id)} className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
                    <Trophy size={14} /> Terminer
                  </Button>
                </div>
              ) : (
                <Button onClick={() => { onSectionChange(cr.id, cr.currentSection + 1); setItemIdx(0) }}>
                  Section suiv. <ArrowRight size={16} />
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}
