import { notFound } from 'next/navigation'
import { getProjectById } from '@/actions/wedding/projects'
import { VendorsClient } from './VendorsClient'

export default async function VendorsPage({ params }: { params: { projectId: string } }) {
  const project = await getProjectById(params.projectId)
  if (!project) notFound()

  return <VendorsClient projectId={params.projectId} vendors={project.vendors as any} />
}
