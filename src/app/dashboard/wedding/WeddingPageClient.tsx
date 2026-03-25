'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, CalendarDays, Users, CheckSquare, ChevronRight,
  Sparkles, Loader2, Heart, DollarSign, Star, ArrowRight,
  MapPin, Music, Camera, Utensils, Flower, Car, Package,
  ChevronDown, ChevronUp, X,
} from 'lucide-react'
import { weddingProjectSchema, WeddingProjectInput } from '@/lib/validations'
import { createWeddingProject } from '@/actions/wedding/projects'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { calcProgress, formatDate } from '@/lib/utils'
import Link from 'next/link'

type Project = {
  id: string
  title: string
  description: string | null
  weddingDate: Date | null
  members: { id: string }[]
  steps: {
    id: string
    title: string
    tasks: { id: string; status: string }[]
  }[]
}

const WEDDING_STYLES = [
  { value: 'elegant', label: 'Élégant & Classique', emoji: '✨' },
  { value: 'boheme', label: 'Bohème & Nature', emoji: '🌿' },
  { value: 'moderne', label: 'Moderne & Épuré', emoji: '🖤' },
  { value: 'chretien', label: 'Chrétien', emoji: '✝️' },
  { value: 'africain', label: 'Africain & Coloré', emoji: '🌺' },
  { value: 'vintage', label: 'Vintage & Romantique', emoji: '🕯️' },
]

const VENDOR_ICONS: Record<string, React.ElementType> = {
  venue: MapPin,
  music: Music,
  photo: Camera,
  catering: Utensils,
  flowers: Flower,
  transport: Car,
  default: Package,
}

type AIPlan = {
  overview: string
  budgetBreakdown: { category: string; percentage: number; estimatedAmount: number; notes: string }[]
  timeline: { period: string; tasks: string[] }[]
  keyVendors: { type: string; description: string; budgetRange: string }[]
  personalizedTips: string[]
  romanticIdeas: string[]
}

export function WeddingPageClient({ projects }: { projects: Project[] }) {
  const [createOpen, setCreateOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiForm, setAiForm] = useState({ description: '', budget: '', style: '', guestCount: '', date: '' })
  const [aiPlan, setAiPlan] = useState<AIPlan | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [expandedSection, setExpandedSection] = useState<string | null>('overview')
  const router = useRouter()

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<WeddingProjectInput>({
    resolver: zodResolver(weddingProjectSchema),
  })

  const onSubmit = async (data: WeddingProjectInput) => {
    const res = await createWeddingProject(data)
    if (res.success) {
      reset()
      setCreateOpen(false)
      router.refresh()
    }
  }

  const handleAiGenerate = async () => {
    if (!aiForm.description.trim()) return
    setAiLoading(true)
    setAiError('')
    setAiPlan(null)
    try {
      const res = await fetch('/api/wedding-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiForm),
      })
      const data = await res.json()
      if (data.success) {
        setAiPlan(data.plan)
      } else {
        setAiError(data.error || 'Erreur lors de la génération')
      }
    } catch {
      setAiError('Erreur de connexion')
    }
    setAiLoading(false)
  }

  const toggle = (section: string) => setExpandedSection(prev => prev === section ? null : section)

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 text-8xl flex items-center justify-end pr-6 pointer-events-none">💍</div>
          <div className="relative z-10">
            <h1 className="text-2xl font-bold mb-1">Organisation du Mariage</h1>
            <p className="text-white/80 text-sm">Planifiez votre grand jour avec sérénité — et un peu de magie IA</p>
            <div className="flex flex-wrap gap-3 mt-4">
              <Button
                size="sm"
                onClick={() => setAiOpen(true)}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm"
              >
                <Sparkles size={14} /> Générer un plan IA
              </Button>
              <Button
                size="sm"
                onClick={() => setCreateOpen(true)}
                className="bg-white text-purple-600 hover:bg-white/90"
              >
                <Plus size={14} /> Nouveau projet
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Projects */}
      {projects.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-purple-50 mb-4">
            <CalendarDays size={40} className="text-purple-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Aucun projet pour l'instant</h2>
          <p className="text-gray-500 mt-2 max-w-sm mx-auto text-sm">
            Créez votre premier projet ou laissez l'IA vous générer un plan personnalisé basé sur vos rêves et votre budget.
          </p>
          <div className="flex justify-center gap-3 mt-6">
            <Button variant="secondary" onClick={() => setAiOpen(true)}>
              <Sparkles size={15} /> Plan IA
            </Button>
            <Button onClick={() => setCreateOpen(true)} size="lg">
              <Plus size={16} /> Créer mon projet
            </Button>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project, i) => {
            let total = 0, done = 0
            for (const s of project.steps) {
              total += s.tasks.length
              done += s.tasks.filter(t => t.status === 'DONE' || t.status === 'VALIDATED').length
            }
            const prog = calcProgress(done, total)
            return (
              <motion.div key={project.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link href={`/dashboard/wedding/${project.id}`}>
                  <Card hover className="cursor-pointer group">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">{project.title}</h3>
                        {project.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{project.description}</p>}
                      </div>
                      <ChevronRight size={18} className="text-gray-300 mt-0.5 group-hover:text-purple-400 transition-colors" />
                    </div>
                    <ProgressBar value={prog} size="sm" className="mb-3" />
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {project.weddingDate && (
                        <span className="flex items-center gap-1">
                          <CalendarDays size={12} /> {formatDate(project.weddingDate)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users size={12} /> {project.members.length} membre{project.members.length > 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckSquare size={12} /> {done}/{total} tâches
                      </span>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nouveau projet mariage">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Titre du projet" placeholder="Notre mariage 2025" {...register('title')} error={errors.title?.message} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400" rows={3} placeholder="Décrivez votre projet..." {...register('description')} />
          </div>
          <Input label="Date du mariage" type="date" {...register('weddingDate')} />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => setCreateOpen(false)} className="flex-1">Annuler</Button>
            <Button type="submit" loading={isSubmitting} className="flex-1">Créer</Button>
          </div>
        </form>
      </Modal>

      {/* AI Plan Modal */}
      <Modal open={aiOpen} onClose={() => { setAiOpen(false); if (!aiPlan) setAiForm({ description: '', budget: '', style: '', guestCount: '', date: '' }) }} title="Générer votre plan de mariage IA">
        <div className="space-y-4">
          {!aiPlan ? (
            <>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-xl p-3 text-sm text-purple-700 flex items-start gap-2">
                <Sparkles size={16} className="flex-shrink-0 mt-0.5" />
                <p>Décrivez vos rêves et l'IA créera un plan personnalisé avec budget, timeline et conseils uniques.</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Décrivez vos rêves <span className="text-red-400">*</span></label>
                <textarea
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-200 min-h-[100px]"
                  placeholder="Ex: On veut un mariage élégant en plein air, avec des fleurs sauvages, une ambiance intimiste, de la bonne musique gospel et un repas gastronomique africain..."
                  value={aiForm.description}
                  onChange={e => setAiForm(p => ({ ...p, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Budget total (€)</label>
                  <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200" placeholder="15000" value={aiForm.budget} onChange={e => setAiForm(p => ({ ...p, budget: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Nombre d'invités</label>
                  <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200" placeholder="80" value={aiForm.guestCount} onChange={e => setAiForm(p => ({ ...p, guestCount: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Style du mariage</label>
                <div className="grid grid-cols-3 gap-2">
                  {WEDDING_STYLES.map(s => (
                    <button key={s.value} type="button" onClick={() => setAiForm(p => ({ ...p, style: s.value }))}
                      className={`p-2.5 rounded-xl border-2 text-center transition-all ${aiForm.style === s.value ? 'border-purple-400 bg-purple-50' : 'border-gray-100 hover:border-purple-200'}`}>
                      <span className="text-xl block">{s.emoji}</span>
                      <span className="text-[10px] text-gray-600 font-medium">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Date souhaitée</label>
                <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200" value={aiForm.date} onChange={e => setAiForm(p => ({ ...p, date: e.target.value }))} />
              </div>

              {aiError && <p className="text-sm text-red-500 text-center">{aiError}</p>}

              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setAiOpen(false)} className="flex-1">Annuler</Button>
                <Button onClick={handleAiGenerate} disabled={!aiForm.description.trim() || aiLoading} className="flex-1">
                  {aiLoading ? <><Loader2 size={14} className="animate-spin" /> Génération en cours...</> : <><Sparkles size={14} /> Générer mon plan</>}
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
              {/* Overview */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Heart size={18} />
                  <h3 className="font-bold">Vue d'ensemble</h3>
                </div>
                <p className="text-sm text-white/90 leading-relaxed">{aiPlan.overview}</p>
              </div>

              {/* Budget Breakdown */}
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                <button onClick={() => toggle('budget')} className="flex items-center justify-between w-full px-4 py-3 hover:bg-gray-50 transition-colors">
                  <span className="font-semibold text-gray-800 flex items-center gap-2"><DollarSign size={16} className="text-emerald-500" /> Répartition du budget</span>
                  {expandedSection === 'budget' ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>
                <AnimatePresence>
                  {expandedSection === 'budget' && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="px-4 pb-4 space-y-3">
                        {aiPlan.budgetBreakdown.map((item, i) => (
                          <div key={i}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium text-gray-700">{item.category}</span>
                              <span className="text-gray-500">{item.estimatedAmount ? `~${item.estimatedAmount.toLocaleString()}€` : ''} ({item.percentage}%)</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${item.percentage}%` }} className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full" />
                            </div>
                            {item.notes && <p className="text-xs text-gray-400 mt-0.5">{item.notes}</p>}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Timeline */}
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                <button onClick={() => toggle('timeline')} className="flex items-center justify-between w-full px-4 py-3 hover:bg-gray-50 transition-colors">
                  <span className="font-semibold text-gray-800 flex items-center gap-2"><CalendarDays size={16} className="text-blue-500" /> Timeline de préparation</span>
                  {expandedSection === 'timeline' ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>
                <AnimatePresence>
                  {expandedSection === 'timeline' && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="px-4 pb-4 space-y-3">
                        {aiPlan.timeline.map((phase, i) => (
                          <div key={i} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">{i + 1}</div>
                              {i < aiPlan.timeline.length - 1 && <div className="flex-1 w-px bg-gray-200 mt-1" />}
                            </div>
                            <div className="pb-3 flex-1">
                              <p className="font-semibold text-sm text-gray-800">{phase.period}</p>
                              <ul className="mt-1 space-y-1">
                                {phase.tasks.map((task, j) => (
                                  <li key={j} className="flex items-start gap-1.5 text-xs text-gray-600">
                                    <ArrowRight size={11} className="text-pink-400 mt-0.5 flex-shrink-0" />
                                    {task}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Key Vendors */}
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                <button onClick={() => toggle('vendors')} className="flex items-center justify-between w-full px-4 py-3 hover:bg-gray-50 transition-colors">
                  <span className="font-semibold text-gray-800 flex items-center gap-2"><Star size={16} className="text-amber-500" /> Prestataires clés</span>
                  {expandedSection === 'vendors' ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>
                <AnimatePresence>
                  {expandedSection === 'vendors' && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="px-4 pb-4 space-y-2">
                        {aiPlan.keyVendors.map((v, i) => {
                          const Icon = VENDOR_ICONS[v.type.toLowerCase()] || VENDOR_ICONS.default
                          return (
                            <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
                              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center flex-shrink-0">
                                <Icon size={14} className="text-purple-500" />
                              </div>
                              <div>
                                <p className="font-medium text-sm text-gray-800">{v.type}</p>
                                <p className="text-xs text-gray-500">{v.description}</p>
                                <p className="text-xs text-purple-500 font-medium mt-0.5">{v.budgetRange}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Tips */}
              {aiPlan.personalizedTips?.length > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                  <h4 className="font-semibold text-amber-700 text-sm mb-2 flex items-center gap-1"><Sparkles size={14} /> Conseils personnalisés</h4>
                  <ul className="space-y-1.5">
                    {aiPlan.personalizedTips.map((tip, i) => (
                      <li key={i} className="text-xs text-amber-800 flex items-start gap-1.5">
                        <span className="font-bold text-amber-400">•</span>{tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Romantic ideas */}
              {aiPlan.romanticIdeas?.length > 0 && (
                <div className="bg-pink-50 border border-pink-100 rounded-2xl p-4">
                  <h4 className="font-semibold text-pink-700 text-sm mb-2 flex items-center gap-1"><Heart size={14} /> Idées romantiques</h4>
                  <ul className="space-y-1.5">
                    {aiPlan.romanticIdeas.map((idea, i) => (
                      <li key={i} className="text-xs text-pink-800 flex items-start gap-1.5">
                        <span className="text-pink-400">💕</span>{idea}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="ghost" onClick={() => setAiPlan(null)} className="flex-1">
                  <X size={14} /> Recommencer
                </Button>
                <Button onClick={() => { setAiOpen(false); setCreateOpen(true) }} className="flex-1">
                  <Plus size={14} /> Créer mon projet
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
