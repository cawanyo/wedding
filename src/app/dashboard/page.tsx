import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMyProjects } from '@/actions/wedding/projects'
import { getMyCouple } from '@/actions/couple'
import { calcProgress, formatCurrency, formatDate } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { StatCard } from '@/components/widgets/StatCard'
import { FadeIn, StaggerChildren, StaggerItem } from '@/components/animations/transitions'
import { CalendarDays, Heart, ListTodo, Users, TrendingUp, MessageSquare } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const [projects, couple] = await Promise.all([getMyProjects(), getMyCouple()])

  const mainProject = projects[0]
  let projectProgress = 0
  let totalTasks = 0
  let doneTasks = 0

  if (mainProject) {
    for (const step of mainProject.steps) {
      totalTasks += step.tasks.length
      doneTasks += step.tasks.filter(t => t.status === 'DONE' || t.status === 'VALIDATED').length
    }
    projectProgress = calcProgress(doneTasks, totalTasks)
  }

  const answeredCount = 0

  return (
    <div className="p-6 max-w-6xl mx-auto w-full">
      <FadeIn>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Bonjour {session?.user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 mt-1">Voici un aperçu de votre espace</p>
        </div>
      </FadeIn>

      <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StaggerItem>
          <StatCard
            label="Projet mariage"
            value={mainProject?.title ?? 'Aucun projet'}
            icon={<CalendarDays size={20} />}
            gradient
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Progression"
            value={`${projectProgress}%`}
            icon={<TrendingUp size={20} />}
            trend={{ value: `${doneTasks}/${totalTasks} tâches`, up: true }}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Membres"
            value={mainProject?.members.length ?? 0}
            icon={<Users size={20} />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Espace couple"
            value={couple ? (couple.user2 ? 'Connecté' : 'En attente') : 'Créer'}
            icon={<Heart size={20} />}
          />
        </StaggerItem>
      </StaggerChildren>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <FadeIn delay={0.1} className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Projet mariage</h2>
              <Link href="/dashboard/wedding" className="text-sm text-purple-600 hover:underline">
                Voir tout
              </Link>
            </div>

            {!mainProject ? (
              <div className="text-center py-8">
                <CalendarDays size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">Aucun projet pour l'instant</p>
                <Link href="/dashboard/wedding" className="mt-3 inline-block text-sm text-purple-600 font-medium hover:underline">
                  Créer mon projet
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-gray-800">{mainProject.title}</span>
                    {mainProject.weddingDate && (
                      <span className="text-xs text-gray-500">{formatDate(mainProject.weddingDate)}</span>
                    )}
                  </div>
                  <ProgressBar value={projectProgress} color="purple" />
                </div>

                <div className="space-y-2">
                  {mainProject.steps.slice(0, 4).map(step => {
                    const done = step.tasks.filter(t => t.status === 'DONE' || t.status === 'VALIDATED').length
                    const prog = calcProgress(done, step.tasks.length)
                    return (
                      <div key={step.id} className="flex items-center gap-3">
                        <div className={`h-5 w-5 rounded-full flex items-center justify-center text-xs ${prog === 100 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                          {prog === 100 ? '✓' : '○'}
                        </div>
                        <span className="text-sm text-gray-700 flex-1">{step.title}</span>
                        <span className="text-xs text-gray-400">{prog}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </Card>
        </FadeIn>

        <FadeIn delay={0.2}>
          <Card gradient>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Notre couple</h2>
              <Link href="/dashboard/couple" className="text-sm text-purple-600 hover:underline">
                Voir
              </Link>
            </div>

            {!couple ? (
              <div className="text-center py-6">
                <Heart size={36} className="mx-auto text-pink-300 mb-3" />
                <p className="text-sm text-gray-500">Créez votre espace couple</p>
                <Link href="/dashboard/couple" className="mt-2 inline-block text-sm text-purple-600 font-medium hover:underline">
                  Commencer
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                    {couple.user1?.name?.[0]}
                  </div>
                  <span className="text-sm text-gray-700">{couple.user1?.name}</span>
                </div>
                {couple.user2 && (
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-400 flex items-center justify-center text-white text-xs font-bold">
                      {couple.user2?.name?.[0]}
                    </div>
                    <span className="text-sm text-gray-700">{couple.user2?.name}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500">Objectifs en cours</p>
                  <p className="text-xl font-bold text-gray-900 mt-0.5">
                    {couple.goals.filter(g => !g.done).length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Check-ins hebdo</p>
                  <p className="text-xl font-bold text-gray-900 mt-0.5">
                    {couple.checkins.length}
                  </p>
                </div>
              </div>
            )}
          </Card>
        </FadeIn>
      </div>
    </div>
  )
}
