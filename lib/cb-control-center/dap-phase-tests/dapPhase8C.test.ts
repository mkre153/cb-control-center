/**
 * Phase 8C — Production Route Readiness QA
 *
 * PURPOSE: Enforce that Phase 8C produced the required planning artifacts,
 * that the current route boundary is unchanged, and that no production routes
 * or API handlers were added. These tests make the readiness plan machine-
 * verifiable and prevent future changes from silently violating it.
 *
 * COVERAGE:
 *   Group 1 — Readiness doc exists and covers all required sections
 *   Group 2 — Route boundary unchanged (no production routes added)
 *   Group 3 — No API routes added
 *   Group 4 — Route mapping completeness (all page kinds documented)
 *   Group 5 — Launch tier structure present in doc
 *   Group 6 — Safety gate and backend dependency documentation
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, readdirSync } from 'fs'
import { resolve, join } from 'path'

// ─── Project root ─────────────────────────────────────────────────────────────

const ROOT = resolve(__dirname, '../../..')

// ─── Filesystem helpers ───────────────────────────────────────────────────────

function findFiles(dir: string, test: (path: string) => boolean): string[] {
  if (!existsSync(dir)) return []
  const results: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.next') {
      results.push(...findFiles(full, test))
    } else if (entry.isFile() && test(full)) {
      results.push(full)
    }
  }
  return results
}

// ─── Doc path ─────────────────────────────────────────────────────────────────

const DOC_PATH = resolve(ROOT, 'docs/dap-production-route-readiness.md')

// ─── Group 1: Readiness doc exists and covers all required sections ───────────

describe('Readiness doc existence and section coverage', () => {
  it('docs/dap-production-route-readiness.md exists', () => {
    expect(existsSync(DOC_PATH)).toBe(true)
  })

  it('doc is non-trivially sized (more than 1000 characters)', () => {
    const content = readFileSync(DOC_PATH, 'utf8')
    expect(content.length).toBeGreaterThan(1000)
  })

  it('doc section 1: current preview routes are documented', () => {
    const doc = readFileSync(DOC_PATH, 'utf8').toLowerCase()
    expect(doc).toMatch(/current preview routes|preview route/)
  })

  it('doc section 2: future production route candidates are documented', () => {
    const doc = readFileSync(DOC_PATH, 'utf8').toLowerCase()
    expect(doc).toMatch(/future production route|production route candidate/)
  })

  it('doc section 3: routes that must remain preview-only are listed', () => {
    const doc = readFileSync(DOC_PATH, 'utf8').toLowerCase()
    expect(doc).toMatch(/remain preview.only|stay preview.only|preview.only/)
  })

  it('doc section 4: launch sequence is defined', () => {
    const doc = readFileSync(DOC_PATH, 'utf8').toLowerCase()
    expect(doc).toMatch(/launch sequence|launch tier/)
  })

  it('doc section 5: data source requirements are documented', () => {
    const doc = readFileSync(DOC_PATH, 'utf8').toLowerCase()
    expect(doc).toMatch(/data source|content source/)
  })

  it('doc section 6: SEO metadata rules are documented', () => {
    const doc = readFileSync(DOC_PATH, 'utf8').toLowerCase()
    expect(doc).toMatch(/seo metadata|generatemetadata/)
  })

  it('doc section 7: noindex/canonical rules are documented', () => {
    const doc = readFileSync(DOC_PATH, 'utf8').toLowerCase()
    expect(doc).toMatch(/noindex/)
    expect(doc).toMatch(/canonical/)
  })

  it('doc section 8: safety gates before route promotion are documented', () => {
    const doc = readFileSync(DOC_PATH, 'utf8').toLowerCase()
    expect(doc).toMatch(/safety gate/)
  })

  it('doc section 9: backend dependencies are documented', () => {
    const doc = readFileSync(DOC_PATH, 'utf8').toLowerCase()
    expect(doc).toMatch(/backend depend/)
  })

  it('doc section 10: rollback plan is documented', () => {
    const doc = readFileSync(DOC_PATH, 'utf8').toLowerCase()
    expect(doc).toMatch(/rollback plan|rollback/)
  })
})

// ─── Group 2: Current production route inventory ─────────────────────────────
// Phase 8C added zero routes (original intent was boundary enforcement).
// Phase 9B promoted Tier 1 routes to production. Updated to reflect current state.

describe('Current production route inventory', () => {
  const KNOWN_ROUTES = [
    // Control center root
    'app/page.tsx',
    // Preview routes (remain preview-only)
    'app/preview/dap/page.tsx',
    'app/preview/dap/[city]/page.tsx',
    'app/preview/dap/cms-snapshot/page.tsx',
    'app/preview/dap/decisions/[slug]/page.tsx',
    'app/preview/dap/dentists/[slug]/page.tsx',
    'app/preview/dap/design/page.tsx',
    'app/preview/dap/request/page.tsx',
    'app/preview/dap/request/confirmation/page.tsx',
    'app/preview/dap/treatments/[slug]/page.tsx',
    // Tier 1 production routes (Phase 9B)
    'app/dental-advantage-plan/page.tsx',
    'app/guides/[slug]/page.tsx',
    'app/treatments/[slug]/page.tsx',
    // Internal review routes (Phase 9E)
    'app/preview/dap/requests/page.tsx',
    'app/preview/dap/requests/[id]/page.tsx',
    // Internal onboarding list (Phase 9H)
    'app/preview/dap/onboarding/page.tsx',
    // Internal onboarding detail (Phase 9I)
    'app/preview/dap/onboarding/[id]/page.tsx',
    // Internal offer terms list (Phase 9J)
    'app/preview/dap/offer-terms/page.tsx',
    // Internal offer terms detail (Phase 9J)
    'app/preview/dap/offer-terms/[id]/page.tsx',
    // Internal provider participation list (Phase 9L)
    'app/preview/dap/provider-participation/page.tsx',
    // Internal provider participation detail (Phase 9L)
    'app/preview/dap/provider-participation/[id]/page.tsx',
    // Member status preview (Phase 9R)
    'app/preview/dap/members/[membershipId]/status/page.tsx',
    // Practice decision email preview (Phase 9U)
    'app/preview/dap/practice-decision-emails/page.tsx',
    // Communication approvals preview (Phase 9Y)
    'app/preview/dap/communication-approvals/page.tsx',
    // Communication dry-run preview (Phase 9Z)
    'app/preview/dap/communication-dry-runs/page.tsx',
    // Public member status preview (Phase 10)
    'app/preview/dap/member-status/[membershipId]/page.tsx',
    // Admin decision readiness preview (Phase 11)
    'app/preview/dap/admin-review/page.tsx',
    // Admin event timeline preview (Phase 11)
    'app/preview/dap/admin-timeline/page.tsx',
    // Member admin summary preview (Phase 11)
    'app/preview/dap/member-admin-summary/page.tsx',
    // Action catalog preview (Phase 12)
    'app/preview/dap/action-catalog/page.tsx',
    // Admin decision ledger preview (Phase 13)
    'app/preview/dap/admin-decision-ledger/page.tsx',
    // Admin decision write contract preview (Phase 14)
    'app/preview/dap/admin-decision-write-contract/page.tsx',
    // Admin decision SQL contract preview (Phase 15)
    'app/preview/dap/admin-decision-sql-contract/page.tsx',
    // Admin decision audit + replay preview (Phase 16)
    'app/preview/dap/admin-decision-audit/page.tsx',
    // DAP public site — static pages (Phase 1)
    'app/dental-advantage-plan/how-it-works/page.tsx',
    'app/dental-advantage-plan/vs-insurance/page.tsx',
    'app/dental-advantage-plan/savings/page.tsx',
    'app/dental-advantage-plan/find-a-dentist/page.tsx',
    'app/dental-advantage-plan/for-practices/page.tsx',
    'app/dental-advantage-plan/guide/page.tsx',
    // DAP public site — generated pages (Phase 1)
    'app/dental-advantage-plan/cities/[city]/page.tsx',
    'app/dental-advantage-plan/dentists/[city]/page.tsx',
    'app/dental-advantage-plan/dentists/[city]/[practiceSlug]/page.tsx',
    // Member status — public (Phase 2A)
    'app/dental-advantage-plan/member-status/[membershipId]/page.tsx',
    // Admin rejection email previews (Phase 2B)
    'app/preview/dap/admin-rejection-emails/page.tsx',
    // CB Control Center home dashboard routes (Phase 17B)
    'app/businesses/dental-advantage-plan/build/page.tsx',
    'app/businesses/dental-advantage-plan/page.tsx',
    'app/businesses/new/page.tsx',
    // DAP public site compare page (Phase 18A)
    'app/dental-advantage-plan/compare/page.tsx',
    // Neil LLM Formatting preview (Phase 18B)
    'app/preview/cbseoaeo/llm-page-format/page.tsx',
    // Page generation contract preview (Phase 18C)
    'app/preview/cbseoaeo/page-generation-contract/page.tsx',
    // DAP page brief builder preview (Phase 18D)
    'app/preview/dap/page-briefs/page.tsx',
    // DAP stage detail pages (Phase 19C)
    'app/businesses/dental-advantage-plan/build/stages/[stageSlug]/page.tsx',
    // CBCC v2 project registry routes (Step 0)
    'app/projects/page.tsx',
    'app/projects/new/page.tsx',
    'app/projects/[slug]/page.tsx',
    'app/projects/[slug]/charter/page.tsx',
    // CBCC v2 stage detail route
    'app/projects/[slug]/stages/[stageNumber]/page.tsx',
  ]

  it('exactly 58 page.tsx files in app/ (CBCC v2 added stage detail route)', () => {
    const found = findFiles(join(ROOT, 'app'), f => f.endsWith('page.tsx'))
    expect(found.length).toBe(KNOWN_ROUTES.length)
  })

  it('all 19 known routes exist on disk', () => {
    for (const rel of KNOWN_ROUTES) {
      expect(existsSync(resolve(ROOT, rel)), `missing: ${rel}`).toBe(true)
    }
  })

  it('Tier 1 production routes exist (Phase 9B promotion)', () => {
    expect(existsSync(resolve(ROOT, 'app/dental-advantage-plan/page.tsx'))).toBe(true)
    expect(existsSync(resolve(ROOT, 'app/guides/[slug]/page.tsx'))).toBe(true)
    expect(existsSync(resolve(ROOT, 'app/treatments/[slug]/page.tsx'))).toBe(true)
  })

  it('Tier 2 route does not exist (dentist directory not yet launched)', () => {
    expect(existsSync(resolve(ROOT, 'app/dentists'))).toBe(false)
  })

  it('Tier 3 request route does not exist (backend not yet wired)', () => {
    expect(existsSync(resolve(ROOT, 'app/request'))).toBe(false)
  })
})

// ─── Group 3: No API routes added ─────────────────────────────────────────────

describe('API route inventory (Phase 9C added POST /api/dap/requests)', () => {
  it('only the Phase 9C route handler exists (no other route.ts added)', () => {
    const routes = findFiles(ROOT, f => f.endsWith('route.ts') || f.endsWith('route.tsx'))
    const KNOWN_ROUTES = [
      'app/api/dap/requests/route.ts',
      'app/api/businesses/dental-advantage-plan/stages/review/route.ts',
    ]
    const unexpected = routes.filter(r => !KNOWN_ROUTES.some(k => r.endsWith(k)))
    expect(unexpected).toHaveLength(0)
  })

  it('/api/ directory exists only for the DAP request handler (Phase 9C)', () => {
    expect(existsSync(resolve(ROOT, 'app/api/dap/requests/route.ts'))).toBe(true)
    expect(existsSync(resolve(ROOT, 'app/api/dap/requests/page.tsx'))).toBe(false)
  })

  it('no POST /api/dap/request (singular) route exists — correct path is /requests (plural)', () => {
    expect(existsSync(resolve(ROOT, 'app/api/dap/request/route.ts'))).toBe(false)
  })
})

// ─── Group 4: Route mapping completeness ──────────────────────────────────────
// The readiness doc must reference a production mapping for every page kind
// that exists in the current preview system.

describe('Route mapping completeness in readiness doc', () => {
  let doc: string

  // Read once — tests below share the content
  try { doc = readFileSync(DOC_PATH, 'utf8') } catch { doc = '' }

  it('doc maps homepage to a production path', () => {
    // Should reference /dental-advantage-plan or similar
    expect(doc).toMatch(/\/dental-advantage-plan|production.*homepage|homepage.*production/i)
  })

  it('doc maps city pages to a production path', () => {
    expect(doc).toMatch(/\/dentists\/\[city\]|\/locations\/\[city\]|city page.*production/i)
  })

  it('doc maps dentist pages to a production path', () => {
    expect(doc).toMatch(/\/dentists\/\[city\]\/|\/dentist\/\[slug\]|dentist page.*production/i)
  })

  it('doc maps decision/comparison pages to a production path', () => {
    expect(doc).toMatch(/\/guides\/|\/compare\/|decision page.*production/i)
  })

  it('doc maps treatment pages to a production path', () => {
    expect(doc).toMatch(/\/treatments\/\[slug\]|treatment.*production/i)
  })

  it('doc maps request flow to /request or similar', () => {
    expect(doc).toMatch(/\/request\b/)
  })

  it('doc notes that design gallery route must remain preview-only', () => {
    expect(doc).toMatch(/design.*preview.only|design gallery.*preview|\/preview\/dap\/design/i)
  })

  it('doc notes that CMS snapshot route must remain preview-only', () => {
    expect(doc).toMatch(/cms.snapshot.*preview.only|cms.snapshot.*preview|preview.only.*cms/i)
  })
})

// ─── Group 5: Launch tier structure ───────────────────────────────────────────

describe('Launch tier structure documented', () => {
  it('doc defines a Tier 1 launch', () => {
    const doc = readFileSync(DOC_PATH, 'utf8')
    expect(doc).toMatch(/tier 1/i)
  })

  it('doc defines a Tier 2 launch', () => {
    const doc = readFileSync(DOC_PATH, 'utf8')
    expect(doc).toMatch(/tier 2/i)
  })

  it('doc defines a Tier 3 launch', () => {
    const doc = readFileSync(DOC_PATH, 'utf8')
    expect(doc).toMatch(/tier 3/i)
  })

  it('Tier 1 is informational — no backend required', () => {
    const doc = readFileSync(DOC_PATH, 'utf8')
    // Tier 1 should be described as safe / informational / no backend
    expect(doc).toMatch(/tier 1.*no backend|tier 1.*informational|informational.*tier 1/i)
  })

  it('Tier 3 is blocked until backend is implemented', () => {
    const doc = readFileSync(DOC_PATH, 'utf8').toLowerCase()
    // Tier 3 should mention blocking on backend
    expect(doc).toMatch(/tier 3.*backend|tier 3.*blocked|blocked.*tier 3|cannot ship.*backend/i)
  })

  it('request flow is assigned to Tier 3 (not Tier 1 or 2)', () => {
    const doc = readFileSync(DOC_PATH, 'utf8')
    // The request route should appear in a Tier 3 context
    expect(doc).toMatch(/tier 3[\s\S]{0,500}\/request|\/request[\s\S]{0,500}tier 3/i)
  })
})

// ─── Group 6: Safety gates and backend dependency documentation ───────────────

describe('Safety gates and backend dependency documentation', () => {
  it('doc specifies no universal availability claims as a gate', () => {
    const doc = readFileSync(DOC_PATH, 'utf8').toLowerCase()
    expect(doc).toMatch(/universal availability|every dentist|all dentists/)
  })

  it('doc specifies no guaranteed pricing/savings as a gate', () => {
    const doc = readFileSync(DOC_PATH, 'utf8').toLowerCase()
    expect(doc).toMatch(/guaranteed pricing|guaranteed savings|guarantee/)
  })

  it('doc specifies consent as a gate for the request flow', () => {
    const doc = readFileSync(DOC_PATH, 'utf8').toLowerCase()
    expect(doc).toContain('consent')
  })

  it('doc specifies database schema requirements for Tier 3', () => {
    const doc = readFileSync(DOC_PATH, 'utf8').toLowerCase()
    expect(doc).toMatch(/dap_requests|database schema|schema/)
  })

  it('doc specifies that the POST /api/dap/request endpoint is required', () => {
    const doc = readFileSync(DOC_PATH, 'utf8')
    expect(doc).toMatch(/POST \/api\/dap\/request|api\/dap\/request/i)
  })

  it('doc requires consent logging before any practice is contacted', () => {
    const doc = readFileSync(DOC_PATH, 'utf8').toLowerCase()
    expect(doc).toMatch(/consent.*logged|no practice.*contacted.*without|logged.*consent/)
  })

  it('doc specifies rollback decision authority for each tier', () => {
    const doc = readFileSync(DOC_PATH, 'utf8').toLowerCase()
    // Rollback section should differentiate between tiers
    expect(doc).toMatch(/tier 1 rollback|tier 2 rollback|tier 3 rollback/)
  })

  it('doc references the canonical request flow doc', () => {
    const doc = readFileSync(DOC_PATH, 'utf8')
    expect(doc).toContain('dap-request-flow-canonical.md')
  })
})
