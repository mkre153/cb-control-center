/**
 * Phase 18A — DAP Public Site v0.1
 *
 * PURPOSE: Confirm all 6 required public routes exist with correct content, safety
 * attributes, and no forbidden language (no insurance misrepresentation, no PHI,
 * no payment claims, no live search implied). Verifies the required disclaimer
 * appears in the shared footer.
 *
 * COVERAGE:
 *   Group 1 — Route files exist (all 6 required public routes)
 *   Group 2 — Homepage content (patient-first, search card, savings cards, safety)
 *   Group 3 — Compare page (table present, careful claims, safety attrs)
 *   Group 4 — Find-a-dentist page (placeholder state, no fake live search)
 *   Group 5 — For-practices page (no billing/claims/payment assertions)
 *   Group 6 — Guide page (6 options present, DAP positioned correctly)
 *   Group 7 — Shared layout / footer (disclaimer, nav, safety)
 *   Group 8 — Forbidden language across all public pages
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const ROOT = resolve(__dirname, '../..')

function readPage(relPath: string): string {
  return readFileSync(resolve(ROOT, relPath), 'utf8')
}

// ─── Group 1: Route files exist ───────────────────────────────────────────────

describe('Group 1 — All 6 required DAP public routes exist', () => {
  const REQUIRED_ROUTES = [
    'app/dental-advantage-plan/page.tsx',
    'app/dental-advantage-plan/how-it-works/page.tsx',
    'app/dental-advantage-plan/compare/page.tsx',
    'app/dental-advantage-plan/find-a-dentist/page.tsx',
    'app/dental-advantage-plan/for-practices/page.tsx',
    'app/dental-advantage-plan/guide/page.tsx',
  ]

  for (const route of REQUIRED_ROUTES) {
    it(`${route} exists`, () => {
      expect(existsSync(resolve(ROOT, route))).toBe(true)
    })
  }

  it('shared nav component exists', () => {
    expect(existsSync(resolve(ROOT, 'components/dap/DapSiteNav.tsx'))).toBe(true)
  })

  it('shared footer component exists', () => {
    expect(existsSync(resolve(ROOT, 'components/dap/DapSiteFooter.tsx'))).toBe(true)
  })

  it('layout.tsx imports DapSiteNav and DapSiteFooter', () => {
    const src = readPage('app/dental-advantage-plan/layout.tsx')
    expect(src).toContain('DapSiteNav')
    expect(src).toContain('DapSiteFooter')
  })
})

// ─── Group 2: Homepage content ────────────────────────────────────────────────

describe('Group 2 — Homepage content', () => {
  const src = readPage('app/dental-advantage-plan/page.tsx')

  it('has data-page-kind homepage', () => {
    expect(src).toContain('data-page-kind="homepage"')
  })

  it('has data-implies-universal-availability="false"', () => {
    expect(src).toContain('data-implies-universal-availability="false"')
  })

  it('has data-implies-guaranteed-savings="false"', () => {
    expect(src).toContain('data-implies-guaranteed-savings="false"')
  })

  it('includes the "No insurance? Start here." eyebrow', () => {
    expect(src).toContain('No insurance? Start here.')
  })

  it('includes the primary headline about saving on dental care', () => {
    expect(src).toContain('Find out how much you can save on dental care')
  })

  it('has a search form pointing to find-a-dentist', () => {
    expect(src).toContain('action="/dental-advantage-plan/find-a-dentist"')
  })

  it('has ZIP code input in search form', () => {
    expect(src).toContain('name="zip"')
  })

  it('has care type select in search form', () => {
    expect(src).toContain('name="need"')
  })

  it('includes savings scenario cards section', () => {
    expect(src).toContain('data-section="savings-scenarios"')
  })

  it('has at least 3 savings cards defined in the SAVINGS_CARDS array', () => {
    // Cards rendered via .map() — count unique card titles instead of data-attr occurrences
    expect(src).toContain("title: 'Preventive care'")
    expect(src).toContain("title: 'Small dental work'")
    expect(src).toContain("title: 'Larger treatment'")
  })

  it('includes how-it-works section', () => {
    expect(src).toContain('data-section="how-it-works"')
  })

  it('has 4 numbered steps', () => {
    // Step numbers 1-4 rendered as text
    expect(src).toContain("n: '1'")
    expect(src).toContain("n: '4'")
  })

  it('includes compare teaser section', () => {
    expect(src).toContain('data-section="compare-teaser"')
  })

  it('includes for-practices teaser section', () => {
    expect(src).toContain('data-section="for-practices-teaser"')
  })

  it('links to find-a-dentist as primary CTA', () => {
    expect(src).toContain('href="/dental-advantage-plan/find-a-dentist"')
  })

  it('links to guide as secondary CTA', () => {
    expect(src).toContain('href="/dental-advantage-plan/guide"')
  })

  it('does not use CB Control Center components', () => {
    expect(src).not.toContain('DapHomepageHeroPreview')
    expect(src).not.toContain('DapHowItWorksSection')
    expect(src).not.toContain('SimulationShell')
  })
})

// ─── Group 3: Compare page ────────────────────────────────────────────────────

describe('Group 3 — Compare page', () => {
  const src = readPage('app/dental-advantage-plan/compare/page.tsx')

  it('has data-page-kind compare', () => {
    expect(src).toContain('data-page-kind="compare"')
  })

  it('has data-implies-insurance="false"', () => {
    expect(src).toContain('data-implies-insurance="false"')
  })

  it('has data-implies-guaranteed-savings="false"', () => {
    expect(src).toContain('data-implies-guaranteed-savings="false"')
  })

  it('has data-implies-universal-availability="false"', () => {
    expect(src).toContain('data-implies-universal-availability="false"')
  })

  it('includes a comparison table', () => {
    expect(src).toContain('<table')
  })

  it('compares at least 3 columns: DAP, insurance, cash', () => {
    expect(src).toContain('Dental Advantage Plan')
    expect(src).toContain('Traditional Insurance')
    expect(src).toContain('Paying Cash')
  })

  it('includes careful notes that DAP does not set pricing', () => {
    expect(src.toLowerCase()).toContain('does not set')
  })

  it('does not make absolute savings claims', () => {
    // "universally better" is allowed in denial context ("not to recommend one option as universally better")
    expect(src).not.toContain('guaranteed savings')
    expect(src).not.toContain('always cheaper')
    expect(src).not.toContain('DAP is always better')
  })
})

// ─── Group 4: Find-a-dentist page ─────────────────────────────────────────────

describe('Group 4 — Find-a-dentist page', () => {
  const src = readPage('app/dental-advantage-plan/find-a-dentist/page.tsx')

  it('has data-page-kind find_dentist', () => {
    expect(src).toContain('data-page-kind="find_dentist"')
  })

  it('has data-implies-universal-availability="false"', () => {
    expect(src).toContain('data-implies-universal-availability="false"')
  })

  it('has data-search-live="false"', () => {
    expect(src).toContain('data-search-live="false"')
  })

  it('includes a search form', () => {
    expect(src).toContain('<form')
    expect(src).toContain('name="zip"')
  })

  it('has a placeholder empty state for results', () => {
    expect(src).toContain('data-search-results-placeholder')
  })

  it('includes limited availability notice', () => {
    expect(src).toMatch(/coming soon|limited availability|not yet available/i)
  })

  it('does not imply live results are available', () => {
    expect(src).not.toContain('data-search-live="true"')
    expect(src).not.toContain('showing live results')
  })

  it('does not link to internal preview routes', () => {
    expect(src).not.toContain('/preview/dap/')
  })
})

// ─── Group 5: For-practices page ─────────────────────────────────────────────

describe('Group 5 — For-practices page', () => {
  const src = readPage('app/dental-advantage-plan/for-practices/page.tsx')

  it('has data-page-kind for_practices', () => {
    expect(src).toContain('data-page-kind="for_practices"')
  })

  it('has data-implies-payment="false"', () => {
    expect(src).toContain('data-implies-payment="false"')
  })

  it('has data-implies-insurance="false"', () => {
    expect(src).toContain('data-implies-insurance="false"')
  })

  it('states DAP does not collect payments', () => {
    expect(src).toContain('does not collect')
  })

  it('states DAP does not adjudicate claims', () => {
    expect(src).toContain('adjudicate')
  })

  it('has an enrollment placeholder (not a live form)', () => {
    expect(src).toContain('data-enrollment-placeholder')
  })

  it('does not link to CB Control Center internal routes', () => {
    expect(src).not.toContain('/preview/dap/onboarding')
    expect(src).not.toContain('CB Control Center')
  })

  it('does not claim DAP handles billing', () => {
    expect(src).not.toContain('DAP bills')
    expect(src).not.toContain('DAP processes')
    expect(src).not.toContain('DAP pays')
  })
})

// ─── Group 6: Guide page ──────────────────────────────────────────────────────

describe('Group 6 — Guide page (5-minute guide)', () => {
  const src = readPage('app/dental-advantage-plan/guide/page.tsx')

  it('has data-page-kind guide', () => {
    expect(src).toContain('data-page-kind="guide"')
  })

  it('has data-implies-guaranteed-savings="false"', () => {
    expect(src).toContain('data-implies-guaranteed-savings="false"')
  })

  it('title references dental care without insurance', () => {
    expect(src.toLowerCase()).toContain('without insurance')
  })

  it('covers paying cash as an option', () => {
    expect(src).toContain("id: 'cash'")
  })

  it('covers dental insurance as an option', () => {
    expect(src).toContain("id: 'insurance'")
  })

  it('covers membership plans as an option', () => {
    expect(src).toContain("id: 'membership'")
  })

  it('covers financing as an option', () => {
    expect(src).toContain("id: 'financing'")
  })

  it('covers community clinics as an option', () => {
    expect(src).toContain("id: 'community'")
  })

  it('covers dental schools as an option', () => {
    expect(src).toContain("id: 'dental-schools'")
  })

  it('positions DAP as a way to find membership-plan practices (not as insurance)', () => {
    const lower = src.toLowerCase()
    expect(lower).toContain('find')
    expect(lower).toContain('membership')
  })

  it('includes a disclaimer about informational purpose', () => {
    expect(src).toMatch(/informational purposes only/i)
  })

  it('does not link to internal preview routes', () => {
    expect(src).not.toContain('/preview/dap/')
  })
})

// ─── Group 7: Shared layout and footer ───────────────────────────────────────

describe('Group 7 — Shared layout and footer', () => {
  const layoutSrc = readPage('app/dental-advantage-plan/layout.tsx')
  const footerSrc = readPage('components/dap/DapSiteFooter.tsx')
  const navSrc = readPage('components/dap/DapSiteNav.tsx')

  it('layout has flex-col min-h-screen structure (not constrained max-w-4xl from old layout)', () => {
    expect(layoutSrc).toContain('flex-col')
    expect(layoutSrc).not.toContain('max-w-4xl mx-auto px-4 py-8 space-y-8')
  })

  it('footer has data-dap-footer attribute', () => {
    expect(footerSrc).toContain('data-dap-footer')
  })

  it('footer has data-dap-disclaimer attribute', () => {
    expect(footerSrc).toContain('data-dap-disclaimer')
  })

  it('footer includes the required "not dental insurance" disclaimer', () => {
    expect(footerSrc).toContain('not dental insurance')
  })

  it('footer disclaimer mentions "does not provide dental care"', () => {
    expect(footerSrc).toContain('does not provide dental care')
  })

  it('footer disclaimer mentions "does not process insurance claims"', () => {
    expect(footerSrc).toContain('process insurance claims')
  })

  it('footer disclaimer mentions "does not collect protected health information"', () => {
    expect(footerSrc).toContain('protected health information')
  })

  it('nav has data-dap-site-nav attribute', () => {
    expect(navSrc).toContain('data-dap-site-nav')
  })

  it('nav links to all 5 sub-pages', () => {
    expect(navSrc).toContain('/dental-advantage-plan/how-it-works')
    expect(navSrc).toContain('/dental-advantage-plan/find-a-dentist')
    expect(navSrc).toContain('/dental-advantage-plan/compare')
    expect(navSrc).toContain('/dental-advantage-plan/for-practices')
    expect(navSrc).toContain('/dental-advantage-plan/guide')
  })
})

// ─── Group 8: Forbidden language ─────────────────────────────────────────────

describe('Group 8 — Forbidden language across all public pages', () => {
  const PUBLIC_PAGES = [
    'app/dental-advantage-plan/page.tsx',
    'app/dental-advantage-plan/how-it-works/page.tsx',
    'app/dental-advantage-plan/compare/page.tsx',
    'app/dental-advantage-plan/find-a-dentist/page.tsx',
    'app/dental-advantage-plan/for-practices/page.tsx',
    'app/dental-advantage-plan/guide/page.tsx',
  ]

  const FORBIDDEN = [
    'guaranteed savings',
    'guaranteed coverage',
    'DAP covers',
    'DAP pays',
    'DAP insures',
    'DAP processes claims',
    'insurance coverage',
    // 'PHI' and 'protected health information' are OK in denial context ("does not collect PHI")
    'sentAt',
    'queuedAt',
    'emailBody',
    'MKCRM',
    'CB Control Center',
    'preview/dap/',
  ]

  for (const page of PUBLIC_PAGES) {
    it(`${page} contains no forbidden terms`, () => {
      const src = readPage(page)
      for (const term of FORBIDDEN) {
        expect(src, `${page} should not contain "${term}"`).not.toContain(term)
      }
    })
  }

  it('no public page collects PHI fields (SSN, DOB, medical record)', () => {
    for (const page of PUBLIC_PAGES) {
      const src = readPage(page).toLowerCase()
      expect(src, `${page} should not have SSN field`).not.toContain('name="ssn"')
      expect(src, `${page} should not have DOB field`).not.toContain('name="dob"')
      expect(src, `${page} should not have medical-record field`).not.toContain('name="medical-record"')
    }
  })

  it('no public page claims to be dental insurance', () => {
    for (const page of PUBLIC_PAGES) {
      const src = readPage(page)
      // "is not dental insurance" is OK; claiming "is dental insurance" is not
      expect(src, `${page} should not claim to be dental insurance`).not.toMatch(
        /DAP is dental insurance|dental advantage plan is insurance/i
      )
    }
  })
})
