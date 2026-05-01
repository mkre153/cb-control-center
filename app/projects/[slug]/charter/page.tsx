import { notFound } from 'next/navigation'
import { getProjectBySlug } from '@/lib/cb-control-center/cbccProjectRepository'
import { CbccCharterPanel } from '@/components/cb-control-center/v2/CbccCharterPanel'

export default async function CharterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)
  if (!project) notFound()

  return <CbccCharterPanel project={project} />
}
