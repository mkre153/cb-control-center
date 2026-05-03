import { CbccNav } from '@/components/cb-control-center/v2/CbccNav'
import { CbccProjectWorkspaceLeft } from '@/components/cb-control-center/v2/CbccProjectWorkspaceLeft'
import { CbccAiChatPanel } from '@/components/cb-control-center/v2/CbccAiChatPanel'
import { CbccProjectPipelinePanel } from '@/components/cb-control-center/v2/CbccProjectPipelinePanel'
import { listProjects } from '@/lib/cb-control-center/cbccProjectRepository'
import { mergeProjectsWithEngineBacked } from '@/lib/cb-control-center/cbccEngineRegistry'

export default async function CBControlCenterHomePage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>
}) {
  const { project: selectedSlug } = await searchParams
  const supabaseProjects = await listProjects().catch(() => [])
  const projects = mergeProjectsWithEngineBacked(supabaseProjects)

  return (
    <div className="h-screen bg-gray-950 font-sans text-gray-300 flex flex-col overflow-hidden">
      <CbccNav />
      <div className="flex flex-1 overflow-hidden">

        {/* Left — project list */}
        <div className="w-56 shrink-0 border-r border-gray-800 flex flex-col overflow-y-auto">
          <CbccProjectWorkspaceLeft projects={projects} selectedSlug={selectedSlug ?? null} />
        </div>

        {/* Center — AI chat */}
        <div className="w-[380px] shrink-0 border-r border-gray-800 flex flex-col">
          <CbccAiChatPanel projectSlug={selectedSlug ?? null} />
        </div>

        {/* Right — pipeline (Step 0 + stages 1–7) */}
        <div className="flex-1 min-w-0 overflow-y-auto px-8 py-6">
          {selectedSlug ? (
            <CbccProjectPipelinePanel slug={selectedSlug} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-gray-500 text-sm">Select a project to view its pipeline.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
