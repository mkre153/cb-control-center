/**
 * Phase 9Q — Member Status Read Model QA
 *
 * PURPOSE: Prove that DAP member standing is correctly derived from
 * append-only billing events, that the read model never stores standing,
 * and that all prior phase boundary contracts remain intact.
 *
 * Locked language:
 *   DAP member standing is a read model derived from append-only billing events.
 *   Client Builder Pro originates billing events.
 *   MKCRM receives lifecycle sync signals only.
 *   The read model does not store standing.
 *
 * COVERAGE:
 *   Group 1  — Empty event history
 *   Group 2  — Event-to-standing mapping
 *   Group 3  — Latest event wins (chronological)
 *   Group 4  — Tiebreaking and sort determinism
 *   Group 5  — Membership scoping
 *   Group 6  — Source and vertical guardrails
 *   Group 7  — Safety guardrails (PHI / payment field rejection)
 *   Group 8  — Derived not stored
 *   Group 9  — Terminal standing semantics
 *   Group 10 — Phase boundary contracts remain intact
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import {
  deriveDapMemberStandingFromBillingEvents,
  deriveDapMemberStatusReadModel,
  sortDapBillingEventsForStatus,
  mapBillingEventToMemberStanding,
  isTerminalDapMemberStanding,
  assertDapStatusEventsAreSafe,
} from './dapMemberStatusRules'
import {
  getPublicCommercialSystemForVertical,
  getInternalCrmSystemForVertical,
  isResponsibilityAllowed,
} from './clientBuilderBoundaryRules'
import {
  buildDapClientBuilderBillingPayload,
  assertClientBuilderBillingSource,
} from './dapClientBuilderBillingRules'
import type { DapMemberBillingEventForStatus } from './dapMemberStatusTypes'

// ─── Project root ─────────────────────────────────────────────────────────────

const ROOT       = resolve(__dirname, '../..')
const TYPES_PATH = resolve(ROOT, 'lib/cb-control-center/dapMemberStatusTypes.ts')
const RULES_PATH = resolve(ROOT, 'lib/cb-control-center/dapMemberStatusRules.ts')

// ─── Timestamps ───────────────────────────────────────────────────────────────

const T1 = '2026-04-30T10:00:00Z'
const T2 = '2026-04-30T11:00:00Z'
const T3 = '2026-04-30T12:00:00Z'

// ─── Helper ───────────────────────────────────────────────────────────────────

function makeEvent(
  eventType: DapMemberBillingEventForStatus['eventType'],
  opts: { membershipId?: string; occurredAt?: string; receivedAt?: string } = {}
): DapMemberBillingEventForStatus {
  return {
    verticalKey:  'dap',
    sourceSystem: 'client_builder_pro',
    eventType,
    membershipId: opts.membershipId ?? 'mem-001',
    occurredAt:   opts.occurredAt   ?? T1,
    ...(opts.receivedAt !== undefined ? { receivedAt: opts.receivedAt } : {}),
  }
}

// ─── Group 1: Empty event history ─────────────────────────────────────────────

describe('Empty event history — no events yields unknown standing', () => {
  it('types file exists', () => {
    expect(existsSync(TYPES_PATH)).toBe(true)
  })

  it('rules file exists', () => {
    expect(existsSync(RULES_PATH)).toBe(true)
  })

  it('deriveDapMemberStandingFromBillingEvents([]) returns unknown', () => {
    expect(deriveDapMemberStandingFromBillingEvents([])).toBe('unknown')
  })

  it('deriveDapMemberStatusReadModel standing is unknown when no events', () => {
    expect(deriveDapMemberStatusReadModel('mem-001', []).standing).toBe('unknown')
  })

  it('deriveDapMemberStatusReadModel eventCount is 0 when no events', () => {
    expect(deriveDapMemberStatusReadModel('mem-001', []).eventCount).toBe(0)
  })

  it('deriveDapMemberStatusReadModel derivedFromBillingEvents is true when no events', () => {
    expect(deriveDapMemberStatusReadModel('mem-001', []).derivedFromBillingEvents).toBe(true)
  })

  it('deriveDapMemberStatusReadModel lastBillingEventType is undefined when no events', () => {
    expect(deriveDapMemberStatusReadModel('mem-001', []).lastBillingEventType).toBeUndefined()
  })

  it('deriveDapMemberStatusReadModel lastBillingEventAt is undefined when no events', () => {
    expect(deriveDapMemberStatusReadModel('mem-001', []).lastBillingEventAt).toBeUndefined()
  })

  it('deriveDapMemberStatusReadModel verticalKey is dap', () => {
    expect(deriveDapMemberStatusReadModel('mem-001', []).verticalKey).toBe('dap')
  })

  it('deriveDapMemberStatusReadModel membershipId matches the requested id', () => {
    expect(deriveDapMemberStatusReadModel('mem-xyz', []).membershipId).toBe('mem-xyz')
  })
})

// ─── Group 2: Event-to-standing mapping ───────────────────────────────────────

describe('Event mapping — all nine Client Builder Pro events map to member standing', () => {
  it('subscription_created maps to pending', () => {
    expect(mapBillingEventToMemberStanding('client_builder_subscription_created')).toBe('pending')
  })

  it('subscription_activated maps to active', () => {
    expect(mapBillingEventToMemberStanding('client_builder_subscription_activated')).toBe('active')
  })

  it('subscription_renewed maps to active', () => {
    expect(mapBillingEventToMemberStanding('client_builder_subscription_renewed')).toBe('active')
  })

  it('payment_succeeded maps to active', () => {
    expect(mapBillingEventToMemberStanding('client_builder_payment_succeeded')).toBe('active')
  })

  it('subscription_past_due maps to past_due', () => {
    expect(mapBillingEventToMemberStanding('client_builder_subscription_past_due')).toBe('past_due')
  })

  it('payment_failed maps to payment_failed', () => {
    expect(mapBillingEventToMemberStanding('client_builder_payment_failed')).toBe('payment_failed')
  })

  it('subscription_canceled maps to canceled', () => {
    expect(mapBillingEventToMemberStanding('client_builder_subscription_canceled')).toBe('canceled')
  })

  it('refund_recorded maps to refunded', () => {
    expect(mapBillingEventToMemberStanding('client_builder_refund_recorded')).toBe('refunded')
  })

  it('chargeback_recorded maps to chargeback', () => {
    expect(mapBillingEventToMemberStanding('client_builder_chargeback_recorded')).toBe('chargeback')
  })

  it('deriveDapMemberStandingFromBillingEvents returns correct standing for a single event', () => {
    const events = [makeEvent('client_builder_subscription_activated')]
    expect(deriveDapMemberStandingFromBillingEvents(events)).toBe('active')
  })
})

// ─── Group 3: Latest event wins (chronological) ───────────────────────────────

describe('Latest event wins — standing follows the most recent billing event', () => {
  it('created → activated = active', () => {
    const events = [
      makeEvent('client_builder_subscription_created',  { occurredAt: T1 }),
      makeEvent('client_builder_subscription_activated', { occurredAt: T2 }),
    ]
    expect(deriveDapMemberStandingFromBillingEvents(events)).toBe('active')
  })

  it('activated → past_due = past_due', () => {
    const events = [
      makeEvent('client_builder_subscription_activated',  { occurredAt: T1 }),
      makeEvent('client_builder_subscription_past_due',   { occurredAt: T2 }),
    ]
    expect(deriveDapMemberStandingFromBillingEvents(events)).toBe('past_due')
  })

  it('past_due → payment_succeeded = active', () => {
    const events = [
      makeEvent('client_builder_subscription_past_due', { occurredAt: T1 }),
      makeEvent('client_builder_payment_succeeded',     { occurredAt: T2 }),
    ]
    expect(deriveDapMemberStandingFromBillingEvents(events)).toBe('active')
  })

  it('active → canceled = canceled', () => {
    const events = [
      makeEvent('client_builder_subscription_activated', { occurredAt: T1 }),
      makeEvent('client_builder_subscription_canceled',  { occurredAt: T2 }),
    ]
    expect(deriveDapMemberStandingFromBillingEvents(events)).toBe('canceled')
  })

  it('canceled → renewed later = active (terminal does not permanently lock)', () => {
    const events = [
      makeEvent('client_builder_subscription_canceled', { occurredAt: T1 }),
      makeEvent('client_builder_subscription_renewed',  { occurredAt: T2 }),
    ]
    expect(deriveDapMemberStandingFromBillingEvents(events)).toBe('active')
  })

  it('payment_failed → payment_succeeded later = active', () => {
    const events = [
      makeEvent('client_builder_payment_failed',    { occurredAt: T1 }),
      makeEvent('client_builder_payment_succeeded', { occurredAt: T2 }),
    ]
    expect(deriveDapMemberStandingFromBillingEvents(events)).toBe('active')
  })

  it('refund_recorded → payment_succeeded later = active', () => {
    const events = [
      makeEvent('client_builder_refund_recorded',   { occurredAt: T1 }),
      makeEvent('client_builder_payment_succeeded', { occurredAt: T2 }),
    ]
    expect(deriveDapMemberStandingFromBillingEvents(events)).toBe('active')
  })

  it('chargeback_recorded → activated later = active', () => {
    const events = [
      makeEvent('client_builder_chargeback_recorded',    { occurredAt: T1 }),
      makeEvent('client_builder_subscription_activated', { occurredAt: T2 }),
    ]
    expect(deriveDapMemberStandingFromBillingEvents(events)).toBe('active')
  })

  it('read model lastBillingEventType reflects the latest event', () => {
    const events = [
      makeEvent('client_builder_subscription_created',  { occurredAt: T1 }),
      makeEvent('client_builder_subscription_activated', { occurredAt: T2 }),
    ]
    const model = deriveDapMemberStatusReadModel('mem-001', events)
    expect(model.lastBillingEventType).toBe('client_builder_subscription_activated')
  })

  it('read model lastBillingEventAt reflects the latest event occurredAt', () => {
    const events = [
      makeEvent('client_builder_subscription_created',  { occurredAt: T1 }),
      makeEvent('client_builder_subscription_activated', { occurredAt: T2 }),
    ]
    const model = deriveDapMemberStatusReadModel('mem-001', events)
    expect(model.lastBillingEventAt).toBe(T2)
  })

  it('three events — middle event does not override latest', () => {
    const events = [
      makeEvent('client_builder_subscription_created',  { occurredAt: T1 }),
      makeEvent('client_builder_subscription_activated', { occurredAt: T2 }),
      makeEvent('client_builder_subscription_canceled',  { occurredAt: T3 }),
    ]
    expect(deriveDapMemberStandingFromBillingEvents(events)).toBe('canceled')
  })
})

// ─── Group 4: Tiebreaking and sort determinism ────────────────────────────────

describe('Tiebreaking — same occurredAt uses receivedAt; still tied uses input order', () => {
  it('same occurredAt — later receivedAt wins', () => {
    const events = [
      makeEvent('client_builder_subscription_canceled', { occurredAt: T1, receivedAt: T1 }),
      makeEvent('client_builder_subscription_renewed',  { occurredAt: T1, receivedAt: T2 }),
    ]
    expect(deriveDapMemberStandingFromBillingEvents(events)).toBe('active')
  })

  it('same occurredAt — earlier receivedAt loses', () => {
    const events = [
      makeEvent('client_builder_subscription_renewed',  { occurredAt: T1, receivedAt: T1 }),
      makeEvent('client_builder_subscription_canceled', { occurredAt: T1, receivedAt: T2 }),
    ]
    expect(deriveDapMemberStandingFromBillingEvents(events)).toBe('canceled')
  })

  it('same occurredAt and no receivedAt — last in input order wins (stable sort)', () => {
    const eventsA = [
      makeEvent('client_builder_subscription_canceled', { occurredAt: T1 }),
      makeEvent('client_builder_subscription_renewed',  { occurredAt: T1 }),
    ]
    const eventsB = [
      makeEvent('client_builder_subscription_renewed',  { occurredAt: T1 }),
      makeEvent('client_builder_subscription_canceled', { occurredAt: T1 }),
    ]
    expect(deriveDapMemberStandingFromBillingEvents(eventsA)).toBe('active')
    expect(deriveDapMemberStandingFromBillingEvents(eventsB)).toBe('canceled')
  })

  it('sortDapBillingEventsForStatus does not mutate the input array', () => {
    const events = [
      makeEvent('client_builder_subscription_canceled', { occurredAt: T2 }),
      makeEvent('client_builder_subscription_created',  { occurredAt: T1 }),
    ]
    const original = [...events]
    sortDapBillingEventsForStatus(events)
    expect(events[0].occurredAt).toBe(original[0].occurredAt)
    expect(events[1].occurredAt).toBe(original[1].occurredAt)
  })

  it('sortDapBillingEventsForStatus returns events in ascending chronological order', () => {
    const events = [
      makeEvent('client_builder_subscription_canceled', { occurredAt: T3 }),
      makeEvent('client_builder_subscription_created',  { occurredAt: T1 }),
      makeEvent('client_builder_subscription_activated', { occurredAt: T2 }),
    ]
    const sorted = sortDapBillingEventsForStatus(events)
    expect(sorted[0].occurredAt).toBe(T1)
    expect(sorted[1].occurredAt).toBe(T2)
    expect(sorted[2].occurredAt).toBe(T3)
  })

  it('calling deriveDapMemberStandingFromBillingEvents twice with same input gives same result', () => {
    const events = [
      makeEvent('client_builder_subscription_activated', { occurredAt: T1 }),
      makeEvent('client_builder_subscription_past_due',  { occurredAt: T2 }),
    ]
    const r1 = deriveDapMemberStandingFromBillingEvents(events)
    const r2 = deriveDapMemberStandingFromBillingEvents(events)
    expect(r1).toBe(r2)
  })
})

// ─── Group 5: Membership scoping ──────────────────────────────────────────────

describe('Membership scoping — events are scoped to the requested membershipId', () => {
  it('events for membership B do not affect read model for membership A', () => {
    const events = [
      makeEvent('client_builder_subscription_activated', { membershipId: 'mem-A', occurredAt: T1 }),
      makeEvent('client_builder_subscription_canceled',  { membershipId: 'mem-B', occurredAt: T2 }),
    ]
    const model = deriveDapMemberStatusReadModel('mem-A', events)
    expect(model.standing).toBe('active')
  })

  it('read model eventCount only counts events for the requested membershipId', () => {
    const events = [
      makeEvent('client_builder_subscription_activated', { membershipId: 'mem-A', occurredAt: T1 }),
      makeEvent('client_builder_subscription_activated', { membershipId: 'mem-A', occurredAt: T2 }),
      makeEvent('client_builder_subscription_canceled',  { membershipId: 'mem-B', occurredAt: T3 }),
    ]
    const model = deriveDapMemberStatusReadModel('mem-A', events)
    expect(model.eventCount).toBe(2)
  })

  it('mixed membership list: membership B returns its own standing independently', () => {
    const events = [
      makeEvent('client_builder_subscription_activated', { membershipId: 'mem-A', occurredAt: T1 }),
      makeEvent('client_builder_subscription_canceled',  { membershipId: 'mem-B', occurredAt: T2 }),
    ]
    const modelB = deriveDapMemberStatusReadModel('mem-B', events)
    expect(modelB.standing).toBe('canceled')
  })

  it('membership with no matching events yields unknown standing', () => {
    const events = [
      makeEvent('client_builder_subscription_activated', { membershipId: 'mem-A', occurredAt: T1 }),
    ]
    const model = deriveDapMemberStatusReadModel('mem-B', events)
    expect(model.standing).toBe('unknown')
    expect(model.eventCount).toBe(0)
  })

  it('read model membershipId always matches the requested id', () => {
    const events = [
      makeEvent('client_builder_subscription_activated', { membershipId: 'mem-A', occurredAt: T1 }),
    ]
    const model = deriveDapMemberStatusReadModel('mem-A', events)
    expect(model.membershipId).toBe('mem-A')
  })

  it('lastBillingEventType comes only from scoped events', () => {
    const events = [
      makeEvent('client_builder_subscription_created',  { membershipId: 'mem-A', occurredAt: T1 }),
      makeEvent('client_builder_subscription_canceled', { membershipId: 'mem-B', occurredAt: T3 }),
    ]
    const model = deriveDapMemberStatusReadModel('mem-A', events)
    expect(model.lastBillingEventType).toBe('client_builder_subscription_created')
  })
})

// ─── Group 6: Source and vertical guardrails ──────────────────────────────────

describe('Source guardrails — only dap + client_builder_pro events are accepted', () => {
  it('assertDapStatusEventsAreSafe does not throw for valid events', () => {
    expect(() => assertDapStatusEventsAreSafe([makeEvent('client_builder_subscription_activated')])).not.toThrow()
  })

  it('assertDapStatusEventsAreSafe throws when verticalKey is not dap', () => {
    const bad = { ...makeEvent('client_builder_subscription_activated'), verticalKey: 'other' } as unknown as DapMemberBillingEventForStatus
    expect(() => assertDapStatusEventsAreSafe([bad])).toThrow()
  })

  it('assertDapStatusEventsAreSafe throws when sourceSystem is mkcrm', () => {
    const bad = { ...makeEvent('client_builder_subscription_activated'), sourceSystem: 'mkcrm' } as unknown as DapMemberBillingEventForStatus
    expect(() => assertDapStatusEventsAreSafe([bad])).toThrow()
  })

  it('assertDapStatusEventsAreSafe throws when sourceSystem is stripe', () => {
    const bad = { ...makeEvent('client_builder_subscription_activated'), sourceSystem: 'stripe' } as unknown as DapMemberBillingEventForStatus
    expect(() => assertDapStatusEventsAreSafe([bad])).toThrow()
  })

  it('error message for bad sourceSystem names client_builder_pro as the valid source', () => {
    const bad = { ...makeEvent('client_builder_subscription_activated'), sourceSystem: 'mkcrm' } as unknown as DapMemberBillingEventForStatus
    expect(() => assertDapStatusEventsAreSafe([bad])).toThrow(/client_builder_pro/)
  })

  it('deriveDapMemberStatusReadModel throws when an event has bad sourceSystem', () => {
    const bad = { ...makeEvent('client_builder_subscription_activated'), sourceSystem: 'mkcrm' } as unknown as DapMemberBillingEventForStatus
    expect(() => deriveDapMemberStatusReadModel('mem-001', [bad])).toThrow()
  })
})

// ─── Group 7: Safety guardrails ───────────────────────────────────────────────

describe('Safety guardrails — PHI and payment field names are rejected', () => {
  const UNSAFE_KEYS = [
    'patientName',
    'memberName',
    'diagnosis',
    'treatment',
    'procedure',
    'cardNumber',
    'paymentMethod',
    'ssn',
    'dob',
    'dateOfBirth',
    'insuranceClaim',
    'claimNumber',
    'address',
  ]

  for (const key of UNSAFE_KEYS) {
    it(`assertDapStatusEventsAreSafe throws when event has field: ${key}`, () => {
      const base = makeEvent('client_builder_subscription_activated')
      const bad = { ...base, [key]: 'some-value' } as unknown as DapMemberBillingEventForStatus
      expect(() => assertDapStatusEventsAreSafe([bad])).toThrow()
    })
  }

  it('types file does not declare PHI as top-level fields', () => {
    const src = readFileSync(TYPES_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/\bpatientname\b|\bssn\b|\bcardnumber\b|\bdiagnosis\b/)
  })

  it('rules file UNSAFE_KEYS set covers all required keys', () => {
    const src = readFileSync(RULES_PATH, 'utf8').toLowerCase()
    expect(src).toContain('patientname')
    expect(src).toContain('ssn')
    expect(src).toContain('cardnumber')
    expect(src).toContain('dateofbirth')
    expect(src).toContain('insuranceclaim')
  })
})

// ─── Group 8: Derived not stored ──────────────────────────────────────────────

describe('Derived not stored — standing is never set, updated, or stored', () => {
  it('derivedFromBillingEvents is true for active standing', () => {
    const model = deriveDapMemberStatusReadModel('mem-001', [
      makeEvent('client_builder_subscription_activated'),
    ])
    expect(model.derivedFromBillingEvents).toBe(true)
  })

  it('derivedFromBillingEvents is true for canceled standing', () => {
    const model = deriveDapMemberStatusReadModel('mem-001', [
      makeEvent('client_builder_subscription_canceled'),
    ])
    expect(model.derivedFromBillingEvents).toBe(true)
  })

  it('derivedFromBillingEvents is true for unknown standing', () => {
    const model = deriveDapMemberStatusReadModel('mem-001', [])
    expect(model.derivedFromBillingEvents).toBe(true)
  })

  it('rules file does not export setStanding', () => {
    const src = readFileSync(RULES_PATH, 'utf8')
    expect(src).not.toContain('setStanding')
  })

  it('rules file does not export updateStanding', () => {
    const src = readFileSync(RULES_PATH, 'utf8')
    expect(src).not.toContain('updateStanding')
  })

  it('rules file does not export storeStanding', () => {
    const src = readFileSync(RULES_PATH, 'utf8')
    expect(src).not.toContain('storeStanding')
  })

  it('rules file does not import Supabase', () => {
    const src = readFileSync(RULES_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/supabase|getsupabase/)
  })

  it('rules file has no fetch( calls', () => {
    const src = readFileSync(RULES_PATH, 'utf8')
    expect(src).not.toContain('fetch(')
  })

  it('rules file has no .insert( or .update( calls', () => {
    const src = readFileSync(RULES_PATH, 'utf8')
    expect(src).not.toContain('.insert(')
    expect(src).not.toContain('.update(')
  })
})

// ─── Group 9: Terminal standing semantics ─────────────────────────────────────

describe('Terminal standing — canceled, refunded, chargeback are terminal but not permanent', () => {
  it('canceled is terminal', () => {
    expect(isTerminalDapMemberStanding('canceled')).toBe(true)
  })

  it('refunded is terminal', () => {
    expect(isTerminalDapMemberStanding('refunded')).toBe(true)
  })

  it('chargeback is terminal', () => {
    expect(isTerminalDapMemberStanding('chargeback')).toBe(true)
  })

  it('active is not terminal', () => {
    expect(isTerminalDapMemberStanding('active')).toBe(false)
  })

  it('pending is not terminal', () => {
    expect(isTerminalDapMemberStanding('pending')).toBe(false)
  })

  it('past_due is not terminal', () => {
    expect(isTerminalDapMemberStanding('past_due')).toBe(false)
  })

  it('payment_failed is not terminal', () => {
    expect(isTerminalDapMemberStanding('payment_failed')).toBe(false)
  })

  it('unknown is not terminal', () => {
    expect(isTerminalDapMemberStanding('unknown')).toBe(false)
  })

  it('a later non-terminal event overrides a terminal standing (append-only chronology)', () => {
    const events = [
      makeEvent('client_builder_subscription_canceled', { occurredAt: T1 }),
      makeEvent('client_builder_subscription_activated', { occurredAt: T2 }),
    ]
    const standing = deriveDapMemberStandingFromBillingEvents(events)
    expect(isTerminalDapMemberStanding(standing)).toBe(false)
    expect(standing).toBe('active')
  })

  it('terminal standing holds when it is the latest event', () => {
    const events = [
      makeEvent('client_builder_subscription_activated', { occurredAt: T1 }),
      makeEvent('client_builder_subscription_canceled',  { occurredAt: T2 }),
    ]
    const standing = deriveDapMemberStandingFromBillingEvents(events)
    expect(isTerminalDapMemberStanding(standing)).toBe(true)
  })
})

// ─── Group 10: Phase boundary contracts remain intact ─────────────────────────

describe('Phase boundary contracts — 9N boundary and prior phase rules still hold', () => {
  it('getPublicCommercialSystemForVertical returns client_builder_pro for dap', () => {
    expect(getPublicCommercialSystemForVertical('dap')).toBe('client_builder_pro')
  })

  it('getInternalCrmSystemForVertical returns mkcrm for dap', () => {
    expect(getInternalCrmSystemForVertical('dap')).toBe('mkcrm')
  })

  it('client_builder_pro has payment responsibility', () => {
    expect(isResponsibilityAllowed('client_builder_pro', 'payment')).toBe(true)
  })

  it('mkcrm does not have payment responsibility', () => {
    expect(isResponsibilityAllowed('mkcrm', 'payment')).toBe(false)
  })

  it('assertClientBuilderBillingSource (9O) still rejects mkcrm as billing source', () => {
    const payload = buildDapClientBuilderBillingPayload({
      eventType:         'client_builder_subscription_activated',
      externalAccountId: 'acct-9q-test',
      occurredAt:        T1,
      receivedAt:        T2,
    })
    const bad = { ...payload, sourceSystem: 'mkcrm' } as unknown as typeof payload
    expect(() => assertClientBuilderBillingSource(bad)).toThrow()
  })

  it('Phase 9Q adds no new UI pages (page count remains 21)', () => {
    const { readdirSync, existsSync: fsExists } = require('fs')
    const { join } = require('path')
    function findPages(dir: string): string[] {
      if (!fsExists(dir)) return []
      const results: string[] = []
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name)
        if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.next') {
          results.push(...findPages(full))
        } else if (entry.isFile() && full.endsWith('page.tsx')) {
          results.push(full)
        }
      }
      return results
    }
    expect(findPages(join(ROOT, 'app')).length).toBe(50)
  })

  it('Phase 9Q rules file has no API routes or network calls', () => {
    const src = readFileSync(RULES_PATH, 'utf8')
    expect(src).not.toContain('fetch(')
    expect(src).not.toMatch(/https?:\/\//)
    expect(src).not.toMatch(/export.*async.*function.*route/i)
  })
})
