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

function avatarLetter(name: string): string {
  return name.trim().charAt(0).toUpperCase()
}

export function CbccProjectRegistry({ projects }: Props) {
  return (
    <div data-cbcc-project-registry className="min-h-screen bg-[#0d1117] font-mono text-gray-300">
      {/* Nav bar */}
      <nav className="border-b border-[#1e2d45] px-6 py-3 flex items-center justify-between">
        <span className="text-blue-400 font-semibold tracking-tight">CB Control Center</span>
        <Link
          href="/projects/new"
          data-action="create-project"
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded transition-colors"
        >
          + New Project
        </Link>
      </nav>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-gray-100">Projects</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your governed build projects
          </p>
        </div>

        {projects.length === 0 ? (
          <div
            data-empty-state
            className="border border-dashed border-[#1e2d45] rounded-lg py-20 text-center"
          >
            <p className="text-gray-600 text-sm">No projects yet.</p>
            <p className="mt-1 text-gray-600 text-sm">
              Create your first project to begin the governance workflow.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(project => {
              const pct = progressPct(project.projectStatus)
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.slug}`}
                  className="block bg-[#161b27] border border-[#1e2d45] rounded-lg p-5 hover:border-blue-800 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded bg-blue-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {avatarLetter(project.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-gray-100 font-medium text-sm truncate">{project.name}</p>
                      {project.approvalOwner && (
                        <p className="text-gray-500 text-xs truncate">{project.approvalOwner}</p>
                      )}
                    </div>
                  </div>
                  {project.businessType && (
                    <p className="text-gray-500 text-xs mb-3 truncate">{project.businessType}</p>
                  )}
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-gray-500">{STATUS_LABEL[project.projectStatus]}</span>
                    <span className="text-gray-500">{pct}% complete</span>
                  </div>
                  <div className="w-full bg-[#1e2d45] rounded-full h-1">
                    <div
                      className="bg-blue-500 h-1 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
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
