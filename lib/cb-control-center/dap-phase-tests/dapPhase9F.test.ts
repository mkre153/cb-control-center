/**
 * Phase 9F — DAP Request Decision Actions QA
 *
 * PURPOSE: Verify that Phase 9F produced the correct artifacts:
 * mutation module, server actions, decision panel UI, and boundary protection.
 * All tests are structural (filesystem + static analysis).
 *
 * COVERAGE:
 *   Group 1 — dapRequestActions.ts module exists and exports correct functions
 *   Group 2 — Vertical scope enforcement
 *   Group 3 — Event logging is append-only
 *   Group 4 — UI decision panel exists in detail page
 *   Group 5 — Boundary protection (no public claim unlock, no CMS changes)
 *   Group 6 — Route revalidation in server actions
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// ─── Project root ─────────────────────────────────────────────────────────────

const ROOT = resolve(__dirname, '../../..')

// ─── Key paths ────────────────────────────────────────────────────────────────

const ACTIONS_MODULE_PATH = resolve(ROOT, 'lib/cb-control-center/dapRequestActions.ts')
const SERVER_ACTIONS_PATH = resolve(ROOT, 'app/preview/dap/requests/[id]/actions.ts')
const DETAIL_PAGE_PATH    = resolve(ROOT, 'app/preview/dap/requests/[id]/page.tsx')
const TYPES_PATH          = resolve(ROOT, 'lib/dap/registry/dapRequestTypes.ts')

// ─── Production boundary paths (must NOT be modified) ─────────────────────────

const HOMEPAGE_PATH   = resolve(ROOT, 'app/dental-advantage-plan/page.tsx')
const GUIDES_PAGE     = resolve(ROOT, 'app/guides/[slug]/page.tsx')
const TREATMENTS_PAGE = resolve(ROOT, 'app/treatments/[slug]/page.tsx')
const CMS_EXPORT_PATH = resolve(ROOT, 'lib/cb-control-center/dapCmsExport.ts')

// ─── Group 1: dapRequestActions.ts module ─────────────────────────────────────

describe('dapRequestActions.ts module exists and exports correct functions', () => {
  it('dapRequestActions.ts exists', () => {
    expect(existsSync(ACTIONS_MODULE_PATH)).toBe(true)
  })

  it('exports approveDapRequest', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*approveDapRequest|export.*approveDapRequest/)
  })

  it('exports rejectDapRequest', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*rejectDapRequest|export.*rejectDapRequest/)
  })

  it('exports markDapRequestNeedsReview', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*markDapRequestNeedsReview|export.*markDapRequestNeedsReview/)
  })

  it('exports DapRequestDecisionInput type', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).toContain('DapRequestDecisionInput')
  })

  it('exports DapRequestActionResult type', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).toContain('DapRequestActionResult')
  })

  it('uses getSupabaseAdminClient (service-role mutations)', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).toContain('getSupabaseAdminClient')
  })

  it('dapRequestTypes.ts includes approved status', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain("'approved'")
  })

  it('dapRequestTypes.ts includes rejected status', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain("'rejected'")
  })

  it('dapRequestTypes.ts includes needs_review status', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain("'needs_review'")
  })

  it('dapRequestTypes.ts includes request_approved event type', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain("'request_approved'")
  })

  it('dapRequestTypes.ts includes request_rejected event type', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain("'request_rejected'")
  })

  it('dapRequestTypes.ts includes request_needs_review event type', () => {
    const src = readFileSync(TYPES_PATH, 'utf8')
    expect(src).toContain("'request_needs_review'")
  })
})

// ─── Group 2: Vertical scope enforcement ──────────────────────────────────────

describe('Vertical scope enforcement — all mutations constrained to vertical_key = dap', () => {
  it('module references vertical_key', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).toContain('vertical_key')
  })

  it("module constrains to 'dap' vertical", () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).toContain("'dap'")
  })

  it('every mutation uses .eq vertical_key constraint', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    // At least two .eq('vertical_key', 'dap') calls: one for fetch, one for update
    const matches = src.match(/\.eq\(['"]vertical_key['"]/g) ?? []
    expect(matches.length).toBeGreaterThanOrEqual(2)
  })

  it('module verifies request existence before mutation', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).toContain('maybeSingle')
  })

  it('server actions file has use server directive', () => {
    const src = readFileSync(SERVER_ACTIONS_PATH, 'utf8')
    expect(src).toMatch(/^['"]use server['"]/m)
  })

  it('server actions extract requestId from FormData', () => {
    const src = readFileSync(SERVER_ACTIONS_PATH, 'utf8')
    expect(src).toContain('formData.get')
    expect(src).toContain('requestId')
  })
})

// ─── Group 3: Event logging is append-only ────────────────────────────────────

describe('Event logging — append-only, no overwrites, no deletes', () => {
  it('approval inserts event type request_approved', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).toContain('request_approved')
  })

  it('rejection inserts event type request_rejected', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).toContain('request_rejected')
  })

  it('needs_review inserts event type request_needs_review', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).toContain('request_needs_review')
  })

  it('module uses .insert( for event creation', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).toContain('.insert(')
  })

  it('module does not delete request events', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    // .delete() must not appear anywhere — events are append-only
    expect(src).not.toContain('.delete(')
  })

  it('module does not update request events (only updates request status)', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    // update must only target dap_requests, not dap_request_events
    expect(src).not.toMatch(/from\(['"]dap_request_events['"]\)[\s\S]*?\.update\(/)
  })

  it('actor_type is set to admin on all events', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).toContain("actor_type: 'admin'")
  })
})

// ─── Group 4: UI decision panel ───────────────────────────────────────────────

describe('Detail page includes decision panel with all three actions', () => {
  it('detail page imports approveRequestAction', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('approveRequestAction')
  })

  it('detail page imports rejectRequestAction', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('rejectRequestAction')
  })

  it('detail page imports needsReviewRequestAction', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('needsReviewRequestAction')
  })

  it('detail page has data-decision-panel attribute', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('data-decision-panel')
  })

  it('detail page has data-action="approve" button', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('data-action="approve"')
  })

  it('detail page has data-action="reject" button', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('data-action="reject"')
  })

  it('detail page has data-action="needs-review" button', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('data-action="needs-review"')
  })

  it('decision panel includes disclaimer about not publishing a provider page', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('data-decision-disclaimer')
    expect(src).toMatch(/does not publish a\s+provider page|does not publish.*provider page/i)
  })

  it('decision panel includes disclaimer about not unlocking patient-facing claims', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toMatch(/patient-facing claims/i)
  })
})

// ─── Group 5: Boundary protection ─────────────────────────────────────────────

describe('Boundary protection — no public claim unlock, no CMS changes, no billing', () => {
  it('dapRequestActions.ts does not import CMS export', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).not.toContain('dapCmsExport')
  })

  it('dapRequestActions.ts does not import public UX rules', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).not.toContain('dapPublicUxRules')
  })

  it('dapRequestActions.ts does not reference Join CTA or offer terms', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/join_plan|offer_terms|cta_gate_unlocked|join.*cta/)
  })

  it('dapRequestActions.ts does not create billing events or memberships', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/billing|membership.*id|stripe|payment|subscription/)
  })

  it('dapRequestActions.ts does not set provider_confirmed status', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).not.toContain('provider_confirmed')
  })

  it('production homepage does not import dapRequestActions', () => {
    const src = readFileSync(HOMEPAGE_PATH, 'utf8')
    expect(src).not.toContain('dapRequestActions')
  })

  it('production guides page does not import dapRequestActions', () => {
    const src = readFileSync(GUIDES_PAGE, 'utf8')
    expect(src).not.toContain('dapRequestActions')
  })

  it('production treatments page does not import dapRequestActions', () => {
    const src = readFileSync(TREATMENTS_PAGE, 'utf8')
    expect(src).not.toContain('dapRequestActions')
  })

  it('CMS export module is not modified (no import of dapRequestActions)', () => {
    const src = readFileSync(CMS_EXPORT_PATH, 'utf8')
    expect(src).not.toContain('dapRequestActions')
  })

  it('dapRequestActions.ts does not send outreach emails or trigger CRM', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/sendmail|sendgrid|resend\.send|mkcrm|crm/)
  })
})

// ─── Group 6: Route revalidation ──────────────────────────────────────────────

describe('Server actions revalidate list and detail routes after mutation', () => {
  it('actions.ts exists', () => {
    expect(existsSync(SERVER_ACTIONS_PATH)).toBe(true)
  })

  it('actions.ts exports approveRequestAction', () => {
    const src = readFileSync(SERVER_ACTIONS_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*approveRequestAction|export.*approveRequestAction/)
  })

  it('actions.ts exports rejectRequestAction', () => {
    const src = readFileSync(SERVER_ACTIONS_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*rejectRequestAction|export.*rejectRequestAction/)
  })

  it('actions.ts exports needsReviewRequestAction', () => {
    const src = readFileSync(SERVER_ACTIONS_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*needsReviewRequestAction|export.*needsReviewRequestAction/)
  })

  it('actions.ts calls revalidatePath', () => {
    const src = readFileSync(SERVER_ACTIONS_PATH, 'utf8')
    expect(src).toContain('revalidatePath')
  })

  it('actions.ts revalidates the request list route', () => {
    const src = readFileSync(SERVER_ACTIONS_PATH, 'utf8')
    expect(src).toContain('/preview/dap/requests')
  })

  it('actions.ts revalidates the individual detail route', () => {
    const src = readFileSync(SERVER_ACTIONS_PATH, 'utf8')
    // Detail revalidation must include the dynamic requestId
    expect(src).toContain('requestId')
    expect(src).toMatch(/revalidatePath.*requestId|`.*\$\{requestId\}/)
  })

  it('actions.ts redirects back to the detail page after action', () => {
    const src = readFileSync(SERVER_ACTIONS_PATH, 'utf8')
    expect(src).toContain('redirect')
    expect(src).toContain('requestId')
  })

  it('actions.ts imports approveDapRequest from dapRequestActions', () => {
    const src = readFileSync(SERVER_ACTIONS_PATH, 'utf8')
    expect(src).toContain('approveDapRequest')
    expect(src).toContain('dapRequestActions')
  })
})
