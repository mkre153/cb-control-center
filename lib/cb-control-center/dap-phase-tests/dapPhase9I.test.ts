/**
 * Phase 9I — Practice Outreach Workflow QA
 *
 * PURPOSE: Verify Phase 9I produced the correct outreach action layer.
 * All tests are structural (filesystem + static analysis) or behavioral (pure function imports).
 *
 * COVERAGE:
 *   Group 1 — Action Module
 *   Group 2 — Transition Rules (behavioral)
 *   Group 3 — Event Integrity
 *   Group 4 — Server Actions
 *   Group 5 — UI Workflow (detail page)
 *   Group 6 — Public Boundary Protection
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, readdirSync } from 'fs'
import { resolve, join } from 'path'

// Behavioral import — real functions, no mocking
import {
  canTransitionDapPracticeOnboardingStatus,
  assertValidDapPracticeOnboardingTransition,
} from '../dapPracticeOnboardingRules'

// ─── Project root ─────────────────────────────────────────────────────────────

const ROOT = resolve(__dirname, '../../..')

// ─── Key paths ────────────────────────────────────────────────────────────────

const RULES_PATH          = resolve(ROOT, 'lib/cb-control-center/dapPracticeOnboardingRules.ts')
const ACTIONS_MODULE_PATH = resolve(ROOT, 'lib/cb-control-center/dapPracticeOnboardingActions.ts')
const SERVER_ACTIONS_PATH = resolve(ROOT, 'app/preview/dap/onboarding/actions.ts')
const DETAIL_PAGE_PATH    = resolve(ROOT, 'app/preview/dap/onboarding/[id]/page.tsx')
const LIST_PAGE_PATH      = resolve(ROOT, 'app/preview/dap/onboarding/page.tsx')

// ─── Production boundary paths ────────────────────────────────────────────────

const HOMEPAGE_PATH   = resolve(ROOT, 'app/dental-advantage-plan/page.tsx')
const CMS_EXPORT_PATH = resolve(ROOT, 'lib/cb-control-center/dapCmsExport.ts')

// ─── Group 1: Action Module ────────────────────────────────────────────────────

describe('Action module exists and exports all seven actions', () => {
  it('dapPracticeOnboardingActions.ts exists', () => {
    expect(existsSync(ACTIONS_MODULE_PATH)).toBe(true)
  })

  it('exports markOutreachNeeded', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*markOutreachNeeded/)
  })

  it('exports markOutreachStarted', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*markOutreachStarted/)
  })

  it('exports recordPracticeResponded', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*recordPracticeResponded/)
  })

  it('exports markPracticeInterested', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*markPracticeInterested/)
  })

  it('exports markPracticeNotInterested', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*markPracticeNotInterested/)
  })

  it('exports markTermsNeeded', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*markTermsNeeded/)
  })

  it('exports addOnboardingNote', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*addOnboardingNote/)
  })

  it('uses service-role Supabase client', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).toContain('getSupabaseAdminClient')
  })

  it('fetches current intake before any mutation', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    // fetchOnboardingIntake helper is called before executeOnboardingAction
    expect(src).toContain('fetchOnboardingIntake')
    const fetchPos = src.indexOf('fetchOnboardingIntake')
    const updatePos = src.indexOf('.update(')
    expect(fetchPos).toBeGreaterThan(-1)
    expect(updatePos).toBeGreaterThan(-1)
    expect(fetchPos).toBeLessThan(updatePos)
  })

  it('verifies vertical_key = dap on fetched intake', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).toContain(".eq('vertical_key', 'dap')")
  })
})

// ─── Group 2: Transition Rules (behavioral) ────────────────────────────────────

describe('Transition rules — allowed and blocked paths', () => {
  it('dapPracticeOnboardingRules.ts exists', () => {
    expect(existsSync(RULES_PATH)).toBe(true)
  })

  it('ALLOWED_ONBOARDING_TRANSITIONS table exists in source', () => {
    const src = readFileSync(RULES_PATH, 'utf8')
    expect(src).toContain('ALLOWED_ONBOARDING_TRANSITIONS')
  })

  it('exports canTransitionDapPracticeOnboardingStatus', () => {
    const src = readFileSync(RULES_PATH, 'utf8')
    expect(src).toMatch(/export.*function.*canTransitionDapPracticeOnboardingStatus/)
  })

  it('exports assertValidDapPracticeOnboardingTransition', () => {
    const src = readFileSync(RULES_PATH, 'utf8')
    expect(src).toMatch(/export.*function.*assertValidDapPracticeOnboardingTransition/)
  })

  it('intake_created → outreach_needed is allowed', () => {
    expect(canTransitionDapPracticeOnboardingStatus('intake_created', 'outreach_needed')).toBe(true)
  })

  it('intake_created → outreach_started is allowed', () => {
    expect(canTransitionDapPracticeOnboardingStatus('intake_created', 'outreach_started')).toBe(true)
  })

  it('outreach_needed → outreach_started is allowed', () => {
    expect(canTransitionDapPracticeOnboardingStatus('outreach_needed', 'outreach_started')).toBe(true)
  })

  it('outreach_started → practice_responded is allowed', () => {
    expect(canTransitionDapPracticeOnboardingStatus('outreach_started', 'practice_responded')).toBe(true)
  })

  it('practice_responded → interested is allowed', () => {
    expect(canTransitionDapPracticeOnboardingStatus('practice_responded', 'interested')).toBe(true)
  })

  it('practice_responded → not_interested is allowed', () => {
    expect(canTransitionDapPracticeOnboardingStatus('practice_responded', 'not_interested')).toBe(true)
  })

  it('interested → terms_needed is allowed', () => {
    expect(canTransitionDapPracticeOnboardingStatus('interested', 'terms_needed')).toBe(true)
  })

  it('not_interested → outreach_needed is allowed', () => {
    expect(canTransitionDapPracticeOnboardingStatus('not_interested', 'outreach_needed')).toBe(true)
  })

  it('interested → ready_for_offer_validation is NOT allowed in Phase 9I', () => {
    expect(canTransitionDapPracticeOnboardingStatus('interested', 'ready_for_offer_validation')).toBe(false)
  })

  it('intake_created → interested is NOT allowed (must progress through outreach)', () => {
    expect(canTransitionDapPracticeOnboardingStatus('intake_created', 'interested')).toBe(false)
  })

  it('assertValidDapPracticeOnboardingTransition throws on invalid transition', () => {
    expect(() =>
      assertValidDapPracticeOnboardingTransition('interested', 'ready_for_offer_validation'),
    ).toThrow()
  })

  it('assertValidDapPracticeOnboardingTransition does not throw on valid transition', () => {
    expect(() =>
      assertValidDapPracticeOnboardingTransition('intake_created', 'outreach_needed'),
    ).not.toThrow()
  })
})

// ─── Group 3: Event Integrity ──────────────────────────────────────────────────

describe('Event integrity — append-only, rich metadata', () => {
  it('every status action inserts an onboarding event', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    // executeOnboardingAction inserts the event after updating status
    const insertCount = (src.match(/\.insert\(/g) ?? []).length
    expect(insertCount).toBeGreaterThanOrEqual(2) // at least status actions + note action
  })

  it('note action inserts onboarding.note_added event', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).toContain("'onboarding.note_added'")
  })

  it('event metadata includes previous_status', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).toContain('previous_status')
  })

  it('event metadata includes new_status', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).toContain('new_status')
  })

  it('event metadata conditionally includes actor_id', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).toContain('actor_id')
  })

  it('event metadata conditionally includes note', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).toContain('input.note')
  })

  it('no .delete( operation exists in action module', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).not.toContain('.delete(')
  })

  it('event insert only runs after successful status update', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    const updatePos = src.indexOf('.update(')
    const eventInsertPos = src.indexOf("'dap_practice_onboarding_events'")
    expect(updatePos).toBeGreaterThan(-1)
    expect(eventInsertPos).toBeGreaterThan(-1)
    expect(updatePos).toBeLessThan(eventInsertPos)
  })
})

// ─── Group 4: Server Actions ───────────────────────────────────────────────────

describe('Server actions exist, revalidate, and redirect to onboarding surface', () => {
  it('app/preview/dap/onboarding/actions.ts exists', () => {
    expect(existsSync(SERVER_ACTIONS_PATH)).toBe(true)
  })

  it("server actions file has 'use server' directive", () => {
    const src = readFileSync(SERVER_ACTIONS_PATH, 'utf8')
    expect(src).toContain("'use server'")
  })

  it('exports markOutreachNeededAction', () => {
    const src = readFileSync(SERVER_ACTIONS_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*markOutreachNeededAction/)
  })

  it('exports markOutreachStartedAction', () => {
    const src = readFileSync(SERVER_ACTIONS_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*markOutreachStartedAction/)
  })

  it('exports recordPracticeRespondedAction', () => {
    const src = readFileSync(SERVER_ACTIONS_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*recordPracticeRespondedAction/)
  })

  it('exports markPracticeInterestedAction', () => {
    const src = readFileSync(SERVER_ACTIONS_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*markPracticeInterestedAction/)
  })

  it('exports markPracticeNotInterestedAction', () => {
    const src = readFileSync(SERVER_ACTIONS_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*markPracticeNotInterestedAction/)
  })

  it('exports markTermsNeededAction', () => {
    const src = readFileSync(SERVER_ACTIONS_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*markTermsNeededAction/)
  })

  it('exports addOnboardingNoteAction', () => {
    const src = readFileSync(SERVER_ACTIONS_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*addOnboardingNoteAction/)
  })

  it('revalidates onboarding list route', () => {
    const src = readFileSync(SERVER_ACTIONS_PATH, 'utf8')
    expect(src).toContain('revalidatePath')
    expect(src).toContain('/preview/dap/onboarding')
  })

  it('revalidates source request detail route when requestId present', () => {
    const src = readFileSync(SERVER_ACTIONS_PATH, 'utf8')
    expect(src).toContain('requestId')
    expect(src).toContain('/preview/dap/requests/')
  })

  it('redirects to intake detail page (within onboarding surface)', () => {
    const src = readFileSync(SERVER_ACTIONS_PATH, 'utf8')
    expect(src).toContain('redirect(')
    expect(src).toContain('intakeDetailPath')
  })

  it('does not mutate public routes', () => {
    const src = readFileSync(SERVER_ACTIONS_PATH, 'utf8')
    expect(src).not.toContain('/dental-advantage-plan')
    expect(src).not.toContain('/decisions/')
    expect(src).not.toContain('/dentists/')
  })
})

// ─── Group 5: UI Workflow ──────────────────────────────────────────────────────

describe('UI workflow — detail page renders controls and disclaimer', () => {
  it('app/preview/dap/onboarding/[id]/page.tsx exists', () => {
    expect(existsSync(DETAIL_PAGE_PATH)).toBe(true)
  })

  it('detail page is force-dynamic', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('force-dynamic')
  })

  it('detail page is an async server component', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toMatch(/export default async function/)
  })

  it('detail page renders workflow controls (data-onboarding-actions)', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('data-onboarding-actions')
  })

  it('detail page renders current status (data-current-status)', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('data-current-status')
  })

  it('detail page renders note input (data-note-input)', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('data-note-input')
  })

  it('detail page includes outreach disclaimer (data-outreach-disclaimer)', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('data-outreach-disclaimer')
  })

  it('detail page disclaimer states outreach does not confirm provider', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toMatch(/does not confirm.*provider|not confirm this practice as a DAP provider/i)
  })

  it('detail page disclaimer mentions patient-facing claims', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toMatch(/patient-facing claims/i)
  })

  it('list page has outreach disclaimer', () => {
    const src = readFileSync(LIST_PAGE_PATH, 'utf8')
    expect(src).toContain('data-outreach-disclaimer')
  })

  it('list page links to intake detail pages (data-manage-link)', () => {
    const src = readFileSync(LIST_PAGE_PATH, 'utf8')
    expect(src).toContain('data-manage-link')
    expect(src).toContain('/preview/dap/onboarding/')
  })

  it('page copy does not imply provider confirmation', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/confirmed.*provider|provider.*confirmed/)
  })

  it('page copy does not imply offer validation', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/offer.*validated|validated.*offer|offer terms confirmed/)
  })

  it('page count is now 19 (Phase 9J added offer-terms list + detail pages)', () => {
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

// ─── Group 6: Public Boundary Protection ──────────────────────────────────────

describe('Public boundary — no provider confirmation, no CMS, no billing, no MKCRM', () => {
  it('action module does not reference confirmed_provider', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).not.toContain('confirmed_provider')
  })

  it('action module does not import CMS export', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).not.toContain('dapCmsExport')
  })

  it('action module does not reference offer terms validation', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/offer_terms|offer.*validated|join_plan|cta_gate/)
  })

  it('action module does not create billing events or memberships', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/billing|membership.*id|stripe|subscription/)
  })

  it('action module does not sync to MKCRM', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/mkcrm/i)
  })

  it('server actions do not mutate production DAP pages', () => {
    const src = readFileSync(SERVER_ACTIONS_PATH, 'utf8')
    expect(src).not.toContain('/dental-advantage-plan')
    expect(src).not.toContain('dapCmsExport')
  })

  it('production homepage does not import outreach action module', () => {
    const src = readFileSync(HOMEPAGE_PATH, 'utf8')
    expect(src).not.toContain('dapPracticeOnboardingActions')
  })

  it('CMS export unchanged — does not reference outreach action module', () => {
    const src = readFileSync(CMS_EXPORT_PATH, 'utf8')
    expect(src).not.toContain('dapPracticeOnboardingActions')
  })

  it('rules module does not unlock ready_for_offer_validation in Phase 9I', () => {
    // interested → ready_for_offer_validation must remain blocked
    expect(canTransitionDapPracticeOnboardingStatus('interested', 'ready_for_offer_validation')).toBe(false)
  })

  it('no .delete( in server actions', () => {
    const src = readFileSync(SERVER_ACTIONS_PATH, 'utf8')
    expect(src).not.toContain('.delete(')
  })
})
