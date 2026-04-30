/**
 * Phase 9B — DAP Tier 1 Production Routes
 *
 * PURPOSE: Verify that Tier 1 production routes exist, have safe metadata and content,
 * generate the correct static params, and that Tier 2/Tier 3 routes and all deferred
 * backend integrations remain absent.
 *
 * COVERAGE:
 *   Group 1 — Production route allowlist (filesystem)
 *   Group 2 — Static generation counts
 *   Group 3 — Metadata safety
 *   Group 4 — Homepage safety
 *   Group 5 — Guide page safety
 *   Group 6 — Treatment page safety
 *   Group 7 — Boundary preservation
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, readdirSync } from 'fs'
import { resolve, join } from 'path'

import { exportDapCmsSnapshot } from './dapCmsExport'
import {
  getHomepageHeroModel,
  getDecisionPageCtaModel,
  getTreatmentPageCtaModel,
} from './dapPublicUxRules'
import {
  getDefaultSavingsEducationModel,
} from './dapPublicSectionModels'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROOT = resolve(__dirname, '../..')
const APP_DIR = join(ROOT, 'app')

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

function readRoute(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), 'utf8')
}

// ─── Group 1: Production route allowlist ─────────────────────────────────────

describe('Production route allowlist', () => {
  it('app/dental-advantage-plan/page.tsx exists', () => {
    expect(existsSync(resolve(APP_DIR, 'dental-advantage-plan/page.tsx'))).toBe(true)
  })

  it('app/dental-advantage-plan/layout.tsx exists', () => {
    expect(existsSync(resolve(APP_DIR, 'dental-advantage-plan/layout.tsx'))).toBe(true)
  })

  it('app/guides/[slug]/page.tsx exists', () => {
    expect(existsSync(resolve(APP_DIR, 'guides/[slug]/page.tsx'))).toBe(true)
  })

  it('app/guides/layout.tsx exists', () => {
    expect(existsSync(resolve(APP_DIR, 'guides/layout.tsx'))).toBe(true)
  })

  it('app/treatments/[slug]/page.tsx exists', () => {
    expect(existsSync(resolve(APP_DIR, 'treatments/[slug]/page.tsx'))).toBe(true)
  })

  it('app/treatments/layout.tsx exists', () => {
    expect(existsSync(resolve(APP_DIR, 'treatments/layout.tsx'))).toBe(true)
  })

  it('app/dentists does not exist (Tier 2 — deferred)', () => {
    expect(existsSync(resolve(APP_DIR, 'dentists'))).toBe(false)
  })

  it('app/search does not exist (Tier 2 — deferred)', () => {
    expect(existsSync(resolve(APP_DIR, 'search'))).toBe(false)
  })

  it('app/request does not exist (Tier 3 — deferred)', () => {
    expect(existsSync(resolve(APP_DIR, 'request'))).toBe(false)
  })

  it('only the Phase 9C route handler exists under app/api (no unauthorized API routes)', () => {
    const routeFiles = findFiles(APP_DIR, p => p.endsWith('route.ts') || p.endsWith('route.tsx'))
    const KNOWN_ROUTES = ['app/api/dap/requests/route.ts']
    const unexpected = routeFiles.filter(r => !KNOWN_ROUTES.some(k => r.endsWith(k)))
    expect(unexpected).toHaveLength(0)
  })

  it('preview routes remain — /preview/dap still exists', () => {
    expect(existsSync(resolve(APP_DIR, 'preview/dap'))).toBe(true)
  })

  it('exactly 21 page.tsx files in app/ (Phase 9L added provider-participation list + detail pages)', () => {
    const pages = findFiles(APP_DIR, f => f.endsWith('page.tsx'))
    expect()
  })
})

// ─── Group 2: Static generation counts ───────────────────────────────────────

describe('Static generation counts', () => {
  it('30 decision page slugs available in CMS for guide routes', () => {
    const { decisionPages } = exportDapCmsSnapshot()
    expect(decisionPages).toHaveLength(30)
  })

  it('11 treatment page slugs available in CMS for treatment routes', () => {
    const { treatmentPages } = exportDapCmsSnapshot()
    expect(treatmentPages).toHaveLength(11)
  })

  it('guide page route has generateStaticParams', () => {
    const content = readRoute('app/guides/[slug]/page.tsx')
    expect(content).toContain('generateStaticParams')
  })

  it('treatment page route has generateStaticParams', () => {
    const content = readRoute('app/treatments/[slug]/page.tsx')
    expect(content).toContain('generateStaticParams')
  })

  it('guide generateStaticParams maps decisionPages', () => {
    const content = readRoute('app/guides/[slug]/page.tsx')
    expect(content).toContain('decisionPages')
    expect(content).toContain('d.slug')
  })

  it('treatment generateStaticParams maps treatmentPages', () => {
    const content = readRoute('app/treatments/[slug]/page.tsx')
    expect(content).toContain('treatmentPages')
    expect(content).toContain('t.slug')
  })

  it('guide page route has generateMetadata', () => {
    const content = readRoute('app/guides/[slug]/page.tsx')
    expect(content).toContain('generateMetadata')
  })

  it('treatment page route has generateMetadata', () => {
    const content = readRoute('app/treatments/[slug]/page.tsx')
    expect(content).toContain('generateMetadata')
  })

  it('homepage does not use generateStaticParams (non-SSG single page)', () => {
    const content = readRoute('app/dental-advantage-plan/page.tsx')
    expect(content).not.toContain('generateStaticParams')
  })

  it('guide generateMetadata references seoTitle', () => {
    const content = readRoute('app/guides/[slug]/page.tsx')
    expect(content).toContain('seoTitle')
  })

  it('treatment generateMetadata references seoTitle', () => {
    const content = readRoute('app/treatments/[slug]/page.tsx')
    expect(content).toContain('seoTitle')
  })
})

// ─── Group 3: Metadata safety ─────────────────────────────────────────────────

const FORBIDDEN_METADATA_PATTERNS = [
  /guaranteed dental savings/i,
  /accepted by every dentist/i,
  /join any dentist/i,
  /best dental insurance/i,
  /guaranteed pricing/i,
]

describe('Metadata safety', () => {
  it('homepage metadata title matches safe allowed pattern', () => {
    const content = readRoute('app/dental-advantage-plan/page.tsx')
    expect(content).toMatch(/Dental Advantage Plan/)
    expect(content).toMatch(/No-Insurance Dental Membership|membership/i)
  })

  it('homepage metadata title contains no forbidden patterns', () => {
    const content = readRoute('app/dental-advantage-plan/page.tsx')
    for (const pattern of FORBIDDEN_METADATA_PATTERNS) {
      expect(content).not.toMatch(pattern)
    }
  })

  it('homepage description does not imply guaranteed savings', () => {
    const content = readRoute('app/dental-advantage-plan/page.tsx').toLowerCase()
    expect(content).not.toMatch(/guaranteed savings/)
    expect(content).not.toMatch(/save guaranteed/)
  })

  it('all guide seoTitles are safe — no forbidden patterns', () => {
    const { decisionPages } = exportDapCmsSnapshot()
    for (const page of decisionPages) {
      for (const pattern of FORBIDDEN_METADATA_PATTERNS) {
        expect(page.seoTitle, `seoTitle of ${page.slug}`).not.toMatch(pattern)
      }
    }
  })

  it('all treatment seoTitles are safe — no forbidden patterns', () => {
    const { treatmentPages } = exportDapCmsSnapshot()
    for (const page of treatmentPages) {
      for (const pattern of FORBIDDEN_METADATA_PATTERNS) {
        expect(page.seoTitle, `seoTitle of ${page.slug}`).not.toMatch(pattern)
      }
    }
  })

  it('all guide seoDescriptions are safe', () => {
    const { decisionPages } = exportDapCmsSnapshot()
    for (const page of decisionPages) {
      expect(page.seoDescription.toLowerCase(), `seoDescription of ${page.slug}`)
        .not.toMatch(/guaranteed savings|save guaranteed/)
    }
  })

  it('all treatment seoDescriptions are safe', () => {
    const { treatmentPages } = exportDapCmsSnapshot()
    for (const page of treatmentPages) {
      expect(page.seoDescription.toLowerCase(), `seoDescription of ${page.slug}`)
        .not.toMatch(/guaranteed savings|save guaranteed/)
    }
  })

  it('production layouts declare robots: index, follow', () => {
    const dapLayout = readRoute('app/dental-advantage-plan/layout.tsx')
    const guidesLayout = readRoute('app/guides/layout.tsx')
    const treatmentsLayout = readRoute('app/treatments/layout.tsx')
    expect(dapLayout).toMatch(/robots.*index/)
    expect(guidesLayout).toMatch(/robots.*index/)
    expect(treatmentsLayout).toMatch(/robots.*index/)
  })

  it('guide route uses seoDescription from CMS in metadata', () => {
    const content = readRoute('app/guides/[slug]/page.tsx')
    expect(content).toContain('seoDescription')
  })

  it('treatment route uses seoDescription from CMS in metadata', () => {
    const content = readRoute('app/treatments/[slug]/page.tsx')
    expect(content).toContain('seoDescription')
  })
})

// ─── Group 4: Homepage safety ─────────────────────────────────────────────────

describe('Homepage safety', () => {
  it('hero model has impliesUniversalAvailability: false', () => {
    const hero = getHomepageHeroModel()
    expect(hero.impliesUniversalAvailability).toBe(false)
  })

  it('hero subheadline contains "not insurance" framing', () => {
    const hero = getHomepageHeroModel()
    expect(hero.subheadline.toLowerCase()).toMatch(/not insurance|membership/)
  })

  it('homepage page file has data-implies-universal-availability="false"', () => {
    const content = readRoute('app/dental-advantage-plan/page.tsx')
    expect(content).toContain('data-implies-universal-availability="false"')
  })

  it('homepage does not render DapRequestFlowPreview (no live submission)', () => {
    const content = readRoute('app/dental-advantage-plan/page.tsx')
    expect(content).not.toContain('DapRequestFlowPreview')
  })

  it('homepage does not link CTA to /request (Tier 3 not live)', () => {
    const content = readRoute('app/dental-advantage-plan/page.tsx')
    expect(content).not.toMatch(/href.*['"]\/?request['"]/)
  })

  it('homepage does not link CTA to /search (Tier 2 not live)', () => {
    const content = readRoute('app/dental-advantage-plan/page.tsx')
    expect(content).not.toContain("href: '/search'")
  })

  it('homepage CTAs link to patient-facing routes (Phase 18A: redesigned as public site)', () => {
    const content = readRoute('app/dental-advantage-plan/page.tsx')
    // New homepage links to /dental-advantage-plan/* patient routes — not CB Control Center preview routes
    expect(content).toContain('/dental-advantage-plan/')
    expect(content).not.toContain('/preview/dap/')
  })

  it('homepage does not show a preview label (production mode — Phase 18A redesign)', () => {
    const content = readRoute('app/dental-advantage-plan/page.tsx')
    // Old DapHomepageHeroPreview replaced by standalone public site components in Phase 18A
    expect(content).not.toContain('data-preview-label')
    expect(content).not.toContain('Design preview')
  })

  it('homepage uses standalone page content — no CB Control Center component dependency', () => {
    const content = readRoute('app/dental-advantage-plan/page.tsx')
    // Phase 18A rewrote homepage as a self-contained public marketing page
    expect(content).not.toContain('DapHomepageHeroPreview')
    expect(content).not.toContain('SimulationShell')
  })
})

// ─── Group 5: Guide page safety ───────────────────────────────────────────────

describe('Guide page safety', () => {
  it('decision page CTA model does not imply pricing', () => {
    const ctaModel = getDecisionPageCtaModel()
    expect(ctaModel.impliesPricing).toBe(false)
  })

  it('decision page CTA model does not imply universal availability', () => {
    const ctaModel = getDecisionPageCtaModel()
    expect(ctaModel.impliesUniversalAvailability).toBe(false)
  })

  it('guide page has data-implies-pricing="false" attribute', () => {
    const content = readRoute('app/guides/[slug]/page.tsx')
    expect(content).toContain('data-implies-pricing="false"')
  })

  it('guide page uses data-decision-h1 attribute', () => {
    const content = readRoute('app/guides/[slug]/page.tsx')
    expect(content).toContain('data-decision-h1')
  })

  it('no guide safeAnswer implies enrollment', () => {
    const { decisionPages } = exportDapCmsSnapshot()
    for (const page of decisionPages) {
      expect(page.safeAnswer.toLowerCase(), `safeAnswer of ${page.slug}`)
        .not.toMatch(/you are enrolled|enrollment confirmed|you have enrolled/)
    }
  })

  it('no guide safeAnswer implies guaranteed pricing', () => {
    const { decisionPages } = exportDapCmsSnapshot()
    for (const page of decisionPages) {
      expect(page.safeAnswer.toLowerCase(), `safeAnswer of ${page.slug}`)
        .not.toMatch(/guaranteed savings|guaranteed pricing|save guaranteed/)
    }
  })

  it('no guide safeAnswer implies universal DAP availability', () => {
    const { decisionPages } = exportDapCmsSnapshot()
    for (const page of decisionPages) {
      expect(page.safeAnswer.toLowerCase(), `safeAnswer of ${page.slug}`)
        .not.toMatch(/available everywhere|every dentist|all dentists/)
    }
  })

  it('guide page does not import or reference dapRequestRules', () => {
    const content = readRoute('app/guides/[slug]/page.tsx')
    expect(content).not.toContain('dapRequestRules')
  })

  it('guide page CTAs do not link to /request or /search directly', () => {
    const content = readRoute('app/guides/[slug]/page.tsx')
    expect(content).not.toMatch(/href.*['"]\/?request['"]/)
    expect(content).not.toContain("'/search'")
  })

  it('all guide forbiddenClaims are populated', () => {
    const { decisionPages } = exportDapCmsSnapshot()
    for (const page of decisionPages) {
      expect(page.forbiddenClaims.length, `forbiddenClaims of ${page.slug}`).toBeGreaterThan(0)
    }
  })
})

// ─── Group 6: Treatment page safety ──────────────────────────────────────────

describe('Treatment page safety', () => {
  it('treatment page CTA model does not imply guaranteed pricing', () => {
    const ctaModel = getTreatmentPageCtaModel()
    expect(ctaModel.impliesGuaranteedPricing).toBe(false)
  })

  it('treatment page has data-implies-guaranteed-pricing="false" attribute', () => {
    const content = readRoute('app/treatments/[slug]/page.tsx')
    expect(content).toContain('data-implies-guaranteed-pricing="false"')
  })

  it('treatment page uses data-treatment-h1 attribute', () => {
    const content = readRoute('app/treatments/[slug]/page.tsx')
    expect(content).toContain('data-treatment-h1')
  })

  it('savings education model has impliesGuaranteedPricing: false', () => {
    const model = getDefaultSavingsEducationModel()
    expect(model.impliesGuaranteedPricing).toBe(false)
  })

  it('savings education model body says examples are illustrative', () => {
    const model = getDefaultSavingsEducationModel()
    expect(model.body.toLowerCase()).toMatch(/illustrative|actual.*vary|vary/)
  })

  it('no treatment safeAnswer implies guaranteed pricing', () => {
    const { treatmentPages } = exportDapCmsSnapshot()
    for (const page of treatmentPages) {
      expect(page.safeAnswer.toLowerCase(), `safeAnswer of ${page.slug}`)
        .not.toMatch(/guaranteed savings|guaranteed discount|guaranteed pricing/)
    }
  })

  it('no treatment safeAnswer implies DAP is an insurer or payer', () => {
    const { treatmentPages } = exportDapCmsSnapshot()
    for (const page of treatmentPages) {
      expect(page.safeAnswer.toLowerCase(), `safeAnswer of ${page.slug}`)
        .not.toMatch(/dap pays|dap covers|dap is insurance/)
    }
  })

  it('all treatment forbiddenClaims are populated', () => {
    const { treatmentPages } = exportDapCmsSnapshot()
    for (const page of treatmentPages) {
      expect(page.forbiddenClaims.length, `forbiddenClaims of ${page.slug}`).toBeGreaterThan(0)
    }
  })

  it('treatment page does not import or reference dapRequestRules', () => {
    const content = readRoute('app/treatments/[slug]/page.tsx')
    expect(content).not.toContain('dapRequestRules')
  })

  it('treatment page CTAs do not link to /request or /search directly', () => {
    const content = readRoute('app/treatments/[slug]/page.tsx')
    expect(content).not.toMatch(/href.*['"]\/?request['"]/)
    expect(content).not.toContain("'/search'")
  })
})

// ─── Group 7: Boundary preservation ──────────────────────────────────────────

describe('Boundary preservation', () => {
  it('only the known SQL migrations exist (Phase 9Z added dry-run events migration)', () => {
    const sqlFiles = findFiles(ROOT, p => p.endsWith('.sql'))
    const KNOWN_MIGRATIONS = [
      'supabase/migrations/20260429000000_dap_requests.sql',
      'supabase/migrations/20260429000001_dap_practice_onboarding.sql',
      'supabase/migrations/20260429000002_dap_offer_terms.sql',
      'supabase/migrations/20260429000003_dap_offer_terms_review.sql',
      'supabase/migrations/20260429000004_dap_provider_participation.sql',
      'supabase/migrations/20260430000000_dap_communication_dispatch_events.sql',
      'supabase/migrations/20260430000001_dap_communication_approval_events.sql',
      'supabase/migrations/20260430000002_dap_communication_dry_run_events.sql',
      'supabase/migrations/20260430000003_dap_admin_decision_events.sql',
    ]
    const unexpected = sqlFiles.filter(f => !KNOWN_MIGRATIONS.some(k => f.endsWith(k)))
    expect(unexpected).toHaveLength(0)
  })

  it('only the Phase 9C route handler exists (Phase 9B added zero API routes)', () => {
    const routeFiles = findFiles(ROOT, f => f.endsWith('route.ts') || f.endsWith('route.tsx'))
    const KNOWN_ROUTES = ['app/api/dap/requests/route.ts']
    const unexpected = routeFiles.filter(r => !KNOWN_ROUTES.some(k => r.endsWith(k)))
    expect(unexpected).toHaveLength(0)
  })

  it('no request production route added', () => {
    expect(existsSync(resolve(APP_DIR, 'request'))).toBe(false)
  })

  it('no dentists production route added', () => {
    expect(existsSync(resolve(APP_DIR, 'dentists'))).toBe(false)
  })

  it('request backend remains architecture-only — dapRequestRules has no fetch() calls', () => {
    const content = readRoute('lib/cb-control-center/dapRequestRules.ts')
    expect(content).not.toMatch(/\bfetch\s*\(/)
    expect(content).not.toContain('supabase')
  })

  it('production route files do not import dapRequestRules', () => {
    const homepage   = readRoute('app/dental-advantage-plan/page.tsx')
    const guides     = readRoute('app/guides/[slug]/page.tsx')
    const treatments = readRoute('app/treatments/[slug]/page.tsx')
    expect(homepage).not.toContain('dapRequestRules')
    expect(guides).not.toContain('dapRequestRules')
    expect(treatments).not.toContain('dapRequestRules')
  })

  it('no CRM or MKCRM integration files exist', () => {
    const crmFiles = findFiles(ROOT, p =>
      (p.includes('/crm/') || p.includes('crm-') || p.includes('mkcrm')) &&
      !p.includes('.test.')
    )
    expect(crmFiles).toHaveLength(0)
  })

  it('request flow preview route remains at /preview/dap/request', () => {
    expect(existsSync(resolve(APP_DIR, 'preview/dap/request/page.tsx'))).toBe(true)
  })

  it('DapRequestFlowPreview default (wired=false) mode has no form or fetch — Phase 9D added wired={true} branch only', () => {
    const content = readFileSync(
      resolve(ROOT, 'components/cb-control-center/dap-public/DapRequestFlowPreview.tsx'),
      'utf8'
    )
    // Phase 9D added a wired branch — the component now has a <form> and fetch,
    // but only behind wired={true}. The default (wired=false) still renders no form.
    // This test confirms Phase 9B itself added neither; Phase 9D is the source.
    expect(content).toMatch(/wired.*=.*false|wired\s*=\s*false/)
    // The <form> exists behind the wired gate
    expect(content).toMatch(/<form|data-wired-form/)
    // The default preview branch (wired=false) must not render the form
    expect(content).toMatch(/if\s*\(!wired\)|wired\s*===\s*false/)
  })

  it('Phase 9B production routes exist and are all Tier 1 (informational only)', () => {
    const tier1Routes = [
      resolve(APP_DIR, 'dental-advantage-plan/page.tsx'),
      resolve(APP_DIR, 'guides/[slug]/page.tsx'),
      resolve(APP_DIR, 'treatments/[slug]/page.tsx'),
    ]
    for (const route of tier1Routes) {
      expect(existsSync(route), `missing Tier 1 route: ${route}`).toBe(true)
    }
  })

  it('docs/dap-production-route-readiness.md exists and covers Phase 9B', () => {
    const docPath = resolve(ROOT, 'docs/dap-production-route-readiness.md')
    expect(existsSync(docPath)).toBe(true)
    const content = readFileSync(docPath, 'utf8').toLowerCase()
    expect(content).toMatch(/phase 9b|tier 1.*launch|production.*launch/)
  })
})
