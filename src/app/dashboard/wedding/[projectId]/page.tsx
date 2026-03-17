import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getProjectById } from '@/actions/wedding/projects'
import { ProjectDetailClient } from './ProjectDetailClient'

export default async function ProjectDetailPage({ params }: { params: { projectId: string } }) {
  const session = await getServerSession(authOptions)
  const project = await getProjectById(params.projectId)
  if (!project) notFound()

  return <ProjectDetailClient project={project as any} userId={session?.user?.id ?? ''} />
}
