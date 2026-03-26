'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Compass, Plus, ChevronRight, ChevronDown, ChevronLeft,
  BookOpen, Lightbulb, HelpCircle, Sparkles, CheckCircle2,
  Lock, X, Upload, Loader2, PenLine, Layers, Star,
  ArrowRight, Trophy, Target, Search, ChevronUp, CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { FadeIn, StaggerChildren, StaggerItem } from '@/components/animations/transitions'
import { startRoadmap, saveRoadmapAnswer, updateRoadmapSection, completeRoadmap, createCustomRoadmap } from '@/actions/discovery'

type RoadmapItem = {
  id: string
  type: string
  title: string
  content: string
  order: number
}

type RoadmapSection = {
  id: string
  title: string
  description: string | null
  order: number
  items: RoadmapItem[]
}

type Roadmap = {
  id: string
  title: string
  description: string | null
  category: string
  icon: string | null
  color: string | null
  isPublic: boolean
  sections: RoadmapSection[]
}

type UserRoadmapAnswer = {
  id: string
  itemId: string
  content: string
}

type ActiveRoadmap = {
  id: string
  roadmapId: string
  currentSection: number
  completedAt: Date | null
  roadmap: Roadmap
  answers: UserRoadmapAnswer[]
}

const CATEGORY_LABELS: Record<string, string> = {
  IKIGAI: 'Ikigai',
  CHRISTIAN: 'Parcours chrétien',
  SCIENTIFIC: 'Basé sur la science',
  CUSTOM: 'Personnalisé',
}

const CATEGORY_COLORS: Record<string, string> = {
  IKIGAI: 'from-rose-400 to-orange-400',
  CHRISTIAN: 'from-amber-400 to-yellow-300',
  SCIENTIFIC: 'from-emerald-400 to-cyan-500',
  CUSTOM: 'from-violet-400 to-purple-500',
}

const ITEM_TYPE_CONFIG: Record<string, { icon: typeof BookOpen; label: string; bg: string; text: string; border: string }> = {
  EXPLANATION: { icon: BookOpen, label: 'Explication', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  EXERCISE: { icon: Target, label: 'Exercice', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  QUESTION: { icon: HelpCircle, label: 'Question', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  REFLECTION: { icon: Sparkles, label: 'Réflexion', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
}

export function DiscoveryPageClient({
  publicRoadmaps,
  userRoadmaps,
  activeRoadmaps,
  userId,
}: {
  publicRoadmaps: Roadmap[]
  userRoadmaps: Roadmap[]
  activeRoadmaps: ActiveRoadmap[]
  userId: string
}) {

  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [tab, setTab] = useState<'explorer' | 'mes-roadmaps' | 'creer'>('explorer')
  const [activeRoadmap, setActiveRoadmap] = useState<ActiveRoadmap | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [savingItem, setSavingItem] = useState<string | null>(null)
  const [pdfModal, setPdfModal] = useState(false)
  const [createModal, setCreateModal] = useState(false)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState('')
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    icon: '🗺️',
    color: 'from-violet-400 to-purple-500',
    sections: [
      {
        title: '',
        description: '',
        items: [{ type: 'QUESTION', title: '', content: '' }],
      },
    ],
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [pdfPreview, setPdfPreview] = useState<any>(null)

  const allRoadmaps = [...publicRoadmaps, ...userRoadmaps]
  const activeRoadmapIds = new Set(activeRoadmaps.map(a => a.roadmapId))

  const filteredRoadmaps = allRoadmaps.filter(r =>
    !searchQuery ||
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    CATEGORY_LABELS[r.category]?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const openRoadmap = (roadmapId: string) => {
    const existing = activeRoadmaps.find(a => a.roadmapId === roadmapId)
    if (existing) {
      const preloaded: Record<string, string> = {}
      existing.answers.forEach(a => { preloaded[a.itemId] = a.content })
      setAnswers(preloaded)
      setActiveRoadmap(existing)
    }
  }

  const handleStartRoadmap = async (roadmapId: string) => {
    const res = await startRoadmap(roadmapId)
    if (res.success) {
      startTransition(() => { router.refresh() })
      setTimeout(() => {
        const fresh = activeRoadmaps.find(a => a.roadmapId === roadmapId)
        if (fresh) openRoadmap(roadmapId)
        else router.refresh()
      }, 300)
    }
  }

  const handleSaveAnswer = async (userRoadmapId: string, itemId: string) => {
    const content = answers[itemId]
    if (!content?.trim()) return
    setSavingItem(itemId)
    await saveRoadmapAnswer(userRoadmapId, itemId, content)
    setSavingItem(null)
  }

  const handleSectionChange = async (userRoadmapId: string, sectionIndex: number) => {
    await updateRoadmapSection(userRoadmapId, sectionIndex)
    if (activeRoadmap) {
      setActiveRoadmap({ ...activeRoadmap, currentSection: sectionIndex })
    }
  }

  const handleComplete = async (userRoadmapId: string) => {
    await completeRoadmap(userRoadmapId)
    startTransition(() => { router.refresh() })
    setActiveRoadmap(null)
  }

  const handlePdfSubmit = async () => {
    if (!pdfFile) return
    setPdfLoading(true)
    setPdfError('')
    try {
      const formData = new FormData()
      formData.append('file', pdfFile)
      console.log("g")
      const res = await fetch('/api/roadmap-from-pdf', { method: 'POST', body: formData })

      const data = await res.json()
      console.log(data.plan)
      if (!data.success) { setPdfError(data.error || 'Erreur inconnue'); return }
      setPdfPreview(data.plan)
      setPdfModal(false)
      setPdfFile(null)
    } catch {
      setPdfError('Erreur lors du traitement du PDF')
    } finally {
      setPdfLoading(false)
    }
  }

  const handleCreateRoadmap = async () => {
    if (!createForm.title.trim()) return
    const filtered = {
      ...createForm,
      sections: createForm.sections
        .filter(s => s.title.trim())
        .map(s => ({
          ...s,
          items: s.items.filter(i => i.title.trim() && i.content.trim()),
        })),
    }
    const res = await createCustomRoadmap(filtered)
    if (res.success) {
      setCreateModal(false)
      setCreateForm({
        title: '', description: '', icon: '🗺️', color: 'from-violet-400 to-purple-500',
        sections: [{ title: '', description: '', items: [{ type: 'QUESTION', title: '', content: '' }] }],
      })
      startTransition(() => router.refresh())
    }
  }

  if (activeRoadmap) {
    return (
      <RoadmapViewer
        activeRoadmap={activeRoadmap}
        answers={answers}
        setAnswers={setAnswers}
        savingItem={savingItem}
        onSaveAnswer={handleSaveAnswer}
        onSectionChange={handleSectionChange}
        onComplete={handleComplete}
        onClose={() => setActiveRoadmap(null)}
      />
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      <FadeIn>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Compass size={22} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Découverte de soi</h1>
            </div>
            <p className="text-gray-500 text-sm ml-13 pl-1">Explore qui tu es vraiment à travers des parcours guidés</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="secondary" size="sm" onClick={() => setPdfModal(true)}>
              <Upload size={14} />
              PDF → Roadmap IA
            </Button>
            <Button size="sm" onClick={() => setCreateModal(true)}>
              <Plus size={14} />
              Créer un roadmap
            </Button>
          </div>
        </div>
      </FadeIn>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        {[
          { id: 'explorer', label: 'Explorer', icon: Compass },
          { id: 'mes-roadmaps', label: `Mes parcours (${activeRoadmaps.length})`, icon: Layers },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'explorer' && (
        <div className="space-y-8">
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
              placeholder="Rechercher un roadmap par titre ou thème..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          {([''] as const).map(cat => {
            const roadmapsInCat = filteredRoadmaps
            
            if (roadmapsInCat.length === 0) return (
              <div key={cat} className="text-center py-12">
                <Search size={40} className="mx-auto text-gray-200 mb-3" />
                <p className="text-gray-400 text-sm">Aucun roadmap trouvé pour "{searchQuery}"</p>
              </div>
            )
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg font-bold text-gray-900">{CATEGORY_LABELS[cat]}</span>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{roadmapsInCat.length} parcours</span>
                </div>
                <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {roadmapsInCat.map(roadmap => (
                    <StaggerItem key={roadmap.id}>
                      <RoadmapCard
                        roadmap={roadmap}
                        isActive={activeRoadmapIds.has(roadmap.id)}
                        activeData={activeRoadmaps.find(a => a.roadmapId === roadmap.id)}
                        onStart={() => handleStartRoadmap(roadmap.id)}
                        onOpen={() => openRoadmap(roadmap.id)}
                      />
                    </StaggerItem>
                  ))}
                </StaggerChildren>
              </div>
            )
          })}

          {userRoadmaps.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg font-bold text-gray-900">Mes roadmaps personnels</span>
              </div>
              <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userRoadmaps.map(roadmap => (
                  <StaggerItem key={roadmap.id}>
                    <RoadmapCard
                      roadmap={roadmap}
                      isActive={activeRoadmapIds.has(roadmap.id)}
                      activeData={activeRoadmaps.find(a => a.roadmapId === roadmap.id)}
                      onStart={() => handleStartRoadmap(roadmap.id)}
                      onOpen={() => openRoadmap(roadmap.id)}
                    />
                  </StaggerItem>
                ))}
              </StaggerChildren>
            </div>
          )}
        </div>
      )}

      {tab === 'mes-roadmaps' && (
        <div>
          {activeRoadmaps.length === 0 ? (
            <div className="text-center py-16">
              <Compass size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-500 font-medium">Tu n'as pas encore commencé de parcours</p>
              <p className="text-gray-400 text-sm mt-1">Explore les roadmaps disponibles et commence ton voyage</p>
              <Button className="mt-4" onClick={() => setTab('explorer')}>Explorer les parcours</Button>
            </div>
          ) : (
            <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeRoadmaps.map(ar => {
                const totalItems = ar.roadmap.sections.reduce((s, sec) => s + sec.items.filter(i => i.type === 'QUESTION' || i.type === 'REFLECTION' || i.type === 'EXERCISE').length, 0)
                const answeredItems = ar.answers.length
                const progress = totalItems > 0 ? Math.round((answeredItems / totalItems) * 100) : 0
                return (
                  <StaggerItem key={ar.id}>
                    <motion.div
                      whileHover={{ y: -2 }}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer"
                      onClick={() => openRoadmap(ar.roadmapId)}
                    >
                      <div className={`h-2 bg-gradient-to-r ${ar.roadmap.color || CATEGORY_COLORS[ar.roadmap.category]}`} />
                      <div className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <span className="text-3xl">{ar.roadmap.icon || '🗺️'}</span>
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 text-sm leading-tight">{ar.roadmap.title}</h3>
                            <p className="text-xs text-gray-400 mt-0.5">{CATEGORY_LABELS[ar.roadmap.category]}</p>
                          </div>
                          {ar.completedAt && <Trophy size={18} className="text-amber-500 flex-shrink-0" />}
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>{answeredItems}/{totalItems} réponses</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              className={`h-full rounded-full bg-gradient-to-r ${ar.roadmap.color || CATEGORY_COLORS[ar.roadmap.category]}`}
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-gray-400">
                            Section {ar.currentSection + 1}/{ar.roadmap.sections.length}
                          </span>
                          <span className="text-xs text-purple-600 font-medium flex items-center gap-1">
                            Continuer <ArrowRight size={12} />
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </StaggerItem>
                )
              })}
            </StaggerChildren>
          )}
        </div>
      )}

      <Modal open={!!pdfPreview} onClose={() => setPdfPreview(null)} title="Aperçu du roadmap généré">
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-4 text-white">
            <span className="text-3xl">{pdfPreview?.icon || '📄'}</span>
            <h3 className="font-bold text-lg mt-1">{pdfPreview?.title}</h3>
            <p className="text-white/80 text-sm mt-1">{pdfPreview?.description}</p>
          </div>
          {pdfPreview?.sections?.map((s: any, i: number) => (
            <CollapsibleSection key={i} title={`${i + 1}. ${s.title}`} items={s.items} />
          ))}
        </div>
        <div className="flex gap-3 mt-4">
          <Button variant="ghost" onClick={() => setPdfPreview(null)} className="flex-1">Annuler</Button>
          <Button onClick={async () => {
            const res = await createCustomRoadmap(pdfPreview)
            if (res.success) { setPdfPreview(null); startTransition(() => router.refresh()) }
          }} className="flex-1">
            <CheckCircle size={14} /> Créer ce roadmap
          </Button>
        </div>
      </Modal>

      <Modal open={pdfModal} onClose={() => setPdfModal(false)} title="Créer un roadmap depuis un PDF">
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
            <p className="font-medium mb-1">Comment ça fonctionne ?</p>
            <p>Charge un PDF (livre, article, notes...) et l'IA va créer automatiquement un roadmap de découverte de soi structuré avec des exercices et des questions.</p>
            <p className="mt-2 text-xs text-blue-500">Nécessite une clé API Gemini configurée dans les variables d'environnement (GEMINI_API_KEY).</p>
          </div>
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors"
            onClick={() => document.getElementById('pdf-upload')?.click()}
          >
            {pdfFile ? (
              <div className="flex items-center justify-center gap-2 text-purple-700">
                <BookOpen size={20} />
                <span className="font-medium text-sm">{pdfFile.name}</span>
              </div>
            ) : (
              <>
                <Upload size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">Clique pour choisir un PDF</p>
                <p className="text-xs text-gray-400 mt-1">Max 10 MB</p>
              </>
            )}
            <input
              id="pdf-upload"
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={e => setPdfFile(e.target.files?.[0] || null)}
            />
          </div>
          {pdfError && <p className="text-sm text-red-500">{pdfError}</p>}
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setPdfModal(false)} className="flex-1">Annuler</Button>
            <Button onClick={handlePdfSubmit} disabled={!pdfFile || pdfLoading} className="flex-1">
              {pdfLoading ? <><Loader2 size={14} className="animate-spin" /> Génération...</> : <><Sparkles size={14} /> Générer le roadmap</>}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Créer mon roadmap personnalisé">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <Input
            label="Titre du roadmap"
            placeholder="Ex: Mon chemin vers la confiance en soi"
            value={createForm.title}
            onChange={e => setCreateForm(p => ({ ...p, title: e.target.value }))}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-200"
              rows={2}
              placeholder="De quoi parle ce parcours ?"
              value={createForm.description}
              onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))}
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 block mb-1">Emoji icône</label>
              <input
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-2xl focus:outline-none focus:ring-2 focus:ring-purple-200"
                value={createForm.icon}
                onChange={e => setCreateForm(p => ({ ...p, icon: e.target.value }))}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 block mb-1">Couleur</label>
              <select
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                value={createForm.color}
                onChange={e => setCreateForm(p => ({ ...p, color: e.target.value }))}
              >
                <option value="from-violet-400 to-purple-500">Violet</option>
                <option value="from-rose-400 to-pink-500">Rose</option>
                <option value="from-emerald-400 to-teal-500">Vert</option>
                <option value="from-blue-400 to-indigo-500">Bleu</option>
                <option value="from-amber-400 to-orange-500">Orange</option>
              </select>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 text-sm">Sections</h3>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setCreateForm(p => ({
                  ...p,
                  sections: [...p.sections, { title: '', description: '', items: [{ type: 'QUESTION', title: '', content: '' }] }],
                }))}
              >
                <Plus size={12} /> Section
              </Button>
            </div>
            {createForm.sections.map((section, si) => (
              <div key={si} className="bg-gray-50 rounded-xl p-4 mb-3 border border-gray-100">
                <Input
                  label={`Section ${si + 1}`}
                  placeholder="Titre de la section"
                  value={section.title}
                  onChange={e => setCreateForm(p => {
                    const sections = [...p.sections]
                    sections[si] = { ...sections[si], title: e.target.value }
                    return { ...p, sections }
                  })}
                />
                <div className="mt-3 space-y-2">
                  {section.items.map((item, ii) => (
                    <div key={ii} className="bg-white rounded-lg p-3 border border-gray-100">
                      <div className="flex gap-2 mb-2">
                        <select
                          className="rounded-lg border border-gray-200 px-2 py-1 text-xs focus:outline-none"
                          value={item.type}
                          onChange={e => setCreateForm(p => {
                            const sections = [...p.sections]
                            const items = [...sections[si].items]
                            items[ii] = { ...items[ii], type: e.target.value }
                            sections[si] = { ...sections[si], items }
                            return { ...p, sections }
                          })}
                        >
                          <option value="EXPLANATION">Explication</option>
                          <option value="EXERCISE">Exercice</option>
                          <option value="QUESTION">Question</option>
                          <option value="REFLECTION">Réflexion</option>
                        </select>
                        <input
                          className="flex-1 rounded-lg border border-gray-200 px-3 py-1 text-xs focus:outline-none"
                          placeholder="Titre"
                          value={item.title}
                          onChange={e => setCreateForm(p => {
                            const sections = [...p.sections]
                            const items = [...sections[si].items]
                            items[ii] = { ...items[ii], title: e.target.value }
                            sections[si] = { ...sections[si], items }
                            return { ...p, sections }
                          })}
                        />
                      </div>
                      <textarea
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs resize-none focus:outline-none"
                        rows={2}
                        placeholder="Contenu..."
                        value={item.content}
                        onChange={e => setCreateForm(p => {
                          const sections = [...p.sections]
                          const items = [...sections[si].items]
                          items[ii] = { ...items[ii], content: e.target.value }
                          sections[si] = { ...sections[si], items }
                          return { ...p, sections }
                        })}
                      />
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full text-xs"
                    onClick={() => setCreateForm(p => {
                      const sections = [...p.sections]
                      sections[si] = { ...sections[si], items: [...sections[si].items, { type: 'QUESTION', title: '', content: '' }] }
                      return { ...p, sections }
                    })}
                  >
                    <Plus size={11} /> Ajouter un item
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setCreateModal(false)} className="flex-1">Annuler</Button>
            <Button onClick={handleCreateRoadmap} disabled={!createForm.title.trim()} className="flex-1">
              <PenLine size={14} /> Créer le roadmap
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function CollapsibleSection({ title, items }: { title: string; items: any[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(v => !v)} className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
        {title}
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-2">
          {items?.map((item: any, j: number) => (
            <div key={j} className="text-xs bg-gray-50 rounded-lg px-3 py-2">
              <span className="font-medium text-gray-600">{item.type}: </span>
              <span className="text-gray-500">{item.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function RoadmapCard({
  roadmap, isActive, activeData, onStart, onOpen,
}: {
  roadmap: Roadmap
  isActive: boolean
  activeData?: ActiveRoadmap
  onStart: () => void
  onOpen: () => void
}) {
  const totalItems = roadmap.sections.reduce((s, sec) => s + sec.items.filter(i => i.type !== 'EXPLANATION').length, 0)
  const answeredItems = activeData?.answers.length || 0
  const progress = totalItems > 0 && activeData ? Math.round((answeredItems / totalItems) * 100) : 0
  const color = roadmap.color || CATEGORY_COLORS[roadmap.category] || 'from-purple-400 to-indigo-500'

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
    >
      <div className={`h-1.5 bg-gradient-to-r ${color}`} />
      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-2xl flex-shrink-0`}>
            {roadmap.icon || '🗺️'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-sm leading-tight">{roadmap.title}</h3>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full mt-1 inline-block bg-gradient-to-r ${color} text-white`}>
              {CATEGORY_LABELS[roadmap.category]}
            </span>
          </div>
        </div>
        {roadmap.description && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{roadmap.description}</p>
        )}
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
          <span className="flex items-center gap-1">
            <Layers size={11} />
            {roadmap.sections.length} sections
          </span>
          <span className="flex items-center gap-1">
            <HelpCircle size={11} />
            {totalItems} exercices
          </span>
        </div>

        {isActive && activeData ? (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>{answeredItems}/{totalItems} complétés</span>
              <span className="font-medium text-purple-600">{progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={`h-full rounded-full bg-gradient-to-r ${color}`}
              />
            </div>
            <Button className="w-full mt-2" size="sm" onClick={onOpen}>
              <ArrowRight size={14} />
              Continuer le parcours
            </Button>
          </div>
        ) : (
          <Button className="w-full" size="sm" onClick={onStart}>
            <Compass size={14} />
            Commencer
          </Button>
        )}
      </div>
    </motion.div>
  )
}

function RoadmapViewer({
  activeRoadmap, answers, setAnswers, savingItem, onSaveAnswer, onSectionChange, onComplete, onClose,
}: {
  activeRoadmap: ActiveRoadmap
  answers: Record<string, string>
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>
  savingItem: string | null
  onSaveAnswer: (userRoadmapId: string, itemId: string) => void
  onSectionChange: (userRoadmapId: string, index: number) => void
  onComplete: (userRoadmapId: string) => void
  onClose: () => void
}) {
  const roadmap = activeRoadmap.roadmap
  const sections = roadmap.sections
  const currentIdx = activeRoadmap.currentSection
  const currentSection = sections[currentIdx]
  const color = roadmap.color || CATEGORY_COLORS[roadmap.category] || 'from-purple-400 to-indigo-500'

  const totalInteractiveItems = sections.reduce((s, sec) => s + sec.items.filter(i => i.type !== 'EXPLANATION').length, 0)
  const answeredCount = activeRoadmap.answers.length
  const overallProgress = totalInteractiveItems > 0 ? Math.round((answeredCount / totalInteractiveItems) * 100) : 0

  return (
    <div className="max-w-3xl mx-auto w-full">
      <FadeIn>
        <div className={`rounded-2xl bg-gradient-to-r ${color} p-6 mb-6 text-white relative overflow-hidden`}>
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10">
            <button onClick={onClose} className="flex items-center gap-1 text-white/80 hover:text-white text-sm mb-4 transition-colors">
              <ChevronLeft size={16} /> Retour aux roadmaps
            </button>
            <div className="flex items-start gap-3">
              <span className="text-4xl">{roadmap.icon || '🗺️'}</span>
              <div>
                <h1 className="text-xl font-bold leading-tight">{roadmap.title}</h1>
                <p className="text-white/80 text-sm mt-1">{roadmap.description}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-white/80 text-xs mb-1.5">
                <span>{answeredCount}/{totalInteractiveItems} réponses</span>
                <span>{overallProgress}%</span>
              </div>
              <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${overallProgress}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full bg-white rounded-full"
                />
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {sections.map((section, idx) => {
          const isDone = sections.slice(0, idx).every(s =>
            s.items.filter(i => i.type !== 'EXPLANATION').every(item => activeRoadmap.answers.some(a => a.itemId === item.id))
          )
          const isCurrent = idx === currentIdx
          const isAccessible = idx <= currentIdx || isDone
          return (
            <button
              key={section.id}
              onClick={() => isAccessible && onSectionChange(activeRoadmap.id, idx)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                isCurrent
                  ? `bg-gradient-to-r ${color} text-white shadow-md`
                  : isAccessible
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-gray-50 text-gray-300 cursor-not-allowed'
              }`}
            >
              {isDone && !isCurrent ? <CheckCircle2 size={12} /> : <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">{idx + 1}</span>}
              <span className="max-w-24 truncate">{section.title}</span>
            </button>
          )
        })}
      </div>

      {currentSection && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">{currentSection.title}</h2>
              {currentSection.description && <p className="text-gray-500 text-sm mt-1">{currentSection.description}</p>}
            </div>

            <div className="space-y-4">
              {currentSection.items.map((item, itemIdx) => {
                const config = ITEM_TYPE_CONFIG[item.type] || ITEM_TYPE_CONFIG.QUESTION
                const Icon = config.icon
                const isInteractive = item.type !== 'EXPLANATION'
                const savedAnswer = activeRoadmap.answers.find(a => a.itemId === item.id)?.content
                const currentAnswer = answers[item.id] ?? savedAnswer ?? ''
                const isSaved = !!savedAnswer

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: itemIdx * 0.05 }}
                    className={`rounded-2xl border overflow-hidden ${config.border} ${config.bg}`}
                  >
                    <div className={`flex items-center gap-2 px-4 py-2.5 border-b ${config.border}`}>
                      <Icon size={14} className={config.text} />
                      <span className={`text-xs font-bold uppercase tracking-wider ${config.text}`}>{config.label}</span>
                      {isSaved && <CheckCircle2 size={12} className="ml-auto text-emerald-500" />}
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-gray-900 mb-3 text-sm">{item.title}</h3>
                      <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-4">{item.content}</div>

                      {isInteractive && (
                        <div className="mt-4 pt-4 border-t border-current border-opacity-20">
                          <label className="text-xs font-bold text-gray-500 block mb-2">
                            {item.type === 'EXERCISE' ? 'NOTES D\'EXERCICE' : 'TA RÉPONSE'}
                          </label>
                          <textarea
                            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-200 min-h-[100px]"
                            placeholder={item.type === 'EXERCISE' ? 'Note ce que tu as fait, découvert, ressenti...' : 'Prends le temps de réfléchir et d\'écrire ta réponse sincère...'}
                            value={currentAnswer}
                            onChange={e => setAnswers(p => ({ ...p, [item.id]: e.target.value }))}
                          />
                          <div className="flex justify-end mt-2">
                            <Button
                              size="sm"
                              variant={isSaved && currentAnswer === savedAnswer ? 'secondary' : 'primary' as any}
                              onClick={() => onSaveAnswer(activeRoadmap.id, item.id)}
                              disabled={!currentAnswer.trim() || savingItem === item.id}
                            >
                              {savingItem === item.id ? (
                                <><Loader2 size={12} className="animate-spin" /> Sauvegarde...</>
                              ) : isSaved ? (
                                <><CheckCircle2 size={12} /> Sauvegardé</>
                              ) : (
                                <><Star size={12} /> Sauvegarder</>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>

            <div className="flex justify-between items-center mt-8 mb-12">
              <Button
                variant="secondary"
                onClick={() => onSectionChange(activeRoadmap.id, currentIdx - 1)}
                disabled={currentIdx === 0}
              >
                <ChevronLeft size={16} /> Précédent
              </Button>

              {currentIdx < sections.length - 1 ? (
                <Button onClick={() => onSectionChange(activeRoadmap.id, currentIdx + 1)}>
                  Suivant <ChevronRight size={16} />
                </Button>
              ) : (
                <Button
                  onClick={() => onComplete(activeRoadmap.id)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                >
                  <Trophy size={16} /> Terminer le parcours
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}
