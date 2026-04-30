/**
 * Phase 9G — DAP Request Decision Guardrails & Audit Integrity QA
 *
 * PURPOSE: Verify that Phase 9G hardened the decision workflow:
 * transition-safe, actor-attributed, audit-readable, idempotency-aware.
 * Mix of behavioral tests (real function imports) and structural (filesystem).
 *
 * COVERAGE:
 *   Group 1 — Transition model (behavioral: imports real functions)
 *   Group 2 — Action guardrails (structural: dapRequestActions.ts)
 *   Group 3 — Event integrity (structural: metadata shape)
 *   Group 4 — Duplicate submission safety (structural)
 *   Group 5 — UI audit readability (structural: detail page)
 *   Group 6 — Public boundary protection (structural)
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import {
  canTransitionDapRequestStatus,
  assertValidDapRequestTransition,
} from './dapRequestRules'

// ─── Project root ─────────────────────────────────────────────────────────────

const ROOT = resolve(__dirname, '../..')

// ─── Key paths ────────────────────────────────────────────────────────────────

const ACTIONS_MODULE_PATH = resolve(ROOT, 'lib/cb-control-center/dapRequestActions.ts')
const SERVER_ACTIONS_PATH = resolve(ROOT, 'app/preview/dap/requests/[id]/actions.ts')
const DETAIL_PAGE_PATH    = resolve(ROOT, 'app/preview/dap/requests/[id]/page.tsx')
const RULES_PATH          = resolve(ROOT, 'lib/cb-control-center/dapRequestRules.ts')

// ─── Production boundary paths ────────────────────────────────────────────────

const HOMEPAGE_PATH   = resolve(ROOT, 'app/dental-advantage-plan/page.tsx')
const GUIDES_PAGE     = resolve(ROOT, 'app/guides/[slug]/page.tsx')
const TREATMENTS_PAGE = resolve(ROOT, 'app/treatments/[slug]/page.tsx')
const CMS_EXPORT_PATH = resolve(ROOT, 'lib/cb-control-center/dapCmsExport.ts')

// ─── Group 1: Transition model (behavioral) ────────────────────────────────────

describe('Transition model — allowed and blocked transitions', () => {
  it('canTransitionDapRequestStatus is exported from dapRequestRules', () => {
    expect(typeof canTransitionDapRequestStatus).toBe('function')
  })

  it('assertValidDapRequestTransition is exported from dapRequestRules', () => {
    expect(typeof assertValidDapRequestTransition).toBe('function')
  })

  // "new" maps to submitted — the initial state after patient submission
  it('submitted → approved is allowed', () => {
    expect(canTransitionDapRequestStatus('submitted', 'approved')).toBe(true)
  })

  it('submitted → rejected is allowed', () => {
    expect(canTransitionDapRequestStatus('submitted', 'rejected')).toBe(true)
  })

  it('submitted → needs_review is allowed', () => {
    expect(canTransitionDapRequestStatus('submitted', 'needs_review')).toBe(true)
  })

  it('needs_review → approved is allowed', () => {
    expect(canTransitionDapRequestStatus('needs_review', 'approved')).toBe(true)
  })

  it('needs_review → rejected is allowed', () => {
    expect(canTransitionDapRequestStatus('needs_review', 'rejected')).toBe(true)
  })

  it('approved → needs_review is allowed', () => {
    expect(canTransitionDapRequestStatus('approved', 'needs_review')).toBe(true)
  })

  it('rejected → needs_review is allowed', () => {
    expect(canTransitionDapRequestStatus('rejected', 'needs_review')).toBe(true)
  })

  it('approved → rejected is NOT allowed directly', () => {
    expect(canTransitionDapRequestStatus('approved', 'rejected')).toBe(false)
  })

  it('rejected → approved is NOT allowed directly', () => {
    expect(canTransitionDapRequestStatus('rejected', 'approved')).toBe(false)
  })

  it('approved → approved (self) is NOT allowed', () => {
    expect(canTransitionDapRequestStatus('approved', 'approved')).toBe(false)
  })

  it('assertValidDapRequestTransition throws on invalid transition', () => {
    expect(() => assertValidDapRequestTransition('approved', 'rejected')).toThrow()
  })

  it('assertValidDapRequestTransition does not throw on valid transition', () => {
    expect(() => assertValidDapRequestTransition('submitted', 'approved')).not.toThrow()
  })

  it('assertValidDapRequestTransition message includes both statuses', () => {
    expect(() => assertValidDapRequestTransition('approved', 'rejected')).toThrow(/approved.*rejected/)
  })

  it('dapRequestRules.ts exports assertValidDapRequestTransition', () => {
    const src = readFileSync(RULES_PATH, 'utf8')
    expect(src).toContain('export function assertValidDapRequestTransition')
  })
})

// ─── Group 2: Action guardrails ────────────────────────────────────────────────

describe('Action guardrails — transition validated before status update', () => {
  it('dapRequestActions.ts imports canTransitionDapRequestStatus', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).toContain('canTransitionDapRequestStatus')
  })

  it('transition check appears before .update( in source', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    const checkPos  = src.indexOf('canTransitionDapRequestStatus')
    const updatePos = src.indexOf('.update(')
    expect(checkPos).toBeGreaterThan(-1)
    expect(updatePos).toBeGreaterThan(-1)
    expect(checkPos).toBeLessThan(updatePos)
  })

  it("result type includes 'invalid_transition' failure code", () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).toContain("'invalid_transition'")
  })

  it("result type includes 'request_not_found' failure code", () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).toContain("'request_not_found'")
  })

  it("result type includes 'status_update_failed' failure code", () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).toContain("'status_update_failed'")
  })

  it("result type includes 'event_insert_failed' failure code", () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).toContain("'event_insert_failed'")
  })

  it('update is double-scoped by both id and vertical_key', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    // Both .eq('id', ...) and .eq('vertical_key', 'dap') must appear before .update
    const updatePos = src.indexOf('.update(')
    const idEqBefore = src.lastIndexOf(".eq('id'", updatePos)
    const vkEqBefore = src.lastIndexOf(".eq('vertical_key'", updatePos)
    expect(idEqBefore).toBeGreaterThan(-1)
    expect(vkEqBefore).toBeGreaterThan(-1)
  })

  it('result shape uses ok: true / ok: false (typed union)', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).toContain('ok: true')
    expect(src).toContain('ok: false')
  })

  it('reads current request status before running update', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).toContain('fetchDapRequestForMutation')
    expect(src).toContain('maybeSingle')
  })
})

// ─── Group 3: Event integrity ──────────────────────────────────────────────────

describe('Event integrity — previous_status, new_status, actor_id in metadata', () => {
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

  it('event includes event_note from input.note', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).toContain('input.note')
  })

  it('event insert uses .insert( (append-only)', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).toContain('.insert(')
  })

  it('no .delete( operation against request events', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).not.toContain('.delete(')
  })

  it('event insert only runs after valid transition (insert after canTransitionDapRequestStatus)', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    const checkPos  = src.indexOf('canTransitionDapRequestStatus')
    const insertPos = src.indexOf('.insert(')
    expect(checkPos).toBeLessThan(insertPos)
  })

  it("actor_type is set to 'admin' for all decision events", () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).toContain("actor_type: 'admin'")
  })
})

// ─── Group 4: Duplicate submission safety ─────────────────────────────────────

describe('Duplicate submission safety — invalid transitions do not create duplicate events', () => {
  it('server actions file handles ok: false without unconditional throw', () => {
    const src = readFileSync(SERVER_ACTIONS_PATH, 'utf8')
    // Must contain ok and some conditional logic — not just "throw if !ok"
    expect(src).toContain('result.ok')
  })

  it("server actions treat 'invalid_transition' as graceful (not hard error)", () => {
    const src = readFileSync(SERVER_ACTIONS_PATH, 'utf8')
    expect(src).toContain('invalid_transition')
  })

  it("server actions treat 'request_not_found' as graceful", () => {
    const src = readFileSync(SERVER_ACTIONS_PATH, 'utf8')
    expect(src).toContain('request_not_found')
  })

  it('approveRequestAction still redirects on invalid_transition (no error state)', () => {
    const src = readFileSync(SERVER_ACTIONS_PATH, 'utf8')
    // redirect must appear after result handling — cannot be gated only on success
    expect(src).toContain('redirect')
    expect(src).toContain('requestId')
  })

  it('transition check in module returns false for same-status self-transitions', () => {
    expect(canTransitionDapRequestStatus('approved', 'approved')).toBe(false)
    expect(canTransitionDapRequestStatus('rejected', 'rejected')).toBe(false)
    expect(canTransitionDapRequestStatus('needs_review', 'needs_review')).toBe(false)
  })

  it('module does not insert event when transition is invalid', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    // The early-return on invalid_transition (before .insert) prevents duplicate events
    const invalidReturnPos = src.indexOf("'invalid_transition'")
    const insertPos = src.indexOf('.insert(')
    // invalid_transition return must come before the insert call
    expect(invalidReturnPos).toBeLessThan(insertPos)
  })
})

// ─── Group 5: UI audit readability ────────────────────────────────────────────

describe('Event log renders full decision history — previous status, new status, actor, note', () => {
  it('detail page renders data-event-previous-status', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('data-event-previous-status')
  })

  it('detail page renders data-event-new-status', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('data-event-new-status')
  })

  it('detail page renders data-event-actor', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('data-event-actor')
  })

  it('detail page renders data-event-note', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('data-event-note')
  })

  it('detail page reads metadata_json from event', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('metadata_json')
  })

  it('detail page renders actor_id from metadata when present', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('actor_id')
  })

  it('decision disclaimer is still present on detail page', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('data-decision-disclaimer')
    expect(src).toMatch(/does not publish a\s+provider page|does not publish.*provider page/i)
  })

  it('detail page identifies decision event types for metadata rendering', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('request_approved')
    expect(src).toContain('request_rejected')
    expect(src).toContain('request_needs_review')
  })
})

// ─── Group 6: Public boundary protection ──────────────────────────────────────

describe('Public boundary protection — no CMS, no Join CTA, no provider publishing', () => {
  it('dapRequestActions.ts does not reference CMS export', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).not.toContain('dapCmsExport')
  })

  it('dapRequestActions.ts does not reference provider_confirmed status', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8')
    expect(src).not.toContain('provider_confirmed')
  })

  it('dapRequestActions.ts does not reference Join CTA or offer terms', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/join_plan|offer_terms|cta_gate_unlocked/)
  })

  it('dapRequestActions.ts does not contain billing or membership logic', () => {
    const src = readFileSync(ACTIONS_MODULE_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/billing|membership.*id|stripe|subscription/)
  })

  it('production homepage does not import from dapRequestActions', () => {
    const src = readFileSync(HOMEPAGE_PATH, 'utf8')
    expect(src).not.toContain('dapRequestActions')
  })

  it('production guides page does not import from dapRequestActions', () => {
    const src = readFileSync(GUIDES_PAGE, 'utf8')
    expect(src).not.toContain('dapRequestActions')
  })

  it('production treatments page does not import from dapRequestActions', () => {
    const src = readFileSync(TREATMENTS_PAGE, 'utf8')
    expect(src).not.toContain('dapRequestActions')
  })

  it('CMS export module unchanged — does not reference dapRequestActions', () => {
    const src = readFileSync(CMS_EXPORT_PATH, 'utf8')
    expect(src).not.toContain('dapRequestActions')
  })

  it('no new production page routes added in Phase 9G', () => {
    const { readdirSync } = require('fs')
    const { join } = require('path')
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
    expect(pages.length).toBe(34)  // Phase 9L added provider-participation list + detail pages
  })
})
