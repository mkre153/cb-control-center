import Link from 'next/link'
import type { CbccProject } from '@/lib/cb-control-center/cbccProjectTypes'

interface Props {
  projects: CbccProject[]
}

const STATUS_LABEL: Record<CbccProject['projectStatus'], string> = {
  step_0_draft:         'Charter Draft',
  step_0_charter_ready: 'Awaiting Approval',
  step_0_approved:      'Stage 1 Available',
  in_progress:          'In Progress',
  completed:            'Completed',
  archived:             'Archived',
}

function progressPct(status: CbccProject['projectStatus']): number {
  switch (status) {
    case 'step_0_draft':         return 0
    case 'step_0_charter_ready': return 10
    case 'step_0_approved':      return 15
    case 'in_progress':          return 50
    case 'completed':            return 100
    case 'archived':             return 100
  }
}

export function CbccProjectRegistry({ projects }: Props) {
  return (
    <div data-cbcc-project-registry className="min-h-screen bg-gray-950 font-sans text-gray-300">
      {/* Nav bar */}
      <nav className="border-b border-gray-800 px-6 py-3 flex items-center justify-between bg-gray-900">
        <span className="text-blue-400 font-semibold tracking-tight">CB Control Center</span>
        <Link
          href="/projects/new"
          data-action="create-project"
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
        >
          + New Project
        </Link>
      </nav>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Projects</h1>
            <p className="text-sm text-gray-400">Manage your governed build projects</p>
          </div>
        </div>

        {projects.length === 0 ? (
          <div
            data-empty-state
            className="rounded-lg border border-gray-800 bg-gray-900 flex flex-col items-center justify-center py-16 text-center"
          >
            <p className="text-gray-400">No projects yet. Create your first one.</p>
            <Link
              href="/projects/new"
              className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              + New Project
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map(project => {
              const pct = progressPct(project.projectStatus)
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.slug}`}
                  className="block rounded-lg border border-gray-800 bg-gray-900 transition-colors hover:border-gray-700"
                >
                  <div className="px-5 pt-5 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white flex-shrink-0">
                        {project.name.trim().charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-white truncate">{project.name}</p>
                        <p className="text-xs text-gray-400 truncate">
                          {project.approvalOwner || project.businessType || '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="px-5 pb-5">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-400">{STATUS_LABEL[project.projectStatus]}</span>
                      <span className="text-gray-500">{pct}% complete</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-800">
                      <div
                        className="h-1.5 rounded-full bg-blue-600 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
