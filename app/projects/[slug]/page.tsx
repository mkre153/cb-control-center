import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getProjectBySlug, getProjectStages } from '@/lib/cb-control-center/cbccProjectRepository'
import { CbccStagePipeline } from '@/components/cb-control-center/v2/CbccStagePipeline'
import { CbccNav } from '@/components/cb-control-center/v2/CbccNav'
import { isEngineBackedSlug } from '@/lib/cb-control-center/cbccEngineRegistry'
import { translateDapProjectForPipeline } from '@/lib/cb-control-center/cbccProjectPipelineTranslator'

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // Engine-backed projects (currently DAP only) bypass Supabase entirely and
  // hydrate from the generic CBCC adapter. All other slugs keep the existing
  // Supabase-backed path so generic v2 projects continue to work.
  let project, stages
  if (isEngineBackedSlug(slug)) {
    const bundle = translateDapProjectForPipeline()
    project = bundle.project
    stages = bundle.stages
  } else {
    project = await getProjectBySlug(slug)
    if (!project) notFound()
    stages = await getProjectStages(project.id)
  }

  return (
    <div className="min-h-screen bg-gray-950 font-sans text-gray-300">
      <CbccNav />

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link href="/" className="text-xs text-gray-500 hover:text-gray-400">
            ← Projects
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">{project.name}</h1>
        </div>

        {!project.charterApproved ? (
          <div
            data-blocker-message
            className="mb-6 px-4 py-3 rounded-md bg-amber-900/20 border border-amber-700/40 text-sm text-amber-400"
          >
            <strong>Blocked:</strong> Step 0 Project Charter requires owner approval before Stage 1 can begin.
          </div>
        ) : (
          <div className="mb-6 px-4 py-3 rounded-md bg-green-900/20 border border-green-700/40 text-sm text-green-400">
            Charter Approved — Stage 1 is now available.
          </div>
        )}

        <div className="mb-8">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Build Pipeline</p>
          <CbccStagePipeline project={project} stages={stages} />
        </div>
      </div>
    </div>
  )
}
