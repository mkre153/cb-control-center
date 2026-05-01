import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  getDapStageGateBySlug,
  DAP_STAGE_SLUGS,
} from '@/lib/cb-control-center/dapStageGates'
import { StageDetailPage } from '@/components/cb-control-center/StageDetailPage'

type Params = Promise<{ stageSlug: string }>

export function generateStaticParams() {
  return DAP_STAGE_SLUGS.map(slug => ({ stageSlug: slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { stageSlug } = await params
  const stage = getDapStageGateBySlug(stageSlug)
  if (!stage) return { title: 'Stage Not Found' }
  return {
    title: `${stage.title} — DAP Build Pipeline | CB Control Center`,
  }
}

export default async function StageDetailRoute({ params }: { params: Params }) {
  const { stageSlug } = await params
  const stage = getDapStageGateBySlug(stageSlug)
  if (!stage) notFound()
  return <StageDetailPage stage={stage} />
}
