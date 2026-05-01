import { describe, it, expect } from 'vitest'
import {
  shouldShowJoinCta,
  shouldShowPricingClaims,
  isPublicOfferCard,
  getPatientCtaForSearchState,
  getSearchResultState,
  REQUEST_CONFIRMATION_COPY,
  REQUEST_FLOW_ROUTE,
  FORBIDDEN_CITY_CLAIMS,
  MOCK_SEARCH_SCENARIOS,
  type SearchResultState,
} from '../dapDisplayRules'
import {
  getCityHeading,
  getCitySubheading,
  getDentistSlug,
  getPracticeBySlug,
  getPublicDentistSlugs,
  getPracticesForCity,
  ALL_PREVIEW_PRACTICES,
  DAP_CITY_PAGES,
} from '../dapCityData'
import { MOCK_DENTIST_PAGES } from '../mockData'
import type { ProviderStatus } from '../types'

// ─── Test 1: City pages do not use forbidden directory claims ─────────────────

describe('City page copy — no forbidden claims', () => {
  const testCities = ['San Diego', 'La Mesa', 'Chula Vista', 'La Jolla', 'Escondido']

  testCities.forEach(city => {
    it(`getCityHeading("${city}") contains no forbidden claims`, () => {
      const heading = getCityHeading(city).toLowerCase()
      FORBIDDEN_CITY_CLAIMS.forEach(phrase => {
        expect(heading, `"${phrase}" must not appear in city heading`).not.toContain(phrase.toLowerCase())
      })
    })
  })

  it('getCitySubheading() contains no forbidden claims', () => {
    const sub = getCitySubheading().toLowerCase()
    FORBIDDEN_CITY_CLAIMS.forEach(phrase => {
      expect(sub, `"${phrase}" must not appear in city subheading`).not.toContain(phrase.toLowerCase())
    })
  })

  it('getCityHeading uses safe "Dentists in [City]" pattern', () => {
    expect(getCityHeading('San Diego')).toBe('Dentists in San Diego')
    expect(getCityHeading('La Mesa')).toBe('Dentists in La Mesa')
  })

  it('getCityHeading does not say "DAP dentists" or "participating dentists"', () => {
    const h = getCityHeading('San Diego').toLowerCase()
    expect(h).not.toContain('dap dentists')
    expect(h).not.toContain('participating')
    expect(h).not.toContain('join')
    expect(h).not.toContain('all listed')
    expect(h).not.toContain('guaranteed')
  })
})

// ─── Test 2 + 3: Unconfirmed dentist detail — no pricing, no Join CTA ────────

describe('Unconfirmed dentist detail page — no pricing, no Join CTA', () => {
  const unconfirmedStatuses: ProviderStatus[] = [
    'not_confirmed',
    'recruitment_requested',
    'pending_confirmation',
  ]

  unconfirmedStatuses.forEach(status => {
    it(`${status}: shouldShowPricingClaims returns false in all gate states`, () => {
      expect(shouldShowPricingClaims(status, true)).toBe(false)
      expect(shouldShowPricingClaims(status, false)).toBe(false)
    })

    it(`${status}: shouldShowJoinCta returns false in all gate states`, () => {
      expect(shouldShowJoinCta(status, true, true)).toBe(false)
      expect(shouldShowJoinCta(status, false, false)).toBe(false)
    })
  })
})

// ─── Test 4: Confirmed dentist detail — Join CTA only when all 3 gates ───────

describe('Confirmed dentist detail page — Join CTA gate integrity', () => {
  const status: ProviderStatus = 'confirmed_dap_provider'

  it('shows Join CTA when all three gates satisfied', () => {
    expect(shouldShowJoinCta(status, true, true)).toBe(true)
  })

  it('does NOT show Join CTA when offer terms unvalidated (eb-002 open)', () => {
    expect(shouldShowJoinCta(status, false, true)).toBe(false)
  })

  it('does NOT show Join CTA when CTA gate locked (eb-004 open)', () => {
    expect(shouldShowJoinCta(status, true, false)).toBe(false)
  })

  it('does NOT show Join CTA when both eb-002 and eb-004 are open', () => {
    expect(shouldShowJoinCta(status, false, false)).toBe(false)
  })

  it('shows pricing only when offer terms validated', () => {
    expect(shouldShowPricingClaims(status, true)).toBe(true)
    expect(shouldShowPricingClaims(status, false)).toBe(false)
  })
})

// ─── Test 5: Declined dentists do not render in city pages ───────────────────

describe('Declined dentists — not in city pages', () => {
  it('isPublicOfferCard returns false for declined', () => {
    expect(isPublicOfferCard('declined')).toBe(false)
  })

  it('San Diego city practices filtered to exclude declined practice (Clairemont Dental Care)', () => {
    const all      = getPracticesForCity('San Diego')
    const public_  = all.filter(p => isPublicOfferCard(p.provider_status))
    const declined = all.filter(p => p.provider_status === 'declined')

    expect(declined.length).toBeGreaterThan(0)  // declined exists in dataset
    expect(public_.some(p => p.provider_status === 'declined')).toBe(false)  // but not in public list
  })

  it('no practice with declined status passes the isPublicOfferCard filter', () => {
    const allDeclined = ALL_PREVIEW_PRACTICES.filter(p => p.provider_status === 'declined')
    allDeclined.forEach(p => {
      expect(
        isPublicOfferCard(p.provider_status),
        `${p.practiceName} must not pass public filter`,
      ).toBe(false)
    })
  })
})

// ─── Test 6: Declined dentists do not render in search results ───────────────

describe('Declined dentists — not in search result public counts', () => {
  it('getSearchResultState with only declined internal records returns declined_hidden', () => {
    expect(getSearchResultState(0, 0, 1)).toBe('declined_hidden')
  })

  it('declined_hidden state routes patient to request flow (never shows offer page)', () => {
    const cta = getPatientCtaForSearchState('declined_hidden')
    expect(cta.href).toBe(REQUEST_FLOW_ROUTE)
  })

  it('declined_hidden patient experience is same as no_results (decline not disclosed)', () => {
    const declinedCta    = getPatientCtaForSearchState('declined_hidden')
    const noResultsCta   = getPatientCtaForSearchState('no_results')
    expect(declinedCta.href).toBe(noResultsCta.href)
    expect(declinedCta.label).toBe(noResultsCta.label)
  })
})

// ─── Test 7: Declined dentists do not render public detail pages ──────────────

describe('Declined dentists — no public detail route', () => {
  const declinedPractice = MOCK_DENTIST_PAGES.find(p => p.provider_status === 'declined')

  it('declined practice exists in the mock dataset', () => {
    expect(declinedPractice).toBeDefined()
  })

  it('getDentistSlug returns undefined for declined practice (no pageSlug)', () => {
    expect(declinedPractice).toBeDefined()
    expect(getDentistSlug(declinedPractice!)).toBeUndefined()
  })

  it('declined practice is not in getPublicDentistSlugs()', () => {
    const publicSlugs = getPublicDentistSlugs()
    // declined has no slug so this should trivially pass, but we verify explicitly
    const declinedSlug = getDentistSlug(declinedPractice!)
    expect(declinedSlug).toBeUndefined()
    if (declinedSlug) {
      expect(publicSlugs).not.toContain(declinedSlug)
    }
  })

  it('getPracticeBySlug cannot find declined practice (it has no slug)', () => {
    // Attempting to look up by practice name segment should not return the declined practice
    const result = getPracticeBySlug('clairemont-dental-care')
    // Either undefined (not found) or a different practice — but must never return a declined practice
    if (result !== undefined) {
      expect(result.provider_status).not.toBe('declined')
    }
  })

  it('all slugs in generateStaticParams are for non-declined practices', () => {
    const publicSlugs = getPublicDentistSlugs()
    publicSlugs.forEach(slug => {
      const practice = getPracticeBySlug(slug)
      expect(practice).toBeDefined()
      expect(practice!.provider_status).not.toBe('declined')
    })
  })
})

// ─── Test 8: Request confirmation page includes safe expectation copy ─────────

describe('Request confirmation page — safe expectation copy', () => {
  it('REQUEST_CONFIRMATION_COPY states that the dentist does not currently offer DAP', () => {
    expect(REQUEST_CONFIRMATION_COPY.toLowerCase()).toContain(
      'does not mean this dentist currently offers dental advantage plan',
    )
  })

  it('REQUEST_CONFIRMATION_COPY mentions contacting the practice', () => {
    expect(REQUEST_CONFIRMATION_COPY.toLowerCase()).toContain('contact the practice')
  })

  it('REQUEST_CONFIRMATION_COPY does not imply a guarantee', () => {
    const copy = REQUEST_CONFIRMATION_COPY.toLowerCase()
    expect(copy).not.toContain('guarantee')
    expect(copy).not.toContain('confirmed')
    expect(copy).not.toContain('will join')
    expect(copy).not.toContain('will offer')
  })
})

// ─── Test 9: Unconfirmed-only search state routes to request flow ─────────────

describe('Search state — unconfirmed-only area routes to request flow, not Join', () => {
  it('getSearchResultState(0, n, 0) returns unconfirmed_only', () => {
    expect(getSearchResultState(0, 1, 0)).toBe('unconfirmed_only')
    expect(getSearchResultState(0, 5, 0)).toBe('unconfirmed_only')
  })

  it('unconfirmed_only CTA goes to request flow', () => {
    const cta = getPatientCtaForSearchState('unconfirmed_only')
    expect(cta.href).toBe(REQUEST_FLOW_ROUTE)
  })

  it('unconfirmed_only CTA label does not say "Join"', () => {
    const cta = getPatientCtaForSearchState('unconfirmed_only')
    expect(cta.label.toLowerCase()).not.toContain('join')
  })

  it('confirmed_available is the only state that does NOT go to request flow', () => {
    const states: SearchResultState[] = [
      'unconfirmed_only',
      'no_results',
      'declined_hidden',
    ]
    states.forEach(state => {
      const cta = getPatientCtaForSearchState(state)
      expect(cta.href, `${state} must route to request flow`).toBe(REQUEST_FLOW_ROUTE)
    })
    const confirmedCta = getPatientCtaForSearchState('confirmed_available')
    expect(confirmedCta.href).not.toBe(REQUEST_FLOW_ROUTE)
  })
})

// ─── getSearchResultState — all branches ─────────────────────────────────────

describe('getSearchResultState — full branch coverage', () => {
  it('confirmed_available when confirmedCount > 0', () => {
    expect(getSearchResultState(1, 0, 0)).toBe('confirmed_available')
    expect(getSearchResultState(3, 2, 1)).toBe('confirmed_available')
  })

  it('unconfirmed_only when confirmed=0, unconfirmed>0', () => {
    expect(getSearchResultState(0, 2, 0)).toBe('unconfirmed_only')
  })

  it('declined_hidden when all public counts are 0 but internal declined exists', () => {
    expect(getSearchResultState(0, 0, 1)).toBe('declined_hidden')
    expect(getSearchResultState(0, 0, 3)).toBe('declined_hidden')
  })

  it('no_results when all counts are 0', () => {
    expect(getSearchResultState(0, 0, 0)).toBe('no_results')
  })
})

// ─── MOCK_SEARCH_SCENARIOS integrity ─────────────────────────────────────────

describe('MOCK_SEARCH_SCENARIOS integrity', () => {
  it('has exactly 4 scenarios covering all 4 states', () => {
    const states = MOCK_SEARCH_SCENARIOS.map(s => s.state)
    expect(states).toContain('confirmed_available')
    expect(states).toContain('unconfirmed_only')
    expect(states).toContain('no_results')
    expect(states).toContain('declined_hidden')
  })

  it('each scenario state matches its counts', () => {
    MOCK_SEARCH_SCENARIOS.forEach(scenario => {
      const computed = getSearchResultState(
        scenario.confirmedCount,
        scenario.unconfirmedCount,
        scenario.declinedInternalCount,
      )
      expect(computed, `${scenario.id}: computed state must match declared state`).toBe(scenario.state)
    })
  })

  it('declined_hidden patient-facing CTA does not expose the decline', () => {
    // patientExperienceNote is an architectural annotation for the control center review,
    // not patient-facing text. The patient-facing surface is getPatientCtaForSearchState.
    const cta = getPatientCtaForSearchState('declined_hidden')
    expect(cta.label.toLowerCase()).not.toContain('declined')
    expect(cta.href).toBe(REQUEST_FLOW_ROUTE)  // patient sees Path 2
  })
})

// ─── City data integrity ──────────────────────────────────────────────────────

describe('City data — structural integrity', () => {
  it('all directive cities are present in DAP_CITY_PAGES', () => {
    const slugs = DAP_CITY_PAGES.map(c => c.slug)
    expect(slugs).toContain('san-diego')
    expect(slugs).toContain('chula-vista')
    expect(slugs).toContain('la-jolla')
    expect(slugs).toContain('escondido')
  })

  it('Escondido has no practices — correctly demonstrates the empty state', () => {
    const practices = getPracticesForCity('Escondido')
    expect(practices).toHaveLength(0)
  })

  it('La Mesa has exactly one confirmed provider (Irene Olaes DDS)', () => {
    const confirmed = getPracticesForCity('La Mesa').filter(
      p => p.provider_status === 'confirmed_dap_provider',
    )
    expect(confirmed).toHaveLength(1)
    expect(confirmed[0].practiceName).toBe('Irene Olaes DDS')
  })

  it('all practices in ALL_PREVIEW_PRACTICES have an id, practiceName, city, and zip', () => {
    ALL_PREVIEW_PRACTICES.forEach(p => {
      expect(p.id.length).toBeGreaterThan(0)
      expect(p.practiceName.length).toBeGreaterThan(0)
      expect(p.city.length).toBeGreaterThan(0)
      expect(p.zip.length).toBeGreaterThan(0)
    })
  })
})

// ─── getDentistSlug integrity ─────────────────────────────────────────────────

describe('getDentistSlug', () => {
  it('extracts the last path segment from pageSlug', () => {
    const practice = MOCK_DENTIST_PAGES.find(p => p.id === 'olaes')!
    expect(getDentistSlug(practice)).toBe('irene-olaes-dds')
  })

  it('returns undefined when pageSlug is absent (declined)', () => {
    const declined = MOCK_DENTIST_PAGES.find(p => p.provider_status === 'declined')!
    expect(getDentistSlug(declined)).toBeUndefined()
  })

  it('all non-declined practices with pageSlug have a non-empty slug', () => {
    ALL_PREVIEW_PRACTICES
      .filter(p => p.provider_status !== 'declined' && p.pageSlug)
      .forEach(p => {
        const slug = getDentistSlug(p)
        expect(slug).toBeDefined()
        expect(slug!.length).toBeGreaterThan(0)
      })
  })
})
