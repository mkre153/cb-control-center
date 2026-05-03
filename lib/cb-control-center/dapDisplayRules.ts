import type { ProviderStatus } from '../dap/registry/dapProviderStatusTypes'

// ─── Route constants ──────────────────────────────────────────────────────────

export const REQUEST_FLOW_ROUTE = '/preview/dap/request'
export const DIRECTORY_ROUTE    = '/preview/dap'

// ─── Required copy constants (tested) ────────────────────────────────────────

export const REQUEST_EXPECTATION_COPY =
  "This does not mean the dentist currently offers DAP. We'll use your request to help identify patient demand and contact practices where appropriate."

export const HERO_HEADLINE =
  'Find dentists offering Dental Advantage Plan — or request one near you.'

export const HERO_SUBHEAD =
  'No insurance? See if a nearby dentist offers DAP.'

// Pricing shown only when offer terms are validated (eb-002 resolved)
export const CONFIRMED_PRICING = {
  adult:  '$450/yr',
  child:  '$350/yr',
  source: 'Confirmed from current practice-approved brochure',
}

// ─── Gate-derived display rules ───────────────────────────────────────────────

// Rule: Join CTA requires confirmed status + offer terms validated + CTA gate unlocked.
// Provider confirmation alone (eb-001 only) does NOT unlock Join CTA.
export function shouldShowJoinCta(
  status: ProviderStatus,
  offerTermsValidated: boolean,
  ctaGateUnlocked: boolean,
): boolean {
  return status === 'confirmed_dap_provider' && offerTermsValidated && ctaGateUnlocked
}

// Rule: Pricing claims require confirmed status + offer terms validated.
// Provider confirmation alone does NOT unlock pricing claims.
export function shouldShowPricingClaims(
  status: ProviderStatus,
  offerTermsValidated: boolean,
): boolean {
  return status === 'confirmed_dap_provider' && offerTermsValidated
}

// Rule: Declined practices are never public offer cards.
export function isPublicOfferCard(status: ProviderStatus): boolean {
  return status !== 'declined'
}

// Rule: Confirmed badge requires confirmed status only (eb-001).
export function shouldShowConfirmedBadge(status: ProviderStatus): boolean {
  return status === 'confirmed_dap_provider'
}

// CTA label derived from status + gate state.
export function getCtaLabel(
  status: ProviderStatus,
  offerTermsValidated: boolean,
  ctaGateUnlocked: boolean,
): string {
  if (status === 'confirmed_dap_provider') {
    return shouldShowJoinCta(status, offerTermsValidated, ctaGateUnlocked)
      ? 'Join plan'
      : 'View plan details'
  }
  if (status === 'recruitment_requested') return 'Check request status'
  return 'Request this dentist'
}

// CTA href derived from status + gate state + slug.
export function getCtaHref(
  status: ProviderStatus,
  slug: string | undefined,
  offerTermsValidated: boolean,
  ctaGateUnlocked: boolean,
): string {
  if (status === 'confirmed_dap_provider' && slug) return slug
  return REQUEST_FLOW_ROUTE
}

// Human-readable status label (patient-safe — never exposes declined).
export function getStatusLabel(status: ProviderStatus): string {
  switch (status) {
    case 'confirmed_dap_provider': return 'Confirmed DAP Provider'
    case 'not_confirmed':          return 'Request DAP at this office'
    case 'recruitment_requested':  return 'DAP request submitted'
    case 'pending_confirmation':   return 'Request DAP at this office'
    case 'declined':               return 'Request DAP in this area'  // Path 2 — never discloses declined
  }
}

// Tailwind color set for each public-facing state.
export function getStatusColors(status: ProviderStatus): {
  card: string; badge: string; badgeText: string; cta: string; ctaText: string
} {
  if (status === 'confirmed_dap_provider') {
    return {
      card:      'border-green-200 bg-white',
      badge:     'bg-green-100 text-green-700',
      badgeText: 'Confirmed DAP Provider',
      cta:       'bg-green-600 hover:bg-green-700 text-white',
      ctaText:   '',
    }
  }
  return {
    card:      'border-gray-200 bg-white',
    badge:     'bg-gray-100 text-gray-600',
    badgeText: 'Not a DAP provider yet',
    cta:       'bg-gray-800 hover:bg-gray-900 text-white',
    ctaText:   '',
  }
}

// Forbidden hero copy — used in tests to assert these strings are NOT in hero output.
export const FORBIDDEN_HERO_PHRASES = [
  'Join any dentist',
  'Every dentist accepts DAP',
  'DAP prices available at all practices',
  'Join now',
  'Enroll today',
] as const

// ─── Request confirmation copy (tested) ──────────────────────────────────────

export const REQUEST_CONFIRMATION_COPY =
  "Your request does not mean this dentist currently offers Dental Advantage Plan. We may use your request to contact the practice about participation."

// ─── Forbidden city-page claims (tested) ─────────────────────────────────────

export const FORBIDDEN_CITY_CLAIMS = [
  'DAP dentists near you',
  'Find participating dentists near you',
  'Join any dentist',
  'All listed dentists offer DAP',
  'Guaranteed savings at this dentist',
] as const

// ─── Search result states ─────────────────────────────────────────────────────

export type SearchResultState =
  | 'confirmed_available'   // ≥1 confirmed_dap_provider found
  | 'unconfirmed_only'      // practices exist but none confirmed → Path 2
  | 'no_results'            // no practices in area → Path 2
  | 'declined_hidden'       // declined practice suppressed; patient sees same as no_results → Path 2

export interface SearchScenario {
  id: string
  label: string
  zip: string
  confirmedCount: number
  unconfirmedCount: number
  declinedInternalCount: number
  state: SearchResultState
  patientExperienceNote: string
}

export function getSearchResultState(
  confirmedCount: number,
  unconfirmedCount: number,
  declinedInternalCount: number,
): SearchResultState {
  if (confirmedCount > 0) return 'confirmed_available'
  if (unconfirmedCount > 0) return 'unconfirmed_only'
  if (declinedInternalCount > 0) return 'declined_hidden'
  return 'no_results'
}

// Patient-facing CTA derived from search state.
// declined_hidden maps to the same path as no_results — decline is never disclosed.
export function getPatientCtaForSearchState(state: SearchResultState): {
  label: string
  href: string
  note: string
} {
  if (state === 'confirmed_available') {
    return {
      label: 'View confirmed provider',
      href: '#confirmed-providers',
      note: 'A confirmed DAP provider is available in this area.',
    }
  }
  return {
    label: 'Request a DAP dentist',
    href: REQUEST_FLOW_ROUTE,
    note: 'No confirmed DAP provider nearby. Submit a request and we\'ll identify demand in your area.',
  }
}

export const MOCK_SEARCH_SCENARIOS: SearchScenario[] = [
  {
    id: 'confirmed-available',
    label: 'Confirmed provider found',
    zip: '91942',
    confirmedCount: 1,
    unconfirmedCount: 0,
    declinedInternalCount: 0,
    state: 'confirmed_available',
    patientExperienceNote: 'Path 1 — Confirmed DAP provider found. Plan details and Join CTA available.',
  },
  {
    id: 'unconfirmed-only',
    label: 'Only unconfirmed dentists nearby',
    zip: '92103',
    confirmedCount: 0,
    unconfirmedCount: 3,
    declinedInternalCount: 0,
    state: 'unconfirmed_only',
    patientExperienceNote: 'Path 2 — No confirmed DAP provider nearby. Request flow shown. No offer claims.',
  },
  {
    id: 'no-results',
    label: 'No dentists in area',
    zip: '00000',
    confirmedCount: 0,
    unconfirmedCount: 0,
    declinedInternalCount: 0,
    state: 'no_results',
    patientExperienceNote: 'Path 2 — No practices found. Demand capture only.',
  },
  {
    id: 'declined-hidden',
    label: 'Declined practice suppressed (internal)',
    zip: '92117',
    confirmedCount: 0,
    unconfirmedCount: 0,
    declinedInternalCount: 1,
    state: 'declined_hidden',
    patientExperienceNote: 'Path 2 — Patient sees no confirmed provider. Declined status never disclosed.',
  },
]
