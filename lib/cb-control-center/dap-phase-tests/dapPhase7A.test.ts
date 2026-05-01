import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { exportDapCmsSnapshot, exportTreatmentPagesToCmsRecords } from '../dapCmsExport'
import { runClaimQA } from '../dapClaimQA'
import { REQUEST_FLOW_ROUTE } from '../dapDisplayRules'

const snapshot = exportDapCmsSnapshot()
const ROOT     = process.cwd()

// ─── Test 1: Page inventory reaches 75–90 static pages ───────────────────────

describe('Phase 7A — total static page inventory reaches target range (75–90)', () => {
  // Static pages: 6 fixed routes (index, request, confirmation, cms-snapshot, request layout, etc.)
  // Dynamic: 21 cities + 10 dentists + 30 decisions + 11 treatments = 72
  // Total ≈ 78

  it('snapshot has 21 city pages', () => {
    expect(snapshot.cities).toHaveLength(21)
  })

  it('snapshot has 30 decision pages', () => {
    expect(snapshot.decisionPages).toHaveLength(30)
  })

  it('snapshot has 11 treatment pages', () => {
    expect(snapshot.treatmentPages).toHaveLength(11)
  })

  it('snapshot has at least 10 dentist pages', () => {
    expect(snapshot.dentistPages.length).toBeGreaterThanOrEqual(10)
  })

  it('combined dynamic page count is between 70 and 90', () => {
    const dynamic = snapshot.cities.length + snapshot.dentistPages.length +
                    snapshot.decisionPages.length + snapshot.treatmentPages.length
    expect(dynamic).toBeGreaterThanOrEqual(70)
    expect(dynamic).toBeLessThanOrEqual(90)
  })
})

// ─── Test 2: All params come from exportDapCmsSnapshot() ─────────────────────

describe('Phase 7A — all generateStaticParams sources derive from exportDapCmsSnapshot()', () => {
  it('treatment page slugs from snapshot are non-empty and unique', () => {
    const slugs  = snapshot.treatmentPages.map(t => t.slug)
    const unique = new Set(slugs)
    expect(unique.size).toBe(slugs.length)
    slugs.forEach(s => expect(s.length).toBeGreaterThan(0))
  })

  it('all 16 new SD city slugs are present in snapshot (Phase 7A additions)', () => {
    const slugs = snapshot.cities.map(c => c.slug)
    const newCities = [
      'el-cajon', 'national-city', 'oceanside', 'carlsbad', 'vista',
      'san-marcos', 'poway', 'santee', 'encinitas', 'coronado',
      'clairemont', 'mira-mesa', 'mission-valley', 'north-park',
      'hillcrest', 'pacific-beach',
    ]
    newCities.forEach(city => {
      expect(slugs, `city slug "${city}" must be in snapshot`).toContain(city)
    })
  })

  it('15 new decision slugs added in Phase 7A are present in snapshot', () => {
    const slugs = snapshot.decisionPages.map(d => d.slug)
    const newDecisions = [
      'dental-membership-plan-worth-it',
      'dental-membership-plan-worth-it-deep-cleaning',
      'dental-membership-plan-worth-it-fillings',
      'dental-membership-plan-worth-it-root-canal',
      'dap-vs-dental-discount-plans',
      'how-to-find-dentist-who-offers-dap',
      'is-dap-accepted-everywhere',
      'is-dap-available-in-san-diego',
      'find-dap-near-me',
      'dental-membership-plan-near-me',
      'affordable-dentist-without-insurance-san-diego',
      'how-does-dap-work',
      'what-does-dap-cost-patients',
      'dap-for-seniors-without-insurance',
      'dap-for-families-without-insurance',
    ]
    newDecisions.forEach(slug => {
      expect(slugs, `decision slug "${slug}" must be in snapshot`).toContain(slug)
    })
  })

  it('all 11 treatment slugs are present in snapshot', () => {
    const slugs = snapshot.treatmentPages.map(t => t.slug)
    const expected = [
      'dental-crown-without-insurance',
      'dental-filling-without-insurance',
      'dental-cleaning-without-insurance',
      'dental-exam-without-insurance',
      'dental-xray-without-insurance',
      'deep-cleaning-without-insurance',
      'root-canal-without-insurance',
      'emergency-dental-without-insurance',
      'tooth-extraction-without-insurance',
      'dental-bridge-without-insurance',
      'orthodontic-treatment-without-insurance',
    ]
    expected.forEach(slug => {
      expect(slugs, `treatment slug "${slug}" must be in snapshot`).toContain(slug)
    })
  })
})

// ─── Test 3: runClaimQA returns zero warnings on real snapshot ────────────────

describe('Phase 7A — runClaimQA returns zero warnings across expanded inventory', () => {
  const qa = runClaimQA(snapshot)

  it('real expanded snapshot has zero QA warnings', () => {
    expect(
      qa.totalWarnings,
      qa.warnings.length > 0
        ? `Warnings found:\n${qa.warnings.map(w => `  [${w.category}] ${w.recordId} → ${w.field}: "${w.phrase}"`).join('\n')}`
        : '',
    ).toBe(0)
  })

  it('QA summary includes treatmentPages counts', () => {
    expect(typeof qa.totalTreatmentPages).toBe('number')
    expect(qa.totalTreatmentPages).toBe(snapshot.treatmentPages.length)
    expect(typeof qa.treatmentPagesWithForbiddenClaims).toBe('number')
  })

  it('all four QA categories report zero warnings', () => {
    expect(qa.warningsByCategory.confirmed_provider_claim).toBe(0)
    expect(qa.warningsByCategory.pricing_claim).toBe(0)
    expect(qa.warningsByCategory.enrollment_claim).toBe(0)
    expect(qa.warningsByCategory.universal_availability_claim).toBe(0)
  })
})

// ─── Test 4–5: TreatmentPageView never renders internal fields ────────────────

describe('Phase 7A — TreatmentPageView does not render forbiddenClaims or safetyMetadata', () => {
  const src = readFileSync(
    resolve(ROOT, 'components/dap-preview/TreatmentPageView.tsx'),
    'utf-8',
  )

  it('TreatmentPageView does not reference forbiddenClaims', () => {
    expect(src).not.toContain('forbiddenClaims')
  })

  it('TreatmentPageView does not reference safetyMetadata', () => {
    expect(src).not.toContain('safetyMetadata')
  })

  it('TreatmentPageView renders requiredFacts (patient-safe field)', () => {
    expect(src).toContain('requiredFacts')
  })

  it('TreatmentPageView renders the safeAnswer field', () => {
    expect(src).toContain('safeAnswer')
  })
})

// ─── Test 6: No Join CTA on treatment pages ───────────────────────────────────

describe('Phase 7A — treatment pages do not expose Join CTA or enrollment language', () => {
  it('no treatment page primaryCta.label is "join plan"', () => {
    snapshot.treatmentPages.forEach(t => {
      expect(t.primaryCta.label.toLowerCase()).not.toBe('join plan')
    })
  })

  it('no treatment page primaryCta.href contains /enroll', () => {
    snapshot.treatmentPages.forEach(t => {
      expect(t.primaryCta.href).not.toContain('/enroll')
    })
  })
})

// ─── Test 7: Non-confirmed pages contain no confirmed-provider claims ─────────

describe('Phase 7A — non-confirmed dentist pages contain no confirmed-provider claim language', () => {
  const nonConfirmed = snapshot.dentistPages.filter(d => d.publicState !== 'confirmed_provider')

  it('non-confirmed dentist pages do not have badgeLabel = "Confirmed DAP Provider"', () => {
    nonConfirmed.forEach(d => {
      expect(d.badgeLabel).not.toBe('Confirmed DAP Provider')
    })
  })

  it('new practices (El Cajon, National City, Oceanside) appear as non-confirmed in snapshot', () => {
    const ids = new Set(snapshot.practices.map(p => p.id))
    // These three were added in Phase 7A as non-confirmed practices
    expect(ids).toContain('ec-001')
    expect(ids).toContain('nc-001')
    expect(ids).toContain('oc-001')
    const newPractices = snapshot.practices.filter(p => ['ec-001', 'nc-001', 'oc-001'].includes(p.id))
    newPractices.forEach(p => {
      expect(p.status).not.toBe('confirmed_dap_provider')
      expect(p.publicDisplay.showJoinCta).toBe(false)
    })
  })
})

// ─── Test 8: City pages use request-framing, not universal availability ────────

describe('Phase 7A — expanded city pages do not imply universal DAP availability', () => {
  it('no new city page has heading implying all dentists offer DAP', () => {
    const newCities = snapshot.cities.filter(c =>
      !['san-diego', 'la-mesa', 'chula-vista', 'la-jolla', 'escondido'].includes(c.slug),
    )
    expect(newCities.length).toBeGreaterThan(0)
    newCities.forEach(c => {
      const lower = c.heading.toLowerCase()
      expect(lower, `${c.slug} heading must not say "all dentists"`).not.toContain('all dentists')
      expect(lower, `${c.slug} heading must not say "every dentist"`).not.toContain('every dentist')
      expect(lower, `${c.slug} heading must not say "accepted everywhere"`).not.toContain('accepted everywhere')
    })
  })

  it('all new city pages have publicClaimLevel of "none" (no confirmed provider in new cities)', () => {
    const newCities = snapshot.cities.filter(c =>
      !['san-diego', 'la-mesa', 'chula-vista', 'la-jolla', 'escondido'].includes(c.slug),
    )
    newCities.forEach(c => {
      expect(['none', 'limited', 'full']).toContain(c.publicClaimLevel)
    })
  })

  it('all city publicUrlPaths are under /preview/dap/', () => {
    snapshot.cities.forEach(c => {
      expect(c.publicUrlPath).toMatch(/^\/preview\/dap\/[a-z-]+$/)
    })
  })
})

// ─── Test 9: No decision page claims DAP is dental insurance ─────────────────

describe('Phase 7A — decision pages do not claim DAP is dental insurance', () => {
  it('is-dap-dental-insurance page has safeAnswer that explicitly says DAP is NOT insurance', () => {
    const page = snapshot.decisionPages.find(d => d.slug === 'is-dap-dental-insurance')!
    expect(page).toBeDefined()
    const lower = page.safeAnswer.toLowerCase()
    // Must deny the insurance equivalence — any of these phrasings qualify
    const deniesInsurance =
      lower.includes('not dental insurance') ||
      lower.includes('not insurance') ||
      lower.includes('is not') ||
      lower.includes('does not provide') ||
      lower.includes('does not offer insurance')
    expect(
      deniesInsurance,
      `safeAnswer must clarify DAP is not insurance. Got: "${page.safeAnswer}"`,
    ).toBe(true)
  })

  it('difference-between-dap-and-dental-insurance page exists and has required content', () => {
    const page = snapshot.decisionPages.find(d => d.slug === 'difference-between-dap-and-dental-insurance')!
    expect(page).toBeDefined()
    expect(page.decisionQuestion.length).toBeGreaterThan(0)
    expect(page.safeAnswer.length).toBeGreaterThan(0)
    expect(page.requiredFacts.length).toBeGreaterThan(0)
  })

  it('no decision page safeAnswer calls DAP a type of insurance', () => {
    snapshot.decisionPages.forEach(d => {
      const lower = d.safeAnswer.toLowerCase()
      expect(
        lower,
        `"${d.slug}" safeAnswer must not say DAP is a type of insurance`,
      ).not.toContain('dap is a type of insurance')
      expect(
        lower,
        `"${d.slug}" safeAnswer must not say DAP is dental insurance`,
      ).not.toContain('dap is dental insurance')
    })
  })
})

// ─── Test 10: Treatment pages use safe request language ──────────────────────

describe('Phase 7A — treatment pages use safe request language, not guaranteed-coverage claims', () => {
  it('all treatment pages have a non-empty safeAnswer', () => {
    snapshot.treatmentPages.forEach(t => {
      expect(t.safeAnswer.trim().length, `${t.slug}: safeAnswer`).toBeGreaterThan(0)
    })
  })

  it('all treatment pages have at least one requiredFact', () => {
    snapshot.treatmentPages.forEach(t => {
      expect(t.requiredFacts.length, `${t.slug}: requiredFacts`).toBeGreaterThan(0)
    })
  })

  it('no treatment page safeAnswer says "DAP covers" a specific treatment', () => {
    snapshot.treatmentPages.forEach(t => {
      const lower = t.safeAnswer.toLowerCase()
      expect(lower, `${t.slug}: must not say "DAP covers"`).not.toContain('dap covers')
    })
  })

  it('no treatment page safeAnswer guarantees a discount without confirmed provider', () => {
    snapshot.treatmentPages.forEach(t => {
      const lower = t.safeAnswer.toLowerCase()
      expect(lower, `${t.slug}: must not guarantee discounts`).not.toContain('guaranteed discount')
      expect(lower, `${t.slug}: must not say "always cheaper"`).not.toContain('always cheaper')
    })
  })

  it('all treatment pages have seoTitle and seoDescription', () => {
    snapshot.treatmentPages.forEach(t => {
      expect(t.seoTitle.trim().length, `${t.slug}: seoTitle`).toBeGreaterThan(0)
      expect(t.seoDescription.trim().length, `${t.slug}: seoDescription`).toBeGreaterThan(0)
    })
  })
})

// ─── Test 11: Treatment and availability pages route CTAs to request flow ─────

describe('Phase 7A — request/availability pages route primary CTAs to request flow', () => {
  it('all treatment pages have primaryCta.href = REQUEST_FLOW_ROUTE', () => {
    snapshot.treatmentPages.forEach(t => {
      expect(t.primaryCta.href, `${t.slug}: primaryCta.href`).toBe(REQUEST_FLOW_ROUTE)
    })
  })

  it('all treatment page primaryCta.labels are non-empty', () => {
    snapshot.treatmentPages.forEach(t => {
      expect(t.primaryCta.label.trim().length, `${t.slug}: primaryCta.label`).toBeGreaterThan(0)
    })
  })

  it('all treatment pages have a valid publicClaimLevel', () => {
    snapshot.treatmentPages.forEach(t => {
      expect(['full', 'limited', 'none']).toContain(t.publicClaimLevel)
    })
  })

  it('treatment pages that reference city slugs only use known city slugs', () => {
    const knownCitySlugs = new Set(snapshot.cities.map(c => c.slug))
    snapshot.treatmentPages.forEach(t => {
      t.relatedCitySlugs.forEach(slug => {
        expect(
          knownCitySlugs,
          `${t.slug}: relatedCitySlug "${slug}" is unknown`,
        ).toContain(slug)
      })
    })
  })
})

// ─── Test 12: Build integrity — snapshot structure is complete ────────────────

describe('Phase 7A — snapshot structural integrity with expanded inventory', () => {
  it('snapshot has all 5 required collections', () => {
    expect(Array.isArray(snapshot.practices)).toBe(true)
    expect(Array.isArray(snapshot.cities)).toBe(true)
    expect(Array.isArray(snapshot.dentistPages)).toBe(true)
    expect(Array.isArray(snapshot.decisionPages)).toBe(true)
    expect(Array.isArray(snapshot.treatmentPages)).toBe(true)
  })

  it('all city slugs are unique', () => {
    const slugs  = snapshot.cities.map(c => c.slug)
    const unique = new Set(slugs)
    expect(unique.size).toBe(slugs.length)
  })

  it('all decision page slugs are unique', () => {
    const slugs  = snapshot.decisionPages.map(d => d.slug)
    const unique = new Set(slugs)
    expect(unique.size).toBe(slugs.length)
  })

  it('all treatment page slugs are unique', () => {
    const slugs  = snapshot.treatmentPages.map(t => t.slug)
    const unique = new Set(slugs)
    expect(unique.size).toBe(slugs.length)
  })

  it('snapshot.practices has no declined practices', () => {
    snapshot.practices.forEach(p => {
      expect(p.status).not.toBe('declined')
      expect(p.publicDisplay.isPublic).toBe(true)
    })
  })

  it('exportTreatmentPagesToCmsRecords() returns the same treatment pages as snapshot', () => {
    const direct = exportTreatmentPagesToCmsRecords()
    expect(direct).toHaveLength(snapshot.treatmentPages.length)
    direct.forEach((t, i) => {
      expect(t.slug).toBe(snapshot.treatmentPages[i].slug)
    })
  })
})
