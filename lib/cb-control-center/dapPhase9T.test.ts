// Phase 9T — DAP Practice / Provider Decision Email Copy
// Practice and provider participation decisions are reviewed and managed by CB Control Center.
// MKCRM does not determine practice approval, rejection, public listing status,
// offer-term validation, or Join Plan CTA eligibility.

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

const ROOT = join(__dirname, '..', '..')

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
  DapPracticeDecisionEmailTemplateKey,
  DapPracticeDecisionEmailAudience,
  DapPracticeDecisionEmailCopy,
} from './dapPracticeDecisionEmailTypes'

import {
  DAP_PRACTICE_DECISION_EMAIL_FOOTER_NOTE,
  DAP_PRACTICE_DECISION_EMAIL_FORBIDDEN_TERMS,
  getDapPracticeDecisionEmailCopy,
  getAllDapPracticeDecisionEmailCopy,
  isDapPracticeDecisionEmailCopySafe,
  assertDapPracticeDecisionEmailCopySafe,
} from './dapPracticeDecisionEmailCopy'

import {
  getDapPracticeDecisionEmailPreview,
  getAllDapPracticeDecisionEmailPreviews,
} from './dapPracticeDecisionEmailPreview'

import { getAllDapMemberStatusEmailPreviews } from './dapMemberStatusEmailPreview'
import { getDapMemberStatusEmailCopy }        from './dapMemberStatusEmailCopy'
import { deriveDapMemberStatusReadModel }     from './dapMemberStatusRules'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ALL_TEMPLATE_KEYS: DapPracticeDecisionEmailTemplateKey[] = [
  'practice_application_received',
  'practice_under_review',
  'practice_approved_internal_only',
  'practice_offer_terms_needed',
  'practice_join_cta_blocked',
  'practice_rejected',
  'practice_declined',
  'practice_participation_paused',
]

const TERMINAL_TEMPLATE_KEYS: DapPracticeDecisionEmailTemplateKey[] = [
  'practice_rejected',
  'practice_declined',
  'practice_participation_paused',
]

// ─── Group 1: Type / Library Shape ───────────────────────────────────────────

describe('Phase 9T — Type and library shape', () => {
  it('exports exactly 8 templates from getAllDapPracticeDecisionEmailCopy', () => {
    expect(getAllDapPracticeDecisionEmailCopy()).toHaveLength(8)
  })

  it('every template key returns a copy object via getDapPracticeDecisionEmailCopy', () => {
    for (const key of ALL_TEMPLATE_KEYS) {
      const copy = getDapPracticeDecisionEmailCopy(key)
      expect(copy).toBeDefined()
      expect(copy.templateKey).toBe(key)
    }
  })

  it('every copy object has required string fields', () => {
    for (const copy of getAllDapPracticeDecisionEmailCopy()) {
      expect(typeof copy.subject).toBe('string')
      expect(typeof copy.previewText).toBe('string')
      expect(typeof copy.headline).toBe('string')
      expect(Array.isArray(copy.body)).toBe(true)
      expect(copy.body.length).toBeGreaterThan(0)
      expect(typeof copy.footerNote).toBe('string')
    }
  })

  it('every copy object has audience from the allowed set', () => {
    const allowed: DapPracticeDecisionEmailAudience[] = ['practice_admin', 'provider', 'internal_admin']
    for (const copy of getAllDapPracticeDecisionEmailCopy()) {
      expect(allowed).toContain(copy.audience)
    }
  })

  it('internal_only template targets internal_admin audience', () => {
    const copy = getDapPracticeDecisionEmailCopy('practice_approved_internal_only')
    expect(copy.audience).toBe('internal_admin')
  })

  it('exports the canonical footer note constant', () => {
    expect(typeof DAP_PRACTICE_DECISION_EMAIL_FOOTER_NOTE).toBe('string')
    expect(DAP_PRACTICE_DECISION_EMAIL_FOOTER_NOTE.length).toBeGreaterThan(20)
  })

  it('exports the forbidden terms array with at least 10 terms', () => {
    expect(DAP_PRACTICE_DECISION_EMAIL_FORBIDDEN_TERMS.length).toBeGreaterThanOrEqual(10)
  })

  it('types file does not import from Supabase', () => {
    const src = readFileSync(join(__dirname, 'dapPracticeDecisionEmailTypes.ts'), 'utf8')
    expect(src).not.toMatch(/^import.*supabase/im)
    expect(src).not.toMatch(/from ['"].*supabase/i)
  })

  it('copy file does not import from Supabase', () => {
    const src = readFileSync(join(__dirname, 'dapPracticeDecisionEmailCopy.ts'), 'utf8')
    expect(src).not.toMatch(/^import.*supabase/im)
    expect(src).not.toMatch(/from ['"].*supabase/i)
  })

  it('preview file does not import from Supabase', () => {
    const src = readFileSync(join(__dirname, 'dapPracticeDecisionEmailPreview.ts'), 'utf8')
    expect(src).not.toMatch(/^import.*supabase/im)
    expect(src).not.toMatch(/from ['"].*supabase/i)
  })
})

// ─── Group 2: Literal Safety Flags ───────────────────────────────────────────

describe('Phase 9T — Literal safety flags', () => {
  it('all templates have includesPaymentCta: false (literal)', () => {
    for (const copy of getAllDapPracticeDecisionEmailCopy()) {
      expect(copy.includesPaymentCta).toBe(false)
    }
  })

  it('all templates have includesPhi: false (literal)', () => {
    for (const copy of getAllDapPracticeDecisionEmailCopy()) {
      expect(copy.includesPhi).toBe(false)
    }
  })

  it('all templates have derivedFromBillingEvents: false (literal)', () => {
    for (const copy of getAllDapPracticeDecisionEmailCopy()) {
      expect(copy.derivedFromBillingEvents).toBe(false)
    }
  })

  it('all templates have decidedByCbControlCenter: true (literal)', () => {
    for (const copy of getAllDapPracticeDecisionEmailCopy()) {
      expect(copy.decidedByCbControlCenter).toBe(true)
    }
  })

  it('all templates have decidedByMkcrm: false (literal)', () => {
    for (const copy of getAllDapPracticeDecisionEmailCopy()) {
      expect(copy.decidedByMkcrm).toBe(false)
    }
  })
})

// ─── Group 3: Footer Lock ─────────────────────────────────────────────────────

describe('Phase 9T — Footer note lock', () => {
  it('canonical footer contains "CB Control Center"', () => {
    expect(DAP_PRACTICE_DECISION_EMAIL_FOOTER_NOTE).toContain('CB Control Center')
  })

  it('canonical footer states MKCRM does not determine practice approval', () => {
    expect(DAP_PRACTICE_DECISION_EMAIL_FOOTER_NOTE.toLowerCase()).toContain('does not determine')
  })

  it('all templates use the canonical footer note exactly', () => {
    for (const copy of getAllDapPracticeDecisionEmailCopy()) {
      expect(copy.footerNote).toBe(DAP_PRACTICE_DECISION_EMAIL_FOOTER_NOTE)
    }
  })

  it('footer mentions offer-term validation authority', () => {
    expect(DAP_PRACTICE_DECISION_EMAIL_FOOTER_NOTE).toContain('offer-term validation')
  })

  it('footer mentions Join Plan CTA eligibility authority', () => {
    expect(DAP_PRACTICE_DECISION_EMAIL_FOOTER_NOTE).toContain('Join Plan CTA eligibility')
  })
})

// ─── Group 4: Forbidden Scanner — Injection Tests ─────────────────────────────

describe('Phase 9T — Forbidden scanner rejects injected terms', () => {
  function injectTerm(base: DapPracticeDecisionEmailCopy, term: string): DapPracticeDecisionEmailCopy {
    return { ...base, subject: `${base.subject} ${term}` }
  }

  it('rejects copy with "mkcrm approved" in subject', () => {
    const base = getDapPracticeDecisionEmailCopy('practice_application_received')
    expect(isDapPracticeDecisionEmailCopySafe(injectTerm(base, 'MKCRM Approved'))).toBe(false)
  })

  it('rejects copy with "mkcrm rejected" in body', () => {
    const base = getDapPracticeDecisionEmailCopy('practice_rejected')
    const bad: DapPracticeDecisionEmailCopy = { ...base, body: [...base.body, 'MKCRM rejected this application'] }
    expect(isDapPracticeDecisionEmailCopySafe(bad)).toBe(false)
  })

  it('rejects copy with "guaranteed listing" in headline', () => {
    const base = getDapPracticeDecisionEmailCopy('practice_under_review')
    const bad: DapPracticeDecisionEmailCopy = { ...base, headline: 'Guaranteed Listing Pending' }
    expect(isDapPracticeDecisionEmailCopySafe(bad)).toBe(false)
  })

  it('rejects copy with "your plan is live" in body', () => {
    const base = getDapPracticeDecisionEmailCopy('practice_approved_internal_only')
    const bad: DapPracticeDecisionEmailCopy = { ...base, body: ['Your plan is live now'] }
    expect(isDapPracticeDecisionEmailCopySafe(bad)).toBe(false)
  })

  it('rejects copy with "join plan is active" in body', () => {
    const base = getDapPracticeDecisionEmailCopy('practice_offer_terms_needed')
    const bad: DapPracticeDecisionEmailCopy = { ...base, body: ['Join Plan is active for your practice'] }
    expect(isDapPracticeDecisionEmailCopySafe(bad)).toBe(false)
  })

  it('rejects copy with "payment processor" in footer', () => {
    const base = getDapPracticeDecisionEmailCopy('practice_rejected')
    const bad: DapPracticeDecisionEmailCopy = { ...base, footerNote: 'Processed by a payment processor.' }
    expect(isDapPracticeDecisionEmailCopySafe(bad)).toBe(false)
  })

  it('rejects copy with "diagnosis" in body', () => {
    const base = getDapPracticeDecisionEmailCopy('practice_under_review')
    const bad: DapPracticeDecisionEmailCopy = { ...base, body: ['diagnosis information included'] }
    expect(isDapPracticeDecisionEmailCopySafe(bad)).toBe(false)
  })

  it('rejects copy with "ssn" in body', () => {
    const base = getDapPracticeDecisionEmailCopy('practice_application_received')
    const bad: DapPracticeDecisionEmailCopy = { ...base, body: ['Please provide your SSN'] }
    expect(isDapPracticeDecisionEmailCopySafe(bad)).toBe(false)
  })

  it('rejects copy with includesPaymentCta: true (cast)', () => {
    const base = getDapPracticeDecisionEmailCopy('practice_application_received')
    const bad = { ...base, includesPaymentCta: true } as unknown as DapPracticeDecisionEmailCopy
    expect(isDapPracticeDecisionEmailCopySafe(bad)).toBe(false)
  })

  it('rejects copy with includesPhi: true (cast)', () => {
    const base = getDapPracticeDecisionEmailCopy('practice_application_received')
    const bad = { ...base, includesPhi: true } as unknown as DapPracticeDecisionEmailCopy
    expect(isDapPracticeDecisionEmailCopySafe(bad)).toBe(false)
  })

  it('rejects copy with derivedFromBillingEvents: true (cast)', () => {
    const base = getDapPracticeDecisionEmailCopy('practice_application_received')
    const bad = { ...base, derivedFromBillingEvents: true } as unknown as DapPracticeDecisionEmailCopy
    expect(isDapPracticeDecisionEmailCopySafe(bad)).toBe(false)
  })

  it('rejects copy with decidedByCbControlCenter: false (cast)', () => {
    const base = getDapPracticeDecisionEmailCopy('practice_application_received')
    const bad = { ...base, decidedByCbControlCenter: false } as unknown as DapPracticeDecisionEmailCopy
    expect(isDapPracticeDecisionEmailCopySafe(bad)).toBe(false)
  })

  it('rejects copy with decidedByMkcrm: true (cast)', () => {
    const base = getDapPracticeDecisionEmailCopy('practice_application_received')
    const bad = { ...base, decidedByMkcrm: true } as unknown as DapPracticeDecisionEmailCopy
    expect(isDapPracticeDecisionEmailCopySafe(bad)).toBe(false)
  })

  it('assertDapPracticeDecisionEmailCopySafe throws on forbidden term', () => {
    const base = getDapPracticeDecisionEmailCopy('practice_rejected')
    const bad: DapPracticeDecisionEmailCopy = { ...base, body: ['MKCRM rejected this practice'] }
    expect(() => assertDapPracticeDecisionEmailCopySafe(bad)).toThrow()
  })

  it('assertDapPracticeDecisionEmailCopySafe returns copy on safe input', () => {
    const copy = getDapPracticeDecisionEmailCopy('practice_rejected')
    const result = assertDapPracticeDecisionEmailCopySafe(copy)
    expect(result).toBe(copy)
  })
})

// ─── Group 5: Safe Real Copy ──────────────────────────────────────────────────

describe('Phase 9T — All real copy passes scanner', () => {
  for (const key of ALL_TEMPLATE_KEYS) {
    it(`isDapPracticeDecisionEmailCopySafe: true for ${key}`, () => {
      const copy = getDapPracticeDecisionEmailCopy(key)
      expect(isDapPracticeDecisionEmailCopySafe(copy)).toBe(true)
    })

    it(`assertDapPracticeDecisionEmailCopySafe returns copy for ${key}`, () => {
      const copy = getDapPracticeDecisionEmailCopy(key)
      expect(() => assertDapPracticeDecisionEmailCopySafe(copy)).not.toThrow()
      expect(assertDapPracticeDecisionEmailCopySafe(copy)).toBe(copy)
    })
  }
})

// ─── Group 6: Preview Helpers ─────────────────────────────────────────────────

describe('Phase 9T — Preview helpers', () => {
  it('getAllDapPracticeDecisionEmailPreviews returns exactly 8 previews', () => {
    expect(getAllDapPracticeDecisionEmailPreviews()).toHaveLength(8)
  })

  it('getDapPracticeDecisionEmailPreview returns preview with matching templateKey', () => {
    for (const key of ALL_TEMPLATE_KEYS) {
      const preview = getDapPracticeDecisionEmailPreview(key)
      expect(preview.templateKey).toBe(key)
      expect(preview.copy.templateKey).toBe(key)
    }
  })

  it('all previews have source.decisionAuthority: "cb_control_center"', () => {
    for (const preview of getAllDapPracticeDecisionEmailPreviews()) {
      expect(preview.source.decisionAuthority).toBe('cb_control_center')
    }
  })

  it('all previews have source.crmAuthority: false', () => {
    for (const preview of getAllDapPracticeDecisionEmailPreviews()) {
      expect(preview.source.crmAuthority).toBe(false)
    }
  })

  it('all previews have source.paymentAuthority: false', () => {
    for (const preview of getAllDapPracticeDecisionEmailPreviews()) {
      expect(preview.source.paymentAuthority).toBe(false)
    }
  })

  it('all previews have source.includesPaymentCta: false', () => {
    for (const preview of getAllDapPracticeDecisionEmailPreviews()) {
      expect(preview.source.includesPaymentCta).toBe(false)
    }
  })

  it('all previews have source.includesPhi: false', () => {
    for (const preview of getAllDapPracticeDecisionEmailPreviews()) {
      expect(preview.source.includesPhi).toBe(false)
    }
  })

  it('preview template keys cover all 8 known keys', () => {
    const previews = getAllDapPracticeDecisionEmailPreviews()
    const keys = previews.map(p => p.templateKey).sort()
    expect(keys).toEqual([...ALL_TEMPLATE_KEYS].sort())
  })
})

// ─── Group 7: Boundary / Authority Language ────────────────────────────────────

describe('Phase 9T — Boundary and authority language', () => {
  it('no template body claims MKCRM determined the decision', () => {
    for (const copy of getAllDapPracticeDecisionEmailCopy()) {
      const allText = [copy.subject, copy.previewText, copy.headline, ...copy.body, copy.footerNote]
        .join(' ').toLowerCase()
      expect(allText).not.toContain('mkcrm approved')
      expect(allText).not.toContain('mkcrm rejected')
      expect(allText).not.toContain('mkcrm decided')
      expect(allText).not.toContain('mkcrm determines')
    }
  })

  it('no template body guarantees listing, enrollment, or pricing', () => {
    for (const copy of getAllDapPracticeDecisionEmailCopy()) {
      const allText = [copy.subject, copy.previewText, copy.headline, ...copy.body]
        .join(' ').toLowerCase()
      expect(allText).not.toContain('guaranteed listing')
      expect(allText).not.toContain('guaranteed enrollment')
      expect(allText).not.toContain('guaranteed pricing')
    }
  })

  it('rejected/declined/paused templates mention CB Control Center as deciding authority', () => {
    for (const key of TERMINAL_TEMPLATE_KEYS) {
      const copy = getDapPracticeDecisionEmailCopy(key)
      const allText = [copy.subject, copy.previewText, copy.headline, ...copy.body, copy.footerNote]
        .join(' ')
      expect(allText).toContain('CB Control Center')
    }
  })

  it('internal_only template contains "internal" language (not public listing)', () => {
    const copy = getDapPracticeDecisionEmailCopy('practice_approved_internal_only')
    const allText = [...copy.body, copy.subject, copy.previewText, copy.headline].join(' ').toLowerCase()
    expect(allText).toContain('internal')
    expect(allText).not.toContain('public listing is active')
    expect(allText).not.toContain('your plan is live')
  })

  it('join_cta_blocked template does not say CTA is ready', () => {
    const copy = getDapPracticeDecisionEmailCopy('practice_join_cta_blocked')
    const allText = [...copy.body, copy.subject, copy.headline].join(' ').toLowerCase()
    expect(allText).not.toContain('join plan is active')
    expect(allText).not.toContain('cta is ready')
    expect(allText).not.toContain('cta is active')
  })

  it('offer_terms_needed template does not claim offer terms are validated', () => {
    const copy = getDapPracticeDecisionEmailCopy('practice_offer_terms_needed')
    const allText = [...copy.body, copy.subject, copy.headline].join(' ').toLowerCase()
    expect(allText).not.toContain('offer terms validated')
    expect(allText).not.toContain('offer terms approved')
  })

  it('no template has a non-null primaryCtaHref with "payment" or "checkout" in it', () => {
    for (const copy of getAllDapPracticeDecisionEmailCopy()) {
      if (copy.primaryCtaHref !== null) {
        expect(copy.primaryCtaHref.toLowerCase()).not.toContain('payment')
        expect(copy.primaryCtaHref.toLowerCase()).not.toContain('checkout')
      }
    }
  })
})

// ─── Group 8: CTA Safety ──────────────────────────────────────────────────────

describe('Phase 9T — CTA safety', () => {
  it('all templates have null primaryCtaLabel', () => {
    for (const copy of getAllDapPracticeDecisionEmailCopy()) {
      expect(copy.primaryCtaLabel).toBeNull()
    }
  })

  it('all templates have null primaryCtaHref', () => {
    for (const copy of getAllDapPracticeDecisionEmailCopy()) {
      expect(copy.primaryCtaHref).toBeNull()
    }
  })

  it('rejected template has null primaryCtaHref', () => {
    const copy = getDapPracticeDecisionEmailCopy('practice_rejected')
    expect(copy.primaryCtaHref).toBeNull()
  })

  it('declined template has null primaryCtaHref', () => {
    const copy = getDapPracticeDecisionEmailCopy('practice_declined')
    expect(copy.primaryCtaHref).toBeNull()
  })

  it('participation_paused template has null primaryCtaHref', () => {
    const copy = getDapPracticeDecisionEmailCopy('practice_participation_paused')
    expect(copy.primaryCtaHref).toBeNull()
  })

  it('no template includes a payment CTA (literal flag)', () => {
    for (const copy of getAllDapPracticeDecisionEmailCopy()) {
      expect(copy.includesPaymentCta).toBe(false)
    }
  })
})

// ─── Prior Phase Contracts ────────────────────────────────────────────────────

describe('Phase 9T — Prior phase contracts still hold', () => {
  it('page count remains 22', () => {
    expect(findPages(join(ROOT, 'app')).length).toBe(51)
  })

  it('Phase 9S member email copy still exports 8 standings', () => {
    expect(getAllDapMemberStatusEmailPreviews()).toHaveLength(8)
  })

  it('Phase 9S footer note is still the billing events footer (not practice decision footer)', () => {
    const copy = getDapMemberStatusEmailCopy('active')
    expect(copy.footerNote).not.toBe(DAP_PRACTICE_DECISION_EMAIL_FOOTER_NOTE)
    expect(copy.footerNote).toContain('billing events')
  })

  it('Phase 9Q deriveDapMemberStatusReadModel is still importable', () => {
    expect(typeof deriveDapMemberStatusReadModel).toBe('function')
  })

  it('Phase 9T copy has derivedFromBillingEvents: false (opposite of 9S)', () => {
    for (const copy of getAllDapPracticeDecisionEmailCopy()) {
      expect(copy.derivedFromBillingEvents).toBe(false)
    }
  })
})
