import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getProjectBySlug } from '@/lib/cb-control-center/cbccProjectRepository'
import { CbccCharterPanel } from '@/components/cb-control-center/v2/CbccCharterPanel'

export default async function CharterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)
  if (!project) notFound()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 pt-8">
        <Link href={`/projects/${slug}`} className="text-xs text-gray-400 hover:text-gray-600">
          ← {project.name}
        </Link>
      </div>
      <CbccCharterPanel project={project} />
    </div>
  )
}
