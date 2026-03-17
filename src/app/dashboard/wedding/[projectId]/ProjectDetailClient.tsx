'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, ChevronDown, ChevronUp, Pencil, Trash2, UserCircle,
  DollarSign, Calendar, MessageSquare, CheckCircle2, Clock, Users
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Badge, taskStatusBadge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { calcProgress, formatCurrency, formatDate } from '@/lib/utils'
import { createStep } from '@/actions/wedding/steps'
import { createTask, updateTask, addComment } from '@/actions/tasks'
import { inviteMember } from '@/actions/wedding/projects'

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'VALIDATED'

type Member = { id: string; role: string; user: { id: string; name: string | null; email: string } }
type Comment = { id: string; message: string; user: { name: string | null }; createdAt: Date }
type Task = {
  id: string; title: string; description: string | null; status: string
  dueDate: Date | null; budgetLimit: number | null; realCost: number | null
  assignedTo: string | null
  assignee: { name: string | null } | null
  comments: Comment[]
}
type Step = {
  id: string; title: string; description: string | null; dueDate: Date | null
  budgetLimit: number | null; tasks: Task[]
}
type Project = {
  id: string; title: string; description: string | null; weddingDate: Date | null
  members: Member[]; steps: Step[]
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'TODO', label: 'À faire' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'DONE', label: 'Terminé' },
  { value: 'VALIDATED', label: 'Validé' },
]

export function ProjectDetailClient({ project, userId }: { project: Project; userId: string }) {
  const router = useRouter()
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set([project.steps[0]?.id]))
  const [stepModal, setStepModal] = useState(false)
  const [taskModal, setTaskModal] = useState<{ open: boolean; stepId: string | null }>({ open: false, stepId: null })
  const [inviteModal, setInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [commentText, setCommentText] = useState<Record<string, string>>({})
  const [stepForm, setStepForm] = useState({ title: '', description: '', dueDate: '', budgetLimit: '' })
  const [taskForm, setTaskForm] = useState({ title: '', description: '', dueDate: '', budgetLimit: '', assignedTo: '' })

  const toggleStep = (id: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  let totalTasks = 0, doneTasks = 0
  for (const s of project.steps) {
    totalTasks += s.tasks.length
    doneTasks += s.tasks.filter(t => t.status === 'DONE' || t.status === 'VALIDATED').length
  }
  const projectProgress = calcProgress(doneTasks, totalTasks)

  const handleCreateStep = async () => {
    if (!stepForm.title) return
    await createStep(project.id, {
      title: stepForm.title,
      description: stepForm.description || undefined,
      dueDate: stepForm.dueDate || undefined,
      budgetLimit: stepForm.budgetLimit ? parseFloat(stepForm.budgetLimit) : undefined,
      order: project.steps.length,
    })
    setStepForm({ title: '', description: '', dueDate: '', budgetLimit: '' })
    setStepModal(false)
    router.refresh()
  }

  const handleCreateTask = async () => {
    if (!taskModal.stepId || !taskForm.title) return
    await createTask(taskModal.stepId, project.id, {
      title: taskForm.title,
      description: taskForm.description || undefined,
      dueDate: taskForm.dueDate || undefined,
      budgetLimit: taskForm.budgetLimit ? parseFloat(taskForm.budgetLimit) : undefined,
      assignedTo: taskForm.assignedTo || undefined,
    })
    setTaskForm({ title: '', description: '', dueDate: '', budgetLimit: '', assignedTo: '' })
    setTaskModal({ open: false, stepId: null })
    router.refresh()
  }

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    await updateTask(taskId, project.id, { status })
    router.refresh()
  }

  const handleAddComment = async (taskId: string) => {
    const msg = commentText[taskId]
    if (!msg?.trim()) return
    await addComment(taskId, msg)
    setCommentText(prev => ({ ...prev, [taskId]: '' }))
    router.refresh()
  }

  const handleInvite = async () => {
    setInviteError('')
    const res = await inviteMember(project.id, inviteEmail)
    if (res.error) { setInviteError(res.error); return }
    setInviteEmail('')
    setInviteModal(false)
    router.refresh()
  }

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
          {project.description && <p className="text-gray-500 mt-1">{project.description}</p>}
          {project.weddingDate && (
            <p className="text-sm text-purple-600 font-medium mt-1 flex items-center gap-1">
              <Calendar size={14} />
              {formatDate(project.weddingDate)}
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" size="sm" onClick={() => setInviteModal(true)}>
            <Users size={14} />
            Inviter
          </Button>
          <Button size="sm" onClick={() => setStepModal(true)}>
            <Plus size={14} />
            Étape
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progression globale</span>
          <span className="text-sm text-gray-500">{doneTasks}/{totalTasks} tâches</span>
        </div>
        <ProgressBar value={projectProgress} size="lg" color="purple" />
        <div className="flex gap-4 mt-3">
          {project.members.map(m => (
            <div key={m.id} className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="h-5 w-5 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold">
                {m.user.name?.[0] ?? 'U'}
              </div>
              <span>{m.user.name}</span>
              <Badge label={m.role === 'EDITOR' ? 'Éditeur' : 'Lecteur'} variant={m.role === 'EDITOR' ? 'purple' : 'default'} />
            </div>
          ))}
        </div>
      </Card>

      <div className="space-y-4">
        {project.steps.map(step => {
          const done = step.tasks.filter(t => t.status === 'DONE' || t.status === 'VALIDATED').length
          const prog = calcProgress(done, step.tasks.length)
          const isOpen = expandedSteps.has(step.id)

          return (
            <motion.div key={step.id} layout>
              <Card>
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleStep(step.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${prog === 100 ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'}`}>
                      {prog === 100 ? '✓' : step.tasks.length}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900">{step.title}</h3>
                      <ProgressBar value={prog} size="sm" showPercent={false} className="mt-1 w-32" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    {step.budgetLimit && (
                      <span className="text-xs text-gray-500 hidden sm:block">
                        Budget: {formatCurrency(step.budgetLimit)}
                      </span>
                    )}
                    {step.dueDate && (
                      <span className="text-xs text-gray-500 hidden sm:block">{formatDate(step.dueDate)}</span>
                    )}
                    <span className="text-xs text-gray-400">{done}/{step.tasks.length}</span>
                    {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 space-y-3 border-t border-gray-50 pt-4">
                        {step.tasks.map(task => (
                          <div key={task.id} className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-medium text-gray-800">{task.title}</span>
                                  {taskStatusBadge(task.status)}
                                </div>
                                {task.description && (
                                  <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                                )}
                                <div className="flex gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                                  {task.assignee && (
                                    <span className="flex items-center gap-1">
                                      <UserCircle size={12} />
                                      {task.assignee.name}
                                    </span>
                                  )}
                                  {task.dueDate && (
                                    <span className="flex items-center gap-1">
                                      <Clock size={12} />
                                      {formatDate(task.dueDate)}
                                    </span>
                                  )}
                                  {task.realCost != null && task.realCost > 0 && (
                                    <span className="flex items-center gap-1 text-green-600">
                                      <DollarSign size={12} />
                                      {formatCurrency(task.realCost)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <select
                                value={task.status}
                                onChange={e => handleStatusChange(task.id, e.target.value as TaskStatus)}
                                className="text-xs rounded-lg border border-gray-200 px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-purple-300"
                                onClick={e => e.stopPropagation()}
                              >
                                {STATUS_OPTIONS.map(o => (
                                  <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                              </select>
                            </div>

                            {task.comments.length > 0 && (
                              <div className="mt-3 space-y-1.5">
                                {task.comments.map(c => (
                                  <div key={c.id} className="text-xs bg-white rounded-lg px-3 py-2 border border-gray-100">
                                    <span className="font-medium text-gray-700">{c.user.name}: </span>
                                    <span className="text-gray-600">{c.message}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="mt-2 flex gap-2">
                              <input
                                value={commentText[task.id] ?? ''}
                                onChange={e => setCommentText(prev => ({ ...prev, [task.id]: e.target.value }))}
                                placeholder="Ajouter un commentaire..."
                                className="flex-1 text-xs rounded-lg border border-gray-200 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-300 bg-white"
                                onKeyDown={e => { if (e.key === 'Enter') handleAddComment(task.id) }}
                              />
                              <button
                                onClick={() => handleAddComment(task.id)}
                                className="px-2 py-1.5 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 text-xs"
                              >
                                <MessageSquare size={12} />
                              </button>
                            </div>
                          </div>
                        ))}

                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full border border-dashed border-gray-200 text-gray-400 hover:text-purple-600 hover:border-purple-300"
                          onClick={e => { e.stopPropagation(); setTaskModal({ open: true, stepId: step.id }) }}
                        >
                          <Plus size={14} />
                          Ajouter une tâche
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <Modal open={stepModal} onClose={() => setStepModal(false)} title="Nouvelle étape">
        <div className="space-y-4">
          <Input label="Titre" placeholder="Ex: Salle de réception" value={stepForm.title}
            onChange={e => setStepForm(p => ({ ...p, title: e.target.value }))} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-200" rows={2}
              value={stepForm.description} onChange={e => setStepForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date limite" type="date" value={stepForm.dueDate}
              onChange={e => setStepForm(p => ({ ...p, dueDate: e.target.value }))} />
            <Input label="Budget (€)" type="number" placeholder="0" value={stepForm.budgetLimit}
              onChange={e => setStepForm(p => ({ ...p, budgetLimit: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setStepModal(false)} className="flex-1">Annuler</Button>
            <Button onClick={handleCreateStep} className="flex-1">Créer</Button>
          </div>
        </div>
      </Modal>

      <Modal open={taskModal.open} onClose={() => setTaskModal({ open: false, stepId: null })} title="Nouvelle tâche">
        <div className="space-y-4">
          <Input label="Titre" placeholder="Ex: Contacter le traiteur" value={taskForm.title}
            onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-200" rows={2}
              value={taskForm.description} onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Assigner à</label>
            <select className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
              value={taskForm.assignedTo} onChange={e => setTaskForm(p => ({ ...p, assignedTo: e.target.value }))}>
              <option value="">Non assigné</option>
              {project.members.map(m => (
                <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date limite" type="date" value={taskForm.dueDate}
              onChange={e => setTaskForm(p => ({ ...p, dueDate: e.target.value }))} />
            <Input label="Budget (€)" type="number" placeholder="0" value={taskForm.budgetLimit}
              onChange={e => setTaskForm(p => ({ ...p, budgetLimit: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setTaskModal({ open: false, stepId: null })} className="flex-1">Annuler</Button>
            <Button onClick={handleCreateTask} className="flex-1">Créer</Button>
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
