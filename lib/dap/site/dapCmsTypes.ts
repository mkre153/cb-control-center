import type { ProviderStatus, PublicClaimLevel } from '@/lib/cb-control-center/types'

export interface DapPracticeCmsRecord {
  id: string
  slug: string | null          // null for declined — no public route
  name: string
  status: ProviderStatus
  city: string
  county: string
  state: string
  zip: string
  publicUrlPath: string | null  // null for declined
  publicDisplay: {
    isPublic: boolean
    showPricing: boolean         // confirmed + offerTermsValidated
    showJoinCta: boolean         // confirmed + offerTermsValidated + ctaGateUnlocked
    showConfirmedBadge: boolean
    ctaLabel: string
    ctaHref: string
  }
  offerSummary: {
    adultAnnualFee: string
    childAnnualFee: string
    source: string
  } | null                      // null unless showPricing
  safetyMetadata: {
    forbiddenClaims: readonly string[]
    requiresDisclaimer: boolean
    disclaimer: string | null
  }
}

export interface DapCityCmsRecord {
  slug: string
  cityName: string
  countyName: string
  state: string
  publicUrlPath: string
  heading: string               // "Dentists in [City]" — tested against FORBIDDEN_CITY_CLAIMS
  subheading: string
  practiceIds: string[]         // all practices in city (including suppressed)
  visiblePracticeSlugs: string[]  // public (non-declined) practices with slugs
  hiddenPracticeIds: string[]     // declined practices suppressed from public view
  publicClaimLevel: PublicClaimLevel
  seoTitle: string
  seoDescription: string
  primaryCta: {
    label: string
    href: string
  }
}

// Explicit four-state classification for each public dentist detail page.
// confirmed_provider — signed agreement, full offer page eligible
// request_dentist    — not confirmed or recruitment requested, request-flow page
// search_estimate    — pending confirmation, soft intermediate state
// internal_only      — declined, no public page (filtered before reaching export)
export type DentistPublicState =
  | 'confirmed_provider'
  | 'request_dentist'
  | 'search_estimate'
  | 'internal_only'

export interface DapDentistPageCmsRecord {
  slug: string
  practiceId: string
  practiceName: string
  city: string
  state: string
  zip: string
  publicUrlPath: string
  publicState: DentistPublicState
  pageType: 'confirmed_provider_detail' | 'unconfirmed_request_detail'
  heading: string
  badgeLabel: string
  bodySections: string[]
  primaryCta: {
    label: string
    href: string
  }
  expectationCopy: string | null  // required on unconfirmed, null on confirmed
  offerSummary: {
    adultAnnualFee: string
    childAnnualFee: string
    source: string
  } | null                        // gated: only when confirmed + offerTermsValidated
  forbiddenClaims: string[]
}

export interface DapDecisionPageCmsRecord {
  slug: string
  queryIntent: string
  decisionQuestion: string
  audience: string
  safeAnswer: string
  primaryCtaLogic: string
  requiredFacts: string[]
  forbiddenClaims: string[]
  seoTitle: string
  seoDescription: string
  secondaryCta?: { label: string; href: string }
  relatedCitySlugs: string[]       // city pages relevant to this decision
  relatedPracticeSlugs: string[]   // only safe (non-declined) practice slugs
  publicClaimLevel: PublicClaimLevel
}

export interface DapTreatmentPageCmsRecord {
  slug: string
  treatment: string               // e.g. "dental crown", "root canal"
  treatmentQuestion: string       // patient-facing question
  audience: string
  safeAnswer: string
  requiredFacts: string[]
  forbiddenClaims: string[]
  seoTitle: string
  seoDescription: string
  primaryCta: { label: string; href: string }
  relatedCitySlugs: string[]
  publicClaimLevel: PublicClaimLevel
}

export interface DapCmsSnapshot {
  practices: DapPracticeCmsRecord[]
  cities: DapCityCmsRecord[]
  dentistPages: DapDentistPageCmsRecord[]
  decisionPages: DapDecisionPageCmsRecord[]
  treatmentPages: DapTreatmentPageCmsRecord[]
}
