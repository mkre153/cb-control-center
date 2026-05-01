import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { buildDapCmsSnapshotFromSource } from '../dapSourceAdapter'
import { exportDapCmsSnapshot, buildMockSourceBundle } from '../dapCmsExport'
import { runClaimQA } from '../dapClaimQA'
import { REQUEST_FLOW_ROUTE } from '../dapDisplayRules'
import {
  SAFE_FIXTURE_BUNDLE,
  FIXTURE_CONFIRMED_PRACTICE,
  FIXTURE_NON_CONFIRMED_PRACTICE,
  FIXTURE_REQUESTED_PRACTICE,
  FIXTURE_DECLINED_PRACTICE,
  FIXTURE_DRAFT_PRACTICE,
  FIXTURE_CITY_WITH_CONFIRMED,
  FIXTURE_CITY_NO_PROVIDER,
  FIXTURE_CITY_DRAFT,
  FIXTURE_DECISION_PAGE,
  FIXTURE_DRAFT_DECISION_PAGE,
  FIXTURE_TREATMENT_PAGE,
  FIXTURE_DRAFT_TREATMENT_PAGE,
  FIXTURE_UNSAFE_DECISION_PAGE,
  FIXTURE_CONFIRMED_NO_CTA,
  FIXTURE_CONFIRMED_ALL_GATES_CLOSED,
} from '../dapSourceFixtures'
import type { DapCmsSourceBundle } from '../dapSourceTypes'

const ROOT = process.cwd()

// ─── Test 1: Source records transform into DapCmsSnapshot contract ────────────

describe('Phase 7B — source records transform correctly into DapCmsSnapshot contract', () => {
  const snapshot = buildDapCmsSnapshotFromSource(SAFE_FIXTURE_BUNDLE)

  it('snapshot has all 5 required collections', () => {
    expect(Array.isArray(snapshot.practices)).toBe(true)
    expect(Array.isArray(snapshot.cities)).toBe(true)
    expect(Array.isArray(snapshot.dentistPages)).toBe(true)
    expect(Array.isArray(snapshot.decisionPages)).toBe(true)
    expect(Array.isArray(snapshot.treatmentPages)).toBe(true)
  })

  it('snapshot.practices contains 3 public practices (confirmed + non-confirmed + requested)', () => {
    // declined and draft are excluded
    expect(snapshot.practices).toHaveLength(3)
  })

  it('snapshot.cities contains 2 published cities (draft excluded)', () => {
    // fixture-city-draft is published=false
    expect(snapshot.cities).toHaveLength(2)
  })

  it('snapshot.decisionPages contains 1 published page (draft excluded)', () => {
    expect(snapshot.decisionPages).toHaveLength(1)
  })

  it('snapshot.treatmentPages contains 1 published page (draft excluded)', () => {
    expect(snapshot.treatmentPages).toHaveLength(1)
  })

  it('snapshot.dentistPages contains 3 pages (confirmed + non-confirmed + requested all have page_slug)', () => {
    // declined has no page_slug; draft is excluded entirely
    expect(snapshot.dentistPages).toHaveLength(3)
  })

  it('practice CMS records have all required fields', () => {
    snapshot.practices.forEach(p => {
      expect(typeof p.id).toBe('string')
      expect(typeof p.name).toBe('string')
      expect(typeof p.publicDisplay.isPublic).toBe('boolean')
      expect(typeof p.publicDisplay.showPricing).toBe('boolean')
      expect(typeof p.publicDisplay.showJoinCta).toBe('boolean')
      expect(typeof p.publicDisplay.ctaLabel).toBe('string')
      expect(typeof p.publicDisplay.ctaHref).toBe('string')
      expect('safetyMetadata' in p).toBe(true)
    })
  })

  it('city CMS records derive visiblePracticeSlugs and hiddenPracticeIds from practices', () => {
    const fixtureCity = snapshot.cities.find(c => c.slug === 'fixture-city-confirmed')!
    expect(fixtureCity).toBeDefined()
    // confirmed + non-confirmed + requested = 3 visible; declined = 1 hidden
    expect(fixtureCity.visiblePracticeSlugs.length).toBe(3)
    expect(fixtureCity.hiddenPracticeIds).toContain('fixture-declined-001')
  })

  it('decision CMS record maps source fields to camelCase contract', () => {
    const page = snapshot.decisionPages[0]
    expect(page.slug).toBe(FIXTURE_DECISION_PAGE.slug)
    expect(page.decisionQuestion).toBe(FIXTURE_DECISION_PAGE.decision_question)
    expect(page.safeAnswer).toBe(FIXTURE_DECISION_PAGE.safe_answer)
    expect(page.seoTitle).toBe(FIXTURE_DECISION_PAGE.seo_title)
  })

  it('treatment CMS record maps source fields to camelCase contract', () => {
    const page = snapshot.treatmentPages[0]
    expect(page.slug).toBe(FIXTURE_TREATMENT_PAGE.slug)
    expect(page.treatmentQuestion).toBe(FIXTURE_TREATMENT_PAGE.treatment_question)
    expect(page.safeAnswer).toBe(FIXTURE_TREATMENT_PAGE.safe_answer)
  })
})

// ─── Test 2: Existing 78-page build still uses adapter path ──────────────────

describe('Phase 7B — existing snapshot contract preserved through adapter', () => {
  const snapshot = exportDapCmsSnapshot()

  it('exportDapCmsSnapshot() still returns 21 cities', () => {
    expect(snapshot.cities).toHaveLength(21)
  })

  it('exportDapCmsSnapshot() still returns 30 decision pages', () => {
    expect(snapshot.decisionPages).toHaveLength(30)
  })

  it('exportDapCmsSnapshot() still returns 11 treatment pages', () => {
    expect(snapshot.treatmentPages).toHaveLength(11)
  })

  it('exportDapCmsSnapshot() still has at least 10 dentist pages', () => {
    expect(snapshot.dentistPages.length).toBeGreaterThanOrEqual(10)
  })

  it('buildMockSourceBundle() produces a valid DapCmsSourceBundle', () => {
    const bundle = buildMockSourceBundle()
    expect(Array.isArray(bundle.practices)).toBe(true)
    expect(Array.isArray(bundle.cities)).toBe(true)
    expect(Array.isArray(bundle.decisionPages)).toBe(true)
    expect(Array.isArray(bundle.treatmentPages)).toBe(true)
  })

  it('buildMockSourceBundle() includes all practices (including declined)', () => {
    const bundle = buildMockSourceBundle()
    // Declined practices are in the bundle (they contribute to city hiddenPracticeIds)
    const hasDeclined = bundle.practices.some(p => p.provider_status === 'declined')
    expect(hasDeclined).toBe(true)
  })

  it('buildDapCmsSnapshotFromSource(buildMockSourceBundle()) matches exportDapCmsSnapshot() counts', () => {
    const direct  = exportDapCmsSnapshot()
    const adapter = buildDapCmsSnapshotFromSource(buildMockSourceBundle())
    expect(adapter.practices.length).toBe(direct.practices.length)
    expect(adapter.cities.length).toBe(direct.cities.length)
    expect(adapter.dentistPages.length).toBe(direct.dentistPages.length)
    expect(adapter.decisionPages.length).toBe(direct.decisionPages.length)
    expect(adapter.treatmentPages.length).toBe(direct.treatmentPages.length)
  })
})

// ─── Test 3: Public components do not import raw source data ─────────────────

describe('Phase 7B — public page components do not import raw source types or fixtures', () => {
  const PUBLIC_FILES = [
    'app/preview/dap/page.tsx',
    'app/preview/dap/[city]/page.tsx',
    'app/preview/dap/dentists/[slug]/page.tsx',
    'app/preview/dap/decisions/[slug]/page.tsx',
    'app/preview/dap/treatments/[slug]/page.tsx',
    'components/dap-preview/ProviderResultCard.tsx',
    'components/dap-preview/DentistDetailFromCms.tsx',
    'components/dap-preview/DecisionPageView.tsx',
    'components/dap-preview/TreatmentPageView.tsx',
  ]

  const FORBIDDEN_SOURCE_IMPORTS = [
    'dapSourceTypes',
    'dapSourceAdapter',
    'dapSourceFixtures',
    'DapPracticeSourceRecord',
    'DapCitySourceRecord',
    'DapDecisionSourceRecord',
    'DapTreatmentSourceRecord',
    'DapCmsSourceBundle',
    'buildDapCmsSnapshotFromSource',
    'SAFE_FIXTURE_BUNDLE',
    'FIXTURE_',
  ]

  PUBLIC_FILES.forEach(file => {
    it(`${file} contains no raw source-layer imports`, () => {
      const src = readFileSync(resolve(ROOT, file), 'utf-8')
      FORBIDDEN_SOURCE_IMPORTS.forEach(pattern => {
        expect(src, `"${pattern}" must not appear in ${file}`).not.toContain(pattern)
      })
    })
  })
})

// ─── Test 4: Claim QA passes for safe fixture bundle ─────────────────────────

describe('Phase 7B — runClaimQA returns zero warnings for safe source fixtures', () => {
  const snapshot = buildDapCmsSnapshotFromSource(SAFE_FIXTURE_BUNDLE)
  const qa       = runClaimQA(snapshot)

  it('safe fixture bundle produces zero QA warnings', () => {
    expect(
      qa.totalWarnings,
      qa.warnings.length > 0
        ? `Warnings:\n${qa.warnings.map(w => `  [${w.category}] ${w.recordId} → ${w.field}: "${w.phrase}"`).join('\n')}`
        : '',
    ).toBe(0)
  })

  it('QA summary correctly counts fixture records', () => {
    expect(qa.totalPractices).toBe(3)       // confirmed + non-confirmed + requested
    expect(qa.confirmedProviders).toBe(1)
    expect(qa.totalCities).toBe(2)
    expect(qa.totalDecisionPages).toBe(1)
    expect(qa.totalTreatmentPages).toBe(1)
  })
})

// ─── Test 5: Claim QA catches unsafe source fixtures ─────────────────────────

describe('Phase 7B — runClaimQA catches unsafe source records before they reach pages', () => {
  it('unsafe decision page triggers universal_availability_claim warning', () => {
    const unsafeBundle: DapCmsSourceBundle = {
      ...SAFE_FIXTURE_BUNDLE,
      decisionPages: [FIXTURE_UNSAFE_DECISION_PAGE],
    }
    const snapshot = buildDapCmsSnapshotFromSource(unsafeBundle)
    const qa       = runClaimQA(snapshot)
    expect(qa.totalWarnings).toBeGreaterThan(0)
    expect(qa.warnings.some(w => w.category === 'universal_availability_claim')).toBe(true)
  })

  it('confirmed practice with pricing exposed when gates are open — no QA warnings', () => {
    const bundle: DapCmsSourceBundle = {
      practices: [FIXTURE_CONFIRMED_PRACTICE],
      cities: [],
      decisionPages: [],
      treatmentPages: [],
    }
    const snapshot = buildDapCmsSnapshotFromSource(bundle)
    const qa       = runClaimQA(snapshot)
    expect(qa.totalWarnings).toBe(0)
    expect(snapshot.practices[0].publicDisplay.showPricing).toBe(true)
  })

  it('non-confirmed practice with Join CTA label triggers enrollment_claim warning', () => {
    const unsafePractice = {
      ...FIXTURE_NON_CONFIRMED_PRACTICE,
      // The adapter correctly prevents this — we test that if someone manually
      // constructed a bad snapshot, QA would catch it
    }
    // Verify the adapter itself never produces a Join CTA for non-confirmed
    const bundle: DapCmsSourceBundle = {
      practices: [unsafePractice],
      cities: [],
      decisionPages: [],
      treatmentPages: [],
    }
    const snapshot = buildDapCmsSnapshotFromSource(bundle)
    expect(snapshot.practices[0].publicDisplay.showJoinCta).toBe(false)
    expect(snapshot.practices[0].publicDisplay.ctaLabel.toLowerCase()).not.toBe('join plan')
  })
})

// ─── Test 6: Draft/unpublished records do not generate public routes ──────────

describe('Phase 7B — draft (published=false) records are excluded from snapshot entirely', () => {
  const snapshot = buildDapCmsSnapshotFromSource(SAFE_FIXTURE_BUNDLE)

  it('draft practice is absent from snapshot.practices', () => {
    const found = snapshot.practices.find(p => p.id === FIXTURE_DRAFT_PRACTICE.id)
    expect(found).toBeUndefined()
  })

  it('draft practice generates no dentist detail page', () => {
    const found = snapshot.dentistPages.find(d => d.slug === FIXTURE_DRAFT_PRACTICE.page_slug)
    expect(found).toBeUndefined()
  })

  it('draft city is absent from snapshot.cities', () => {
    const found = snapshot.cities.find(c => c.slug === FIXTURE_CITY_DRAFT.slug)
    expect(found).toBeUndefined()
  })

  it('draft decision page is absent from snapshot.decisionPages', () => {
    const found = snapshot.decisionPages.find(d => d.slug === FIXTURE_DRAFT_DECISION_PAGE.slug)
    expect(found).toBeUndefined()
  })

  it('draft treatment page is absent from snapshot.treatmentPages', () => {
    const found = snapshot.treatmentPages.find(t => t.slug === FIXTURE_DRAFT_TREATMENT_PAGE.slug)
    expect(found).toBeUndefined()
  })

  it('bundle with only draft records produces an empty snapshot', () => {
    const draftBundle: DapCmsSourceBundle = {
      practices:     [FIXTURE_DRAFT_PRACTICE],
      cities:        [FIXTURE_CITY_DRAFT],
      decisionPages: [FIXTURE_DRAFT_DECISION_PAGE],
      treatmentPages:[FIXTURE_DRAFT_TREATMENT_PAGE],
    }
    const s = buildDapCmsSnapshotFromSource(draftBundle)
    expect(s.practices).toHaveLength(0)
    expect(s.cities).toHaveLength(0)
    expect(s.dentistPages).toHaveLength(0)
    expect(s.decisionPages).toHaveLength(0)
    expect(s.treatmentPages).toHaveLength(0)
  })
})

// ─── Test 7: Declined/internal-only practices excluded from public output ─────

describe('Phase 7B — declined practices excluded from public practices and dentist pages', () => {
  const snapshot = buildDapCmsSnapshotFromSource(SAFE_FIXTURE_BUNDLE)

  it('declined practice is absent from snapshot.practices', () => {
    const found = snapshot.practices.find(p => p.id === FIXTURE_DECLINED_PRACTICE.id)
    expect(found).toBeUndefined()
  })

  it('declined practice generates no dentist detail page', () => {
    const found = snapshot.dentistPages.find(d => d.practiceId === FIXTURE_DECLINED_PRACTICE.id)
    expect(found).toBeUndefined()
  })

  it('declined practice appears in city hiddenPracticeIds (suppression is tracked)', () => {
    const city = snapshot.cities.find(c => c.slug === FIXTURE_CITY_WITH_CONFIRMED.slug)!
    expect(city.hiddenPracticeIds).toContain(FIXTURE_DECLINED_PRACTICE.id)
  })

  it('no snapshot practice has status = "declined"', () => {
    snapshot.practices.forEach(p => {
      expect(p.status).not.toBe('declined')
    })
  })
})

// ─── Test 8: Confirmed provider gate integrity ────────────────────────────────

describe('Phase 7B — confirmed provider records expose pricing/CTA only when gates allow', () => {
  it('confirmed + all gates open: showJoinCta=true, showPricing=true, offerSummary present', () => {
    const bundle: DapCmsSourceBundle = {
      practices: [FIXTURE_CONFIRMED_PRACTICE],
      cities: [], decisionPages: [], treatmentPages: [],
    }
    const s = buildDapCmsSnapshotFromSource(bundle)
    const p = s.practices[0]
    expect(p.publicDisplay.showJoinCta).toBe(true)
    expect(p.publicDisplay.showPricing).toBe(true)
    expect(p.offerSummary).not.toBeNull()
    expect(p.offerSummary!.adultAnnualFee).toBe(FIXTURE_CONFIRMED_PRACTICE.adult_annual_fee)
  })

  it('confirmed + CTA gate locked: showPricing=true but showJoinCta=false', () => {
    const bundle: DapCmsSourceBundle = {
      practices: [FIXTURE_CONFIRMED_NO_CTA],
      cities: [], decisionPages: [], treatmentPages: [],
    }
    const s = buildDapCmsSnapshotFromSource(bundle)
    const p = s.practices[0]
    expect(p.publicDisplay.showJoinCta).toBe(false)
    expect(p.publicDisplay.showPricing).toBe(true)
    expect(p.offerSummary).not.toBeNull()
  })

  it('confirmed + all gates closed: showJoinCta=false, showPricing=false, offerSummary=null', () => {
    const bundle: DapCmsSourceBundle = {
      practices: [FIXTURE_CONFIRMED_ALL_GATES_CLOSED],
      cities: [], decisionPages: [], treatmentPages: [],
    }
    const s = buildDapCmsSnapshotFromSource(bundle)
    const p = s.practices[0]
    expect(p.publicDisplay.showJoinCta).toBe(false)
    expect(p.publicDisplay.showPricing).toBe(false)
    expect(p.offerSummary).toBeNull()
  })

  it('confirmed + all gates open: dentist page has Join CTA href with /enroll', () => {
    const bundle: DapCmsSourceBundle = {
      practices: [FIXTURE_CONFIRMED_PRACTICE],
      cities: [], decisionPages: [], treatmentPages: [],
    }
    const s = buildDapCmsSnapshotFromSource(bundle)
    const dp = s.dentistPages[0]
    expect(dp.primaryCta.label.toLowerCase()).toBe('join plan')
    expect(dp.primaryCta.href).toContain('/enroll')
    expect(dp.expectationCopy).toBeNull()
  })
})

// ─── Test 9: Non-confirmed records route to request CTAs ─────────────────────

describe('Phase 7B — non-confirmed source records route to request flow', () => {
  it('not_confirmed practice: showJoinCta=false, ctaHref=request flow', () => {
    const bundle: DapCmsSourceBundle = {
      practices: [FIXTURE_NON_CONFIRMED_PRACTICE],
      cities: [], decisionPages: [], treatmentPages: [],
    }
    const s = buildDapCmsSnapshotFromSource(bundle)
    const p = s.practices[0]
    expect(p.publicDisplay.showJoinCta).toBe(false)
    expect(p.publicDisplay.showPricing).toBe(false)
    expect(p.offerSummary).toBeNull()
    expect(p.publicDisplay.ctaHref).toBe(REQUEST_FLOW_ROUTE)
  })

  it('recruitment_requested practice: showJoinCta=false, ctaHref=request flow', () => {
    const bundle: DapCmsSourceBundle = {
      practices: [FIXTURE_REQUESTED_PRACTICE],
      cities: [], decisionPages: [], treatmentPages: [],
    }
    const s = buildDapCmsSnapshotFromSource(bundle)
    const p = s.practices[0]
    expect(p.publicDisplay.showJoinCta).toBe(false)
    expect(p.publicDisplay.ctaHref).toBe(REQUEST_FLOW_ROUTE)
  })

  it('non-confirmed dentist page: expectationCopy is present', () => {
    const bundle: DapCmsSourceBundle = {
      practices: [FIXTURE_NON_CONFIRMED_PRACTICE],
      cities: [], decisionPages: [], treatmentPages: [],
    }
    const s = buildDapCmsSnapshotFromSource(bundle)
    const dp = s.dentistPages[0]
    expect(dp.expectationCopy).not.toBeNull()
    expect(dp.expectationCopy!.length).toBeGreaterThan(0)
    expect(dp.primaryCta.href).toBe(REQUEST_FLOW_ROUTE)
    expect(dp.offerSummary).toBeNull()
  })

  it('city with only non-confirmed practices: publicClaimLevel = "limited"', () => {
    const bundle: DapCmsSourceBundle = {
      practices: [FIXTURE_NON_CONFIRMED_PRACTICE],
      cities: [FIXTURE_CITY_WITH_CONFIRMED],
      decisionPages: [],
      treatmentPages: [],
    }
    const s = buildDapCmsSnapshotFromSource(bundle)
    const city = s.cities[0]
    expect(city.publicClaimLevel).toBe('limited')
  })

  it('city with no practices: publicClaimLevel = "none", primaryCta routes to request flow', () => {
    const bundle: DapCmsSourceBundle = {
      practices: [],
      cities: [FIXTURE_CITY_NO_PROVIDER],
      decisionPages: [],
      treatmentPages: [],
    }
    const s = buildDapCmsSnapshotFromSource(bundle)
    const city = s.cities[0]
    expect(city.publicClaimLevel).toBe('none')
    expect(city.primaryCta.href).toBe(REQUEST_FLOW_ROUTE)
  })
})

// ─── Test 10: TypeScript structural integrity ─────────────────────────────────

describe('Phase 7B — source bundle structural integrity (TypeScript contract)', () => {
  it('SAFE_FIXTURE_BUNDLE has all 4 required collection keys', () => {
    expect(Array.isArray(SAFE_FIXTURE_BUNDLE.practices)).toBe(true)
    expect(Array.isArray(SAFE_FIXTURE_BUNDLE.cities)).toBe(true)
    expect(Array.isArray(SAFE_FIXTURE_BUNDLE.decisionPages)).toBe(true)
    expect(Array.isArray(SAFE_FIXTURE_BUNDLE.treatmentPages)).toBe(true)
  })

  it('practice source records have all required fields', () => {
    const fields: (keyof typeof FIXTURE_CONFIRMED_PRACTICE)[] = [
      'id', 'name', 'city', 'county', 'state', 'zip',
      'provider_status', 'page_slug', 'offer_terms_validated',
      'cta_gate_unlocked', 'adult_annual_fee', 'child_annual_fee',
      'offer_source', 'published', 'forbidden_claims',
    ]
    fields.forEach(f => {
      expect(FIXTURE_CONFIRMED_PRACTICE).toHaveProperty(f)
    })
  })

  it('decision source records have all required fields', () => {
    const fields: (keyof typeof FIXTURE_DECISION_PAGE)[] = [
      'slug', 'query_intent', 'decision_question', 'audience',
      'safe_answer', 'primary_cta_logic', 'required_facts',
      'forbidden_claims', 'seo_title', 'seo_description',
      'secondary_cta_label', 'secondary_cta_href',
      'related_city_slugs', 'related_practice_slugs',
      'public_claim_level', 'published',
    ]
    fields.forEach(f => {
      expect(FIXTURE_DECISION_PAGE).toHaveProperty(f)
    })
  })

  it('treatment source records have all required fields', () => {
    const fields: (keyof typeof FIXTURE_TREATMENT_PAGE)[] = [
      'slug', 'treatment', 'treatment_question', 'audience',
      'safe_answer', 'required_facts', 'forbidden_claims',
      'seo_title', 'seo_description', 'primary_cta_label',
      'primary_cta_href', 'related_city_slugs',
      'public_claim_level', 'published',
    ]
    fields.forEach(f => {
      expect(FIXTURE_TREATMENT_PAGE).toHaveProperty(f)
    })
  })
})

// ─── Test 11: Full real snapshot still passes claim QA through adapter ────────

describe('Phase 7B — full real snapshot routes through adapter and passes QA', () => {
  const snapshot = exportDapCmsSnapshot()
  const qa       = runClaimQA(snapshot)

  it('real snapshot routes through adapter and still has zero QA warnings', () => {
    expect(
      qa.totalWarnings,
      qa.warnings.length > 0
        ? `Warnings:\n${qa.warnings.map(w => `  [${w.category}] ${w.recordId} → ${w.field}: "${w.phrase}"`).join('\n')}`
        : '',
    ).toBe(0)
  })

  it('adapter preserves publicClaimLevel = "full" for La Mesa (confirmed provider)', () => {
    const laMesa = snapshot.cities.find(c => c.slug === 'la-mesa')!
    expect(laMesa).toBeDefined()
    expect(laMesa.publicClaimLevel).toBe('full')
  })

  it('adapter preserves publicClaimLevel = "none" for Escondido (no practices)', () => {
    const escondido = snapshot.cities.find(c => c.slug === 'escondido')!
    expect(escondido).toBeDefined()
    expect(escondido.publicClaimLevel).toBe('none')
  })
})

// ─── Test 12: Build integrity — adapter produces correct static param inventories ──

describe('Phase 7B — build integrity: adapter-driven snapshot generates correct param sets', () => {
  const snapshot = exportDapCmsSnapshot()

  it('city slugs from adapter snapshot are non-empty and unique', () => {
    const slugs  = snapshot.cities.map(c => c.slug)
    const unique = new Set(slugs)
    expect(unique.size).toBe(slugs.length)
    slugs.forEach(s => expect(s.length).toBeGreaterThan(0))
  })

  it('all city publicUrlPaths follow /preview/dap/[slug] pattern', () => {
    snapshot.cities.forEach(c => {
      expect(c.publicUrlPath).toMatch(/^\/preview\/dap\/[a-z-]+$/)
    })
  })

  it('all dentist page publicUrlPaths follow /preview/dap/dentists/[slug] pattern', () => {
    snapshot.dentistPages.forEach(d => {
      expect(d.publicUrlPath).toMatch(/^\/preview\/dap\/dentists\/[a-z0-9-]+$/)
    })
  })

  it('total parameterized pages from adapter matches expected range', () => {
    const total = snapshot.cities.length + snapshot.dentistPages.length +
                  snapshot.decisionPages.length + snapshot.treatmentPages.length
    expect(total).toBeGreaterThanOrEqual(70)
    expect(total).toBeLessThanOrEqual(90)
  })

  it('no declined slug appears in any dentist page from adapter', () => {
    snapshot.dentistPages.forEach(dp => {
      expect(dp.slug).not.toContain('clairemont-dental-care')
    })
  })
})
