/**
 * Phase 7G — Public Page QA and Build Boundary Audit
 *
 * PURPOSE: Prove that Phase 7F page compositions are preview-only, safe, and
 * cannot accidentally publish unsafe DAP claims. This file enforces the build
 * boundary as a living test — if a future change violates it, CI will fail.
 *
 * COVERAGE:
 *   Group 1 — Route file inventory (boundary enforcement)
 *   Group 2 — SSG slug documentation (why static pages = 80, not 78)
 *   Group 3 — Request form submission audit (no live API path)
 *   Group 4 — Section-level safety claims (comparison + savings ed)
 *   Group 5 — Page root safety attributes (all 7 page kinds)
 *   Group 6 — dap-pages components isolated from app/ routes
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, readdirSync } from 'fs'
import { resolve, join } from 'path'
import { renderToString } from 'react-dom/server'

import { DapComparisonSection } from '@/components/cb-control-center/dap-public/DapComparisonSection'
import { DapSavingsEducationSection } from '@/components/cb-control-center/dap-public/DapSavingsEducationSection'
import { DapHomepagePage } from '@/components/cb-control-center/dap-pages/DapHomepagePage'
import { DapCityPage } from '@/components/cb-control-center/dap-pages/DapCityPage'
import { DapDentistPage } from '@/components/cb-control-center/dap-pages/DapDentistPage'
import { DapSearchResultsPage } from '@/components/cb-control-center/dap-pages/DapSearchResultsPage'
import { DapDecisionPage } from '@/components/cb-control-center/dap-pages/DapDecisionPage'
import { DapTreatmentPage } from '@/components/cb-control-center/dap-pages/DapTreatmentPage'
import { DapRequestFlowPage } from '@/components/cb-control-center/dap-pages/DapRequestFlowPage'

import {
  getDefaultHowItWorksModel,
  getDefaultFaqModel,
  getDefaultComparisonModel,
  getDefaultSavingsEducationModel,
} from '../dapPublicSectionModels'
import {
  getHomepageHeroModel,
  getRequestFlowModel,
  getCityAvailabilitySummary,
  getCityPageModel,
  getSearchResultsModel,
  getDecisionPageCtaModel,
  getTreatmentPageCtaModel,
  getNoResultsModel,
  getDentistPageModel,
  getPracticeStatusBadge,
  getPrimaryCtaForPractice,
  getSecondaryCtaForPractice,
  getAllowedPublicClaimsForPractice,
} from '../dapPublicUxRules'
import { exportDapCmsSnapshot } from '../dapCmsExport'
import type { DapProviderCardModel, DapGateState } from '../dapPublicUxTypes'

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

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ALL_GATES: DapGateState = { offerTermsValidated: true, ctaGateUnlocked: true }
const NO_GATES: DapGateState  = { offerTermsValidated: false, ctaGateUnlocked: false }

function makeCard(state: Parameters<typeof getPrimaryCtaForPractice>[0], gates = NO_GATES): DapProviderCardModel {
  return {
    practiceId: `audit-${state}`,
    practiceName: 'Audit Practice',
    city: 'San Diego',
    state: 'CA',
    availabilityState: state,
    statusBadge: getPracticeStatusBadge(state),
    primaryCta: { type: getPrimaryCtaForPractice(state, gates), label: 'Primary', href: '/test' },
    secondaryCta: (() => {
      const t = getSecondaryCtaForPractice(state, gates)
      return t ? { type: t, label: 'Secondary', href: '/test2' } : null
    })(),
    allowedClaims: getAllowedPublicClaimsForPractice(state, gates),
    isPublic: state !== 'unavailable_internal_only',
  }
}

// ─── Group 1: Route file inventory ───────────────────────────────────────────
// Every page.tsx in app/ is a public route. This group locks the exact set.
// Updated in Phase 9B: Tier 1 production routes promoted from preview.

describe('Route file inventory', () => {
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
    // CBCC v2 stage detail route (Step 0 + Stages 1–7)
    'app/projects/[slug]/stages/[stageNumber]/page.tsx',
  ]

  it('exactly 58 page.tsx files exist in app/ (CBCC v2 added stage detail route)', () => {
    const found = findFiles(join(ROOT, 'app'), f => f.endsWith('page.tsx'))
    expect(found.length).toBe(KNOWN_ROUTES.length)
  })

  it('all known route files exist on disk', () => {
    for (const rel of KNOWN_ROUTES) {
      expect(existsSync(resolve(ROOT, rel)), `missing: ${rel}`).toBe(true)
    }
  })

  it('no page.tsx files exist outside app/ (components/ is route-free)', () => {
    const inComponents = findFiles(join(ROOT, 'components'), f => f.endsWith('page.tsx'))
    expect(inComponents).toHaveLength(0)
  })

  it('no page.tsx files exist in lib/ (lib/ is route-free)', () => {
    const inLib = findFiles(join(ROOT, 'lib'), f => f.endsWith('page.tsx'))
    expect(inLib).toHaveLength(0)
  })

  it('only known API route handlers exist (Phase 9C added POST /api/dap/requests)', () => {
    const routes = findFiles(ROOT, f => f.endsWith('route.ts') || f.endsWith('route.tsx'))
    const KNOWN_ROUTES = [
      'app/api/dap/requests/route.ts',
      'app/api/businesses/dental-advantage-plan/stages/review/route.ts',
    ]
    const unexpected = routes.filter(r => !KNOWN_ROUTES.some(k => r.endsWith(k)))
    expect(unexpected).toHaveLength(0)
  })

  it('only known production namespaces exist outside /preview/', () => {
    const KNOWN_PRODUCTION_NAMESPACES = [
      '/dental-advantage-plan/',
      '/guides/',
      '/treatments/',
      '/businesses/',
      '/projects/',
    ]
    const found = findFiles(join(ROOT, 'app'), f => f.endsWith('page.tsx'))
    const unexpected = found.filter(f => {
      const relative = f.replace(join(ROOT, 'app'), '')
      if (relative === '/page.tsx') return false
      if (relative.startsWith('/preview/')) return false
      return !KNOWN_PRODUCTION_NAMESPACES.some(ns => relative.startsWith(ns))
    })
    expect(unexpected).toHaveLength(0)
  })

  it('Tier 2 and Tier 3 page routes do not exist (directory, search, request)', () => {
    expect(existsSync(resolve(ROOT, 'app/dentists'))).toBe(false)
    expect(existsSync(resolve(ROOT, 'app/search'))).toBe(false)
    expect(existsSync(resolve(ROOT, 'app/request'))).toBe(false)
    // app/api exists (Phase 9C) but contains only the POST /api/dap/requests route handler
    expect(existsSync(resolve(ROOT, 'app/api/dap/requests/route.ts'))).toBe(true)
    expect(existsSync(resolve(ROOT, 'app/api/dap/requests/page.tsx'))).toBe(false)
  })
})

// ─── Group 2: SSG slug documentation ─────────────────────────────────────────
// Why did the build counter change from 78 to 81?
//
// Next.js App Router's "Generating static pages (0/N)" counter counts:
//   - each layout.tsx as 1 task
//   - each non-SSG page.tsx as 1 task
//   - each SSG slug as 1 task
//
// Current verified breakdown that produces 81:
//   2  layouts   (app/layout.tsx + app/preview/layout.tsx)
//   7  non-SSG   (/, /preview/dap, /preview/dap/cms-snapshot,
//                 /preview/dap/design, /preview/dap/request,
//                 /preview/dap/request/confirmation, /_not-found)
//  72  SSG       (21 cities + 10 dentists + 30 decisions + 11 treatments)
//  ──
//  81  total
//
// History:
//   78 = 2 layouts + 4 non-SSG + 72 SSG (before request pages)
//   80 = 2 layouts + 6 non-SSG + 72 SSG (after Phase 7D/7E request pages)
//   81 = 2 layouts + 7 non-SSG + 72 SSG (after Phase 8A design preview page)
//
// These tests lock the slug counts so any future change (add/remove a slug)
// appears as a test failure.

describe('SSG slug audit — build page count documentation', () => {
  it('cities: 21 slugs feed /preview/dap/[city] (Next.js build shows first 3)', () => {
    const { cities } = exportDapCmsSnapshot()
    expect(cities.length).toBe(21)
  })

  it('dentist pages: 10 slugs feed /preview/dap/dentists/[slug]', () => {
    const { dentistPages } = exportDapCmsSnapshot()
    expect(dentistPages.length).toBe(10)
  })

  it('decision pages: 30 slugs feed /preview/dap/decisions/[slug]', () => {
    const { decisionPages } = exportDapCmsSnapshot()
    expect(decisionPages.length).toBe(30)
  })

  it('treatment pages: 11 slugs feed /preview/dap/treatments/[slug]', () => {
    const { treatmentPages } = exportDapCmsSnapshot()
    expect(treatmentPages.length).toBe(11)
  })

  it('total SSG-generated pages = 72 (21+10+30+11)', () => {
    const { cities, dentistPages, decisionPages, treatmentPages } = exportDapCmsSnapshot()
    const total = cities.length + dentistPages.length + decisionPages.length + treatmentPages.length
    expect(total).toBe(72)
  })
})

// ─── Group 3: Request form submission audit ───────────────────────────────────
// Two request-flow surfaces exist:
//   A) DapRequestFlowPreview (Phase 7E) — fully disabled, no form element
//   B) RequestDentistForm (dap-preview/) — live inputs but NO backend call;
//      clicking Submit flips local React state only (setSubmitted(true)).
//
// Neither surface has a backend. No route.ts exists. No fetch() call exists.

describe('Request form submission audit', () => {
  const FORM_SRC = readFileSync(
    resolve(ROOT, 'components/dap-preview/RequestDentistForm.tsx'),
    'utf8'
  )

  it('RequestDentistForm contains no fetch() call', () => {
    expect(FORM_SRC).not.toMatch(/\bfetch\s*\(/)
  })

  it('RequestDentistForm contains no axios reference', () => {
    expect(FORM_SRC).not.toMatch(/\baxios\b/)
  })

  it('RequestDentistForm contains no /api/ path', () => {
    expect(FORM_SRC).not.toContain('/api/')
  })

  it('RequestDentistForm uses no <form> element (no implicit HTTP submission)', () => {
    // Without a <form>, Enter key in inputs doesn't trigger HTTP POST.
    // Button is type="button" — local onClick only.
    expect(FORM_SRC).not.toContain('<form')
  })

  it('DapRequestFlowPreview rendered HTML contains no <form element', () => {
    const html = renderToString(
      <DapRequestFlowPage model={getRequestFlowModel('city_availability')} />
    )
    expect(html).not.toContain('<form')
    expect(html).not.toContain('action=')
  })
})

// ─── Group 4: Section-level safety claims ────────────────────────────────────
// Comparison and savings-education sections are the two places where claim
// language could accidentally promise guaranteed pricing or universal coverage.

describe('Section safety claims', () => {
  it('DapSavingsEducationSection always renders data-implies-guaranteed-pricing="false"', () => {
    const html = renderToString(
      <DapSavingsEducationSection model={getDefaultSavingsEducationModel()} />
    )
    expect(html).toContain('data-implies-guaranteed-pricing="false"')
    expect(html).not.toContain('data-implies-guaranteed-pricing="true"')
  })

  it('DapSavingsEducationSection: impliesGuaranteedPricing is false even with a custom model', () => {
    // Verify the attribute isn't togglable to true via a different model body
    const custom = {
      headline: 'Save money',
      body: 'You might save some amount.',
      impliesGuaranteedPricing: false as const,
    }
    const html = renderToString(<DapSavingsEducationSection model={custom} />)
    expect(html).toContain('data-implies-guaranteed-pricing="false"')
  })

  it('getDefaultSavingsEducationModel(): impliesGuaranteedPricing === false', () => {
    const model = getDefaultSavingsEducationModel()
    expect(model.impliesGuaranteedPricing).toBe(false)
  })

  it('DapComparisonSection rendered output contains no "guarantee" language', () => {
    const html = renderToString(
      <DapComparisonSection model={getDefaultComparisonModel()} />
    )
    expect(html).not.toMatch(/\bguarantee\b/i)
    expect(html).not.toMatch(/you will save \$|prices are fixed|savings guaranteed/i)
  })

  it('getDefaultComparisonModel() column points contain no pricing guarantees', () => {
    const model = getDefaultComparisonModel()
    const allPoints = model.columns.flatMap(c => c.points)
    for (const point of allPoints) {
      expect(point).not.toMatch(/\bguarantee\b/i)
      expect(point).not.toMatch(/you will save \$|always cheaper|savings are fixed/i)
    }
  })
})

// ─── Group 5: Page root safety attributes ────────────────────────────────────
// All 7 Phase 7F page composition components must carry safety attributes on
// their root element. These are machine-readable signals for future QA tooling.

describe('Page root safety attributes', () => {
  it('DapHomepagePage: data-page-kind="homepage" and data-preview-page on root', () => {
    const html = renderToString(
      <DapHomepagePage
        hero={getHomepageHeroModel()}
        howItWorks={getDefaultHowItWorksModel()}
        comparison={getDefaultComparisonModel()}
        faq={getDefaultFaqModel('homepage')}
      />
    )
    expect(html).toContain('data-page-kind="homepage"')
    expect(html).toContain('data-preview-page')
    // Hero inside carries the universal-availability invariant
    expect(html).toContain('data-implies-universal-availability="false"')
  })

  it('DapCityPage: data-page-kind="city_page" and data-implies-universal-availability="false" on root', () => {
    const model = getCityPageModel('San Diego', 2)
    const html = renderToString(
      <DapCityPage
        model={model}
        summary={getCityAvailabilitySummary('San Diego', 2, 0, 4)}
        cards={[makeCard('confirmed', ALL_GATES)]}
        noResults={null}
        howItWorks={getDefaultHowItWorksModel()}
        faq={getDefaultFaqModel('city_page')}
      />
    )
    // Both attributes must be on the page root div (first occurrence)
    const rootOpenTag = html.slice(0, html.indexOf('>') + 1)
    expect(rootOpenTag).toContain('data-page-kind="city_page"')
    expect(rootOpenTag).toContain('data-implies-universal-availability="false"')
  })

  it('DapDentistPage: data-page-kind, data-template-id, and data-is-public on root', () => {
    const dentistModel = getDentistPageModel('confirmed', 'Audit Dental', ALL_GATES)!
    const html = renderToString(
      <DapDentistPage
        model={dentistModel}
        card={makeCard('confirmed', ALL_GATES)}
        savingsEd={getDefaultSavingsEducationModel()}
        faq={getDefaultFaqModel('dentist_page')}
      />
    )
    const rootOpenTag = html.slice(0, html.indexOf('>') + 1)
    expect(rootOpenTag).toContain('data-page-kind="dentist_page"')
    expect(rootOpenTag).toContain(`data-template-id="${dentistModel.templateId}"`)
    expect(rootOpenTag).toContain('data-is-public="true"')
  })

  it('DapSearchResultsPage: data-page-kind and no dead-end guarantee inside', () => {
    const model = getSearchResultsModel({ confirmedCount: 1, notConfirmedCount: 0, requestedCount: 0, searchLocation: 'San Diego' })
    const html = renderToString(
      <DapSearchResultsPage
        model={model}
        providerCards={[makeCard('confirmed', ALL_GATES)]}
        howItWorks={getDefaultHowItWorksModel()}
      />
    )
    expect(html).toContain('data-page-kind="search_results_page"')
    expect(html).toContain('data-is-dead-end="false"')
    expect(html).not.toContain('data-is-dead-end="true"')
  })

  it('DapDecisionPage: data-page-kind and data-implies-pricing="false" on root', () => {
    const html = renderToString(
      <DapDecisionPage
        h1="Is a dental savings plan right for me?"
        ctaModel={getDecisionPageCtaModel()}
        comparison={getDefaultComparisonModel()}
        savingsEd={getDefaultSavingsEducationModel()}
        faq={getDefaultFaqModel('decision_page')}
      />
    )
    const rootOpenTag = html.slice(0, html.indexOf('>') + 1)
    expect(rootOpenTag).toContain('data-page-kind="decision_page"')
    expect(rootOpenTag).toContain('data-implies-pricing="false"')
  })

  it('DapTreatmentPage: data-page-kind and data-implies-guaranteed-pricing="false" on root AND in savings section', () => {
    const html = renderToString(
      <DapTreatmentPage
        h1="Dental crowns and Dental Advantage Plan"
        ctaModel={getTreatmentPageCtaModel()}
        savingsEd={getDefaultSavingsEducationModel()}
        faq={getDefaultFaqModel('treatment_page')}
      />
    )
    const rootOpenTag = html.slice(0, html.indexOf('>') + 1)
    // Page root carries the CTA model invariant
    expect(rootOpenTag).toContain('data-page-kind="treatment_page"')
    expect(rootOpenTag).toContain('data-implies-guaranteed-pricing="false"')
    // Savings education section carries its own invariant
    expect(html).toContain('data-section="savings-education"')
    expect(html).toContain('data-implies-guaranteed-pricing="false"')
  })

  it('DapRequestFlowPage: data-page-kind="request_flow" and consent field inside', () => {
    const html = renderToString(
      <DapRequestFlowPage model={getRequestFlowModel('specific_dentist')} />
    )
    expect(html).toContain('data-page-kind="request_flow"')
    expect(html).toContain('data-consent-field')
    expect(html).toContain('data-preview-banner')
  })
})

// ─── Group 6: dap-pages isolation from app/ routes ───────────────────────────
// Phase 7F page compositions live in components/, not app/. This group enforces
// that no non-preview app/ route file imports from the dap-pages component
// directory. Preview routes are exempt — they are the intended consumer of
// dap-pages compositions (e.g. /preview/dap/design/page.tsx).
//
// The invariant is: production routes (non-/preview/) cannot reach dap-pages.
// If a developer accidentally wires a page composition to a production route,
// this group will fail.

describe('dap-pages isolation from app/ routes', () => {
  const APP_PAGES = findFiles(join(ROOT, 'app'), f => f.endsWith('page.tsx'))

  // Preview routes may import dap-pages compositions — that is their purpose.
  // Only production (non-preview) routes are forbidden from importing dap-pages.
  const PRODUCTION_PAGES = APP_PAGES.filter(f => {
    const relative = f.replace(join(ROOT, 'app'), '')
    return !relative.startsWith('/preview/')
  })

  it('no production (non-preview) app route imports from components/cb-control-center/dap-pages/', () => {
    for (const file of PRODUCTION_PAGES) {
      const src = readFileSync(file, 'utf8')
      // Match import paths like '@/components/cb-control-center/dap-pages' or relative
      expect(src, `${file} imports from dap-pages`).not.toMatch(
        /from ['"](@\/)?components\/cb-control-center\/dap-pages/
      )
    }
  })

  it('dap-pages/ directory contains no page.tsx files', () => {
    const dapPagesDir = join(ROOT, 'components/cb-control-center/dap-pages')
    const pageFiles = findFiles(dapPagesDir, f => f.endsWith('page.tsx'))
    expect(pageFiles).toHaveLength(0)
  })

  it('dap-pages/ directory contains only tsx component files and index.ts', () => {
    const dapPagesDir = join(ROOT, 'components/cb-control-center/dap-pages')
    const allFiles = findFiles(dapPagesDir, () => true)
    for (const file of allFiles) {
      expect(file).toMatch(/\.(tsx|ts)$/)
      // No layout, loading, error, or route files
      expect(file).not.toMatch(/\/(layout|loading|error|not-found|route)\.(tsx?|js)$/)
    }
  })
})
