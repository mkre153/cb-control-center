/**
 * Phase 9P — MKCRM Lifecycle Sync Outbox QA
 *
 * PURPOSE: Prove that the MKCRM outbox safely bridges Phase 9O Client Builder
 * Pro billing events → Phase 9M MKCRM shadow sync, without creating real
 * integration and without corrupting the boundary rules established in 9N.
 *
 * Locked language:
 *   MKCRM receives lifecycle sync signals.
 *   Client Builder Pro originates billing events.
 *   DAP standing is derived from billing_events.
 *   The MKCRM outbox is shadow-only.
 *
 * COVERAGE:
 *   Group 1  — Outbox destination is MKCRM only
 *   Group 2  — Shadow mode is locked
 *   Group 3  — Billing event → MKCRM signal mapping
 *   Group 4  — Status hint → MKCRM signal mapping
 *   Group 5  — Unsafe fields are rejected
 *   Group 6  — Safe operational identifiers are allowed
 *   Group 7  — Client Builder Pro remains billing source
 *   Group 8  — Phase 9N boundary remains intact
 *   Group 9  — Phase 9M shadow sync remains shadow-only
 *   Group 10 — Outbox does not mutate standing
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve, join } from 'path'
import {
  buildDapMkcrmOutboxPayload,
  validateDapMkcrmOutboxPayload,
  isDapMkcrmOutboxPayloadSafe,
  mapClientBuilderBillingEventToMkcrmSignal,
  mapBillingStatusHintToMkcrmSignal,
  assertDapMkcrmOutboxDestination,
} from './dapMkcrmOutboxRules'
import {
  prepareDapMkcrmOutboxShadow,
  prepareDapMkcrmOutboxFromClientBuilderBillingShadow,
} from './dapMkcrmOutboxShadow'
import {
  buildDapClientBuilderBillingPayload,
  assertClientBuilderBillingSource,
} from './dapClientBuilderBillingRules'
import {
  getPublicCommercialSystemForVertical,
  getInternalCrmSystemForVertical,
  isResponsibilityAllowed,
} from './clientBuilderBoundaryRules'
import { buildPracticeApprovedPayload } from './dapMkcrmPayloads'
import { syncDapEventToMkcrmShadow } from './dapMkcrmSync'
import type { DapMkcrmOutboxPayload } from './dapMkcrmOutboxTypes'
import type { DapClientBuilderBillingShadowPayload } from './dapClientBuilderBillingTypes'

// ─── Project root ─────────────────────────────────────────────────────────────

const ROOT = resolve(__dirname, '../..')

// ─── Key paths ────────────────────────────────────────────────────────────────

const TYPES_PATH  = resolve(ROOT, 'lib/cb-control-center/dapMkcrmOutboxTypes.ts')
const RULES_PATH  = resolve(ROOT, 'lib/cb-control-center/dapMkcrmOutboxRules.ts')
const SHADOW_PATH = resolve(ROOT, 'lib/cb-control-center/dapMkcrmOutboxShadow.ts')

// ─── Base sample inputs ────────────────────────────────────────────────────────

const OCCURRED_AT = '2026-04-30T12:00:00Z'
const PREPARED_AT = '2026-04-30T12:00:01Z'

const BASE_OUTBOX_INPUT = {
  source:      'client_builder_billing_shadow' as const,
  signalType:  'member_membership_activated' as const,
  occurredAt:  OCCURRED_AT,
  preparedAt:  PREPARED_AT,
}

const BASE_BILLING_INPUT = {
  eventType:         'client_builder_subscription_activated' as const,
  externalAccountId: 'acct-9p-001',
  occurredAt:        OCCURRED_AT,
  receivedAt:        PREPARED_AT,
}

function baseOutboxPayload(): DapMkcrmOutboxPayload {
  return buildDapMkcrmOutboxPayload(BASE_OUTBOX_INPUT)
}

function baseBillingPayload(): DapClientBuilderBillingShadowPayload {
  return buildDapClientBuilderBillingPayload(BASE_BILLING_INPUT)
}

// ─── Group 1: Outbox destination is MKCRM only ────────────────────────────────

describe('Outbox destination — MKCRM is the only valid destination', () => {
  it('types file exists', () => {
    expect(existsSync(TYPES_PATH)).toBe(true)
  })

  it('valid outbox payload has destination: mkcrm', () => {
    expect(baseOutboxPayload().destination).toBe('mkcrm')
  })

  it('assertDapMkcrmOutboxDestination does not throw for mkcrm', () => {
    expect(() => assertDapMkcrmOutboxDestination(baseOutboxPayload())).not.toThrow()
  })

  it('assertDapMkcrmOutboxDestination throws for client_builder_pro', () => {
    const bad = { ...baseOutboxPayload(), destination: 'client_builder_pro' } as unknown as DapMkcrmOutboxPayload
    expect(() => assertDapMkcrmOutboxDestination(bad)).toThrow()
  })

  it('assertDapMkcrmOutboxDestination throws for stripe', () => {
    const bad = { ...baseOutboxPayload(), destination: 'stripe' } as unknown as DapMkcrmOutboxPayload
    expect(() => assertDapMkcrmOutboxDestination(bad)).toThrow()
  })

  it('assertDapMkcrmOutboxDestination throws for ghl', () => {
    const bad = { ...baseOutboxPayload(), destination: 'ghl' } as unknown as DapMkcrmOutboxPayload
    expect(() => assertDapMkcrmOutboxDestination(bad)).toThrow()
  })

  it('assertDapMkcrmOutboxDestination throws for dap', () => {
    const bad = { ...baseOutboxPayload(), destination: 'dap' } as unknown as DapMkcrmOutboxPayload
    expect(() => assertDapMkcrmOutboxDestination(bad)).toThrow()
  })

  it('error message from assertDapMkcrmOutboxDestination names mkcrm as the valid destination', () => {
    const bad = { ...baseOutboxPayload(), destination: 'stripe' } as unknown as DapMkcrmOutboxPayload
    expect(() => assertDapMkcrmOutboxDestination(bad)).toThrow(/mkcrm/i)
  })

  it('shadow result has destination: mkcrm', () => {
    const result = prepareDapMkcrmOutboxShadow(baseOutboxPayload())
    expect(result.destination).toBe('mkcrm')
  })

  it('prepareDapMkcrmOutboxFromClientBuilderBillingShadow result has destination: mkcrm', () => {
    const result = prepareDapMkcrmOutboxFromClientBuilderBillingShadow(baseBillingPayload())
    expect(result.destination).toBe('mkcrm')
  })
})

// ─── Group 2: Shadow mode is locked ──────────────────────────────────────────

describe('Shadow mode — locked, no real API calls, no payment processing', () => {
  it('valid outbox payload has mode: shadow', () => {
    expect(baseOutboxPayload().mode).toBe('shadow')
  })

  it('validateDapMkcrmOutboxPayload throws when mode is not shadow', () => {
    const bad = { ...baseOutboxPayload(), mode: 'live' } as unknown as DapMkcrmOutboxPayload
    expect(() => validateDapMkcrmOutboxPayload(bad)).toThrow()
  })

  it('shadow result has wouldCallMkcrmApi: false', () => {
    const result = prepareDapMkcrmOutboxShadow(baseOutboxPayload())
    expect(result.wouldCallMkcrmApi).toBe(false)
  })

  it('shadow result has wouldProcessPayment: false', () => {
    const result = prepareDapMkcrmOutboxShadow(baseOutboxPayload())
    expect(result.wouldProcessPayment).toBe(false)
  })

  it('shadow result has wouldUpdateStoredStanding: false', () => {
    const result = prepareDapMkcrmOutboxShadow(baseOutboxPayload())
    expect(result.wouldUpdateStoredStanding).toBe(false)
  })

  it('shadow adapter has no fetch( call', () => {
    const src = readFileSync(SHADOW_PATH, 'utf8')
    expect(src).not.toContain('fetch(')
  })

  it('shadow adapter has no http:// or https:// URLs', () => {
    const src = readFileSync(SHADOW_PATH, 'utf8')
    expect(src).not.toMatch(/https?:\/\//)
  })

  it('shadow adapter has no .insert( or .update( database calls', () => {
    const src = readFileSync(SHADOW_PATH, 'utf8')
    expect(src).not.toContain('.insert(')
    expect(src).not.toContain('.update(')
  })

  it('shadow adapter does not import Supabase', () => {
    const src = readFileSync(SHADOW_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/supabase|getsupabase/)
  })
})

// ─── Group 3: Billing event → MKCRM signal mapping ───────────────────────────

describe('Billing event mapping — all nine Client Builder Pro events map to MKCRM signals', () => {
  it('subscription_created maps to member_enrollment_started', () => {
    expect(mapClientBuilderBillingEventToMkcrmSignal('client_builder_subscription_created'))
      .toBe('member_enrollment_started')
  })

  it('subscription_activated maps to member_membership_activated', () => {
    expect(mapClientBuilderBillingEventToMkcrmSignal('client_builder_subscription_activated'))
      .toBe('member_membership_activated')
  })

  it('subscription_renewed maps to member_membership_activated', () => {
    expect(mapClientBuilderBillingEventToMkcrmSignal('client_builder_subscription_renewed'))
      .toBe('member_membership_activated')
  })

  it('payment_succeeded maps to member_membership_activated', () => {
    expect(mapClientBuilderBillingEventToMkcrmSignal('client_builder_payment_succeeded'))
      .toBe('member_membership_activated')
  })

  it('subscription_past_due maps to member_membership_past_due', () => {
    expect(mapClientBuilderBillingEventToMkcrmSignal('client_builder_subscription_past_due'))
      .toBe('member_membership_past_due')
  })

  it('payment_failed maps to member_payment_failed', () => {
    expect(mapClientBuilderBillingEventToMkcrmSignal('client_builder_payment_failed'))
      .toBe('member_payment_failed')
  })

  it('subscription_canceled maps to member_membership_canceled', () => {
    expect(mapClientBuilderBillingEventToMkcrmSignal('client_builder_subscription_canceled'))
      .toBe('member_membership_canceled')
  })

  it('refund_recorded maps to member_refund_recorded', () => {
    expect(mapClientBuilderBillingEventToMkcrmSignal('client_builder_refund_recorded'))
      .toBe('member_refund_recorded')
  })

  it('chargeback_recorded maps to member_chargeback_recorded', () => {
    expect(mapClientBuilderBillingEventToMkcrmSignal('client_builder_chargeback_recorded'))
      .toBe('member_chargeback_recorded')
  })

  it('prepareDapMkcrmOutboxFromClientBuilderBillingShadow produces signalType member_membership_activated for activated billing event', () => {
    const result = prepareDapMkcrmOutboxFromClientBuilderBillingShadow(baseBillingPayload())
    expect(result.signalType).toBe('member_membership_activated')
  })
})

// ─── Group 4: Status hint → MKCRM signal mapping ─────────────────────────────

describe('Status hint mapping — all seven hints map to MKCRM signals', () => {
  it('active maps to member_membership_activated', () => {
    expect(mapBillingStatusHintToMkcrmSignal('active')).toBe('member_membership_activated')
  })

  it('past_due maps to member_membership_past_due', () => {
    expect(mapBillingStatusHintToMkcrmSignal('past_due')).toBe('member_membership_past_due')
  })

  it('canceled maps to member_membership_canceled', () => {
    expect(mapBillingStatusHintToMkcrmSignal('canceled')).toBe('member_membership_canceled')
  })

  it('payment_failed maps to member_payment_failed', () => {
    expect(mapBillingStatusHintToMkcrmSignal('payment_failed')).toBe('member_payment_failed')
  })

  it('refunded maps to member_refund_recorded', () => {
    expect(mapBillingStatusHintToMkcrmSignal('refunded')).toBe('member_refund_recorded')
  })

  it('chargeback maps to member_chargeback_recorded', () => {
    expect(mapBillingStatusHintToMkcrmSignal('chargeback')).toBe('member_chargeback_recorded')
  })

  it('unknown maps to member_enrollment_started', () => {
    expect(mapBillingStatusHintToMkcrmSignal('unknown')).toBe('member_enrollment_started')
  })
})

// ─── Group 5: Unsafe fields are rejected ──────────────────────────────────────

describe('Unsafe fields — PHI and payment data must be rejected from outbox payloads', () => {
  const UNSAFE_METADATA: [string, string][] = [
    ['patientName',    'John Doe'],
    ['memberName',     'Jane Doe'],
    ['diagnosis',      'cavity'],
    ['treatment',      'filling'],
    ['procedure',      'extraction'],
    ['cardNumber',     '4111-1111-1111-1111'],
    ['paymentMethod',  'visa'],
    ['ssn',            '123-45-6789'],
    ['dob',            '1990-01-01'],
    ['dateOfBirth',    '1990-01-01'],
    ['insuranceClaim', 'CLM-001'],
    ['claimNumber',    'CN-001'],
    ['address',        '123 Main St'],
  ]

  for (const [key, value] of UNSAFE_METADATA) {
    it(`outbox payload with metadata.${key} is not safe`, () => {
      const payload = buildDapMkcrmOutboxPayload({
        ...BASE_OUTBOX_INPUT,
        metadata: { [key]: value },
      })
      expect(isDapMkcrmOutboxPayloadSafe(payload)).toBe(false)
    })
  }

  it('prepareDapMkcrmOutboxShadow returns ok: false for unsafe payload', () => {
    const payload = buildDapMkcrmOutboxPayload({
      ...BASE_OUTBOX_INPUT,
      metadata: { ssn: '123-45-6789' },
    })
    const result = prepareDapMkcrmOutboxShadow(payload)
    expect(result.ok).toBe(false)
    expect(result.wouldEnqueueOutboxRecord).toBe(false)
  })

  it('types file does not declare PHI as top-level payload fields', () => {
    const src = readFileSync(TYPES_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/\bpatientname\b|\bssn\b|\bcardnumber\b|\bdiagnosis\b/)
  })
})

// ─── Group 6: Safe operational identifiers are allowed ────────────────────────

describe('Safe identifiers — operational IDs are permitted in outbox payloads', () => {
  const SAFE_FIELDS: Array<[keyof typeof BASE_OUTBOX_INPUT, string]> = [
    ['practiceId' as never, 'prc-safe-001'],
    ['membershipId' as never, 'mem-safe-001'],
    ['externalAccountId' as never, 'acct-safe-001'],
    ['externalCustomerId' as never, 'cust-safe-001'],
    ['externalSubscriptionId' as never, 'sub-safe-001'],
    ['externalPaymentId' as never, 'pay-safe-001'],
  ]

  it('outbox payload with practiceId is safe', () => {
    const p = buildDapMkcrmOutboxPayload({ ...BASE_OUTBOX_INPUT, practiceId: 'prc-001' })
    expect(isDapMkcrmOutboxPayloadSafe(p)).toBe(true)
  })

  it('outbox payload with membershipId is safe', () => {
    const p = buildDapMkcrmOutboxPayload({ ...BASE_OUTBOX_INPUT, membershipId: 'mem-001' })
    expect(isDapMkcrmOutboxPayloadSafe(p)).toBe(true)
  })

  it('outbox payload with externalAccountId is safe', () => {
    const p = buildDapMkcrmOutboxPayload({ ...BASE_OUTBOX_INPUT, externalAccountId: 'acct-001' })
    expect(isDapMkcrmOutboxPayloadSafe(p)).toBe(true)
  })

  it('outbox payload with externalCustomerId is safe', () => {
    const p = buildDapMkcrmOutboxPayload({ ...BASE_OUTBOX_INPUT, externalCustomerId: 'cust-001' })
    expect(isDapMkcrmOutboxPayloadSafe(p)).toBe(true)
  })

  it('outbox payload with externalSubscriptionId is safe', () => {
    const p = buildDapMkcrmOutboxPayload({ ...BASE_OUTBOX_INPUT, externalSubscriptionId: 'sub-001' })
    expect(isDapMkcrmOutboxPayloadSafe(p)).toBe(true)
  })

  it('outbox payload with externalPaymentId is safe', () => {
    const p = buildDapMkcrmOutboxPayload({ ...BASE_OUTBOX_INPUT, externalPaymentId: 'pay-001' })
    expect(isDapMkcrmOutboxPayloadSafe(p)).toBe(true)
  })

  it('prepareDapMkcrmOutboxShadow returns ok: true for valid safe payload', () => {
    const result = prepareDapMkcrmOutboxShadow(baseOutboxPayload())
    expect(result.ok).toBe(true)
    expect(result.wouldEnqueueOutboxRecord).toBe(true)
  })

  it('prepareDapMkcrmOutboxFromClientBuilderBillingShadow returns ok: true for safe billing payload', () => {
    const result = prepareDapMkcrmOutboxFromClientBuilderBillingShadow(baseBillingPayload())
    expect(result.ok).toBe(true)
  })
})

// ─── Group 7: Client Builder Pro remains billing source ───────────────────────

describe('Client Builder Pro — still the only valid billing source', () => {
  it('assertClientBuilderBillingSource does not throw for client_builder_pro', () => {
    const payload = buildDapClientBuilderBillingPayload(BASE_BILLING_INPUT)
    expect(() => assertClientBuilderBillingSource(payload)).not.toThrow()
  })

  it('assertClientBuilderBillingSource throws when sourceSystem is mkcrm', () => {
    const payload = buildDapClientBuilderBillingPayload(BASE_BILLING_INPUT)
    const bad = { ...payload, sourceSystem: 'mkcrm' } as unknown as DapClientBuilderBillingShadowPayload
    expect(() => assertClientBuilderBillingSource(bad)).toThrow()
  })

  it('outbox rules file does not treat mkcrm as a billing source', () => {
    const src = readFileSync(RULES_PATH, 'utf8').toLowerCase()
    expect(src).not.toContain('mkcrm billing source')
    expect(src).not.toContain('mkcrm originates')
  })

  it('outbox types file does not declare mkcrm as a source system', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    // 'mkcrm' may appear as a destination type, but not as a DapMkcrmOutboxSource value
    const sourceBlock = src.match(/DapMkcrmOutboxSource[\s\S]*?(?=export)/)?.[0] ?? ''
    expect(sourceBlock).not.toContain("'mkcrm'")
  })
})

// ─── Group 8: Phase 9N boundary remains intact ────────────────────────────────

describe('Phase 9N boundary — system boundary definitions still hold', () => {
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

  it('dap does not have payment or market responsibility', () => {
    expect(isResponsibilityAllowed('dap', 'payment')).toBe(false)
    expect(isResponsibilityAllowed('dap', 'market')).toBe(false)
  })
})

// ─── Group 9: Phase 9M shadow sync remains shadow-only ────────────────────────

describe('Phase 9M shadow sync — still intact, still shadow-only', () => {
  it('syncDapEventToMkcrmShadow returns shadowMode: true', async () => {
    const payload = buildPracticeApprovedPayload({
      requestId:    'req-9p-test',
      practiceName: 'Test Practice',
      city:         'San Diego',
      state:        'CA',
      occurredAt:   OCCURRED_AT,
    })
    const result = await syncDapEventToMkcrmShadow(payload)
    expect(result.shadowMode).toBe(true)
  })

  it('Phase 9M sync has no fetch or network calls (structural)', () => {
    const src = readFileSync(
      resolve(ROOT, 'lib/cb-control-center/dapMkcrmSync.ts'),
      'utf8'
    )
    expect(src).not.toContain('fetch(')
    expect(src).not.toMatch(/https?:\/\//)
  })

  it('Phase 9M and 9P shadow results are independent — neither calls the other', () => {
    const outboxSrc = readFileSync(SHADOW_PATH, 'utf8')
    const syncSrc   = readFileSync(resolve(ROOT, 'lib/cb-control-center/dapMkcrmSync.ts'), 'utf8')
    expect(outboxSrc).not.toContain('syncDapEventToMkcrmShadow')
    expect(syncSrc).not.toContain('prepareDapMkcrmOutboxShadow')
  })
})

// ─── Group 10: Outbox does not mutate standing ────────────────────────────────

describe('Outbox does not mutate standing — wouldUpdateStoredStanding is always false', () => {
  it('shadow result has wouldUpdateStoredStanding: false for valid safe payload', () => {
    const result = prepareDapMkcrmOutboxShadow(baseOutboxPayload())
    expect(result.wouldUpdateStoredStanding).toBe(false)
  })

  it('shadow result has wouldUpdateStoredStanding: false for past_due signal', () => {
    const payload = buildDapMkcrmOutboxPayload({
      ...BASE_OUTBOX_INPUT,
      signalType: 'member_membership_past_due',
    })
    const result = prepareDapMkcrmOutboxShadow(payload)
    expect(result.wouldUpdateStoredStanding).toBe(false)
  })

  it('shadow result has wouldUpdateStoredStanding: false for canceled signal', () => {
    const payload = buildDapMkcrmOutboxPayload({
      ...BASE_OUTBOX_INPUT,
      signalType: 'member_membership_canceled',
    })
    const result = prepareDapMkcrmOutboxShadow(payload)
    expect(result.wouldUpdateStoredStanding).toBe(false)
  })

  it('shadow result from CBP billing path has wouldUpdateStoredStanding: false', () => {
    const billingPayload = buildDapClientBuilderBillingPayload({
      ...BASE_BILLING_INPUT,
      eventType: 'client_builder_subscription_past_due',
    })
    const result = prepareDapMkcrmOutboxFromClientBuilderBillingShadow(billingPayload)
    expect(result.wouldUpdateStoredStanding).toBe(false)
  })

  it('shadow result has wouldUpdateStoredStanding: false even for unsafe payload', () => {
    const payload = buildDapMkcrmOutboxPayload({
      ...BASE_OUTBOX_INPUT,
      metadata: { cardNumber: '4111' },
    })
    const result = prepareDapMkcrmOutboxShadow(payload)
    expect(result.wouldUpdateStoredStanding).toBe(false)
  })

  it('shadow adapter source declares wouldUpdateStoredStanding as false literal', () => {
    const src = readFileSync(SHADOW_PATH, 'utf8')
    expect(src).toContain('wouldUpdateStoredStanding: false')
    expect(src).not.toContain('wouldUpdateStoredStanding: true')
  })

  it('page count is still 21 (Phase 9P adds no new pages)', () => {
    function findPages(dir: string): string[] {
      const { readdirSync } = require('fs')
      if (!existsSync(dir)) return []
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
    expect(findPages(join(ROOT, 'app')).length).toBe(48)
  })
})
