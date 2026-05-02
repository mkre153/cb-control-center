// CBCC adapter — DAP per-stage evidence.
//
// `getDapEvidenceForStage` returns lightweight CbccEvidenceItem references
// (file paths, commit hashes, test summaries) the adapter knows about for
// a given DAP stage. This is the inline shape — the engine's full
// CbccEvidenceEntry ledger (with id/status/audit fields) is layered on top
// and supplied by the caller; see `seedDapEvidenceLedger` for a helper
// that converts these inline items into ledger entries.

import type {
  CbccEvidenceEntry,
  CbccEvidenceItem,
  CbccEvidenceLedger,
  CbccEvidenceRequirement,
  CbccEvidenceStatus,
  CbccStageId,
} from '../../types'
import { createEvidenceEntry } from '../../evidenceLedger'
import { DAP_PROJECT_ID } from './dapProject'
import { DAP_STAGE_DEFINITIONS } from './dapStages'
import { getDapStageArtifact, type DapStageArtifact } from './dapArtifacts'

// ─── Inline references per stage ─────────────────────────────────────────────

export function getDapEvidenceForStage(stageId: CbccStageId): ReadonlyArray<CbccEvidenceItem> {
  switch (stageId) {
    case 'definition':
      return [
        { type: 'file', value: 'lib/cbcc/adapters/dap/dapArtifacts.ts', label: 'Business definition artifact' },
        { type: 'git_commit', value: '403bcd6', label: 'Phase 18E commit (CBCC workspace shell)' },
        { type: 'test', value: 'cbcc:adapters:dap', label: 'DAP adapter test suite' },
      ]
    case 'truth-schema':
      return [
        { type: 'file', value: 'lib/cbcc/adapters/dap/dapArtifacts.ts', label: 'Truth schema artifact' },
        { type: 'note', value: '7 truth rules, 11 forbidden claims, 4 disclaimers locked' },
      ]
    default:
      return []
  }
}

// ─── Ledger entry helpers ────────────────────────────────────────────────────
//
// Pure helpers that translate inline references into engine-shaped
// CbccEvidenceEntry records. No persistence. The caller decides where the
// resulting array gets stored.

export interface SeedDapEvidenceLedgerOptions {
  // Entries default to status='valid'. Override per-stage to mirror real
  // approval flows where evidence is submitted but not yet validated.
  status?: CbccEvidenceStatus
  // Stable createdAt for deterministic tests; defaults to "now" via
  // createEvidenceEntry's default clock.
  now?: string
  // Override the project id (rarely useful — defaults to DAP_PROJECT_ID).
  projectId?: string
}

export function seedDapEvidenceLedger(
  stageId: CbccStageId,
  options: SeedDapEvidenceLedgerOptions = {},
): ReadonlyArray<CbccEvidenceEntry> {
  const items = getDapEvidenceForStage(stageId)
  const projectId = options.projectId ?? DAP_PROJECT_ID
  const status = options.status ?? 'valid'
  return items.map((item, idx) =>
    createEvidenceEntry(
      {
        id: `dap:${stageId}:${idx}`,
        projectId,
        stageId,
        type: item.type,
        title: item.label ?? `${item.type}: ${item.value}`,
        ref: item.type === 'note' ? undefined : item.value,
        description: item.label,
        status,
        createdAt: options.now,
        createdBy: 'dap-adapter',
      },
      options.now,
    ),
  )
}

// ─── Part 10: required evidence per stage ─────────────────────────────────────
//
// DAP_STAGE_REQUIRED_EVIDENCE maps stage number → required evidence IDs.
// Each ID is a stable, human-readable artifact identifier (the same string
// used as `artifact.type` in dapArtifacts.ts where applicable). The engine's
// canApproveStageWithEvidence matches these IDs to ledger entries with
// status='valid', scoped to the same project + stage.
//
// AI review evidence (if ever ledger-shaped) MUST use a different id (e.g.
// 'opus_stage_review') so it cannot satisfy any of the requirements below.

export const DAP_STAGE_REQUIRED_EVIDENCE: Readonly<Record<number, ReadonlyArray<string>>> = Object.freeze({
  1: ['business_definition'],
  2: ['discovery_asset_audit'],
  3: ['truth_schema'],
  4: ['positioning_messaging'],
  5: ['seo_aeo_content_strategy'],
  6: ['page_architecture_wireframes'],
  7: ['build_qa_launch_evidence'],
})

export function getDapStageEvidenceRequirements(
  stageNumber: number,
): ReadonlyArray<CbccEvidenceRequirement> {
  const ids = DAP_STAGE_REQUIRED_EVIDENCE[stageNumber] ?? []
  return ids.map(id => ({
    id,
    type: 'file',
    title: id,
    required: true,
  }))
}

// ─── Part 10: ledger builder for the approval gate ────────────────────────────
//
// Emits one ledger entry per stage whose artifact is in 'reviewable' or
// 'approved' status — these are the artifacts that have actually been
// produced. Placeholder artifacts (status='not_started') contribute no
// evidence: their stages cannot be approved until the artifact moves out of
// the placeholder state.
//
// The id of each entry equals the corresponding requirement id, so it
// satisfies canApproveStageWithEvidence's id-level matcher.

const ARTIFACT_PRODUCED_STATUSES = new Set(['reviewable', 'approved'])

export interface BuildDapApprovalEvidenceLedgerOptions {
  projectId?: string
  now?: string
}

export function buildDapApprovalEvidenceLedger(
  options: BuildDapApprovalEvidenceLedgerOptions = {},
): CbccEvidenceLedger {
  const projectId = options.projectId ?? DAP_PROJECT_ID
  const now = options.now ?? new Date().toISOString()
  const entries: CbccEvidenceEntry[] = []

  for (const def of DAP_STAGE_DEFINITIONS) {
    const requiredIds = DAP_STAGE_REQUIRED_EVIDENCE[def.order] ?? []
    const artifact = getDapStageArtifact(def.id)
    if (!artifact || !ARTIFACT_PRODUCED_STATUSES.has(artifact.status)) continue

    for (const reqId of requiredIds) {
      // Only emit an entry when the artifact's `type` (or its mapped id for
      // placeholders that have promoted past not_started) matches the
      // required id. For Stage 1 this is 'business_definition', for Stage 3
      // 'truth_schema'. Placeholder artifacts that move to 'reviewable' must
      // also adopt the canonical type string before they will satisfy this
      // matcher — that promotion is an adapter-level concern.
      if (!artifactSatisfiesRequirement(artifact, reqId)) continue
      entries.push(
        createEvidenceEntry(
          {
            id: reqId,
            projectId,
            stageId: def.id,
            type: 'file',
            title: artifact.title,
            ref: artifact.sourceFiles[0] ?? `lib/cbcc/adapters/dap/dapArtifacts.ts`,
            description: artifact.summary,
            status: 'valid',
            createdBy: 'dap-adapter',
            createdAt: now,
          },
          now,
        ),
      )
    }
  }
  return entries
}

function artifactSatisfiesRequirement(artifact: DapStageArtifact, requiredId: string): boolean {
  // Concrete artifacts (e.g. business_definition, truth_schema) have a `type`
  // string that must equal the required id.
  if (artifact.type === requiredId) return true
  // Placeholder artifacts that have been promoted out of 'not_started' but
  // still carry type='placeholder' also satisfy when their stage is the
  // required-id's stage. This is a forward-compatibility clause for stages
  // 2/4/5/6/7 — when their artifacts are produced, the adapter authors will
  // either change `type` to the canonical id (preferred) or rely on this
  // clause (fallback). Either way the gate behaves consistently.
  if (artifact.type === 'placeholder' && artifact.status !== 'not_started') {
    return true
  }
  return false
}
