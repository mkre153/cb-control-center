import { describe, it, expect } from 'vitest'
import {
  getPracticeAvailabilityState,
  getPrimaryCtaForPractice,
  getSecondaryCtaForPractice,
  getPracticeStatusBadge,
  getCityAvailabilitySummary,
  getCityPrimaryCta,
  getDentistPageTemplate,
  getDentistPageModel,
  getAllowedPublicClaimsForPractice,
  getHomepageHeroModel,
  getNoResultsModel,
  getSearchResultsModel,
  getDecisionPageCtaModel,
  getTreatmentPageCtaModel,
  getRequestFlowModel,
  getCityPageModel,
} from './dapPublicUxRules'
import type { DapGateState } from './dapPublicUxTypes'

// ─── Gate state helpers ───────────────────────────────────────────────────────

const NO_GATES: DapGateState    = { offerTermsValidated: false, ctaGateUnlocked: false }
const OFFER_ONLY: DapGateState  = { offerTermsValidated: true,  ctaGateUnlocked: false }
const ALL_GATES: DapGateState   = { offerTermsValidated: true,  ctaGateUnlocked: true  }

// ─── 1. Availability state mapping ───────────────────────────────────────────

describe('Availability state mapping', () => {
  it('confirmed_dap_provider + published → confirmed', () => {
    expect(getPracticeAvailabilityState('confirmed_dap_provider', true)).toBe('confirmed')
  })
  it('not_confirmed + published → not_confirmed', () => {
    expect(getPracticeAvailabilityState('not_confirmed', true)).toBe('not_confirmed')
  })
  it('recruitment_requested + published → requested', () => {
    expect(getPracticeAvailabilityState('recruitment_requested', true)).toBe('requested')
  })
  it('pending_confirmation + published → requested (patient sees Path 2)', () => {
    expect(getPracticeAvailabilityState('pending_confirmation', true)).toBe('requested')
  })
  it('declined + published → unavailable_internal_only', () => {
    expect(getPracticeAvailabilityState('declined', true)).toBe('unavailable_internal_only')
  })
  it('confirmed_dap_provider + not published → unavailable_internal_only', () => {
    expect(getPracticeAvailabilityState('confirmed_dap_provider', false)).toBe('unavailable_internal_only')
  })
  it('not_confirmed + not published → unavailable_internal_only', () => {
    expect(getPracticeAvailabilityState('not_confirmed', false)).toBe('unavailable_internal_only')
  })
})

// ─── 2. Confirmed provider CTA rules ──────────────────────────────────────────

describe('Confirmed provider CTA rules', () => {
  it('confirmed + offerTermsValidated + ctaGateUnlocked → join_plan', () => {
    expect(getPrimaryCtaForPractice('confirmed', ALL_GATES)).toBe('join_plan')
  })
  it('confirmed + offerTermsValidated but gate locked → view_plan_details', () => {
    expect(getPrimaryCtaForPractice('confirmed', OFFER_ONLY)).toBe('view_plan_details')
  })
  it('confirmed + no offer terms + no gate → request_plan_details', () => {
    expect(getPrimaryCtaForPractice('confirmed', NO_GATES)).toBe('request_plan_details')
  })
  it('confirmed status alone does not unlock join_plan', () => {
    expect(getPrimaryCtaForPractice('confirmed', NO_GATES)).not.toBe('join_plan')
  })
  it('offerTermsValidated alone without ctaGateUnlocked does not produce join_plan', () => {
    expect(getPrimaryCtaForPractice('confirmed', OFFER_ONLY)).not.toBe('join_plan')
  })
  it('fully gated confirmed secondary CTA is view_plan_details', () => {
    expect(getSecondaryCtaForPractice('confirmed', ALL_GATES)).toBe('view_plan_details')
  })
  it('confirmed without full gates secondary CTA is search_nearby', () => {
    expect(getSecondaryCtaForPractice('confirmed', NO_GATES)).toBe('search_nearby')
  })
  it('confirmed + offer only secondary CTA is search_nearby', () => {
    expect(getSecondaryCtaForPractice('confirmed', OFFER_ONLY)).toBe('search_nearby')
  })
})

// ─── 3. Not-confirmed provider CTA rules ──────────────────────────────────────

describe('Not-confirmed provider CTA rules', () => {
  it('not_confirmed → request_this_dentist', () => {
    expect(getPrimaryCtaForPractice('not_confirmed', NO_GATES)).toBe('request_this_dentist')
  })
  it('not_confirmed ignores gate state — gates do not upgrade CTA', () => {
    expect(getPrimaryCtaForPractice('not_confirmed', ALL_GATES)).toBe('request_this_dentist')
  })
  it('not_confirmed secondary CTA is search_nearby', () => {
    expect(getSecondaryCtaForPractice('not_confirmed', NO_GATES)).toBe('search_nearby')
  })
  it('requestable → request_this_dentist', () => {
    expect(getPrimaryCtaForPractice('requestable', NO_GATES)).toBe('request_this_dentist')
  })
  it('requestable ignores gate state', () => {
    expect(getPrimaryCtaForPractice('requestable', ALL_GATES)).toBe('request_this_dentist')
  })
})

// ─── 4. Requested provider CTA rules ──────────────────────────────────────────

describe('Requested provider CTA rules', () => {
  it('requested → add_your_request', () => {
    expect(getPrimaryCtaForPractice('requested', NO_GATES)).toBe('add_your_request')
  })
  it('requested ignores gate state — CTA stays add_your_request', () => {
    expect(getPrimaryCtaForPractice('requested', ALL_GATES)).toBe('add_your_request')
  })
  it('requested secondary CTA is search_nearby', () => {
    expect(getSecondaryCtaForPractice('requested', NO_GATES)).toBe('search_nearby')
  })
  it('requested is never join_plan even with all gates', () => {
    expect(getPrimaryCtaForPractice('requested', ALL_GATES)).not.toBe('join_plan')
  })
  it('requested is never view_plan_details', () => {
    expect(getPrimaryCtaForPractice('requested', ALL_GATES)).not.toBe('view_plan_details')
  })
})

// ─── 5. Declined provider public exclusion ────────────────────────────────────

describe('Declined provider public exclusion', () => {
  it('declined + published → unavailable_internal_only state', () => {
    expect(getPracticeAvailabilityState('declined', true)).toBe('unavailable_internal_only')
  })
  it('unavailable_internal_only primary CTA → none', () => {
    expect(getPrimaryCtaForPractice('unavailable_internal_only', ALL_GATES)).toBe('none')
  })
  it('unavailable_internal_only secondary CTA → null', () => {
    expect(getSecondaryCtaForPractice('unavailable_internal_only', ALL_GATES)).toBeNull()
  })
  it('unavailable_internal_only status badge is not patient-facing', () => {
    expect(getPracticeStatusBadge('unavailable_internal_only').isPublic).toBe(false)
  })
  it('unavailable_internal_only → no dentist page template', () => {
    expect(getDentistPageTemplate('unavailable_internal_only')).toBeNull()
  })
  it('getDentistPageModel returns null for declined — no public page', () => {
    expect(getDentistPageModel('unavailable_internal_only', 'Test Practice', ALL_GATES)).toBeNull()
  })
  it('unavailable_internal_only allowed claims is empty', () => {
    expect(getAllowedPublicClaimsForPractice('unavailable_internal_only', ALL_GATES)).toHaveLength(0)
  })
})

// ─── 6. Draft provider public exclusion ───────────────────────────────────────

describe('Draft / unpublished provider public exclusion', () => {
  it('published=false → unavailable_internal_only regardless of provider status', () => {
    expect(getPracticeAvailabilityState('confirmed_dap_provider', false)).toBe('unavailable_internal_only')
  })
  it('published=false not_confirmed → unavailable_internal_only', () => {
    expect(getPracticeAvailabilityState('not_confirmed', false)).toBe('unavailable_internal_only')
  })
  it('published=false → primary CTA is none', () => {
    const state = getPracticeAvailabilityState('not_confirmed', false)
    expect(getPrimaryCtaForPractice(state, ALL_GATES)).toBe('none')
  })
  it('published=false → no public dentist page template', () => {
    const state = getPracticeAvailabilityState('not_confirmed', false)
    expect(getDentistPageTemplate(state)).toBeNull()
  })
  it('published=false confirmed → no public page model', () => {
    const state = getPracticeAvailabilityState('confirmed_dap_provider', false)
    expect(getDentistPageModel(state, 'Test Practice', ALL_GATES)).toBeNull()
  })
})

// ─── 7. Provider status badge rules ───────────────────────────────────────────

describe('Provider status badge rules', () => {
  it('confirmed → "DAP confirmed" badge', () => {
    expect(getPracticeStatusBadge('confirmed').label).toBe('DAP confirmed')
  })
  it('confirmed badge is public', () => {
    expect(getPracticeStatusBadge('confirmed').isPublic).toBe(true)
  })
  it('confirmed badge variant is confirmed', () => {
    expect(getPracticeStatusBadge('confirmed').variant).toBe('confirmed')
  })
  it('not_confirmed badge label is "Not confirmed"', () => {
    expect(getPracticeStatusBadge('not_confirmed').label).toBe('Not confirmed')
  })
  it('not_confirmed badge is public', () => {
    expect(getPracticeStatusBadge('not_confirmed').isPublic).toBe(true)
  })
  it('requested badge is "Requested by patients"', () => {
    expect(getPracticeStatusBadge('requested').label).toBe('Requested by patients')
  })
  it('unavailable_internal_only badge is not public', () => {
    expect(getPracticeStatusBadge('unavailable_internal_only').isPublic).toBe(false)
  })
})

// ─── 8. Dentist page template selection ───────────────────────────────────────

describe('Dentist page template selection', () => {
  it('confirmed → confirmed_provider template', () => {
    expect(getDentistPageTemplate('confirmed')).toBe('confirmed_provider')
  })
  it('not_confirmed → not_confirmed template', () => {
    expect(getDentistPageTemplate('not_confirmed')).toBe('not_confirmed')
  })
  it('requestable → not_confirmed template', () => {
    expect(getDentistPageTemplate('requestable')).toBe('not_confirmed')
  })
  it('requested → requested template', () => {
    expect(getDentistPageTemplate('requested')).toBe('requested')
  })
  it('unavailable_internal_only → null (no template)', () => {
    expect(getDentistPageTemplate('unavailable_internal_only')).toBeNull()
  })
  it('confirmed page model is public', () => {
    expect(getDentistPageModel('confirmed', 'Test Practice', ALL_GATES)?.isPublic).toBe(true)
  })
  it('not_confirmed page model is public', () => {
    expect(getDentistPageModel('not_confirmed', 'Test Practice', NO_GATES)?.isPublic).toBe(true)
  })
  it('confirmed page model includes practiceName in h1', () => {
    const model = getDentistPageModel('confirmed', 'Irene Olaes DDS', ALL_GATES)
    expect(model?.h1Pattern).toContain('Irene Olaes DDS')
  })
  it('requested page model h1 mentions patients requesting', () => {
    const model = getDentistPageModel('requested', 'Pacific Dental', NO_GATES)
    expect(model?.h1Pattern.toLowerCase()).toContain('requested')
  })
})

// ─── 9. City availability summary rules ───────────────────────────────────────

describe('City availability summary rules', () => {
  it('city with confirmed providers uses "offering" heading pattern', () => {
    const summary = getCityAvailabilitySummary('San Diego', 2, 0, 5)
    expect(summary.heading).toContain('offering Dental Advantage Plan in San Diego')
  })
  it('city with no confirmed providers uses "not yet confirmed" subheading', () => {
    const summary = getCityAvailabilitySummary('Chula Vista', 0, 1, 3)
    expect(summary.subheading).toContain('not yet confirmed')
  })
  it('city summary never implies universal availability', () => {
    const summary = getCityAvailabilitySummary('San Diego', 2, 0, 50)
    expect(summary.subheading).not.toMatch(/all dentists|every dentist|any dentist/i)
  })
  it('hasConfirmedProviders true when confirmedCount > 0', () => {
    expect(getCityAvailabilitySummary('La Mesa', 1, 0, 5).hasConfirmedProviders).toBe(true)
  })
  it('hasConfirmedProviders false when confirmedCount = 0', () => {
    expect(getCityAvailabilitySummary('El Cajon', 0, 0, 5).hasConfirmedProviders).toBe(false)
  })
  it('city summary returns correct cityName', () => {
    expect(getCityAvailabilitySummary('Oceanside', 0, 0, 10).cityName).toBe('Oceanside')
  })
  it('city page model sections include required sections', () => {
    const model = getCityPageModel('San Diego', 2)
    expect(model.sections).toContain('confirmed_providers')
    expect(model.sections).toContain('request_availability')
  })
  it('city page model never implies universal availability', () => {
    expect(getCityPageModel('San Diego', 10).impliesUniversalAvailability).toBe(false)
  })
})

// ─── 10. City primary CTA rules ───────────────────────────────────────────────

describe('City primary CTA rules', () => {
  it('confirmed providers exist → search_nearby', () => {
    expect(getCityPrimaryCta(3)).toBe('search_nearby')
  })
  it('one confirmed provider → search_nearby', () => {
    expect(getCityPrimaryCta(1)).toBe('search_nearby')
  })
  it('zero confirmed providers → request_city_availability', () => {
    expect(getCityPrimaryCta(0)).toBe('request_city_availability')
  })
  it('city summary primaryCta matches getCityPrimaryCta', () => {
    const summary = getCityAvailabilitySummary('San Diego', 0, 0, 5)
    expect(summary.primaryCta).toBe(getCityPrimaryCta(0))
  })
  it('city summary with confirmed matches getCityPrimaryCta(n)', () => {
    const summary = getCityAvailabilitySummary('San Diego', 3, 0, 10)
    expect(summary.primaryCta).toBe(getCityPrimaryCta(3))
  })
})

// ─── 11. Search results no-dead-end behavior ──────────────────────────────────

describe('Search results no-dead-end behavior', () => {
  it('zero confirmed providers still produces a request CTA, not dead end', () => {
    const results = getSearchResultsModel({ confirmedCount: 0, notConfirmedCount: 5, requestedCount: 0, searchLocation: 'San Diego' })
    expect(results.primaryCta).not.toBe('none')
    expect(results.isDeadEnd).toBe(false)
  })
  it('zero results produces no-results model with request CTA', () => {
    const results = getSearchResultsModel({ confirmedCount: 0, notConfirmedCount: 0, requestedCount: 0, searchLocation: 'Chula Vista' })
    expect(results.noResultsModel).not.toBeNull()
    expect(results.noResultsModel?.primaryCta.type).toBe('request_city_availability')
  })
  it('no results model is never a dead end', () => {
    const model = getNoResultsModel('San Diego')
    expect(model.isDeadEnd).toBe(false)
  })
  it('no results headline is not just "No results found."', () => {
    const model = getNoResultsModel('San Diego')
    expect(model.headline).not.toBe('No results found.')
    expect(model.headline.length).toBeGreaterThan(20)
  })
  it('no results model has a secondary CTA', () => {
    const model = getNoResultsModel('San Diego')
    expect(model.secondaryCta).not.toBeNull()
  })
  it('search with confirmed providers sets hasConfirmedProviders true', () => {
    const results = getSearchResultsModel({ confirmedCount: 2, notConfirmedCount: 3, requestedCount: 0, searchLocation: 'San Diego' })
    expect(results.hasConfirmedProviders).toBe(true)
  })
  it('search with no confirmed sets hasConfirmedProviders false', () => {
    const results = getSearchResultsModel({ confirmedCount: 0, notConfirmedCount: 5, requestedCount: 0, searchLocation: 'San Diego' })
    expect(results.hasConfirmedProviders).toBe(false)
  })
})

// ─── 12. Homepage hero model ──────────────────────────────────────────────────

describe('Homepage hero model', () => {
  it('homepage hero never implies universal availability', () => {
    expect(getHomepageHeroModel().impliesUniversalAvailability).toBe(false)
  })
  it('homepage primary CTA is search or request variant', () => {
    const hero = getHomepageHeroModel()
    const validCtaTypes: string[] = ['search_nearby', 'request_this_dentist', 'request_city_availability']
    expect(validCtaTypes).toContain(hero.primaryCta.type)
  })
  it('homepage has a secondary CTA', () => {
    expect(getHomepageHeroModel().secondaryCta).not.toBeNull()
  })
  it('homepage headline mentions finding or requesting', () => {
    const hero = getHomepageHeroModel()
    expect(hero.headline.toLowerCase()).toMatch(/find|request/)
  })
  it('homepage does not claim DAP available at every dentist', () => {
    const hero = getHomepageHeroModel()
    expect(hero.headline).not.toMatch(/every dentist|all dentists|any dentist/i)
    expect(hero.subheadline).not.toMatch(/every dentist|all dentists|any dentist/i)
  })
})

// ─── 13. Decision page CTA rules ──────────────────────────────────────────────

describe('Decision page CTA rules', () => {
  it('decision page does not imply pricing', () => {
    expect(getDecisionPageCtaModel().impliesPricing).toBe(false)
  })
  it('decision page does not imply universal availability', () => {
    expect(getDecisionPageCtaModel().impliesUniversalAvailability).toBe(false)
  })
  it('decision page primary CTA routes to search', () => {
    expect(getDecisionPageCtaModel().primaryCta).toBe('search_nearby')
  })
  it('decision page has a secondary CTA', () => {
    const model = getDecisionPageCtaModel()
    expect(model.secondaryCta).not.toBeNull()
    expect(model.secondaryCta).not.toBe('none')
  })
  it('decision page secondary CTA is a request variant', () => {
    const secondaryCta = getDecisionPageCtaModel().secondaryCta
    expect(['request_city_availability', 'request_this_dentist']).toContain(secondaryCta)
  })
})

// ─── 14. Treatment page CTA rules ────────────────────────────────────────────

describe('Treatment page CTA rules', () => {
  it('treatment page does not imply guaranteed pricing', () => {
    expect(getTreatmentPageCtaModel().impliesGuaranteedPricing).toBe(false)
  })
  it('treatment page primary CTA routes to search', () => {
    expect(getTreatmentPageCtaModel().primaryCta).toBe('search_nearby')
  })
  it('treatment page has a secondary CTA', () => {
    const model = getTreatmentPageCtaModel()
    expect(model.secondaryCta).not.toBeNull()
    expect(model.secondaryCta).not.toBe('none')
  })
  it('treatment page secondary CTA is a request variant', () => {
    const secondaryCta = getTreatmentPageCtaModel().secondaryCta
    expect(['request_city_availability', 'request_this_dentist', 'request_city_availability']).toContain(secondaryCta)
  })
})

// ─── 15. Request flow model ───────────────────────────────────────────────────

describe('Request flow model', () => {
  it('request flow includes availability caveat', () => {
    const model = getRequestFlowModel('specific_dentist')
    expect(model.availabilityCaveat).toContain('does not guarantee')
  })
  it('availability caveat is substantive (not a placeholder)', () => {
    expect(getRequestFlowModel('specific_dentist').availabilityCaveat.length).toBeGreaterThan(40)
  })
  it('request flow always collects consent — specific_dentist', () => {
    expect(getRequestFlowModel('specific_dentist').collectsConsent).toBe(true)
  })
  it('request flow always collects consent — city_availability', () => {
    expect(getRequestFlowModel('city_availability').collectsConsent).toBe(true)
  })
  it('request flow has multiple steps', () => {
    expect(getRequestFlowModel('zip_availability').steps.length).toBeGreaterThan(2)
  })
  it('request flow includes a consent step with consentToContact field', () => {
    const model = getRequestFlowModel('specific_dentist')
    const consentStep = model.steps.find(s => s.fields.includes('consentToContact'))
    expect(consentStep).toBeDefined()
  })
  it('request flow preserves the correct requestType', () => {
    expect(getRequestFlowModel('treatment_availability').requestType).toBe('treatment_availability')
  })
})

// ─── 16. Forbidden claim protection by UX state ───────────────────────────────

describe('Forbidden claim protection by UX state', () => {
  it('not_confirmed allowed claims do not include pricing', () => {
    const claims = getAllowedPublicClaimsForPractice('not_confirmed', NO_GATES)
    expect(claims.some(c => c.includes('$'))).toBe(false)
  })
  it('unavailable_internal_only has zero allowed public claims', () => {
    expect(getAllowedPublicClaimsForPractice('unavailable_internal_only', ALL_GATES)).toHaveLength(0)
  })
  it('confirmed without offer terms does not allow specific pricing', () => {
    const claims = getAllowedPublicClaimsForPractice('confirmed', NO_GATES)
    expect(claims.some(c => c.includes('$450') || c.includes('$350'))).toBe(false)
  })
  it('confirmed with offer terms allows specific pricing', () => {
    const claims = getAllowedPublicClaimsForPractice('confirmed', ALL_GATES)
    expect(claims.some(c => c.includes('$'))).toBe(true)
  })
  it('requested allowed claims do not include join CTA or confirmed-provider language', () => {
    const claims = getAllowedPublicClaimsForPractice('requested', ALL_GATES)
    expect(claims.some(c => c.toLowerCase().includes('join'))).toBe(false)
    // "has not been confirmed" is correct honest copy — "DAP confirmed" is the forbidden phrase
    expect(claims.some(c => /dap confirmed|is confirmed to offer/i.test(c))).toBe(false)
  })
  it('not_confirmed forbidden claims include join and DAP available language', () => {
    const model = getDentistPageModel('not_confirmed', 'Test Practice', NO_GATES)
    expect(model?.forbiddenCopySamples.some(c => c.toLowerCase().includes('join'))).toBe(true)
  })
  it('confirmed page model forbidden copy includes request-flow language', () => {
    const model = getDentistPageModel('confirmed', 'Irene Olaes DDS', ALL_GATES)
    expect(model?.forbiddenCopySamples.some(c => c.toLowerCase().includes('request'))).toBe(true)
  })
})
