// ─── Core Availability States ─────────────────────────────────────────────────
// The canonical five-state model for patient-facing availability display.
// 'requestable' is the area/city-level concept (no dentist yet confirmed nearby).
// 'not_confirmed' is the practice-level concept (in dataset, not a DAP provider).

export type DapAvailabilityState =
  | 'confirmed'                 // signed agreement on file
  | 'requestable'               // area with no confirmed provider — patients can request
  | 'requested'                 // patients have already submitted request at this practice
  | 'not_confirmed'             // in directory but no confirmed DAP participation
  | 'unavailable_internal_only' // declined or unpublished — never patient-facing

// ─── CTA Types ────────────────────────────────────────────────────────────────

export type DapPublicCtaType =
  | 'join_plan'                // confirmed + offerTermsValidated + ctaGateUnlocked
  | 'view_plan_details'        // confirmed + offerTermsValidated, gate not unlocked
  | 'request_plan_details'     // confirmed, offer terms not yet validated
  | 'request_this_dentist'     // not_confirmed / requestable practice
  | 'add_your_request'         // requested practice (patients have already asked)
  | 'request_city_availability'// city/ZIP with no confirmed providers
  | 'search_nearby'            // general — find confirmed providers
  | 'learn_how_it_works'       // educational / decision pages
  | 'none'                     // internal-only — no patient CTA

// ─── Page Kinds ───────────────────────────────────────────────────────────────

export type DapPublicPageKind =
  | 'homepage'
  | 'city_page'
  | 'dentist_page'
  | 'decision_page'
  | 'treatment_page'
  | 'search_results_page'
  | 'request_flow'

// ─── Request Types ────────────────────────────────────────────────────────────

export type DapRequestType =
  | 'specific_dentist'       // patient names a dentist
  | 'city_availability'      // request DAP in a city
  | 'zip_availability'       // request DAP near a ZIP
  | 'treatment_availability' // request DAP for a specific treatment

// ─── Dentist Page Templates ───────────────────────────────────────────────────

export type DapDentistPageTemplateId =
  | 'confirmed_provider'
  | 'not_confirmed'
  | 'requested'
  | 'internal_only'

// ─── Status Badge ─────────────────────────────────────────────────────────────

export type DapStatusBadgeVariant = 'confirmed' | 'not_confirmed' | 'requested' | 'internal'

export interface DapStatusBadgeModel {
  label: string
  variant: DapStatusBadgeVariant
  isPublic: boolean
}

// ─── Gate State ───────────────────────────────────────────────────────────────
// Independent verification gates — each is separate from provider_status.

export interface DapGateState {
  offerTermsValidated: boolean
  ctaGateUnlocked: boolean
}

// ─── CTA Model ────────────────────────────────────────────────────────────────

export interface DapCtaModel {
  type: DapPublicCtaType
  label: string
  href: string | null
}

// ─── Provider Card Model ──────────────────────────────────────────────────────

export interface DapProviderCardModel {
  practiceId: string
  practiceName: string
  city: string
  state: string
  availabilityState: DapAvailabilityState
  statusBadge: DapStatusBadgeModel
  primaryCta: DapCtaModel
  secondaryCta: DapCtaModel | null
  allowedClaims: readonly string[]
  isPublic: boolean
}

// ─── City Availability Summary ────────────────────────────────────────────────

export interface DapCityAvailabilitySummary {
  cityName: string
  confirmedCount: number
  requestedCount: number
  totalCount: number
  heading: string
  subheading: string
  primaryCta: DapPublicCtaType
  hasConfirmedProviders: boolean
}

// ─── Homepage Hero Model ──────────────────────────────────────────────────────

export interface DapHomepageHeroModel {
  headline: string
  subheadline: string
  primaryCta: DapCtaModel
  secondaryCta: DapCtaModel
  readonly impliesUniversalAvailability: false
}

// ─── No Results Model ─────────────────────────────────────────────────────────
// isDeadEnd is structurally false — no results must never dead-end.

export interface DapNoResultsModel {
  headline: string
  body: string
  primaryCta: DapCtaModel
  secondaryCta: DapCtaModel | null
  readonly isDeadEnd: false
}

// ─── Search Results Model ─────────────────────────────────────────────────────

export interface DapSearchResultsInput {
  confirmedCount: number
  notConfirmedCount: number
  requestedCount: number
  searchLocation: string
}

export interface DapSearchResultsModel {
  hasConfirmedProviders: boolean
  primaryCta: DapPublicCtaType
  secondaryCta: DapPublicCtaType
  readonly isDeadEnd: false
  noResultsModel: DapNoResultsModel | null
}

// ─── Page Section Models ──────────────────────────────────────────────────────

export interface DapHeroSectionModel {
  h1: string
  subheading: string
  primaryCta: DapCtaModel
  secondaryCta: DapCtaModel | null
}

export interface DapSearchSectionModel {
  placeholder: string
  helperText: string
  allowsLocationSearch: boolean
  allowsDentistSearch: boolean
}

export interface DapHowItWorksSectionModel {
  steps: ReadonlyArray<{ step: number; title: string; description: string }>
}

export interface DapFaqSectionModel {
  items: ReadonlyArray<{ question: string; answer: string }>
}

export interface DapComparisonSectionModel {
  headline: string
  columns: ReadonlyArray<{ label: string; points: readonly string[] }>
}

export interface DapSavingsEducationModel {
  headline: string
  body: string
  readonly impliesGuaranteedPricing: false
}

// ─── Dentist Page Model ───────────────────────────────────────────────────────

export interface DapDentistPageModel {
  templateId: DapDentistPageTemplateId
  h1Pattern: string
  allowedCopySamples: readonly string[]
  forbiddenCopySamples: readonly string[]
  primaryCta: DapPublicCtaType
  isPublic: boolean
}

// ─── City Page Model ──────────────────────────────────────────────────────────

export interface DapCityPageModel {
  pageKind: 'city_page'
  h1: string
  subheading: string
  primaryCta: DapPublicCtaType
  sections: readonly string[]
  readonly impliesUniversalAvailability: false
}

// ─── Decision Page CTA Model ──────────────────────────────────────────────────

export interface DapDecisionPageCtaModel {
  primaryCta: DapPublicCtaType
  secondaryCta: DapPublicCtaType
  readonly impliesPricing: false
  readonly impliesUniversalAvailability: false
}

// ─── Treatment Page CTA Model ─────────────────────────────────────────────────

export interface DapTreatmentPageCtaModel {
  primaryCta: DapPublicCtaType
  secondaryCta: DapPublicCtaType
  readonly impliesGuaranteedPricing: false
}

// ─── Request Flow ─────────────────────────────────────────────────────────────

export interface DapRequestFlowStep {
  step: number
  label: string
  fields: readonly string[]
}

export interface DapRequestFlowModel {
  requestType: DapRequestType
  steps: readonly DapRequestFlowStep[]
  availabilityCaveat: string
  readonly collectsConsent: true
}
