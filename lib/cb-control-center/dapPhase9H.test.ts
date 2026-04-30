/**
 * Phase 9H — Approved Request to Practice Onboarding Intake QA
 *
 * PURPOSE: Verify Phase 9H produced the correct onboarding intake layer.
 * All tests are structural (filesystem + static analysis).
 *
 * COVERAGE:
 *   Group 1 — Type layer exists and is correctly shaped
 *   Group 2 — Intake creation rules enforced in module
 *   Group 3 — Event integrity (append-only, rich metadata)
 *   Group 4 — UI integration (request detail shows panel for approved only)
 *   Group 5 — Onboarding list page exists and is read-only
 *   Group 6 — Public boundary protection
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve, join } from 'path'

// ─── Project root ─────────────────────────────────────────────────────────────

const ROOT = resolve(__dirname, '../..')

// ─── Key paths ────────────────────────────────────────────────────────────────

const TYPES_PATH          = resolve(ROOT, 'lib/cb-control-center/dapPracticeOnboardingTypes.ts')
const MODULE_PATH         = resolve(ROOT, 'lib/cb-control-center/dapPracticeOnboarding.ts')
const SERVER_ACTION_PATH  = resolve(ROOT, 'app/preview/dap/requests/[id]/onboardingActions.ts')
const DETAIL_PAGE_PATH    = resolve(ROOT, 'app/preview/dap/requests/[id]/page.tsx')
const LIST_PAGE_PATH      = resolve(ROOT, 'app/preview/dap/onboarding/page.tsx')
const MIGRATION_PATH      = resolve(ROOT, 'supabase/migrations/20260429000001_dap_practice_onboarding.sql')

// ─── Production boundary paths ────────────────────────────────────────────────

const HOMEPAGE_PATH   = resolve(ROOT, 'app/dental-advantage-plan/page.tsx')
const CMS_EXPORT_PATH = resolve(ROOT, 'lib/cb-control-center/dapCmsExport.ts')

// ─── Group 1: Type layer ───────────────────────────────────────────────────────

describe('Type layer exists and is correctly shaped', () => {
  it('dapPracticeOnboardingTypes.ts exists', () => {
    expect(existsSync(TYPES_PATH)).toBe(true)
  })

  it('DapPracticeOnboardingIntake interface is exported', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain('DapPracticeOnboardingIntake')
  })

  it('DapPracticeOnboardingStatus type is exported', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain('DapPracticeOnboardingStatus')
  })

  it('DapPracticeOnboardingEventType type is exported', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain('DapPracticeOnboardingEventType')
  })

  it('DapPracticeOnboardingEvent interface is exported', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain('DapPracticeOnboardingEvent')
  })

  it('DapPracticeOnboardingResult result type is exported', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain('DapPracticeOnboardingResult')
  })

  it('DapPracticeOnboardingFailureCode is exported', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain('DapPracticeOnboardingFailureCode')
  })

  it('status type does NOT include confirmed_provider', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).not.toContain('confirmed_provider')
    expect(src).not.toContain('confirmed_dap_provider')
  })

  it('status type includes intake_created', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain("'intake_created'")
  })

  it('status type includes ready_for_offer_validation', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain("'ready_for_offer_validation'")
  })

  it('event type uses dot notation (onboarding.intake_created)', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain("'onboarding.intake_created'")
  })

  it('result type uses ok: true / ok: false union', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain('ok: true')
    expect(src).toContain('ok: false')
  })

  it('migration file exists for onboarding tables', () => {
    expect(existsSync(MIGRATION_PATH)).toBe(true)
  })
})

// ─── Group 2: Intake creation rules ───────────────────────────────────────────

describe('Intake creation rules enforced in module', () => {
  it('dapPracticeOnboarding.ts exists', () => {
    expect(existsSync(MODULE_PATH)).toBe(true)
  })

  it('exports createOnboardingIntakeFromApprovedRequest', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*createOnboardingIntakeFromApprovedRequest/)
  })

  it('exports getOnboardingIntakeByRequestId', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*getOnboardingIntakeByRequestId/)
  })

  it('exports listOnboardingIntakes', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*listOnboardingIntakes/)
  })

  it('exports getOnboardingIntakeEvents', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*getOnboardingIntakeEvents/)
  })

  it('verifies request exists before creating intake', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain('dap_requests')
    expect(src).toContain('maybeSingle')
  })

  it("verifies vertical_key = 'dap' on the source request", () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain("'dap'")
    expect(src).toContain('vertical_key')
  })

  it("requires request status to be 'approved' before creating intake", () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain("'approved'")
    expect(src).toContain("'request_not_approved'")
  })

  it('blocks duplicate intake creation for the same request', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain("'intake_already_exists'")
    // Must check for existing intake before inserting
    const existingCheckPos = src.indexOf('intake_already_exists')
    const insertPos = src.indexOf('.insert(')
    expect(existingCheckPos).toBeLessThan(insertPos)
  })

  it('returns typed success/failure result with ok field', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain('ok: true')
    expect(src).toContain('ok: false')
  })

  it("returns 'request_not_found' failure code", () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain("'request_not_found'")
  })

  it("returns 'intake_create_failed' failure code", () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain("'intake_create_failed'")
  })

  it('uses service-role Supabase client', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain('getSupabaseAdminClient')
  })
})

// ─── Group 3: Event integrity ──────────────────────────────────────────────────

describe('Event integrity — append-only, metadata includes request id, actor, note', () => {
  it("creates event of type 'onboarding.intake_created'", () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain("'onboarding.intake_created'")
  })

  it('event metadata includes source_request_id', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain('source_request_id')
  })

  it('event metadata conditionally includes actor_id', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain('actor_id')
  })

  it('event metadata conditionally includes note', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain('input.note')
  })

  it('event insert uses .insert( (append-only)', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain('.insert(')
  })

  it('no .delete( operation exists against onboarding events', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).not.toContain('.delete(')
  })

  it('event insert only runs after successful intake creation', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    const intakeInsertPos = src.indexOf("'dap_practice_onboarding_intakes'")
    const eventInsertPos = src.indexOf("'dap_practice_onboarding_events'")
    expect(intakeInsertPos).toBeGreaterThan(-1)
    expect(eventInsertPos).toBeGreaterThan(-1)
    expect(intakeInsertPos).toBeLessThan(eventInsertPos)
  })

  it("actor_type is set to 'admin' for onboarding events", () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).toContain("actor_type:  'admin'")
  })
})

// ─── Group 4: UI integration ───────────────────────────────────────────────────

describe('UI integration — onboarding panel shown only for approved requests', () => {
  it('detail page imports createOnboardingFromRequestAction', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('createOnboardingFromRequestAction')
  })

  it('detail page imports getOnboardingIntakeByRequestId', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('getOnboardingIntakeByRequestId')
  })

  it("detail page renders onboarding panel only when status === 'approved'", () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain("request.request_status === 'approved'")
    expect(src).toContain('data-onboarding-panel')
  })

  it('detail page has data-onboarding-disclaimer text', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('data-onboarding-disclaimer')
  })

  it('disclaimer states intake does not confirm provider', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toMatch(/does not confirm.*provider|confirm.*practice as a DAP provider/i)
  })

  it('disclaimer states intake does not publish patient-facing claims', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toMatch(/patient-facing claims/i)
  })

  it('detail page shows intake status when intake already exists', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('data-intake-exists')
    expect(src).toContain('data-intake-status')
  })

  it('onboarding server action revalidates request detail route', () => {
    const src = readFileSync(SERVER_ACTION_PATH, 'utf8')
    expect(src).toContain('revalidatePath')
    expect(src).toContain('requestId')
  })

  it('onboarding server action revalidates onboarding list route', () => {
    const src = readFileSync(SERVER_ACTION_PATH, 'utf8')
    expect(src).toContain('/preview/dap/onboarding')
  })

  it("server action treats 'intake_already_exists' as graceful (no throw)", () => {
    const src = readFileSync(SERVER_ACTION_PATH, 'utf8')
    expect(src).toContain('intake_already_exists')
  })
})

// ─── Group 5: Onboarding list page ────────────────────────────────────────────

describe('Onboarding list page exists and is read-only', () => {
  it('app/preview/dap/onboarding/page.tsx exists', () => {
    expect(existsSync(LIST_PAGE_PATH)).toBe(true)
  })

  it('list page is under app/preview (not production)', () => {
    expect(LIST_PAGE_PATH).toContain('/preview/')
  })

  it('list page imports listOnboardingIntakes', () => {
    const src = readFileSync(LIST_PAGE_PATH, 'utf8')
    expect(src).toContain('listOnboardingIntakes')
  })

  it('list page is an async server component', () => {
    const src = readFileSync(LIST_PAGE_PATH, 'utf8')
    expect(src).toMatch(/export default async function/)
  })

  it('list page is force-dynamic (reads live Supabase data)', () => {
    const src = readFileSync(LIST_PAGE_PATH, 'utf8')
    expect(src).toContain('force-dynamic')
  })

  it('list page does not use "use client"', () => {
    const src = readFileSync(LIST_PAGE_PATH, 'utf8')
    expect(src).not.toContain("'use client'")
  })

  it('list page has no mutation forms or submit buttons', () => {
    const src = readFileSync(LIST_PAGE_PATH, 'utf8')
    expect(src).not.toMatch(/<button.*type=['"]submit/i)
    expect(src).not.toMatch(/<form\b/i)
  })

  it('list page renders intake status', () => {
    const src = readFileSync(LIST_PAGE_PATH, 'utf8')
    expect(src).toContain('data-intake-status')
  })

  it('list page links to source request detail pages', () => {
    const src = readFileSync(LIST_PAGE_PATH, 'utf8')
    expect(src).toContain('/preview/dap/requests/')
    expect(src).toContain('data-source-request-link')
  })

  it('list page has data-empty-state for zero intakes', () => {
    const src = readFileSync(LIST_PAGE_PATH, 'utf8')
    expect(src).toContain('data-empty-state')
  })

  it('page count is now 16 (Phase 9H added onboarding list)', () => {
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
    expect(pages.length).toBe(16)
  })
})

// ─── Group 6: Public boundary protection ──────────────────────────────────────

describe('Public boundary protection — no provider confirmation, no CMS, no billing', () => {
  it('onboarding module does not reference confirmed_provider', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).not.toContain('confirmed_provider')
  })

  it('onboarding types do not include confirmed_provider status', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).not.toContain('confirmed_provider')
  })

  it('onboarding module does not import CMS export', () => {
    const src = readFileSync(MODULE_PATH, 'utf8')
    expect(src).not.toContain('dapCmsExport')
  })

  it('onboarding module does not reference Join CTA or offer terms', () => {
    const src = readFileSync(MODULE_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/join_plan|offer_terms|cta_gate/)
  })

  it('onboarding module does not create billing events or memberships', () => {
    const src = readFileSync(MODULE_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/billing|membership.*id|stripe|subscription/)
  })

  it('onboarding module does not sync to GHL', () => {
    const src = readFileSync(MODULE_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/ghl|gohighlevel/)
  })

  it('production homepage does not import onboarding module', () => {
    const src = readFileSync(HOMEPAGE_PATH, 'utf8')
    expect(src).not.toContain('dapPracticeOnboarding')
  })

  it('CMS export unchanged — does not reference onboarding module', () => {
    const src = readFileSync(CMS_EXPORT_PATH, 'utf8')
    expect(src).not.toContain('dapPracticeOnboarding')
  })

  it('migration does not include confirmed_dap_provider status value', () => {
    const src = readFileSync(MIGRATION_PATH, 'utf8')
    expect(src).not.toContain('confirmed_dap_provider')
    expect(src).not.toContain('confirmed_provider')
  })
})
