/**
 * Phase 9J — Offer Terms Collection Gate QA
 *
 * PURPOSE: Verify Phase 9J produced the correct offer terms draft layer.
 * All tests are structural (filesystem + static analysis) or behavioral (pure function imports).
 *
 * COVERAGE:
 *   Group 1 — Type Layer
 *   Group 2 — Eligibility Rules (behavioral)
 *   Group 3 — Draft Creation
 *   Group 4 — Draft Actions
 *   Group 5 — Server Actions
 *   Group 6 — UI Pages
 *   Group 7 — Public Boundary Protection
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve, join } from 'path'

// Behavioral imports — real functions, no mocking
import {
  isOnboardingEligibleForOfferTermsCollection,
  canTransitionDapOfferTermsStatus,
  assertValidDapOfferTermsTransition,
} from './dapOfferTermsRules'

// ─── Project root ─────────────────────────────────────────────────────────────

const ROOT = resolve(__dirname, '../..')

// ─── Key paths ────────────────────────────────────────────────────────────────

const TYPES_PATH          = resolve(ROOT, 'lib/cb-control-center/dapOfferTermsTypes.ts')
const RULES_PATH          = resolve(ROOT, 'lib/cb-control-center/dapOfferTermsRules.ts')
const MODULE_PATH         = resolve(ROOT, 'lib/cb-control-center/dapOfferTerms.ts')
const SERVER_ACTIONS_PATH = resolve(ROOT, 'app/preview/dap/offer-terms/actions.ts')
const LIST_PAGE_PATH      = resolve(ROOT, 'app/preview/dap/offer-terms/page.tsx')
const DETAIL_PAGE_PATH    = resolve(ROOT, 'app/preview/dap/offer-terms/[id]/page.tsx')
const ONBOARDING_DETAIL_PATH = resolve(ROOT, 'app/preview/dap/onboarding/[id]/page.tsx')
const MIGRATION_PATH      = resolve(ROOT, 'supabase/migrations/20260429000002_dap_offer_terms.sql')

// ─── Production boundary paths ────────────────────────────────────────────────

const HOMEPAGE_PATH   = resolve(ROOT, 'app/dental-advantage-plan/page.tsx')
const CMS_EXPORT_PATH = resolve(ROOT, 'lib/cb-control-center/dapCmsExport.ts')

// ─── Group 1: Type Layer ───────────────────────────────────────────────────────

describe('Type layer exists and is correctly shaped', () => {
  it('dapOfferTermsTypes.ts exists', () => {
    expect(existsSync(TYPES_PATH)).toBe(true)
  })

  it('DapOfferTermsDraft interface is exported', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain('DapOfferTermsDraft')
  })

  it('DapOfferTermsDraftStatus type is exported', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain('DapOfferTermsDraftStatus')
  })

  it('DapOfferTermsDraftFields interface is exported', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain('DapOfferTermsDraftFields')
  })

  it('DapOfferTermsEventType type is exported', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain('DapOfferTermsEventType')
  })

  it('DapOfferTermsEvent interface is exported', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain('DapOfferTermsEvent')
  })

  it('DapOfferTermsResult result type uses ok union', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain('ok: true')
    expect(src).toContain('ok: false')
  })

  it('DapOfferTermsFailureCode is exported', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain('DapOfferTermsFailureCode')
  })

  it('status type does NOT include validated, approved, or public', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    const statusBlock = src.slice(src.indexOf('DapOfferTermsDraftStatus'), src.indexOf('DapOfferTermsEventType'))
    expect(statusBlock).not.toContain("'validated'")
    expect(statusBlock).not.toContain("'approved'")
    expect(statusBlock).not.toContain("'public'")
  })

  it('status type includes draft_created', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain("'draft_created'")
  })

  it('status type includes submitted_for_review', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain("'submitted_for_review'")
  })

  it('event types use offer_terms. dot notation', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain("'offer_terms.draft_created'")
  })

  it('migration exists for offer terms tables', () => {
    expect(existsSync(MIGRATION_PATH)).toBe(true)
  })
})

// ─── Group 2: Eligibility Rules (behavioral) ──────────────────────────────────

describe('Eligibility rules — only interested and terms_needed may begin collection', () => {
  it('dapOfferTermsRules.ts exists', () => {
    expect(existsSync(RULES_PATH)).toBe(true)
  })

  it('exports isOnboardingEligibleForOfferTermsCollection', () => {
    const src = readFileSync(RULES_PATH, 'utf8')
    expect(src).toMatch(/export.*function.*isOnboardingEligibleForOfferTermsCollection/)
  })

  it('exports canTransitionDapOfferTermsStatus', () => {
    const src = readFileSync(RULES_PATH, 'utf8')
    expect(src).toMatch(/export.*function.*canTransitionDapOfferTermsStatus/)
  })

  it('exports assertValidDapOfferTermsTransition', () => {
    const src = readFileSync(RULES_PATH, 'utf8')
    expect(src).toMatch(/export.*function.*assertValidDapOfferTermsTransition/)
  })

  it('interested is eligible', () => {
    expect(isOnboardingEligibleForOfferTermsCollection('interested')).toBe(true)
  })

  it('terms_needed is eligible', () => {
    expect(isOnboardingEligibleForOfferTermsCollection('terms_needed')).toBe(true)
  })

  it('intake_created is not eligible', () => {
    expect(isOnboardingEligibleForOfferTermsCollection('intake_created')).toBe(false)
  })

  it('outreach_needed is not eligible', () => {
    expect(isOnboardingEligibleForOfferTermsCollection('outreach_needed')).toBe(false)
  })

  it('outreach_started is not eligible', () => {
    expect(isOnboardingEligibleForOfferTermsCollection('outreach_started')).toBe(false)
  })

  it('practice_responded is not eligible', () => {
    expect(isOnboardingEligibleForOfferTermsCollection('practice_responded')).toBe(false)
  })

  it('not_interested is not eligible', () => {
    expect(isOnboardingEligibleForOfferTermsCollection('not_interested')).toBe(false)
  })

  it('ready_for_offer_validation is not eligible', () => {
    expect(isOnboardingEligibleForOfferTermsCollection('ready_for_offer_validation')).toBe(false)
  })

  it('draft_created → collecting_terms is allowed', () => {
    expect(canTransitionDapOfferTermsStatus('draft_created', 'collecting_terms')).toBe(true)
  })

  it('draft_created → submitted_for_review is allowed', () => {
    expect(canTransitionDapOfferTermsStatus('draft_created', 'submitted_for_review')).toBe(true)
  })

  it('collecting_terms → submitted_for_review is allowed', () => {
    expect(canTransitionDapOfferTermsStatus('collecting_terms', 'submitted_for_review')).toBe(true)
  })

  it('submitted_for_review → needs_clarification is allowed', () => {
    expect(canTransitionDapOfferTermsStatus('submitted_for_review', 'needs_clarification')).toBe(true)
  })

  it('needs_clarification → collecting_terms is allowed', () => {
    expect(canTransitionDapOfferTermsStatus('needs_clarification', 'collecting_terms')).toBe(true)
  })

  it('assertValidDapOfferTermsTransition throws on invalid transition', () => {
    expect(() =>
      assertValidDapOfferTermsTransition('collecting_terms', 'draft_created'),
    ).toThrow()
  })

  it('assertValidDapOfferTermsTransition does not throw on valid transition', () => {
    expect(() =>
      assertValidDapOfferTermsTransition('draft_created', 'collecting_terms'),
    ).not.toThrow()
  })
})

// ─── Group 3: Draft Creation ───────────────────────────────────────────────────

describe('Draft creation — guarded, deduplicated, event-logged', () => {
  it('dapOfferTerms.ts exists', () => {
    expect(existsSync(MODULE_PATH)).toBe(true)
  })

  it('exports createOfferTermsDraftFromOnboarding', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*createOfferTermsDraftFromOnboarding/)
  })

  it('exports getOfferTermsDraftByOnboardingId', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*getOfferTermsDraftByOnboardingId/)
  })

  it('exports getOfferTermsDraftById', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*getOfferTermsDraftById/)
  })

  it('exports listOfferTermsDrafts', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*listOfferTermsDrafts/)
  })

  it('exports getOfferTermsEvents', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*getOfferTermsEvents/)
  })

  it('verifies onboarding intake exists before creating draft', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain('dap_practice_onboarding_intakes')
    expect(src).toContain('maybeSingle')
  })

  it('verifies vertical_key = dap on the onboarding intake', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain(".eq('vertical_key', 'dap')")
  })

  it('requires eligible onboarding status', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain('isOnboardingEligibleForOfferTermsCollection')
    expect(src).toContain("'onboarding_status_not_eligible'")
  })

  it('blocks duplicate draft for same onboarding intake', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain("'draft_already_exists'")
    const existsCheckPos = src.indexOf('draft_already_exists')
    const insertPos = src.indexOf('.insert(')
    expect(existsCheckPos).toBeLessThan(insertPos)
  })

  it('inserts offer_terms.draft_created event after draft creation', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain("'offer_terms.draft_created'")
  })

  it('uses service-role Supabase client', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain('getSupabaseAdminClient')
  })

  it('returns typed ok/false result with failure codes', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain('ok: true')
    expect(src).toContain('ok: false')
    expect(src).toContain("'onboarding_not_found'")
  })
})

// ─── Group 4: Draft Actions ────────────────────────────────────────────────────

describe('Draft actions — update, review, clarification, note, no deletes', () => {
  it('exports updateOfferTermsDraft', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*updateOfferTermsDraft/)
  })

  it('exports submitOfferTermsDraftForReview', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*submitOfferTermsDraftForReview/)
  })

  it('exports markOfferTermsDraftNeedsClarification', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*markOfferTermsDraftNeedsClarification/)
  })

  it('exports addOfferTermsNote', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*addOfferTermsNote/)
  })

  it('all actions insert append-only events', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    const insertCount = (src.match(/\.insert\(/g) ?? []).length
    expect(insertCount).toBeGreaterThanOrEqual(4)
  })

  it('status transitions use assertValidDapOfferTermsTransition', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain('assertValidDapOfferTermsTransition')
  })

  it('invalid transitions return invalid_transition failure code', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain("'invalid_transition'")
  })

  it('no .delete( operation exists in module', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).not.toContain('.delete(')
  })

  it('event metadata includes previous_status', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain('previous_status')
  })

  it('event metadata includes new_status', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain('new_status')
  })
})

// ─── Group 5: Server Actions ───────────────────────────────────────────────────

describe('Server actions — exist, revalidate, redirect to internal pages', () => {
  it('app/preview/dap/offer-terms/actions.ts exists', () => {
    expect(existsSync(SERVER_ACTIONS_PATH)).toBe(true)
  })

  it("server actions file has 'use server' directive", () => {
    const src = readFileSync(SERVER_ACTIONS_PATH, 'utf8')
    expect(src).toContain("'use server'")
  })

  it('exports createOfferTermsDraftAction', () => {
    const src = readFileSync(SERVER_ACTIONS_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*createOfferTermsDraftAction/)
  })

  it('exports updateOfferTermsDraftAction', () => {
    const src = readFileSync(SERVER_ACTIONS_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*updateOfferTermsDraftAction/)
  })

  it('exports submitOfferTermsDraftForReviewAction', () => {
    const src = readFileSync(SERVER_ACTIONS_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*submitOfferTermsDraftForReviewAction/)
  })

  it('exports markOfferTermsDraftNeedsClarificationAction', () => {
    const src = readFileSync(SERVER_ACTIONS_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*markOfferTermsDraftNeedsClarificationAction/)
  })

  it('exports addOfferTermsNoteAction', () => {
    const src = readFileSync(SERVER_ACTIONS_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*addOfferTermsNoteAction/)
  })

  it('revalidates onboarding detail route', () => {
    const src = readFileSync(SERVER_ACTIONS_PATH, 'utf8')
    expect(src).toContain('revalidatePath')
    expect(src).toContain('/preview/dap/onboarding')
  })

  it('revalidates offer terms detail route', () => {
    const src = readFileSync(SERVER_ACTIONS_PATH, 'utf8')
    expect(src).toContain('/preview/dap/offer-terms')
  })

  it('redirects to internal offer terms pages', () => {
    const src = readFileSync(SERVER_ACTIONS_PATH, 'utf8')
    expect(src).toContain('redirect(')
    expect(src).toContain('draftDetailPath')
  })

  it('does not mutate public routes', () => {
    const src = readFileSync(SERVER_ACTIONS_PATH, 'utf8')
    expect(src).not.toContain('/dental-advantage-plan')
    expect(src).not.toContain('/decisions/')
    expect(src).not.toContain('/dentists/')
  })

  it('no .delete( in server actions', () => {
    const src = readFileSync(SERVER_ACTIONS_PATH, 'utf8')
    expect(src).not.toContain('.delete(')
  })
})

// ─── Group 6: UI Pages ─────────────────────────────────────────────────────────

describe('UI pages — exist, disclaimer, links, no public claims', () => {
  it('app/preview/dap/offer-terms/page.tsx exists', () => {
    expect(existsSync(LIST_PAGE_PATH)).toBe(true)
  })

  it('app/preview/dap/offer-terms/[id]/page.tsx exists', () => {
    expect(existsSync(DETAIL_PAGE_PATH)).toBe(true)
  })

  it('list page is force-dynamic', () => {
    const src = readFileSync(LIST_PAGE_PATH, 'utf8')
    expect(src).toContain('force-dynamic')
  })

  it('detail page is force-dynamic', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('force-dynamic')
  })

  it('list page includes internal-draft disclaimer (data-offer-terms-disclaimer)', () => {
    const src = readFileSync(LIST_PAGE_PATH, 'utf8')
    expect(src).toContain('data-offer-terms-disclaimer')
  })

  it('list page disclaimer states drafts are not validated', () => {
    const src = readFileSync(LIST_PAGE_PATH, 'utf8')
    expect(src).toMatch(/not validated/i)
  })

  it('detail page includes no-public-claims disclaimer (data-no-public-claims-disclaimer)', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('data-no-public-claims-disclaimer')
  })

  it('detail page disclaimer states terms are internal drafts (not approved)', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toMatch(/internal drafts/i)
  })

  it('onboarding detail page renders offer terms panel (data-offer-terms-panel)', () => {
    const src = readFileSync(ONBOARDING_DETAIL_PATH, 'utf8')
    expect(src).toContain('data-offer-terms-panel')
  })

  it('onboarding detail page imports createOfferTermsDraftAction', () => {
    const src = readFileSync(ONBOARDING_DETAIL_PATH, 'utf8')
    expect(src).toContain('createOfferTermsDraftAction')
  })

  it('onboarding detail page checks eligible statuses for offer terms', () => {
    const src = readFileSync(ONBOARDING_DETAIL_PATH, 'utf8')
    expect(src).toMatch(/interested.*terms_needed|terms_needed.*interested/i)
  })

  it('UI copy does not imply provider confirmation', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/confirmed.*provider|provider.*confirmed/)
  })

  it('UI copy does not imply offer validation', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/offer.*validated|validated.*offer/)
  })

  it('page count is now 19 (Phase 9J added offer-terms list + detail pages)', () => {
    const { readdirSync } = require('fs')
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
    const pages = findPages(join(ROOT, 'app'))
    expect(pages.length).toBe(34)
  })
})

// ─── Group 7: Public Boundary Protection ──────────────────────────────────────

describe('Public boundary — no provider confirmation, no CMS, no billing, no MKCRM', () => {
  it('offer terms module does not reference confirmed_provider', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).not.toContain('confirmed_provider')
  })

  it('offer terms types do not include validated, approved, or public status', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).not.toContain("'validated'")
    expect(src).not.toContain("'approved'")
  })

  it('offer terms module does not import CMS export', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).not.toContain('dapCmsExport')
  })

  it('offer terms module does not create billing events or memberships', () => {
    const src = readFileSync(MODULE_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/billing|membership.*id|stripe|subscription/)
  })

  it('offer terms module does not sync to MKCRM', () => {
    const src = readFileSync(MODULE_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/mkcrm/i)
  })

  it('offer terms module does not unlock Join CTA', () => {
    const src = readFileSync(MODULE_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/join_plan|cta_gate|join.*cta/)
  })

  it('production homepage does not import offer terms module', () => {
    const src = readFileSync(HOMEPAGE_PATH, 'utf8')
    expect(src).not.toContain('dapOfferTerms')
  })

  it('CMS export unchanged — does not reference offer terms module', () => {
    const src = readFileSync(CMS_EXPORT_PATH, 'utf8')
    expect(src).not.toContain('dapOfferTerms')
  })

  it('migration does not include validated, approved, or public status values', () => {
    const src = readFileSync(MIGRATION_PATH, 'utf8')
    expect(src).not.toContain("'validated'")
    expect(src).not.toContain("'approved'")
    expect(src).not.toContain("'public'")
  })

  it('server actions do not mutate production DAP pages', () => {
    const src = readFileSync(SERVER_ACTIONS_PATH, 'utf8')
    expect(src).not.toContain('/dental-advantage-plan')
    expect(src).not.toContain('dapCmsExport')
  })
})
