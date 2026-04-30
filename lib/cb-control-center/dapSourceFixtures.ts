import { REQUEST_FLOW_ROUTE } from './dapDisplayRules'
import type {
  DapPracticeSourceRecord,
  DapCitySourceRecord,
  DapDecisionSourceRecord,
  DapTreatmentSourceRecord,
  DapCmsSourceBundle,
} from './dapSourceTypes'

// ─── Practice fixtures ────────────────────────────────────────────────────────

export const FIXTURE_CONFIRMED_PRACTICE: DapPracticeSourceRecord = {
  id:                    'fixture-confirmed-001',
  name:                  'Fixture Dental Partners',
  city:                  'Fixture City',
  county:                'San Diego County',
  state:                 'CA',
  zip:                   '92001',
  provider_status:       'confirmed_dap_provider',
  page_slug:             'fixture-dental-partners',
  offer_terms_validated: true,
  cta_gate_unlocked:     true,
  adult_annual_fee:      '$450/yr',
  child_annual_fee:      '$350/yr',
  offer_source:          'Fixture brochure — confirmed 2026-04-29',
  published:             true,
  forbidden_claims:      ['"Join plan" when offer terms are not yet validated'],
}

export const FIXTURE_NON_CONFIRMED_PRACTICE: DapPracticeSourceRecord = {
  id:                    'fixture-non-confirmed-001',
  name:                  'Fixture Family Dental',
  city:                  'Fixture City',
  county:                'San Diego County',
  state:                 'CA',
  zip:                   '92002',
  provider_status:       'not_confirmed',
  page_slug:             'fixture-family-dental',
  offer_terms_validated: false,
  cta_gate_unlocked:     false,
  adult_annual_fee:      null,
  child_annual_fee:      null,
  offer_source:          null,
  published:             true,
  forbidden_claims:      [],
}

export const FIXTURE_REQUESTED_PRACTICE: DapPracticeSourceRecord = {
  id:                    'fixture-requested-001',
  name:                  'Fixture Requested Dental',
  city:                  'Fixture City',
  county:                'San Diego County',
  state:                 'CA',
  zip:                   '92003',
  provider_status:       'recruitment_requested',
  page_slug:             'fixture-requested-dental',
  offer_terms_validated: false,
  cta_gate_unlocked:     false,
  adult_annual_fee:      null,
  child_annual_fee:      null,
  offer_source:          null,
  published:             true,
  forbidden_claims:      [],
}

// Declined — published=true (real DB record) but provider_status blocks all public output
export const FIXTURE_DECLINED_PRACTICE: DapPracticeSourceRecord = {
  id:                    'fixture-declined-001',
  name:                  'Fixture Declined Dental',
  city:                  'Fixture City',
  county:                'San Diego County',
  state:                 'CA',
  zip:                   '92004',
  provider_status:       'declined',
  page_slug:             null,
  offer_terms_validated: false,
  cta_gate_unlocked:     false,
  adult_annual_fee:      null,
  child_annual_fee:      null,
  offer_source:          null,
  published:             true,
  forbidden_claims:      [],
}

// Draft — published=false means the adapter skips it entirely
export const FIXTURE_DRAFT_PRACTICE: DapPracticeSourceRecord = {
  id:                    'fixture-draft-001',
  name:                  'Fixture Draft Dental',
  city:                  'Fixture City',
  county:                'San Diego County',
  state:                 'CA',
  zip:                   '92005',
  provider_status:       'not_confirmed',
  page_slug:             'fixture-draft-dental',
  offer_terms_validated: false,
  cta_gate_unlocked:     false,
  adult_annual_fee:      null,
  child_annual_fee:      null,
  offer_source:          null,
  published:             false,
  forbidden_claims:      [],
}

// Confirmed with gates partially open — offer terms validated but CTA gate locked
export const FIXTURE_CONFIRMED_NO_CTA: DapPracticeSourceRecord = {
  ...FIXTURE_CONFIRMED_PRACTICE,
  id:                'fixture-confirmed-no-cta',
  name:              'Fixture Dental Partners No CTA',
  page_slug:         'fixture-dental-partners-no-cta',
  cta_gate_unlocked: false,  // pricing visible but Join CTA suppressed
}

// Confirmed with no gates open at all — testing complete lockdown path
export const FIXTURE_CONFIRMED_ALL_GATES_CLOSED: DapPracticeSourceRecord = {
  ...FIXTURE_CONFIRMED_PRACTICE,
  id:                    'fixture-confirmed-locked',
  name:                  'Fixture Dental Partners Locked',
  page_slug:             'fixture-dental-partners-locked',
  offer_terms_validated: false,
  cta_gate_unlocked:     false,
}

// ─── City fixtures ────────────────────────────────────────────────────────────

export const FIXTURE_CITY_WITH_CONFIRMED: DapCitySourceRecord = {
  slug:         'fixture-city-confirmed',
  city_name:    'Fixture City',  // practices above are in 'Fixture City'
  county_name:  'San Diego County',
  state:        'CA',
  published:    true,
}

export const FIXTURE_CITY_NO_PROVIDER: DapCitySourceRecord = {
  slug:         'fixture-city-empty',
  city_name:    'Fixture Empty City',  // no practices in this city
  county_name:  'San Diego County',
  state:        'CA',
  published:    true,
}

export const FIXTURE_CITY_DRAFT: DapCitySourceRecord = {
  slug:         'fixture-city-draft',
  city_name:    'Fixture Draft City',
  county_name:  'San Diego County',
  state:        'CA',
  published:    false,  // draft — should be excluded from snapshot
}

// ─── Decision page fixtures ───────────────────────────────────────────────────

export const FIXTURE_DECISION_PAGE: DapDecisionSourceRecord = {
  slug:                   'fixture-decision-safe',
  query_intent:           'patient looking for dental options without insurance',
  decision_question:      'How do I find a dentist without insurance in Fixture City?',
  audience:               'Adults without dental insurance',
  safe_answer:            'Search the DAP directory for participating dentists, or submit a request if no confirmed provider is available near you.',
  primary_cta_logic:      'Route to request flow.',
  required_facts:         ['DAP is a free patient directory.'],
  forbidden_claims:       ['"DAP is dental insurance" — DAP is a directory, not an insurer'],
  seo_title:              'Find a Dentist Without Insurance in Fixture City — DAP',
  seo_description:        'Find dentists in Fixture City that offer in-house membership plans, or request one through Dental Advantage Plan.',
  secondary_cta_label:    null,
  secondary_cta_href:     null,
  related_city_slugs:     ['fixture-city-confirmed'],
  related_practice_slugs: [],
  public_claim_level:     'none',
  published:              true,
}

export const FIXTURE_DRAFT_DECISION_PAGE: DapDecisionSourceRecord = {
  ...FIXTURE_DECISION_PAGE,
  slug:      'fixture-decision-draft',
  published: false,
}

// Unsafe decision page — triggers QA warnings (used to verify QA catches bad data)
export const FIXTURE_UNSAFE_DECISION_PAGE: DapDecisionSourceRecord = {
  slug:                   'fixture-unsafe-decision',
  query_intent:           'test unsafe claim detection',
  decision_question:      'Is DAP available at every dentist?',
  audience:               'Test',
  safe_answer:            'Every dentist accepts DAP in your area.',  // triggers: "every dentist"
  primary_cta_logic:      'Route to request flow.',
  required_facts:         ['Test fact.'],
  forbidden_claims:       [],
  seo_title:              'DAP at Every Dentist — Dental Advantage Plan',  // triggers: "every dentist"
  seo_description:        'Join now at any dentist near you.',
  secondary_cta_label:    null,
  secondary_cta_href:     null,
  related_city_slugs:     [],
  related_practice_slugs: [],
  public_claim_level:     'full',
  published:              true,
}

// ─── Treatment page fixtures ──────────────────────────────────────────────────

export const FIXTURE_TREATMENT_PAGE: DapTreatmentSourceRecord = {
  slug:               'fixture-crown-without-insurance',
  treatment:          'dental crown',
  treatment_question: 'How do I pay for a dental crown without insurance in Fixture City?',
  audience:           'Adults without insurance who need a crown',
  safe_answer:        'In-house dental membership plans at participating practices may offer discounts. Submit a request through DAP if no confirmed provider is near you.',
  required_facts:     ['Crown cost discounts vary by practice and plan terms.'],
  forbidden_claims:   ['"DAP covers dental crowns" — DAP is a directory, not a payer'],
  seo_title:          'Dental Crown Without Insurance in Fixture City — DAP',
  seo_description:    'Find out how to pay for a dental crown without insurance in Fixture City through Dental Advantage Plan.',
  primary_cta_label:  'Find a DAP dentist near you',
  primary_cta_href:   REQUEST_FLOW_ROUTE,
  related_city_slugs: ['fixture-city-confirmed'],
  public_claim_level: 'limited',
  published:          true,
}

export const FIXTURE_DRAFT_TREATMENT_PAGE: DapTreatmentSourceRecord = {
  ...FIXTURE_TREATMENT_PAGE,
  slug:      'fixture-treatment-draft',
  published: false,
}

// ─── Bundled fixtures ─────────────────────────────────────────────────────────

// Full safe bundle: includes declined + draft records to prove they are excluded
export const SAFE_FIXTURE_BUNDLE: DapCmsSourceBundle = {
  practices: [
    FIXTURE_CONFIRMED_PRACTICE,
    FIXTURE_NON_CONFIRMED_PRACTICE,
    FIXTURE_REQUESTED_PRACTICE,
    FIXTURE_DECLINED_PRACTICE,   // published=true, declined → excluded from public practices/dentistPages
    FIXTURE_DRAFT_PRACTICE,      // published=false → excluded entirely
  ],
  cities: [
    FIXTURE_CITY_WITH_CONFIRMED,
    FIXTURE_CITY_NO_PROVIDER,
    FIXTURE_CITY_DRAFT,          // published=false → excluded
  ],
  decisionPages: [
    FIXTURE_DECISION_PAGE,
    FIXTURE_DRAFT_DECISION_PAGE, // published=false → excluded
  ],
  treatmentPages: [
    FIXTURE_TREATMENT_PAGE,
    FIXTURE_DRAFT_TREATMENT_PAGE, // published=false → excluded
  ],
}
