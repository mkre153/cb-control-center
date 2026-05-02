export const dynamic = 'force-dynamic'

// DAP-scoped Opus 4.7 stage review route.
//
// Body shape (all fields optional except either stageSlug OR stageNumber):
//   {
//     projectSlug?: string    // when present, must equal "dental-advantage-plan"
//     stageSlug?:   string    // legacy DAP slug, e.g. "3-truth-schema"
//     stageNumber?: number    // 1–7 — used when stageSlug is missing/numeric
//   }
//
// Resolution order:
//   1. If projectSlug is provided and is not the DAP slug → 404.
//      (Generic v2 projects must not accidentally hit DAP-only review logic.)
//   2. Try stageSlug → getDapStageGateBySlug.
//   3. If that fails and stageNumber is a valid 1–7 integer → getDapStageGateByNumber.
//   4. Otherwise 404.
//
// Returns advisory JSON only. No persistence. No mutation. No approval coupling.

import {
  getDapStageGateBySlug,
  getDapStageGateByNumber,
} from '@/lib/cb-control-center/dapStageGates'
import { reviewStage } from '@/lib/cb-control-center/dapStageReviewer'

const DAP_PROJECT_SLUG = 'dental-advantage-plan'

function parseStageNumber(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isInteger(raw) && raw >= 1 && raw <= 7) return raw
  if (typeof raw === 'string' && /^[1-7]$/.test(raw)) return Number(raw)
  return null
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const obj = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>
  const projectSlug = obj.projectSlug
  const stageSlug = obj.stageSlug
  const stageNumber = parseStageNumber(obj.stageNumber)

  if (typeof projectSlug === 'string' && projectSlug && projectSlug !== DAP_PROJECT_SLUG) {
    return Response.json(
      { error: `AI review for project "${projectSlug}" is not yet supported.` },
      { status: 404 },
    )
  }

  const hasStageSlug = typeof stageSlug === 'string' && stageSlug.length > 0
  if (!hasStageSlug && stageNumber === null) {
    return Response.json({ error: 'stageSlug or stageNumber is required' }, { status: 400 })
  }

  let stage = hasStageSlug ? getDapStageGateBySlug(stageSlug as string) : undefined
  if (!stage && stageNumber !== null) {
    stage = getDapStageGateByNumber(stageNumber)
  }

  if (!stage) {
    const ref = hasStageSlug ? (stageSlug as string) : `#${stageNumber}`
    return Response.json({ error: `Stage not found: ${ref}` }, { status: 404 })
  }

  const review = await reviewStage(stage)
  return Response.json(review)
}
