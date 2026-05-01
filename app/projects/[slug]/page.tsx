import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getProjectBySlug, getProjectStages } from '@/lib/cb-control-center/cbccProjectRepository'
import { CbccStagePipeline } from '@/components/cb-control-center/v2/CbccStagePipeline'

const STATUS_LABEL: Record<string, string> = {
  step_0_draft:         'Charter Draft',
  step_0_charter_ready: 'Charter Ready for Owner Approval',
  step_0_approved:      'Charter Approved',
  in_progress:          'In Progress',
  completed:            'Completed',
  archived:             'Archived',
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)
  if (!project) notFound()

  const stages = await getProjectStages(project.id)

  return (
    <div className="min-h-screen bg-[#0d1117] font-mono text-gray-300">
      {/* Nav */}
      <nav className="border-b border-[#1e2d45] px-6 py-3 flex items-center justify-between">
        <Link href="/" className="text-blue-400 font-semibold tracking-tight hover:text-blue-300">
          CB Control Center
        </Link>
        <Link
          href="/projects/new"
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded transition-colors"
        >
          + New Project
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/" className="text-xs text-gray-600 hover:text-gray-400">
            ← Projects
          </Link>
        </div>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-100">{project.name}</h1>
          <p data-project-status className="mt-1 text-xs text-gray-500">
            Step 0: {STATUS_LABEL[project.projectStatus] ?? project.projectStatus}
          </p>
        </div>

        {/* Blocker or approved banner */}
        {!project.charterApproved ? (
          <div
            data-blocker-message
            className="mb-6 px-4 py-3 bg-amber-900/20 border border-amber-700/40 rounded text-sm text-amber-400"
          >
            <strong>Blocked:</strong> Step 0 Project Charter requires owner approval before Stage 1 can begin.{' '}
            <Link href={`/projects/${slug}/charter`} className="underline hover:text-amber-300">
              Review Charter
            </Link>
          </div>
        ) : (
          <div className="mb-6 px-4 py-3 bg-green-900/20 border border-green-700/40 rounded text-sm text-green-400">
            Charter Approved — Stage 1 is now available.{' '}
            <Link href={`/projects/${slug}/charter`} className="underline hover:text-green-300">
              View Charter
            </Link>
          </div>
        )}

        {/* Stage pipeline */}
        <div className="mb-8">
          <p className="text-xs text-gray-600 uppercase tracking-widest mb-3">Build Pipeline</p>
          <CbccStagePipeline project={project} stages={stages} />
        </div>

        {!project.charterApproved && (
          <Link
            href={`/projects/${slug}/charter`}
            data-action="go-to-charter"
            className="inline-block px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded transition-colors"
          >
            {project.charterJson ? 'Review & Approve Charter' : 'Generate Charter'}
          </Link>
        )}
      </div>
    </div>
  )
}
