import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getProjectBySlug, getProjectStages } from '@/lib/cb-control-center/cbccProjectRepository'
import { CbccStagePipeline } from '@/components/cb-control-center/v2/CbccStagePipeline'
import { CbccNav } from '@/components/cb-control-center/v2/CbccNav'
import { NextAllowedActionCard } from '@/components/cb-control-center/NextAllowedActionCard'
import { isEngineBackedSlug } from '@/lib/cb-control-center/cbccEngineRegistry'
import { translateDapProjectForPipeline } from '@/lib/cb-control-center/cbccProjectPipelineTranslator'
import { getDapStageApprovalStore } from '@/lib/cb-control-center/dapStageApprovalStore'
import { getNextAllowedAction, type CbccNextAllowedAction } from '@/lib/cbcc/index'
import {
  DAP_PROJECT,
  DAP_PROJECT_ID,
  DAP_STAGE_DEFINITIONS,
  DAP_STAGE_REQUIRED_EVIDENCE,
  buildDapApprovalEvidenceLedger,
  getDapStageEvidenceRequirements,
} from '@/lib/cbcc/adapters/dap'
import { buildDapEffectiveProject } from '@/lib/cb-control-center/dapStageStateResolver'

function buildDapNextAllowedAction(
  persistedApprovals: Awaited<ReturnType<ReturnType<typeof getDapStageApprovalStore>['list']>>,
): CbccNextAllowedAction {
  const effectiveProject = buildDapEffectiveProject(DAP_PROJECT, persistedApprovals)
  const evidenceRequirementsByStage: Record<string, ReturnType<typeof getDapStageEvidenceRequirements>> = {}
  for (const def of DAP_STAGE_DEFINITIONS) {
    evidenceRequirementsByStage[def.id] = getDapStageEvidenceRequirements(def.order)
  }
  // Sanity-touch the export so static-analysis can confirm it's used here
  // and not via a string lookup elsewhere (helps refactors stay correct).
  void DAP_STAGE_REQUIRED_EVIDENCE
  return getNextAllowedAction({
    project: effectiveProject,
    stageDefinitions: DAP_STAGE_DEFINITIONS,
    evidenceRequirementsByStage,
    evidenceLedger: buildDapApprovalEvidenceLedger({ projectId: DAP_PROJECT_ID }),
  })
}

function buildDapStageTitleByNumber(): Readonly<Record<number, string>> {
  const titles: Record<number, string> = {}
  for (const def of DAP_STAGE_DEFINITIONS) {
    titles[def.order] = def.title
  }
  return titles
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // Engine-backed projects (currently DAP only) hydrate from the generic
  // adapter and overlay any persisted owner approvals from the store. Other
  // slugs keep the existing Supabase-backed path.
  let project, stages
  let nextAction: CbccNextAllowedAction | null = null
  let stageTitleByNumber: Readonly<Record<number, string>> = {}
  if (isEngineBackedSlug(slug)) {
    const persistedApprovals = await getDapStageApprovalStore().list().catch(() => [])
    const bundle = translateDapProjectForPipeline({ persistedApprovals })
    project = bundle.project
    stages = bundle.stages
    nextAction = buildDapNextAllowedAction(persistedApprovals)
    stageTitleByNumber = buildDapStageTitleByNumber()
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

        {nextAction && (
          <div className="mb-6">
            <NextAllowedActionCard action={nextAction} stageTitleByNumber={stageTitleByNumber} />
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
