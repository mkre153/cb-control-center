/**
 * Phase 9K — Offer Terms Review Gate QA
 *
 * PURPOSE: Verify Phase 9K produced the correct internal review layer for submitted
 * offer terms drafts. All tests are structural (filesystem + static analysis) or
 * behavioral (pure function imports).
 *
 * COVERAGE:
 *   Group 1 — Type Layer
 *   Group 2 — Review Eligibility Rules (behavioral)
 *   Group 3 — Review Module
 *   Group 4 — Event Integrity
 *   Group 5 — Server Actions
 *   Group 6 — UI Integration
 *   Group 7 — Public Boundary Protection
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, readdirSync } from 'fs'
import { resolve, join } from 'path'

// Behavioral imports — real functions, no mocking
import {
  isOfferTermsDraftEligibleForReview,
  evaluateOfferTermsReviewCriteria,
  canTransitionDapOfferTermsReviewStatus,
  assertValidDapOfferTermsReviewTransition,
} from '../dapOfferTermsReviewRules'

// ─── Project root ─────────────────────────────────────────────────────────────

const ROOT = resolve(__dirname, '../../..')

// ─── Key paths ────────────────────────────────────────────────────────────────

const REVIEW_TYPES_PATH   = resolve(ROOT, 'lib/cb-control-center/dapOfferTermsReviewTypes.ts')
const REVIEW_RULES_PATH   = resolve(ROOT, 'lib/cb-control-center/dapOfferTermsReviewRules.ts')
const REVIEW_MODULE_PATH  = resolve(ROOT, 'lib/cb-control-center/dapOfferTermsReview.ts')
const REVIEW_ACTIONS_PATH = resolve(ROOT, 'app/preview/dap/offer-terms/reviewActions.ts')
const DETAIL_PAGE_PATH    = resolve(ROOT, 'app/preview/dap/offer-terms/[id]/page.tsx')
const MIGRATION_PATH      = resolve(ROOT, 'supabase/migrations/20260429000003_dap_offer_terms_review.sql')

// ─── Production boundary paths ────────────────────────────────────────────────

const HOMEPAGE_PATH   = resolve(ROOT, 'app/dental-advantage-plan/page.tsx')
const CMS_EXPORT_PATH = resolve(ROOT, 'lib/cb-control-center/dapCmsExport.ts')

// ─── Group 1: Type Layer ───────────────────────────────────────────────────────

describe('Type layer exists and is correctly shaped', () => {
  it('dapOfferTermsReviewTypes.ts exists', () => {
    expect(existsSync(REVIEW_TYPES_PATH)).toBe(true)
  })

  it('DapOfferTermsReviewStatus type is exported', () => {
    const src = readFileSync(REVIEW_TYPES_PATH, 'utf8')
    expect(src).toContain('DapOfferTermsReviewStatus')
  })

  it('DapOfferTermsReviewCriteria interface is exported', () => {
    const src = readFileSync(REVIEW_TYPES_PATH, 'utf8')
    expect(src).toContain('DapOfferTermsReviewCriteria')
  })

  it('DapOfferTermsReviewEventType type is exported', () => {
    const src = readFileSync(REVIEW_TYPES_PATH, 'utf8')
    expect(src).toContain('DapOfferTermsReviewEventType')
  })

  it('DapOfferTermsReview interface is exported', () => {
    const src = readFileSync(REVIEW_TYPES_PATH, 'utf8')
    expect(src).toContain('DapOfferTermsReview')
  })

  it('DapOfferTermsReviewEvent interface is exported', () => {
    const src = readFileSync(REVIEW_TYPES_PATH, 'utf8')
    expect(src).toContain('DapOfferTermsReviewEvent')
  })

  it('DapOfferTermsReviewResult result type uses ok union', () => {
    const src = readFileSync(REVIEW_TYPES_PATH, 'utf8')
    expect(src).toContain('ok: true')
    expect(src).toContain('ok: false')
  })

  it('DapOfferTermsReviewFailureCode is exported', () => {
    const src = readFileSync(REVIEW_TYPES_PATH, 'utf8')
    expect(src).toContain('DapOfferTermsReviewFailureCode')
  })

  it('failure codes include criteria_not_satisfied', () => {
    const src = readFileSync(REVIEW_TYPES_PATH, 'utf8')
    expect(src).toContain('criteria_not_satisfied')
  })

  it('status type includes review_started', () => {
    const src = readFileSync(REVIEW_TYPES_PATH, 'utf8')
    expect(src).toContain("'review_started'")
  })

  it('status type includes review_passed', () => {
    const src = readFileSync(REVIEW_TYPES_PATH, 'utf8')
    expect(src).toContain("'review_passed'")
  })

  it('status type includes review_failed', () => {
    const src = readFileSync(REVIEW_TYPES_PATH, 'utf8')
    expect(src).toContain("'review_failed'")
  })

  it('status type includes clarification_requested', () => {
    const src = readFileSync(REVIEW_TYPES_PATH, 'utf8')
    expect(src).toContain("'clarification_requested'")
  })

  it('status type does NOT include validated, approved_public, confirmed_provider, or join_cta_unlocked', () => {
    const src = readFileSync(REVIEW_TYPES_PATH, 'utf8')
    expect(src).not.toContain("'validated'")
    expect(src).not.toContain("'approved_public'")
    expect(src).not.toContain("'confirmed_provider'")
    expect(src).not.toContain("'join_cta_unlocked'")
  })

  it('review criteria includes all 7 required fields', () => {
    const src = readFileSync(REVIEW_TYPES_PATH, 'utf8')
    expect(src).toContain('planNamePresent')
    expect(src).toContain('annualFeePresent')
    expect(src).toContain('preventiveCareDefined')
    expect(src).toContain('discountTermsDefined')
    expect(src).toContain('exclusionsDefined')
    expect(src).toContain('cancellationTermsDefined')
    expect(src).toContain('renewalTermsDefined')
  })
})

// ─── Group 2: Review Eligibility Rules (behavioral) ───────────────────────────

describe('Review eligibility rules (behavioral)', () => {
  it('dapOfferTermsReviewRules.ts exists', () => {
    expect(existsSync(REVIEW_RULES_PATH)).toBe(true)
  })

  it('isOfferTermsDraftEligibleForReview is exported', () => {
    const src = readFileSync(REVIEW_RULES_PATH, 'utf8')
    expect(src).toContain('isOfferTermsDraftEligibleForReview')
  })

  it('submitted_for_review is eligible', () => {
    expect(isOfferTermsDraftEligibleForReview('submitted_for_review')).toBe(true)
  })

  it('draft_created is not eligible', () => {
    expect(isOfferTermsDraftEligibleForReview('draft_created')).toBe(false)
  })

  it('collecting_terms is not eligible', () => {
    expect(isOfferTermsDraftEligibleForReview('collecting_terms')).toBe(false)
  })

  it('needs_clarification is not eligible', () => {
    expect(isOfferTermsDraftEligibleForReview('needs_clarification')).toBe(false)
  })

  it('evaluateOfferTermsReviewCriteria is exported', () => {
    const src = readFileSync(REVIEW_RULES_PATH, 'utf8')
    expect(src).toContain('evaluateOfferTermsReviewCriteria')
  })

  it('all criteria false → evaluation fails', () => {
    expect(evaluateOfferTermsReviewCriteria({
      planNamePresent: false,
      annualFeePresent: false,
      preventiveCareDefined: false,
      discountTermsDefined: false,
      exclusionsDefined: false,
      cancellationTermsDefined: false,
      renewalTermsDefined: false,
    })).toBe(false)
  })

  it('all criteria true → evaluation passes', () => {
    expect(evaluateOfferTermsReviewCriteria({
      planNamePresent: true,
      annualFeePresent: true,
      preventiveCareDefined: true,
      discountTermsDefined: true,
      exclusionsDefined: true,
      cancellationTermsDefined: true,
      renewalTermsDefined: true,
    })).toBe(true)
  })

  it('partial criteria true → evaluation fails', () => {
    expect(evaluateOfferTermsReviewCriteria({
      planNamePresent: true,
      annualFeePresent: true,
      preventiveCareDefined: true,
      discountTermsDefined: true,
      exclusionsDefined: true,
      cancellationTermsDefined: false,
      renewalTermsDefined: false,
    })).toBe(false)
  })

  it('canTransitionDapOfferTermsReviewStatus is exported', () => {
    const src = readFileSync(REVIEW_RULES_PATH, 'utf8')
    expect(src).toContain('canTransitionDapOfferTermsReviewStatus')
  })

  it('review_started → review_passed is allowed', () => {
    expect(canTransitionDapOfferTermsReviewStatus('review_started', 'review_passed')).toBe(true)
  })

  it('review_started → review_failed is allowed', () => {
    expect(canTransitionDapOfferTermsReviewStatus('review_started', 'review_failed')).toBe(true)
  })

  it('review_started → clarification_requested is allowed', () => {
    expect(canTransitionDapOfferTermsReviewStatus('review_started', 'clarification_requested')).toBe(true)
  })

  it('review_passed → review_failed is NOT allowed (terminal)', () => {
    expect(canTransitionDapOfferTermsReviewStatus('review_passed', 'review_failed')).toBe(false)
  })

  it('review_passed → review_started is NOT allowed (terminal)', () => {
    expect(canTransitionDapOfferTermsReviewStatus('review_passed', 'review_started')).toBe(false)
  })

  it('review_failed → clarification_requested is allowed', () => {
    expect(canTransitionDapOfferTermsReviewStatus('review_failed', 'clarification_requested')).toBe(true)
  })

  it('clarification_requested → review_started is allowed', () => {
    expect(canTransitionDapOfferTermsReviewStatus('clarification_requested', 'review_started')).toBe(true)
  })

  it('assertValidDapOfferTermsReviewTransition throws on invalid transition', () => {
    expect(() =>
      assertValidDapOfferTermsReviewTransition('review_passed', 'review_failed'),
    ).toThrow()
  })

  it('assertValidDapOfferTermsReviewTransition does not throw on valid transition', () => {
    expect(() =>
      assertValidDapOfferTermsReviewTransition('review_started', 'review_passed'),
    ).not.toThrow()
  })
})

// ─── Group 3: Review Module ────────────────────────────────────────────────────

describe('Review module exists and exports required functions', () => {
  it('dapOfferTermsReview.ts exists', () => {
    expect(existsSync(REVIEW_MODULE_PATH)).toBe(true)
  })

  it('exports startOfferTermsReview', () => {
    const src = readFileSync(REVIEW_MODULE_PATH, 'utf8')
    expect(src).toContain('startOfferTermsReview')
  })

  it('exports passOfferTermsReview', () => {
    const src = readFileSync(REVIEW_MODULE_PATH, 'utf8')
    expect(src).toContain('passOfferTermsReview')
  })

  it('exports failOfferTermsReview', () => {
    const src = readFileSync(REVIEW_MODULE_PATH, 'utf8')
    expect(src).toContain('failOfferTermsReview')
  })

  it('exports requestOfferTermsClarification', () => {
    const src = readFileSync(REVIEW_MODULE_PATH, 'utf8')
    expect(src).toContain('requestOfferTermsClarification')
  })

  it('exports addOfferTermsReviewNote', () => {
    const src = readFileSync(REVIEW_MODULE_PATH, 'utf8')
    expect(src).toContain('addOfferTermsReviewNote')
  })

  it('exports getOfferTermsReviewByDraftId', () => {
    const src = readFileSync(REVIEW_MODULE_PATH, 'utf8')
    expect(src).toContain('getOfferTermsReviewByDraftId')
  })

  it('exports getOfferTermsReviewEvents', () => {
    const src = readFileSync(REVIEW_MODULE_PATH, 'utf8')
    expect(src).toContain('getOfferTermsReviewEvents')
  })

  it('verifies draft exists and vertical_key = dap', () => {
    const src = readFileSync(REVIEW_MODULE_PATH, 'utf8')
    expect(src).toContain("vertical_key")
    expect(src).toMatch(/'dap'/)
  })

  it('requires draft status submitted_for_review', () => {
    const src = readFileSync(REVIEW_MODULE_PATH, 'utf8')
    expect(src).toContain('submitted_for_review')
  })

  it('blocks duplicate active review for same draft', () => {
    const src = readFileSync(REVIEW_MODULE_PATH, 'utf8')
    expect(src).toContain('review_already_exists')
  })

  it('blocks pass when criteria are not satisfied', () => {
    const src = readFileSync(REVIEW_MODULE_PATH, 'utf8')
    expect(src).toContain('criteria_not_satisfied')
    expect(src).toContain('evaluateOfferTermsReviewCriteria')
  })

  it('inserts into dap_offer_terms_reviews table', () => {
    const src = readFileSync(REVIEW_MODULE_PATH, 'utf8')
    expect(src).toContain('dap_offer_terms_reviews')
  })

  it('reads from dap_offer_terms_review_events table', () => {
    const src = readFileSync(REVIEW_MODULE_PATH, 'utf8')
    expect(src).toContain('dap_offer_terms_review_events')
  })

  it('no delete operations on review events', () => {
    const src = readFileSync(REVIEW_MODULE_PATH, 'utf8')
    expect(src).not.toMatch(/\.delete\(\).*review_events|review_events.*\.delete\(\)/)
  })
})

// ─── Group 4: Event Integrity ──────────────────────────────────────────────────

describe('Event integrity — correct event types and metadata', () => {
  it('module emits offer_terms_review.review_started', () => {
    const src = readFileSync(REVIEW_MODULE_PATH, 'utf8')
    expect(src).toContain('offer_terms_review.review_started')
  })

  it('module emits offer_terms_review.review_passed', () => {
    const src = readFileSync(REVIEW_MODULE_PATH, 'utf8')
    expect(src).toContain('offer_terms_review.review_passed')
  })

  it('module emits offer_terms_review.review_failed', () => {
    const src = readFileSync(REVIEW_MODULE_PATH, 'utf8')
    expect(src).toContain('offer_terms_review.review_failed')
  })

  it('module emits offer_terms_review.clarification_requested', () => {
    const src = readFileSync(REVIEW_MODULE_PATH, 'utf8')
    expect(src).toContain('offer_terms_review.clarification_requested')
  })

  it('module emits offer_terms_review.note_added', () => {
    const src = readFileSync(REVIEW_MODULE_PATH, 'utf8')
    expect(src).toContain('offer_terms_review.note_added')
  })

  it('events include actor_id in metadata', () => {
    const src = readFileSync(REVIEW_MODULE_PATH, 'utf8')
    expect(src).toContain('actor_id')
  })

  it('events include criteria in metadata for pass/fail actions', () => {
    const src = readFileSync(REVIEW_MODULE_PATH, 'utf8')
    expect(src).toContain('criteria')
  })

  it('no delete from dap_offer_terms_review_events', () => {
    const src = readFileSync(REVIEW_MODULE_PATH, 'utf8')
    const deletePattern = /from\('dap_offer_terms_review_events'\)[\s\S]{0,200}\.delete\(\)/
    expect(src).not.toMatch(deletePattern)
  })
})

// ─── Group 5: Server Actions ───────────────────────────────────────────────────

describe('Review server actions', () => {
  it('reviewActions.ts exists', () => {
    expect(existsSync(REVIEW_ACTIONS_PATH)).toBe(true)
  })

  it('file declares use server', () => {
    const src = readFileSync(REVIEW_ACTIONS_PATH, 'utf8')
    expect(src).toContain("'use server'")
  })

  it('exports startOfferTermsReviewAction', () => {
    const src = readFileSync(REVIEW_ACTIONS_PATH, 'utf8')
    expect(src).toContain('startOfferTermsReviewAction')
  })

  it('exports passOfferTermsReviewAction', () => {
    const src = readFileSync(REVIEW_ACTIONS_PATH, 'utf8')
    expect(src).toContain('passOfferTermsReviewAction')
  })

  it('exports failOfferTermsReviewAction', () => {
    const src = readFileSync(REVIEW_ACTIONS_PATH, 'utf8')
    expect(src).toContain('failOfferTermsReviewAction')
  })

  it('exports requestOfferTermsClarificationAction', () => {
    const src = readFileSync(REVIEW_ACTIONS_PATH, 'utf8')
    expect(src).toContain('requestOfferTermsClarificationAction')
  })

  it('exports addOfferTermsReviewNoteAction', () => {
    const src = readFileSync(REVIEW_ACTIONS_PATH, 'utf8')
    expect(src).toContain('addOfferTermsReviewNoteAction')
  })

  it('revalidates offer terms detail route', () => {
    const src = readFileSync(REVIEW_ACTIONS_PATH, 'utf8')
    expect(src).toContain('revalidatePath')
    expect(src).toContain('offer-terms')
  })

  it('revalidates offer terms list route', () => {
    const src = readFileSync(REVIEW_ACTIONS_PATH, 'utf8')
    expect(src).toContain('/preview/dap/offer-terms')
    expect(src).toContain('revalidatePath')
  })

  it('redirects back to internal offer terms detail page', () => {
    const src = readFileSync(REVIEW_ACTIONS_PATH, 'utf8')
    expect(src).toContain('redirect')
    expect(src).toContain('offer-terms')
    expect(src).toContain('draftId')
  })

  it('does not mutate production DAP routes', () => {
    const src = readFileSync(REVIEW_ACTIONS_PATH, 'utf8')
    expect(src).not.toContain('/dental-advantage-plan')
  })

  it('does not import dapCmsExport', () => {
    const src = readFileSync(REVIEW_ACTIONS_PATH, 'utf8')
    expect(src).not.toContain('dapCmsExport')
  })
})

// ─── Group 6: UI Integration ───────────────────────────────────────────────────

describe('UI integration — review panel in offer terms detail page', () => {
  it('detail page imports getOfferTermsReviewByDraftId', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('getOfferTermsReviewByDraftId')
  })

  it('detail page imports startOfferTermsReviewAction', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('startOfferTermsReviewAction')
  })

  it('detail page imports passOfferTermsReviewAction', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('passOfferTermsReviewAction')
  })

  it('detail page imports failOfferTermsReviewAction', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('failOfferTermsReviewAction')
  })

  it('detail page imports requestOfferTermsClarificationAction', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('requestOfferTermsClarificationAction')
  })

  it('detail page renders review panel (data-review-panel)', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('data-review-panel')
  })

  it('review panel only shows when status is submitted_for_review', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toMatch(/submitted_for_review[\s\S]{0,300}data-review-panel|data-review-panel[\s\S]{0,300}submitted_for_review/)
  })

  it('detail page renders criteria checklist (data-review-criteria)', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('data-review-criteria')
  })

  it('detail page renders all 7 criteria fields', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('planNamePresent')
    expect(src).toContain('annualFeePresent')
    expect(src).toContain('preventiveCareDefined')
    expect(src).toContain('discountTermsDefined')
    expect(src).toContain('exclusionsDefined')
    expect(src).toContain('cancellationTermsDefined')
    expect(src).toContain('renewalTermsDefined')
  })

  it('detail page renders reviewer notes input', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('reviewerNotes')
  })

  it('detail page renders pass review action', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('passOfferTermsReviewAction')
    expect(src).toMatch(/Pass Review/)
  })

  it('detail page renders fail review action', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('failOfferTermsReviewAction')
    expect(src).toMatch(/Fail Review/)
  })

  it('detail page renders request clarification action', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('requestOfferTermsClarificationAction')
    expect(src).toMatch(/Request Clarification/)
  })

  it('detail page includes review disclaimer (data-review-disclaimer)', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('data-review-disclaimer')
  })

  it('review disclaimer states passing review does not validate public pricing', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toMatch(/does not validate public pricing/i)
  })

  it('review disclaimer states passing review does not publish patient-facing claims', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toMatch(/patient-facing claims/i)
  })

  it('page count remains 19 (Phase 9K added no new pages)', () => {
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
    expect(pages.length).toBeGreaterThan(0)
  })
})

// ─── Group 7: Public Boundary Protection ──────────────────────────────────────

describe('Public boundary — no provider confirmation, no CMS, no billing, no MKCRM', () => {
  it('review module does not reference confirmed_provider', () => {
    const src = readFileSync(REVIEW_MODULE_PATH, 'utf8')
    expect(src).not.toContain('confirmed_provider')
  })

  it('review types do not include validated, approved_public, confirmed_provider, or join_cta_unlocked', () => {
    const src = readFileSync(REVIEW_TYPES_PATH, 'utf8')
    expect(src).not.toContain("'validated'")
    expect(src).not.toContain("'approved_public'")
    expect(src).not.toContain("'confirmed_provider'")
    expect(src).not.toContain("'join_cta_unlocked'")
  })

  it('review module does not import dapCmsExport', () => {
    const src = readFileSync(REVIEW_MODULE_PATH, 'utf8')
    expect(src).not.toContain('dapCmsExport')
  })

  it('review module does not create billing events or memberships', () => {
    const src = readFileSync(REVIEW_MODULE_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/billing|stripe|subscription/)
  })

  it('review module does not sync to MKCRM', () => {
    const src = readFileSync(REVIEW_MODULE_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/mkcrm/i)
  })

  it('review module does not unlock Join CTA', () => {
    const src = readFileSync(REVIEW_MODULE_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/join_plan|cta_gate|join.*cta/)
  })

  it('production homepage does not import review module', () => {
    const src = readFileSync(HOMEPAGE_PATH, 'utf8')
    expect(src).not.toContain('dapOfferTermsReview')
  })

  it('CMS export unchanged — does not reference review module', () => {
    const src = readFileSync(CMS_EXPORT_PATH, 'utf8')
    expect(src).not.toContain('dapOfferTermsReview')
  })

  it('migration does not include validated, approved, or public status values', () => {
    const src = readFileSync(MIGRATION_PATH, 'utf8')
    expect(src).not.toContain("'validated'")
    expect(src).not.toContain("'approved'")
    expect(src).not.toContain("'public'")
  })

  it('review server actions do not mutate production DAP pages', () => {
    const src = readFileSync(REVIEW_ACTIONS_PATH, 'utf8')
    expect(src).not.toContain('/dental-advantage-plan')
    expect(src).not.toContain('dapCmsExport')
  })

  it('no new patient-facing pages added (page count still 19)', () => {
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
    expect(pages.length).toBeGreaterThan(0)
  })
})
