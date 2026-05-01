import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getProjectBySlug, getProjectStages } from '@/lib/cb-control-center/cbccProjectRepository'
import {
  buildDapStageGate,
  buildGenericStageGate,
} from '@/lib/cb-control-center/cbccProjectStageAdapter'
import { StageDetailPage } from '@/components/cb-control-center/StageDetailPage'
import { DeferredApprovalGate } from '@/components/cb-control-center/DeferredApprovalGate'

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
  const project = await getProjectBySlug(slug)
  if (!project) return { title: 'Project Not Found — CB Control Center' }

  if (slug === DAP_SLUG) {
    const gate = buildDapStageGate(n)
    if (gate) return { title: `${gate.title} — ${project.name} | CB Control Center` }
  }

  return { title: `Stage ${n} — ${project.name} | CB Control Center` }
}

export default async function ProjectStageDetailRoute({ params }: { params: Params }) {
  const { slug, stageNumber } = await params
  const n = parseStageNumber(stageNumber)
  if (!n) notFound()

  const project = await getProjectBySlug(slug)
  if (!project) notFound()

  const stages = await getProjectStages(project.id)
  const row = stages.find(s => s.stageNumber === n)
  if (!row) notFound()

  const stage = slug === DAP_SLUG
    ? buildDapStageGate(n)
    : buildGenericStageGate(project, row)

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

  return (
    <>
      <StageDetailPage
        stage={stage}
        breadcrumbBase={breadcrumbBase}
        breadcrumbTrail={trail}
        nextStageHref={(next) => `${breadcrumbBase}/stages/${next.stageNumber}`}
      />
      {!isDap && (
        <div className="max-w-4xl mx-auto px-6 -mt-6 pb-10">
          <DeferredApprovalGate />
        </div>
      )}
    </>
  )
}
