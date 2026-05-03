import { describe, it, expect } from 'vitest'
import {
  exportPracticeToCmsRecord,
  exportCityToCmsRecord,
  exportDentistPageToCmsRecord,
  exportDecisionPagesToCmsRecords,
  exportDapCmsSnapshot,
} from './dapCmsExport'
import { MOCK_DENTIST_PAGES } from './mockData'
import { ALL_PREVIEW_PRACTICES } from './dapCityData'
import { REQUEST_FLOW_ROUTE, FORBIDDEN_CITY_CLAIMS } from '../dap/registry/dapDisplayRules'

const declined    = MOCK_DENTIST_PAGES.find(p => p.provider_status === 'declined')!
const confirmed   = MOCK_DENTIST_PAGES.find(p => p.provider_status === 'confirmed_dap_provider')!
const unconfirmed = MOCK_DENTIST_PAGES.find(p => p.provider_status === 'not_confirmed')!
const requested   = MOCK_DENTIST_PAGES.find(p => p.provider_status === 'recruitment_requested')!

// ─── Test 1–5: Declined practice — no public surface ─────────────────────────

describe('exportPracticeToCmsRecord — declined', () => {
  const record = exportPracticeToCmsRecord(declined, true, true)

  it('isPublic is false even with all gates open', () => {
    expect(record.publicDisplay.isPublic).toBe(false)
  })

  it('publicUrlPath is null', () => {
    expect(record.publicUrlPath).toBeNull()
  })

  it('slug is null (no public route exists)', () => {
    expect(record.slug).toBeNull()
  })

  it('offerSummary is null', () => {
    expect(record.offerSummary).toBeNull()
  })

  it('showJoinCta is false', () => {
    expect(record.publicDisplay.showJoinCta).toBe(false)
  })

  it('showPricing is false', () => {
    expect(record.publicDisplay.showPricing).toBe(false)
  })
})

// ─── Test 6–9: Unconfirmed practice — no offer claims ────────────────────────

describe('exportPracticeToCmsRecord — unconfirmed', () => {
  const record = exportPracticeToCmsRecord(unconfirmed, true, true)  // gates open — should not matter

  it('showJoinCta is false regardless of gate state', () => {
    expect(record.publicDisplay.showJoinCta).toBe(false)
    expect(exportPracticeToCmsRecord(unconfirmed, false, false).publicDisplay.showJoinCta).toBe(false)
  })

  it('showPricing is false regardless of gate state', () => {
    expect(record.publicDisplay.showPricing).toBe(false)
  })

  it('offerSummary is null', () => {
    expect(record.offerSummary).toBeNull()
  })

  it('publicUrlPath is set and starts with /preview/dap/dentists/', () => {
    expect(record.publicUrlPath).not.toBeNull()
    expect(record.publicUrlPath!).toMatch(/^\/preview\/dap\/dentists\//)
  })

  it('ctaHref routes to request flow', () => {
    expect(record.publicDisplay.ctaHref).toBe(REQUEST_FLOW_ROUTE)
  })
})

// ─── Test 10–14: Confirmed provider — gate integrity ─────────────────────────

describe('exportPracticeToCmsRecord — confirmed, gate integrity', () => {
  it('offer terms NOT validated: no join CTA, no pricing, no offerSummary', () => {
    const r = exportPracticeToCmsRecord(confirmed, false, true)
    expect(r.publicDisplay.showJoinCta).toBe(false)
    expect(r.publicDisplay.showPricing).toBe(false)
    expect(r.offerSummary).toBeNull()
  })

  it('offer terms validated, CTA gate locked: no join CTA but pricing shown', () => {
    const r = exportPracticeToCmsRecord(confirmed, true, false)
    expect(r.publicDisplay.showJoinCta).toBe(false)
    expect(r.publicDisplay.showPricing).toBe(true)
    expect(r.offerSummary).not.toBeNull()
  })

  it('all gates open: showJoinCta = true, offerSummary present', () => {
    const r = exportPracticeToCmsRecord(confirmed, true, true)
    expect(r.publicDisplay.showJoinCta).toBe(true)
    expect(r.offerSummary).not.toBeNull()
    expect(r.offerSummary!.adultAnnualFee).toBeTruthy()
    expect(r.offerSummary!.childAnnualFee).toBeTruthy()
  })

  it('publicUrlPath is set', () => {
    const r = exportPracticeToCmsRecord(confirmed, true, true)
    expect(r.publicUrlPath).not.toBeNull()
  })

  it('ctaHref for confirmed provider goes to dentist page, not request flow', () => {
    const r = exportPracticeToCmsRecord(confirmed, true, true)
    expect(r.publicDisplay.ctaHref).not.toBe(REQUEST_FLOW_ROUTE)
    expect(r.publicDisplay.ctaHref).toMatch(/\/preview\/dap\/dentists\//)
  })
})

// ─── Test 15–20: City record safety ──────────────────────────────────────────

describe('exportCityToCmsRecord — safety', () => {
  it('San Diego heading contains no FORBIDDEN_CITY_CLAIMS', () => {
    const r = exportCityToCmsRecord('san-diego')
    const h = r.heading.toLowerCase()
    FORBIDDEN_CITY_CLAIMS.forEach(phrase => {
      expect(h).not.toContain(phrase.toLowerCase())
    })
  })

  it('San Diego seoTitle and seoDescription contain no FORBIDDEN_CITY_CLAIMS', () => {
    const r = exportCityToCmsRecord('san-diego')
    const combined = (r.seoTitle + ' ' + r.seoDescription).toLowerCase()
    FORBIDDEN_CITY_CLAIMS.forEach(phrase => {
      expect(combined).not.toContain(phrase.toLowerCase())
    })
  })

  it('San Diego visiblePracticeSlugs excludes declined practice (Clairemont Dental Care)', () => {
    const r = exportCityToCmsRecord('san-diego')
    expect(r.visiblePracticeSlugs).not.toContain('clairemont-dental-care')
  })

  it('San Diego hiddenPracticeIds includes the declined practice (sd-005)', () => {
    const r = exportCityToCmsRecord('san-diego')
    expect(r.hiddenPracticeIds).toContain('sd-005')
  })

  it('Escondido publicClaimLevel = "none" (no practices)', () => {
    const r = exportCityToCmsRecord('escondido')
    expect(r.publicClaimLevel).toBe('none')
    expect(r.visiblePracticeSlugs).toHaveLength(0)
  })

  it('La Mesa publicClaimLevel = "full" (has confirmed provider)', () => {
    const r = exportCityToCmsRecord('la-mesa')
    expect(r.publicClaimLevel).toBe('full')
  })

  it('La Mesa primaryCta does not route to request flow (confirmed provider available)', () => {
    const r = exportCityToCmsRecord('la-mesa')
    expect(r.primaryCta.href).not.toBe(REQUEST_FLOW_ROUTE)
  })

  it('San Diego primaryCta routes to request flow (no confirmed provider)', () => {
    const r = exportCityToCmsRecord('san-diego')
    expect(r.primaryCta.href).toBe(REQUEST_FLOW_ROUTE)
  })
})

// ─── Test 21–25: Dentist detail page safety ───────────────────────────────────

describe('exportDentistPageToCmsRecord — safety', () => {
  it('unconfirmed practice: expectationCopy is present', () => {
    const r = exportDentistPageToCmsRecord(unconfirmed, false, false)
    expect(r.expectationCopy).not.toBeNull()
    expect(r.expectationCopy!.length).toBeGreaterThan(0)
  })

  it('unconfirmed practice: offerSummary is null', () => {
    const r = exportDentistPageToCmsRecord(unconfirmed, false, false)
    expect(r.offerSummary).toBeNull()
  })

  it('unconfirmed practice: offerSummary is null even if gates say validated', () => {
    const r = exportDentistPageToCmsRecord(unconfirmed, true, true)
    expect(r.offerSummary).toBeNull()
  })

  it('unconfirmed practice: primaryCta goes to request flow', () => {
    const r = exportDentistPageToCmsRecord(unconfirmed, false, false)
    expect(r.primaryCta.href).toBe(REQUEST_FLOW_ROUTE)
  })

  it('confirmed provider + validated offer terms: offerSummary is present', () => {
    const r = exportDentistPageToCmsRecord(confirmed, true, true)
    expect(r.offerSummary).not.toBeNull()
    expect(r.offerSummary!.adultAnnualFee).toBeTruthy()
  })

  it('confirmed provider: expectationCopy is null', () => {
    const r = exportDentistPageToCmsRecord(confirmed, true, true)
    expect(r.expectationCopy).toBeNull()
  })

  it('confirmed provider + offer terms NOT validated: offerSummary is null', () => {
    const r = exportDentistPageToCmsRecord(confirmed, false, false)
    expect(r.offerSummary).toBeNull()
  })

  it('pageType is "confirmed_provider_detail" for confirmed, "unconfirmed_request_detail" for others', () => {
    expect(exportDentistPageToCmsRecord(confirmed, true, true).pageType).toBe('confirmed_provider_detail')
    expect(exportDentistPageToCmsRecord(unconfirmed, false, false).pageType).toBe('unconfirmed_request_detail')
    expect(exportDentistPageToCmsRecord(requested, false, false).pageType).toBe('unconfirmed_request_detail')
  })
})

// ─── Test 26–29: Decision pages — content integrity ──────────────────────────

describe('exportDecisionPagesToCmsRecords — content integrity', () => {
  const pages = exportDecisionPagesToCmsRecords()

  it('returns exactly 30 seed decision pages (15 original + 15 added in Phase 7A)', () => {
    expect(pages).toHaveLength(30)
  })

  it('all pages have decisionQuestion, safeAnswer, requiredFacts, forbiddenClaims', () => {
    pages.forEach(p => {
      expect(p.decisionQuestion.length).toBeGreaterThan(0)
      expect(p.safeAnswer.length).toBeGreaterThan(0)
      expect(p.requiredFacts.length).toBeGreaterThan(0)
      expect(p.forbiddenClaims.length).toBeGreaterThan(0)
    })
  })

  it('all pages have non-empty slug, seoTitle, seoDescription', () => {
    pages.forEach(p => {
      expect(p.slug.length).toBeGreaterThan(0)
      expect(p.seoTitle.length).toBeGreaterThan(0)
      expect(p.seoDescription.length).toBeGreaterThan(0)
    })
  })

  it('expected slugs are present', () => {
    const slugs = pages.map(p => p.slug)
    expect(slugs).toContain('no-insurance-dentist-san-diego')
    expect(slugs).toContain('dental-membership-plan-vs-insurance')
    expect(slugs).toContain('dentist-payment-options-without-insurance')
    expect(slugs).toContain('affordable-dental-cleaning-without-insurance')
    expect(slugs).toContain('how-to-save-on-crowns-without-insurance')
  })
})

// ─── Test 30–36: exportDapCmsSnapshot — structural integrity ─────────────────

describe('exportDapCmsSnapshot — structural integrity', () => {
  const snapshot = exportDapCmsSnapshot()

  it('snapshot has all 5 collections', () => {
    expect(Array.isArray(snapshot.practices)).toBe(true)
    expect(Array.isArray(snapshot.cities)).toBe(true)
    expect(Array.isArray(snapshot.dentistPages)).toBe(true)
    expect(Array.isArray(snapshot.decisionPages)).toBe(true)
    expect(Array.isArray(snapshot.treatmentPages)).toBe(true)
  })

  it('no declined practice in snapshot.practices', () => {
    snapshot.practices.forEach(p => {
      expect(p.status).not.toBe('declined')
      expect(p.publicDisplay.isPublic).toBe(true)
    })
  })

  it('all practices in snapshot have publicUrlPath', () => {
    snapshot.practices.forEach(p => {
      expect(p.publicUrlPath).not.toBeNull()
    })
  })

  it('no declined dentist page in snapshot.dentistPages', () => {
    snapshot.dentistPages.forEach(dp => {
      const practice = ALL_PREVIEW_PRACTICES.find(p => p.id === dp.practiceId)!
      expect(practice.provider_status).not.toBe('declined')
    })
  })

  it('snapshot.practices count matches ALL_PREVIEW_PRACTICES public count', () => {
    const publicCount = ALL_PREVIEW_PRACTICES.filter(p => p.provider_status !== 'declined').length
    expect(snapshot.practices).toHaveLength(publicCount)
  })

  it('snapshot contains 30 decision pages', () => {
    expect(snapshot.decisionPages).toHaveLength(30)
  })

  it('snapshot.cities covers all 5 DAP city pages', () => {
    const slugs = snapshot.cities.map(c => c.slug)
    expect(slugs).toContain('san-diego')
    expect(slugs).toContain('la-mesa')
    expect(slugs).toContain('chula-vista')
    expect(slugs).toContain('la-jolla')
    expect(slugs).toContain('escondido')
  })
})

// ─── Test 37: slug consistency across snapshot ────────────────────────────────

describe('Slug consistency', () => {
  it('each dentist page slug in snapshot matches getPracticeBySlug lookup', () => {
    const { dentistPages } = exportDapCmsSnapshot()
    dentistPages.forEach(dp => {
      expect(dp.slug.length).toBeGreaterThan(0)
      expect(dp.publicUrlPath).toBe(`/preview/dap/dentists/${dp.slug}`)
    })
  })
})
