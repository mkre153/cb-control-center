// CBCC runtime provider — Anthropic-backed AI review for DAP stages
// (Part 17 — provider-port migration; Part 18 — mapper extracted).
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
// Part 18 split: pure shape conversion now lives in
// `dapStageAiReviewLegacy.ts`. This file owns transport + harvest only.
//
// Architecture invariants (asserted by Part 17 / Part 18 boundary tests):
//
//   - This module is allowed to import `dapStageReviewer.ts` and
//     `dapStageAiReviewLegacy.ts`.
//   - This module is allowed to import the engine port from `@/lib/cbcc/...`.
//   - This module is NOT allowed to be imported by `lib/cbcc/...` or by
//     `lib/cbcc/adapters/dap/...`.
//   - This module performs no persistence and no approval mutation.

import type { CbccAiReviewProvider } from '@/lib/cbcc/aiReviewProvider'
import type { CbccAiReviewPromptPacket } from '@/lib/cbcc/types'
import type { DapStageGate } from './dapStageGates'
import { reviewStage, type StageAiReview } from './dapStageReviewer'
import { legacyReviewToEngineRaw } from './dapStageAiReviewLegacy'

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
