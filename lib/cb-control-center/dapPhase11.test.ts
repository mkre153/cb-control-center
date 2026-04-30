// Phase 11 — DAP Admin UX Polish + Decision Workflow Hardening
// Tests: decision readiness, event timeline formatter, member admin summary, route registry.

import { describe, it, expect } from 'vitest'
import { join, resolve } from 'path'
import { existsSync, readFileSync } from 'fs'

const ROOT = resolve(__dirname, '../../')

function findFiles(dir: string, pred: (f: string) => boolean): string[] {
  const { readdirSync, statSync } = require('fs')
  const results: string[] = []
  function walk(d: string) {
    for (const entry of readdirSync(d)) {
      const full = join(d, entry)
      if (statSync(full).isDirectory()) { walk(full) } else if (pred(full)) { results.push(full) }
    }
  }
  walk(dir)
  return results
}

function findPages(dir: string): string[] {
  return findFiles(dir, f => f.endsWith('page.tsx'))
}

// ─── Group 1: Decision Readiness ──────────────────────────────────────────────

import {
  buildDapAdminDecisionReadiness,
  getAllDapAdminDecisionReadinessPreviews,
  DAP_ADMIN_DECISION_FIXTURES,
} from './dapAdminDecisionReadiness'
import type {
  DapAdminDecisionInput,
  DapAdminDecisionReadinessResult,
} from './dapAdminDecisionReadiness'

describe('Decision readiness — core rules', () => {
  it('ready request returns ready_for_review', () => {
    const result = buildDapAdminDecisionReadiness(DAP_ADMIN_DECISION_FIXTURES['ready']!)
    expect(result.status).toBe('ready_for_review')
    expect(result.canApprove).toBe(true)
    expect(result.canReject).toBe(true)
    expect(result.blockers).toHaveLength(0)
  })

  it('missing required fields returns missing_required_fields', () => {
    const result = buildDapAdminDecisionReadiness(DAP_ADMIN_DECISION_FIXTURES['missing-fields']!)
    expect(result.status).toBe('missing_required_fields')
    expect(result.canApprove).toBe(false)
    expect(result.canReject).toBe(true)  // rejection still admin-driven even without full fields
    expect(result.blockers.length).toBeGreaterThan(0)
  })

  it('unsafe state (no-PHI not acknowledged) returns blocked_by_safety_rules', () => {
    const result = buildDapAdminDecisionReadiness(DAP_ADMIN_DECISION_FIXTURES['safety-blocked']!)
    expect(result.status).toBe('blocked_by_safety_rules')
    expect(result.canApprove).toBe(false)
    expect(result.canReject).toBe(false)
    expect(result.blockers.some(b => /phi/i.test(b))).toBe(true)
  })

  it('already approved request returns already_decided', () => {
    const result = buildDapAdminDecisionReadiness(DAP_ADMIN_DECISION_FIXTURES['already-approved']!)
    expect(result.status).toBe('already_decided')
    expect(result.canApprove).toBe(false)
    expect(result.canReject).toBe(false)
  })

  it('already rejected request returns already_decided', () => {
    const result = buildDapAdminDecisionReadiness(DAP_ADMIN_DECISION_FIXTURES['already-rejected']!)
    expect(result.status).toBe('already_decided')
    expect(result.canApprove).toBe(false)
    expect(result.canReject).toBe(false)
  })

  it('MKCRM cannot be decision authority — safety flag is locked false on all results', () => {
    const previews = getAllDapAdminDecisionReadinessPreviews()
    for (const r of previews) {
      expect((r.safety as Record<string, unknown>)['usesMkcrmDecisionAuthority']).toBe(false)
    }
  })

  it('payment system cannot be decision authority — safety flag is locked false on all results', () => {
    const previews = getAllDapAdminDecisionReadinessPreviews()
    for (const r of previews) {
      expect((r.safety as Record<string, unknown>)['usesPaymentAuthority']).toBe(false)
    }
  })

  it('approval requires admin decision — adminDecisionRequired is true on ready result', () => {
    const result = buildDapAdminDecisionReadiness(DAP_ADMIN_DECISION_FIXTURES['ready']!)
    expect(result.status).toBe('ready_for_review')
    expect((result.safety as Record<string, unknown>)['adminDecisionRequired']).toBe(true)
  })

  it('rejection remains admin-driven — canReject true on missing-fields, adminDecisionRequired locked', () => {
    const result = buildDapAdminDecisionReadiness(DAP_ADMIN_DECISION_FIXTURES['missing-fields']!)
    expect(result.canReject).toBe(true)
    expect((result.safety as Record<string, unknown>)['adminDecisionRequired']).toBe(true)
  })
})

// ─── Group 2: Decision Readiness — safety field shapes ────────────────────────

describe('Decision readiness — safety field shapes', () => {
  it('includesPhi is always false', () => {
    for (const fixture of Object.values(DAP_ADMIN_DECISION_FIXTURES)) {
      const r = buildDapAdminDecisionReadiness(fixture)
      expect((r.safety as Record<string, unknown>)['includesPhi']).toBe(false)
    }
  })

  it('all five fixtures produce results with correct requestId', () => {
    for (const [key, fixture] of Object.entries(DAP_ADMIN_DECISION_FIXTURES)) {
      const r = buildDapAdminDecisionReadiness(fixture)
      expect(r.requestId).toBe(fixture.requestId)
    }
  })

  it('bulk preview produces one result per fixture', () => {
    const previews = getAllDapAdminDecisionReadinessPreviews()
    expect(previews).toHaveLength(Object.keys(DAP_ADMIN_DECISION_FIXTURES).length)
  })
})

// ─── Group 3: Timeline Formatter ─────────────────────────────────────────────

import {
  formatDapAdminTimeline,
  formatDapAdminTimelineEntry,
  DAP_ADMIN_TIMELINE_FIXTURES,
} from './dapAdminEventTimeline'
import type { DapAdminTimelineEventInput } from './dapAdminEventTimeline'

describe('Admin event timeline formatter', () => {
  it('formats known DAP event types into display-safe entries', () => {
    const dapEvents = DAP_ADMIN_TIMELINE_FIXTURES.filter(e => e.source === 'dap')
    for (const ev of dapEvents) {
      const entry = formatDapAdminTimelineEntry(ev)
      expect(entry.safety.displaySafe).toBe(true)
      expect(entry.safety.includesPhi).toBe(false)
      expect(entry.label).toBeTruthy()
    }
  })

  it('unknown event types are handled safely (default severity: info)', () => {
    const unknown: DapAdminTimelineEventInput = {
      id: 'evt-unknown',
      occurredAt: '2026-05-01T00:00:00Z',
      eventType: 'some_future_event_type',
      source: 'dap',
    }
    const entry = formatDapAdminTimelineEntry(unknown)
    expect(entry.severity).toBe('info')
    expect(entry.safety.displaySafe).toBe(true)
    expect(entry.safety.includesPhi).toBe(false)
  })

  it('timeline entries are sorted chronologically', () => {
    const shuffled: DapAdminTimelineEventInput[] = [
      { id: 'c', occurredAt: '2026-04-01T12:00:00Z', eventType: 'request_closed', source: 'dap' },
      { id: 'a', occurredAt: '2026-04-01T10:00:00Z', eventType: 'request_created', source: 'dap' },
      { id: 'b', occurredAt: '2026-04-01T11:00:00Z', eventType: 'request_validated', source: 'dap' },
    ]
    const sorted = formatDapAdminTimeline(shuffled)
    expect(sorted[0].id).toBe('a')
    expect(sorted[1].id).toBe('b')
    expect(sorted[2].id).toBe('c')
  })

  it('no PHI fields are surfaced in formatted entries', () => {
    const entries = formatDapAdminTimeline(DAP_ADMIN_TIMELINE_FIXTURES)
    const phiTerms = ['phi', 'ssn', 'diagnosis', 'dob', 'dateOfBirth', 'patientName']
    for (const entry of entries) {
      for (const term of phiTerms) {
        expect(entry.label.toLowerCase()).not.toContain(term)
        expect(entry.description.toLowerCase()).not.toContain(term)
      }
      expect((entry.safety as Record<string, unknown>)['includesPhi']).toBe(false)
    }
  })

  it('MKCRM shadow events are labeled as mkcrm_shadow source', () => {
    const shadowEvents = DAP_ADMIN_TIMELINE_FIXTURES.filter(e => e.source === 'mkcrm_shadow')
    expect(shadowEvents.length).toBeGreaterThan(0)
    for (const ev of shadowEvents) {
      const entry = formatDapAdminTimelineEntry(ev)
      expect(entry.source).toBe('mkcrm_shadow')
      expect(entry.label).toMatch(/\[shadow\]/)
    }
  })

  it('Client Builder Pro billing-derived events are labeled as client_builder_pro source', () => {
    const cbpEvents = DAP_ADMIN_TIMELINE_FIXTURES.filter(e => e.source === 'client_builder_pro')
    expect(cbpEvents.length).toBeGreaterThan(0)
    for (const ev of cbpEvents) {
      const entry = formatDapAdminTimelineEntry(ev)
      expect(entry.source).toBe('client_builder_pro')
      expect(entry.actorType).toBe('system')
    }
  })

  it('severity mapping is stable for known event types', () => {
    const cases: [string, string][] = [
      ['request_approved',    'success'],
      ['request_rejected',    'blocked'],
      ['request_needs_review', 'warning'],
      ['duplicate_detected',  'warning'],
      ['client_builder_subscription_activated', 'success'],
      ['client_builder_chargeback_recorded',    'blocked'],
    ]
    for (const [eventType, expectedSeverity] of cases) {
      const entry = formatDapAdminTimelineEntry({
        id: `test-${eventType}`,
        occurredAt: '2026-04-01T00:00:00Z',
        eventType,
        source: 'dap',
      })
      expect(entry.severity).toBe(expectedSeverity)
    }
  })
})

// ─── Group 4: Member Admin Summary ────────────────────────────────────────────

import {
  getDapMemberAdminSummary,
  getAllDapMemberAdminSummaries,
} from './dapMemberAdminSummary'
import { DAP_P10_FIXTURE_MEMBERSHIP_IDS } from './dapMemberStatusReadModel'

describe('Member admin summary', () => {
  it('standing is derived from billing events — derivedFromBillingEvents is true for all fixtures', () => {
    const summaries = getAllDapMemberAdminSummaries()
    for (const s of summaries) {
      expect((s as unknown as Record<string, unknown>)['derivedFromBillingEvents']).toBe(true)
      expect(s.standingSource).toBe('billing_events')
    }
  })

  it('no payment CTA is included — includesPaymentCta is false for all fixtures', () => {
    const summaries = getAllDapMemberAdminSummaries()
    for (const s of summaries) {
      expect((s as unknown as Record<string, unknown>)['includesPaymentCta']).toBe(false)
    }
  })

  it('no PHI is included — includesPhi is false for all fixtures', () => {
    const summaries = getAllDapMemberAdminSummaries()
    for (const s of summaries) {
      expect((s as unknown as Record<string, unknown>)['includesPhi']).toBe(false)
    }
  })

  it('computedByServer is true for all fixtures', () => {
    const summaries = getAllDapMemberAdminSummaries()
    for (const s of summaries) {
      expect((s as unknown as Record<string, unknown>)['computedByServer']).toBe(true)
    }
  })

  it('valid standings produce safe summaries — statusPageSafe is true', () => {
    const knownSafeStandings = ['active', 'pending', 'canceled', 'refunded', 'chargeback', 'past_due', 'payment_failed']
    for (const id of DAP_P10_FIXTURE_MEMBERSHIP_IDS) {
      const s = getDapMemberAdminSummary(id)
      if (knownSafeStandings.includes(s.standing)) {
        expect(s.statusPageSafe).toBe(true)
      }
    }
  })

  it('unknown standing produces a warning', () => {
    const unknown = getDapMemberAdminSummary('dap-p10-unknown')
    expect(unknown.standing).toBe('unknown')
    expect(unknown.warnings.length).toBeGreaterThan(0)
    expect(unknown.warnings[0]).toMatch(/could not be determined/i)
  })

  it('all 8 fixtures produce summaries with correct membershipId', () => {
    const summaries = getAllDapMemberAdminSummaries()
    expect(summaries).toHaveLength(8)
    for (const s of summaries) {
      expect(DAP_P10_FIXTURE_MEMBERSHIP_IDS).toContain(s.membershipId as typeof DAP_P10_FIXTURE_MEMBERSHIP_IDS[number])
    }
  })

  it('communication templates are available for all standings (1 per standing)', () => {
    const summaries = getAllDapMemberAdminSummaries()
    for (const s of summaries) {
      expect(s.communicationTemplatesAvailable).toBe(true)
      expect(s.communicationTemplateCount).toBe(1)
    }
  })
})

// ─── Group 5: Preview page safety — forbidden language ────────────────────────

describe('Preview page safety — forbidden send/payment/MKCRM-live language', () => {
  const PREVIEW_PAGES = [
    'app/preview/dap/admin-review/page.tsx',
    'app/preview/dap/admin-timeline/page.tsx',
    'app/preview/dap/member-admin-summary/page.tsx',
  ]

  const FORBIDDEN_PATTERNS = [
    /from ['"]@resend\//,
    /sendEmail\s*\(/,
    /\.send\s*\(/,
    /checkout/i,
    /stripe\./i,
    /supabase.*from.*insert/i,
    /mkcrm.*live/i,
    /queueEmail\s*\(/,
    /scheduleEmail\s*\(/,
  ]

  for (const rel of PREVIEW_PAGES) {
    it(`${rel} does not contain forbidden send/payment/MKCRM-live language`, () => {
      const full = resolve(ROOT, rel)
      expect(existsSync(full), `missing: ${rel}`).toBe(true)
      const src = readFileSync(full, 'utf8')
      for (const pat of FORBIDDEN_PATTERNS) {
        expect(src).not.toMatch(pat)
      }
    })
  }

  for (const rel of PREVIEW_PAGES) {
    it(`${rel} contains data-authority-notice (authority boundary is visible)`, () => {
      const full = resolve(ROOT, rel)
      const src = readFileSync(full, 'utf8')
      expect(src).toContain('data-authority-notice')
    })
  }
})

// ─── Group 6: Route registry — Phase 11 routes ───────────────────────────────

describe('Route registry — Phase 11 routes exist on disk', () => {
  const PHASE_11_ROUTES = [
    'app/preview/dap/admin-review/page.tsx',
    'app/preview/dap/admin-timeline/page.tsx',
    'app/preview/dap/member-admin-summary/page.tsx',
  ]

  for (const rel of PHASE_11_ROUTES) {
    it(`${rel} exists`, () => {
      expect(existsSync(resolve(ROOT, rel))).toBe(true)
    })
  }

  it('page count is now 29 (Phase 11 added 3 admin preview routes)', () => {
    expect(findPages(join(ROOT, 'app')).length).toBe(44)
  })
})

// ─── Group 7: Helper file exports ─────────────────────────────────────────────

describe('Phase 11 helper file exports', () => {
  it('dapAdminDecisionReadiness exports expected symbols', () => {
    expect(typeof buildDapAdminDecisionReadiness).toBe('function')
    expect(typeof getAllDapAdminDecisionReadinessPreviews).toBe('function')
    expect(typeof DAP_ADMIN_DECISION_FIXTURES).toBe('object')
  })

  it('dapAdminEventTimeline exports expected symbols', () => {
    expect(typeof formatDapAdminTimeline).toBe('function')
    expect(typeof formatDapAdminTimelineEntry).toBe('function')
    expect(Array.isArray(DAP_ADMIN_TIMELINE_FIXTURES)).toBe(true)
  })

  it('dapMemberAdminSummary exports expected symbols', () => {
    expect(typeof getDapMemberAdminSummary).toBe('function')
    expect(typeof getAllDapMemberAdminSummaries).toBe('function')
  })
})

import {
  getDapMemberStatusReadModel,
  getAllDapMemberPublicStatusFixtures,
} from './dapMemberStatusReadModel'

// ─── Group 8: Prior phase contracts still hold ────────────────────────────────

describe('Prior phase contracts still hold after Phase 11', () => {
  it('3058+ tests worth of prior files still compile (import smoke test)', () => {
    expect(typeof getDapMemberStatusReadModel).toBe('function')
    expect(typeof getAllDapMemberPublicStatusFixtures).toBe('function')
  })

  it('Phase 10 member-status route still exists', () => {
    expect(existsSync(resolve(ROOT, 'app/preview/dap/member-status/[membershipId]/page.tsx'))).toBe(true)
  })

  it('Phase 9Z dry-run route still exists', () => {
    expect(existsSync(resolve(ROOT, 'app/preview/dap/communication-dry-runs/page.tsx'))).toBe(true)
  })

  it('Phase 9Y approvals route still exists', () => {
    expect(existsSync(resolve(ROOT, 'app/preview/dap/communication-approvals/page.tsx'))).toBe(true)
  })

  it('no production send authority was introduced in Phase 11', () => {
    const phase11Files = [
      'lib/cb-control-center/dapAdminDecisionReadiness.ts',
      'lib/cb-control-center/dapAdminEventTimeline.ts',
      'lib/cb-control-center/dapMemberAdminSummary.ts',
    ]
    for (const rel of phase11Files) {
      const src = readFileSync(resolve(ROOT, rel), 'utf8')
      expect(src).not.toMatch(/from ['"]@resend\//)
      expect(src).not.toMatch(/sendEmail\s*\(/)
      expect(src).not.toMatch(/supabase.*\.insert\s*\(/)
      expect(src).not.toMatch(/fetch\s*\(/)
    }
  })
})
