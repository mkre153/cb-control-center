import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getProjectBySlug, getProjectStages } from '@/lib/cb-control-center/cbccProjectRepository'
import { buildGenericStageGate } from '@/lib/cb-control-center/cbccProjectStageAdapter'
import { isEngineBackedSlug } from '@/lib/cb-control-center/cbccEngineRegistry'
import { buildDapStageGateFromEngine } from '@/lib/cb-control-center/cbccStagePageModelTranslator'
import { translateDapProjectForPipeline } from '@/lib/cb-control-center/cbccProjectPipelineTranslator'
import { getDapStageApprovalStore } from '@/lib/cb-control-center/dapStageApprovalStore'
import { resolveDapStageOverrides } from '@/lib/cb-control-center/dapStageStateResolver'
import { StageDetailPage } from '@/components/cb-control-center/StageDetailPage'
import { DeferredApprovalGate } from '@/components/cb-control-center/DeferredApprovalGate'
import { DapStageOwnerApprovalForm } from '@/components/cb-control-center/DapStageOwnerApprovalForm'
import { DAP_PROJECT } from '@/lib/cbcc/adapters/dap'

const DAP_SLUG = 'dental-advantage-plan'

type Params = Promise<{ slug: string; stageNumber: string }>

function parseStageNumber(raw: string): number | null {
  const n = Number(raw)
  if (!Number.isInteger(n) || n < 1 || n > 7) return null
  return n
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, stageNumber } = await params
  const n = parseStageNumber(stageNumber)
  if (!n) return { title: 'Stage Not Found — CB Control Center' }

  if (slug === DAP_SLUG) {
    const bundle = translateDapProjectForPipeline()
    const gate = buildDapStageGateFromEngine(n)
    if (gate) return { title: `${gate.title} — ${bundle.project.name} | CB Control Center` }
    return { title: `Stage ${n} — ${bundle.project.name} | CB Control Center` }
  }

  const project = await getProjectBySlug(slug)
  if (!project) return { title: 'Project Not Found — CB Control Center' }

  return { title: `Stage ${n} — ${project.name} | CB Control Center` }
}

export default async function ProjectStageDetailRoute({ params }: { params: Params }) {
  const { slug, stageNumber } = await params
  const n = parseStageNumber(stageNumber)
  if (!n) notFound()

  // Engine-backed projects (currently DAP only) hydrate from the generic
  // adapter via the page-model translator, with persisted owner approvals
  // overlaid on top. All other slugs keep the existing Supabase-backed path.
  let project, stage
  let persistedApprovalsForDap: Awaited<ReturnType<ReturnType<typeof getDapStageApprovalStore>['list']>> = []
  if (isEngineBackedSlug(slug)) {
    persistedApprovalsForDap = await getDapStageApprovalStore().list().catch(() => [])
    const bundle = translateDapProjectForPipeline({ persistedApprovals: persistedApprovalsForDap })
    project = bundle.project
    const overrides = resolveDapStageOverrides(DAP_PROJECT, persistedApprovalsForDap)
    stage = buildDapStageGateFromEngine(n, {
      stageStatusOverrides: overrides.stageStatusOverrides,
      approvalOverrides: overrides.approvalOverrides,
    })
  } else {
    project = await getProjectBySlug(slug)
    if (!project) notFound()
    const stages = await getProjectStages(project.id)
    const row = stages.find(s => s.stageNumber === n)
    if (!row) notFound()
    stage = buildGenericStageGate(project, row)
  }

  if (!stage) notFound()

  const breadcrumbBase = `/projects/${slug}`
  const trail = [
    { label: 'CB Control Center', href: '/' },
    { label: project.name, href: breadcrumbBase },
    { label: 'Build Pipeline', href: breadcrumbBase },
  ]

  // Generic v2 projects: deferred-approval gate copy (no per-stage approval
  // action wired yet). DAP keeps v1's git-commit approval pattern, which is
  // already shown by StageApprovalChecklist for awaiting/approved states.
  const isDap = slug === DAP_SLUG

  // Owner approval form for engine-backed DAP — rendered when the stage is
  // unlocked (no blockers) and not yet approved. The form posts to
  // approveDapStageAction; on success Next revalidates the affected paths.
  const showDapApprovalForm =
    isDap && stage.blockers.length === 0 && !stage.approvedByOwner

  return (
    <>
      <StageDetailPage
        stage={stage}
        breadcrumbBase={breadcrumbBase}
        breadcrumbTrail={trail}
        nextStageHref={(next) => `${breadcrumbBase}/stages/${next.stageNumber}`}
      />
      {showDapApprovalForm && (
        <div className="max-w-4xl mx-auto px-6 -mt-6 pb-10">
          <DapStageOwnerApprovalForm stageNumber={n} stageTitle={stage.title} />
        </div>
      )}
      {!isDap && (
        <div className="max-w-4xl mx-auto px-6 -mt-6 pb-10">
          <DeferredApprovalGate />
        </div>
      )}
    </>
  )
}
