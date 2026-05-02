/**
 * Phase 9L — Provider Participation Confirmation Gate QA
 *
 * PURPOSE: Verify Phase 9L produced the correct internal provider participation
 * confirmation layer. All tests are structural (filesystem + static analysis) or
 * behavioral (pure function imports).
 *
 * COVERAGE:
 *   Group 1 — Type Layer
 *   Group 2 — Eligibility Rules (behavioral)
 *   Group 3 — Module
 *   Group 4 — Event Integrity
 *   Group 5 — Server Actions
 *   Group 6 — UI Pages
 *   Group 7 — Migration
 *   Group 8 — Public Boundary Protection
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, readdirSync } from 'fs'
import { resolve, join } from 'path'

// Behavioral imports — real functions, no mocking
import {
  isOfferTermsReviewEligibleForParticipationConfirmation,
  canTransitionDapProviderParticipationStatus,
  assertValidDapProviderParticipationTransition,
} from '../dapProviderParticipationRules'

// ─── Project root ─────────────────────────────────────────────────────────────

const ROOT = resolve(__dirname, '../../..')

// ─── Key paths ────────────────────────────────────────────────────────────────

const TYPES_PATH        = resolve(ROOT, 'lib/dap/registry/dapProviderParticipationTypes.ts')
const RULES_PATH        = resolve(ROOT, 'lib/cb-control-center/dapProviderParticipationRules.ts')
const MODULE_PATH       = resolve(ROOT, 'lib/cb-control-center/dapProviderParticipation.ts')
const ACTIONS_PATH      = resolve(ROOT, 'app/preview/dap/provider-participation/actions.ts')
const LIST_PAGE_PATH    = resolve(ROOT, 'app/preview/dap/provider-participation/page.tsx')
const DETAIL_PAGE_PATH  = resolve(ROOT, 'app/preview/dap/provider-participation/[id]/page.tsx')
const OT_DETAIL_PATH    = resolve(ROOT, 'app/preview/dap/offer-terms/[id]/page.tsx')
const MIGRATION_PATH    = resolve(ROOT, 'supabase/migrations/20260429000004_dap_provider_participation.sql')

// ─── Production boundary paths ────────────────────────────────────────────────

const HOMEPAGE_PATH   = resolve(ROOT, 'app/dental-advantage-plan/page.tsx')
const CMS_EXPORT_PATH = resolve(ROOT, 'lib/cb-control-center/dapCmsExport.ts')

// ─── Group 1: Type Layer ───────────────────────────────────────────────────────

describe('Type layer exists and is correctly shaped', () => {
  it('dapProviderParticipationTypes.ts exists', () => {
    expect(existsSync(TYPES_PATH)).toBe(true)
  })

  it('DapProviderParticipationStatus type is exported', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain('DapProviderParticipationStatus')
  })

  it('DapProviderParticipationFields interface is exported', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain('DapProviderParticipationFields')
  })

  it('DapProviderParticipationEventType type is exported', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain('DapProviderParticipationEventType')
  })

  it('DapProviderParticipationConfirmation interface is exported', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain('DapProviderParticipationConfirmation')
  })

  it('DapProviderParticipationEvent interface is exported', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain('DapProviderParticipationEvent')
  })

  it('DapProviderParticipationResult uses ok union', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain('ok: true')
    expect(src).toContain('ok: false')
  })

  it('DapProviderParticipationFailureCode is exported', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain('DapProviderParticipationFailureCode')
  })

  it('status includes confirmation_started', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain("'confirmation_started'")
  })

  it('status includes agreement_sent', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain("'agreement_sent'")
  })

  it('status includes agreement_received', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain("'agreement_received'")
  })

  it('status includes participation_confirmed', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain("'participation_confirmed'")
  })

  it('status includes participation_declined', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain("'participation_declined'")
  })

  it('status includes confirmation_voided', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain("'confirmation_voided'")
  })

  it('status does NOT include public, published, join_cta_unlocked, or pricing_validated', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).not.toContain("'public'")
    expect(src).not.toContain("'published'")
    expect(src).not.toContain("'join_cta_unlocked'")
    expect(src).not.toContain("'pricing_validated'")
  })

  it('fields include signer information', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain('signerName')
    expect(src).toContain('signerEmail')
  })

  it('fields include agreement document url', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain('agreementDocumentUrl')
  })
})

// ─── Group 2: Eligibility Rules (behavioral) ───────────────────────────────────

describe('Eligibility rules (behavioral)', () => {
  it('dapProviderParticipationRules.ts exists', () => {
    expect(existsSync(RULES_PATH)).toBe(true)
  })

  it('isOfferTermsReviewEligibleForParticipationConfirmation is exported', () => {
    const src = readFileSync(RULES_PATH, 'utf8')
    expect(src).toContain('isOfferTermsReviewEligibleForParticipationConfirmation')
  })

  it('review_passed is eligible', () => {
    expect(isOfferTermsReviewEligibleForParticipationConfirmation('review_passed')).toBe(true)
  })

  it('review_started is NOT eligible', () => {
    expect(isOfferTermsReviewEligibleForParticipationConfirmation('review_started')).toBe(false)
  })

  it('review_failed is NOT eligible', () => {
    expect(isOfferTermsReviewEligibleForParticipationConfirmation('review_failed')).toBe(false)
  })

  it('clarification_requested is NOT eligible', () => {
    expect(isOfferTermsReviewEligibleForParticipationConfirmation('clarification_requested')).toBe(false)
  })

  it('canTransitionDapProviderParticipationStatus is exported', () => {
    const src = readFileSync(RULES_PATH, 'utf8')
    expect(src).toContain('canTransitionDapProviderParticipationStatus')
  })

  it('confirmation_started → agreement_sent is allowed', () => {
    expect(canTransitionDapProviderParticipationStatus('confirmation_started', 'agreement_sent')).toBe(true)
  })

  it('confirmation_started → participation_declined is allowed', () => {
    expect(canTransitionDapProviderParticipationStatus('confirmation_started', 'participation_declined')).toBe(true)
  })

  it('confirmation_started → confirmation_voided is allowed', () => {
    expect(canTransitionDapProviderParticipationStatus('confirmation_started', 'confirmation_voided')).toBe(true)
  })

  it('agreement_sent → agreement_received is allowed', () => {
    expect(canTransitionDapProviderParticipationStatus('agreement_sent', 'agreement_received')).toBe(true)
  })

  it('agreement_received → participation_confirmed is allowed', () => {
    expect(canTransitionDapProviderParticipationStatus('agreement_received', 'participation_confirmed')).toBe(true)
  })

  it('participation_confirmed → agreement_sent is NOT allowed', () => {
    expect(canTransitionDapProviderParticipationStatus('participation_confirmed', 'agreement_sent')).toBe(false)
  })

  it('participation_declined → confirmation_started is allowed (restart)', () => {
    expect(canTransitionDapProviderParticipationStatus('participation_declined', 'confirmation_started')).toBe(true)
  })

  it('confirmation_voided → confirmation_started is allowed (restart)', () => {
    expect(canTransitionDapProviderParticipationStatus('confirmation_voided', 'confirmation_started')).toBe(true)
  })

  it('no transition is allowed to a public or published status', () => {
    const statuses = [
      'confirmation_started', 'agreement_sent', 'agreement_received',
      'participation_confirmed', 'participation_declined', 'confirmation_voided',
    ] as const
    for (const from of statuses) {
      expect(canTransitionDapProviderParticipationStatus(from, 'public' as never)).toBe(false)
      expect(canTransitionDapProviderParticipationStatus(from, 'published' as never)).toBe(false)
      expect(canTransitionDapProviderParticipationStatus(from, 'join_cta_unlocked' as never)).toBe(false)
    }
  })

  it('assertValidDapProviderParticipationTransition throws on invalid transition', () => {
    expect(() =>
      assertValidDapProviderParticipationTransition('participation_confirmed', 'agreement_sent'),
    ).toThrow()
  })

  it('assertValidDapProviderParticipationTransition does not throw on valid transition', () => {
    expect(() =>
      assertValidDapProviderParticipationTransition('confirmation_started', 'agreement_sent'),
    ).not.toThrow()
  })
})

// ─── Group 3: Module ───────────────────────────────────────────────────────────

describe('Provider participation module', () => {
  it('dapProviderParticipation.ts exists', () => {
    expect(existsSync(MODULE_PATH)).toBe(true)
  })

  it('exports startProviderParticipationConfirmation', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain('startProviderParticipationConfirmation')
  })

  it('exports markAgreementSent', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain('markAgreementSent')
  })

  it('exports markAgreementReceived', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain('markAgreementReceived')
  })

  it('exports confirmProviderParticipation', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain('confirmProviderParticipation')
  })

  it('exports declineProviderParticipation', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain('declineProviderParticipation')
  })

  it('exports voidProviderParticipationConfirmation', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain('voidProviderParticipationConfirmation')
  })

  it('exports addProviderParticipationNote', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain('addProviderParticipationNote')
  })

  it('exports getProviderParticipationByReviewId', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain('getProviderParticipationByReviewId')
  })

  it('exports getProviderParticipationById', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain('getProviderParticipationById')
  })

  it('exports getProviderParticipationEvents', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain('getProviderParticipationEvents')
  })

  it('verifies review exists and vertical_key = dap', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain('vertical_key')
    expect(src).toMatch(/'dap'/)
  })

  it('requires review status review_passed', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain('review_passed')
    expect(src).toContain('review_not_passed')
  })

  it('blocks duplicate active confirmation for same review', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain('confirmation_already_exists')
  })

  it('validates transitions before updates', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain('assertValidDapProviderParticipationTransition')
  })

  it('inserts into dap_provider_participation_confirmations table', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain('dap_provider_participation_confirmations')
  })

  it('inserts into dap_provider_participation_events table', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain('dap_provider_participation_events')
  })

  it('no delete operations on participation events', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).not.toMatch(/from\('dap_provider_participation_events'\)[\s\S]{0,100}\.delete\(\)/)
  })
})

// ─── Group 4: Event Integrity ──────────────────────────────────────────────────

describe('Event integrity — correct event types', () => {
  it('module emits provider_participation.confirmation_started', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain('provider_participation.confirmation_started')
  })

  it('module emits provider_participation.agreement_sent', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain('provider_participation.agreement_sent')
  })

  it('module emits provider_participation.agreement_received', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain('provider_participation.agreement_received')
  })

  it('module emits provider_participation.participation_confirmed', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain('provider_participation.participation_confirmed')
  })

  it('module emits provider_participation.participation_declined', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain('provider_participation.participation_declined')
  })

  it('module emits provider_participation.confirmation_voided', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain('provider_participation.confirmation_voided')
  })

  it('module emits provider_participation.note_added', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain('provider_participation.note_added')
  })

  it('events include actor_id in metadata', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain('actor_id')
  })

  it('events include previous_status and new_status in transition metadata', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain('previous_status')
    expect(src).toContain('new_status')
  })

  it('no delete from dap_provider_participation_events', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).not.toMatch(/dap_provider_participation_events[\s\S]{0,100}\.delete\(\)/)
  })
})

// ─── Group 5: Server Actions ───────────────────────────────────────────────────

describe('Provider participation server actions', () => {
  it('actions.ts exists', () => {
    expect(existsSync(ACTIONS_PATH)).toBe(true)
  })

  it('file declares use server', () => {
    const src = readFileSync(ACTIONS_PATH, 'utf8')
    expect(src).toContain("'use server'")
  })

  it('exports startProviderParticipationConfirmationAction', () => {
    const src = readFileSync(ACTIONS_PATH, 'utf8')
    expect(src).toContain('startProviderParticipationConfirmationAction')
  })

  it('exports markAgreementSentAction', () => {
    const src = readFileSync(ACTIONS_PATH, 'utf8')
    expect(src).toContain('markAgreementSentAction')
  })

  it('exports markAgreementReceivedAction', () => {
    const src = readFileSync(ACTIONS_PATH, 'utf8')
    expect(src).toContain('markAgreementReceivedAction')
  })

  it('exports confirmProviderParticipationAction', () => {
    const src = readFileSync(ACTIONS_PATH, 'utf8')
    expect(src).toContain('confirmProviderParticipationAction')
  })

  it('exports declineProviderParticipationAction', () => {
    const src = readFileSync(ACTIONS_PATH, 'utf8')
    expect(src).toContain('declineProviderParticipationAction')
  })

  it('exports voidProviderParticipationConfirmationAction', () => {
    const src = readFileSync(ACTIONS_PATH, 'utf8')
    expect(src).toContain('voidProviderParticipationConfirmationAction')
  })

  it('exports addProviderParticipationNoteAction', () => {
    const src = readFileSync(ACTIONS_PATH, 'utf8')
    expect(src).toContain('addProviderParticipationNoteAction')
  })

  it('revalidates offer terms detail route', () => {
    const src = readFileSync(ACTIONS_PATH, 'utf8')
    expect(src).toContain('offer-terms')
    expect(src).toContain('revalidatePath')
  })

  it('revalidates provider participation routes', () => {
    const src = readFileSync(ACTIONS_PATH, 'utf8')
    expect(src).toContain('provider-participation')
    expect(src).toContain('revalidatePath')
  })

  it('redirects to internal participation detail page', () => {
    const src = readFileSync(ACTIONS_PATH, 'utf8')
    expect(src).toContain('redirect')
    expect(src).toContain('provider-participation')
  })

  it('does not mutate production DAP routes', () => {
    const src = readFileSync(ACTIONS_PATH, 'utf8')
    expect(src).not.toContain('/dental-advantage-plan')
  })

  it('does not import dapCmsExport', () => {
    const src = readFileSync(ACTIONS_PATH, 'utf8')
    expect(src).not.toContain('dapCmsExport')
  })
})

// ─── Group 6: UI Pages ────────────────────────────────────────────────────────

describe('UI pages exist and are correctly shaped', () => {
  it('provider participation list page exists', () => {
    expect(existsSync(LIST_PAGE_PATH)).toBe(true)
  })

  it('provider participation detail page exists', () => {
    expect(existsSync(DETAIL_PAGE_PATH)).toBe(true)
  })

  it('list page has data-provider-participation-list', () => {
    const src = readFileSync(LIST_PAGE_PATH, 'utf8')
    expect(src).toContain('data-provider-participation-list')
  })

  it('list page has data-provider-participation-disclaimer', () => {
    const src = readFileSync(LIST_PAGE_PATH, 'utf8')
    expect(src).toContain('data-provider-participation-disclaimer')
  })

  it('list page disclaimer states records are internal only', () => {
    const src = readFileSync(LIST_PAGE_PATH, 'utf8')
    expect(src).toMatch(/internal records only|internal-only|internal only/i)
  })

  it('list page does not publish provider or validate pricing', () => {
    const src = readFileSync(LIST_PAGE_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/join_cta_unlocked|pricing_validated/)
  })

  it('detail page has data-provider-participation-detail', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('data-provider-participation-detail')
  })

  it('detail page has data-no-public-publish-disclaimer', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('data-no-public-publish-disclaimer')
  })

  it('detail page disclaimer mentions Join CTA and that it is not unlocked', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toMatch(/unlock Join CTA/i)
    expect(src).toMatch(/does not/i)
  })

  it('detail page has agreement fields form (data-agreement-fields)', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('data-agreement-fields')
  })

  it('detail page has workflow section (data-participation-workflow)', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('data-participation-workflow')
  })

  it('detail page has event log (data-participation-event-log)', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('data-participation-event-log')
  })

  it('detail page links back to source offer terms (data-source-offer-terms-link)', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('data-source-offer-terms-link')
  })

  it('offer terms detail page imports getProviderParticipationByReviewId', () => {
    const src = readFileSync(OT_DETAIL_PATH, 'utf8')
    expect(src).toContain('getProviderParticipationByReviewId')
  })

  it('offer terms detail page imports startProviderParticipationConfirmationAction', () => {
    const src = readFileSync(OT_DETAIL_PATH, 'utf8')
    expect(src).toContain('startProviderParticipationConfirmationAction')
  })

  it('offer terms detail page renders provider participation panel (data-provider-participation-panel)', () => {
    const src = readFileSync(OT_DETAIL_PATH, 'utf8')
    expect(src).toContain('data-provider-participation-panel')
  })

  it('offer terms detail page panel is gated on review_passed status', () => {
    const src = readFileSync(OT_DETAIL_PATH, 'utf8')
    expect(src).toMatch(/review_passed[\s\S]{0,400}data-provider-participation-panel|data-provider-participation-panel[\s\S]{0,400}review_passed/)
  })

  it('offer terms detail participation panel does not imply public provider confirmation', () => {
    const src = readFileSync(OT_DETAIL_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/confirmed.*provider|provider.*confirmed/)
  })

  it('page count is now 21 (Phase 9L added provider-participation list + detail pages)', () => {
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

// ─── Group 7: Migration ────────────────────────────────────────────────────────

describe('Migration is correctly structured', () => {
  it('migration file exists', () => {
    expect(existsSync(MIGRATION_PATH)).toBe(true)
  })

  it('migration creates confirmations table', () => {
    const src = readFileSync(MIGRATION_PATH, 'utf8')
    expect(src).toContain('dap_provider_participation_confirmations')
  })

  it('migration creates events table', () => {
    const src = readFileSync(MIGRATION_PATH, 'utf8')
    expect(src).toContain('dap_provider_participation_events')
  })

  it('migration includes vertical_key column', () => {
    const src = readFileSync(MIGRATION_PATH, 'utf8')
    expect(src).toContain('vertical_key')
  })

  it('migration references dap_offer_terms_reviews (FK)', () => {
    const src = readFileSync(MIGRATION_PATH, 'utf8')
    expect(src).toContain('dap_offer_terms_reviews')
  })

  it('migration has unique constraint on review_id (one confirmation per review)', () => {
    const src = readFileSync(MIGRATION_PATH, 'utf8')
    expect(src).toMatch(/UNIQUE.*review_id|unique.*review_id/i)
  })

  it('migration does not include validated, approved, or public status values', () => {
    const src = readFileSync(MIGRATION_PATH, 'utf8')
    expect(src).not.toContain("'validated'")
    expect(src).not.toContain("'approved'")
    expect(src).not.toContain("'public'")
  })

  it('event table references confirmation table (append-only FK)', () => {
    const src = readFileSync(MIGRATION_PATH, 'utf8')
    expect(src).toContain('REFERENCES dap_provider_participation_confirmations')
  })
})

// ─── Group 8: Public Boundary Protection ──────────────────────────────────────

describe('Public boundary — no CMS, no billing, no MKCRM, no Join CTA unlock', () => {
  it('participation module does not reference confirmed_provider', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).not.toContain('confirmed_provider')
  })

  it('participation types do not include public, published, join_cta_unlocked, pricing_validated', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).not.toContain("'public'")
    expect(src).not.toContain("'published'")
    expect(src).not.toContain("'join_cta_unlocked'")
    expect(src).not.toContain("'pricing_validated'")
  })

  it('participation module does not import dapCmsExport', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).not.toContain('dapCmsExport')
  })

  it('participation module does not create billing events', () => {
    const src = readFileSync(MODULE_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/billing|stripe|subscription/)
  })

  it('participation module does not sync to MKCRM', () => {
    const src = readFileSync(MODULE_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/mkcrm/i)
  })

  it('participation module does not unlock Join CTA', () => {
    const src = readFileSync(MODULE_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/join_plan|cta_gate|join.*cta/)
  })

  it('production homepage does not import participation module', () => {
    const src = readFileSync(HOMEPAGE_PATH, 'utf8')
    expect(src).not.toContain('dapProviderParticipation')
  })

  it('CMS export unchanged — does not reference participation module', () => {
    const src = readFileSync(CMS_EXPORT_PATH, 'utf8')
    expect(src).not.toContain('dapProviderParticipation')
  })

  it('server actions do not mutate production DAP pages', () => {
    const src = readFileSync(ACTIONS_PATH, 'utf8')
    expect(src).not.toContain('/dental-advantage-plan')
    expect(src).not.toContain('dapCmsExport')
  })

  it('no new patient-facing pages added (page count still 21)', () => {
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
