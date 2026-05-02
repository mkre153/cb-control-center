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
//
// Part 17 — provider-port migration:
//   The route now flows through the generic CBCC engine port
//   (`runCbccAiReview`) rather than calling the legacy DAP reviewer directly.
//   The runtime provider lives in `lib/cb-control-center/` (it is allowed to
//   reach the SDK) and translates the legacy reviewer's output into the
//   engine's normalized shape. The route then asks the provider for the
//   captured legacy result and returns that to the UI so the existing
//   StageAiReviewPanel renders unchanged.

import {
  getDapStageGateBySlug,
  getDapStageGateByNumber,
} from '@/lib/cb-control-center/dapStageGates'
import type { StageAiReview } from '@/lib/cb-control-center/dapStageReviewer'
import { createDapAnthropicAiReviewProvider } from '@/lib/cb-control-center/cbccAnthropicAiReviewProvider'
import { runCbccAiReview } from '@/lib/cbcc/aiReviewProvider'
import { buildCbccAiReviewPromptPacket } from '@/lib/cbcc/aiReview'
import {
  DAP_PROJECT_ID,
  DAP_STAGE_DEFINITIONS,
} from '@/lib/cbcc/adapters/dap'

const DAP_PROJECT_SLUG = 'dental-advantage-plan'

// Guardrails passed through to the engine packet. The legacy reviewer ignores
// the packet (its prompt is gate-driven), but the engine port still requires
// guardrails on the packet shape; we surface the same advisory-only invariant
// the rest of CBCC enforces.
const DAP_REVIEW_GUARDRAILS: ReadonlyArray<string> = [
  'Advisory only — never approve, reject, or unlock a stage.',
  'Do not propose changes to evidence or approvals; recommend owner review only.',
]

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

  // Map the DAP gate's stageNumber (1–7) onto the engine's stable stage id
  // ('definition', 'discovery', …). The adapter is the single source of truth
  // for this mapping; if it ever drifts, packet construction fails fast here
  // rather than silently producing a packet pointed at the wrong stage.
  const stageDef = DAP_STAGE_DEFINITIONS.find(d => d.order === stage!.stageNumber)
  if (!stageDef) {
    return Response.json(
      { error: `Engine stage definition not found for stage ${stage.stageNumber}` },
      { status: 500 },
    )
  }

  const packet = buildCbccAiReviewPromptPacket({
    projectId: DAP_PROJECT_ID,
    stageId: stageDef.id,
    stageTitle: stageDef.title,
    stageDescription: stageDef.description,
    stagePurpose: stageDef.purpose,
    evidenceLedger: [],
    evidenceRequirements: [],
    guardrails: DAP_REVIEW_GUARDRAILS,
  })

  const provider = createDapAnthropicAiReviewProvider(stage)

  try {
    await runCbccAiReview({ packet, provider })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return Response.json({ error: `AI review failed: ${message}` }, { status: 502 })
  }

  const legacy: StageAiReview | null = provider.consumeLastLegacy()
  if (!legacy) {
    return Response.json({ error: 'AI review produced no result' }, { status: 502 })
  }

  return Response.json(legacy)
}
