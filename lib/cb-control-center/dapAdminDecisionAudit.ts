// DAP Admin Decision Audit — Phase 16 pure read-only audit/replay-preview layer.
// No Supabase. No file I/O. No inserts. No mutations. No server actions.
// "Replay" means showing what a future write would have intended — not executing it.

import type {
  DapAdminDecisionAuditEvent,
  DapAdminDecisionAuditGroup,
  DapAdminDecisionAuditSummary,
  DapAdminDecisionAuditSafetyFlags,
  DapAdminDecisionAuditEventValidation,
  DapAdminDecisionReplayEligibility,
  DapAdminDecisionReplayPreview,
} from './dapAdminDecisionAuditTypes'
import type { DapAdminDecisionLedgerEvent } from './dapAdminDecisionLedgerTypes'
import type { DapAdminDecisionWriteEligibility } from './dapAdminDecisionWriteContractTypes'
import {
  buildDapAdminDecisionWriteContract,
  buildWriteContractsFromDemoContext,
  buildWriteContractsFromApprovedContext,
  buildWriteContractsFromEmptyContext,
} from './dapAdminDecisionWriteContract'
import {
  buildDapAdminDecisionLedger,
  DAP_LEDGER_CONTEXT_DEMO,
  DAP_LEDGER_CONTEXT_APPROVED,
  DAP_LEDGER_CONTEXT_EMPTY,
} from './dapAdminDecisionLedger'

export type { DapAdminDecisionAuditEvent, DapAdminDecisionAuditSummary, DapAdminDecisionReplayPreview }
export { DAP_LEDGER_CONTEXT_DEMO as DAP_AUDIT_CONTEXT_DEMO }
export { DAP_LEDGER_CONTEXT_APPROVED as DAP_AUDIT_CONTEXT_APPROVED }
export { DAP_LEDGER_CONTEXT_EMPTY as DAP_AUDIT_CONTEXT_EMPTY }

// ─── Safety constant ──────────────────────────────────────────────────────────

export const AUDIT_SAFETY: DapAdminDecisionAuditSafetyFlags = {
  readOnly:             true,
  previewOnly:          true,
  mutationAllowed:      false,
  replayExecutesWrites: false,
  includesPhi:          false,
}

// ─── Replay eligibility derivation ───────────────────────────────────────────

function deriveReplayEligibility(
  writeEligibility: DapAdminDecisionWriteEligibility,
): DapAdminDecisionReplayEligibility {
  switch (writeEligibility) {
    case 'eligible_for_future_write': return 'eligible_for_replay_preview'
    case 'blocked':                   return 'blocked_in_source'
    case 'preview_only':              return 'future_only'
  }
}

// ─── Builder: audit event from ledger event ───────────────────────────────────

export function buildDapAdminDecisionAuditEventFromLedgerEvent(
  ledgerEvent: DapAdminDecisionLedgerEvent,
): DapAdminDecisionAuditEvent {
  const contract        = buildDapAdminDecisionWriteContract(ledgerEvent)
  const replayEligibility = deriveReplayEligibility(contract.writeEligibility)

  return {
    auditKey:              `audit_${contract.contractKey}`,
    contractKey:           contract.contractKey,
    sourceEventKey:        contract.sourceEventKey,
    sourceActionKey:       contract.sourceActionKey,
    entityType:            contract.entityType,
    entityId:              contract.entityId,
    writeEligibility:      contract.writeEligibility,
    wouldAppendTo:         contract.wouldAppendTo,
    idempotencyKeyPreview: contract.idempotencyKeyPreview,
    authoritySource:       ledgerEvent.authoritySource,
    forbiddenFields:       contract.forbiddenFields,
    blockedBy:             contract.blockedBy,
    replayEligibility,
    auditedAt:             'preview — not a real timestamp',
    auditedByRole:         'admin',
    safetyFlags:           AUDIT_SAFETY,
  }
}

export function buildDapAdminDecisionAuditEventsFromLedger(
  ledgerEvents: DapAdminDecisionLedgerEvent[],
): DapAdminDecisionAuditEvent[] {
  return ledgerEvents.map(buildDapAdminDecisionAuditEventFromLedgerEvent)
}

// ─── Validation ───────────────────────────────────────────────────────────────

export function validateDapAdminDecisionAuditEvent(
  event: DapAdminDecisionAuditEvent,
): DapAdminDecisionAuditEventValidation {
  const errors: string[] = []

  if (!event.auditKey || event.auditKey.length === 0)
    errors.push('auditKey is missing or empty')
  if (!event.contractKey || event.contractKey.length === 0)
    errors.push('contractKey is missing or empty')
  if (!event.sourceEventKey || !event.sourceEventKey.endsWith('_preview'))
    errors.push('sourceEventKey must end with _preview')
  if (!event.entityId || event.entityId.length === 0)
    errors.push('entityId is missing or empty')
  if (!event.idempotencyKeyPreview || !event.idempotencyKeyPreview.startsWith('preview:'))
    errors.push('idempotencyKeyPreview must start with preview:')
  if (event.auditedByRole !== 'admin')
    errors.push('auditedByRole must be "admin"')
  if (!event.auditedAt || !event.auditedAt.includes('preview'))
    errors.push('auditedAt must contain "preview"')
  if ((event.safetyFlags as unknown as Record<string, unknown>)['readOnly'] !== true)
    errors.push('safetyFlags.readOnly must be true')
  if ((event.safetyFlags as unknown as Record<string, unknown>)['mutationAllowed'] !== false)
    errors.push('safetyFlags.mutationAllowed must be false')
  if ((event.safetyFlags as unknown as Record<string, unknown>)['replayExecutesWrites'] !== false)
    errors.push('safetyFlags.replayExecutesWrites must be false')
  if (!Array.isArray(event.forbiddenFields) || event.forbiddenFields.length === 0)
    errors.push('forbiddenFields must be a non-empty array')
  if (!Array.isArray(event.blockedBy))
    errors.push('blockedBy must be an array')

  return { valid: errors.length === 0, errors }
}

// ─── Grouping ─────────────────────────────────────────────────────────────────

export function groupDapAdminDecisionEventsByTarget(
  events: DapAdminDecisionAuditEvent[],
): DapAdminDecisionAuditGroup[] {
  const map = new Map<string, DapAdminDecisionAuditEvent[]>()
  for (const event of events) {
    const key = event.wouldAppendTo
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(event)
  }
  return Array.from(map.entries()).map(([groupKey, groupEvents]) => ({
    groupKey,
    groupLabel: groupKey.replace(/^future_/, '').replace(/_/g, ' '),
    events: groupEvents,
    count: groupEvents.length,
  }))
}

export function groupDapAdminDecisionEventsByEligibility(
  events: DapAdminDecisionAuditEvent[],
): DapAdminDecisionAuditGroup[] {
  const map = new Map<string, DapAdminDecisionAuditEvent[]>()
  for (const event of events) {
    const key = event.writeEligibility
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(event)
  }
  return Array.from(map.entries()).map(([groupKey, groupEvents]) => ({
    groupKey,
    groupLabel: groupKey.replace(/_/g, ' '),
    events: groupEvents,
    count: groupEvents.length,
  }))
}

// ─── Summary ──────────────────────────────────────────────────────────────────

export function buildDapAdminDecisionAuditSummary(
  events: DapAdminDecisionAuditEvent[],
): DapAdminDecisionAuditSummary {
  return {
    totalEvents:      events.length,
    eligibleCount:    events.filter(e => e.writeEligibility === 'eligible_for_future_write').length,
    blockedCount:     events.filter(e => e.writeEligibility === 'blocked').length,
    previewOnlyCount: events.filter(e => e.writeEligibility === 'preview_only').length,
    invalidCount:     events.filter(e => e.replayEligibility === 'invalid').length,
    byTarget:         groupDapAdminDecisionEventsByTarget(events),
    byEligibility:    groupDapAdminDecisionEventsByEligibility(events),
    safetyFlags:      AUDIT_SAFETY,
  }
}

// ─── Replay preview ───────────────────────────────────────────────────────────

function buildReplayValidationMessages(
  event: DapAdminDecisionAuditEvent,
): string[] {
  switch (event.replayEligibility) {
    case 'eligible_for_replay_preview':
      return [
        'Event is eligible for replay preview',
        'No write will be executed — this is a preview of the intended action only',
        'Idempotency key is surfaced for audit trail verification',
        'All required gates were satisfied in the source context',
        'Forbidden fields must be absent from any future write payload',
      ]
    case 'blocked_in_source':
      return [
        `Event is blocked in source — replay preview shows blocked state only`,
        `Blocked by: ${event.blockedBy.length > 0 ? event.blockedBy.join(', ') : 'unknown blockers'}`,
        'No write will be executed — resolve blockers before this event can be written',
      ]
    case 'future_only':
      return [
        'Event type is future-only — no write path exists yet',
        'A future phase will wire up this write path',
        'No write will be executed',
      ]
    case 'invalid':
      return [
        'Event failed validation — cannot generate complete replay preview',
        'No write will be executed',
      ]
  }
}

export function buildDapAdminDecisionReplayPreview(
  event: DapAdminDecisionAuditEvent,
): DapAdminDecisionReplayPreview {
  return {
    auditEventKey:            event.auditKey,
    replayMode:               'preview_only',
    executesWrite:            false,
    intendedTargetTable:      event.wouldAppendTo,
    intendedTargetId:         event.entityId,
    intendedWriteEligibility: event.writeEligibility,
    intendedSourceActionKey:  event.sourceActionKey,
    forbiddenFields:          event.forbiddenFields,
    idempotencyKeyPreview:    event.idempotencyKeyPreview,
    authoritySource:          event.authoritySource,
    replayEligibility:        event.replayEligibility,
    replayValidationMessages: buildReplayValidationMessages(event),
    safetyFlags:              AUDIT_SAFETY,
  }
}

// ─── Fixture convenience builders ─────────────────────────────────────────────

export function buildAuditEventsFromDemoContext(): DapAdminDecisionAuditEvent[] {
  return buildDapAdminDecisionAuditEventsFromLedger(
    buildDapAdminDecisionLedger(DAP_LEDGER_CONTEXT_DEMO),
  )
}

export function buildAuditEventsFromApprovedContext(): DapAdminDecisionAuditEvent[] {
  return buildDapAdminDecisionAuditEventsFromLedger(
    buildDapAdminDecisionLedger(DAP_LEDGER_CONTEXT_APPROVED),
  )
}

export function buildAuditEventsFromEmptyContext(): DapAdminDecisionAuditEvent[] {
  return buildDapAdminDecisionAuditEventsFromLedger(
    buildDapAdminDecisionLedger(DAP_LEDGER_CONTEXT_EMPTY),
  )
}
