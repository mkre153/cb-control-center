import { CbccNav } from '@/components/cb-control-center/v2/CbccNav'
import { CbccWorkspaceLayout } from '@/components/cb-control-center/v2/CbccWorkspaceLayout'
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

  const rightPanel = selectedSlug ? (
    <CbccProjectPipelinePanel slug={selectedSlug} />
  ) : (
    <div className="flex flex-col items-center justify-center h-full">
      <p className="text-gray-500 text-sm">Select a project to view its pipeline.</p>
    </div>
  )

  return (
    <div className="h-screen bg-gray-950 font-sans text-gray-300 flex flex-col overflow-hidden">
      <CbccNav />
      <CbccWorkspaceLayout
        leftPanel={
          <CbccProjectWorkspaceLeft projects={projects} selectedSlug={selectedSlug ?? null} />
        }
        centerPanel={<CbccAiChatPanel projectSlug={selectedSlug ?? null} />}
        rightPanel={rightPanel}
      />
    </div>
  )
}
