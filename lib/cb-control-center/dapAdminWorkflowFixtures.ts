import { REQUEST_FLOW_ROUTE } from './dapDisplayRules'
import type {
  DapPracticeSourceRecord,
  DapCitySourceRecord,
  DapDecisionSourceRecord,
  DapTreatmentSourceRecord,
  DapCmsSourceBundle,
} from './dapSourceTypes'

// ─── Base records (reused across scenarios) ───────────────────────────────────

const BASE_CONFIRMED: DapPracticeSourceRecord = {
  id:                    'admin-confirmed-001',
  name:                  'Admin Test Dental Partners',
  city:                  'Admin City',
  county:                'San Diego County',
  state:                 'CA',
  zip:                   '92101',
  provider_status:       'confirmed_dap_provider',
  page_slug:             'admin-test-dental-partners',
  offer_terms_validated: false,
  cta_gate_unlocked:     false,
  adult_annual_fee:      null,
  child_annual_fee:      null,
  offer_source:          null,
  published:             true,
  forbidden_claims:      [],
}

const BASE_CITY: DapCitySourceRecord = {
  slug:         'admin-city',
  city_name:    'Admin City',
  county_name:  'San Diego County',
  state:        'CA',
  published:    true,
}

const BASE_DECISION: DapDecisionSourceRecord = {
  slug:                   'admin-decision-safe',
  query_intent:           'patient seeking dental options',
  decision_question:      'How do I find a dentist without insurance in Admin City?',
  audience:               'Adults without dental insurance',
  safe_answer:            'Search the DAP directory for participating dentists or request one near you.',
  primary_cta_logic:      'Route to request flow.',
  required_facts:         ['DAP is a free patient directory.'],
  forbidden_claims:       ['"DAP is dental insurance" — DAP is a directory, not an insurer'],
  seo_title:              'Find a Dentist Without Insurance in Admin City — DAP',
  seo_description:        'Find dentists in Admin City with in-house membership plans through Dental Advantage Plan.',
  secondary_cta_label:    null,
  secondary_cta_href:     null,
  related_city_slugs:     ['admin-city'],
  related_practice_slugs: [],
  public_claim_level:     'none',
  published:              true,
}

const BASE_TREATMENT: DapTreatmentSourceRecord = {
  slug:               'admin-crown-without-insurance',
  treatment:          'dental crown',
  treatment_question: 'How do I pay for a dental crown without insurance?',
  audience:           'Adults without insurance needing a crown',
  safe_answer:        'In-house dental membership plans may offer discounts. Submit a request through DAP if no confirmed provider is near you.',
  required_facts:     ['Crown discounts vary by practice.'],
  forbidden_claims:   ['"DAP covers crowns" — DAP is a directory, not a payer'],
  seo_title:          'Dental Crown Without Insurance — Admin City — DAP',
  seo_description:    'Find out how to pay for a dental crown without insurance through Dental Advantage Plan.',
  primary_cta_label:  'Find a DAP dentist near you',
  primary_cta_href:   REQUEST_FLOW_ROUTE,
  related_city_slugs: ['admin-city'],
  public_claim_level: 'limited',
  published:          true,
}

// ─── Scenario 1: Confirmed provider — offer terms missing ─────────────────────
// Gate state: confirmed, but offer_terms_validated=false
// Expected: practice is public, but no pricing and no Join CTA

export const SCENARIO_CONFIRMED_OFFER_TERMS_MISSING: DapCmsSourceBundle = {
  practices: [{
    ...BASE_CONFIRMED,
    id:                    'scenario-confirmed-no-terms',
    offer_terms_validated: false,
    cta_gate_unlocked:     false,
    adult_annual_fee:      null,
    child_annual_fee:      null,
  }],
  cities:        [BASE_CITY],
  decisionPages: [BASE_DECISION],
  treatmentPages:[BASE_TREATMENT],
}

// ─── Scenario 2: Confirmed — offer terms validated, CTA gate locked ───────────
// Gate state: confirmed + terms validated, but cta_gate_unlocked=false
// Expected: pricing shown, but Join CTA suppressed

export const SCENARIO_CONFIRMED_OFFER_TERMS_VALIDATED_CTA_LOCKED: DapCmsSourceBundle = {
  practices: [{
    ...BASE_CONFIRMED,
    id:                    'scenario-confirmed-terms-no-cta',
    offer_terms_validated: true,
    cta_gate_unlocked:     false,
    adult_annual_fee:      '$450/yr',
    child_annual_fee:      '$350/yr',
    offer_source:          'Confirmed from practice brochure',
  }],
  cities:        [BASE_CITY],
  decisionPages: [BASE_DECISION],
  treatmentPages:[BASE_TREATMENT],
}

// ─── Scenario 3: Confirmed — full publish eligible ────────────────────────────
// Gate state: all three gates open
// Expected: pricing shown, Join CTA enabled

export const SCENARIO_CONFIRMED_FULL_PUBLISH: DapCmsSourceBundle = {
  practices: [{
    ...BASE_CONFIRMED,
    id:                    'scenario-confirmed-full',
    offer_terms_validated: true,
    cta_gate_unlocked:     true,
    adult_annual_fee:      '$450/yr',
    child_annual_fee:      '$350/yr',
    offer_source:          'Confirmed from practice brochure',
  }],
  cities:        [BASE_CITY],
  decisionPages: [BASE_DECISION],
  treatmentPages:[BASE_TREATMENT],
}

// ─── Scenario 4: Requested provider ──────────────────────────────────────────
// provider_status = recruitment_requested
// Expected: public page, request-flow CTA, no pricing

export const SCENARIO_REQUESTED_PROVIDER: DapCmsSourceBundle = {
  practices: [{
    ...BASE_CONFIRMED,
    id:              'scenario-requested-001',
    name:            'Admin Requested Dental',
    page_slug:       'admin-requested-dental',
    provider_status: 'recruitment_requested',
    offer_terms_validated: false,
    cta_gate_unlocked: false,
    adult_annual_fee: null,
    child_annual_fee: null,
    offer_source: null,
  }],
  cities:        [BASE_CITY],
  decisionPages: [BASE_DECISION],
  treatmentPages:[BASE_TREATMENT],
}

// ─── Scenario 5: Not confirmed provider ──────────────────────────────────────
// provider_status = not_confirmed
// Expected: public page, request-flow CTA, no pricing

export const SCENARIO_NOT_CONFIRMED_PROVIDER: DapCmsSourceBundle = {
  practices: [{
    ...BASE_CONFIRMED,
    id:              'scenario-not-confirmed-001',
    name:            'Admin Not Confirmed Dental',
    page_slug:       'admin-not-confirmed-dental',
    provider_status: 'not_confirmed',
    offer_terms_validated: false,
    cta_gate_unlocked: false,
    adult_annual_fee: null,
    child_annual_fee: null,
    offer_source: null,
  }],
  cities:        [BASE_CITY],
  decisionPages: [BASE_DECISION],
  treatmentPages:[BASE_TREATMENT],
}

// ─── Scenario 6: Declined with accidental public slug (validation error) ──────
// provider_status = declined but page_slug IS set
// Expected: validation ERROR — PRACTICE_DECLINED_HAS_SLUG

export const SCENARIO_DECLINED_WITH_ACCIDENTAL_SLUG: DapCmsSourceBundle = {
  practices: [{
    ...BASE_CONFIRMED,
    id:              'scenario-declined-slug',
    name:            'Admin Declined Dental',
    provider_status: 'declined',
    page_slug:       'admin-declined-dental',  // ERROR: declined + slug
    offer_terms_validated: false,
    cta_gate_unlocked: false,
  }],
  cities:        [BASE_CITY],
  decisionPages: [BASE_DECISION],
  treatmentPages:[BASE_TREATMENT],
}

// ─── Scenario 7: Declined referenced by city ─────────────────────────────────
// Declined practice in the same city — adapter should put it in hiddenPracticeIds
// This should pass validation (declined practices in cities is expected)

export const SCENARIO_DECLINED_REFERENCED_BY_CITY: DapCmsSourceBundle = {
  practices: [
    {
      ...BASE_CONFIRMED,
      id:              'scenario-city-confirmed',
      offer_terms_validated: true,
      cta_gate_unlocked: true,
      adult_annual_fee: '$450/yr',
      child_annual_fee: '$350/yr',
      offer_source: 'Confirmed',
    },
    {
      ...BASE_CONFIRMED,
      id:              'scenario-city-declined',
      name:            'Admin Hidden Declined Dental',
      provider_status: 'declined',
      page_slug:       null,   // correctly null for declined
      offer_terms_validated: false,
      cta_gate_unlocked: false,
      adult_annual_fee: null,
      child_annual_fee: null,
      offer_source: null,
    },
  ],
  cities:        [BASE_CITY],
  decisionPages: [BASE_DECISION],
  treatmentPages:[BASE_TREATMENT],
}

// ─── Scenario 8: Unsafe city universal claim (QA catch) ──────────────────────
// City-level content with unsafe heading — should produce QA warnings
// Note: city headings come from getCityHeading() in the adapter, not from source.
// This scenario tests unsafe content in a decision page that mimics a city-wide claim.

export const SCENARIO_UNSAFE_CITY_UNIVERSAL_CLAIM: DapCmsSourceBundle = {
  practices: [],
  cities: [BASE_CITY],
  decisionPages: [{
    ...BASE_DECISION,
    slug:        'unsafe-city-claim',
    safe_answer: 'Every dentist in Admin City accepts DAP.',  // triggers universal_availability_claim
    seo_title:   'All Dentists in Admin City Offer DAP',      // triggers universal_availability_claim
  }],
  treatmentPages: [BASE_TREATMENT],
}

// ─── Scenario 9: Unsafe decision pricing claim (QA catch) ────────────────────
// Decision page claims a specific price without sourced validation

export const SCENARIO_UNSAFE_DECISION_PRICING_CLAIM: DapCmsSourceBundle = {
  practices: [],
  cities: [BASE_CITY],
  decisionPages: [{
    ...BASE_DECISION,
    slug:            'unsafe-decision-pricing',
    safe_answer:     'The annual fee is $450/yr at most DAP dentists.',  // triggers pricing_claim
    seo_description: 'Membership costs $450/yr at participating dentists.',
  }],
  treatmentPages: [BASE_TREATMENT],
}

// ─── Scenario 10: Unsafe treatment availability claim (QA catch) ─────────────

export const SCENARIO_UNSAFE_TREATMENT_AVAILABILITY_CLAIM: DapCmsSourceBundle = {
  practices: [],
  cities: [BASE_CITY],
  decisionPages: [],
  treatmentPages: [{
    ...BASE_TREATMENT,
    slug:        'unsafe-treatment-claim',
    safe_answer: 'Any dentist who offers DAP will discount this procedure.',  // triggers "any dentist"
  }],
}

// ─── Scenario 11: Draft record accidentally public ────────────────────────────
// published=false — should be excluded entirely from snapshot

export const SCENARIO_DRAFT_ACCIDENTALLY_PUBLIC: DapCmsSourceBundle = {
  practices: [{
    ...BASE_CONFIRMED,
    id:        'scenario-draft-practice',
    published: false,  // draft — must be excluded
  }],
  cities: [{
    ...BASE_CITY,
    slug:      'scenario-draft-city',
    published: false,  // draft city — must be excluded
  }],
  decisionPages: [{
    ...BASE_DECISION,
    slug:      'scenario-draft-decision',
    published: false,  // draft decision — must be excluded
  }],
  treatmentPages: [{
    ...BASE_TREATMENT,
    slug:      'scenario-draft-treatment',
    published: false,  // draft treatment — must be excluded
  }],
}

// ─── Scenario 12: Mixed city — confirmed + requestable providers ──────────────
// City with one confirmed provider and two requestable providers
// Expected: publicClaimLevel = "full", primaryCta routes to confirmed provider

export const SCENARIO_MIXED_CITY: DapCmsSourceBundle = {
  practices: [
    {
      ...BASE_CONFIRMED,
      id:                    'mixed-confirmed-001',
      offer_terms_validated: true,
      cta_gate_unlocked:     true,
      adult_annual_fee:      '$450/yr',
      child_annual_fee:      '$350/yr',
      offer_source:          'Confirmed',
    },
    {
      ...BASE_CONFIRMED,
      id:              'mixed-not-confirmed-001',
      name:            'Mixed Not Confirmed One',
      page_slug:       'mixed-not-confirmed-one',
      provider_status: 'not_confirmed',
      offer_terms_validated: false,
      cta_gate_unlocked: false,
      adult_annual_fee: null,
      child_annual_fee: null,
      offer_source: null,
    },
    {
      ...BASE_CONFIRMED,
      id:              'mixed-requested-001',
      name:            'Mixed Requested One',
      page_slug:       'mixed-requested-one',
      provider_status: 'recruitment_requested',
      offer_terms_validated: false,
      cta_gate_unlocked: false,
      adult_annual_fee: null,
      child_annual_fee: null,
      offer_source: null,
    },
  ],
  cities:        [BASE_CITY],
  decisionPages: [BASE_DECISION],
  treatmentPages:[BASE_TREATMENT],
}
