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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-2">
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">
            ← Project Registry
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">{project.name}</h1>
          <p data-project-status className="mt-1 text-sm text-gray-500">
            Step 0: {STATUS_LABEL[project.projectStatus] ?? project.projectStatus}
          </p>
        </div>

        {!project.charterApproved && (
          <div
            data-blocker-message
            className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800"
          >
            <strong>Blocked:</strong> Step 0 Project Charter requires owner approval before Stage 1
            can begin.{' '}
            <Link
              href={`/projects/${slug}/charter`}
              className="underline hover:text-amber-900"
            >
              Review Charter
            </Link>
          </div>
        )}

        {project.charterApproved && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded text-sm text-green-800">
            Charter Approved — Stage 1 is now available.{' '}
            <Link href={`/projects/${slug}/charter`} className="underline hover:text-green-900">
              View Charter
            </Link>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Build Pipeline</h2>
          <CbccStagePipeline project={project} stages={stages} />
        </div>

        {!project.charterApproved && (
          <Link
            href={`/projects/${slug}/charter`}
            data-action="go-to-charter"
            className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700"
          >
            {project.charterJson ? 'Review & Approve Charter' : 'Generate Charter'}
          </Link>
        )}
      </div>
    </div>
  )
}
