import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { runClaimQA } from '../dapClaimQA'
import { exportDapCmsSnapshot } from '../dapCmsExport'
import type {
  DapPracticeCmsRecord,
  DapCityCmsRecord,
  DapDentistPageCmsRecord,
  DapDecisionPageCmsRecord,
  DapCmsSnapshot,
} from '../../dap/site/dapCmsTypes'

// ─── Mock factories ───────────────────────────────────────────────────────────

const DEFAULT_PUBLIC_DISPLAY: DapPracticeCmsRecord['publicDisplay'] = {
  isPublic:           true,
  showPricing:        false,
  showJoinCta:        false,
  showConfirmedBadge: false,
  ctaLabel:           'Request this dentist',
  ctaHref:            '/preview/dap/request',
}

function makePractice(overrides: Omit<Partial<DapPracticeCmsRecord>, 'publicDisplay'> & {
  publicDisplay?: Partial<DapPracticeCmsRecord['publicDisplay']>
} = {}): DapPracticeCmsRecord {
  const { publicDisplay: pdOverrides, ...rest } = overrides
  return {
    id:            'test-001',
    slug:          'test-practice',
    name:          'Test Practice',
    status:        'not_confirmed',
    city:          'San Diego',
    county:        'San Diego County',
    state:         'CA',
    zip:           '92101',
    publicUrlPath: '/preview/dap/dentists/test-practice',
    publicDisplay: { ...DEFAULT_PUBLIC_DISPLAY, ...pdOverrides },
    offerSummary:  null,
    safetyMetadata: {
      forbiddenClaims:    [],
      requiresDisclaimer: true,
      disclaimer:         'Test practice has not confirmed participation.',
    },
    ...rest,
  }
}

function makeDentistPage(overrides: Partial<DapDentistPageCmsRecord> = {}): DapDentistPageCmsRecord {
  return {
    slug:          'test-dentist',
    practiceId:    'test-001',
    practiceName:  'Test Dentist',
    city:          'San Diego',
    state:         'CA',
    zip:           '92101',
    publicUrlPath: '/preview/dap/dentists/test-dentist',
    publicState:   'request_dentist',
    pageType:      'unconfirmed_request_detail',
    heading:       'Test Dentist — Request Dental Advantage Plan',
    badgeLabel:    'Not a DAP provider yet',
    bodySections:  ['about this practice', 'request dap at this office'],
    primaryCta:    { label: 'Request this dentist', href: '/preview/dap/request' },
    expectationCopy: 'This does not mean the dentist currently offers DAP.',
    offerSummary:  null,
    forbiddenClaims: [],
    ...overrides,
  }
}

function makeCity(overrides: Partial<DapCityCmsRecord> = {}): DapCityCmsRecord {
  return {
    slug:                 'test-city',
    cityName:             'Test City',
    countyName:           'San Diego County',
    state:                'CA',
    publicUrlPath:        '/preview/dap/test-city',
    heading:              'Dentists in Test City',
    subheading:           'See which listed practices are confirmed DAP providers, or request that a dentist be contacted about participating.',
    practiceIds:          [],
    visiblePracticeSlugs: [],
    hiddenPracticeIds:    [],
    publicClaimLevel:     'none',
    seoTitle:             'Dentists in Test City — Dental Advantage Plan',
    seoDescription:       'Find dentists in Test City or request one near you.',
    primaryCta:           { label: 'Request a DAP dentist', href: '/preview/dap/request' },
    ...overrides,
  }
}

function makeDecisionPage(overrides: Partial<DapDecisionPageCmsRecord> = {}): DapDecisionPageCmsRecord {
  return {
    slug:            'test-decision',
    queryIntent:     'test patient intent',
    decisionQuestion: 'Is DAP available near me?',
    audience:        'Adults without dental insurance',
    safeAnswer:      'Request a DAP dentist near you. No confirmed provider is guaranteed in your area.',
    primaryCtaLogic: 'Route to request flow.',
    requiredFacts:   ['DAP is a directory.'],
    forbiddenClaims: [],
    seoTitle:        'Is DAP Available Near Me? — Dental Advantage Plan',
    seoDescription:  'Find a DAP dentist near you or submit a request through Dental Advantage Plan.',
    relatedCitySlugs:     [],
    relatedPracticeSlugs: [],
    publicClaimLevel:     'none',
    ...overrides,
  }
}

function makeSnapshot(overrides: Partial<DapCmsSnapshot> = {}): DapCmsSnapshot {
  return { practices: [], cities: [], dentistPages: [], decisionPages: [], treatmentPages: [], ...overrides }
}

// ─── Test 1: Confirmed-provider claim detection ───────────────────────────────

describe('Phase 6 — claim scanner detects unsafe confirmed-provider claims', () => {
  it('flags a non-confirmed dentist page heading that contains "confirmed provider"', () => {
    const page = makeDentistPage({
      publicState: 'request_dentist',
      heading:     'Confirmed Provider at Test Dentist — Join Now',
    })
    const { warnings } = runClaimQA(makeSnapshot({ dentistPages: [page] }))
    expect(warnings.some(w => w.category === 'confirmed_provider_claim')).toBe(true)
  })

  it('flags a non-confirmed dentist page badgeLabel that says "participating dentist"', () => {
    const page = makeDentistPage({
      publicState: 'request_dentist',
      badgeLabel:  'Participating Dentist — DAP accepted here',
    })
    const { warnings } = runClaimQA(makeSnapshot({ dentistPages: [page] }))
    expect(warnings.some(w => w.category === 'confirmed_provider_claim')).toBe(true)
  })

  it('does NOT flag a confirmed dentist page for confirmed-provider language (allowed)', () => {
    const page = makeDentistPage({
      publicState: 'confirmed_provider',
      heading:     'Dental Advantage Plan at Irene Olaes DDS — Confirmed Provider',
      badgeLabel:  'Confirmed DAP Provider',
    })
    const { warnings } = runClaimQA(makeSnapshot({ dentistPages: [page] }))
    expect(warnings.filter(w => w.category === 'confirmed_provider_claim')).toHaveLength(0)
  })
})

// ─── Test 2: Pricing claim detection ─────────────────────────────────────────

describe('Phase 6 — claim scanner detects unsafe pricing claims', () => {
  it('flags a practice record with offerSummary non-null when showPricing is false', () => {
    const practice = makePractice({
      publicDisplay: { showPricing: false },
      offerSummary: { adultAnnualFee: '$450/yr', childAnnualFee: '$350/yr', source: 'Test' },
    })
    const { warnings } = runClaimQA(makeSnapshot({ practices: [practice] }))
    expect(warnings.some(w => w.category === 'pricing_claim')).toBe(true)
    expect(warnings.some(w => w.field === 'offerSummary')).toBe(true)
  })

  it('flags a non-confirmed dentist page heading with dollar pricing', () => {
    const page = makeDentistPage({
      publicState: 'request_dentist',
      heading:     'Test Dentist — $199/yr plan available now',
    })
    const { warnings } = runClaimQA(makeSnapshot({ dentistPages: [page] }))
    expect(warnings.some(w => w.category === 'pricing_claim')).toBe(true)
  })

  it('flags a non-confirmed dentist page bodySections with "annual fee" language', () => {
    const page = makeDentistPage({
      publicState:  'request_dentist',
      bodySections: ['annual fee of $399 per adult'],
    })
    const { warnings } = runClaimQA(makeSnapshot({ dentistPages: [page] }))
    expect(warnings.some(w => w.category === 'pricing_claim')).toBe(true)
  })

  it('does NOT flag a confirmed dentist page for pricing language (allowed)', () => {
    const page = makeDentistPage({
      publicState: 'confirmed_provider',
      bodySections: ['plan overview', 'pricing', 'how to enroll'],
      offerSummary: { adultAnnualFee: '$450/yr', childAnnualFee: '$350/yr', source: 'Test' },
    })
    const { warnings } = runClaimQA(makeSnapshot({ dentistPages: [page] }))
    // Confirmed pages are not scanned for pricing phrases
    expect(warnings.filter(w => w.category === 'pricing_claim')).toHaveLength(0)
  })
})

// ─── Test 3: Enrollment claim detection ──────────────────────────────────────

describe('Phase 6 — claim scanner detects unsafe enrollment claims', () => {
  it('flags a practice record whose ctaLabel says "Join plan" when showJoinCta is false', () => {
    const practice = makePractice({
      publicDisplay: { showJoinCta: false, ctaLabel: 'Join plan' },
    })
    const { warnings } = runClaimQA(makeSnapshot({ practices: [practice] }))
    expect(warnings.some(w => w.category === 'enrollment_claim')).toBe(true)
  })

  it('flags showJoinCta = true on a non-confirmed practice (structural integrity)', () => {
    const practice = makePractice({
      status:        'not_confirmed',
      publicDisplay: { showJoinCta: true },
    })
    const { warnings } = runClaimQA(makeSnapshot({ practices: [practice] }))
    expect(warnings.some(w => w.category === 'enrollment_claim')).toBe(true)
  })

  it('flags a non-confirmed dentist page primaryCta.label of "Join plan"', () => {
    const page = makeDentistPage({
      publicState: 'request_dentist',
      primaryCta:  { label: 'Join plan', href: '/preview/dap/test-dentist/enroll' },
    })
    const { warnings } = runClaimQA(makeSnapshot({ dentistPages: [page] }))
    expect(warnings.some(w => w.category === 'enrollment_claim')).toBe(true)
  })

  it('does NOT flag a confirmed practice with showJoinCta = true (allowed)', () => {
    const practice = makePractice({
      status:        'confirmed_dap_provider',
      publicDisplay: { showJoinCta: true, ctaLabel: 'Join plan' },
    })
    const { warnings } = runClaimQA(makeSnapshot({ practices: [practice] }))
    expect(warnings.filter(w => w.category === 'enrollment_claim')).toHaveLength(0)
  })
})

// ─── Test 4: Universal availability claim detection ───────────────────────────

describe('Phase 6 — claim scanner detects unsafe universal availability claims', () => {
  it('flags a city heading that says "all dentists offer DAP"', () => {
    const city = makeCity({ heading: 'All Dentists in San Diego Offer DAP' })
    const { warnings } = runClaimQA(makeSnapshot({ cities: [city] }))
    expect(warnings.some(w => w.category === 'universal_availability_claim')).toBe(true)
  })

  it('flags a city heading that says "every dentist accepts DAP"', () => {
    const city = makeCity({ heading: 'Every Dentist Accepts DAP Near You' })
    const { warnings } = runClaimQA(makeSnapshot({ cities: [city] }))
    expect(warnings.some(w => w.category === 'universal_availability_claim')).toBe(true)
  })

  it('flags a city heading matching FORBIDDEN_CITY_CLAIMS ("Find participating dentists near you")', () => {
    const city = makeCity({ heading: 'Find participating dentists near you in San Diego' })
    const { warnings } = runClaimQA(makeSnapshot({ cities: [city] }))
    expect(warnings.some(w => w.category === 'universal_availability_claim')).toBe(true)
  })

  it('flags a decision page safeAnswer that says "every dentist accepts DAP"', () => {
    const page = makeDecisionPage({
      safeAnswer: 'DAP is available at every dentist in San Diego County.',
    })
    const { warnings } = runClaimQA(makeSnapshot({ decisionPages: [page] }))
    expect(warnings.some(w => w.category === 'universal_availability_claim')).toBe(true)
  })

  it('flags a decision page safeAnswer that says "any dentist"', () => {
    const page = makeDecisionPage({
      safeAnswer: 'You can use DAP at any dentist in the area.',
    })
    const { warnings } = runClaimQA(makeSnapshot({ decisionPages: [page] }))
    expect(warnings.some(w => w.category === 'universal_availability_claim')).toBe(true)
  })
})

// ─── Test 5: Safe request/availability language passes without warnings ───────

describe('Phase 6 — claim scanner passes safe request and availability language', () => {
  it('safe city record with request-framed copy produces zero warnings', () => {
    const city = makeCity({
      heading:       'Dentists in Test City',
      subheading:    'See which listed practices are confirmed DAP providers, or request that a dentist be contacted about participating.',
      seoTitle:      'Dentists in Test City — Dental Advantage Plan',
      seoDescription: 'Find a DAP dentist near you or request one through Dental Advantage Plan.',
    })
    const { totalWarnings } = runClaimQA(makeSnapshot({ cities: [city] }))
    expect(totalWarnings).toBe(0)
  })

  it('safe non-confirmed dentist page with no pricing or enrollment language produces zero warnings', () => {
    const page = makeDentistPage()
    const { totalWarnings } = runClaimQA(makeSnapshot({ dentistPages: [page] }))
    expect(totalWarnings).toBe(0)
  })

  it('safe decision page with request-flow language produces zero warnings', () => {
    const page = makeDecisionPage({
      safeAnswer: 'No confirmed provider is available in this area yet. Submit a request and DAP may contact practices near you.',
    })
    const { totalWarnings } = runClaimQA(makeSnapshot({ decisionPages: [page] }))
    expect(totalWarnings).toBe(0)
  })

  it('safe practice record with correct gates produces zero warnings', () => {
    const practice = makePractice({
      status:        'not_confirmed',
      publicDisplay: { showPricing: false, showJoinCta: false, ctaLabel: 'Request this dentist' },
      offerSummary:  null,
    })
    const { totalWarnings } = runClaimQA(makeSnapshot({ practices: [practice] }))
    expect(totalWarnings).toBe(0)
  })

  it('mix of safe records across all four collections produces zero warnings', () => {
    const result = runClaimQA(makeSnapshot({
      practices:     [makePractice()],
      cities:        [makeCity()],
      dentistPages:  [makeDentistPage()],
      decisionPages: [makeDecisionPage()],
    }))
    expect(result.totalWarnings).toBe(0)
  })
})

// ─── Test 6: QA summary shape + real snapshot is clean ───────────────────────

describe('Phase 6 — snapshot inspector QA summary fields and clean real snapshot', () => {
  const snapshot = exportDapCmsSnapshot()
  const qa = runClaimQA(snapshot)

  it('runClaimQA returns all required summary fields', () => {
    expect(typeof qa.totalWarnings).toBe('number')
    expect(typeof qa.totalPractices).toBe('number')
    expect(typeof qa.confirmedProviders).toBe('number')
    expect(typeof qa.nonConfirmedPractices).toBe('number')
    expect(typeof qa.practicesWithPricing).toBe('number')
    expect(typeof qa.practicesWithJoinCta).toBe('number')
    expect(typeof qa.totalCities).toBe('number')
    expect(typeof qa.totalDentistPages).toBe('number')
    expect(typeof qa.confirmedDentistPages).toBe('number')
    expect(typeof qa.nonConfirmedDentistPages).toBe('number')
    expect(typeof qa.totalDecisionPages).toBe('number')
    expect(typeof qa.practicesWithForbiddenClaims).toBe('number')
    expect(typeof qa.dentistPagesWithForbiddenClaims).toBe('number')
    expect(typeof qa.decisionPagesWithForbiddenClaims).toBe('number')
    expect(Array.isArray(qa.warnings)).toBe(true)
    expect(typeof qa.warningsByCategory).toBe('object')
  })

  it('warningsByCategory has all four QA categories', () => {
    expect('confirmed_provider_claim'     in qa.warningsByCategory).toBe(true)
    expect('pricing_claim'                in qa.warningsByCategory).toBe(true)
    expect('enrollment_claim'             in qa.warningsByCategory).toBe(true)
    expect('universal_availability_claim' in qa.warningsByCategory).toBe(true)
  })

  it('real CMS snapshot has zero QA warnings — all public data is safe', () => {
    expect(
      qa.totalWarnings,
      qa.warnings.length > 0
        ? `Warnings found:\n${qa.warnings.map(w => `  [${w.category}] ${w.recordId} → ${w.field}: "${w.phrase}"`).join('\n')}`
        : '',
    ).toBe(0)
  })

  it('all four category warning counts sum to totalWarnings', () => {
    const sum = Object.values(qa.warningsByCategory).reduce((a, b) => a + b, 0)
    expect(sum).toBe(qa.totalWarnings)
  })
})

// ─── Test 7: Snapshot inspector counts by page/state ─────────────────────────

describe('Phase 6 — snapshot inspector accurately reports counts', () => {
  const snapshot = exportDapCmsSnapshot()
  const qa = runClaimQA(snapshot)

  it('totalPractices matches snapshot.practices.length', () => {
    expect(qa.totalPractices).toBe(snapshot.practices.length)
  })

  it('confirmedProviders + nonConfirmedPractices = totalPractices', () => {
    expect(qa.confirmedProviders + qa.nonConfirmedPractices).toBe(qa.totalPractices)
  })

  it('totalCities matches snapshot.cities.length', () => {
    expect(qa.totalCities).toBe(snapshot.cities.length)
    expect(qa.totalCities).toBe(21)
  })

  it('totalDecisionPages matches snapshot.decisionPages.length', () => {
    expect(qa.totalDecisionPages).toBe(snapshot.decisionPages.length)
    expect(qa.totalDecisionPages).toBe(30)
  })

  it('totalDentistPages matches snapshot.dentistPages.length', () => {
    expect(qa.totalDentistPages).toBe(snapshot.dentistPages.length)
  })

  it('confirmedDentistPages + nonConfirmedDentistPages = totalDentistPages', () => {
    expect(qa.confirmedDentistPages + qa.nonConfirmedDentistPages).toBe(qa.totalDentistPages)
  })

  it('practicesWithPricing matches snapshot practices with showPricing = true', () => {
    const count = snapshot.practices.filter(p => p.publicDisplay.showPricing).length
    expect(qa.practicesWithPricing).toBe(count)
  })

  it('practicesWithJoinCta matches snapshot practices with showJoinCta = true', () => {
    const count = snapshot.practices.filter(p => p.publicDisplay.showJoinCta).length
    expect(qa.practicesWithJoinCta).toBe(count)
  })

  it('decisionPagesWithForbiddenClaims > 0 (all decision pages have internal forbidden claims)', () => {
    // Every decision page has at least one forbiddenClaim (internal metadata, never rendered)
    expect(qa.decisionPagesWithForbiddenClaims).toBe(30)
  })
})

// ─── Test 8: Public components never render forbiddenClaims ──────────────────

describe('Phase 6 — public page components never render forbiddenClaims or safetyMetadata', () => {
  const PUBLIC_COMPONENTS = [
    'components/dap-preview/DentistDetailFromCms.tsx',
    'components/dap-preview/DecisionPageView.tsx',
    'components/dap-preview/ProviderResultCard.tsx',
  ]

  PUBLIC_COMPONENTS.forEach(file => {
    it(`${file} does not reference forbiddenClaims`, () => {
      const src = readFileSync(resolve(process.cwd(), file), 'utf-8')
      expect(src).not.toContain('forbiddenClaims')
    })

    it(`${file} does not reference safetyMetadata`, () => {
      const src = readFileSync(resolve(process.cwd(), file), 'utf-8')
      expect(src).not.toContain('safetyMetadata')
    })
  })

  it('DecisionPageView does not render requiredFacts as the only non-forbidden field that is internal-like', () => {
    // requiredFacts IS intended to render (it is patient-safe supporting evidence)
    // forbiddenClaims is NOT. Verify DecisionPageView renders requiredFacts but not forbiddenClaims.
    const src = readFileSync(
      resolve(process.cwd(), 'components/dap-preview/DecisionPageView.tsx'),
      'utf-8',
    )
    expect(src).toContain('requiredFacts')
    expect(src).not.toContain('forbiddenClaims')
  })
})

// ─── Test 9: Non-confirmed pages do not render Join CTA ──────────────────────

describe('Phase 6 — non-confirmed pages never render Join CTA', () => {
  const snapshot = exportDapCmsSnapshot()

  it('no non-confirmed dentist page has primaryCta.label of "join plan"', () => {
    const nonConfirmed = snapshot.dentistPages.filter(d => d.publicState !== 'confirmed_provider')
    expect(nonConfirmed.length).toBeGreaterThan(0)
    nonConfirmed.forEach(dp => {
      expect(dp.primaryCta.label.toLowerCase()).not.toBe('join plan')
    })
  })

  it('no non-confirmed dentist page primaryCta.href contains /enroll', () => {
    const nonConfirmed = snapshot.dentistPages.filter(d => d.publicState !== 'confirmed_provider')
    nonConfirmed.forEach(dp => {
      expect(dp.primaryCta.href).not.toContain('/enroll')
    })
  })

  it('no practice with non-confirmed status has showJoinCta = true', () => {
    const nonConfirmed = snapshot.practices.filter(p => p.status !== 'confirmed_dap_provider')
    nonConfirmed.forEach(p => {
      expect(p.publicDisplay.showJoinCta).toBe(false)
    })
  })

  it('no practice with showJoinCta = false has ctaLabel "join plan"', () => {
    snapshot.practices
      .filter(p => !p.publicDisplay.showJoinCta)
      .forEach(p => {
        expect(p.publicDisplay.ctaLabel.toLowerCase()).not.toBe('join plan')
      })
  })

  it('confirmed dentist pages have primaryCta.href containing /enroll when showJoinCta is true', () => {
    // Confirmed pages in snapshot use all-gates-unlocked defaults
    const confirmed = snapshot.dentistPages.filter(d => d.publicState === 'confirmed_provider')
    expect(confirmed.length).toBeGreaterThan(0)
    confirmed.forEach(dp => {
      // In the default snapshot export, confirmed pages get showJoinCta = true
      expect(dp.primaryCta.href).toContain('/enroll')
    })
  })
})

// ─── Test 10: Build integrity — snapshot produces correct static param sets ───

describe('Phase 6 — build integrity: snapshot produces correct static param inventories', () => {
  const snapshot = exportDapCmsSnapshot()

  it('snapshot produces 21 city params for generateStaticParams', () => {
    const params = snapshot.cities.map(c => ({ city: c.slug }))
    expect(params).toHaveLength(21)
    params.forEach(p => expect(p.city.length).toBeGreaterThan(0))
  })

  it('city slugs include all 5 original DAP cities', () => {
    const slugs = snapshot.cities.map(c => c.slug)
    expect(slugs).toContain('san-diego')
    expect(slugs).toContain('la-mesa')
    expect(slugs).toContain('chula-vista')
    expect(slugs).toContain('la-jolla')
    expect(slugs).toContain('escondido')
  })

  it('snapshot produces 30 decision params for generateStaticParams', () => {
    const params = snapshot.decisionPages.map(d => ({ slug: d.slug }))
    expect(params).toHaveLength(30)
    const slugSet = new Set(params.map(p => p.slug))
    expect(slugSet.size).toBe(30)
  })

  it('snapshot dentist params are unique and non-empty', () => {
    const params = snapshot.dentistPages.map(d => ({ slug: d.slug }))
    expect(params.length).toBeGreaterThanOrEqual(5)
    const slugSet = new Set(params.map(p => p.slug))
    expect(slugSet.size).toBe(params.length)
    params.forEach(p => expect(p.slug.length).toBeGreaterThan(0))
  })

  it('total parameterized static pages matches 21 cities + 30 decisions + dentist + treatment count', () => {
    const total = snapshot.cities.length + snapshot.decisionPages.length + snapshot.dentistPages.length + snapshot.treatmentPages.length
    expect(total).toBe(21 + 30 + snapshot.dentistPages.length + snapshot.treatmentPages.length)
    expect(total).toBeGreaterThan(60)
  })

  it('no dentist page slug in snapshot belongs to a declined practice', () => {
    snapshot.dentistPages.forEach(dp => {
      // Declined pages never generate a public slug
      expect(dp.slug).not.toContain('clairemont-dental-care')
    })
  })
})
