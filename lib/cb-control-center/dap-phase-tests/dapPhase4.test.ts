import { describe, it, expect } from 'vitest'
import { exportDapCmsSnapshot, exportDentistPageToCmsRecord } from '../dapCmsExport'
import { MOCK_DENTIST_PAGES } from '../mockData'
import { ALL_PREVIEW_PRACTICES } from '../dapCityData'
import { REQUEST_FLOW_ROUTE } from '../../dap/registry/dapDisplayRules'

const snapshot = exportDapCmsSnapshot()

// ─── Test 1: City preview params from CMS records ─────────────────────────────

describe('Phase 4 — city preview params from CMS city records', () => {
  it('generateStaticParams source: snapshot.cities covers all original 5 directive cities', () => {
    const slugs = snapshot.cities.map(c => c.slug)
    expect(slugs).toContain('san-diego')
    expect(slugs).toContain('la-mesa')
    expect(slugs).toContain('chula-vista')
    expect(slugs).toContain('la-jolla')
    expect(slugs).toContain('escondido')
    expect(slugs.length).toBeGreaterThanOrEqual(5)
  })

  it('each city slug maps to a publicUrlPath inside /preview/dap/', () => {
    snapshot.cities.forEach(c => {
      expect(c.publicUrlPath).toMatch(/^\/preview\/dap\/[a-z-]+$/)
    })
  })
})

// ─── Test 2: Dentist params from public CMS records only ──────────────────────

describe('Phase 4 — dentist preview params from public CMS dentist page records', () => {
  it('all snapshot.dentistPages reference a non-declined practice', () => {
    snapshot.dentistPages.forEach(dp => {
      const practice = ALL_PREVIEW_PRACTICES.find(p => p.id === dp.practiceId)!
      expect(practice).toBeDefined()
      expect(practice.provider_status).not.toBe('declined')
    })
  })

  it('dentist page slugs are non-empty and unique', () => {
    const slugs = snapshot.dentistPages.map(d => d.slug)
    const unique = new Set(slugs)
    expect(unique.size).toBe(slugs.length)
    slugs.forEach(s => expect(s.length).toBeGreaterThan(0))
  })

  it('all dentist page publicUrlPaths are under /preview/dap/dentists/', () => {
    snapshot.dentistPages.forEach(dp => {
      expect(dp.publicUrlPath).toMatch(/^\/preview\/dap\/dentists\//)
    })
  })
})

// ─── Test 3: Declined practices do not generate public routes ─────────────────

describe('Phase 4 — declined/internal-only practices do not generate dentist params', () => {
  it('declined practice (Clairemont Dental Care / sd-005) is absent from dentistPages', () => {
    const declined = MOCK_DENTIST_PAGES.find(p => p.provider_status === 'declined')!
    const found    = snapshot.dentistPages.find(d => d.practiceId === declined.id)
    expect(found).toBeUndefined()
  })

  it('no dentist page in snapshot has pageType derived from a declined practice', () => {
    // There are only 2 pageTypes; neither should correspond to a declined practice
    snapshot.dentistPages.forEach(dp => {
      expect(['confirmed_provider_detail', 'unconfirmed_request_detail']).toContain(dp.pageType)
    })
  })

  it('declined practice is absent from snapshot.practices as well', () => {
    snapshot.practices.forEach(p => {
      expect(p.status).not.toBe('declined')
    })
  })
})

// ─── Test 4: Decision preview params from CMS decision records ────────────────

describe('Phase 4 — decision preview params from CMS decision records', () => {
  it('snapshot.decisionPages has exactly 30 entries (15 original + 15 added in Phase 7A)', () => {
    expect(snapshot.decisionPages).toHaveLength(30)
  })

  it('all 5 expected decision slugs are present', () => {
    const slugs = snapshot.decisionPages.map(d => d.slug)
    expect(slugs).toContain('no-insurance-dentist-san-diego')
    expect(slugs).toContain('dental-membership-plan-vs-insurance')
    expect(slugs).toContain('dentist-payment-options-without-insurance')
    expect(slugs).toContain('affordable-dental-cleaning-without-insurance')
    expect(slugs).toContain('how-to-save-on-crowns-without-insurance')
  })
})

// ─── Test 5–6: Decision pages include decisionQuestion and safeAnswer ─────────

describe('Phase 4 — decision page content fields', () => {
  it('all decision pages have a non-empty decisionQuestion', () => {
    snapshot.decisionPages.forEach(d => {
      expect(d.decisionQuestion.trim().length).toBeGreaterThan(0)
    })
  })

  it('all decision pages have a non-empty safeAnswer', () => {
    snapshot.decisionPages.forEach(d => {
      expect(d.safeAnswer.trim().length).toBeGreaterThan(0)
    })
  })

  it('all decision pages have at least one requiredFact', () => {
    snapshot.decisionPages.forEach(d => {
      expect(d.requiredFacts.length).toBeGreaterThan(0)
    })
  })

  it('all decision pages have seoTitle and seoDescription', () => {
    snapshot.decisionPages.forEach(d => {
      expect(d.seoTitle.trim().length).toBeGreaterThan(0)
      expect(d.seoDescription.trim().length).toBeGreaterThan(0)
    })
  })
})

// ─── Test 7: Decision pages do not render forbiddenClaims as patient-facing ───

describe('Phase 4 — decision page forbiddenClaims not present in patient-facing content', () => {
  // The patient-facing fields are: safeAnswer, seoTitle, seoDescription.
  // forbiddenClaims are internal architectural annotations — they must not leak
  // into any field the DecisionPageView component renders publicly.

  function extractCoreClaim(claim: string): string {
    return claim.replace(/"/g, '').split(' — ')[0].trim().toLowerCase()
  }

  it('safeAnswer does not contain any of its own forbiddenClaims core phrases', () => {
    snapshot.decisionPages.forEach(page => {
      const answer = page.safeAnswer.toLowerCase()
      page.forbiddenClaims.forEach(claim => {
        const core = extractCoreClaim(claim)
        if (core.length > 4) {
          expect(
            answer,
            `"${core}" must not appear in safeAnswer of "${page.slug}"`,
          ).not.toContain(core)
        }
      })
    })
  })

  it('seoTitle and seoDescription do not contain forbiddenClaims core phrases', () => {
    snapshot.decisionPages.forEach(page => {
      const seo = (page.seoTitle + ' ' + page.seoDescription).toLowerCase()
      page.forbiddenClaims.forEach(claim => {
        const core = extractCoreClaim(claim)
        if (core.length > 4) {
          expect(
            seo,
            `"${core}" must not appear in SEO copy of "${page.slug}"`,
          ).not.toContain(core)
        }
      })
    })
  })
})

// ─── Tests 8–9: Unconfirmed dentist CMS records — no pricing, no Join CTA ────

describe('Phase 4 — unconfirmed dentist pages: no annualPrice, no Join CTA', () => {
  const unconfirmedPages = snapshot.dentistPages.filter(
    d => d.pageType === 'unconfirmed_request_detail',
  )

  it('there is at least one unconfirmed dentist page in the snapshot', () => {
    expect(unconfirmedPages.length).toBeGreaterThan(0)
  })

  it('unconfirmed dentist pages have offerSummary = null (no annualPrice exposed)', () => {
    unconfirmedPages.forEach(d => {
      expect(d.offerSummary).toBeNull()
    })
  })

  it('unconfirmed dentist pages: primaryCta.label is not "Join plan"', () => {
    unconfirmedPages.forEach(d => {
      expect(d.primaryCta.label.toLowerCase()).not.toBe('join plan')
    })
  })

  it('unconfirmed dentist pages: primaryCta.href routes to request flow', () => {
    unconfirmedPages.forEach(d => {
      expect(d.primaryCta.href).toBe(REQUEST_FLOW_ROUTE)
    })
  })

  it('unconfirmed dentist pages: expectationCopy is present (required disclosure)', () => {
    unconfirmedPages.forEach(d => {
      expect(d.expectationCopy).not.toBeNull()
      expect(d.expectationCopy!.trim().length).toBeGreaterThan(0)
    })
  })
})

// ─── Test 10: Confirmed dentist CMS records — Join CTA only when gates allow ──

describe('Phase 4 — confirmed dentist pages: Join CTA gated by all three conditions', () => {
  const confirmedInSnapshot = snapshot.dentistPages.find(
    d => d.pageType === 'confirmed_provider_detail',
  )!
  const confirmed = MOCK_DENTIST_PAGES.find(p => p.provider_status === 'confirmed_dap_provider')!

  it('confirmed provider exists in snapshot with full demo gate state', () => {
    expect(confirmedInSnapshot).toBeDefined()
    expect(confirmedInSnapshot.offerSummary).not.toBeNull()
  })

  it('confirmed + all gates open: primaryCta.label = "Join plan", href includes /enroll', () => {
    const r = exportDentistPageToCmsRecord(confirmed, true, true)
    expect(r.primaryCta.label.toLowerCase()).toBe('join plan')
    expect(r.primaryCta.href).toContain('/enroll')
  })

  it('confirmed + offer terms NOT validated: no Join CTA, offerSummary = null', () => {
    const r = exportDentistPageToCmsRecord(confirmed, false, false)
    expect(r.primaryCta.label.toLowerCase()).not.toBe('join plan')
    expect(r.offerSummary).toBeNull()
  })

  it('confirmed + offer terms validated, CTA gate locked: no Join CTA, but offerSummary present', () => {
    const r = exportDentistPageToCmsRecord(confirmed, true, false)
    expect(r.primaryCta.label.toLowerCase()).not.toBe('join plan')
    expect(r.offerSummary).not.toBeNull()
  })

  it('confirmed dentist page: expectationCopy is null', () => {
    expect(confirmedInSnapshot.expectationCopy).toBeNull()
  })
})

// ─── Test 11: Full suite integrity — snapshot consistency ────────────────────

describe('Phase 4 — snapshot structural integrity', () => {
  it('all practices in snapshot have isPublic = true', () => {
    snapshot.practices.forEach(p => {
      expect(p.publicDisplay.isPublic).toBe(true)
    })
  })

  it('all practices have a non-null publicUrlPath', () => {
    snapshot.practices.forEach(p => {
      expect(p.publicUrlPath).not.toBeNull()
    })
  })

  it('snapshot practice count equals ALL_PREVIEW_PRACTICES minus declined', () => {
    const expectedCount = ALL_PREVIEW_PRACTICES.filter(p => p.provider_status !== 'declined').length
    expect(snapshot.practices).toHaveLength(expectedCount)
  })

  it('snapshot has all 5 required collections', () => {
    expect(Array.isArray(snapshot.practices)).toBe(true)
    expect(Array.isArray(snapshot.cities)).toBe(true)
    expect(Array.isArray(snapshot.dentistPages)).toBe(true)
    expect(Array.isArray(snapshot.decisionPages)).toBe(true)
    expect(Array.isArray(snapshot.treatmentPages)).toBe(true)
  })
})
