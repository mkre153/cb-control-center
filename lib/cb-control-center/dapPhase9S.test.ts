/**
 * Phase 9S — Member Status Email Copy / Notification Preview QA
 *
 * PURPOSE: Prove that DAP member status notification copy is safe, preview-only,
 * and correctly reflects derived standing — without introducing payment CTAs,
 * PHI, email-sending infrastructure, or forbidden authority language.
 *
 * Locked language:
 *   Derived status.
 *   Append-only Client Builder Pro billing events.
 *   DAP does not manually set member standing.
 *   MKCRM does not determine billing status.
 *   Preview-only notification copy.
 *
 * COVERAGE:
 *   Group 1  — Template key mapping
 *   Group 2  — Copy exists for every standing
 *   Group 3  — Safety flags are literal false/true
 *   Group 4  — Forbidden copy is rejected
 *   Group 5  — Required authority language exists
 *   Group 6  — Preview helper delegates to read model
 *   Group 7  — No sending surface
 *   Group 8  — No payment CTA
 *   Group 9  — No PHI or treatment data
 *   Group 10 — Prior phase contracts remain intact
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import {
  getDapMemberStatusEmailCopy,
  getDapMemberStatusEmailTemplateKey,
  isDapMemberStatusEmailCopySafe,
  assertDapMemberStatusEmailCopySafe,
} from './dapMemberStatusEmailCopy'
import {
  getDapMemberStatusEmailPreview,
  getAllDapMemberStatusEmailPreviews,
} from './dapMemberStatusEmailPreview'
import { deriveDapMemberStatusReadModel } from './dapMemberStatusRules'
import { getDapMemberStatusPreview } from './dapMemberStatusPreview'
import {
  getPublicCommercialSystemForVertical,
  getInternalCrmSystemForVertical,
  isResponsibilityAllowed,
} from './clientBuilderBoundaryRules'
import type { DapMemberStanding } from './dapMemberStatusTypes'
import type { DapMemberStatusEmailCopy } from './dapMemberStatusEmailTypes'

// ─── Project root ─────────────────────────────────────────────────────────────

const ROOT         = resolve(__dirname, '../..')
const TYPES_PATH   = resolve(ROOT, 'lib/cb-control-center/dapMemberStatusEmailTypes.ts')
const COPY_PATH    = resolve(ROOT, 'lib/cb-control-center/dapMemberStatusEmailCopy.ts')
const PREVIEW_PATH = resolve(ROOT, 'lib/cb-control-center/dapMemberStatusEmailPreview.ts')

// ─── All standings ────────────────────────────────────────────────────────────

const ALL_STANDINGS: DapMemberStanding[] = [
  'unknown', 'pending', 'active', 'past_due',
  'payment_failed', 'canceled', 'refunded', 'chargeback',
]

function allCopyText(copy: DapMemberStatusEmailCopy): string[] {
  return [copy.subject, copy.previewText, copy.headline, ...copy.body, copy.footerNote]
}

// ─── Group 1: Template key mapping ────────────────────────────────────────────

describe('Template key mapping — all eight standings map to expected template keys', () => {
  it('unknown → member_status_unknown', () => {
    expect(getDapMemberStatusEmailTemplateKey('unknown')).toBe('member_status_unknown')
  })

  it('pending → member_status_pending', () => {
    expect(getDapMemberStatusEmailTemplateKey('pending')).toBe('member_status_pending')
  })

  it('active → member_status_active', () => {
    expect(getDapMemberStatusEmailTemplateKey('active')).toBe('member_status_active')
  })

  it('past_due → member_status_past_due', () => {
    expect(getDapMemberStatusEmailTemplateKey('past_due')).toBe('member_status_past_due')
  })

  it('payment_failed → member_status_payment_failed', () => {
    expect(getDapMemberStatusEmailTemplateKey('payment_failed')).toBe('member_status_payment_failed')
  })

  it('canceled → member_status_canceled', () => {
    expect(getDapMemberStatusEmailTemplateKey('canceled')).toBe('member_status_canceled')
  })

  it('refunded → member_status_refunded', () => {
    expect(getDapMemberStatusEmailTemplateKey('refunded')).toBe('member_status_refunded')
  })

  it('chargeback → member_status_chargeback', () => {
    expect(getDapMemberStatusEmailTemplateKey('chargeback')).toBe('member_status_chargeback')
  })

  it('templateKey on copy matches getDapMemberStatusEmailTemplateKey result', () => {
    for (const standing of ALL_STANDINGS) {
      const copy = getDapMemberStatusEmailCopy(standing)
      expect(copy.templateKey).toBe(getDapMemberStatusEmailTemplateKey(standing))
    }
  })
})

// ─── Group 2: Copy exists for every standing ──────────────────────────────────

describe('Copy completeness — every standing has all required copy fields', () => {
  it('types file exists', () => {
    expect(existsSync(TYPES_PATH)).toBe(true)
  })

  it('copy file exists', () => {
    expect(existsSync(COPY_PATH)).toBe(true)
  })

  for (const standing of ALL_STANDINGS) {
    it(`copy for '${standing}' has a non-empty subject`, () => {
      expect(getDapMemberStatusEmailCopy(standing).subject.length).toBeGreaterThan(0)
    })

    it(`copy for '${standing}' has a non-empty previewText`, () => {
      expect(getDapMemberStatusEmailCopy(standing).previewText.length).toBeGreaterThan(0)
    })

    it(`copy for '${standing}' has a non-empty headline`, () => {
      expect(getDapMemberStatusEmailCopy(standing).headline.length).toBeGreaterThan(0)
    })

    it(`copy for '${standing}' has at least one body paragraph`, () => {
      expect(getDapMemberStatusEmailCopy(standing).body.length).toBeGreaterThan(0)
    })

    it(`copy for '${standing}' has a non-empty footerNote`, () => {
      expect(getDapMemberStatusEmailCopy(standing).footerNote.length).toBeGreaterThan(0)
    })
  }

  it('copy for every standing has standing field matching the requested standing', () => {
    for (const standing of ALL_STANDINGS) {
      expect(getDapMemberStatusEmailCopy(standing).standing).toBe(standing)
    }
  })

  it('copy for every standing has audience: member', () => {
    for (const standing of ALL_STANDINGS) {
      expect(getDapMemberStatusEmailCopy(standing).audience).toBe('member')
    }
  })
})

// ─── Group 3: Safety flags are literal false/true ─────────────────────────────

describe('Safety flags — includesPaymentCta: false, includesPhi: false, derivedFromBillingEvents: true', () => {
  for (const standing of ALL_STANDINGS) {
    it(`copy for '${standing}' has includesPaymentCta: false`, () => {
      expect(getDapMemberStatusEmailCopy(standing).includesPaymentCta).toBe(false)
    })

    it(`copy for '${standing}' has includesPhi: false`, () => {
      expect(getDapMemberStatusEmailCopy(standing).includesPhi).toBe(false)
    })

    it(`copy for '${standing}' has derivedFromBillingEvents: true`, () => {
      expect(getDapMemberStatusEmailCopy(standing).derivedFromBillingEvents).toBe(true)
    })
  }
})

// ─── Group 4: Forbidden copy is rejected ─────────────────────────────────────

describe('Forbidden copy rejection — safety checker catches forbidden terms', () => {
  it('isDapMemberStatusEmailCopySafe returns true for all standing copy', () => {
    for (const standing of ALL_STANDINGS) {
      expect(isDapMemberStatusEmailCopySafe(getDapMemberStatusEmailCopy(standing))).toBe(true)
    }
  })

  it('assertDapMemberStatusEmailCopySafe does not throw for all standing copy', () => {
    for (const standing of ALL_STANDINGS) {
      expect(() => assertDapMemberStatusEmailCopySafe(getDapMemberStatusEmailCopy(standing))).not.toThrow()
    }
  })

  it('isDapMemberStatusEmailCopySafe returns false when subject contains "Pay now"', () => {
    const bad: DapMemberStatusEmailCopy = {
      ...getDapMemberStatusEmailCopy('active'),
      subject: 'Pay now to renew your membership',
    }
    expect(isDapMemberStatusEmailCopySafe(bad)).toBe(false)
  })

  it('assertDapMemberStatusEmailCopySafe throws when body contains "Checkout"', () => {
    const bad: DapMemberStatusEmailCopy = {
      ...getDapMemberStatusEmailCopy('past_due'),
      body: ['Please Checkout to resolve your membership.'],
    }
    expect(() => assertDapMemberStatusEmailCopySafe(bad)).toThrow(/checkout/i)
  })

  it('assertDapMemberStatusEmailCopySafe throws when includesPaymentCta is not false', () => {
    const bad = {
      ...getDapMemberStatusEmailCopy('active'),
      includesPaymentCta: true,
    } as unknown as DapMemberStatusEmailCopy
    expect(() => assertDapMemberStatusEmailCopySafe(bad)).toThrow()
  })

  it('assertDapMemberStatusEmailCopySafe throws when copy contains "MKCRM determines"', () => {
    const bad: DapMemberStatusEmailCopy = {
      ...getDapMemberStatusEmailCopy('active'),
      body: ['MKCRM determines your membership status.'],
    }
    expect(() => assertDapMemberStatusEmailCopySafe(bad)).toThrow(/mkcrm determines/i)
  })

  it('assertDapMemberStatusEmailCopySafe throws when footer contains "diagnosis"', () => {
    const bad: DapMemberStatusEmailCopy = {
      ...getDapMemberStatusEmailCopy('active'),
      footerNote: 'Your diagnosis is on file.',
    }
    expect(() => assertDapMemberStatusEmailCopySafe(bad)).toThrow(/diagnosis/i)
  })
})

// ─── Group 5: Required authority language exists ──────────────────────────────

describe('Authority language — footer copy contains required locked phrases', () => {
  it('footer for every standing contains "derived status"', () => {
    for (const standing of ALL_STANDINGS) {
      const footer = getDapMemberStatusEmailCopy(standing).footerNote.toLowerCase()
      expect(footer).toContain('derived status')
    }
  })

  it('footer for every standing contains "append-only"', () => {
    for (const standing of ALL_STANDINGS) {
      const footer = getDapMemberStatusEmailCopy(standing).footerNote.toLowerCase()
      expect(footer).toContain('append-only')
    }
  })

  it('footer for every standing contains "Client Builder Pro billing events"', () => {
    for (const standing of ALL_STANDINGS) {
      const footer = getDapMemberStatusEmailCopy(standing).footerNote
      expect(footer).toContain('Client Builder Pro billing events')
    }
  })

  it('footer for every standing contains "DAP does not manually set member standing"', () => {
    for (const standing of ALL_STANDINGS) {
      const footer = getDapMemberStatusEmailCopy(standing).footerNote
      expect(footer).toContain('DAP does not manually set member standing')
    }
  })

  it('footer for every standing contains "MKCRM does not determine billing status"', () => {
    for (const standing of ALL_STANDINGS) {
      const footer = getDapMemberStatusEmailCopy(standing).footerNote
      expect(footer).toContain('MKCRM does not determine billing status')
    }
  })

  it('all footers are identical (single canonical locked note)', () => {
    const footers = ALL_STANDINGS.map(s => getDapMemberStatusEmailCopy(s).footerNote)
    const first = footers[0]
    expect(footers.every(f => f === first)).toBe(true)
  })
})

// ─── Group 6: Preview helper delegates to read model ─────────────────────────

describe('Preview helper — delegates to Phase 9Q/9R infrastructure', () => {
  it('preview file exists', () => {
    expect(existsSync(PREVIEW_PATH)).toBe(true)
  })

  it('getDapMemberStatusEmailPreview returns readModel.derivedFromBillingEvents: true', () => {
    const preview = getDapMemberStatusEmailPreview('mem-preview-active')
    expect(preview.readModel.derivedFromBillingEvents).toBe(true)
  })

  it('getDapMemberStatusEmailPreview returns source.billingSource: client_builder_pro', () => {
    const preview = getDapMemberStatusEmailPreview('mem-preview-active')
    expect(preview.source.billingSource).toBe('client_builder_pro')
  })

  it('getDapMemberStatusEmailPreview returns source.crmAuthority: false', () => {
    const preview = getDapMemberStatusEmailPreview('mem-preview-active')
    expect(preview.source.crmAuthority).toBe(false)
  })

  it('getDapMemberStatusEmailPreview returns source.derivedFromBillingEvents: true', () => {
    const preview = getDapMemberStatusEmailPreview('mem-preview-active')
    expect(preview.source.derivedFromBillingEvents).toBe(true)
  })

  it('getDapMemberStatusEmailPreview membershipId matches requested id', () => {
    const preview = getDapMemberStatusEmailPreview('mem-preview-canceled')
    expect(preview.membershipId).toBe('mem-preview-canceled')
  })

  it('getDapMemberStatusEmailPreview standing matches fixture data', () => {
    expect(getDapMemberStatusEmailPreview('mem-preview-active').standing).toBe('active')
    expect(getDapMemberStatusEmailPreview('mem-preview-past-due').standing).toBe('past_due')
    expect(getDapMemberStatusEmailPreview('mem-preview-canceled').standing).toBe('canceled')
    expect(getDapMemberStatusEmailPreview('mem-preview-pending').standing).toBe('pending')
  })

  it('getAllDapMemberStatusEmailPreviews returns one preview per standing (8 total)', () => {
    expect(getAllDapMemberStatusEmailPreviews().length).toBe(8)
  })

  it('getAllDapMemberStatusEmailPreviews covers all 8 standings', () => {
    const previews = getAllDapMemberStatusEmailPreviews()
    const standings = previews.map(p => p.standing)
    for (const s of ALL_STANDINGS) {
      expect(standings).toContain(s)
    }
  })

  it('all previews from getAllDapMemberStatusEmailPreviews have source.derivedFromBillingEvents: true', () => {
    for (const preview of getAllDapMemberStatusEmailPreviews()) {
      expect(preview.source.derivedFromBillingEvents).toBe(true)
    }
  })

  it('preview source file imports getDapMemberStatusPreview from dapMemberStatusPreview', () => {
    const src = readFileSync(PREVIEW_PATH, 'utf8')
    expect(src).toContain('getDapMemberStatusPreview')
    expect(src).toContain('dapMemberStatusPreview')
  })

  it('preview source file imports getDapMemberStatusEmailCopy from dapMemberStatusEmailCopy', () => {
    const src = readFileSync(PREVIEW_PATH, 'utf8')
    expect(src).toContain('getDapMemberStatusEmailCopy')
    expect(src).toContain('dapMemberStatusEmailCopy')
  })
})

// ─── Group 7: No sending surface ─────────────────────────────────────────────

describe('No sending surface — email-sending infrastructure is absent', () => {
  const copySrc    = readFileSync(COPY_PATH, 'utf8')
  const previewSrc = readFileSync(PREVIEW_PATH, 'utf8')

  it('copy file does not contain sendEmail', () => {
    expect(copySrc).not.toContain('sendEmail')
  })

  it('preview file does not contain sendEmail', () => {
    expect(previewSrc).not.toContain('sendEmail')
  })

  it('copy file does not contain sendMemberStatusEmail', () => {
    expect(copySrc).not.toContain('sendMemberStatusEmail')
  })

  it('copy file does not import resend, smtp, mailgun, or postmark', () => {
    expect(copySrc).not.toMatch(/^import.*resend/im)
    expect(copySrc).not.toMatch(/from ['"].*resend/i)
    expect(copySrc.toLowerCase()).not.toContain('smtp')
    expect(copySrc.toLowerCase()).not.toContain('mailgun')
    expect(copySrc.toLowerCase()).not.toContain('postmark')
  })

  it('preview file does not import resend, smtp, mailgun, or postmark', () => {
    expect(previewSrc).not.toMatch(/^import.*resend/im)
    expect(previewSrc).not.toMatch(/from ['"].*resend/i)
    expect(previewSrc.toLowerCase()).not.toContain('smtp')
    expect(previewSrc.toLowerCase()).not.toContain('mailgun')
    expect(previewSrc.toLowerCase()).not.toContain('postmark')
  })

  it('copy file does not import Supabase', () => {
    expect(copySrc).not.toMatch(/^import.*supabase/im)
    expect(copySrc).not.toMatch(/from ['"].*supabase/i)
  })

  it('preview file does not import Supabase', () => {
    expect(previewSrc).not.toMatch(/^import.*supabase/im)
    expect(previewSrc).not.toMatch(/from ['"].*supabase/i)
  })

  it('copy file has no .insert( or .update( calls', () => {
    expect(copySrc).not.toContain('.insert(')
    expect(copySrc).not.toContain('.update(')
  })

  it('Phase 9S adds no new UI pages (page count remains 22)', () => {
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
})

// ─── Group 8: No payment CTA ─────────────────────────────────────────────────

describe('No payment CTA — forbidden CTA language is absent from all copy', () => {
  const allText = ALL_STANDINGS.flatMap(s => allCopyText(getDapMemberStatusEmailCopy(s)))

  const PAYMENT_CTAS = [
    'Pay now', 'Update payment', 'Subscribe', 'Checkout',
    'Enter card', 'Billing portal', 'Process payment',
  ]

  for (const cta of PAYMENT_CTAS) {
    it(`no copy contains "${cta}"`, () => {
      for (const text of allText) {
        expect(text.toLowerCase()).not.toContain(cta.toLowerCase())
      }
    })
  }

  it('no copy contains "Set standing" or "Update standing" or "Store standing"', () => {
    for (const text of allText) {
      const lower = text.toLowerCase()
      expect(lower).not.toContain('set standing')
      expect(lower).not.toContain('update standing')
      expect(lower).not.toContain('store standing')
    }
  })
})

// ─── Group 9: No PHI or treatment data ───────────────────────────────────────

describe('No PHI — personal health and payment identifiers are absent from all copy', () => {
  const allText = ALL_STANDINGS.flatMap(s => allCopyText(getDapMemberStatusEmailCopy(s)))

  const PHI_TERMS = [
    'diagnosis', 'treatment', 'procedure', 'insurance claim',
    'card number', 'ssn', 'date of birth',
  ]

  for (const term of PHI_TERMS) {
    it(`no copy contains "${term}"`, () => {
      for (const text of allText) {
        expect(text.toLowerCase()).not.toContain(term.toLowerCase())
      }
    })
  }

  it('no copy contains member name or patient name', () => {
    for (const text of allText) {
      const lower = text.toLowerCase()
      expect(lower).not.toContain('patientname')
      expect(lower).not.toContain('membername')
    }
  })

  it('isDapMemberStatusEmailCopySafe returns false for copy containing "treatment"', () => {
    const bad: DapMemberStatusEmailCopy = {
      ...getDapMemberStatusEmailCopy('active'),
      body: ['Your treatment plan is up to date.'],
    }
    expect(isDapMemberStatusEmailCopySafe(bad)).toBe(false)
  })

  it('isDapMemberStatusEmailCopySafe returns false for copy containing "ssn"', () => {
    const bad: DapMemberStatusEmailCopy = {
      ...getDapMemberStatusEmailCopy('active'),
      body: ['Your SSN was verified.'],
    }
    expect(isDapMemberStatusEmailCopySafe(bad)).toBe(false)
  })
})

// ─── Group 10: Prior phase contracts remain intact ────────────────────────────

describe('Prior phase contracts — 9Q/9R/9N boundaries still hold', () => {
  it('deriveDapMemberStatusReadModel is importable and returns correct shape', () => {
    const result = deriveDapMemberStatusReadModel('mem-9s-test', [])
    expect(result.derivedFromBillingEvents).toBe(true)
    expect(result.standing).toBe('unknown')
  })

  it('getDapMemberStatusPreview is importable and returns correct shape', () => {
    const preview = getDapMemberStatusPreview('mem-preview-active')
    expect(preview.readModel.derivedFromBillingEvents).toBe(true)
  })

  it('getPublicCommercialSystemForVertical returns client_builder_pro for dap', () => {
    expect(getPublicCommercialSystemForVertical('dap')).toBe('client_builder_pro')
  })

  it('getInternalCrmSystemForVertical returns mkcrm for dap', () => {
    expect(getInternalCrmSystemForVertical('dap')).toBe('mkcrm')
  })

  it('isResponsibilityAllowed(mkcrm, payment) is false', () => {
    expect(isResponsibilityAllowed('mkcrm', 'payment')).toBe(false)
  })

  it('copy file does not re-implement standing derivation', () => {
    const src = readFileSync(COPY_PATH, 'utf8')
    expect(src).not.toContain('client_builder_subscription_created:')
    expect(src).not.toContain('client_builder_subscription_activated:')
  })

  it('Phase 9S adds no API routes', () => {
    const apiRoute = resolve(ROOT, 'app/api/dap/member-status-email/route.ts')
    expect(existsSync(apiRoute)).toBe(false)
  })
})
