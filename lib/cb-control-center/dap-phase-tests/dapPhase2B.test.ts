// Phase 2B — Admin Rejection Email Preview Layer
// CB Control Center makes enrollment decisions. MKCRM does not. Payment systems do not.
// Preview-only. No email sending. No PHI. No payment CTAs.

import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { join, resolve } from 'path'

const ROOT      = join(__dirname, '..', '..', '..')
const PAGE_PATH = resolve(ROOT, 'app/preview/dap/admin-rejection-emails/page.tsx')

import type {
  DapAdminRejectionEmailTemplateKey,
  DapAdminRejectionEmailAudience,
} from '../dapAdminRejectionEmailTypes'

import {
  getDapAdminRejectionEmailCopy,
  getAllDapAdminRejectionEmailCopy,
  isDapAdminRejectionEmailCopySafe,
  assertDapAdminRejectionEmailCopySafe,
  DAP_REJECTION_FORBIDDEN_TERMS,
  DAP_REJECTION_FOOTER_NOTE,
} from '../dapAdminRejectionEmailCopy'

import {
  getDapAdminRejectionEmailPreview,
  getAllDapAdminRejectionEmailPreviews,
} from '../dapAdminRejectionEmailPreview'

const ALL_TEMPLATE_KEYS: DapAdminRejectionEmailTemplateKey[] = [
  'practice_enrollment_rejected',
  'practice_participation_rejected',
  'member_enrollment_rejected',
  'membership_activation_rejected',
]

function collectCopyText(key: DapAdminRejectionEmailTemplateKey): string {
  const c = getDapAdminRejectionEmailCopy(key)
  return [c.subject, c.headline, c.previewText, ...c.body, c.footerNote].join(' ').toLowerCase()
}

// ─── Phase 2B — Type exports ──────────────────────────────────────────────────

describe('Phase 2B — type and export surface', () => {
  it('DapAdminRejectionEmailTemplateKey has exactly 4 values', () => {
    expect(ALL_TEMPLATE_KEYS).toHaveLength(4)
  })

  it('getDapAdminRejectionEmailCopy is exported', () => {
    expect(typeof getDapAdminRejectionEmailCopy).toBe('function')
  })

  it('getAllDapAdminRejectionEmailCopy is exported', () => {
    expect(typeof getAllDapAdminRejectionEmailCopy).toBe('function')
  })

  it('isDapAdminRejectionEmailCopySafe is exported', () => {
    expect(typeof isDapAdminRejectionEmailCopySafe).toBe('function')
  })

  it('assertDapAdminRejectionEmailCopySafe is exported', () => {
    expect(typeof assertDapAdminRejectionEmailCopySafe).toBe('function')
  })

  it('DAP_REJECTION_FORBIDDEN_TERMS is a non-empty array', () => {
    expect(Array.isArray(DAP_REJECTION_FORBIDDEN_TERMS)).toBe(true)
    expect(DAP_REJECTION_FORBIDDEN_TERMS.length).toBeGreaterThan(0)
  })

  it('DAP_REJECTION_FOOTER_NOTE is a non-empty string', () => {
    expect(typeof DAP_REJECTION_FOOTER_NOTE).toBe('string')
    expect(DAP_REJECTION_FOOTER_NOTE.length).toBeGreaterThan(0)
  })

  it('copy types file does not import from Supabase', () => {
    const src = readFileSync(join(__dirname, '..', 'dapAdminRejectionEmailTypes.ts'), 'utf8')
    expect(src).not.toMatch(/from ['"].*supabase/i)
  })

  it('copy file does not import from Supabase', () => {
    const src = readFileSync(join(__dirname, '..', 'dapAdminRejectionEmailCopy.ts'), 'utf8')
    expect(src).not.toMatch(/from ['"].*supabase/i)
  })

  it('preview builder does not import from Supabase', () => {
    const src = readFileSync(join(__dirname, '..', 'dapAdminRejectionEmailPreview.ts'), 'utf8')
    expect(src).not.toMatch(/from ['"].*supabase/i)
  })

  it('copy file does not import from MKCRM modules', () => {
    const src = readFileSync(join(__dirname, '..', 'dapAdminRejectionEmailCopy.ts'), 'utf8')
    expect(src).not.toMatch(/from ['"].*mkcrm/i)
    expect(src).not.toMatch(/import.*mkcrm/i)
  })
})

// ─── Phase 2B — Copy completeness ────────────────────────────────────────────

describe('Phase 2B — all templates have required copy fields', () => {
  for (const key of ALL_TEMPLATE_KEYS) {
    it(`${key} has all required fields`, () => {
      const copy = getDapAdminRejectionEmailCopy(key)
      expect(copy.templateKey).toBe(key)
      expect(typeof copy.subject).toBe('string')
      expect(copy.subject.length).toBeGreaterThan(0)
      expect(typeof copy.headline).toBe('string')
      expect(copy.headline.length).toBeGreaterThan(0)
      expect(typeof copy.previewText).toBe('string')
      expect(Array.isArray(copy.body)).toBe(true)
      expect(copy.body.length).toBeGreaterThan(0)
      expect(typeof copy.footerNote).toBe('string')
      expect(copy.footerNote.length).toBeGreaterThan(0)
    })

    it(`${key} audience is a valid value`, () => {
      const copy = getDapAdminRejectionEmailCopy(key)
      const validAudiences: DapAdminRejectionEmailAudience[] = ['practice_admin', 'member']
      expect(validAudiences).toContain(copy.audience)
    })
  }
})

// ─── Phase 2B — Safety flags ─────────────────────────────────────────────────

describe('Phase 2B — safety flags are locked on all templates', () => {
  for (const key of ALL_TEMPLATE_KEYS) {
    it(`${key} has includesPaymentCta: false`, () => {
      expect(getDapAdminRejectionEmailCopy(key).includesPaymentCta).toBe(false)
    })

    it(`${key} has includesPhi: false`, () => {
      expect(getDapAdminRejectionEmailCopy(key).includesPhi).toBe(false)
    })

    it(`${key} has includesCta: false`, () => {
      expect(getDapAdminRejectionEmailCopy(key).includesCta).toBe(false)
    })
  }

  it('footer note references CB Control Center authority boundary', () => {
    expect(DAP_REJECTION_FOOTER_NOTE.toLowerCase()).toContain('cb control center')
    expect(DAP_REJECTION_FOOTER_NOTE.toLowerCase()).toContain('mkcrm')
  })
})

// ─── Phase 2B — Forbidden term scanner ───────────────────────────────────────

describe('Phase 2B — copy scanner catches unsafe language', () => {
  it('all canonical templates pass isDapAdminRejectionEmailCopySafe', () => {
    for (const key of ALL_TEMPLATE_KEYS) {
      expect(
        isDapAdminRejectionEmailCopySafe(getDapAdminRejectionEmailCopy(key)),
        `${key} failed safety check`
      ).toBe(true)
    }
  })

  it('assertDapAdminRejectionEmailCopySafe does not throw on canonical templates', () => {
    for (const key of ALL_TEMPLATE_KEYS) {
      expect(() =>
        assertDapAdminRejectionEmailCopySafe(getDapAdminRejectionEmailCopy(key))
      ).not.toThrow()
    }
  })

  it('assertDapAdminRejectionEmailCopySafe throws when copy contains "denied"', () => {
    const unsafe = {
      ...getDapAdminRejectionEmailCopy('member_enrollment_rejected'),
      body: ['Your request was denied.'],
    }
    expect(() => assertDapAdminRejectionEmailCopySafe(unsafe)).toThrow()
  })

  it('assertDapAdminRejectionEmailCopySafe throws when copy contains "insurance"', () => {
    const unsafe = {
      ...getDapAdminRejectionEmailCopy('member_enrollment_rejected'),
      subject: 'Your insurance claim was rejected.',
    }
    expect(() => assertDapAdminRejectionEmailCopySafe(unsafe)).toThrow()
  })

  it('assertDapAdminRejectionEmailCopySafe throws when copy contains "diagnosis"', () => {
    const unsafe = {
      ...getDapAdminRejectionEmailCopy('member_enrollment_rejected'),
      body: ['Your diagnosis was reviewed.'],
    }
    expect(() => assertDapAdminRejectionEmailCopySafe(unsafe)).toThrow()
  })

  it('assertDapAdminRejectionEmailCopySafe throws when includesPaymentCta is not false', () => {
    const unsafe = {
      ...getDapAdminRejectionEmailCopy('member_enrollment_rejected'),
      includesPaymentCta: true as unknown as false,
    }
    expect(() => assertDapAdminRejectionEmailCopySafe(unsafe)).toThrow()
  })

  it('no canonical copy contains forbidden terms', () => {
    for (const key of ALL_TEMPLATE_KEYS) {
      const text = collectCopyText(key)
      for (const term of DAP_REJECTION_FORBIDDEN_TERMS) {
        expect(
          text,
          `Template "${key}" contains forbidden term: "${term}"`
        ).not.toContain(term.toLowerCase())
      }
    }
  })
})

// ─── Phase 2B — Preview builder ───────────────────────────────────────────────

describe('Phase 2B — preview builder authority boundary', () => {
  for (const key of ALL_TEMPLATE_KEYS) {
    it(`${key} preview has decisionAuthority: cb_control_center`, () => {
      expect(getDapAdminRejectionEmailPreview(key).source.decisionAuthority).toBe('cb_control_center')
    })

    it(`${key} preview has crmAuthority: false`, () => {
      expect(getDapAdminRejectionEmailPreview(key).source.crmAuthority).toBe(false)
    })

    it(`${key} preview has paymentAuthority: false`, () => {
      expect(getDapAdminRejectionEmailPreview(key).source.paymentAuthority).toBe(false)
    })

    it(`${key} preview has previewOnly: true`, () => {
      expect(getDapAdminRejectionEmailPreview(key).source.previewOnly).toBe(true)
    })
  }
})

describe('Phase 2B — preview delivery flags locked to dry-run', () => {
  for (const key of ALL_TEMPLATE_KEYS) {
    it(`${key} delivery.queued is false`, () => {
      expect(getDapAdminRejectionEmailPreview(key).delivery.queued).toBe(false)
    })

    it(`${key} delivery.scheduled is false`, () => {
      expect(getDapAdminRejectionEmailPreview(key).delivery.scheduled).toBe(false)
    })

    it(`${key} delivery.sent is false`, () => {
      expect(getDapAdminRejectionEmailPreview(key).delivery.sent).toBe(false)
    })

    it(`${key} delivery.dryRunOnly is true`, () => {
      expect(getDapAdminRejectionEmailPreview(key).delivery.dryRunOnly).toBe(true)
    })
  }

  it('getAllDapAdminRejectionEmailPreviews returns one preview per template key', () => {
    const all = getAllDapAdminRejectionEmailPreviews()
    expect(all).toHaveLength(ALL_TEMPLATE_KEYS.length)
    for (const key of ALL_TEMPLATE_KEYS) {
      expect(all.some(p => p.templateKey === key)).toBe(true)
    }
  })
})

// ─── Phase 2B — Preview page ──────────────────────────────────────────────────

describe('Phase 2B — preview page', () => {
  it('preview page exists at app/preview/dap/admin-rejection-emails/page.tsx', () => {
    expect(existsSync(PAGE_PATH)).toBe(true)
  })

  it('preview page has data-preview-only="true" marker', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('data-preview-only="true"')
  })

  it('preview page has data-send-enabled="false" marker', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('data-send-enabled="false"')
  })

  it('preview page has data-implies-phi="false" marker', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('data-implies-phi="false"')
  })

  it('preview page has data-implies-payment="false" marker', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('data-implies-payment="false"')
  })

  it('preview page does not contain a send button or form', () => {
    const src = readFileSync(PAGE_PATH, 'utf8').toLowerCase()
    expect(src).not.toContain('<form')
    expect(src).not.toContain('type="submit"')
    expect(src).not.toContain('send email')
  })

  it('preview page does not import Supabase', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).not.toMatch(/from ['"].*supabase/i)
  })
})
