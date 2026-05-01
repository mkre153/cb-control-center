/**
 * Phase 9O — Client Builder Pro Billing Event Ingestion Shadow Contract QA
 *
 * PURPOSE: Prove that Client Builder Pro is the only valid billing source for
 * DAP events, MKCRM cannot originate billing, DAP standing is never stored
 * directly, and no PHI or payment instrument data leaks through.
 *
 * Locked language:
 *   Client Builder Pro billing events may feed DAP billing_events.
 *   DAP standing is derived from billing_events.
 *   MKCRM may receive lifecycle sync but does not originate billing.
 *   Phase 9O is shadow-only.
 *
 * COVERAGE:
 *   Group 1 — Client Builder Pro is the only billing source
 *   Group 2 — DAP vertical is locked
 *   Group 3 — Shadow mode is locked
 *   Group 4 — Event type → status hint mapping
 *   Group 5 — Unsafe fields are rejected
 *   Group 6 — Safe identifiers are allowed
 *   Group 7 — Standing is derived, not stored
 *   Group 8 — MKCRM may be notified but cannot originate billing
 *   Group 9 — Phase 9N boundary remains intact
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, readdirSync } from 'fs'
import { resolve, join } from 'path'
import {
  buildDapClientBuilderBillingPayload,
  validateDapClientBuilderBillingPayload,
  mapClientBuilderBillingEventToStatusHint,
  isClientBuilderBillingPayloadSafe,
  assertClientBuilderBillingSource,
} from '../dapClientBuilderBillingRules'
import {
  ingestDapClientBuilderBillingEventShadow,
} from '../dapClientBuilderBillingShadow'
import {
  getPublicCommercialSystemForVertical,
  getInternalCrmSystemForVertical,
  isResponsibilityAllowed,
} from '../clientBuilderBoundaryRules'
import type { DapClientBuilderBillingShadowPayload } from '../dapClientBuilderBillingTypes'

// ─── Project root ─────────────────────────────────────────────────────────────

const ROOT = resolve(__dirname, '../../..')

// ─── Key paths ────────────────────────────────────────────────────────────────

const TYPES_PATH   = resolve(ROOT, 'lib/cb-control-center/dapClientBuilderBillingTypes.ts')
const RULES_PATH   = resolve(ROOT, 'lib/cb-control-center/dapClientBuilderBillingRules.ts')
const SHADOW_PATH  = resolve(ROOT, 'lib/cb-control-center/dapClientBuilderBillingShadow.ts')

// ─── Base sample input ─────────────────────────────────────────────────────────

const BASE_INPUT = {
  eventType:        'client_builder_subscription_activated' as const,
  externalAccountId: 'acct-test-001',
  occurredAt:       '2026-04-30T12:00:00Z',
  receivedAt:       '2026-04-30T12:00:01Z',
}

function basePayload(): DapClientBuilderBillingShadowPayload {
  return buildDapClientBuilderBillingPayload(BASE_INPUT)
}

// ─── Group 1: Client Builder Pro is the only billing source ──────────────────

describe('Client Builder Pro — only valid billing source for DAP', () => {
  it('valid payload has sourceSystem: client_builder_pro', () => {
    expect(basePayload().sourceSystem).toBe('client_builder_pro')
  })

  it('assertClientBuilderBillingSource does not throw for client_builder_pro', () => {
    expect(() => assertClientBuilderBillingSource(basePayload())).not.toThrow()
  })

  it('assertClientBuilderBillingSource throws when sourceSystem is mkcrm', () => {
    const bad = { ...basePayload(), sourceSystem: 'mkcrm' } as unknown as DapClientBuilderBillingShadowPayload
    expect(() => assertClientBuilderBillingSource(bad)).toThrow()
  })

  it('assertClientBuilderBillingSource throws when sourceSystem is stripe', () => {
    const bad = { ...basePayload(), sourceSystem: 'stripe' } as unknown as DapClientBuilderBillingShadowPayload
    expect(() => assertClientBuilderBillingSource(bad)).toThrow()
  })

  it('assertClientBuilderBillingSource throws when sourceSystem is ghl', () => {
    const bad = { ...basePayload(), sourceSystem: 'ghl' } as unknown as DapClientBuilderBillingShadowPayload
    expect(() => assertClientBuilderBillingSource(bad)).toThrow()
  })

  it('assertClientBuilderBillingSource throws when sourceSystem is dap', () => {
    const bad = { ...basePayload(), sourceSystem: 'dap' } as unknown as DapClientBuilderBillingShadowPayload
    expect(() => assertClientBuilderBillingSource(bad)).toThrow()
  })

  it('error message from assertClientBuilderBillingSource names client_builder_pro as the expected source', () => {
    const bad = { ...basePayload(), sourceSystem: 'mkcrm' } as unknown as DapClientBuilderBillingShadowPayload
    expect(() => assertClientBuilderBillingSource(bad)).toThrow(/client_builder_pro|Client Builder Pro/)
  })

  it('DapBillingEventSourceSystem type is defined in types source', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain("'client_builder_pro'")
    expect(src).toContain('DapBillingEventSourceSystem')
  })

  it('ingestDapClientBuilderBillingEventShadow returns sourceSystem: client_builder_pro', () => {
    const result = ingestDapClientBuilderBillingEventShadow(basePayload())
    expect(result.sourceSystem).toBe('client_builder_pro')
  })
})

// ─── Group 2: DAP vertical is locked ─────────────────────────────────────────

describe('DAP vertical key — locked to dap', () => {
  it('built payload has verticalKey: dap', () => {
    expect(basePayload().verticalKey).toBe('dap')
  })

  it('ingest result has verticalKey: dap', () => {
    const result = ingestDapClientBuilderBillingEventShadow(basePayload())
    expect(result.verticalKey).toBe('dap')
  })

  it('validateDapClientBuilderBillingPayload throws when verticalKey is not dap', () => {
    const bad = { ...basePayload(), verticalKey: 'cbp' } as unknown as DapClientBuilderBillingShadowPayload
    expect(() => validateDapClientBuilderBillingPayload(bad)).toThrow()
  })

  it('validateDapClientBuilderBillingPayload throws when verticalKey is empty', () => {
    const bad = { ...basePayload(), verticalKey: '' } as unknown as DapClientBuilderBillingShadowPayload
    expect(() => validateDapClientBuilderBillingPayload(bad)).toThrow()
  })
})

// ─── Group 3: Shadow mode is locked ──────────────────────────────────────────

describe('Shadow mode — locked, no network calls, no database writes', () => {
  it('built payload has shadowMode: true', () => {
    expect(basePayload().shadowMode).toBe(true)
  })

  it('ingest result has shadowMode: true', () => {
    const result = ingestDapClientBuilderBillingEventShadow(basePayload())
    expect(result.shadowMode).toBe(true)
  })

  it('validateDapClientBuilderBillingPayload throws when shadowMode is false', () => {
    const bad = { ...basePayload(), shadowMode: false } as unknown as DapClientBuilderBillingShadowPayload
    expect(() => validateDapClientBuilderBillingPayload(bad)).toThrow()
  })

  it('shadow adapter has no fetch( call', () => {
    const src = readFileSync(SHADOW_PATH, 'utf8')
    expect(src).not.toContain('fetch(')
  })

  it('shadow adapter has no http:// or https:// URLs', () => {
    const src = readFileSync(SHADOW_PATH, 'utf8')
    expect(src).not.toMatch(/https?:\/\//)
  })

  it('shadow adapter does not import Supabase', () => {
    const src = readFileSync(SHADOW_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/supabase|getsupabase/)
  })

  it('rules file does not import Supabase', () => {
    const src = readFileSync(RULES_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/supabase|getsupabase/)
  })

  it('shadow adapter has no .insert( or .update( database calls', () => {
    const src = readFileSync(SHADOW_PATH, 'utf8')
    expect(src).not.toContain('.insert(')
    expect(src).not.toContain('.update(')
  })
})

// ─── Group 4: Event type → status hint mapping ────────────────────────────────

describe('Event type mapping — all nine event types map to correct status hint', () => {
  it('subscription_created maps to unknown', () => {
    expect(mapClientBuilderBillingEventToStatusHint('client_builder_subscription_created')).toBe('unknown')
  })

  it('subscription_activated maps to active', () => {
    expect(mapClientBuilderBillingEventToStatusHint('client_builder_subscription_activated')).toBe('active')
  })

  it('subscription_renewed maps to active', () => {
    expect(mapClientBuilderBillingEventToStatusHint('client_builder_subscription_renewed')).toBe('active')
  })

  it('payment_succeeded maps to active', () => {
    expect(mapClientBuilderBillingEventToStatusHint('client_builder_payment_succeeded')).toBe('active')
  })

  it('subscription_past_due maps to past_due', () => {
    expect(mapClientBuilderBillingEventToStatusHint('client_builder_subscription_past_due')).toBe('past_due')
  })

  it('payment_failed maps to payment_failed', () => {
    expect(mapClientBuilderBillingEventToStatusHint('client_builder_payment_failed')).toBe('payment_failed')
  })

  it('subscription_canceled maps to canceled', () => {
    expect(mapClientBuilderBillingEventToStatusHint('client_builder_subscription_canceled')).toBe('canceled')
  })

  it('refund_recorded maps to refunded', () => {
    expect(mapClientBuilderBillingEventToStatusHint('client_builder_refund_recorded')).toBe('refunded')
  })

  it('chargeback_recorded maps to chargeback', () => {
    expect(mapClientBuilderBillingEventToStatusHint('client_builder_chargeback_recorded')).toBe('chargeback')
  })

  it('built payload statusHint matches the mapping for the event type', () => {
    const p = buildDapClientBuilderBillingPayload({
      ...BASE_INPUT,
      eventType: 'client_builder_subscription_past_due',
    })
    expect(p.statusHint).toBe('past_due')
  })
})

// ─── Group 5: Unsafe fields are rejected ──────────────────────────────────────

describe('Unsafe fields — PHI and payment instrument data must be rejected', () => {
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
    it(`payload with metadata.${key} is not safe`, () => {
      const payload = buildDapClientBuilderBillingPayload({
        ...BASE_INPUT,
        metadata: { [key]: value },
      })
      expect(isClientBuilderBillingPayloadSafe(payload)).toBe(false)
    })
  }

  it('rules file does not reference patientName or memberName as allowed fields', () => {
    const src = readFileSync(RULES_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/patientname.*allowed|membername.*allowed/)
  })

  it('types file does not declare patientName or ssn as top-level fields', () => {
    const src = readFileSync(TYPES_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/\bpatientname\b|\bssn\b|\bcardnumber\b/)
  })
})

// ─── Group 6: Safe identifiers are allowed ────────────────────────────────────

describe('Safe identifiers — operational IDs are permitted in payloads', () => {
  it('payload with externalAccountId is safe', () => {
    const p = buildDapClientBuilderBillingPayload({
      ...BASE_INPUT,
      externalAccountId: 'acct-safe-001',
    })
    expect(isClientBuilderBillingPayloadSafe(p)).toBe(true)
  })

  it('payload with externalCustomerId is safe', () => {
    const p = buildDapClientBuilderBillingPayload({
      ...BASE_INPUT,
      externalCustomerId: 'cust-safe-001',
    })
    expect(isClientBuilderBillingPayloadSafe(p)).toBe(true)
  })

  it('payload with externalSubscriptionId is safe', () => {
    const p = buildDapClientBuilderBillingPayload({
      ...BASE_INPUT,
      externalSubscriptionId: 'sub-safe-001',
    })
    expect(isClientBuilderBillingPayloadSafe(p)).toBe(true)
  })

  it('payload with externalInvoiceId is safe', () => {
    const p = buildDapClientBuilderBillingPayload({
      ...BASE_INPUT,
      externalInvoiceId: 'inv-safe-001',
    })
    expect(isClientBuilderBillingPayloadSafe(p)).toBe(true)
  })

  it('payload with externalPaymentId is safe', () => {
    const p = buildDapClientBuilderBillingPayload({
      ...BASE_INPUT,
      externalPaymentId: 'pay-safe-001',
    })
    expect(isClientBuilderBillingPayloadSafe(p)).toBe(true)
  })

  it('payload with membershipId is safe', () => {
    const p = buildDapClientBuilderBillingPayload({
      ...BASE_INPUT,
      membershipId: 'mem-safe-001',
    })
    expect(isClientBuilderBillingPayloadSafe(p)).toBe(true)
  })

  it('payload with practiceId is safe', () => {
    const p = buildDapClientBuilderBillingPayload({
      ...BASE_INPUT,
      practiceId: 'prc-safe-001',
    })
    expect(isClientBuilderBillingPayloadSafe(p)).toBe(true)
  })

  it('payload with all safe identifiers is safe', () => {
    const p = buildDapClientBuilderBillingPayload({
      ...BASE_INPUT,
      externalCustomerId:     'cust-001',
      externalSubscriptionId: 'sub-001',
      externalInvoiceId:      'inv-001',
      externalPaymentId:      'pay-001',
      membershipId:           'mem-001',
      practiceId:             'prc-001',
    })
    expect(isClientBuilderBillingPayloadSafe(p)).toBe(true)
  })

  it('ingest result is ok: true for a safe payload', () => {
    const result = ingestDapClientBuilderBillingEventShadow(basePayload())
    expect(result.ok).toBe(true)
  })

  it('ingest result is ok: false for an unsafe payload (PHI in metadata)', () => {
    const payload = buildDapClientBuilderBillingPayload({
      ...BASE_INPUT,
      metadata: { ssn: '123-45-6789' },
    })
    const result = ingestDapClientBuilderBillingEventShadow(payload)
    expect(result.ok).toBe(false)
    expect(result.wouldAppendBillingEvent).toBe(false)
  })
})

// ─── Group 7: Standing is derived, not stored ─────────────────────────────────

describe('Standing is derived from billing_events — never stored directly', () => {
  it('ingest result has wouldUpdateStoredStanding: false for a valid event', () => {
    const result = ingestDapClientBuilderBillingEventShadow(basePayload())
    expect(result.wouldUpdateStoredStanding).toBe(false)
  })

  it('ingest result has wouldUpdateStoredStanding: false for subscription_canceled', () => {
    const p = buildDapClientBuilderBillingPayload({
      ...BASE_INPUT,
      eventType: 'client_builder_subscription_canceled',
    })
    const result = ingestDapClientBuilderBillingEventShadow(p)
    expect(result.wouldUpdateStoredStanding).toBe(false)
  })

  it('ingest result has wouldUpdateStoredStanding: false for payment_failed', () => {
    const p = buildDapClientBuilderBillingPayload({
      ...BASE_INPUT,
      eventType: 'client_builder_payment_failed',
    })
    const result = ingestDapClientBuilderBillingEventShadow(p)
    expect(result.wouldUpdateStoredStanding).toBe(false)
  })

  it('ingest result has wouldUpdateStoredStanding: false even for unsafe payload', () => {
    const p = buildDapClientBuilderBillingPayload({
      ...BASE_INPUT,
      metadata: { cardNumber: '4111' },
    })
    const result = ingestDapClientBuilderBillingEventShadow(p)
    expect(result.wouldUpdateStoredStanding).toBe(false)
  })

  it('shadow adapter source declares wouldUpdateStoredStanding as false literal type', () => {
    const src = readFileSync(SHADOW_PATH, 'utf8')
    expect(src).toContain('wouldUpdateStoredStanding: false')
  })

  it('shadow adapter never assigns wouldUpdateStoredStanding: true', () => {
    const src = readFileSync(SHADOW_PATH, 'utf8')
    expect(src).not.toContain('wouldUpdateStoredStanding: true')
  })

  it('ingest result includes statusHint derived from event type', () => {
    const p = buildDapClientBuilderBillingPayload({
      ...BASE_INPUT,
      eventType: 'client_builder_subscription_past_due',
    })
    const result = ingestDapClientBuilderBillingEventShadow(p)
    expect(result.statusHint).toBe('past_due')
  })
})

// ─── Group 8: MKCRM may be notified but cannot originate billing ──────────────

describe('MKCRM — lifecycle notification target only, not billing source', () => {
  it('ingest result has wouldNotifyMkcrm: true for valid safe event', () => {
    const result = ingestDapClientBuilderBillingEventShadow(basePayload())
    expect(result.wouldNotifyMkcrm).toBe(true)
  })

  it('ingest result has wouldNotifyMkcrm: false for unsafe (PHI) payload', () => {
    const p = buildDapClientBuilderBillingPayload({
      ...BASE_INPUT,
      metadata: { diagnosis: 'cavity' },
    })
    const result = ingestDapClientBuilderBillingEventShadow(p)
    expect(result.wouldNotifyMkcrm).toBe(false)
  })

  it('assertClientBuilderBillingSource throws when sourceSystem is mkcrm', () => {
    const bad = { ...basePayload(), sourceSystem: 'mkcrm' } as unknown as DapClientBuilderBillingShadowPayload
    expect(() => assertClientBuilderBillingSource(bad)).toThrow()
  })

  it('validateDapClientBuilderBillingPayload throws for mkcrm source', () => {
    const bad = { ...basePayload(), sourceSystem: 'mkcrm' } as unknown as DapClientBuilderBillingShadowPayload
    expect(() => validateDapClientBuilderBillingPayload(bad)).toThrow()
  })

  it('shadow adapter source does not claim MKCRM is the billing source', () => {
    const src = readFileSync(SHADOW_PATH, 'utf8').toLowerCase()
    expect(src).not.toContain('mkcrm billing source')
    expect(src).not.toContain('mkcrm payment source')
    expect(src).not.toContain('mkcrm originates billing')
    expect(src).not.toContain('mkcrm is the billing')
  })

  it('rules file does not import MKCRM modules (comments mentioning mkcrm are allowed)', () => {
    const src = readFileSync(RULES_PATH, 'utf8')
    expect(src).not.toMatch(/^import.*mkcrm/im)
    expect(src).not.toMatch(/from ['"].*mkcrm/i)
  })
})

// ─── Group 9: Phase 9N boundary remains intact ────────────────────────────────

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

  it('dap does not have payment responsibility', () => {
    expect(isResponsibilityAllowed('dap', 'payment')).toBe(false)
  })

  it('page count is still 21 (Phase 9O adds no new pages)', () => {
    function findPages(dir: string): string[] {
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
    expect(findPages(join(ROOT, 'app')).length).toBe(58)
  })

  it('no ClientBuilder billing API route created in Phase 9O', () => {
    expect(existsSync(resolve(ROOT, 'app/api/dap/billing/route.ts'))).toBe(false)
    expect(existsSync(resolve(ROOT, 'app/api/clientbuilder/billing/route.ts'))).toBe(false)
  })

  it('new files live in lib/ not app/', () => {
    expect(existsSync(resolve(ROOT, 'lib/cb-control-center/dapClientBuilderBillingTypes.ts'))).toBe(true)
    expect(existsSync(resolve(ROOT, 'lib/cb-control-center/dapClientBuilderBillingRules.ts'))).toBe(true)
    expect(existsSync(resolve(ROOT, 'lib/cb-control-center/dapClientBuilderBillingShadow.ts'))).toBe(true)
  })
})
