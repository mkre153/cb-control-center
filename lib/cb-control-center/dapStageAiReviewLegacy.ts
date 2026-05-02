// CBCC legacy compatibility — DAP stage AI review shape conversion
// (Part 18 — boundary decomposition).
//
// This module owns the pure mapping between the legacy DAP reviewer's
// `StageAiReview` shape and the generic engine's raw input shape that
// `normalizeCbccAiReviewResult` (in `lib/cbcc/aiReview.ts`) accepts.
//
// It is intentionally separate from `cbccAnthropicAiReviewProvider.ts` so
// that:
//   - the Anthropic-boundary provider only owns transport / harvest
//   - the legacy↔engine shape conversion is testable in isolation
//   - swapping the AI provider in the future doesn't require touching the
//     mapping, and changing the mapping doesn't require touching transport
//
// Architecture invariants:
//
//   - Pure: no Anthropic SDK, no Supabase, no Next/React, no IO.
//   - Allowed to import the legacy `StageAiReview` type from
//     `dapStageReviewer.ts` because that's where the legacy UI shape lives.
//   - Not imported by `lib/cbcc/...` or by `lib/cbcc/adapters/dap/...`.
//   - No persistence, no approval mutation, no stage state writes.

import type { StageAiReview } from './dapStageReviewer'

// ─── Mapping options ─────────────────────────────────────────────────────────

export interface LegacyToEngineMappingOptions {
  // Optional model identifier passed through to normalize. Defaults to the
  // legacy reviewer's model. Callers may override for testing.
  model?: string
  // Optional promptVersion for auditability — purely informational.
  promptVersion?: string
}

// ─── Legacy ↔ engine raw mapping ──────────────────────────────────────────────
//
// Pure mapping function. Translates the legacy reviewer's output shape into
// a raw object the generic engine's `normalizeCbccAiReviewResult` can accept.
// Unknown fields are ignored by normalize.
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
//     normalize step doesn't trip its required-field rules.

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
