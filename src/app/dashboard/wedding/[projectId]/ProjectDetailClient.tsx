'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, ChevronDown, ChevronUp, Pencil, Trash2, UserCircle,
  DollarSign, Calendar, MessageSquare, CheckCircle2, Clock, Users,
  Bot, X, Send, Loader2, Sparkles, GripVertical, LayoutList,
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Badge, taskStatusBadge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { calcProgress, formatCurrency, formatDate } from '@/lib/utils'
import { createStep } from '@/actions/wedding/steps'
import { createTask, updateTask, addComment } from '@/actions/tasks'
import { inviteMember, reorderSteps, reorderTasks } from '@/actions/wedding/projects'

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

type ChatMessage = { role: 'user' | 'assistant'; content: string }

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'TODO', label: 'À faire' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'DONE', label: 'Terminé' },
  { value: 'VALIDATED', label: 'Validé' },
]

const TABS = [
  { id: 'steps', label: 'Étapes & Tâches', icon: LayoutList },
  { id: 'ai', label: 'Assistant IA', icon: Bot },
]

// ── Sortable step item ──────────────────────────────────────────────────────
function SortableStepWrapper({ step, children }: { step: Step; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  }
  return (
    <div ref={setNodeRef} style={style}>
      <div className="relative group">
        <button
          {...attributes}
          {...listeners}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 p-1"
          title="Déplacer"
        >
          <GripVertical size={16} />
        </button>
        {children}
      </div>
    </div>
  )
}

// ── Sortable task item ──────────────────────────────────────────────────────
function SortableTaskWrapper({ task, children }: { task: Task; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  return (
    <div ref={setNodeRef} style={style} className="relative group/task">
      <button
        {...attributes}
        {...listeners}
        className="absolute left-1 top-4 opacity-0 group-hover/task:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 p-0.5"
        title="Déplacer"
      >
        <GripVertical size={14} />
      </button>
      {children}
    </div>
  )
}

// ── AI Task Chat Panel ──────────────────────────────────────────────────────
function AiTaskPanel({
  task, projectContext, onClose,
}: {
  task: Task; projectContext: string; onClose: () => void
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Send initial message automatically
    sendMessage('Donne-moi une estimation de durée pour réaliser cette tâche, des suggestions de prestataires et des fourchettes de prix typiques en France.')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    const userMsg: ChatMessage = { role: 'user', content: text }
    const newHistory = [...messages, userMsg]
    setMessages(newHistory)
    setLoading(true)
    setInitializing(false)
    try {
      const res = await fetch('/api/wedding-ai-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskTitle: task.title,
          taskDescription: task.description,
          projectContext,
          message: text,
          history: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Désolé, une erreur est survenue.' }])
    }
    setLoading(false)
  }

  const handleSend = () => {
    if (!input.trim() || loading) return
    const text = input.trim()
    setInput('')
    sendMessage(text)
  }

  return (
    <div className="fixed right-0 top-0 h-full w-[380px] bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            <Bot size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500">Assistant IA</p>
            <p className="text-sm font-semibold text-gray-800 truncate">{task.title}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {initializing && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 size={14} className="animate-spin" />
            <span>L'IA analyse la tâche...</span>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                <Bot size={12} className="text-white" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-purple-500 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 mr-2">
              <Bot size={12} className="text-white" />
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-2.5">
              <Loader2 size={14} className="animate-spin text-gray-400" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder="Posez votre question..."
            className="flex-1 text-sm rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            <Send size={16} />
          </button>
        </div>
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {['Quels prestataires?', 'Combien de temps?', 'Budget moyen?'].map(q => (
            <button
              key={q}
              onClick={() => { setInput(q) }}
              className="text-xs px-2.5 py-1 rounded-full bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-100"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── General project AI chat tab ─────────────────────────────────────────────
function ProjectAiChat({ project }: { project: Project }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const projectContext = `Projet: ${project.title}. ${project.description ? 'Description: ' + project.description + '. ' : ''}${project.weddingDate ? 'Date du mariage: ' + new Date(project.weddingDate).toLocaleDateString('fr-FR') + '. ' : ''}Étapes: ${project.steps.map(s => s.title).join(', ')}.`

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    const userMsg: ChatMessage = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)
    setInput('')
    try {
      const res = await fetch('/api/wedding-ai-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskTitle: 'Organisation générale du mariage',
          taskDescription: '',
          projectContext,
          message: text,
          history: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Désolé, une erreur est survenue.' }])
    }
    setLoading(false)
  }

  const handleSend = () => {
    if (!input.trim() || loading) return
    sendMessage(input.trim())
  }

  const QUICK_QUESTIONS = [
    'Par quoi commencer?',
    'Comment réduire les coûts?',
    'Checklist des prestataires essentiels?',
    'Conseils pour le jour J?',
    'Comment gérer les invités?',
  ]

  return (
    <div className="flex flex-col h-[calc(100vh-320px)] min-h-[400px]">
      {/* Intro */}
      {messages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Bot size={32} className="text-white" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-gray-900 text-lg">Assistant IA de votre mariage</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-xs">
              Posez toutes vos questions sur l'organisation de votre mariage. L'IA connaît votre projet.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {QUICK_QUESTIONS.map(q => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="text-sm px-3 py-1.5 rounded-full bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-100"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                  <Bot size={14} className="text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-purple-500 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 mr-2">
                <Bot size={14} className="text-white" />
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                <Loader2 size={14} className="animate-spin text-gray-400" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder="Posez votre question sur votre mariage..."
            className="flex-1 text-sm rounded-xl border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            <Send size={16} />
          </button>
        </div>
        {messages.length > 0 && (
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {QUICK_QUESTIONS.slice(0, 3).map(q => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="text-xs px-2.5 py-1 rounded-full bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-100"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
export function ProjectDetailClient({ project, userId }: { project: Project; userId: string }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'steps' | 'ai'>('steps')
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set([project.steps[0]?.id]))
  const [stepModal, setStepModal] = useState(false)
  const [taskModal, setTaskModal] = useState<{ open: boolean; stepId: string | null }>({ open: false, stepId: null })
  const [inviteModal, setInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [commentText, setCommentText] = useState<Record<string, string>>({})
  const [stepForm, setStepForm] = useState({ title: '', description: '', dueDate: '', budgetLimit: '' })
  const [taskForm, setTaskForm] = useState({ title: '', description: '', dueDate: '', budgetLimit: '', assignedTo: '' })

  // Drag & drop state
  const [stepOrder, setStepOrder] = useState<Step[]>(project.steps)
  const [taskOrders, setTaskOrders] = useState<Record<string, Task[]>>(
    Object.fromEntries(project.steps.map(s => [s.id, s.tasks]))
  )

  // AI task chat
  const [aiTaskPanel, setAiTaskPanel] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const toggleStep = (id: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  let totalTasks = 0, doneTasks = 0
  for (const s of stepOrder) {
    const tasks = taskOrders[s.id] ?? s.tasks
    totalTasks += tasks.length
    doneTasks += tasks.filter(t => t.status === 'DONE' || t.status === 'VALIDATED').length
  }
  const projectProgress = calcProgress(doneTasks, totalTasks)

  const handleCreateStep = async () => {
    if (!stepForm.title) return
    await createStep(project.id, {
      title: stepForm.title,
      description: stepForm.description || undefined,
      dueDate: stepForm.dueDate || undefined,
      budgetLimit: stepForm.budgetLimit ? parseFloat(stepForm.budgetLimit) : undefined,
      order: stepOrder.length,
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

  const handleStepDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = stepOrder.findIndex(s => s.id === active.id)
    const newIndex = stepOrder.findIndex(s => s.id === over.id)
    const newOrder = arrayMove(stepOrder, oldIndex, newIndex)
    setStepOrder(newOrder)
    await reorderSteps(project.id, newOrder.map(s => s.id))
  }

  const handleTaskDragEnd = (stepId: string) => async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const tasks = taskOrders[stepId] ?? []
    const oldIndex = tasks.findIndex(t => t.id === active.id)
    const newIndex = tasks.findIndex(t => t.id === over.id)
    const newTasks = arrayMove(tasks, oldIndex, newIndex)
    setTaskOrders(prev => ({ ...prev, [stepId]: newTasks }))
    await reorderTasks(stepId, newTasks.map(t => t.id))
  }

  const projectContext = `Projet: ${project.title}. ${project.description ? 'Description: ' + project.description + '. ' : ''}${project.weddingDate ? 'Date du mariage: ' + new Date(project.weddingDate).toLocaleDateString('fr-FR') + '. ' : ''}Étapes: ${stepOrder.map(s => s.title).join(', ')}.`

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      {/* Header */}
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

      {/* Progress card */}
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

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'steps' | 'ai')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Steps tab */}
      {activeTab === 'steps' && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleStepDragEnd}>
          <SortableContext items={stepOrder.map(s => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4 pl-6">
              {stepOrder.map(step => {
                const tasks = taskOrders[step.id] ?? step.tasks
                const done = tasks.filter(t => t.status === 'DONE' || t.status === 'VALIDATED').length
                const prog = calcProgress(done, tasks.length)
                const isOpen = expandedSteps.has(step.id)

                return (
                  <SortableStepWrapper key={step.id} step={step}>
                    <motion.div layout>
                      <Card>
                        <div
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => toggleStep(step.id)}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${prog === 100 ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'}`}>
                              {prog === 100 ? '✓' : tasks.length}
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
                            <span className="text-xs text-gray-400">{done}/{tasks.length}</span>
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
                                <DndContext
                                  sensors={sensors}
                                  collisionDetection={closestCenter}
                                  onDragEnd={handleTaskDragEnd(step.id)}
                                >
                                  <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                                    {tasks.map(task => (
                                      <SortableTaskWrapper key={task.id} task={task}>
                                        <div className="bg-gray-50 rounded-xl p-4 pl-7">
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
                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                              <button
                                                onClick={e => { e.stopPropagation(); setAiTaskPanel(task) }}
                                                title="Demander à l'IA"
                                                className="p-1.5 rounded-lg bg-purple-50 text-purple-500 hover:bg-purple-100 hover:text-purple-700 transition-colors"
                                              >
                                                <Bot size={14} />
                                              </button>
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
                                      </SortableTaskWrapper>
                                    ))}
                                  </SortableContext>
                                </DndContext>

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
                  </SortableStepWrapper>
                )
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* AI tab */}
      {activeTab === 'ai' && (
        <Card>
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Assistant IA — {project.title}</h3>
              <p className="text-xs text-gray-400">Posez toutes vos questions sur votre mariage</p>
            </div>
          </div>
          <ProjectAiChat project={project} />
        </Card>
      )}

      {/* AI task panel (slide-over) */}
      <AnimatePresence>
        {aiTaskPanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setAiTaskPanel(null)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 h-full z-50"
            >
              <AiTaskPanel
                task={aiTaskPanel}
                projectContext={projectContext}
                onClose={() => setAiTaskPanel(null)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modals */}
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
