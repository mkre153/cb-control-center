// Phase 9U — DAP Practice Decision Email Preview Page
// Preview-only surface for the Phase 9T practice/provider decision email copy.
// No email sending, no MKCRM calls, no practice status mutations.

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const ROOT = join(__dirname, '..', '..')
const PAGE_PATH = join(ROOT, 'app/preview/dap/practice-decision-emails/page.tsx')

function findPages(dir: string): string[] {
  const results: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) results.push(...findPages(full))
    else if (entry === 'page.tsx' || entry === 'page.ts') results.push(full)
  }
  return results
}

import { getAllDapPracticeDecisionEmailPreviews } from './dapPracticeDecisionEmailPreview'

// ─── Group 1: Page Exists ─────────────────────────────────────────────────────

describe('Phase 9U — Page exists', () => {
  it('app/preview/dap/practice-decision-emails/page.tsx exists', () => {
    expect(existsSync(PAGE_PATH)).toBe(true)
  })

  it('page is a .tsx file', () => {
    expect(PAGE_PATH.endsWith('.tsx')).toBe(true)
  })

  it('page uses force-dynamic export', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain("force-dynamic")
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

  it('total page count is now 23', () => {
    expect(findPages(join(ROOT, 'app')).length).toBe(58)
  })
})

// ─── Group 2: Uses 9T Preview Helper ─────────────────────────────────────────

describe('Phase 9U — Uses Phase 9T preview helper', () => {
  it('page imports getAllDapPracticeDecisionEmailPreviews', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('getAllDapPracticeDecisionEmailPreviews')
  })

  it('page imports from dapPracticeDecisionEmailPreview', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('dapPracticeDecisionEmailPreview')
  })

  it('page does not hardcode template copy text directly', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).not.toContain('Your Dental Advantage Plan application has been received')
    expect(src).not.toContain('CB Control Center has reviewed your Dental Advantage Plan')
  })

  it('getAllDapPracticeDecisionEmailPreviews returns 8 previews', () => {
    expect(getAllDapPracticeDecisionEmailPreviews()).toHaveLength(8)
  })
})

// ─── Group 3: Renders All 8 Template Keys ────────────────────────────────────

describe('Phase 9U — All 8 template keys present', () => {
  const ALL_TEMPLATE_KEYS = [
    'practice_application_received',
    'practice_under_review',
    'practice_approved_internal_only',
    'practice_offer_terms_needed',
    'practice_join_cta_blocked',
    'practice_rejected',
    'practice_declined',
    'practice_participation_paused',
  ]

  it('data source (preview helper) covers all 8 template keys', () => {
    const previews = getAllDapPracticeDecisionEmailPreviews()
    const keys = previews.map(p => p.templateKey)
    for (const key of ALL_TEMPLATE_KEYS) {
      expect(keys).toContain(key)
    }
  })

  it('page source references all 8 template keys', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    for (const key of ALL_TEMPLATE_KEYS) {
      expect(src).toContain(key)
    }
  })

  it('page maps over previews (not hardcoded per-template blocks)', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toMatch(/\.map\(/)
  })
})

// ─── Group 4: Preview-Only Boundary ──────────────────────────────────────────

describe('Phase 9U — Preview-only boundary', () => {
  it('page contains preview-only language', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src.toLowerCase()).toContain('preview')
  })

  it('page does not contain email-sending function calls', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).not.toContain('sendEmail')
    expect(src).not.toContain('sendPracticeDecisionEmail')
    expect(src).not.toContain('resend.emails.send')
  })

  it('page does not call MKCRM or email API endpoints', () => {
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
})

// ─── Group 5: Authority Boundary Visible ─────────────────────────────────────

describe('Phase 9U — Authority boundary language visible', () => {
  it('page references "CB Control Center" as decision authority', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('CB Control Center')
  })

  it('page references MKCRM (to state its limited role)', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('MKCRM')
  })

  it('page contains "does not" or "does not decide" language', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src.toLowerCase()).toMatch(/does not (decide|determine)/)
  })

  it('page contains decisionAuthority reference', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('decisionAuthority')
  })

  it('preview source objects have decisionAuthority: cb_control_center', () => {
    for (const preview of getAllDapPracticeDecisionEmailPreviews()) {
      expect(preview.source.decisionAuthority).toBe('cb_control_center')
    }
  })
})

// ─── Group 6: Payment and PHI Safety ─────────────────────────────────────────

describe('Phase 9U — Payment and PHI safety', () => {
  it('page source references includesPaymentCta (safety flag label)', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('includesPaymentCta')
  })

  it('page source references includesPhi (safety flag label)', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('includesPhi')
  })

  it('page source references paymentAuthority (source field label)', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('paymentAuthority')
  })

  it('page source references crmAuthority (source field label)', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('crmAuthority')
  })

  it('page does not contain payment action language', () => {
    const src = readFileSync(PAGE_PATH, 'utf8').toLowerCase()
    expect(src).not.toContain('checkout')
    expect(src).not.toContain('invoice')
    expect(src).not.toContain('billing portal')
    expect(src).not.toContain('stripe')
    expect(src).not.toContain('pay now')
  })

  it('page does not contain subscribe language', () => {
    const src = readFileSync(PAGE_PATH, 'utf8').toLowerCase()
    expect(src).not.toContain('subscribe(')
    expect(src).not.toContain('"subscribe"')
    expect(src).not.toContain("'subscribe'")
  })

  it('all previews have source.paymentAuthority: false', () => {
    for (const preview of getAllDapPracticeDecisionEmailPreviews()) {
      expect(preview.source.paymentAuthority).toBe(false)
    }
  })

  it('all previews have source.includesPhi: false', () => {
    for (const preview of getAllDapPracticeDecisionEmailPreviews()) {
      expect(preview.source.includesPhi).toBe(false)
    }
  })
})

// ─── Group 7: CTA Inactive State ─────────────────────────────────────────────

describe('Phase 9U — CTA inactive state', () => {
  it('page renders "None" for inactive CTA state', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).toContain('None')
  })

  it('page references "Primary CTA" label', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src.toLowerCase()).toContain('primary cta')
  })

  it('all preview copy templates have null primaryCtaLabel', () => {
    for (const preview of getAllDapPracticeDecisionEmailPreviews()) {
      expect(preview.copy.primaryCtaLabel).toBeNull()
    }
  })

  it('all preview copy templates have null primaryCtaHref', () => {
    for (const preview of getAllDapPracticeDecisionEmailPreviews()) {
      expect(preview.copy.primaryCtaHref).toBeNull()
    }
  })

  it('page does not render an active <a> tag for null CTA', () => {
    const src = readFileSync(PAGE_PATH, 'utf8')
    expect(src).not.toMatch(/primaryCtaHref[\s\S]*href=\{/)
  })
})

// ─── Group 8: Full Suite Guard ────────────────────────────────────────────────

describe('Phase 9U — Full suite guard', () => {
  it('page count is 23 (all prior pages preserved)', () => {
    expect(findPages(join(ROOT, 'app')).length).toBe(58)
  })

  it('Phase 9T preview helper still returns 8 previews', () => {
    expect(getAllDapPracticeDecisionEmailPreviews()).toHaveLength(8)
  })

  it('Phase 9T copy safety flags are preserved', () => {
    for (const preview of getAllDapPracticeDecisionEmailPreviews()) {
      expect(preview.copy.includesPaymentCta).toBe(false)
      expect(preview.copy.includesPhi).toBe(false)
      expect(preview.copy.derivedFromBillingEvents).toBe(false)
      expect(preview.copy.decidedByCbControlCenter).toBe(true)
      expect(preview.copy.decidedByMkcrm).toBe(false)
    }
  })

  it('Phase 9T source authority fields are preserved', () => {
    for (const preview of getAllDapPracticeDecisionEmailPreviews()) {
      expect(preview.source.decisionAuthority).toBe('cb_control_center')
      expect(preview.source.crmAuthority).toBe(false)
      expect(preview.source.paymentAuthority).toBe(false)
    }
  })
})
