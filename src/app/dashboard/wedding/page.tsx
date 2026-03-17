import { getMyProjects } from '@/actions/wedding/projects'
import { WeddingPageClient } from './WeddingPageClient'

export default async function WeddingPage() {
  const projects = await getMyProjects()
  return <WeddingPageClient projects={projects as any} />
}
