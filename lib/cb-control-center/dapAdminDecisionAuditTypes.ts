// DAP Admin Decision Audit — type definitions.
// Phase 16 is read-only. These types describe the shape of future admin decision events
// as seen by an audit/replay-preview layer. No writes. No mutations. No Supabase.

import type {
  DapAdminDecisionWriteContractKey,
  DapAdminDecisionWriteEligibility,
  DapAdminDecisionWouldAppendTo,
} from './dapAdminDecisionWriteContractTypes'
import type {
  DapAdminDecisionLedgerEventKey,
  DapAdminDecisionEntityType,
} from './dapAdminDecisionLedgerTypes'
import type { DapActionAuthoritySource } from './dapActionCatalogTypes'

export type {
  DapAdminDecisionWriteContractKey,
  DapAdminDecisionWriteEligibility,
  DapAdminDecisionWouldAppendTo,
  DapAdminDecisionLedgerEventKey,
  DapAdminDecisionEntityType,
  DapActionAuthoritySource,
}

// ─── Replay eligibility ───────────────────────────────────────────────────────

export type DapAdminDecisionReplayEligibility =
  | 'eligible_for_replay_preview'
  | 'blocked_in_source'
  | 'future_only'
  | 'invalid'

// ─── Safety flags ─────────────────────────────────────────────────────────────
// All Phase 16 audit helpers are read-only. These are literal — tests assert them.

export interface DapAdminDecisionAuditSafetyFlags {
  readOnly:             true
  previewOnly:          true
  mutationAllowed:      false
  replayExecutesWrites: false
  includesPhi:          false
}

// ─── Audit event ──────────────────────────────────────────────────────────────
// A simulated future admin decision event as seen by the audit/replay layer.
// Built from Phase 14 write contracts + Phase 13 ledger events.

export interface DapAdminDecisionAuditEvent {
  auditKey:              string
  contractKey:           DapAdminDecisionWriteContractKey
  sourceEventKey:        DapAdminDecisionLedgerEventKey
  sourceActionKey:       string
  entityType:            DapAdminDecisionEntityType
  entityId:              string
  writeEligibility:      DapAdminDecisionWriteEligibility
  wouldAppendTo:         DapAdminDecisionWouldAppendTo
  idempotencyKeyPreview: string
  authoritySource:       DapActionAuthoritySource
  forbiddenFields:       string[]
  blockedBy:             string[]
  replayEligibility:     DapAdminDecisionReplayEligibility
  auditedAt:             string
  auditedByRole:         'admin'
  safetyFlags:           DapAdminDecisionAuditSafetyFlags
}

// ─── Audit group ──────────────────────────────────────────────────────────────
// A collection of audit events sharing a common grouping criterion.

export interface DapAdminDecisionAuditGroup {
  groupKey:   string
  groupLabel: string
  events:     DapAdminDecisionAuditEvent[]
  count:      number
}

// ─── Audit summary ────────────────────────────────────────────────────────────
// Aggregate view of an audit event set.

export interface DapAdminDecisionAuditSummary {
  totalEvents:      number
  eligibleCount:    number
  blockedCount:     number
  previewOnlyCount: number
  invalidCount:     number
  byTarget:         DapAdminDecisionAuditGroup[]
  byEligibility:    DapAdminDecisionAuditGroup[]
  safetyFlags:      DapAdminDecisionAuditSafetyFlags
}

// ─── Replay preview ───────────────────────────────────────────────────────────
// The read-only description of what a future write would have intended to do.
// "Replay" means preview the intended action, not execute it.

export interface DapAdminDecisionReplayPreview {
  auditEventKey:            string
  replayMode:               'preview_only'
  executesWrite:            false
  intendedTargetTable:      DapAdminDecisionWouldAppendTo
  intendedTargetId:         string
  intendedWriteEligibility: DapAdminDecisionWriteEligibility
  intendedSourceActionKey:  string
  forbiddenFields:          string[]
  idempotencyKeyPreview:    string
  authoritySource:          DapActionAuthoritySource
  replayEligibility:        DapAdminDecisionReplayEligibility
  replayValidationMessages: string[]
  safetyFlags:              DapAdminDecisionAuditSafetyFlags
}

// ─── Audit event validation ───────────────────────────────────────────────────

export interface DapAdminDecisionAuditEventValidation {
  valid:  boolean
  errors: string[]
}
