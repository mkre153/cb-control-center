import { validateDapCmsSourceBundle } from './source/dapSourceValidation'
import { buildDapCmsSnapshotFromSource } from './source/dapSourceAdapter'
import { runClaimQA } from './dapClaimQA'
import type { DapCmsSourceBundle } from './source/dapSourceTypes'
import type { DapCmsSnapshot } from '../dap/site/dapCmsTypes'
import type { DapSourceValidationResult } from './source/dapSourceValidation'
import type { QASummary } from './dapClaimQA'

// ─── Publishing result type ───────────────────────────────────────────────────

export interface DapPublishingResult {
  ok: boolean                          // true only when validation has zero errors AND QA has zero warnings
  snapshot: DapCmsSnapshot | null      // null when validation errors block snapshot generation
  validation: DapSourceValidationResult
  qa: QASummary | null                 // null when validation blocked snapshot generation
}

// ─── Publishing pipeline ──────────────────────────────────────────────────────
//
// Three-stage pipeline:
//   1. Structural validation — blocks on errors, warns on issues but continues
//   2. Source-to-CMS adapter — transforms source records into gated CMS records
//   3. Claim QA — scans public output for unsafe claim leakage
//
// ok === true only when both validation errors === 0 AND QA warnings === 0.
// A bundle with validation warnings only still flows through the adapter and QA.
// A bundle with validation errors is blocked at stage 1 — no snapshot is built.

export function buildValidatedDapCmsSnapshotFromSource(
  bundle: DapCmsSourceBundle,
): DapPublishingResult {
  const validation = validateDapCmsSourceBundle(bundle)

  // Stage 1: block on structural errors
  if (!validation.valid) {
    return { ok: false, snapshot: null, validation, qa: null }
  }

  // Stage 2: transform source → public CMS records
  const snapshot = buildDapCmsSnapshotFromSource(bundle)

  // Stage 3: claim QA on public output
  const qa = runClaimQA(snapshot)

  const ok = qa.totalWarnings === 0

  return { ok, snapshot, validation, qa }
}
