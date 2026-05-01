// CBCC adapter — DAP per-stage evidence.
//
// `getDapEvidenceForStage` returns lightweight CbccEvidenceItem references
// (file paths, commit hashes, test summaries) the adapter knows about for
// a given DAP stage. This is the inline shape — the engine's full
// CbccEvidenceEntry ledger (with id/status/audit fields) is layered on top
// and supplied by the caller; see `seedDapEvidenceLedger` for a helper
// that converts these inline items into ledger entries.

import type { CbccEvidenceEntry, CbccEvidenceItem, CbccEvidenceStatus, CbccStageId } from '../../types'
import { createEvidenceEntry } from '../../evidenceLedger'
import { DAP_PROJECT_ID } from './dapProject'

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
