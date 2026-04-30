// Phase 2A — Public Member Status Page
// Tests the production member-facing status page and its supporting read model.
// standing is derived, not stored. No PHI. No payment CTAs. No MKCRM authority.
// Client Builder Pro is the payment system. DAP is the registry.

import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { join, resolve } from 'path'

const ROOT      = join(__dirname, '..', '..')
const PAGE_PATH = resolve(ROOT, 'app/dental-advantage-plan/member-status/[membershipId]/page.tsx')

import {
  getDapMemberStatusReadModel,
  isDapMembershipKnown,
  DAP_P10_FIXTURE_MEMBERSHIP_IDS,
  validateDapMemberStatusPublicReadModel,
} from './dapMemberStatusReadModel'

// ─── Forbidden terms for public-facing copy ────────────────────────────────────

const FORBIDDEN_COPY_TERMS = [
  'guaranteed',
  'insurance',
  'pay now',
  'update payment',
  'ssn',
  'date of birth',
  'diagnosis',
  'treatment record',
  'mkcrm determines',
  'mkcrm has authority',
]

function collectAllText(obj: unknown): string {
  if (typeof obj === 'string') return obj
  if (Array.isArray(obj)) return obj.map(collectAllText).join(' ')
  if (obj && typeof obj === 'object') return Object.values(obj).map(collectAllText).join(' ')
  return ''
}

// ─── Phase 2A — Route existence ───────────────────────────────────────────────

describe('Phase 2A — public member status route', () => {
  it('production member status page exists at dental-advantage-plan/member-status/[membershipId]', () => {
    expect(existsSync(PAGE_PATH)).toBe(true)
  })

  it('page is not the preview page (distinct file, distinct path)', () => {
    const previewPath = resolve(ROOT, 'app/preview/dap/member-status/[membershipId]/page.tsx')
    expect(PAGE_PATH).not.toBe(previewPath)
    expect(existsSync(previewPath)).toBe(true)
  })

  it('production page is force-dynamic', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain("export const dynamic = 'force-dynamic'")
  })

  it('production page has no fixture navigation links', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).not.toContain('DAP_P10_FIXTURE_MEMBERSHIP_IDS')
    expect(src).not.toContain('getAllDapMemberPublicStatusFixtures')
  })

  it('production page does not display raw standing value', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).not.toContain('standing: {model.standing}')
    expect(src).not.toContain('data-standing=')
  })

  it('production page does not render source authority debug block', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).not.toContain('derivedFromBillingEvents:')
    expect(src).not.toContain('paymentAuthority:')
    expect(src).not.toContain('crmAuthority:')
  })

  it('production page does not render safety-flags debug block', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).not.toContain('includesPhi:')
    expect(src).not.toContain('includesPaymentCta:')
  })

  it('production page has data-implies-phi="false" marker', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('data-implies-phi="false"')
  })

  it('production page has data-implies-payment="false" marker', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('data-implies-payment="false"')
  })
})

// ─── Phase 2A — isDapMembershipKnown ─────────────────────────────────────────

describe('Phase 2A — membership existence check', () => {
  it('isDapMembershipKnown returns true for all 8 fixture IDs', () => {
    for (const id of DAP_P10_FIXTURE_MEMBERSHIP_IDS) {
      expect(isDapMembershipKnown(id), `expected ${id} to be known`).toBe(true)
    }
  })

  it('isDapMembershipKnown returns false for a random string', () => {
    expect(isDapMembershipKnown('not-a-real-id')).toBe(false)
  })

  it('isDapMembershipKnown returns false for empty string', () => {
    expect(isDapMembershipKnown('')).toBe(false)
  })

  it('isDapMembershipKnown returns false for a plausible-looking but unknown ID', () => {
    expect(isDapMembershipKnown('dap-member-99999')).toBe(false)
  })
})

// ─── Phase 2A — Standing states ──────────────────────────────────────────────

describe('Phase 2A — read model covers all required standing states', () => {
  it('active fixture has publicStatus active', () => {
    expect(getDapMemberStatusReadModel('dap-p10-active').publicStatus).toBe('active')
  })

  it('pending fixture has publicStatus pending', () => {
    expect(getDapMemberStatusReadModel('dap-p10-pending').publicStatus).toBe('pending')
  })

  it('past-due fixture has publicStatus attention_needed', () => {
    expect(getDapMemberStatusReadModel('dap-p10-past-due').publicStatus).toBe('attention_needed')
  })

  it('payment-failed fixture has publicStatus attention_needed', () => {
    expect(getDapMemberStatusReadModel('dap-p10-payment-failed').publicStatus).toBe('attention_needed')
  })

  it('canceled fixture has publicStatus inactive', () => {
    expect(getDapMemberStatusReadModel('dap-p10-canceled').publicStatus).toBe('inactive')
  })

  it('refunded fixture has publicStatus inactive', () => {
    expect(getDapMemberStatusReadModel('dap-p10-refunded').publicStatus).toBe('inactive')
  })

  it('chargeback fixture has publicStatus inactive', () => {
    expect(getDapMemberStatusReadModel('dap-p10-chargeback').publicStatus).toBe('inactive')
  })

  it('unknown fixture has publicStatus unknown', () => {
    expect(getDapMemberStatusReadModel('dap-p10-unknown').publicStatus).toBe('unknown')
  })
})

// ─── Phase 2A — Public read model safety ─────────────────────────────────────

describe('Phase 2A — all fixture models pass the public validator', () => {
  it('all 8 fixture read models pass validateDapMemberStatusPublicReadModel', () => {
    for (const id of DAP_P10_FIXTURE_MEMBERSHIP_IDS) {
      const model = getDapMemberStatusReadModel(id)
      expect(() => validateDapMemberStatusPublicReadModel(model), `failed for ${id}`).not.toThrow()
    }
  })

  it('all fixture models have safety.includesPhi: false', () => {
    for (const id of DAP_P10_FIXTURE_MEMBERSHIP_IDS) {
      expect(getDapMemberStatusReadModel(id).safety.includesPhi).toBe(false)
    }
  })

  it('all fixture models have safety.includesPaymentCta: false', () => {
    for (const id of DAP_P10_FIXTURE_MEMBERSHIP_IDS) {
      expect(getDapMemberStatusReadModel(id).safety.includesPaymentCta).toBe(false)
    }
  })

  it('all fixture models have safety.includesRawBillingEvents: false', () => {
    for (const id of DAP_P10_FIXTURE_MEMBERSHIP_IDS) {
      expect(getDapMemberStatusReadModel(id).safety.includesRawBillingEvents).toBe(false)
    }
  })

  it('all fixture models have source.crmAuthority: false', () => {
    for (const id of DAP_P10_FIXTURE_MEMBERSHIP_IDS) {
      expect(getDapMemberStatusReadModel(id).source.crmAuthority).toBe(false)
    }
  })

  it('all fixture models have source.dapAuthority: registry_only', () => {
    for (const id of DAP_P10_FIXTURE_MEMBERSHIP_IDS) {
      expect(getDapMemberStatusReadModel(id).source.dapAuthority).toBe('registry_only')
    }
  })
})

// ─── Phase 2A — Copy safety ───────────────────────────────────────────────────

describe('Phase 2A — public copy does not contain forbidden terms', () => {
  it('no fixture status summary contains forbidden terms', () => {
    for (const id of DAP_P10_FIXTURE_MEMBERSHIP_IDS) {
      const model = getDapMemberStatusReadModel(id)
      const text  = collectAllText({ summary: model.statusSummary, next: model.nextStep }).toLowerCase()
      for (const term of FORBIDDEN_COPY_TERMS) {
        expect(text, `Fixture "${id}" summary/nextStep contains forbidden term: "${term}"`).not.toContain(term.toLowerCase())
      }
    }
  })

  it('page source does not contain payment-action language', () => {
    const src = readFileSync(PAGE_PATH, 'utf8').toLowerCase()
    // Check terms that cannot plausibly appear as substrings of identifiers or class names
    expect(src).not.toContain('pay now')
    expect(src).not.toContain('update payment')
    expect(src).not.toContain('mkcrm determines')
    expect(src).not.toContain('mkcrm has authority')
    expect(src).not.toContain('guaranteed savings')
  })

  it('active statusLabel is "Active"', () => {
    expect(getDapMemberStatusReadModel('dap-p10-active').statusLabel).toBe('Active')
  })

  it('pending statusLabel is "Pending"', () => {
    expect(getDapMemberStatusReadModel('dap-p10-pending').statusLabel).toBe('Pending')
  })

  it('past-due statusLabel is "Past Due"', () => {
    expect(getDapMemberStatusReadModel('dap-p10-past-due').statusLabel).toBe('Past Due')
  })

  it('canceled statusLabel is "Canceled"', () => {
    expect(getDapMemberStatusReadModel('dap-p10-canceled').statusLabel).toBe('Canceled')
  })
})
