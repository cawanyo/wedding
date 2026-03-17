import { notFound } from 'next/navigation'
import { getProjectById } from '@/actions/wedding/projects'
import { GuestsClient } from './GuestsClient'

export default async function GuestsPage({ params }: { params: { projectId: string } }) {
  const project = await getProjectById(params.projectId)
  if (!project) notFound()

  return <GuestsClient projectId={params.projectId} guests={project.guests as any} />
}
