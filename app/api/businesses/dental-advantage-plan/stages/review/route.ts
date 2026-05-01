export const dynamic = 'force-dynamic'

import { getDapStageGateBySlug } from '@/lib/cb-control-center/dapStageGates'
import { reviewStage } from '@/lib/cb-control-center/dapStageReviewer'

export async function POST(request: Request): Promise<Response> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const stageSlug = (body as Record<string, unknown>)?.stageSlug
  if (typeof stageSlug !== 'string' || !stageSlug) {
    return Response.json({ error: 'stageSlug is required' }, { status: 400 })
  }

  const stage = getDapStageGateBySlug(stageSlug)
  if (!stage) {
    return Response.json({ error: `Stage not found: ${stageSlug}` }, { status: 404 })
  }

  const review = await reviewStage(stage)
  return Response.json(review)
}
