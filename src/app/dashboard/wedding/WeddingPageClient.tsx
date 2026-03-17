'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Plus, CalendarDays, Users, CheckSquare, ChevronRight } from 'lucide-react'
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

export function WeddingPageClient({ projects }: { projects: Project[] }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<WeddingProjectInput>({
    resolver: zodResolver(weddingProjectSchema),
  })

  const onSubmit = async (data: WeddingProjectInput) => {
    const res = await createWeddingProject(data)
    if (res.success) {
      reset()
      setOpen(false)
      router.refresh()
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projets mariage</h1>
          <p className="text-gray-500 mt-1">Gérez l'organisation de votre grand jour</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} />
          Nouveau projet
        </Button>
      </div>

      {projects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-purple-50 mb-4">
            <CalendarDays size={40} className="text-purple-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Aucun projet</h2>
          <p className="text-gray-500 mt-2 max-w-sm mx-auto">
            Créez votre premier projet mariage pour commencer à organiser votre grand jour.
          </p>
          <Button onClick={() => setOpen(true)} className="mt-6" size="lg">
            <Plus size={16} />
            Créer mon projet
          </Button>
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
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/dashboard/wedding/${project.id}`}>
                  <Card hover className="cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{project.title}</h3>
                        {project.description && (
                          <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{project.description}</p>
                        )}
                      </div>
                      <ChevronRight size={18} className="text-gray-300 mt-0.5" />
                    </div>

                    <ProgressBar value={prog} size="sm" className="mb-3" />

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {project.weddingDate && (
                        <span className="flex items-center gap-1">
                          <CalendarDays size={12} />
                          {formatDate(project.weddingDate)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        {project.members.length} membre{project.members.length > 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckSquare size={12} />
                        {done}/{total} tâches
                      </span>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            )
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nouveau projet mariage">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Titre du projet"
            placeholder="Notre mariage 2025"
            {...register('title')}
            error={errors.title?.message}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
              rows={3}
              placeholder="Décrivez votre projet..."
              {...register('description')}
            />
          </div>
          <Input
            label="Date du mariage"
            type="date"
            {...register('weddingDate')}
          />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => setOpen(false)} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" loading={isSubmitting} className="flex-1">
              Créer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
