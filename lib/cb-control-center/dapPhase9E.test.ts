/**
 * Phase 9E — DAP Request Operations Review Queue QA
 *
 * PURPOSE: Verify that Phase 9E produced the correct artifacts:
 * read-only admin functions, list page, detail page with event log.
 * All tests are structural (filesystem + static analysis).
 *
 * COVERAGE:
 *   Group 1 — dapRequestAdmin.ts module exists and exports correct functions
 *   Group 2 — Admin functions are read-only (no mutations)
 *   Group 3 — List page exists, uses admin module, renders empty state
 *   Group 4 — Detail page uses Next.js 16 dynamic params pattern
 *   Group 5 — Page count updated to 15 (two new preview pages)
 *   Group 6 — No mutation surface in Phase 9E (server actions, status changes)
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve, join } from 'path'

// ─── Project root ─────────────────────────────────────────────────────────────

const ROOT = resolve(__dirname, '../..')

// ─── Key paths ────────────────────────────────────────────────────────────────

const ADMIN_MODULE_PATH   = resolve(ROOT, 'lib/cb-control-center/dapRequestAdmin.ts')
const LIST_PAGE_PATH      = resolve(ROOT, 'app/preview/dap/requests/page.tsx')
const DETAIL_PAGE_PATH    = resolve(ROOT, 'app/preview/dap/requests/[id]/page.tsx')

// ─── Group 1: dapRequestAdmin.ts module ───────────────────────────────────────

describe('dapRequestAdmin.ts module exists and exports correct functions', () => {
  it('dapRequestAdmin.ts exists', () => {
    expect(existsSync(ADMIN_MODULE_PATH)).toBe(true)
  })

  it('exports listDapRequests', () => {
    const src = readFileSync(ADMIN_MODULE_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*listDapRequests|export.*listDapRequests/)
  })

  it('exports getDapRequest', () => {
    const src = readFileSync(ADMIN_MODULE_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*getDapRequest|export.*getDapRequest/)
  })

  it('exports getDapRequestEvents', () => {
    const src = readFileSync(ADMIN_MODULE_PATH, 'utf8')
    expect(src).toMatch(/export.*async.*function.*getDapRequestEvents|export.*getDapRequestEvents/)
  })

  it('uses getSupabaseAdminClient (service-role read access)', () => {
    const src = readFileSync(ADMIN_MODULE_PATH, 'utf8')
    expect(src).toContain('getSupabaseAdminClient')
  })

  it('scopes listDapRequests to dap vertical', () => {
    const src = readFileSync(ADMIN_MODULE_PATH, 'utf8')
    expect(src).toContain("'dap'")
    expect(src).toContain('vertical_key')
  })

  it('getDapRequest returns null for not-found (maybeSingle)', () => {
    const src = readFileSync(ADMIN_MODULE_PATH, 'utf8')
    expect(src).toContain('maybeSingle')
  })

  it('getDapRequestEvents orders by event_timestamp ascending', () => {
    const src = readFileSync(ADMIN_MODULE_PATH, 'utf8')
    expect(src).toContain('event_timestamp')
    expect(src).toContain('ascending: true')
  })

  it('listDapRequests orders by created_at descending', () => {
    const src = readFileSync(ADMIN_MODULE_PATH, 'utf8')
    expect(src).toContain('created_at')
    expect(src).toContain('ascending: false')
  })
})

// ─── Group 2: Admin functions are read-only ────────────────────────────────────

describe('Admin functions are read-only — no mutations', () => {
  it('module has no insert calls', () => {
    const src = readFileSync(ADMIN_MODULE_PATH, 'utf8')
    expect(src).not.toContain('.insert(')
  })

  it('module has no update calls', () => {
    const src = readFileSync(ADMIN_MODULE_PATH, 'utf8')
    expect(src).not.toContain('.update(')
  })

  it('module has no delete calls', () => {
    const src = readFileSync(ADMIN_MODULE_PATH, 'utf8')
    expect(src).not.toContain('.delete(')
  })

  it('module has no upsert calls', () => {
    const src = readFileSync(ADMIN_MODULE_PATH, 'utf8')
    expect(src).not.toContain('.upsert(')
  })

  it('module does not export any mutation functions', () => {
    const src = readFileSync(ADMIN_MODULE_PATH, 'utf8')
    // No update/close/delete/create export names
    expect(src).not.toMatch(/^export.*function.*(update|close|delete|create|set|mark)/im)
  })
})

// ─── Group 3: List page ────────────────────────────────────────────────────────

describe('List page exists, uses admin module, renders empty state', () => {
  it('app/preview/dap/requests/page.tsx exists', () => {
    expect(existsSync(LIST_PAGE_PATH)).toBe(true)
  })

  it('imports listDapRequests from dapRequestAdmin', () => {
    const src = readFileSync(LIST_PAGE_PATH, 'utf8')
    expect(src).toContain('listDapRequests')
    expect(src).toContain('dapRequestAdmin')
  })

  it('is an async server component (default export is async function)', () => {
    const src = readFileSync(LIST_PAGE_PATH, 'utf8')
    expect(src).toMatch(/export default async function/)
  })

  it('does not use "use client"', () => {
    const src = readFileSync(LIST_PAGE_PATH, 'utf8')
    expect(src).not.toContain("'use client'")
    expect(src).not.toContain('"use client"')
  })

  it('has data-empty-state attribute for zero-request state', () => {
    const src = readFileSync(LIST_PAGE_PATH, 'utf8')
    expect(src).toContain('data-empty-state')
  })

  it('has data-requests-table attribute for populated state', () => {
    const src = readFileSync(LIST_PAGE_PATH, 'utf8')
    expect(src).toContain('data-requests-table')
  })

  it('links to individual request detail pages', () => {
    const src = readFileSync(LIST_PAGE_PATH, 'utf8')
    expect(src).toContain('/preview/dap/requests/')
  })

  it('is force-dynamic (reads live Supabase data)', () => {
    const src = readFileSync(LIST_PAGE_PATH, 'utf8')
    expect(src).toContain("force-dynamic")
  })
})

// ─── Group 4: Detail page ──────────────────────────────────────────────────────

describe('Detail page uses Next.js 16 dynamic params pattern', () => {
  it('app/preview/dap/requests/[id]/page.tsx exists', () => {
    expect(existsSync(DETAIL_PAGE_PATH)).toBe(true)
  })

  it('uses Promise<{ id: string }> params type (Next.js 16 App Router)', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toMatch(/Promise<\s*\{\s*id\s*:\s*string\s*\}/)
  })

  it('awaits params to extract id', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('await params')
  })

  it('calls getDapRequest with awaited id', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('getDapRequest')
  })

  it('calls getDapRequestEvents', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('getDapRequestEvents')
  })

  it('calls notFound() when request is null', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('notFound()')
  })

  it('renders event log section with data-event-log attribute', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('data-event-log')
  })

  it('has data-empty-events attribute for requests with no events', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('data-empty-events')
  })

  it('is an async server component', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toMatch(/export default async function/)
  })

  it('does not use "use client"', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).not.toContain("'use client'")
    expect(src).not.toContain('"use client"')
  })

  it('is force-dynamic', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('force-dynamic')
  })

  it('imports from dapRequestAdmin', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    expect(src).toContain('dapRequestAdmin')
  })
})

// ─── Group 5: Page count updated to 15 ────────────────────────────────────────

describe('Page count is now 15 (Phase 9E added 2 new preview pages)', () => {
  function findPages(dir: string): string[] {
    const { readdirSync } = require('fs')
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

  it('total page.tsx count is 16 (13 prior + 2 review pages + 1 onboarding list)', () => {
    const pages = findPages(join(ROOT, 'app'))
    expect(pages.length).toBe(16)
  })

  it('app/preview/dap/requests/page.tsx is included in the count', () => {
    const pages = findPages(join(ROOT, 'app'))
    expect(pages.some(p => p.endsWith('requests/page.tsx'))).toBe(true)
  })

  it('app/preview/dap/requests/[id]/page.tsx is included in the count', () => {
    const pages = findPages(join(ROOT, 'app'))
    expect(pages.some(p => p.includes('requests/[id]/page.tsx'))).toBe(true)
  })

  it('no new production routes added in Phase 9E', () => {
    const pages = findPages(join(ROOT, 'app'))
    const productionPages = pages.filter(p => !p.includes('/preview/') && !p.includes('/api/'))
    // Prior production pages: 4 (root + 3 Tier 1 as of Phase 9B)
    expect(productionPages.length).toBeLessThanOrEqual(4)
  })
})

// ─── Group 6: No mutation surface ─────────────────────────────────────────────

describe('No mutation surface added in Phase 9E', () => {
  it('list page has no server actions', () => {
    const src = readFileSync(LIST_PAGE_PATH, 'utf8')
    expect(src).not.toContain("'use server'")
    expect(src).not.toContain('"use server"')
  })

  it('detail page does not have use server in the page file itself', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    // Server actions are isolated in actions.ts — the page file must not declare 'use server'
    expect(src).not.toContain("'use server'")
    expect(src).not.toContain('"use server"')
  })

  it('list page has no status update buttons or forms (list is read-only)', () => {
    const src = readFileSync(LIST_PAGE_PATH, 'utf8')
    expect(src).not.toMatch(/<button.*type=['"]submit/i)
    expect(src).not.toMatch(/<form\b/i)
  })

  it('detail page decision panel is present (Phase 9F added controlled mutations)', () => {
    const src = readFileSync(DETAIL_PAGE_PATH, 'utf8')
    // Phase 9F added a decision panel — forms/buttons are expected on the detail page
    expect(src).toContain('data-decision-panel')
  })

  it('no new API mutation routes added for Phase 9E', () => {
    const PATCH_PATH   = resolve(ROOT, 'app/api/dap/requests/[id]/route.ts')
    const DELETE_PATH  = resolve(ROOT, 'app/api/dap/requests/[id]/delete/route.ts')
    const STATUS_PATH  = resolve(ROOT, 'app/api/dap/requests/[id]/status/route.ts')
    expect(existsSync(PATCH_PATH)).toBe(false)
    expect(existsSync(DELETE_PATH)).toBe(false)
    expect(existsSync(STATUS_PATH)).toBe(false)
  })

  it('admin module does not import from CRM or messaging modules', () => {
    const src = readFileSync(ADMIN_MODULE_PATH, 'utf8').toLowerCase()
    expect(src).not.toMatch(/import.*crm|import.*ghl|import.*sendgrid|import.*resend/)
  })
})
