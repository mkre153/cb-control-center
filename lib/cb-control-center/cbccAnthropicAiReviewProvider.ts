// CBCC runtime provider — Anthropic-backed AI review for DAP stages
// (Part 17 — provider-port migration).
//
// This file is the boundary between the generic CBCC AI review port
// (`lib/cbcc/aiReviewProvider.ts`) and the legacy DAP-specific reviewer
// (`lib/cb-control-center/dapStageReviewer.ts`). It deliberately lives in
// `lib/cb-control-center/` because:
//
//   - It indirectly drives a real Anthropic SDK call (via `reviewStage`).
//   - Its input shape is DAP-specific (`DapStageGate`).
//   - Its output passes through both the generic engine port AND a legacy
//     UI-shape harvester so the existing UI panel keeps working unchanged.
//
// The generic engine never imports this file. The DAP adapter purity zone
// (`lib/cbcc/adapters/dap/`) never imports this file either. Routes import
// the factory below, which produces a single-shot `CbccAiReviewProvider`
// for one (gate, packet) pair.
//
// Architecture invariants (asserted by Part 17 boundary tests):
//
//   - This module is allowed to import `dapStageReviewer.ts`.
//   - This module is allowed to import the engine port from `@/lib/cbcc/...`.
//   - This module is NOT allowed to be imported by `lib/cbcc/...` or by
//     `lib/cbcc/adapters/dap/...`.
//   - This module performs no persistence and no approval mutation.

import type { CbccAiReviewProvider } from '@/lib/cbcc/aiReviewProvider'
import type { CbccAiReviewPromptPacket } from '@/lib/cbcc/types'
import type { DapStageGate } from './dapStageGates'
import { reviewStage, type StageAiReview } from './dapStageReviewer'

// ─── Legacy ↔ engine raw mapping ──────────────────────────────────────────────
//
// Pure mapping function. Translates the legacy reviewer's output shape into
// a raw object the generic engine's `normalizeCbccAiReviewResult` can accept.
// Unknown fields are ignored by normalize; we use that to passthrough the
// legacy review object via `_legacy` for callers that need UI-shape compat.
//
// The mapping is deliberately conservative:
//   - 'approve'           → decision 'pass',                action 'proceed_to_owner_review'
//   - 'request_revision'  → decision 'pass_with_concerns',  action 'address_risks'
//   - 'disapprove'        → decision 'fail',                action 'revise_artifact'
//   - confidence          → severity used for derived risks (high/medium/low)
//   - failed checklist    → engine risks (one per failed item)
//
// Edge cases:
//   - empty `reasoning` falls back to a synthetic non-empty summary so the
//     normalize step doesn't trip.

export interface LegacyToEngineMappingOptions {
  // Optional model identifier passed through to normalize. Defaults to the
  // legacy reviewer's model. Callers may override for testing.
  model?: string
  // Optional promptVersion for auditability — purely informational.
  promptVersion?: string
}

export function legacyReviewToEngineRaw(
  legacy: StageAiReview,
  options: LegacyToEngineMappingOptions = {},
): Record<string, unknown> {
  const decision = (() => {
    switch (legacy.recommendation) {
      case 'approve':           return 'pass'
      case 'disapprove':        return 'fail'
      case 'request_revision':  return 'pass_with_concerns'
      default:                  return 'pass_with_concerns'
    }
  })()

  const action = (() => {
    switch (legacy.recommendation) {
      case 'approve':           return 'proceed_to_owner_review'
      case 'disapprove':        return 'revise_artifact'
      case 'request_revision':  return 'address_risks'
      default:                  return 'address_risks'
    }
  })()

  const severity = (() => {
    switch (legacy.confidence) {
      case 'high':    return 'high'
      case 'medium':  return 'medium'
      case 'low':     return 'low'
      default:        return 'low'
    }
  })()

  const summary = (legacy.reasoning ?? '').trim()
    || `Advisory ${legacy.recommendation} with ${legacy.confidence} confidence.`

  const rationale = (legacy.reasoning ?? '').trim()
    || `Advisory ${legacy.recommendation} (mapped from legacy DAP reviewer).`

  const risks = legacy.checklistResults
    .filter(c => !c.passed)
    .map((c, i) => ({
      id: `checklist-${i + 1}`,
      severity,
      message: c.note ? `${c.criterion} — ${c.note}` : c.criterion,
    }))

  return {
    decision,
    summary,
    recommendation: { action, rationale },
    risks,
    model: options.model ?? 'claude-opus-4-7',
    promptVersion: options.promptVersion,
  }
}

// ─── Provider implementation ──────────────────────────────────────────────────
//
// The provider is single-shot per request:
//   - constructed with a `DapStageGate`
//   - `review(packet)` calls `reviewStage(gate)` exactly once and stores the
//     legacy result for the route to harvest
//   - `consumeLastLegacy()` returns the stored legacy result and clears it
//
// The route is expected to:
//   1. await runCbccAiReview({ packet, provider })   (engine-port roundtrip)
//   2. const legacy = provider.consumeLastLegacy()   (UI-shape harvester)
//   3. return Response.json(legacy)                  (UI compat)

export interface DapAnthropicAiReviewProvider extends CbccAiReviewProvider {
  consumeLastLegacy(): StageAiReview | null
}

export interface CreateDapAnthropicAiReviewProviderOptions {
  // Allows tests to inject a stand-in for `reviewStage` without touching the
  // module's export wiring. Production callers omit this and the provider
  // uses the imported `reviewStage`.
  reviewStageFn?: (gate: DapStageGate) => Promise<StageAiReview>
  // Allows tests to override the engine model identifier surfaced via
  // `legacyReviewToEngineRaw`.
  model?: string
  promptVersion?: string
}

export function createDapAnthropicAiReviewProvider(
  gate: DapStageGate,
  options: CreateDapAnthropicAiReviewProviderOptions = {},
): DapAnthropicAiReviewProvider {
  let lastLegacy: StageAiReview | null = null
  const fn = options.reviewStageFn ?? reviewStage

  return {
    async review(_packet: CbccAiReviewPromptPacket): Promise<unknown> {
      // The packet's stageId is informational here — the legacy reviewer's
      // contract takes a full DapStageGate, which the route resolves up
      // front. We deliberately do not look up the gate from the packet to
      // avoid introducing a second resolution path.
      const legacy = await fn(gate)
      lastLegacy = legacy
      return legacyReviewToEngineRaw(legacy, {
        model: options.model,
        promptVersion: options.promptVersion,
      })
    },
    consumeLastLegacy(): StageAiReview | null {
      const r = lastLegacy
      lastLegacy = null
      return r
    },
  }
}
