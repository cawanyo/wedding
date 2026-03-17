import { notFound } from 'next/navigation'
import { getProjectById } from '@/actions/wedding/projects'
import { getFinance } from '@/actions/finance'
import { FinanceClient } from './FinanceClient'

export default async function FinancePage({ params }: { params: { projectId: string } }) {
  const [project, finance] = await Promise.all([
    getProjectById(params.projectId),
    getFinance(params.projectId),
  ])
  if (!project || !finance) notFound()

  return (
    <FinanceClient
      projectId={params.projectId}
      finance={finance as any}
      steps={project.steps.map(s => ({ id: s.id, title: s.title }))}
    />
  )
}
