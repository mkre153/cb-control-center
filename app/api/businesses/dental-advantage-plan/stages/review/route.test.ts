/**
 * DAP Stage Review API Route — Tests
 *
 * COVERAGE:
 *   Group 1 — Static safety invariants (no DB, no mutation, advisory-only)
 *   Group 2 — Input validation (400)
 *   Group 3 — projectSlug guard (404 on non-DAP)
 *   Group 4 — Resolution by stageSlug (legacy v1 path)
 *   Group 5 — Resolution by stageNumber (v2 path; legacy 404 fix)
 *   Group 6 — Approval-action decoupling (no review imports in approval files)
 *   Group 7 — No DB schema column for AI review
 *
 * The reviewer is mocked at the module level so the route's resolution and
 * validation paths are exercised without making real Anthropic calls.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'fs'
import { resolve, join } from 'path'

// ─── Mock reviewStage so no real Anthropic calls happen ──────────────────────

vi.mock('@/lib/cb-control-center/dapStageReviewer', () => ({
  reviewStage: vi.fn(async () => ({
    recommendation: 'request_revision',
    confidence: 'low',
    reasoning: 'mock review',
    checklistResults: [],
  })),
}))

import { POST } from './route'
import { reviewStage } from '@/lib/cb-control-center/dapStageReviewer'

const ROOT = resolve(__dirname, '../../../../../../..')
const ROUTE_PATH = resolve(__dirname, 'route.ts')
const MIGRATIONS_DIR = resolve(ROOT, 'supabase/migrations')
const DAP_ACTIONS_PATH = resolve(ROOT, 'lib/cb-control-center/dapStageActions.ts')
const CHARTER_ACTIONS_PATH = resolve(ROOT, 'lib/cb-control-center/cbccProjectActions.ts')

function jsonRequest(body: unknown): Request {
  return new Request('http://localhost/api/businesses/dental-advantage-plan/stages/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('Group 1 — Route is structurally advisory-only', () => {
  it('route source does not import supabase or persistence', () => {
    const src = readFileSync(ROUTE_PATH, 'utf8')
    expect(src).not.toContain('supabase')
    expect(src).not.toContain('getSupabaseAdminClient')
    expect(src).not.toMatch(/createClient/)
  })

  it('route source does not import any approval action', () => {
    const src = readFileSync(ROUTE_PATH, 'utf8')
    expect(src).not.toMatch(/approveDapStageAction|approveCharterAction|dapStageActions|cbccProjectActions/)
  })

  it('route source defines only POST (no PUT/DELETE/PATCH/GET mutation handlers)', () => {
    const src = readFileSync(ROUTE_PATH, 'utf8')
    expect(src).toMatch(/export async function POST/)
    expect(src).not.toMatch(/export async function (PUT|DELETE|PATCH)/)
  })
})

describe('Group 2 — Input validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 on invalid JSON body', async () => {
    const res = await POST(new Request('http://localhost/x', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json {{',
    }))
    expect(res.status).toBe(400)
    expect(reviewStage).not.toHaveBeenCalled()
  })

  it('returns 400 when neither stageSlug nor stageNumber is provided', async () => {
    const res = await POST(jsonRequest({}))
    expect(res.status).toBe(400)
    expect(reviewStage).not.toHaveBeenCalled()
  })

  it('returns 400 when stageSlug is empty and stageNumber is missing', async () => {
    const res = await POST(jsonRequest({ stageSlug: '' }))
    expect(res.status).toBe(400)
    expect(reviewStage).not.toHaveBeenCalled()
  })
})

describe('Group 3 — projectSlug guard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 404 when projectSlug is not the DAP slug', async () => {
    const res = await POST(jsonRequest({
      projectSlug: 'acme-co',
      stageNumber: 3,
    }))
    expect(res.status).toBe(404)
    expect(reviewStage).not.toHaveBeenCalled()
    const body = await res.json() as { error: string }
    expect(body.error).toMatch(/acme-co/)
  })

  it('accepts the DAP projectSlug', async () => {
    const res = await POST(jsonRequest({
      projectSlug: 'dental-advantage-plan',
      stageNumber: 3,
    }))
    expect(res.status).toBe(200)
    expect(reviewStage).toHaveBeenCalledTimes(1)
  })

  it('accepts a missing projectSlug (legacy v1 caller)', async () => {
    const res = await POST(jsonRequest({ stageNumber: 3 }))
    expect(res.status).toBe(200)
    expect(reviewStage).toHaveBeenCalledTimes(1)
  })
})

describe('Group 4 — Legacy DAP slug resolution still works', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('resolves the truth-schema stage by its legacy DAP slug', async () => {
    const res = await POST(jsonRequest({ stageSlug: '3-truth-schema' }))
    expect(res.status).toBe(200)
    expect(reviewStage).toHaveBeenCalledTimes(1)
    const passed = (reviewStage as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]![0] as { stageNumber: number }
    expect(passed.stageNumber).toBe(3)
  })

  it('returns 404 for an unknown legacy slug', async () => {
    const res = await POST(jsonRequest({ stageSlug: 'nonexistent-stage' }))
    expect(res.status).toBe(404)
    expect(reviewStage).not.toHaveBeenCalled()
  })
})

describe('Group 5 — v2 numeric stageNumber resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('resolves stage by stageNumber when stageSlug is purely numeric', async () => {
    // This is exactly the v2 case: page model produces slug = "3"
    const res = await POST(jsonRequest({
      projectSlug: 'dental-advantage-plan',
      stageSlug: '3',
      stageNumber: 3,
    }))
    expect(res.status).toBe(200)
    expect(reviewStage).toHaveBeenCalledTimes(1)
    const passed = (reviewStage as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]![0] as { stageNumber: number }
    expect(passed.stageNumber).toBe(3)
  })

  it('resolves by stageNumber when stageSlug is omitted entirely', async () => {
    const res = await POST(jsonRequest({ stageNumber: 5 }))
    expect(res.status).toBe(200)
    expect(reviewStage).toHaveBeenCalledTimes(1)
    const passed = (reviewStage as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]![0] as { stageNumber: number }
    expect(passed.stageNumber).toBe(5)
  })

  it('rejects an out-of-range stageNumber with no stageSlug as a 400', async () => {
    const res = await POST(jsonRequest({ stageNumber: 99 }))
    expect(res.status).toBe(400)
    expect(reviewStage).not.toHaveBeenCalled()
  })

  it('returns 404 when stageSlug is bogus AND stageNumber is missing', async () => {
    const res = await POST(jsonRequest({ stageSlug: 'totally-fake' }))
    expect(res.status).toBe(404)
    expect(reviewStage).not.toHaveBeenCalled()
  })
})

describe('Group 6 — Approval actions do not import review symbols', () => {
  it('dapStageActions.ts imports nothing review-shaped', () => {
    if (!existsSync(DAP_ACTIONS_PATH)) return
    const src = readFileSync(DAP_ACTIONS_PATH, 'utf8')
    expect(src).not.toMatch(/dapStageReviewer|reviewStage|StageAiReview/)
  })

  it('cbccProjectActions.ts imports nothing review-shaped', () => {
    if (!existsSync(CHARTER_ACTIONS_PATH)) return
    const src = readFileSync(CHARTER_ACTIONS_PATH, 'utf8')
    expect(src).not.toMatch(/dapStageReviewer|reviewStage|StageAiReview/)
  })
})

describe('Group 7 — No DB schema column for AI review', () => {
  it('no migration creates an ai_review / stage_review_result column or table', () => {
    if (!existsSync(MIGRATIONS_DIR)) return
    for (const file of readdirSync(MIGRATIONS_DIR)) {
      if (!file.endsWith('.sql')) continue
      const src = readFileSync(join(MIGRATIONS_DIR, file), 'utf8')
      expect(src).not.toMatch(/ai_review|stage_review_result|review_result/i)
    }
  })
})
