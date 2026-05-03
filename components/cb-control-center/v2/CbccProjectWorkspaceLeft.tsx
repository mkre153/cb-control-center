import Link from 'next/link'
import type { CbccProject } from '@/lib/cb-control-center/cbccProjectTypes'
import { PROJECT_STATUS_LABEL, projectProgressPct } from '@/lib/cb-control-center/cbccProjectLabels'
import { CbccProjectIntakeForm } from './CbccProjectIntakeForm'

interface Props {
  projects: CbccProject[]
  selectedSlug: string | null
}

export function CbccProjectWorkspaceLeft({ projects, selectedSlug }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-4 border-b border-gray-800">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Projects</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {projects.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">No projects yet.</div>
        ) : (
          <ul className="py-2">
            {projects.map(project => {
              const isSelected = project.slug === selectedSlug
              const pct = projectProgressPct(project.projectStatus)
              return (
                <li key={project.id}>
                  <Link
                    href={`/?project=${project.slug}`}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-800/60 ${
                      isSelected ? 'bg-gray-800 border-r-2 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-sm font-bold text-white flex-shrink-0">
                      {project.name.trim().charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{project.name}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {PROJECT_STATUS_LABEL[project.projectStatus]} · {pct}%
                      </p>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-gray-800">
        <details>
          <summary className="px-4 py-3 text-sm text-blue-400 hover:text-blue-300 cursor-pointer list-none">
            + New Project
          </summary>
          <div className="px-3 pb-4 pt-2">
            <CbccProjectIntakeForm inline />
          </div>
        </details>
      </div>
    </div>
  )
}
