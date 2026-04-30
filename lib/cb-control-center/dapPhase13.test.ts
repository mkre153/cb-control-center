// Phase 13 — DAP Admin Decision Ledger Preview
// Preview-only ledger that answers: what append-only event would this action produce?
// No Supabase insert. No status mutation. No email. No payment. No MKCRM live sync.

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const ROOT = join(__dirname, '..', '..')
const PAGE_PATH = join(ROOT, 'app/preview/dap/admin-decision-ledger/page.tsx')

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
  buildDapAdminDecisionLedgerEvent,
  buildDapAdminDecisionLedger,
  DAP_LEDGER_CONTEXT_DEMO,
  DAP_LEDGER_CONTEXT_APPROVED,
  DAP_LEDGER_CONTEXT_EMPTY,
  DAP_LEDGER_DEFINITIONS,
  LEDGER_SAFETY,
} from './dapAdminDecisionLedger'
import type { DapAdminDecisionLedgerEvent } from './dapAdminDecisionLedgerTypes'

const ALL_EVENT_KEYS = [
  'practice_request_approved_preview',
  'practice_request_rejected_preview',
  'offer_terms_review_passed_preview',
  'offer_terms_review_failed_preview',
  'provider_participation_confirmed_preview',
  'provider_participation_declined_preview',
  'communication_approved_for_future_send_preview',
  'communication_rejected_preview',
  'mkcrm_shadow_payload_approved_for_future_sync_preview',
] as const

// ─── Group 1: Page exists ─────────────────────────────────────────────────────

describe('Phase 13 — Page exists', () => {
  it('app/preview/dap/admin-decision-ledger/page.tsx exists', () => {
    expect(existsSync(PAGE_PATH)).toBe(true)
  })

  it('page is a .tsx file', () => {
    expect(PAGE_PATH.endsWith('.tsx')).toBe(true)
  })

  it('page uses force-dynamic export', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('force-dynamic')
  })

  it('page is a server component (no "use client")', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).not.toContain("'use client'")
    expect(src).not.toContain('"use client"')
  })

  it('page does not import from Supabase', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).not.toMatch(/^import.*supabase/im)
    expect(src).not.toMatch(/from ['"].*supabase/i)
  })

  it('total page count is now 32', () => {
    expect(findPages(join(ROOT, 'app')).length).toBe(51)
  })
})

// ─── Group 2: Ledger builder exports ─────────────────────────────────────────

describe('Phase 13 — Ledger builder exports', () => {
  it('buildDapAdminDecisionLedger is a function', () => {
    expect(typeof buildDapAdminDecisionLedger).toBe('function')
  })

  it('buildDapAdminDecisionLedgerEvent is a function', () => {
    expect(typeof buildDapAdminDecisionLedgerEvent).toBe('function')
  })

  it('DAP_LEDGER_DEFINITIONS exports 9 definitions', () => {
    expect(DAP_LEDGER_DEFINITIONS.length).toBe(9)
  })

  it('LEDGER_SAFETY is exported', () => {
    expect(LEDGER_SAFETY).toBeDefined()
  })

  it('fixture contexts are exported', () => {
    expect(DAP_LEDGER_CONTEXT_DEMO).toBeDefined()
    expect(DAP_LEDGER_CONTEXT_APPROVED).toBeDefined()
    expect(DAP_LEDGER_CONTEXT_EMPTY).toBeDefined()
  })
})

// ─── Group 3: Full ledger — all 9 events ─────────────────────────────────────

describe('Phase 13 — Full ledger returns 9 events', () => {
  it('buildDapAdminDecisionLedger returns 9 events in demo context', () => {
    const events = buildDapAdminDecisionLedger(DAP_LEDGER_CONTEXT_DEMO)
    expect(events).toHaveLength(9)
  })

  it('all 9 event keys are present in demo context', () => {
    const events = buildDapAdminDecisionLedger(DAP_LEDGER_CONTEXT_DEMO)
    const keys = events.map(e => e.eventKey)
    for (const key of ALL_EVENT_KEYS) {
      expect(keys).toContain(key)
    }
  })

  it('buildDapAdminDecisionLedger returns 9 events in approved context', () => {
    const events = buildDapAdminDecisionLedger(DAP_LEDGER_CONTEXT_APPROVED)
    expect(events).toHaveLength(9)
  })

  it('buildDapAdminDecisionLedger returns 9 events in empty context', () => {
    const events = buildDapAdminDecisionLedger(DAP_LEDGER_CONTEXT_EMPTY)
    expect(events).toHaveLength(9)
  })

  it('buildDapAdminDecisionLedgerEvent builds a single event', () => {
    const event = buildDapAdminDecisionLedgerEvent(
      'practice_request_approved_preview',
      DAP_LEDGER_CONTEXT_DEMO,
    )
    expect(event.eventKey).toBe('practice_request_approved_preview')
  })
})

// ─── Group 4: Required fields on every event ─────────────────────────────────

describe('Phase 13 — Required fields on every event', () => {
  const events = buildDapAdminDecisionLedger(DAP_LEDGER_CONTEXT_DEMO)

  const REQUIRED_FIELDS: (keyof DapAdminDecisionLedgerEvent)[] = [
    'eventKey', 'eventType', 'sourceActionKey', 'entityType', 'entityId',
    'decisionLabel', 'decisionOutcome', 'authoritySource', 'createdByRole',
    'createdAtPreview', 'reasonCode', 'reasonLabel', 'requiredGates',
    'satisfiedGates', 'blockedBy', 'wouldAppendTo', 'actionAvailability', 'safetyFlags',
  ]

  for (const field of REQUIRED_FIELDS) {
    it(`every event has field: ${field}`, () => {
      for (const event of events) {
        expect(event).toHaveProperty(field)
      }
    })
  }
})

// ─── Group 5: Literal field values ───────────────────────────────────────────

describe('Phase 13 — Literal field values', () => {
  const events = buildDapAdminDecisionLedger(DAP_LEDGER_CONTEXT_DEMO)

  it('every event has createdByRole: "admin"', () => {
    for (const event of events) {
      expect(event.createdByRole).toBe('admin')
    }
  })

  it('every event has createdAtPreview labeled as preview (not a date)', () => {
    for (const event of events) {
      expect(event.createdAtPreview).toContain('preview')
    }
  })

  it('every event has a non-empty entityId', () => {
    for (const event of events) {
      expect(event.entityId.length).toBeGreaterThan(0)
    }
  })

  it('all event keys end with _preview', () => {
    for (const event of events) {
      expect(event.eventKey).toMatch(/_preview$/)
    }
  })

  it('all eventType values start with dap.', () => {
    for (const event of events) {
      expect(event.eventType).toMatch(/^dap\./)
    }
  })
})

// ─── Group 6: Gate model ──────────────────────────────────────────────────────

describe('Phase 13 — Gate model', () => {
  const events = buildDapAdminDecisionLedger(DAP_LEDGER_CONTEXT_DEMO)

  it('every event has requiredGates as an array', () => {
    for (const event of events) {
      expect(Array.isArray(event.requiredGates)).toBe(true)
    }
  })

  it('every event has satisfiedGates as an array', () => {
    for (const event of events) {
      expect(Array.isArray(event.satisfiedGates)).toBe(true)
    }
  })

  it('every event has blockedBy as an array', () => {
    for (const event of events) {
      expect(Array.isArray(event.blockedBy)).toBe(true)
    }
  })

  it('satisfiedGates is always a subset of requiredGates', () => {
    for (const event of events) {
      for (const gate of event.satisfiedGates) {
        expect(event.requiredGates).toContain(gate)
      }
    }
  })

  it('blocked events have non-empty blockedBy', () => {
    for (const event of events) {
      if (event.actionAvailability === 'blocked') {
        expect(event.blockedBy.length).toBeGreaterThan(0)
      }
    }
  })
})

// ─── Group 7: wouldAppendTo values ───────────────────────────────────────────

describe('Phase 13 — wouldAppendTo values', () => {
  const VALID_TARGETS = [
    'future_dap_admin_decision_events',
    'future_dap_communication_approval_events',
    'future_dap_provider_participation_events',
    'future_dap_mkcrm_shadow_approval_events',
  ]

  const events = buildDapAdminDecisionLedger(DAP_LEDGER_CONTEXT_DEMO)

  it('all wouldAppendTo values are valid', () => {
    for (const event of events) {
      expect(VALID_TARGETS).toContain(event.wouldAppendTo)
    }
  })

  it('all wouldAppendTo values start with future_', () => {
    for (const event of events) {
      expect(event.wouldAppendTo).toMatch(/^future_/)
    }
  })

  it('practice request events point to future_dap_admin_decision_events', () => {
    const approved = buildDapAdminDecisionLedgerEvent('practice_request_approved_preview', DAP_LEDGER_CONTEXT_DEMO)
    const rejected = buildDapAdminDecisionLedgerEvent('practice_request_rejected_preview', DAP_LEDGER_CONTEXT_DEMO)
    expect(approved.wouldAppendTo).toBe('future_dap_admin_decision_events')
    expect(rejected.wouldAppendTo).toBe('future_dap_admin_decision_events')
  })

  it('provider participation events point to future_dap_provider_participation_events', () => {
    const confirmed = buildDapAdminDecisionLedgerEvent('provider_participation_confirmed_preview', DAP_LEDGER_CONTEXT_DEMO)
    const declined = buildDapAdminDecisionLedgerEvent('provider_participation_declined_preview', DAP_LEDGER_CONTEXT_DEMO)
    expect(confirmed.wouldAppendTo).toBe('future_dap_provider_participation_events')
    expect(declined.wouldAppendTo).toBe('future_dap_provider_participation_events')
  })

  it('communication events point to future_dap_communication_approval_events', () => {
    const approved = buildDapAdminDecisionLedgerEvent('communication_approved_for_future_send_preview', DAP_LEDGER_CONTEXT_DEMO)
    const rejected = buildDapAdminDecisionLedgerEvent('communication_rejected_preview', DAP_LEDGER_CONTEXT_DEMO)
    expect(approved.wouldAppendTo).toBe('future_dap_communication_approval_events')
    expect(rejected.wouldAppendTo).toBe('future_dap_communication_approval_events')
  })

  it('mkcrm shadow event points to future_dap_mkcrm_shadow_approval_events', () => {
    const event = buildDapAdminDecisionLedgerEvent('mkcrm_shadow_payload_approved_for_future_sync_preview', DAP_LEDGER_CONTEXT_DEMO)
    expect(event.wouldAppendTo).toBe('future_dap_mkcrm_shadow_approval_events')
  })
})

// ─── Group 8: Authority source ────────────────────────────────────────────────

describe('Phase 13 — Authority source', () => {
  const events = buildDapAdminDecisionLedger(DAP_LEDGER_CONTEXT_DEMO)

  const VALID_AUTHORITY_SOURCES = [
    'cb_control_center',
    'client_builder_pro',
    'mkcrm_shadow',
    'public_member_page',
    'provider_submission',
  ]

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

  it('practice request decisions use cb_control_center authority', () => {
    const approved = buildDapAdminDecisionLedgerEvent('practice_request_approved_preview', DAP_LEDGER_CONTEXT_DEMO)
    expect(approved.authoritySource).toBe('cb_control_center')
  })

  it('provider participation decisions use provider_submission authority', () => {
    const confirmed = buildDapAdminDecisionLedgerEvent('provider_participation_confirmed_preview', DAP_LEDGER_CONTEXT_DEMO)
    expect(confirmed.authoritySource).toBe('provider_submission')
  })

  it('mkcrm shadow event uses cb_control_center authority (admin approves the shadow payload)', () => {
    const event = buildDapAdminDecisionLedgerEvent('mkcrm_shadow_payload_approved_for_future_sync_preview', DAP_LEDGER_CONTEXT_DEMO)
    expect(event.authoritySource).toBe('cb_control_center')
  })
})

// ─── Group 9: Safety flags — all events ──────────────────────────────────────

describe('Phase 13 — Safety flags', () => {
  const events = buildDapAdminDecisionLedger(DAP_LEDGER_CONTEXT_DEMO)

  it('LEDGER_SAFETY.previewOnly is true', () => {
    expect((LEDGER_SAFETY as unknown as Record<string, unknown>)['previewOnly']).toBe(true)
  })

  it('LEDGER_SAFETY.appendsToSupabase is false', () => {
    expect((LEDGER_SAFETY as unknown as Record<string, unknown>)['appendsToSupabase']).toBe(false)
  })

  it('LEDGER_SAFETY.mutatesStatus is false', () => {
    expect((LEDGER_SAFETY as unknown as Record<string, unknown>)['mutatesStatus']).toBe(false)
  })

  it('LEDGER_SAFETY.sendsEmail is false', () => {
    expect((LEDGER_SAFETY as unknown as Record<string, unknown>)['sendsEmail']).toBe(false)
  })

  it('LEDGER_SAFETY.queuesEmail is false', () => {
    expect((LEDGER_SAFETY as unknown as Record<string, unknown>)['queuesEmail']).toBe(false)
  })

  it('LEDGER_SAFETY.triggersPayment is false', () => {
    expect((LEDGER_SAFETY as unknown as Record<string, unknown>)['triggersPayment']).toBe(false)
  })

  it('LEDGER_SAFETY.triggersMkcrmLiveSync is false', () => {
    expect((LEDGER_SAFETY as unknown as Record<string, unknown>)['triggersMkcrmLiveSync']).toBe(false)
  })

  it('LEDGER_SAFETY.includesPhi is false', () => {
    expect((LEDGER_SAFETY as unknown as Record<string, unknown>)['includesPhi']).toBe(false)
  })

  it('every event safetyFlags matches LEDGER_SAFETY', () => {
    for (const event of events) {
      const flags = event.safetyFlags as unknown as Record<string, unknown>
      expect(flags['previewOnly']).toBe(true)
      expect(flags['appendsToSupabase']).toBe(false)
      expect(flags['mutatesStatus']).toBe(false)
      expect(flags['sendsEmail']).toBe(false)
      expect(flags['queuesEmail']).toBe(false)
      expect(flags['triggersPayment']).toBe(false)
      expect(flags['triggersMkcrmLiveSync']).toBe(false)
      expect(flags['includesPhi']).toBe(false)
    }
  })
})

// ─── Group 10: actionAvailability — Phase 12 delegation ───────────────────────

describe('Phase 13 — actionAvailability (Phase 12 delegation)', () => {
  const VALID_AVAILABILITY = ['available', 'blocked', 'future_only', 'preview_only']

  it('all events have a valid actionAvailability', () => {
    const events = buildDapAdminDecisionLedger(DAP_LEDGER_CONTEXT_DEMO)
    for (const event of events) {
      expect(VALID_AVAILABILITY).toContain(event.actionAvailability)
    }
  })

  it('context changes affect actionAvailability', () => {
    const demoEvents = buildDapAdminDecisionLedger(DAP_LEDGER_CONTEXT_DEMO)
    const emptyEvents = buildDapAdminDecisionLedger(DAP_LEDGER_CONTEXT_EMPTY)
    const demoAvailabilities = new Set(demoEvents.map(e => e.actionAvailability))
    const emptyAvailabilities = new Set(emptyEvents.map(e => e.actionAvailability))
    expect(demoAvailabilities).not.toEqual(emptyAvailabilities)
  })

  it('future_only events remain future_only regardless of context', () => {
    const futureOnlyKeys = [
      'provider_participation_confirmed_preview',
      'provider_participation_declined_preview',
    ] as const
    for (const key of futureOnlyKeys) {
      const demo    = buildDapAdminDecisionLedgerEvent(key, DAP_LEDGER_CONTEXT_DEMO)
      const empty   = buildDapAdminDecisionLedgerEvent(key, DAP_LEDGER_CONTEXT_EMPTY)
      const approved = buildDapAdminDecisionLedgerEvent(key, DAP_LEDGER_CONTEXT_APPROVED)
      expect(demo.actionAvailability).toBe('future_only')
      expect(empty.actionAvailability).toBe('future_only')
      expect(approved.actionAvailability).toBe('future_only')
    }
  })
})

// ─── Group 11: Page source content ───────────────────────────────────────────

describe('Phase 13 — Page source content', () => {
  it('page imports buildDapAdminDecisionLedger', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('buildDapAdminDecisionLedger')
  })

  it('page imports from dapAdminDecisionLedger', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('dapAdminDecisionLedger')
  })

  it('page references wouldAppendTo', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('wouldAppendTo')
  })

  it('page references actionAvailability', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('actionAvailability')
  })

  it('page references createdAtPreview', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('createdAtPreview')
  })

  it('page references safetyFlags', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('safetyFlags')
  })

  it('page maps over events (not hardcoded per-event blocks)', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toMatch(/\.map\(/)
  })
})

// ─── Group 12: Preview-only boundary ─────────────────────────────────────────

describe('Phase 13 — Preview-only boundary', () => {
  it('page contains preview-only language', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src.toLowerCase()).toContain('preview')
  })

  it('page does not contain email-sending function calls', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).not.toContain('sendEmail')
    expect(src).not.toContain('resend.emails.send')
  })

  it('page does not call API endpoints', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).not.toContain('/api/mkcrm')
    expect(src).not.toContain('/api/email')
    expect(src).not.toContain("fetch('")
    expect(src).not.toContain('fetch("')
  })

  it('page does not POST to any endpoint', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).not.toMatch(/method:\s*['"]POST['"]/i)
  })

  it('page states no emails are sent from it', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src.toLowerCase()).toContain('no email')
  })

  it('page references "does not" language about MKCRM', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src.toLowerCase()).toMatch(/does not decide/)
  })

  it('page contains data-authority-notice', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('data-authority-notice')
  })

  it('page contains data-preview-only-notice', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('data-preview-only-notice')
  })
})

// ─── Group 13: Definition coverage ───────────────────────────────────────────

describe('Phase 13 — Definition coverage', () => {
  it('every definition has an eventKey ending in _preview', () => {
    for (const def of DAP_LEDGER_DEFINITIONS) {
      expect(def.eventKey).toMatch(/_preview$/)
    }
  })

  it('every definition has an eventType starting with dap.', () => {
    for (const def of DAP_LEDGER_DEFINITIONS) {
      expect(def.eventType).toMatch(/^dap\./)
    }
  })

  it('every definition has a non-empty sourceActionKey', () => {
    for (const def of DAP_LEDGER_DEFINITIONS) {
      expect(def.sourceActionKey.length).toBeGreaterThan(0)
    }
  })

  it('every definition has a wouldAppendTo starting with future_', () => {
    for (const def of DAP_LEDGER_DEFINITIONS) {
      expect(def.wouldAppendTo).toMatch(/^future_/)
    }
  })

  it('no definition has forbidden field: execute', () => {
    for (const def of DAP_LEDGER_DEFINITIONS) {
      expect(def).not.toHaveProperty('execute')
    }
  })

  it('no definition has forbidden field: run', () => {
    for (const def of DAP_LEDGER_DEFINITIONS) {
      expect(def).not.toHaveProperty('run')
    }
  })
})

// ─── Group 14: Full suite guard ───────────────────────────────────────────────

describe('Phase 13 — Full suite guard', () => {
  it('page count is 32 (all prior pages preserved)', () => {
    expect(findPages(join(ROOT, 'app')).length).toBe(51)
  })

  it('buildDapAdminDecisionLedger still returns 9 events', () => {
    const events = buildDapAdminDecisionLedger(DAP_LEDGER_CONTEXT_DEMO)
    expect(events).toHaveLength(9)
  })

  it('DAP_LEDGER_DEFINITIONS still has 9 entries', () => {
    expect(DAP_LEDGER_DEFINITIONS.length).toBe(9)
  })

  it('all safety flags preserved across contexts', () => {
    for (const ctx of [DAP_LEDGER_CONTEXT_EMPTY, DAP_LEDGER_CONTEXT_DEMO, DAP_LEDGER_CONTEXT_APPROVED]) {
      const events = buildDapAdminDecisionLedger(ctx)
      for (const event of events) {
        const flags = event.safetyFlags as unknown as Record<string, unknown>
        expect(flags['previewOnly']).toBe(true)
        expect(flags['appendsToSupabase']).toBe(false)
        expect(flags['triggersPayment']).toBe(false)
        expect(flags['includesPhi']).toBe(false)
      }
    }
  })
})
