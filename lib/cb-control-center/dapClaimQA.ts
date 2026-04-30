import { FORBIDDEN_CITY_CLAIMS } from './dapDisplayRules'
import type {
  DapCmsSnapshot,
  DapPracticeCmsRecord,
  DapCityCmsRecord,
  DapDentistPageCmsRecord,
  DapDecisionPageCmsRecord,
  DapTreatmentPageCmsRecord,
} from './dapCmsTypes'

// ─── Types ────────────────────────────────────────────────────────────────────

export type QAWarningCategory =
  | 'confirmed_provider_claim'
  | 'pricing_claim'
  | 'enrollment_claim'
  | 'universal_availability_claim'

export interface QAWarning {
  recordType: 'practice' | 'city' | 'dentist_page' | 'decision_page'
  recordId: string
  category: QAWarningCategory
  field: string
  phrase: string
  detail: string
}

export interface QASummary {
  // Record counts
  totalPractices: number
  confirmedProviders: number
  nonConfirmedPractices: number
  practicesWithPricing: number
  practicesWithJoinCta: number
  totalCities: number
  totalDentistPages: number
  confirmedDentistPages: number
  nonConfirmedDentistPages: number
  totalDecisionPages: number
  totalTreatmentPages: number
  // Forbidden-claim tracking (internal metadata, not rendered)
  practicesWithForbiddenClaims: number
  dentistPagesWithForbiddenClaims: number
  decisionPagesWithForbiddenClaims: number
  treatmentPagesWithForbiddenClaims: number
  // QA results
  totalWarnings: number
  warningsByCategory: Record<QAWarningCategory, number>
  warnings: QAWarning[]
}

// ─── Phrase lists ─────────────────────────────────────────────────────────────
// Each list is intentionally specific to avoid false positives on educational text.
// "enroll" alone is intentionally excluded — it appears legitimately in decision-page
// informational content. "DAP provider" is excluded — it is a substring of the safe
// phrase "confirmed DAP providers" used on city subheadings.

const CONFIRMED_PROVIDER_PHRASES = [
  'confirmed provider',
  'participating dentist',
  'offers dap',
  'accepted here',
] as const

const PRICING_PHRASES = [
  '$',
  '/yr',
  'plan cost',
  'membership cost',
  'annual fee',
] as const

const ENROLLMENT_PHRASES = [
  'join plan',
  'start membership',
  'become a member',
  'enroll now',
  'sign up now',
] as const

const UNIVERSAL_AVAILABILITY_PHRASES = [
  'any dentist',
  'all dentists',
  'every dentist',
  'accepted everywhere',
  'available across',
] as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

function containsPhrase(text: string, phrase: string): boolean {
  return text.toLowerCase().includes(phrase.toLowerCase())
}

function firstMatch(text: string, phrases: readonly string[]): string | null {
  for (const phrase of phrases) {
    if (containsPhrase(text, phrase)) return phrase
  }
  return null
}

function flagIfFound(
  text: string | null | undefined,
  field: string,
  phrases: readonly string[],
  recordType: QAWarning['recordType'],
  recordId: string,
  category: QAWarningCategory,
  detail: string,
  warnings: QAWarning[],
): void {
  if (!text) return
  const found = firstMatch(text, phrases)
  if (found) warnings.push({ recordType, recordId, category, field, phrase: found, detail })
}

// ─── Per-collection scanners ──────────────────────────────────────────────────

function scanPractice(record: DapPracticeCmsRecord, warnings: QAWarning[]): void {
  const id = record.slug ?? record.id

  // Structural: offerSummary must be null when showPricing is false
  if (!record.publicDisplay.showPricing && record.offerSummary !== null) {
    warnings.push({
      recordType: 'practice', recordId: id,
      category: 'pricing_claim', field: 'offerSummary', phrase: 'offerSummary non-null',
      detail: 'offerSummary is present but showPricing is false — pricing data must not be exposed.',
    })
  }

  // Structural: showJoinCta must not be true for non-confirmed practices
  if (record.publicDisplay.showJoinCta && record.status !== 'confirmed_dap_provider') {
    warnings.push({
      recordType: 'practice', recordId: id,
      category: 'enrollment_claim', field: 'publicDisplay.showJoinCta', phrase: 'showJoinCta true',
      detail: 'showJoinCta is true but provider is not confirmed_dap_provider.',
    })
  }

  // Text: ctaLabel must not contain enrollment language when showJoinCta is false
  if (!record.publicDisplay.showJoinCta) {
    flagIfFound(
      record.publicDisplay.ctaLabel, 'publicDisplay.ctaLabel', ENROLLMENT_PHRASES,
      'practice', id, 'enrollment_claim',
      `CTA label contains enrollment language but showJoinCta is false.`,
      warnings,
    )
  }
}

function scanCity(record: DapCityCmsRecord, warnings: QAWarning[]): void {
  const id = record.slug
  const fields = [
    { field: 'heading',        text: record.heading },
    { field: 'subheading',     text: record.subheading },
    { field: 'seoTitle',       text: record.seoTitle },
    { field: 'seoDescription', text: record.seoDescription },
  ]

  for (const { field, text } of fields) {
    // Forbidden city claims (already covers the key confirmed-provider + availability assertions)
    const forbiddenMatch = firstMatch(text, FORBIDDEN_CITY_CLAIMS)
    if (forbiddenMatch) {
      warnings.push({
        recordType: 'city', recordId: id,
        category: 'universal_availability_claim', field, phrase: forbiddenMatch,
        detail: `City page contains a phrase from FORBIDDEN_CITY_CLAIMS: "${forbiddenMatch}".`,
      })
    }

    flagIfFound(text, field, UNIVERSAL_AVAILABILITY_PHRASES,
      'city', id, 'universal_availability_claim',
      'City page must not imply DAP is universally available to all listed dentists.', warnings)

    flagIfFound(text, field, PRICING_PHRASES,
      'city', id, 'pricing_claim',
      'City pages must not make pricing claims.', warnings)

    flagIfFound(text, field, ENROLLMENT_PHRASES,
      'city', id, 'enrollment_claim',
      'City pages must not contain enrollment language.', warnings)
  }
}

function scanDentistPage(record: DapDentistPageCmsRecord, warnings: QAWarning[]): void {
  const id = record.slug
  const isConfirmed = record.publicState === 'confirmed_provider'

  // Structural: offerSummary must be null for non-confirmed pages
  if (!isConfirmed && record.offerSummary !== null) {
    warnings.push({
      recordType: 'dentist_page', recordId: id,
      category: 'pricing_claim', field: 'offerSummary', phrase: 'offerSummary non-null',
      detail: 'Non-confirmed dentist page has offerSummary — pricing must not be exposed for unconfirmed practices.',
    })
  }

  // Structural: non-confirmed pages must not have a Join CTA
  if (!isConfirmed) {
    const ctaLabel = record.primaryCta.label.toLowerCase()
    const found = firstMatch(ctaLabel, ENROLLMENT_PHRASES)
    if (found) {
      warnings.push({
        recordType: 'dentist_page', recordId: id,
        category: 'enrollment_claim', field: 'primaryCta.label', phrase: record.primaryCta.label,
        detail: 'Non-confirmed dentist page CTA contains enrollment language.',
      })
    }
  }

  // Text: non-confirmed pages must not use confirmed-provider language
  if (!isConfirmed) {
    const textFields = [
      { field: 'heading',      text: record.heading },
      { field: 'badgeLabel',   text: record.badgeLabel },
      { field: 'bodySections', text: record.bodySections.join(' ') },
    ]
    for (const { field, text } of textFields) {
      flagIfFound(text, field, CONFIRMED_PROVIDER_PHRASES,
        'dentist_page', id, 'confirmed_provider_claim',
        'Non-confirmed dentist page must not use confirmed-provider language.', warnings)

      flagIfFound(text, field, PRICING_PHRASES,
        'dentist_page', id, 'pricing_claim',
        'Non-confirmed dentist page must not make pricing claims.', warnings)
    }
  }
}

function scanDecisionPage(record: DapDecisionPageCmsRecord, warnings: QAWarning[]): void {
  const id = record.slug
  const patientFacingFields = [
    { field: 'decisionQuestion', text: record.decisionQuestion },
    { field: 'safeAnswer',       text: record.safeAnswer },
    { field: 'seoTitle',         text: record.seoTitle },
    { field: 'seoDescription',   text: record.seoDescription },
  ]

  for (const { field, text } of patientFacingFields) {
    flagIfFound(text, field, UNIVERSAL_AVAILABILITY_PHRASES,
      'decision_page', id, 'universal_availability_claim',
      'Decision page must not imply DAP is universally available at all dentists.', warnings)

    flagIfFound(text, field, ENROLLMENT_PHRASES,
      'decision_page', id, 'enrollment_claim',
      'Decision page informational content must not contain enrollment CTA language.', warnings)
  }

  // forbiddenClaims must not leak into any patient-facing field
  function extractCoreClaim(claim: string): string {
    return claim.replace(/"/g, '').split(' — ')[0].trim().toLowerCase()
  }

  record.forbiddenClaims.forEach(claim => {
    const core = extractCoreClaim(claim)
    if (core.length <= 4) return
    for (const { field, text } of patientFacingFields) {
      if (containsPhrase(text, core)) {
        warnings.push({
          recordType: 'decision_page', recordId: id,
          category: 'confirmed_provider_claim', field, phrase: core,
          detail: `forbiddenClaim core phrase "${core}" found in patient-facing field "${field}".`,
        })
      }
    }
  })
}

function scanTreatmentPage(record: DapTreatmentPageCmsRecord, warnings: QAWarning[]): void {
  const id = record.slug
  const patientFacingFields = [
    { field: 'treatmentQuestion', text: record.treatmentQuestion },
    { field: 'safeAnswer',        text: record.safeAnswer },
    { field: 'seoTitle',          text: record.seoTitle },
    { field: 'seoDescription',    text: record.seoDescription },
  ]

  for (const { field, text } of patientFacingFields) {
    flagIfFound(text, field, UNIVERSAL_AVAILABILITY_PHRASES,
      'decision_page', id, 'universal_availability_claim',
      'Treatment page must not imply DAP is universally available at all dentists.', warnings)

    flagIfFound(text, field, ENROLLMENT_PHRASES,
      'decision_page', id, 'enrollment_claim',
      'Treatment page informational content must not contain enrollment CTA language.', warnings)

    flagIfFound(text, field, PRICING_PHRASES,
      'decision_page', id, 'pricing_claim',
      'Treatment page must not include specific pricing claims.', warnings)
  }

  // forbiddenClaims must not leak into any patient-facing field
  function extractCoreClaim(claim: string): string {
    return claim.replace(/"/g, '').split(' — ')[0].trim().toLowerCase()
  }

  record.forbiddenClaims.forEach(claim => {
    const core = extractCoreClaim(claim)
    if (core.length <= 4) return
    for (const { field, text } of patientFacingFields) {
      if (containsPhrase(text, core)) {
        warnings.push({
          recordType: 'decision_page', recordId: id,
          category: 'confirmed_provider_claim', field, phrase: core,
          detail: `forbiddenClaim core phrase "${core}" found in patient-facing field "${field}".`,
        })
      }
    }
  })
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function runClaimQA(snapshot: DapCmsSnapshot): QASummary {
  const warnings: QAWarning[] = []

  snapshot.practices.forEach(r => scanPractice(r, warnings))
  snapshot.cities.forEach(r => scanCity(r, warnings))
  snapshot.dentistPages.forEach(r => scanDentistPage(r, warnings))
  snapshot.decisionPages.forEach(r => scanDecisionPage(r, warnings))
  snapshot.treatmentPages.forEach(r => scanTreatmentPage(r, warnings))

  const warningsByCategory: Record<QAWarningCategory, number> = {
    confirmed_provider_claim:      0,
    pricing_claim:                 0,
    enrollment_claim:              0,
    universal_availability_claim:  0,
  }
  warnings.forEach(w => { warningsByCategory[w.category]++ })

  return {
    totalPractices:            snapshot.practices.length,
    confirmedProviders:        snapshot.practices.filter(p => p.status === 'confirmed_dap_provider').length,
    nonConfirmedPractices:     snapshot.practices.filter(p => p.status !== 'confirmed_dap_provider').length,
    practicesWithPricing:      snapshot.practices.filter(p => p.publicDisplay.showPricing).length,
    practicesWithJoinCta:      snapshot.practices.filter(p => p.publicDisplay.showJoinCta).length,
    totalCities:               snapshot.cities.length,
    totalDentistPages:         snapshot.dentistPages.length,
    confirmedDentistPages:     snapshot.dentistPages.filter(d => d.publicState === 'confirmed_provider').length,
    nonConfirmedDentistPages:  snapshot.dentistPages.filter(d => d.publicState !== 'confirmed_provider').length,
    totalDecisionPages:        snapshot.decisionPages.length,
    totalTreatmentPages:              snapshot.treatmentPages.length,
    practicesWithForbiddenClaims:     snapshot.practices.filter(p => p.safetyMetadata.forbiddenClaims.length > 0).length,
    dentistPagesWithForbiddenClaims:  snapshot.dentistPages.filter(d => d.forbiddenClaims.length > 0).length,
    decisionPagesWithForbiddenClaims: snapshot.decisionPages.filter(d => d.forbiddenClaims.length > 0).length,
    treatmentPagesWithForbiddenClaims: snapshot.treatmentPages.filter(t => t.forbiddenClaims.length > 0).length,
    totalWarnings:    warnings.length,
    warningsByCategory,
    warnings,
  }
}
