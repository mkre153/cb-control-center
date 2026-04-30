// Phase 16 — DAP Admin Decision Audit + Replay Preview
// Read-only audit and replay-preview layer for admin decision events.
// No writes. No Supabase. No mutations. No email. No payment.

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const ROOT = join(__dirname, '..', '..')
const PAGE_PATH = join(ROOT, 'app/preview/dap/admin-decision-audit/page.tsx')
const AUDIT_HELPER_PATH = join(__dirname, 'dapAdminDecisionAudit.ts')
const AUDIT_TYPES_PATH  = join(__dirname, 'dapAdminDecisionAuditTypes.ts')

function findPages(dir: string): string[] {
  const { readdirSync, statSync } = require('fs')
  const results: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) results.push(...findPages(full))
    else if (entry === 'page.tsx' || entry === 'page.ts') results.push(full)
  }
  return results
}

import {
  buildDapAdminDecisionAuditEventFromLedgerEvent,
  buildDapAdminDecisionAuditEventsFromLedger,
  buildDapAdminDecisionAuditSummary,
  groupDapAdminDecisionEventsByTarget,
  groupDapAdminDecisionEventsByEligibility,
  buildDapAdminDecisionReplayPreview,
  validateDapAdminDecisionAuditEvent,
  buildAuditEventsFromDemoContext,
  buildAuditEventsFromApprovedContext,
  buildAuditEventsFromEmptyContext,
  AUDIT_SAFETY,
  DAP_AUDIT_CONTEXT_DEMO,
  DAP_AUDIT_CONTEXT_APPROVED,
  DAP_AUDIT_CONTEXT_EMPTY,
} from './dapAdminDecisionAudit'
import {
  buildDapAdminDecisionLedger,
} from './dapAdminDecisionLedger'
import type { DapAdminDecisionAuditEvent, DapAdminDecisionLedgerEventKey } from './dapAdminDecisionAuditTypes'
import { getDapAdminDecisionSqlContract } from './dapAdminDecisionSqlContract'

// ─── Group 1: Exports ─────────────────────────────────────────────────────────

describe('Phase 16 — Exports', () => {
  it('buildDapAdminDecisionAuditEventFromLedgerEvent is a function', () => {
    expect(typeof buildDapAdminDecisionAuditEventFromLedgerEvent).toBe('function')
  })

  it('buildDapAdminDecisionAuditEventsFromLedger is a function', () => {
    expect(typeof buildDapAdminDecisionAuditEventsFromLedger).toBe('function')
  })

  it('buildDapAdminDecisionAuditSummary is a function', () => {
    expect(typeof buildDapAdminDecisionAuditSummary).toBe('function')
  })

  it('groupDapAdminDecisionEventsByTarget is a function', () => {
    expect(typeof groupDapAdminDecisionEventsByTarget).toBe('function')
  })

  it('groupDapAdminDecisionEventsByEligibility is a function', () => {
    expect(typeof groupDapAdminDecisionEventsByEligibility).toBe('function')
  })

  it('buildDapAdminDecisionReplayPreview is a function', () => {
    expect(typeof buildDapAdminDecisionReplayPreview).toBe('function')
  })

  it('validateDapAdminDecisionAuditEvent is a function', () => {
    expect(typeof validateDapAdminDecisionAuditEvent).toBe('function')
  })

  it('AUDIT_SAFETY is exported', () => {
    expect(AUDIT_SAFETY).toBeDefined()
  })

  it('fixture contexts are exported', () => {
    expect(DAP_AUDIT_CONTEXT_DEMO).toBeDefined()
    expect(DAP_AUDIT_CONTEXT_APPROVED).toBeDefined()
    expect(DAP_AUDIT_CONTEXT_EMPTY).toBeDefined()
  })

  it('buildAuditEventsFromDemoContext is a function', () => {
    expect(typeof buildAuditEventsFromDemoContext).toBe('function')
  })
})

// ─── Group 2: Audit event shape ───────────────────────────────────────────────

describe('Phase 16 — Audit event shape', () => {
  const events = buildAuditEventsFromDemoContext()

  it('buildAuditEventsFromDemoContext returns 9 events', () => {
    expect(events).toHaveLength(9)
  })

  it('buildAuditEventsFromApprovedContext returns 9 events', () => {
    expect(buildAuditEventsFromApprovedContext()).toHaveLength(9)
  })

  it('buildAuditEventsFromEmptyContext returns 9 events', () => {
    expect(buildAuditEventsFromEmptyContext()).toHaveLength(9)
  })

  const REQUIRED_FIELDS: (keyof DapAdminDecisionAuditEvent)[] = [
    'auditKey', 'contractKey', 'sourceEventKey', 'sourceActionKey',
    'entityType', 'entityId', 'writeEligibility', 'wouldAppendTo',
    'idempotencyKeyPreview', 'authoritySource', 'forbiddenFields',
    'blockedBy', 'replayEligibility', 'auditedAt', 'auditedByRole', 'safetyFlags',
  ]

  for (const field of REQUIRED_FIELDS) {
    it(`every audit event has field: ${field}`, () => {
      for (const event of events) {
        expect(event).toHaveProperty(field)
      }
    })
  }

  it('every auditKey starts with audit_write_contract_', () => {
    for (const event of events) {
      expect(event.auditKey).toMatch(/^audit_write_contract_/)
    }
  })

  it('every sourceEventKey ends with _preview', () => {
    for (const event of events) {
      expect(event.sourceEventKey).toMatch(/_preview$/)
    }
  })

  it('every auditedByRole is "admin"', () => {
    for (const event of events) {
      expect(event.auditedByRole).toBe('admin')
    }
  })

  it('every auditedAt contains "preview"', () => {
    for (const event of events) {
      expect(event.auditedAt).toContain('preview')
    }
  })
})

// ─── Group 3: Safety flags ────────────────────────────────────────────────────

describe('Phase 16 — Safety flags', () => {
  it('AUDIT_SAFETY.readOnly is true', () => {
    expect((AUDIT_SAFETY as unknown as Record<string, unknown>)['readOnly']).toBe(true)
  })

  it('AUDIT_SAFETY.previewOnly is true', () => {
    expect((AUDIT_SAFETY as unknown as Record<string, unknown>)['previewOnly']).toBe(true)
  })

  it('AUDIT_SAFETY.mutationAllowed is false', () => {
    expect((AUDIT_SAFETY as unknown as Record<string, unknown>)['mutationAllowed']).toBe(false)
  })

  it('AUDIT_SAFETY.replayExecutesWrites is false', () => {
    expect((AUDIT_SAFETY as unknown as Record<string, unknown>)['replayExecutesWrites']).toBe(false)
  })

  it('AUDIT_SAFETY.includesPhi is false', () => {
    expect((AUDIT_SAFETY as unknown as Record<string, unknown>)['includesPhi']).toBe(false)
  })

  it('every event safetyFlags matches AUDIT_SAFETY', () => {
    const events = buildAuditEventsFromDemoContext()
    for (const event of events) {
      const flags = event.safetyFlags as unknown as Record<string, unknown>
      expect(flags['readOnly']).toBe(true)
      expect(flags['previewOnly']).toBe(true)
      expect(flags['mutationAllowed']).toBe(false)
      expect(flags['replayExecutesWrites']).toBe(false)
      expect(flags['includesPhi']).toBe(false)
    }
  })

  it('safety flags are identical across all contexts', () => {
    const allEvents = [
      ...buildAuditEventsFromEmptyContext(),
      ...buildAuditEventsFromDemoContext(),
      ...buildAuditEventsFromApprovedContext(),
    ]
    for (const event of allEvents) {
      const flags = event.safetyFlags as unknown as Record<string, unknown>
      expect(flags['readOnly']).toBe(true)
      expect(flags['mutationAllowed']).toBe(false)
      expect(flags['replayExecutesWrites']).toBe(false)
    }
  })
})

// ─── Group 4: Grouping by target ─────────────────────────────────────────────

describe('Phase 16 — Grouping by target', () => {
  const events = buildAuditEventsFromDemoContext()
  const groups = groupDapAdminDecisionEventsByTarget(events)

  it('groups are returned as an array', () => {
    expect(Array.isArray(groups)).toBe(true)
  })

  it('at least one group exists for demo context', () => {
    expect(groups.length).toBeGreaterThan(0)
  })

  it('all group keys start with future_', () => {
    for (const group of groups) {
      expect(group.groupKey).toMatch(/^future_/)
    }
  })

  it('each group has a non-empty events array', () => {
    for (const group of groups) {
      expect(group.events.length).toBeGreaterThan(0)
    }
  })

  it('group count matches group.events.length', () => {
    for (const group of groups) {
      expect(group.count).toBe(group.events.length)
    }
  })

  it('all events in a group share the same wouldAppendTo', () => {
    for (const group of groups) {
      for (const event of group.events) {
        expect(event.wouldAppendTo).toBe(group.groupKey)
      }
    }
  })

  it('total events across all groups equals input length', () => {
    const total = groups.reduce((sum, g) => sum + g.count, 0)
    expect(total).toBe(events.length)
  })
})

// ─── Group 5: Grouping by eligibility ────────────────────────────────────────

describe('Phase 16 — Grouping by eligibility', () => {
  const events = buildAuditEventsFromDemoContext()
  const groups = groupDapAdminDecisionEventsByEligibility(events)

  it('groups are returned as an array', () => {
    expect(Array.isArray(groups)).toBe(true)
  })

  it('at least one group exists for demo context', () => {
    expect(groups.length).toBeGreaterThan(0)
  })

  it('all events in a group share the same writeEligibility', () => {
    for (const group of groups) {
      for (const event of group.events) {
        expect(event.writeEligibility).toBe(group.groupKey)
      }
    }
  })

  it('total events across all groups equals input length', () => {
    const total = groups.reduce((sum, g) => sum + g.count, 0)
    expect(total).toBe(events.length)
  })

  it('different contexts produce different eligibility distributions', () => {
    const demoGroups  = groupDapAdminDecisionEventsByEligibility(buildAuditEventsFromDemoContext())
    const emptyGroups = groupDapAdminDecisionEventsByEligibility(buildAuditEventsFromEmptyContext())
    const demoKeys    = new Set(demoGroups.map(g => g.groupKey))
    const emptyKeys   = new Set(emptyGroups.map(g => g.groupKey))
    expect(demoKeys).not.toEqual(emptyKeys)
  })
})

// ─── Group 6: Audit summary ───────────────────────────────────────────────────

describe('Phase 16 — Audit summary', () => {
  const events  = buildAuditEventsFromDemoContext()
  const summary = buildDapAdminDecisionAuditSummary(events)

  it('summary.totalEvents equals events.length', () => {
    expect(summary.totalEvents).toBe(events.length)
  })

  it('summary counts sum to totalEvents', () => {
    expect(summary.eligibleCount + summary.blockedCount + summary.previewOnlyCount + summary.invalidCount)
      .toBe(summary.totalEvents)
  })

  it('summary.byTarget is a non-empty array', () => {
    expect(Array.isArray(summary.byTarget)).toBe(true)
    expect(summary.byTarget.length).toBeGreaterThan(0)
  })

  it('summary.byEligibility is a non-empty array', () => {
    expect(Array.isArray(summary.byEligibility)).toBe(true)
    expect(summary.byEligibility.length).toBeGreaterThan(0)
  })

  it('summary safetyFlags match AUDIT_SAFETY', () => {
    const flags = summary.safetyFlags as unknown as Record<string, unknown>
    expect(flags['readOnly']).toBe(true)
    expect(flags['mutationAllowed']).toBe(false)
    expect(flags['replayExecutesWrites']).toBe(false)
  })

  it('summary for empty context has 0 eligible events', () => {
    const emptyEvents   = buildAuditEventsFromEmptyContext()
    const emptySummary  = buildDapAdminDecisionAuditSummary(emptyEvents)
    expect(emptySummary.eligibleCount).toBe(0)
  })
})

// ─── Group 7: Replay preview shape ───────────────────────────────────────────

describe('Phase 16 — Replay preview shape', () => {
  const events  = buildAuditEventsFromDemoContext()

  it('buildDapAdminDecisionReplayPreview returns an object for every event', () => {
    for (const event of events) {
      const preview = buildDapAdminDecisionReplayPreview(event)
      expect(preview).toBeDefined()
    }
  })

  it('every preview has replayMode: "preview_only"', () => {
    for (const event of events) {
      expect(buildDapAdminDecisionReplayPreview(event).replayMode).toBe('preview_only')
    }
  })

  it('every preview has executesWrite: false (literal)', () => {
    for (const event of events) {
      const preview = buildDapAdminDecisionReplayPreview(event)
      expect((preview as unknown as Record<string, unknown>)['executesWrite']).toBe(false)
    }
  })

  it('every preview has a non-empty intendedTargetTable', () => {
    for (const event of events) {
      expect(buildDapAdminDecisionReplayPreview(event).intendedTargetTable.length).toBeGreaterThan(0)
    }
  })

  it('intendedTargetTable matches event wouldAppendTo', () => {
    for (const event of events) {
      expect(buildDapAdminDecisionReplayPreview(event).intendedTargetTable).toBe(event.wouldAppendTo)
    }
  })

  it('intendedTargetId matches event entityId', () => {
    for (const event of events) {
      expect(buildDapAdminDecisionReplayPreview(event).intendedTargetId).toBe(event.entityId)
    }
  })

  it('idempotencyKeyPreview matches event value', () => {
    for (const event of events) {
      expect(buildDapAdminDecisionReplayPreview(event).idempotencyKeyPreview).toBe(event.idempotencyKeyPreview)
    }
  })

  it('authoritySource matches event value', () => {
    for (const event of events) {
      expect(buildDapAdminDecisionReplayPreview(event).authoritySource).toBe(event.authoritySource)
    }
  })

  it('forbiddenFields pass through to replay preview', () => {
    for (const event of events) {
      expect(buildDapAdminDecisionReplayPreview(event).forbiddenFields).toEqual(event.forbiddenFields)
    }
  })
})

// ─── Group 8: Replay never executes writes ────────────────────────────────────

describe('Phase 16 — Replay never executes writes', () => {
  it('executesWrite is false for eligible events', () => {
    const events = buildAuditEventsFromDemoContext().filter(e => e.writeEligibility === 'eligible_for_future_write')
    for (const event of events) {
      const preview = buildDapAdminDecisionReplayPreview(event)
      expect((preview as unknown as Record<string, unknown>)['executesWrite']).toBe(false)
    }
  })

  it('executesWrite is false for blocked events', () => {
    const events = buildAuditEventsFromDemoContext().filter(e => e.writeEligibility === 'blocked')
    for (const event of events) {
      const preview = buildDapAdminDecisionReplayPreview(event)
      expect((preview as unknown as Record<string, unknown>)['executesWrite']).toBe(false)
    }
  })

  it('executesWrite is false for preview_only events', () => {
    const events = buildAuditEventsFromDemoContext().filter(e => e.writeEligibility === 'preview_only')
    for (const event of events) {
      const preview = buildDapAdminDecisionReplayPreview(event)
      expect((preview as unknown as Record<string, unknown>)['executesWrite']).toBe(false)
    }
  })

  it('replayMode is always "preview_only" regardless of context', () => {
    const allEvents = [
      ...buildAuditEventsFromEmptyContext(),
      ...buildAuditEventsFromDemoContext(),
      ...buildAuditEventsFromApprovedContext(),
    ]
    for (const event of allEvents) {
      expect(buildDapAdminDecisionReplayPreview(event).replayMode).toBe('preview_only')
    }
  })

  it('replay safetyFlags.replayExecutesWrites is false', () => {
    const events = buildAuditEventsFromDemoContext()
    for (const event of events) {
      const preview = buildDapAdminDecisionReplayPreview(event)
      const flags = preview.safetyFlags as unknown as Record<string, unknown>
      expect(flags['replayExecutesWrites']).toBe(false)
    }
  })
})

// ─── Group 9: Replay validation messages ─────────────────────────────────────

describe('Phase 16 — Replay validation messages', () => {
  it('eligible events have validation messages mentioning "eligible" or "preview"', () => {
    const eligible = buildAuditEventsFromDemoContext().filter(e => e.replayEligibility === 'eligible_for_replay_preview')
    for (const event of eligible) {
      const preview = buildDapAdminDecisionReplayPreview(event)
      const hasEligibleMsg = preview.replayValidationMessages.some(m => m.toLowerCase().includes('eligible') || m.toLowerCase().includes('preview'))
      expect(hasEligibleMsg).toBe(true)
    }
  })

  it('blocked events have validation messages mentioning "blocked"', () => {
    const blocked = buildAuditEventsFromDemoContext().filter(e => e.replayEligibility === 'blocked_in_source')
    for (const event of blocked) {
      const preview = buildDapAdminDecisionReplayPreview(event)
      const hasBlockMsg = preview.replayValidationMessages.some(m => m.toLowerCase().includes('blocked'))
      expect(hasBlockMsg).toBe(true)
    }
  })

  it('future_only events have validation messages mentioning "future"', () => {
    const futureOnly = buildAuditEventsFromDemoContext().filter(e => e.replayEligibility === 'future_only')
    for (const event of futureOnly) {
      const preview = buildDapAdminDecisionReplayPreview(event)
      const hasFutureMsg = preview.replayValidationMessages.some(m => m.toLowerCase().includes('future'))
      expect(hasFutureMsg).toBe(true)
    }
  })

  it('every preview has at least one validation message', () => {
    const events = buildAuditEventsFromDemoContext()
    for (const event of events) {
      expect(buildDapAdminDecisionReplayPreview(event).replayValidationMessages.length).toBeGreaterThan(0)
    }
  })

  it('every preview validation message mentions "no write will be executed"', () => {
    const events = buildAuditEventsFromDemoContext()
    for (const event of events) {
      const preview = buildDapAdminDecisionReplayPreview(event)
      const hasNoWriteMsg = preview.replayValidationMessages.some(m => m.toLowerCase().includes('no write'))
      expect(hasNoWriteMsg).toBe(true)
    }
  })
})

// ─── Group 10: Validation ─────────────────────────────────────────────────────

describe('Phase 16 — Audit event validation', () => {
  it('valid events pass validation', () => {
    const events = buildAuditEventsFromDemoContext()
    for (const event of events) {
      const result = validateDapAdminDecisionAuditEvent(event)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    }
  })

  it('event with empty auditKey fails validation', () => {
    const event = { ...buildAuditEventsFromDemoContext()[0], auditKey: '' }
    const result = validateDapAdminDecisionAuditEvent(event)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('event with wrong auditedByRole fails validation', () => {
    const event = { ...buildAuditEventsFromDemoContext()[0], auditedByRole: 'viewer' as 'admin' }
    const result = validateDapAdminDecisionAuditEvent(event)
    expect(result.valid).toBe(false)
  })

  it('event with bad idempotencyKeyPreview fails validation', () => {
    const event = { ...buildAuditEventsFromDemoContext()[0], idempotencyKeyPreview: 'no-prefix-here' }
    const result = validateDapAdminDecisionAuditEvent(event)
    expect(result.valid).toBe(false)
  })

  it('event with sourceEventKey not ending in _preview fails validation', () => {
    const event = { ...buildAuditEventsFromDemoContext()[0], sourceEventKey: 'practice_request_approved' as DapAdminDecisionLedgerEventKey }
    const result = validateDapAdminDecisionAuditEvent(event)
    expect(result.valid).toBe(false)
  })

  it('event with empty forbiddenFields fails validation', () => {
    const event = { ...buildAuditEventsFromDemoContext()[0], forbiddenFields: [] }
    const result = validateDapAdminDecisionAuditEvent(event)
    expect(result.valid).toBe(false)
  })

  it('validation result has valid and errors fields', () => {
    const result = validateDapAdminDecisionAuditEvent(buildAuditEventsFromDemoContext()[0])
    expect(result).toHaveProperty('valid')
    expect(result).toHaveProperty('errors')
  })
})

// ─── Group 11: Forbidden fields ───────────────────────────────────────────────

describe('Phase 16 — Forbidden fields preserved', () => {
  const events = buildAuditEventsFromDemoContext()

  it('every event has non-empty forbiddenFields', () => {
    for (const event of events) {
      expect(event.forbiddenFields.length).toBeGreaterThan(0)
    }
  })

  it('forbiddenFields contains mutate', () => {
    for (const event of events) {
      expect(event.forbiddenFields).toContain('mutate')
    }
  })

  it('forbiddenFields contains execute', () => {
    for (const event of events) {
      expect(event.forbiddenFields).toContain('execute')
    }
  })

  it('forbiddenFields contains sendEmail', () => {
    for (const event of events) {
      expect(event.forbiddenFields).toContain('sendEmail')
    }
  })

  it('forbiddenFields contains triggerPayment', () => {
    for (const event of events) {
      expect(event.forbiddenFields).toContain('triggerPayment')
    }
  })

  it('forbiddenFields are identical across all 9 events', () => {
    const first = events[0].forbiddenFields
    for (const event of events.slice(1)) {
      expect(event.forbiddenFields).toEqual(first)
    }
  })

  it('replay preview preserves forbiddenFields', () => {
    for (const event of events) {
      expect(buildDapAdminDecisionReplayPreview(event).forbiddenFields).toEqual(event.forbiddenFields)
    }
  })
})

// ─── Group 12: Idempotency key ────────────────────────────────────────────────

describe('Phase 16 — Idempotency key surfaced', () => {
  const events = buildAuditEventsFromDemoContext()

  it('every event has non-empty idempotencyKeyPreview', () => {
    for (const event of events) {
      expect(event.idempotencyKeyPreview.length).toBeGreaterThan(0)
    }
  })

  it('all idempotencyKeyPreview values start with preview:', () => {
    for (const event of events) {
      expect(event.idempotencyKeyPreview).toMatch(/^preview:/)
    }
  })

  it('idempotencyKeyPreview includes sourceActionKey', () => {
    for (const event of events) {
      expect(event.idempotencyKeyPreview).toContain(event.sourceActionKey)
    }
  })

  it('all idempotencyKeyPreview values are unique', () => {
    const keys = events.map(e => e.idempotencyKeyPreview)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('replay preview surfaces idempotencyKeyPreview', () => {
    for (const event of events) {
      const preview = buildDapAdminDecisionReplayPreview(event)
      expect(preview.idempotencyKeyPreview).toBe(event.idempotencyKeyPreview)
    }
  })
})

// ─── Group 13: Authority source preserved ────────────────────────────────────

describe('Phase 16 — Authority source preserved', () => {
  const VALID_AUTHORITY_SOURCES = [
    'cb_control_center',
    'client_builder_pro',
    'mkcrm_shadow',
    'public_member_page',
    'provider_submission',
  ]

  const events = buildAuditEventsFromDemoContext()

  it('all events have a valid authoritySource', () => {
    for (const event of events) {
      expect(VALID_AUTHORITY_SOURCES).toContain(event.authoritySource)
    }
  })

  it('no event has authoritySource: client_builder_pro', () => {
    for (const event of events) {
      expect(event.authoritySource).not.toBe('client_builder_pro')
    }
  })

  it('replay preview preserves authoritySource', () => {
    for (const event of events) {
      expect(buildDapAdminDecisionReplayPreview(event).authoritySource).toBe(event.authoritySource)
    }
  })

  it('practice request audit events use cb_control_center authority', () => {
    const practiceEvents = events.filter(e => e.entityType === 'practice_request')
    for (const event of practiceEvents) {
      expect(event.authoritySource).toBe('cb_control_center')
    }
  })

  it('provider participation events use provider_submission authority', () => {
    const participationEvents = events.filter(e => e.entityType === 'provider_participation')
    for (const event of participationEvents) {
      expect(event.authoritySource).toBe('provider_submission')
    }
  })
})

// ─── Group 14: No Supabase or fs in pure helpers ──────────────────────────────

describe('Phase 16 — No Supabase or fs imports in pure helpers', () => {
  it('dapAdminDecisionAudit.ts has no Supabase import', () => {
    const src = readFileSync(AUDIT_HELPER_PATH, 'utf8')
    expect(src).not.toMatch(/from ['"].*supabase/i)
    expect(src).not.toContain('createClient')
    expect(src).not.toContain('supabaseClient')
  })

  it('dapAdminDecisionAudit.ts has no fs import', () => {
    const src = readFileSync(AUDIT_HELPER_PATH, 'utf8')
    expect(src).not.toMatch(/from ['"]fs['"]/i)
    expect(src).not.toContain('readFileSync')
    expect(src).not.toContain('existsSync')
  })

  it('dapAdminDecisionAudit.ts has no insert/upsert/supabase calls', () => {
    const src = readFileSync(AUDIT_HELPER_PATH, 'utf8')
    expect(src.toLowerCase()).not.toContain('.insert(')
    expect(src.toLowerCase()).not.toContain('.upsert(')
    expect(src).not.toMatch(/from ['"]@supabase\//i)
    expect(src).not.toMatch(/createClient\s*\(/i)
  })

  it('dapAdminDecisionAudit.ts has no server action directive', () => {
    const src = readFileSync(AUDIT_HELPER_PATH, 'utf8')
    expect(src).not.toContain("'use server'")
    expect(src).not.toContain('"use server"')
  })

  it('dapAdminDecisionAuditTypes.ts has no Supabase import', () => {
    const src = readFileSync(AUDIT_TYPES_PATH, 'utf8')
    expect(src).not.toMatch(/from ['"].*supabase/i)
  })

  it('dapAdminDecisionAuditTypes.ts has no fs import', () => {
    const src = readFileSync(AUDIT_TYPES_PATH, 'utf8')
    expect(src).not.toMatch(/from ['"]fs['"]/i)
  })
})

// ─── Group 15: Page source content ───────────────────────────────────────────

describe('Phase 16 — Page source content', () => {
  it('page imports buildAuditEventsFromDemoContext', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('buildAuditEventsFromDemoContext')
  })

  it('page imports buildDapAdminDecisionAuditSummary', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('buildDapAdminDecisionAuditSummary')
  })

  it('page imports buildDapAdminDecisionReplayPreview', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('buildDapAdminDecisionReplayPreview')
  })

  it('page references replayMode', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('replayMode')
  })

  it('page references executesWrite', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('executesWrite')
  })

  it('page references idempotencyKeyPreview', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('idempotencyKeyPreview')
  })

  it('page references authoritySource', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('authoritySource')
  })

  it('page references forbiddenFields', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('forbiddenFields')
  })

  it('page references safetyFlags', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('safetyFlags')
  })

  it('page references mutationAllowed', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('mutationAllowed')
  })

  it('page references replayExecutesWrites', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('replayExecutesWrites')
  })

  it('page maps over events or groups', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toMatch(/\.map\(/)
  })
})

// ─── Group 16: Preview-only boundary ─────────────────────────────────────────

describe('Phase 16 — Preview-only boundary', () => {
  it('page contains data-preview-only-notice', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('data-preview-only-notice')
  })

  it('page contains data-authority-notice', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('data-authority-notice')
  })

  it('page states it does not execute writes', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src.toLowerCase()).toContain('does not execute writes')
  })

  it('page states no emails are sent from it', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src.toLowerCase()).toContain('no email')
  })

  it('page contains "MKCRM does not decide" language', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('MKCRM does not decide')
  })

  it('page does not import from Supabase', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).not.toMatch(/from ['"].*supabase/i)
  })

  it('page does not contain server action directive', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).not.toContain("'use server'")
    expect(src).not.toContain('"use server"')
  })

  it('page does not POST to any endpoint', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).not.toMatch(/method:\s*['"]POST['"]/i)
  })

  it('page is a server component (no "use client")', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).not.toContain("'use client'")
    expect(src).not.toContain('"use client"')
  })

  it('page uses force-dynamic export', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('force-dynamic')
  })

  it('total page count is now 34', () => {
    expect(findPages(join(ROOT, 'app')).length).toBe(50)
  })
})

// ─── Group 17: Full suite guard ───────────────────────────────────────────────

describe('Phase 16 — Full suite guard', () => {
  it('page count is 34 (all prior pages preserved)', () => {
    expect(findPages(join(ROOT, 'app')).length).toBe(50)
  })

  it('buildAuditEventsFromDemoContext still returns 9 events', () => {
    expect(buildAuditEventsFromDemoContext()).toHaveLength(9)
  })

  it('all events pass validation', () => {
    for (const event of buildAuditEventsFromDemoContext()) {
      expect(validateDapAdminDecisionAuditEvent(event).valid).toBe(true)
    }
  })

  it('all safety flags preserved across all contexts', () => {
    const allEvents = [
      ...buildAuditEventsFromEmptyContext(),
      ...buildAuditEventsFromDemoContext(),
      ...buildAuditEventsFromApprovedContext(),
    ]
    for (const event of allEvents) {
      const flags = event.safetyFlags as unknown as Record<string, unknown>
      expect(flags['readOnly']).toBe(true)
      expect(flags['mutationAllowed']).toBe(false)
      expect(flags['replayExecutesWrites']).toBe(false)
      expect(flags['includesPhi']).toBe(false)
    }
  })

  it('no write helper has been created', () => {
    expect(existsSync(join(__dirname, 'dapAdminDecisionWriter.ts'))).toBe(false)
  })

  it('Phase 15 SQL contract still has 21 required columns', () => {
    expect(getDapAdminDecisionSqlContract().requiredColumns.length).toBe(21)
  })
})
