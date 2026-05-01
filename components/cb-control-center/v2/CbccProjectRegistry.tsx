import Link from 'next/link'
import type { CbccProject } from '@/lib/cb-control-center/cbccProjectTypes'

interface Props {
  projects: CbccProject[]
}

const STATUS_LABEL: Record<CbccProject['projectStatus'], string> = {
  step_0_draft:         'Charter Draft',
  step_0_charter_ready: 'Charter Ready for Owner Approval',
  step_0_approved:      'Charter Approved',
  in_progress:          'In Progress',
  completed:            'Completed',
  archived:             'Archived',
}

export function CbccProjectRegistry({ projects }: Props) {
  return (
    <div data-cbcc-project-registry className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Project Registry</h1>
            <p className="mt-1 text-sm text-gray-500">
              Each project must complete Step 0 — Project Charter — before any build stage can begin.
            </p>
          </div>
          <Link
            href="/projects/new"
            data-action="create-project"
            className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700"
          >
            Create Project
          </Link>
        </div>

        {projects.length === 0 ? (
          <div data-empty-state className="text-center py-20 border border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-400 text-sm">No projects yet.</p>
            <p className="mt-2 text-gray-400 text-sm">
              Create your first project to begin the governance workflow.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {projects.map(project => (
              <li key={project.id}>
                <Link
                  href={`/projects/${project.slug}`}
                  className="block p-5 bg-white border border-gray-200 rounded-lg hover:border-gray-400"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{project.name}</span>
                    <span className="text-xs text-gray-400">
                      {STATUS_LABEL[project.projectStatus]}
                    </span>
                  </div>
                  {project.approvalOwner && (
                    <p className="mt-1 text-xs text-gray-400">
                      Owner: {project.approvalOwner}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
