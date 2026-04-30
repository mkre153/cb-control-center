import type {
  DapPracticeSourceRecord,
  DapCitySourceRecord,
  DapDecisionSourceRecord,
  DapTreatmentSourceRecord,
  DapCmsSourceBundle,
} from './dapSourceTypes'
import type { ProviderStatus } from './types'

// ─── Validation result types ──────────────────────────────────────────────────

export type DapSourceValidationSeverity = 'error' | 'warning'

export type DapSourceValidationCollection =
  | 'practices'
  | 'cities'
  | 'decisions'
  | 'treatments'

export interface DapSourceValidationIssue {
  severity: DapSourceValidationSeverity
  code: string
  collection: DapSourceValidationCollection
  recordId: string
  field?: string
  message: string
}

export interface DapSourceValidationResult {
  valid: boolean   // true only when errors.length === 0
  errors: DapSourceValidationIssue[]
  warnings: DapSourceValidationIssue[]
}

// ─── Valid enum values ────────────────────────────────────────────────────────

const VALID_PROVIDER_STATUSES: ProviderStatus[] = [
  'confirmed_dap_provider',
  'not_confirmed',
  'recruitment_requested',
  'pending_confirmation',
  'declined',
]

// ─── Issue builder ────────────────────────────────────────────────────────────

function issue(
  severity: DapSourceValidationSeverity,
  code: string,
  collection: DapSourceValidationCollection,
  recordId: string,
  message: string,
  field?: string,
): DapSourceValidationIssue {
  return { severity, code, collection, recordId, message, ...(field ? { field } : {}) }
}

// ─── Practice validation ──────────────────────────────────────────────────────

export function validateDapPracticeSourceRecord(
  record: DapPracticeSourceRecord,
): DapSourceValidationIssue[] {
  const issues: DapSourceValidationIssue[] = []
  const id = record.id || '(empty-id)'

  // Required string fields
  if (!record.id?.trim()) {
    issues.push(issue('error', 'PRACTICE_EMPTY_ID', 'practices', id, 'id must be a non-empty string', 'id'))
  }
  if (!record.name?.trim()) {
    issues.push(issue('error', 'PRACTICE_EMPTY_NAME', 'practices', id, 'name must be a non-empty string', 'name'))
  }
  if (!record.city?.trim()) {
    issues.push(issue('error', 'PRACTICE_EMPTY_CITY', 'practices', id, 'city must be a non-empty string', 'city'))
  }
  if (!record.zip?.trim()) {
    issues.push(issue('error', 'PRACTICE_EMPTY_ZIP', 'practices', id, 'zip must be a non-empty string', 'zip'))
  }

  // Valid provider_status
  if (!VALID_PROVIDER_STATUSES.includes(record.provider_status)) {
    issues.push(issue('error', 'PRACTICE_INVALID_STATUS', 'practices', id,
      `provider_status "${record.provider_status}" is not a valid ProviderStatus`, 'provider_status'))
  }

  // Declined must not have a public slug
  if (record.provider_status === 'declined' && record.page_slug !== null) {
    issues.push(issue('error', 'PRACTICE_DECLINED_HAS_SLUG', 'practices', id,
      'declined practice must not have a page_slug — declined providers have no public route', 'page_slug'))
  }

  // Non-confirmed providers should not have offer_terms_validated=true
  if (record.provider_status !== 'confirmed_dap_provider' && record.offer_terms_validated) {
    issues.push(issue('warning', 'PRACTICE_NON_CONFIRMED_HAS_OFFER_TERMS', 'practices', id,
      `offer_terms_validated=true has no effect for provider_status "${record.provider_status}"`,
      'offer_terms_validated'))
  }

  // Non-confirmed providers should not have pricing data
  if (record.provider_status !== 'confirmed_dap_provider' &&
      (record.adult_annual_fee !== null || record.child_annual_fee !== null)) {
    issues.push(issue('warning', 'PRACTICE_NON_CONFIRMED_HAS_PRICING', 'practices', id,
      'pricing fee data is set for a non-confirmed practice — it will not be displayed',
      'adult_annual_fee'))
  }

  // CTA gate requires offer terms to be meaningful
  if (record.cta_gate_unlocked && !record.offer_terms_validated) {
    issues.push(issue('warning', 'PRACTICE_CTA_GATE_REQUIRES_OFFER_TERMS', 'practices', id,
      'cta_gate_unlocked=true has no effect unless offer_terms_validated is also true — Join CTA will not show',
      'cta_gate_unlocked'))
  }

  // Confirmed providers should have a page_slug so they generate a dentist detail page
  if (record.provider_status === 'confirmed_dap_provider' && !record.page_slug) {
    issues.push(issue('warning', 'PRACTICE_CONFIRMED_MISSING_SLUG', 'practices', id,
      'confirmed_dap_provider has no page_slug — no dentist detail page will be generated',
      'page_slug'))
  }

  // Confirmed providers offering pricing should have fee data
  if (record.offer_terms_validated &&
      (!record.adult_annual_fee || !record.child_annual_fee)) {
    issues.push(issue('warning', 'PRACTICE_OFFER_TERMS_MISSING_FEES', 'practices', id,
      'offer_terms_validated=true but fee data is missing — pricing display will fall back to null',
      'adult_annual_fee'))
  }

  return issues
}

// ─── City validation ──────────────────────────────────────────────────────────

export function validateDapCitySourceRecord(
  record: DapCitySourceRecord,
): DapSourceValidationIssue[] {
  const issues: DapSourceValidationIssue[] = []
  const id = record.slug || '(empty-slug)'

  if (!record.slug?.trim()) {
    issues.push(issue('error', 'CITY_EMPTY_SLUG', 'cities', id,
      'slug must be a non-empty string', 'slug'))
  }
  if (!record.city_name?.trim()) {
    issues.push(issue('error', 'CITY_EMPTY_CITY_NAME', 'cities', id,
      'city_name must be a non-empty string', 'city_name'))
  }
  if (!record.county_name?.trim()) {
    issues.push(issue('warning', 'CITY_EMPTY_COUNTY_NAME', 'cities', id,
      'county_name is empty — city record may render without county attribution', 'county_name'))
  }
  if (!record.state?.trim()) {
    issues.push(issue('warning', 'CITY_EMPTY_STATE', 'cities', id,
      'state is empty', 'state'))
  }

  return issues
}

// ─── Decision page validation ─────────────────────────────────────────────────

export function validateDapDecisionSourceRecord(
  record: DapDecisionSourceRecord,
): DapSourceValidationIssue[] {
  const issues: DapSourceValidationIssue[] = []
  const id = record.slug || '(empty-slug)'

  if (!record.slug?.trim()) {
    issues.push(issue('error', 'DECISION_EMPTY_SLUG', 'decisions', id,
      'slug must be a non-empty string', 'slug'))
  }
  if (!record.decision_question?.trim()) {
    issues.push(issue('error', 'DECISION_EMPTY_QUESTION', 'decisions', id,
      'decision_question must be non-empty — it is the patient-facing H1', 'decision_question'))
  }
  if (!record.safe_answer?.trim()) {
    issues.push(issue('error', 'DECISION_EMPTY_SAFE_ANSWER', 'decisions', id,
      'safe_answer must be non-empty — it is the patient-facing response', 'safe_answer'))
  }
  if (!record.seo_title?.trim()) {
    issues.push(issue('error', 'DECISION_EMPTY_SEO_TITLE', 'decisions', id,
      'seo_title must be non-empty', 'seo_title'))
  }
  if (!record.seo_description?.trim()) {
    issues.push(issue('error', 'DECISION_EMPTY_SEO_DESCRIPTION', 'decisions', id,
      'seo_description must be non-empty', 'seo_description'))
  }
  if (record.required_facts.length === 0) {
    issues.push(issue('warning', 'DECISION_NO_REQUIRED_FACTS', 'decisions', id,
      'required_facts is empty — every decision page should include at least one supporting fact',
      'required_facts'))
  }
  if (record.forbidden_claims.length === 0) {
    issues.push(issue('warning', 'DECISION_NO_FORBIDDEN_CLAIMS', 'decisions', id,
      'forbidden_claims is empty — every decision page should document at least one internal claim constraint',
      'forbidden_claims'))
  }
  // Secondary CTA must have both label and href, or neither
  if ((record.secondary_cta_label === null) !== (record.secondary_cta_href === null)) {
    issues.push(issue('error', 'DECISION_PARTIAL_SECONDARY_CTA', 'decisions', id,
      'secondary_cta_label and secondary_cta_href must both be set or both be null'))
  }

  return issues
}

// ─── Treatment page validation ────────────────────────────────────────────────

export function validateDapTreatmentSourceRecord(
  record: DapTreatmentSourceRecord,
): DapSourceValidationIssue[] {
  const issues: DapSourceValidationIssue[] = []
  const id = record.slug || '(empty-slug)'

  if (!record.slug?.trim()) {
    issues.push(issue('error', 'TREATMENT_EMPTY_SLUG', 'treatments', id,
      'slug must be a non-empty string', 'slug'))
  }
  if (!record.treatment?.trim()) {
    issues.push(issue('error', 'TREATMENT_EMPTY_TREATMENT', 'treatments', id,
      'treatment must be a non-empty string (e.g. "dental crown")', 'treatment'))
  }
  if (!record.treatment_question?.trim()) {
    issues.push(issue('error', 'TREATMENT_EMPTY_QUESTION', 'treatments', id,
      'treatment_question must be non-empty — it is the patient-facing H1', 'treatment_question'))
  }
  if (!record.safe_answer?.trim()) {
    issues.push(issue('error', 'TREATMENT_EMPTY_SAFE_ANSWER', 'treatments', id,
      'safe_answer must be non-empty — it is the patient-facing response', 'safe_answer'))
  }
  if (!record.seo_title?.trim()) {
    issues.push(issue('error', 'TREATMENT_EMPTY_SEO_TITLE', 'treatments', id,
      'seo_title must be non-empty', 'seo_title'))
  }
  if (!record.seo_description?.trim()) {
    issues.push(issue('error', 'TREATMENT_EMPTY_SEO_DESCRIPTION', 'treatments', id,
      'seo_description must be non-empty', 'seo_description'))
  }
  if (!record.primary_cta_href?.trim()) {
    issues.push(issue('error', 'TREATMENT_EMPTY_CTA_HREF', 'treatments', id,
      'primary_cta_href must be non-empty — all treatment pages must have a request CTA', 'primary_cta_href'))
  }
  if (!record.primary_cta_label?.trim()) {
    issues.push(issue('error', 'TREATMENT_EMPTY_CTA_LABEL', 'treatments', id,
      'primary_cta_label must be non-empty', 'primary_cta_label'))
  }
  if (record.required_facts.length === 0) {
    issues.push(issue('warning', 'TREATMENT_NO_REQUIRED_FACTS', 'treatments', id,
      'required_facts is empty — treatment pages should include at least one supporting fact',
      'required_facts'))
  }
  if (record.forbidden_claims.length === 0) {
    issues.push(issue('warning', 'TREATMENT_NO_FORBIDDEN_CLAIMS', 'treatments', id,
      'forbidden_claims is empty — treatment pages should document at least one internal claim constraint',
      'forbidden_claims'))
  }

  return issues
}

// ─── Bundle validation ────────────────────────────────────────────────────────
// Validates all records in a DapCmsSourceBundle and performs cross-collection checks.

export function validateDapCmsSourceBundle(
  bundle: DapCmsSourceBundle,
): DapSourceValidationResult {
  const allIssues: DapSourceValidationIssue[] = []

  // Validate each practice
  bundle.practices.forEach(p => allIssues.push(...validateDapPracticeSourceRecord(p)))

  // Validate each city
  bundle.cities.forEach(c => allIssues.push(...validateDapCitySourceRecord(c)))

  // Validate each decision page
  bundle.decisionPages.forEach(d => allIssues.push(...validateDapDecisionSourceRecord(d)))

  // Validate each treatment page
  bundle.treatmentPages.forEach(t => allIssues.push(...validateDapTreatmentSourceRecord(t)))

  // Cross-collection: decision/treatment related_city_slugs must reference known cities
  const knownCitySlugs = new Set(bundle.cities.map(c => c.slug))

  bundle.decisionPages
    .filter(d => d.published)
    .forEach(d => {
      d.related_city_slugs.forEach(slug => {
        if (!knownCitySlugs.has(slug)) {
          allIssues.push(issue('warning', 'DECISION_UNKNOWN_CITY_SLUG', 'decisions', d.slug,
            `related_city_slug "${slug}" does not reference a known city record`,
            'related_city_slugs'))
        }
      })
    })

  bundle.treatmentPages
    .filter(t => t.published)
    .forEach(t => {
      t.related_city_slugs.forEach(slug => {
        if (!knownCitySlugs.has(slug)) {
          allIssues.push(issue('warning', 'TREATMENT_UNKNOWN_CITY_SLUG', 'treatments', t.slug,
            `related_city_slug "${slug}" does not reference a known city record`,
            'related_city_slugs'))
        }
      })
    })

  // Cross-collection: decision related_practice_slugs must not reference declined practices
  const declinedSlugs = new Set(
    bundle.practices
      .filter(p => p.provider_status === 'declined')
      .map(p => p.page_slug)
      .filter((s): s is string => s !== null),
  )

  bundle.decisionPages
    .filter(d => d.published)
    .forEach(d => {
      d.related_practice_slugs.forEach(slug => {
        if (declinedSlugs.has(slug)) {
          allIssues.push(issue('error', 'DECISION_DECLINED_PRACTICE_SLUG', 'decisions', d.slug,
            `related_practice_slug "${slug}" references a declined practice — declined practices are never public`,
            'related_practice_slugs'))
        }
      })
    })

  const errors   = allIssues.filter(i => i.severity === 'error')
  const warnings = allIssues.filter(i => i.severity === 'warning')

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}
