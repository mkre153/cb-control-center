// Phase 10 — Member Status Read Model
// The page displays status. It does not decide status.
// standing is derived, not stored. No PHI. No payment CTAs. No raw billing events.
// Client Builder Pro is the payment system. DAP is the registry.
// MKCRM has no authority over member standing.

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join, resolve } from 'path'

const ROOT      = join(__dirname, '..', '..')
const PAGE_PATH = join(ROOT, 'app/preview/dap/member-status/[membershipId]/page.tsx')

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

// ─── Imports ──────────────────────────────────────────────────────────────────

import type {
  DapMemberPublicStatus,
  DapMemberStatusPublicReadModel,
} from './dapMemberStatusPublicTypes'

import {
  getDapMemberStatusReadModel,
  getAllDapMemberPublicStatusFixtures,
  mapStandingToPublicStatus,
  getStatusLabel,
  getStatusSummary,
  getNextStep,
  validateDapMemberStatusPublicReadModel,
  FORBIDDEN_PUBLIC_READ_MODEL_FIELDS,
  DAP_P10_FIXTURE_MEMBERSHIP_IDS,
} from './dapMemberStatusReadModel'

// ─── Group 1: Public type surface ────────────────────────────────────────────

describe('Phase 10 — public type surface exists', () => {
  it('DapMemberPublicStatus has all five values', () => {
    const values: DapMemberPublicStatus[] = [
      'active',
      'pending',
      'attention_needed',
      'inactive',
      'unknown',
    ]
    expect(values).toHaveLength(5)
  })

  it('public types file does not import from Supabase', () => {
    const src = readFileSync(join(__dirname, 'dapMemberStatusPublicTypes.ts'), 'utf8')
    expect(src).not.toMatch(/^import.*supabase/im)
    expect(src).not.toMatch(/from ['"].*supabase/i)
  })

  it('public read model file does not import from Supabase', () => {
    const src = readFileSync(join(__dirname, 'dapMemberStatusReadModel.ts'), 'utf8')
    expect(src).not.toMatch(/^import.*supabase/im)
    expect(src).not.toMatch(/from ['"].*supabase/i)
  })

  it('DapMemberStatusPublicReadModel has required shape', () => {
    const model = getDapMemberStatusReadModel('dap-p10-active')
    const _typeCheck: DapMemberStatusPublicReadModel = model
    expect(_typeCheck).toBeDefined()
  })

  it('public types imports from existing standing types (no duplication)', () => {
    const src = readFileSync(join(__dirname, 'dapMemberStatusPublicTypes.ts'), 'utf8')
    expect(src).toMatch(/dapMemberStatusTypes/)
  })
})

// ─── Group 2: All 8 standing states produce a safe read model ────────────────

describe('Phase 10 — all 8 standings produce safe read models', () => {
  const fixtures = getAllDapMemberPublicStatusFixtures()

  it('returns 8 fixture models (one per standing)', () => {
    expect(fixtures).toHaveLength(8)
  })

  it('all 8 fixtures have verticalKey: dap', () => {
    for (const m of fixtures) {
      expect(m.verticalKey, m.membershipId).toBe('dap')
    }
  })

  it('all 8 fixtures have safety.includesPhi: false', () => {
    for (const m of fixtures) {
      expect(m.safety.includesPhi, m.membershipId).toBe(false)
    }
  })

  it('all 8 fixtures have safety.includesPaymentCta: false', () => {
    for (const m of fixtures) {
      expect(m.safety.includesPaymentCta, m.membershipId).toBe(false)
    }
  })

  it('all 8 fixtures have safety.includesRawBillingEvents: false', () => {
    for (const m of fixtures) {
      expect(m.safety.includesRawBillingEvents, m.membershipId).toBe(false)
    }
  })

  it('all 8 fixtures have source.derivedFromBillingEvents: true', () => {
    for (const m of fixtures) {
      expect(m.source.derivedFromBillingEvents, m.membershipId).toBe(true)
    }
  })

  it('all 8 fixtures have source.crmAuthority: false', () => {
    for (const m of fixtures) {
      expect(m.source.crmAuthority, m.membershipId).toBe(false)
    }
  })

  it('all 8 fixtures have source.paymentAuthority: client_builder_pro', () => {
    for (const m of fixtures) {
      expect(m.source.paymentAuthority, m.membershipId).toBe('client_builder_pro')
    }
  })

  it('all 8 fixtures have source.dapAuthority: registry_only', () => {
    for (const m of fixtures) {
      expect(m.source.dapAuthority, m.membershipId).toBe('registry_only')
    }
  })

  it('all 8 fixtures pass the validator', () => {
    for (const m of fixtures) {
      expect(() => validateDapMemberStatusPublicReadModel(m), m.membershipId).not.toThrow()
    }
  })

  it('unknown membershipId produces standing: unknown', () => {
    const model = getDapMemberStatusReadModel('dap-p10-unknown')
    expect(model.standing).toBe('unknown')
    expect(model.publicStatus).toBe('unknown')
  })

  it('unknown membershipId with missing fixture also produces standing: unknown', () => {
    const model = getDapMemberStatusReadModel('totally-unknown-member-id')
    expect(model.standing).toBe('unknown')
  })
})

// ─── Group 3: Correct standing for each fixture ───────────────────────────────

describe('Phase 10 — each fixture membership maps to correct standing', () => {
  it('dap-p10-unknown → unknown', () => {
    expect(getDapMemberStatusReadModel('dap-p10-unknown').standing).toBe('unknown')
  })

  it('dap-p10-pending → pending', () => {
    expect(getDapMemberStatusReadModel('dap-p10-pending').standing).toBe('pending')
  })

  it('dap-p10-active → active', () => {
    expect(getDapMemberStatusReadModel('dap-p10-active').standing).toBe('active')
  })

  it('dap-p10-past-due → past_due', () => {
    expect(getDapMemberStatusReadModel('dap-p10-past-due').standing).toBe('past_due')
  })

  it('dap-p10-payment-failed → payment_failed', () => {
    expect(getDapMemberStatusReadModel('dap-p10-payment-failed').standing).toBe('payment_failed')
  })

  it('dap-p10-canceled → canceled', () => {
    expect(getDapMemberStatusReadModel('dap-p10-canceled').standing).toBe('canceled')
  })

  it('dap-p10-refunded → refunded', () => {
    expect(getDapMemberStatusReadModel('dap-p10-refunded').standing).toBe('refunded')
  })

  it('dap-p10-chargeback → chargeback', () => {
    expect(getDapMemberStatusReadModel('dap-p10-chargeback').standing).toBe('chargeback')
  })
})

// ─── Group 4: publicStatus mapping ───────────────────────────────────────────

describe('Phase 10 — standing maps to correct publicStatus', () => {
  it('active → active', () => {
    expect(mapStandingToPublicStatus('active')).toBe('active')
  })

  it('pending → pending', () => {
    expect(mapStandingToPublicStatus('pending')).toBe('pending')
  })

  it('past_due → attention_needed', () => {
    expect(mapStandingToPublicStatus('past_due')).toBe('attention_needed')
  })

  it('payment_failed → attention_needed', () => {
    expect(mapStandingToPublicStatus('payment_failed')).toBe('attention_needed')
  })

  it('canceled → inactive', () => {
    expect(mapStandingToPublicStatus('canceled')).toBe('inactive')
  })

  it('refunded → inactive', () => {
    expect(mapStandingToPublicStatus('refunded')).toBe('inactive')
  })

  it('chargeback → inactive', () => {
    expect(mapStandingToPublicStatus('chargeback')).toBe('inactive')
  })

  it('unknown → unknown', () => {
    expect(mapStandingToPublicStatus('unknown')).toBe('unknown')
  })

  it('fixture models carry correct publicStatus for active', () => {
    expect(getDapMemberStatusReadModel('dap-p10-active').publicStatus).toBe('active')
  })

  it('fixture models carry correct publicStatus for past_due', () => {
    expect(getDapMemberStatusReadModel('dap-p10-past-due').publicStatus).toBe('attention_needed')
  })

  it('fixture models carry correct publicStatus for canceled', () => {
    expect(getDapMemberStatusReadModel('dap-p10-canceled').publicStatus).toBe('inactive')
  })
})

// ─── Group 5: Display copy is present for all standings ──────────────────────

describe('Phase 10 — display copy is non-empty for all standings', () => {
  const standings = [
    'unknown', 'pending', 'active', 'past_due',
    'payment_failed', 'canceled', 'refunded', 'chargeback',
  ] as const

  for (const standing of standings) {
    it(`statusLabel is non-empty for ${standing}`, () => {
      expect(getStatusLabel(standing).length).toBeGreaterThan(0)
    })

    it(`statusSummary is non-empty for ${standing}`, () => {
      expect(getStatusSummary(standing).length).toBeGreaterThan(0)
    })

    it(`nextStep is non-empty for ${standing}`, () => {
      expect(getNextStep(standing).length).toBeGreaterThan(0)
    })
  }

  it('all 8 fixture models have non-empty statusLabel', () => {
    for (const m of getAllDapMemberPublicStatusFixtures()) {
      expect(m.statusLabel.length, m.membershipId).toBeGreaterThan(0)
    }
  })

  it('all 8 fixture models have non-empty statusSummary', () => {
    for (const m of getAllDapMemberPublicStatusFixtures()) {
      expect(m.statusSummary.length, m.membershipId).toBeGreaterThan(0)
    }
  })

  it('all 8 fixture models have non-empty nextStep', () => {
    for (const m of getAllDapMemberPublicStatusFixtures()) {
      expect(m.nextStep.length, m.membershipId).toBeGreaterThan(0)
    }
  })
})

// ─── Group 6: Strong negative — forbidden fields not in read model ────────────

describe('Phase 10 — read model does not expose forbidden fields', () => {
  const model = getDapMemberStatusReadModel('dap-p10-active')

  it('model does not have paymentUrl', () => {
    expect(Object.keys(model)).not.toContain('paymentUrl')
  })

  it('model does not have checkoutUrl', () => {
    expect(Object.keys(model)).not.toContain('checkoutUrl')
  })

  it('model does not have invoiceUrl', () => {
    expect(Object.keys(model)).not.toContain('invoiceUrl')
  })

  it('model does not have billingPortalUrl', () => {
    expect(Object.keys(model)).not.toContain('billingPortalUrl')
  })

  it('model does not have billingEvents', () => {
    expect(Object.keys(model)).not.toContain('billingEvents')
  })

  it('model does not have rawBillingEvents', () => {
    expect(Object.keys(model)).not.toContain('rawBillingEvents')
  })

  it('model does not have lastBillingEventType', () => {
    expect(Object.keys(model)).not.toContain('lastBillingEventType')
  })

  it('model does not have lastBillingEventAt', () => {
    expect(Object.keys(model)).not.toContain('lastBillingEventAt')
  })

  it('model does not have eventCount', () => {
    expect(Object.keys(model)).not.toContain('eventCount')
  })

  it('model does not have reasons', () => {
    expect(Object.keys(model)).not.toContain('reasons')
  })

  it('model does not have sent', () => {
    expect(Object.keys(model)).not.toContain('sent')
  })

  it('model does not have sentAt', () => {
    expect(Object.keys(model)).not.toContain('sentAt')
  })

  it('model does not have memberEmail', () => {
    expect(Object.keys(model)).not.toContain('memberEmail')
  })

  it('model does not have diagnosis', () => {
    expect(Object.keys(model)).not.toContain('diagnosis')
  })

  it('model does not have treatment', () => {
    expect(Object.keys(model)).not.toContain('treatment')
  })

  it('model does not have notes', () => {
    expect(Object.keys(model)).not.toContain('notes')
  })

  it('model does not have mkcrmDecision', () => {
    expect(Object.keys(model)).not.toContain('mkcrmDecision')
  })
})

// ─── Group 7: Validator rejects forbidden fields ──────────────────────────────

describe('Phase 10 — validator rejects forbidden fields', () => {
  it('valid model passes validation', () => {
    const model = getDapMemberStatusReadModel('dap-p10-active')
    expect(() => validateDapMemberStatusPublicReadModel(model)).not.toThrow()
  })

  it('validator throws when paymentUrl is present', () => {
    const model = { ...getDapMemberStatusReadModel('dap-p10-active'), paymentUrl: 'https://pay.example.com' }
    expect(() => validateDapMemberStatusPublicReadModel(model)).toThrow("'paymentUrl'")
  })

  it('validator throws when checkoutUrl is present', () => {
    const model = { ...getDapMemberStatusReadModel('dap-p10-active'), checkoutUrl: 'https://checkout.example.com' }
    expect(() => validateDapMemberStatusPublicReadModel(model)).toThrow("'checkoutUrl'")
  })

  it('validator throws when billingEvents is present', () => {
    const model = { ...getDapMemberStatusReadModel('dap-p10-active'), billingEvents: [] }
    expect(() => validateDapMemberStatusPublicReadModel(model)).toThrow("'billingEvents'")
  })

  it('validator throws when lastBillingEventType is present', () => {
    const model = { ...getDapMemberStatusReadModel('dap-p10-active'), lastBillingEventType: 'client_builder_subscription_activated' }
    expect(() => validateDapMemberStatusPublicReadModel(model)).toThrow("'lastBillingEventType'")
  })

  it('validator throws when diagnosis is present', () => {
    const model = { ...getDapMemberStatusReadModel('dap-p10-active'), diagnosis: 'cavity' }
    expect(() => validateDapMemberStatusPublicReadModel(model)).toThrow("'diagnosis'")
  })

  it('validator throws when nested eventCount is present', () => {
    const model = { ...getDapMemberStatusReadModel('dap-p10-active'), meta: { eventCount: 5 } }
    expect(() => validateDapMemberStatusPublicReadModel(model)).toThrow("'eventCount'")
  })

  it('validator throws when sentAt is present', () => {
    const model = { ...getDapMemberStatusReadModel('dap-p10-active'), sentAt: '2026-04-30T00:00:00Z' }
    expect(() => validateDapMemberStatusPublicReadModel(model)).toThrow("'sentAt'")
  })

  it('validator throws when safety.includesPhi is true', () => {
    const model = getDapMemberStatusReadModel('dap-p10-active')
    const bad = { ...model, safety: { ...model.safety, includesPhi: true as unknown as false } }
    expect(() => validateDapMemberStatusPublicReadModel(bad)).toThrow('includesPhi')
  })

  it('validator throws when source.crmAuthority is true', () => {
    const model = getDapMemberStatusReadModel('dap-p10-active')
    const bad = { ...model, source: { ...model.source, crmAuthority: true as unknown as false } }
    expect(() => validateDapMemberStatusPublicReadModel(bad)).toThrow('crmAuthority')
  })

  it('validator throws when source.paymentAuthority is mkcrm', () => {
    const model = getDapMemberStatusReadModel('dap-p10-active')
    const bad = { ...model, source: { ...model.source, paymentAuthority: 'mkcrm' as unknown as 'client_builder_pro' } }
    expect(() => validateDapMemberStatusPublicReadModel(bad)).toThrow('paymentAuthority')
  })

  it('FORBIDDEN_PUBLIC_READ_MODEL_FIELDS is a Set covering payment, billing, PHI, delivery, and MKCRM fields', () => {
    expect(FORBIDDEN_PUBLIC_READ_MODEL_FIELDS.has('paymentUrl')).toBe(true)
    expect(FORBIDDEN_PUBLIC_READ_MODEL_FIELDS.has('billingEvents')).toBe(true)
    expect(FORBIDDEN_PUBLIC_READ_MODEL_FIELDS.has('diagnosis')).toBe(true)
    expect(FORBIDDEN_PUBLIC_READ_MODEL_FIELDS.has('sentAt')).toBe(true)
    expect(FORBIDDEN_PUBLIC_READ_MODEL_FIELDS.has('mkcrmDecision')).toBe(true)
    expect(FORBIDDEN_PUBLIC_READ_MODEL_FIELDS.has('lastBillingEventType')).toBe(true)
  })
})

// ─── Group 8: Authority boundary ─────────────────────────────────────────────

describe('Phase 10 — authority boundary', () => {
  it('source.crmAuthority is always false', () => {
    for (const m of getAllDapMemberPublicStatusFixtures()) {
      expect(m.source.crmAuthority).toBe(false)
    }
  })

  it('source.paymentAuthority is always client_builder_pro', () => {
    for (const m of getAllDapMemberPublicStatusFixtures()) {
      expect(m.source.paymentAuthority).toBe('client_builder_pro')
    }
  })

  it('source.dapAuthority is always registry_only', () => {
    for (const m of getAllDapMemberPublicStatusFixtures()) {
      expect(m.source.dapAuthority).toBe('registry_only')
    }
  })

  it('source.derivedFromBillingEvents is always true', () => {
    for (const m of getAllDapMemberPublicStatusFixtures()) {
      expect(m.source.derivedFromBillingEvents).toBe(true)
    }
  })

  it('read model file has no reference to MKCRM send/deliver APIs', () => {
    const src = readFileSync(join(__dirname, 'dapMemberStatusReadModel.ts'), 'utf8')
    expect(src).not.toMatch(/resend\.emails/i)
    expect(src).not.toMatch(/mkcrm\.send/i)
    expect(src).not.toMatch(/supabase\.(from|rpc)/i)
  })

  it('read model file does not contain paymentUrl string literal', () => {
    const src = readFileSync(join(__dirname, 'dapMemberStatusReadModel.ts'), 'utf8')
    expect(src).not.toMatch(/paymentUrl\s*:/i)
  })

  it('read model file does not contain checkoutUrl string literal', () => {
    const src = readFileSync(join(__dirname, 'dapMemberStatusReadModel.ts'), 'utf8')
    expect(src).not.toMatch(/checkoutUrl\s*:/i)
  })
})

// ─── Group 9: Preview page ────────────────────────────────────────────────────

describe('Phase 10 — member status preview page', () => {
  it('page file exists at app/preview/dap/member-status/[membershipId]/page.tsx', () => {
    expect(existsSync(PAGE_PATH)).toBe(true)
  })

  it('page imports from dapMemberStatusReadModel', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toMatch(/from.*dapMemberStatusReadModel/)
  })

  it('page has data-member-status-public-page attribute', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('data-member-status-public-page')
  })

  it('page has data-public-status attribute', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('data-public-status')
  })

  it('page has data-standing attribute', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('data-standing')
  })

  it('page has data-status-summary attribute', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('data-status-summary')
  })

  it('page has data-next-step attribute', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('data-next-step')
  })

  it('page has data-source-authority attribute', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('data-source-authority')
  })

  it('page has data-safety-flags attribute', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('data-safety-flags')
  })

  it('page does not expose billing event data directly', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).not.toMatch(/billingEvents\.map/i)
    expect(src).not.toMatch(/data-billing-event-row/i)
  })

  it('page does not reference MKCRM send APIs', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).not.toMatch(/resend\.emails/i)
    expect(src).not.toMatch(/mkcrm\.send/i)
    expect(src).not.toMatch(/supabase\.(from|rpc)/i)
  })

  it('page count is now 26 (Phase 10 added member-status dynamic route)', () => {
    expect(findPages(join(ROOT, 'app')).length).toBe(49)
  })
})

// ─── Group 10: Prior phase contracts ─────────────────────────────────────────

describe('Phase 10 — prior phase contracts still hold', () => {
  it('DAP_P10_FIXTURE_MEMBERSHIP_IDS has 8 entries', () => {
    expect(DAP_P10_FIXTURE_MEMBERSHIP_IDS).toHaveLength(8)
  })

  it('existing members/[membershipId]/status page still exists (Phase 9R)', () => {
    expect(existsSync(
      resolve(ROOT, 'app/preview/dap/members/[membershipId]/status/page.tsx')
    )).toBe(true)
  })

  it('9 known migrations still exist (Phase 15 added admin-decision-events)', () => {
    const { readdirSync } = require('fs')
    const dir   = resolve(ROOT, 'supabase/migrations')
    const files = readdirSync(dir).filter((f: string) => f.endsWith('.sql'))
    expect(files).toHaveLength(9)
  })
})
