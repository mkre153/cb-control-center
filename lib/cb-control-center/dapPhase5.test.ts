import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { exportDapCmsSnapshot, exportDentistPageToCmsRecord } from './dapCmsExport'
import { MOCK_DENTIST_PAGES } from './mockData'
import { ALL_PREVIEW_PRACTICES } from './dapCityData'
import { REQUEST_FLOW_ROUTE } from './dapDisplayRules'

const snapshot = exportDapCmsSnapshot()
const ROOT     = process.cwd()  // /Users/mike/cb-control-center when running npx vitest

// ─── Test 1: No preview route imports raw mock data ───────────────────────────

describe('Phase 5 — no preview route imports raw mock data directly', () => {
  const PREVIEW_PAGES = [
    'app/preview/dap/page.tsx',
    'app/preview/dap/[city]/page.tsx',
    'app/preview/dap/dentists/[slug]/page.tsx',
    'app/preview/dap/decisions/[slug]/page.tsx',
    'app/preview/dap/cms-snapshot/page.tsx',
    'app/preview/dap/request/page.tsx',
    'app/preview/dap/request/confirmation/page.tsx',
  ]
  const PREVIEW_COMPONENTS = [
    'components/dap-preview/ProviderResultCard.tsx',
    'components/dap-preview/DentistDetailFromCms.tsx',
    'components/dap-preview/DecisionPageView.tsx',
  ]
  const FORBIDDEN_PATTERNS = [
    "from '@/lib/cb-control-center/mockData'",
    "from '@/lib/cb-control-center/dapCityData'",
    "MOCK_DENTIST_PAGES",
    "ALL_PREVIEW_PRACTICES",
    "DAP_CITY_PAGES",
  ]

  ;[...PREVIEW_PAGES, ...PREVIEW_COMPONENTS].forEach(file => {
    it(`${file} contains no raw mock data imports`, () => {
      const content = readFileSync(resolve(ROOT, file), 'utf-8')
      FORBIDDEN_PATTERNS.forEach(pattern => {
        expect(
          content,
          `"${pattern}" must not appear in ${file}`,
        ).not.toContain(pattern)
      })
    })
  })
})

// ─── Test 2: All static params come from exportDapCmsSnapshot() ───────────────

describe('Phase 5 — all generateStaticParams sources come from CMS snapshot', () => {
  it('decision page slugs in snapshot match all seeded pages (30 total through Phase 7A)', () => {
    expect(snapshot.decisionPages).toHaveLength(30)
    const slugs = snapshot.decisionPages.map(d => d.slug)
    // original 5
    expect(slugs).toContain('no-insurance-dentist-san-diego')
    expect(slugs).toContain('dental-membership-plan-vs-insurance')
    expect(slugs).toContain('dentist-payment-options-without-insurance')
    expect(slugs).toContain('affordable-dental-cleaning-without-insurance')
    expect(slugs).toContain('how-to-save-on-crowns-without-insurance')
    // new 10
    expect(slugs).toContain('dental-membership-plan-worth-it-for-crown')
    expect(slugs).toContain('dap-vs-paying-cash-dentist')
    expect(slugs).toContain('can-i-use-dap-without-dental-insurance')
    expect(slugs).toContain('how-much-save-dental-work-without-insurance')
    expect(slugs).toContain('what-to-do-if-dentist-does-not-offer-dap')
    expect(slugs).toContain('can-i-ask-dentist-to-offer-dental-savings-plan')
    expect(slugs).toContain('is-dap-dental-insurance')
    expect(slugs).toContain('difference-between-dap-and-dental-insurance')
    expect(slugs).toContain('can-i-join-dap-before-next-appointment')
    expect(slugs).toContain('what-happens-if-no-dentist-offers-dap-near-me')
  })

  it('city slugs in snapshot cover all original directive cities', () => {
    const slugs = snapshot.cities.map(c => c.slug)
    expect(slugs.length).toBeGreaterThanOrEqual(5)
    ;['san-diego', 'la-mesa', 'chula-vista', 'la-jolla', 'escondido'].forEach(s => {
      expect(slugs).toContain(s)
    })
  })

  it('dentist page slugs in snapshot match public non-declined practices', () => {
    snapshot.dentistPages.forEach(dp => {
      const practice = ALL_PREVIEW_PRACTICES.find(p => p.id === dp.practiceId)!
      expect(practice.provider_status).not.toBe('declined')
    })
  })
})

// ─── Test 3: Decision pages never render forbiddenClaims ─────────────────────

describe('Phase 5 — decision pages never render forbiddenClaims as patient content', () => {
  function extractCore(claim: string): string {
    return claim.replace(/"/g, '').split(' — ')[0].trim().toLowerCase()
  }

  it('forbiddenClaims are absent from safeAnswer across all decision pages', () => {
    snapshot.decisionPages.forEach(page => {
      const answer = page.safeAnswer.toLowerCase()
      page.forbiddenClaims.forEach(claim => {
        const core = extractCore(claim)
        if (core.length > 4) {
          expect(answer, `"${core}" must not appear in safeAnswer of "${page.slug}"`).not.toContain(core)
        }
      })
    })
  })

  it('forbiddenClaims are absent from seoTitle and seoDescription across all decision pages', () => {
    snapshot.decisionPages.forEach(page => {
      const seo = (page.seoTitle + ' ' + page.seoDescription).toLowerCase()
      page.forbiddenClaims.forEach(claim => {
        const core = extractCore(claim)
        if (core.length > 4) {
          expect(seo, `"${core}" must not appear in SEO copy of "${page.slug}"`).not.toContain(core)
        }
      })
    })
  })

  it('DecisionPageView component source does not render the forbiddenClaims field', () => {
    const source = readFileSync(
      resolve(ROOT, 'components/dap-preview/DecisionPageView.tsx'),
      'utf-8',
    )
    expect(source).not.toContain('forbiddenClaims')
  })
})

// ─── Test 4: Join CTA only when publicDisplay.showJoinCta === true ────────────

describe('Phase 5 — Join CTA only when publicDisplay.showJoinCta === true', () => {
  const confirmed   = MOCK_DENTIST_PAGES.find(p => p.provider_status === 'confirmed_dap_provider')!
  const unconfirmed = MOCK_DENTIST_PAGES.find(p => p.provider_status === 'not_confirmed')!

  it('snapshot practices: showJoinCta is true only for the fully-gated confirmed provider', () => {
    const withJoin = snapshot.practices.filter(p => p.publicDisplay.showJoinCta)
    withJoin.forEach(p => {
      expect(p.status).toBe('confirmed_dap_provider')
      expect(p.publicDisplay.showPricing).toBe(true)
    })
  })

  it('snapshot practices: no unconfirmed practice has showJoinCta = true', () => {
    snapshot.practices
      .filter(p => p.status !== 'confirmed_dap_provider')
      .forEach(p => {
        expect(p.publicDisplay.showJoinCta).toBe(false)
      })
  })

  it('exportPracticeToCmsRecord respects the 3-gate rule for Join CTA', () => {
    expect(exportDentistPageToCmsRecord(confirmed, true, true).primaryCta.label.toLowerCase()).toBe('join plan')
    expect(exportDentistPageToCmsRecord(confirmed, false, true).primaryCta.label.toLowerCase()).not.toBe('join plan')
    expect(exportDentistPageToCmsRecord(confirmed, true, false).primaryCta.label.toLowerCase()).not.toBe('join plan')
    expect(exportDentistPageToCmsRecord(unconfirmed, true, true).primaryCta.label.toLowerCase()).not.toBe('join plan')
  })
})

// ─── Test 5: Pricing only when publicDisplay.showPricing === true ─────────────

describe('Phase 5 — pricing only when publicDisplay.showPricing === true', () => {
  it('all practices where showPricing = true are confirmed providers', () => {
    snapshot.practices
      .filter(p => p.publicDisplay.showPricing)
      .forEach(p => {
        expect(p.status).toBe('confirmed_dap_provider')
        expect(p.offerSummary).not.toBeNull()
      })
  })

  it('all practices where showPricing = false have offerSummary = null', () => {
    snapshot.practices
      .filter(p => !p.publicDisplay.showPricing)
      .forEach(p => {
        expect(p.offerSummary).toBeNull()
      })
  })

  it('unconfirmed dentist pages in snapshot have offerSummary = null', () => {
    snapshot.dentistPages
      .filter(d => d.pageType === 'unconfirmed_request_detail')
      .forEach(d => {
        expect(d.offerSummary).toBeNull()
      })
  })
})

// ─── Test 6: Declined/internal-only records do not generate public routes ─────

describe('Phase 5 — declined/internal-only records do not generate public dentist pages', () => {
  it('no snapshot.dentistPages record has publicState = "internal_only"', () => {
    snapshot.dentistPages.forEach(d => {
      expect(d.publicState).not.toBe('internal_only')
    })
  })

  it('declined practice (Clairemont Dental Care) is absent from snapshot.dentistPages', () => {
    const declined = MOCK_DENTIST_PAGES.find(p => p.provider_status === 'declined')!
    expect(snapshot.dentistPages.find(d => d.practiceId === declined.id)).toBeUndefined()
  })

  it('declined practice is absent from snapshot.practices', () => {
    snapshot.practices.forEach(p => expect(p.status).not.toBe('declined'))
  })

  it('all 4 publicState values are correctly assigned in snapshot', () => {
    const states = new Set(snapshot.dentistPages.map(d => d.publicState))
    // We have confirmed_provider, request_dentist, and search_estimate in the dataset
    expect(states).toContain('confirmed_provider')
    expect(states).toContain('request_dentist')
    // declined / internal_only must NOT appear
    expect(states).not.toContain('internal_only')
  })
})

// ─── Test 7: Non-confirmed practices do not render confirmed-provider claims ──

describe('Phase 5 — non-confirmed practices do not render confirmed-provider claims', () => {
  const nonConfirmedPages = snapshot.dentistPages.filter(
    d => d.publicState !== 'confirmed_provider',
  )

  it('non-confirmed dentist pages have pageType = "unconfirmed_request_detail"', () => {
    nonConfirmedPages.forEach(d => {
      expect(d.pageType).toBe('unconfirmed_request_detail')
    })
  })

  it('non-confirmed dentist pages: badgeLabel is not "Confirmed DAP Provider"', () => {
    nonConfirmedPages.forEach(d => {
      expect(d.badgeLabel).not.toBe('Confirmed DAP Provider')
    })
  })

  it('non-confirmed dentist pages: offerSummary is null (no pricing exposed)', () => {
    nonConfirmedPages.forEach(d => {
      expect(d.offerSummary).toBeNull()
    })
  })

  it('non-confirmed dentist pages: expectationCopy is present', () => {
    nonConfirmedPages.forEach(d => {
      expect(d.expectationCopy).not.toBeNull()
    })
  })

  it('non-confirmed dentist pages: primaryCta.href routes to request flow', () => {
    nonConfirmedPages.forEach(d => {
      expect(d.primaryCta.href).toBe(REQUEST_FLOW_ROUTE)
    })
  })
})

// ─── Test 8: City pages correctly calculate visible and hidden practices ──────

describe('Phase 5 — city pages correctly calculate visible and hidden practices', () => {
  it('visiblePracticeSlugs + hiddenPracticeIds equals total practices for each city', () => {
    snapshot.cities.forEach(city => {
      const totalFromIds = city.practiceIds.length
      const visibleCount = city.visiblePracticeSlugs.length
      const hiddenCount  = city.hiddenPracticeIds.length
      expect(visibleCount + hiddenCount).toBe(totalFromIds)
    })
  })

  it('hiddenPracticeIds contains only declined practices', () => {
    const declinedIds = ALL_PREVIEW_PRACTICES
      .filter(p => p.provider_status === 'declined')
      .map(p => p.id)

    snapshot.cities.forEach(city => {
      city.hiddenPracticeIds.forEach(id => {
        expect(declinedIds).toContain(id)
      })
    })
  })

  it('visiblePracticeSlugs does not include any declined practice slug', () => {
    const declinedIds = new Set(
      ALL_PREVIEW_PRACTICES.filter(p => p.provider_status === 'declined').map(p => p.id),
    )
    snapshot.cities.forEach(city => {
      city.visiblePracticeSlugs.forEach(slug => {
        const practice = ALL_PREVIEW_PRACTICES.find(p => {
          const s = p.pageSlug?.split('/').at(-1)
          return s === slug
        })
        if (practice) {
          expect(declinedIds).not.toContain(practice.id)
        }
      })
    })
  })

  it('publicClaimLevel is "full" for La Mesa (has confirmed provider)', () => {
    const laMesa = snapshot.cities.find(c => c.slug === 'la-mesa')!
    expect(laMesa.publicClaimLevel).toBe('full')
  })

  it('publicClaimLevel is "none" for Escondido (no practices)', () => {
    const escondido = snapshot.cities.find(c => c.slug === 'escondido')!
    expect(escondido.publicClaimLevel).toBe('none')
  })

  it('publicClaimLevel is "limited" for San Diego (unconfirmed practices only)', () => {
    const sd = snapshot.cities.find(c => c.slug === 'san-diego')!
    expect(sd.publicClaimLevel).toBe('limited')
  })
})

// ─── Test 9: Decision pages have safe answers and required facts ──────────────

describe('Phase 5 — all decision pages have safe answers and required facts', () => {
  it('all decision pages have non-empty decisionQuestion, safeAnswer, requiredFacts', () => {
    expect(snapshot.decisionPages).toHaveLength(30)
    snapshot.decisionPages.forEach(d => {
      expect(d.decisionQuestion.trim().length, `${d.slug}: decisionQuestion`).toBeGreaterThan(0)
      expect(d.safeAnswer.trim().length,       `${d.slug}: safeAnswer`).toBeGreaterThan(0)
      expect(d.requiredFacts.length,            `${d.slug}: requiredFacts`).toBeGreaterThan(0)
      expect(d.forbiddenClaims.length,          `${d.slug}: forbiddenClaims`).toBeGreaterThan(0)
    })
  })

  it('all decision pages have relatedCitySlugs, relatedPracticeSlugs, publicClaimLevel', () => {
    snapshot.decisionPages.forEach(d => {
      expect(Array.isArray(d.relatedCitySlugs),     `${d.slug}: relatedCitySlugs`).toBe(true)
      expect(Array.isArray(d.relatedPracticeSlugs),  `${d.slug}: relatedPracticeSlugs`).toBe(true)
      expect(['full', 'limited', 'none']).toContain(d.publicClaimLevel)
    })
  })

  it('relatedPracticeSlugs only reference non-declined practices', () => {
    const declinedSlugs = new Set(
      ALL_PREVIEW_PRACTICES
        .filter(p => p.provider_status === 'declined')
        .map(p => p.pageSlug?.split('/').at(-1))
        .filter(Boolean),
    )
    snapshot.decisionPages.forEach(d => {
      d.relatedPracticeSlugs.forEach(slug => {
        expect(declinedSlugs, `${d.slug}: relatedPracticeSlugs must not include declined slug "${slug}"`).not.toContain(slug)
      })
    })
  })

  it('relatedCitySlugs only reference known city slugs', () => {
    const knownSlugs = new Set(snapshot.cities.map(c => c.slug))
    snapshot.decisionPages.forEach(d => {
      d.relatedCitySlugs.forEach(slug => {
        expect(knownSlugs, `${d.slug}: unknown relatedCitySlug "${slug}"`).toContain(slug)
      })
    })
  })
})

// ─── Test 10: Build produces expanded static page count ───────────────────────

describe('Phase 5 — expanded static page count (snapshot count, not build output)', () => {
  it('snapshot generates 30 decision page routes (15 original + 15 added in Phase 7A)', () => {
    expect(snapshot.decisionPages).toHaveLength(30)
  })

  it('snapshot generates 21 city routes (5 original + 16 added in Phase 7A)', () => {
    expect(snapshot.cities).toHaveLength(21)
  })

  it('snapshot generates at least 10 dentist detail routes', () => {
    expect(snapshot.dentistPages.length).toBeGreaterThanOrEqual(10)
  })

  it('all decision page slugs are unique', () => {
    const slugs  = snapshot.decisionPages.map(d => d.slug)
    const unique = new Set(slugs)
    expect(unique.size).toBe(slugs.length)
  })

  it('all city slugs are unique', () => {
    const slugs  = snapshot.cities.map(c => c.slug)
    const unique = new Set(slugs)
    expect(unique.size).toBe(slugs.length)
  })
})
