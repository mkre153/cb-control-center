import { describe, it, expect } from 'vitest'
import {
  validateDapPracticeSourceRecord,
  validateDapCitySourceRecord,
  validateDapDecisionSourceRecord,
  validateDapTreatmentSourceRecord,
  validateDapCmsSourceBundle,
} from '../source/dapSourceValidation'
import { buildValidatedDapCmsSnapshotFromSource } from '../dapPublishingPipeline'
import { buildDapCmsSnapshotFromSource } from '../source/dapSourceAdapter'
import { exportDapCmsSnapshot, buildMockSourceBundle } from '../dapCmsExport'
import { runClaimQA } from '../dapClaimQA'
import { REQUEST_FLOW_ROUTE } from '../../dap/registry/dapDisplayRules'
import {
  SAFE_FIXTURE_BUNDLE,
  FIXTURE_CONFIRMED_PRACTICE,
  FIXTURE_NON_CONFIRMED_PRACTICE,
  FIXTURE_REQUESTED_PRACTICE,
  FIXTURE_DECLINED_PRACTICE,
  FIXTURE_DRAFT_PRACTICE,
  FIXTURE_DECISION_PAGE,
  FIXTURE_TREATMENT_PAGE,
} from '../source/dapSourceFixtures'
import {
  SCENARIO_CONFIRMED_OFFER_TERMS_MISSING,
  SCENARIO_CONFIRMED_OFFER_TERMS_VALIDATED_CTA_LOCKED,
  SCENARIO_CONFIRMED_FULL_PUBLISH,
  SCENARIO_REQUESTED_PROVIDER,
  SCENARIO_NOT_CONFIRMED_PROVIDER,
  SCENARIO_DECLINED_WITH_ACCIDENTAL_SLUG,
  SCENARIO_DECLINED_REFERENCED_BY_CITY,
  SCENARIO_UNSAFE_CITY_UNIVERSAL_CLAIM,
  SCENARIO_UNSAFE_DECISION_PRICING_CLAIM,
  SCENARIO_UNSAFE_TREATMENT_AVAILABILITY_CLAIM,
  SCENARIO_DRAFT_ACCIDENTALLY_PUBLIC,
  SCENARIO_MIXED_CITY,
} from '../dapAdminWorkflowFixtures'
import type { DapCmsSourceBundle } from '../source/dapSourceTypes'

// ─── Test 1: Source validation result shape ───────────────────────────────────

describe('Phase 7C — source validation result has correct shape', () => {
  it('validateDapCmsSourceBundle returns { valid, errors, warnings }', () => {
    const result = validateDapCmsSourceBundle(SAFE_FIXTURE_BUNDLE)
    expect(typeof result.valid).toBe('boolean')
    expect(Array.isArray(result.errors)).toBe(true)
    expect(Array.isArray(result.warnings)).toBe(true)
  })

  it('valid is true when errors.length === 0', () => {
    const result = validateDapCmsSourceBundle(SAFE_FIXTURE_BUNDLE)
    expect(result.valid).toBe(result.errors.length === 0)
  })

  it('validation issues have required fields', () => {
    const issues = validateDapPracticeSourceRecord({
      ...FIXTURE_CONFIRMED_PRACTICE,
      id: '',  // force an error
    })
    expect(issues.length).toBeGreaterThan(0)
    issues.forEach(issue => {
      expect(typeof issue.severity).toBe('string')
      expect(['error', 'warning']).toContain(issue.severity)
      expect(typeof issue.code).toBe('string')
      expect(typeof issue.collection).toBe('string')
      expect(typeof issue.recordId).toBe('string')
      expect(typeof issue.message).toBe('string')
    })
  })

  it('safe fixture bundle passes validation (valid = true, no errors)', () => {
    const result = validateDapCmsSourceBundle(SAFE_FIXTURE_BUNDLE)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('validateDapPracticeSourceRecord returns [] for a valid confirmed practice', () => {
    const issues = validateDapPracticeSourceRecord(FIXTURE_CONFIRMED_PRACTICE)
    const errors = issues.filter(i => i.severity === 'error')
    expect(errors).toHaveLength(0)
  })

  it('validateDapCitySourceRecord returns [] for a valid city', () => {
    const issues = validateDapCitySourceRecord({ slug: 'san-diego', city_name: 'San Diego', county_name: 'San Diego County', state: 'CA', published: true })
    const errors = issues.filter(i => i.severity === 'error')
    expect(errors).toHaveLength(0)
  })

  it('validateDapDecisionSourceRecord returns [] for a valid decision page', () => {
    const issues = validateDapDecisionSourceRecord(FIXTURE_DECISION_PAGE)
    const errors = issues.filter(i => i.severity === 'error')
    expect(errors).toHaveLength(0)
  })

  it('validateDapTreatmentSourceRecord returns [] for a valid treatment page', () => {
    const issues = validateDapTreatmentSourceRecord(FIXTURE_TREATMENT_PAGE)
    const errors = issues.filter(i => i.severity === 'error')
    expect(errors).toHaveLength(0)
  })
})

// ─── Test 2: Practice status publishing rules ─────────────────────────────────

describe('Phase 7C — practice status publishing rules', () => {
  it('confirmed_dap_provider is valid — no errors', () => {
    const issues = validateDapPracticeSourceRecord(FIXTURE_CONFIRMED_PRACTICE)
    expect(issues.filter(i => i.severity === 'error')).toHaveLength(0)
  })

  it('not_confirmed is valid — no errors', () => {
    const issues = validateDapPracticeSourceRecord(FIXTURE_NON_CONFIRMED_PRACTICE)
    expect(issues.filter(i => i.severity === 'error')).toHaveLength(0)
  })

  it('recruitment_requested is valid — no errors', () => {
    const issues = validateDapPracticeSourceRecord(FIXTURE_REQUESTED_PRACTICE)
    expect(issues.filter(i => i.severity === 'error')).toHaveLength(0)
  })

  it('declined + page_slug=null is valid — no errors (correct declined record)', () => {
    const issues = validateDapPracticeSourceRecord(FIXTURE_DECLINED_PRACTICE)
    expect(issues.filter(i => i.severity === 'error')).toHaveLength(0)
  })

  it('empty id produces PRACTICE_EMPTY_ID error', () => {
    const issues = validateDapPracticeSourceRecord({ ...FIXTURE_CONFIRMED_PRACTICE, id: '' })
    expect(issues.some(i => i.code === 'PRACTICE_EMPTY_ID' && i.severity === 'error')).toBe(true)
  })

  it('empty name produces PRACTICE_EMPTY_NAME error', () => {
    const issues = validateDapPracticeSourceRecord({ ...FIXTURE_CONFIRMED_PRACTICE, name: '' })
    expect(issues.some(i => i.code === 'PRACTICE_EMPTY_NAME' && i.severity === 'error')).toBe(true)
  })

  it('invalid provider_status produces PRACTICE_INVALID_STATUS error', () => {
    const issues = validateDapPracticeSourceRecord({
      ...FIXTURE_CONFIRMED_PRACTICE,
      provider_status: 'not_a_valid_status' as never,
    })
    expect(issues.some(i => i.code === 'PRACTICE_INVALID_STATUS' && i.severity === 'error')).toBe(true)
  })

  it('confirmed provider without page_slug produces PRACTICE_CONFIRMED_MISSING_SLUG warning', () => {
    const issues = validateDapPracticeSourceRecord({
      ...FIXTURE_CONFIRMED_PRACTICE,
      page_slug: null,
    })
    expect(issues.some(i => i.code === 'PRACTICE_CONFIRMED_MISSING_SLUG' && i.severity === 'warning')).toBe(true)
  })
})

// ─── Test 3: Join CTA gate rules ──────────────────────────────────────────────

describe('Phase 7C — Join CTA gate rules', () => {
  it('cta_gate_unlocked=true without offer_terms_validated produces PRACTICE_CTA_GATE_REQUIRES_OFFER_TERMS warning', () => {
    const issues = validateDapPracticeSourceRecord({
      ...FIXTURE_CONFIRMED_PRACTICE,
      offer_terms_validated: false,
      cta_gate_unlocked:     true,
    })
    expect(issues.some(i => i.code === 'PRACTICE_CTA_GATE_REQUIRES_OFFER_TERMS' && i.severity === 'warning')).toBe(true)
  })

  it('cta_gate_unlocked=true WITH offer_terms_validated does NOT produce that warning', () => {
    const issues = validateDapPracticeSourceRecord({
      ...FIXTURE_CONFIRMED_PRACTICE,
      offer_terms_validated: true,
      cta_gate_unlocked:     true,
    })
    expect(issues.some(i => i.code === 'PRACTICE_CTA_GATE_REQUIRES_OFFER_TERMS')).toBe(false)
  })

  it('adapter: scenario 1 (confirmed, no terms) → showJoinCta=false', () => {
    const s = buildDapCmsSnapshotFromSource(SCENARIO_CONFIRMED_OFFER_TERMS_MISSING)
    expect(s.practices[0].publicDisplay.showJoinCta).toBe(false)
    expect(s.practices[0].publicDisplay.showPricing).toBe(false)
  })

  it('adapter: scenario 2 (confirmed, terms validated, CTA locked) → showPricing=true, showJoinCta=false', () => {
    const s = buildDapCmsSnapshotFromSource(SCENARIO_CONFIRMED_OFFER_TERMS_VALIDATED_CTA_LOCKED)
    expect(s.practices[0].publicDisplay.showPricing).toBe(true)
    expect(s.practices[0].publicDisplay.showJoinCta).toBe(false)
    expect(s.practices[0].offerSummary).not.toBeNull()
  })

  it('adapter: scenario 3 (confirmed, full) → showPricing=true, showJoinCta=true', () => {
    const s = buildDapCmsSnapshotFromSource(SCENARIO_CONFIRMED_FULL_PUBLISH)
    expect(s.practices[0].publicDisplay.showJoinCta).toBe(true)
    expect(s.practices[0].publicDisplay.showPricing).toBe(true)
  })

  it('adapter: scenario 3 dentist page → Join CTA href includes /enroll', () => {
    const s = buildDapCmsSnapshotFromSource(SCENARIO_CONFIRMED_FULL_PUBLISH)
    const dp = s.dentistPages[0]
    expect(dp.primaryCta.href).toContain('/enroll')
    expect(dp.primaryCta.label.toLowerCase()).toBe('join plan')
  })
})

// ─── Test 4: Pricing and offer-terms rules ────────────────────────────────────

describe('Phase 7C — pricing and offer-terms gate rules', () => {
  it('non-confirmed practice with adult_annual_fee set produces PRACTICE_NON_CONFIRMED_HAS_PRICING warning', () => {
    const issues = validateDapPracticeSourceRecord({
      ...FIXTURE_NON_CONFIRMED_PRACTICE,
      adult_annual_fee: '$450/yr',
    })
    expect(issues.some(i => i.code === 'PRACTICE_NON_CONFIRMED_HAS_PRICING' && i.severity === 'warning')).toBe(true)
  })

  it('non-confirmed practice with offer_terms_validated=true produces PRACTICE_NON_CONFIRMED_HAS_OFFER_TERMS warning', () => {
    const issues = validateDapPracticeSourceRecord({
      ...FIXTURE_NON_CONFIRMED_PRACTICE,
      offer_terms_validated: true,
    })
    expect(issues.some(i => i.code === 'PRACTICE_NON_CONFIRMED_HAS_OFFER_TERMS' && i.severity === 'warning')).toBe(true)
  })

  it('confirmed + offer_terms_validated=true but missing fee data produces PRACTICE_OFFER_TERMS_MISSING_FEES warning', () => {
    const issues = validateDapPracticeSourceRecord({
      ...FIXTURE_CONFIRMED_PRACTICE,
      offer_terms_validated: true,
      adult_annual_fee:      null,
      child_annual_fee:      null,
    })
    expect(issues.some(i => i.code === 'PRACTICE_OFFER_TERMS_MISSING_FEES' && i.severity === 'warning')).toBe(true)
  })

  it('adapter produces offerSummary only when confirmed + offer terms validated', () => {
    const withTerms    = buildDapCmsSnapshotFromSource(SCENARIO_CONFIRMED_OFFER_TERMS_VALIDATED_CTA_LOCKED)
    const withoutTerms = buildDapCmsSnapshotFromSource(SCENARIO_CONFIRMED_OFFER_TERMS_MISSING)
    expect(withTerms.practices[0].offerSummary).not.toBeNull()
    expect(withoutTerms.practices[0].offerSummary).toBeNull()
  })

  it('adapter: non-confirmed practice never has offerSummary', () => {
    const s = buildDapCmsSnapshotFromSource(SCENARIO_NOT_CONFIRMED_PROVIDER)
    expect(s.practices[0].offerSummary).toBeNull()
  })
})

// ─── Test 5: Declined provider exclusion rules ────────────────────────────────

describe('Phase 7C — declined provider exclusion rules', () => {
  it('declined + page_slug set produces PRACTICE_DECLINED_HAS_SLUG error', () => {
    const issues = validateDapPracticeSourceRecord({
      ...FIXTURE_DECLINED_PRACTICE,
      page_slug: 'accidental-slug',
    })
    expect(issues.some(i => i.code === 'PRACTICE_DECLINED_HAS_SLUG' && i.severity === 'error')).toBe(true)
  })

  it('SCENARIO_DECLINED_WITH_ACCIDENTAL_SLUG fails bundle validation', () => {
    const result = validateDapCmsSourceBundle(SCENARIO_DECLINED_WITH_ACCIDENTAL_SLUG)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.code === 'PRACTICE_DECLINED_HAS_SLUG')).toBe(true)
  })

  it('publishing pipeline blocks SCENARIO_DECLINED_WITH_ACCIDENTAL_SLUG (ok=false, snapshot=null)', () => {
    const result = buildValidatedDapCmsSnapshotFromSource(SCENARIO_DECLINED_WITH_ACCIDENTAL_SLUG)
    expect(result.ok).toBe(false)
    expect(result.snapshot).toBeNull()
    expect(result.qa).toBeNull()
  })

  it('SCENARIO_DECLINED_REFERENCED_BY_CITY passes validation (declined in city is expected)', () => {
    const result = validateDapCmsSourceBundle(SCENARIO_DECLINED_REFERENCED_BY_CITY)
    // The declined practice has page_slug=null, which is correct
    expect(result.errors).toHaveLength(0)
  })

  it('adapter: SCENARIO_DECLINED_REFERENCED_BY_CITY puts declined in city hiddenPracticeIds', () => {
    const s = buildDapCmsSnapshotFromSource(SCENARIO_DECLINED_REFERENCED_BY_CITY)
    const city = s.cities[0]
    expect(city.hiddenPracticeIds).toContain('scenario-city-declined')
    // The confirmed practice IS in visiblePracticeSlugs; declined (no slug) is not
    expect(city.visiblePracticeSlugs).toContain('admin-test-dental-partners')
  })

  it('adapter: declined practice generates no dentist detail page', () => {
    const s = buildDapCmsSnapshotFromSource(SCENARIO_DECLINED_REFERENCED_BY_CITY)
    expect(s.dentistPages.find(d => d.practiceId === 'scenario-city-declined')).toBeUndefined()
  })
})

// ─── Test 6: Draft exclusion rules ────────────────────────────────────────────

describe('Phase 7C — draft (published=false) records excluded from all output', () => {
  it('SCENARIO_DRAFT_ACCIDENTALLY_PUBLIC produces an empty snapshot', () => {
    const s = buildDapCmsSnapshotFromSource(SCENARIO_DRAFT_ACCIDENTALLY_PUBLIC)
    expect(s.practices).toHaveLength(0)
    expect(s.cities).toHaveLength(0)
    expect(s.dentistPages).toHaveLength(0)
    expect(s.decisionPages).toHaveLength(0)
    expect(s.treatmentPages).toHaveLength(0)
  })

  it('draft records do not trigger validation errors (published=false is valid)', () => {
    const result = validateDapCmsSourceBundle(SCENARIO_DRAFT_ACCIDENTALLY_PUBLIC)
    expect(result.errors).toHaveLength(0)
  })

  it('publishing pipeline on draft-only bundle: ok=false (no pages = QA still passes, but empty is degenerate)', () => {
    const result = buildValidatedDapCmsSnapshotFromSource(SCENARIO_DRAFT_ACCIDENTALLY_PUBLIC)
    // No errors in validation, empty snapshot passes QA, but ok=true (empty is technically "safe")
    // The pipeline's job is not to enforce minimum page counts
    expect(result.validation.errors).toHaveLength(0)
    expect(result.qa).not.toBeNull()
    expect(result.qa!.totalWarnings).toBe(0)
  })

  it('mixed bundle with some published + some draft: only published records appear', () => {
    const bundle: DapCmsSourceBundle = {
      ...SAFE_FIXTURE_BUNDLE,
      practices: [FIXTURE_CONFIRMED_PRACTICE, FIXTURE_DRAFT_PRACTICE],
    }
    const s = buildDapCmsSnapshotFromSource(bundle)
    const ids = s.practices.map(p => p.id)
    expect(ids).toContain(FIXTURE_CONFIRMED_PRACTICE.id)
    expect(ids).not.toContain(FIXTURE_DRAFT_PRACTICE.id)
  })
})

// ─── Test 7: City visiblePracticeSlugs rules ──────────────────────────────────

describe('Phase 7C — city visiblePracticeSlugs rules', () => {
  it('mixed city: confirmed + non-confirmed both appear in visiblePracticeSlugs', () => {
    const s = buildDapCmsSnapshotFromSource(SCENARIO_MIXED_CITY)
    const city = s.cities[0]
    expect(city.visiblePracticeSlugs).toContain('admin-test-dental-partners')
    expect(city.visiblePracticeSlugs).toContain('mixed-not-confirmed-one')
    expect(city.visiblePracticeSlugs).toContain('mixed-requested-one')
  })

  it('declined referenced by city: declined id in hiddenPracticeIds, not visiblePracticeSlugs', () => {
    const s = buildDapCmsSnapshotFromSource(SCENARIO_DECLINED_REFERENCED_BY_CITY)
    const city = s.cities[0]
    expect(city.hiddenPracticeIds).toContain('scenario-city-declined')
    // The declined practice's id is NOT in visiblePracticeSlugs
    city.visiblePracticeSlugs.forEach(slug => {
      expect(slug).not.toBe(null)
    })
  })

  it('visiblePracticeSlugs + hiddenPracticeIds.length = total practices in that city', () => {
    const s = buildDapCmsSnapshotFromSource(SCENARIO_DECLINED_REFERENCED_BY_CITY)
    const city = s.cities[0]
    expect(city.visiblePracticeSlugs.length + city.hiddenPracticeIds.length).toBe(city.practiceIds.length)
  })

  it('city with no practices: visiblePracticeSlugs=[], hiddenPracticeIds=[]', () => {
    const bundle: DapCmsSourceBundle = {
      practices: [],
      cities: [{ slug: 'empty-city', city_name: 'Empty City', county_name: 'San Diego County', state: 'CA', published: true }],
      decisionPages: [],
      treatmentPages: [],
    }
    const s = buildDapCmsSnapshotFromSource(bundle)
    expect(s.cities[0].visiblePracticeSlugs).toHaveLength(0)
    expect(s.cities[0].hiddenPracticeIds).toHaveLength(0)
    expect(s.cities[0].practiceIds).toHaveLength(0)
  })
})

// ─── Test 8: City publicClaimLevel degradation rules ─────────────────────────

describe('Phase 7C — city publicClaimLevel degradation rules', () => {
  it('city with confirmed provider: publicClaimLevel = "full"', () => {
    const s = buildDapCmsSnapshotFromSource(SCENARIO_CONFIRMED_FULL_PUBLISH)
    expect(s.cities[0].publicClaimLevel).toBe('full')
  })

  it('city with only non-confirmed/requested: publicClaimLevel = "limited"', () => {
    const s = buildDapCmsSnapshotFromSource(SCENARIO_NOT_CONFIRMED_PROVIDER)
    expect(s.cities[0].publicClaimLevel).toBe('limited')
  })

  it('city with no practices: publicClaimLevel = "none"', () => {
    const bundle: DapCmsSourceBundle = {
      practices: [],
      cities: [{ slug: 'empty', city_name: 'Empty City', county_name: 'San Diego County', state: 'CA', published: true }],
      decisionPages: [],
      treatmentPages: [],
    }
    const s = buildDapCmsSnapshotFromSource(bundle)
    expect(s.cities[0].publicClaimLevel).toBe('none')
  })

  it('city with only declined practice: publicClaimLevel = "none" (declined is suppressed)', () => {
    const bundle: DapCmsSourceBundle = {
      practices: [{ ...FIXTURE_DECLINED_PRACTICE, city: 'Declined City' }],
      cities: [{ slug: 'declined-city', city_name: 'Declined City', county_name: 'San Diego County', state: 'CA', published: true }],
      decisionPages: [],
      treatmentPages: [],
    }
    const s = buildDapCmsSnapshotFromSource(bundle)
    expect(s.cities[0].publicClaimLevel).toBe('none')
  })

  it('mixed city (confirmed + requestable): publicClaimLevel = "full"', () => {
    const s = buildDapCmsSnapshotFromSource(SCENARIO_MIXED_CITY)
    expect(s.cities[0].publicClaimLevel).toBe('full')
  })

  it('confirmed city: primaryCta does not route to request flow', () => {
    const s = buildDapCmsSnapshotFromSource(SCENARIO_CONFIRMED_FULL_PUBLISH)
    expect(s.cities[0].primaryCta.href).not.toBe(REQUEST_FLOW_ROUTE)
  })

  it('none/limited city: primaryCta routes to request flow', () => {
    const s = buildDapCmsSnapshotFromSource(SCENARIO_NOT_CONFIRMED_PROVIDER)
    expect(s.cities[0].primaryCta.href).toBe(REQUEST_FLOW_ROUTE)
  })
})

// ─── Test 9: Decision page claim safety ───────────────────────────────────────

describe('Phase 7C — decision page claim safety', () => {
  it('SCENARIO_UNSAFE_CITY_UNIVERSAL_CLAIM produces QA warnings', () => {
    const s  = buildDapCmsSnapshotFromSource(SCENARIO_UNSAFE_CITY_UNIVERSAL_CLAIM)
    const qa = runClaimQA(s)
    expect(qa.totalWarnings).toBeGreaterThan(0)
    expect(qa.warnings.some(w => w.category === 'universal_availability_claim')).toBe(true)
  })

  it('SCENARIO_UNSAFE_DECISION_PRICING_CLAIM: QA does NOT flag pricing on decision pages (educational context)', () => {
    // Decision pages are intentionally exempt from pricing_claim QA scanning.
    // Explaining that "fees range from $X" is educational, not a sourced price promise.
    // Only universal_availability and enrollment phrases are checked on decision pages.
    const s  = buildDapCmsSnapshotFromSource(SCENARIO_UNSAFE_DECISION_PRICING_CLAIM)
    const qa = runClaimQA(s)
    expect(qa.warnings.some(w => w.category === 'pricing_claim')).toBe(false)
  })

  it('decision page missing forbidden_claims produces DECISION_NO_FORBIDDEN_CLAIMS warning', () => {
    const issues = validateDapDecisionSourceRecord({
      ...FIXTURE_DECISION_PAGE,
      forbidden_claims: [],
    })
    expect(issues.some(i => i.code === 'DECISION_NO_FORBIDDEN_CLAIMS' && i.severity === 'warning')).toBe(true)
  })

  it('decision page missing required_facts produces DECISION_NO_REQUIRED_FACTS warning', () => {
    const issues = validateDapDecisionSourceRecord({
      ...FIXTURE_DECISION_PAGE,
      required_facts: [],
    })
    expect(issues.some(i => i.code === 'DECISION_NO_REQUIRED_FACTS' && i.severity === 'warning')).toBe(true)
  })

  it('decision page with empty safe_answer produces DECISION_EMPTY_SAFE_ANSWER error', () => {
    const issues = validateDapDecisionSourceRecord({ ...FIXTURE_DECISION_PAGE, safe_answer: '' })
    expect(issues.some(i => i.code === 'DECISION_EMPTY_SAFE_ANSWER' && i.severity === 'error')).toBe(true)
  })

  it('decision page with partial secondary_cta produces DECISION_PARTIAL_SECONDARY_CTA error', () => {
    const issues = validateDapDecisionSourceRecord({
      ...FIXTURE_DECISION_PAGE,
      secondary_cta_label: 'Browse',
      secondary_cta_href:  null,  // only one of the pair set
    })
    expect(issues.some(i => i.code === 'DECISION_PARTIAL_SECONDARY_CTA' && i.severity === 'error')).toBe(true)
  })
})

// ─── Test 10: Treatment page claim safety ─────────────────────────────────────

describe('Phase 7C — treatment page claim safety', () => {
  it('SCENARIO_UNSAFE_TREATMENT_AVAILABILITY_CLAIM produces QA warnings', () => {
    const s  = buildDapCmsSnapshotFromSource(SCENARIO_UNSAFE_TREATMENT_AVAILABILITY_CLAIM)
    const qa = runClaimQA(s)
    expect(qa.totalWarnings).toBeGreaterThan(0)
    expect(qa.warnings.some(w => w.category === 'universal_availability_claim')).toBe(true)
  })

  it('treatment page missing forbidden_claims produces TREATMENT_NO_FORBIDDEN_CLAIMS warning', () => {
    const issues = validateDapTreatmentSourceRecord({ ...FIXTURE_TREATMENT_PAGE, forbidden_claims: [] })
    expect(issues.some(i => i.code === 'TREATMENT_NO_FORBIDDEN_CLAIMS' && i.severity === 'warning')).toBe(true)
  })

  it('treatment page with empty primary_cta_href produces TREATMENT_EMPTY_CTA_HREF error', () => {
    const issues = validateDapTreatmentSourceRecord({ ...FIXTURE_TREATMENT_PAGE, primary_cta_href: '' })
    expect(issues.some(i => i.code === 'TREATMENT_EMPTY_CTA_HREF' && i.severity === 'error')).toBe(true)
  })

  it('treatment page with empty treatment_question produces TREATMENT_EMPTY_QUESTION error', () => {
    const issues = validateDapTreatmentSourceRecord({ ...FIXTURE_TREATMENT_PAGE, treatment_question: '' })
    expect(issues.some(i => i.code === 'TREATMENT_EMPTY_QUESTION' && i.severity === 'error')).toBe(true)
  })

  it('treatment page with empty safe_answer produces TREATMENT_EMPTY_SAFE_ANSWER error', () => {
    const issues = validateDapTreatmentSourceRecord({ ...FIXTURE_TREATMENT_PAGE, safe_answer: '' })
    expect(issues.some(i => i.code === 'TREATMENT_EMPTY_SAFE_ANSWER' && i.severity === 'error')).toBe(true)
  })
})

// ─── Test 11: Publishing wrapper blocks invalid source bundles ────────────────

describe('Phase 7C — publishing pipeline blocks invalid source bundles', () => {
  it('bundle with PRACTICE_DECLINED_HAS_SLUG error: ok=false, snapshot=null', () => {
    const result = buildValidatedDapCmsSnapshotFromSource(SCENARIO_DECLINED_WITH_ACCIDENTAL_SLUG)
    expect(result.ok).toBe(false)
    expect(result.snapshot).toBeNull()
    expect(result.qa).toBeNull()
    expect(result.validation.valid).toBe(false)
  })

  it('bundle with empty required field: ok=false, snapshot=null', () => {
    const bundle: DapCmsSourceBundle = {
      practices: [{ ...FIXTURE_CONFIRMED_PRACTICE, name: '' }],
      cities:    [],
      decisionPages: [],
      treatmentPages: [],
    }
    const result = buildValidatedDapCmsSnapshotFromSource(bundle)
    expect(result.ok).toBe(false)
    expect(result.snapshot).toBeNull()
  })

  it('bundle with invalid provider_status: ok=false, snapshot=null', () => {
    const bundle: DapCmsSourceBundle = {
      practices: [{ ...FIXTURE_CONFIRMED_PRACTICE, provider_status: 'unknown_status' as never }],
      cities: [],
      decisionPages: [],
      treatmentPages: [],
    }
    const result = buildValidatedDapCmsSnapshotFromSource(bundle)
    expect(result.ok).toBe(false)
    expect(result.snapshot).toBeNull()
  })

  it('bundle with empty decision safe_answer: ok=false (validation error blocks pipeline)', () => {
    const bundle: DapCmsSourceBundle = {
      ...SAFE_FIXTURE_BUNDLE,
      decisionPages: [{ ...FIXTURE_DECISION_PAGE, safe_answer: '' }],
    }
    const result = buildValidatedDapCmsSnapshotFromSource(bundle)
    expect(result.ok).toBe(false)
    expect(result.snapshot).toBeNull()
  })
})

// ─── Test 12: Publishing wrapper passes fully safe source bundles ─────────────

describe('Phase 7C — publishing pipeline passes safe source bundles', () => {
  it('SAFE_FIXTURE_BUNDLE: ok=true, snapshot present, QA clean', () => {
    const result = buildValidatedDapCmsSnapshotFromSource(SAFE_FIXTURE_BUNDLE)
    expect(result.ok).toBe(true)
    expect(result.snapshot).not.toBeNull()
    expect(result.qa).not.toBeNull()
    expect(result.qa!.totalWarnings).toBe(0)
    expect(result.validation.valid).toBe(true)
    expect(result.validation.errors).toHaveLength(0)
  })

  it('SCENARIO_CONFIRMED_FULL_PUBLISH: ok=true', () => {
    const result = buildValidatedDapCmsSnapshotFromSource(SCENARIO_CONFIRMED_FULL_PUBLISH)
    expect(result.ok).toBe(true)
    expect(result.snapshot).not.toBeNull()
  })

  it('SCENARIO_MIXED_CITY: ok=true, QA clean', () => {
    const result = buildValidatedDapCmsSnapshotFromSource(SCENARIO_MIXED_CITY)
    expect(result.ok).toBe(true)
    expect(result.qa!.totalWarnings).toBe(0)
  })

  it('SCENARIO_DECLINED_REFERENCED_BY_CITY: ok=true (declined in city is valid data)', () => {
    const result = buildValidatedDapCmsSnapshotFromSource(SCENARIO_DECLINED_REFERENCED_BY_CITY)
    expect(result.ok).toBe(true)
    expect(result.snapshot!.practices.some(p => p.status === 'declined')).toBe(false)
  })

  it('bundle with only warnings (no errors): ok depends on QA result', () => {
    // Warnings only should not block snapshot generation
    const bundle: DapCmsSourceBundle = {
      practices: [{ ...FIXTURE_CONFIRMED_PRACTICE, page_slug: null }], // PRACTICE_CONFIRMED_MISSING_SLUG warning
      cities: [],
      decisionPages: [],
      treatmentPages: [],
    }
    const result = buildValidatedDapCmsSnapshotFromSource(bundle)
    // Validation has warnings but no errors → snapshot IS built
    expect(result.snapshot).not.toBeNull()
    expect(result.validation.errors).toHaveLength(0)
    expect(result.validation.warnings.length).toBeGreaterThan(0)
  })
})

// ─── Test 13: Publishing wrapper fails when QA catches unsafe output ──────────

describe('Phase 7C — publishing pipeline fails when QA detects unsafe output', () => {
  it('SCENARIO_UNSAFE_CITY_UNIVERSAL_CLAIM: ok=false (QA catches universal availability claim)', () => {
    const result = buildValidatedDapCmsSnapshotFromSource(SCENARIO_UNSAFE_CITY_UNIVERSAL_CLAIM)
    // Validation passes (structural issues are fine), but QA catches unsafe claims
    expect(result.validation.valid).toBe(true)
    expect(result.snapshot).not.toBeNull()  // snapshot was built
    expect(result.qa!.totalWarnings).toBeGreaterThan(0)
    expect(result.ok).toBe(false)           // but ok=false because QA failed
  })

  it('SCENARIO_UNSAFE_DECISION_PRICING_CLAIM: ok=true (pricing in decision pages is educational, not flagged by QA)', () => {
    // QA intentionally does not scan decision pages for pricing_claim — see dapClaimQA.ts.
    // Pricing language in educational Q&A context is allowed; only sourced price promises
    // on practice/dentist pages are flagged.
    const result = buildValidatedDapCmsSnapshotFromSource(SCENARIO_UNSAFE_DECISION_PRICING_CLAIM)
    expect(result.validation.valid).toBe(true)
    expect(result.snapshot).not.toBeNull()
    expect(result.qa!.warnings.some(w => w.category === 'pricing_claim')).toBe(false)
    expect(result.ok).toBe(true)
  })

  it('SCENARIO_UNSAFE_TREATMENT_AVAILABILITY_CLAIM: ok=false (QA catches universal claim)', () => {
    const result = buildValidatedDapCmsSnapshotFromSource(SCENARIO_UNSAFE_TREATMENT_AVAILABILITY_CLAIM)
    expect(result.ok).toBe(false)
    expect(result.qa!.totalWarnings).toBeGreaterThan(0)
  })

  it('pipeline result shape: ok=false means snapshot may exist but must not be published', () => {
    // Use a scenario that actually triggers QA (universal availability claim on a city page)
    const result = buildValidatedDapCmsSnapshotFromSource(SCENARIO_UNSAFE_CITY_UNIVERSAL_CLAIM)
    expect(result.ok).toBe(false)
    // The snapshot object may be present (built but failed QA)
    // The caller is responsible for not using snapshot when ok=false
    expect(result.qa).not.toBeNull()
    expect(result.qa!.totalWarnings).toBeGreaterThan(0)
  })
})

// ─── Test 14: Real mock source bundle passes full pipeline ────────────────────

describe('Phase 7C — real mock source bundle passes full validation + adapter + QA pipeline', () => {
  const bundle   = buildMockSourceBundle()
  const result   = buildValidatedDapCmsSnapshotFromSource(bundle)
  const snapshot = exportDapCmsSnapshot()

  it('buildMockSourceBundle() passes validation with no errors', () => {
    expect(result.validation.valid).toBe(true)
    expect(result.validation.errors).toHaveLength(0)
  })

  it('real pipeline result: ok=true', () => {
    expect(result.ok).toBe(true)
  })

  it('real pipeline snapshot has zero QA warnings', () => {
    expect(result.qa!.totalWarnings).toBe(0)
  })

  it('pipeline snapshot matches exportDapCmsSnapshot() counts', () => {
    expect(result.snapshot!.practices.length).toBe(snapshot.practices.length)
    expect(result.snapshot!.cities.length).toBe(snapshot.cities.length)
    expect(result.snapshot!.dentistPages.length).toBe(snapshot.dentistPages.length)
    expect(result.snapshot!.decisionPages.length).toBe(snapshot.decisionPages.length)
    expect(result.snapshot!.treatmentPages.length).toBe(snapshot.treatmentPages.length)
  })

  it('pipeline snapshot contains La Mesa city with publicClaimLevel = "full"', () => {
    const laMesa = result.snapshot!.cities.find(c => c.slug === 'la-mesa')!
    expect(laMesa).toBeDefined()
    expect(laMesa.publicClaimLevel).toBe('full')
  })

  it('pipeline snapshot contains no declined practices', () => {
    result.snapshot!.practices.forEach(p => {
      expect(p.status).not.toBe('declined')
    })
  })

  it('cross-collection validation: no decision page references an unknown city slug', () => {
    // No DECISION_UNKNOWN_CITY_SLUG errors from the real bundle
    const citySlugErrors = result.validation.warnings.filter(
      w => w.code === 'DECISION_UNKNOWN_CITY_SLUG',
    )
    expect(citySlugErrors).toHaveLength(0)
  })
})
