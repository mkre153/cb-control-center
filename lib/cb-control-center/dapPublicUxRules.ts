import type { ProviderStatus } from './types'
import type {
  DapAvailabilityState,
  DapPublicCtaType,
  DapRequestType,
  DapDentistPageTemplateId,
  DapStatusBadgeModel,
  DapCtaModel,
  DapGateState,
  DapCityAvailabilitySummary,
  DapHomepageHeroModel,
  DapNoResultsModel,
  DapDentistPageModel,
  DapRequestFlowModel,
  DapRequestFlowStep,
  DapCityPageModel,
  DapDecisionPageCtaModel,
  DapTreatmentPageCtaModel,
  DapSearchResultsInput,
  DapSearchResultsModel,
} from '../dap/site/dapPublicUxTypes'

// ─── Availability State Mapping ───────────────────────────────────────────────

export function getPracticeAvailabilityState(
  providerStatus: ProviderStatus,
  published: boolean,
): DapAvailabilityState {
  if (!published) return 'unavailable_internal_only'
  switch (providerStatus) {
    case 'confirmed_dap_provider': return 'confirmed'
    case 'recruitment_requested':  return 'requested'
    case 'pending_confirmation':   return 'requested'
    case 'not_confirmed':          return 'not_confirmed'
    case 'declined':               return 'unavailable_internal_only'
  }
}

// ─── CTA Rules ────────────────────────────────────────────────────────────────

export function getPrimaryCtaForPractice(
  state: DapAvailabilityState,
  gates: DapGateState,
): DapPublicCtaType {
  switch (state) {
    case 'confirmed':
      if (gates.offerTermsValidated && gates.ctaGateUnlocked) return 'join_plan'
      if (gates.offerTermsValidated) return 'view_plan_details'
      return 'request_plan_details'
    case 'not_confirmed':
    case 'requestable':
      return 'request_this_dentist'
    case 'requested':
      return 'add_your_request'
    case 'unavailable_internal_only':
      return 'none'
  }
}

export function getSecondaryCtaForPractice(
  state: DapAvailabilityState,
  gates: DapGateState,
): DapPublicCtaType | null {
  switch (state) {
    case 'confirmed':
      if (gates.offerTermsValidated && gates.ctaGateUnlocked) return 'view_plan_details'
      return 'search_nearby'
    case 'not_confirmed':
    case 'requestable':
    case 'requested':
      return 'search_nearby'
    case 'unavailable_internal_only':
      return null
  }
}

// ─── Status Badge Rules ───────────────────────────────────────────────────────

export function getPracticeStatusBadge(state: DapAvailabilityState): DapStatusBadgeModel {
  switch (state) {
    case 'confirmed':
      return { label: 'DAP confirmed', variant: 'confirmed', isPublic: true }
    case 'not_confirmed':
      return { label: 'Not confirmed', variant: 'not_confirmed', isPublic: true }
    case 'requestable':
      return { label: 'Request available', variant: 'not_confirmed', isPublic: true }
    case 'requested':
      return { label: 'Requested by patients', variant: 'requested', isPublic: true }
    case 'unavailable_internal_only':
      return { label: 'Internal only', variant: 'internal', isPublic: false }
  }
}

// ─── Dentist Page Template Selection ─────────────────────────────────────────

export function getDentistPageTemplate(
  state: DapAvailabilityState,
): DapDentistPageTemplateId | null {
  switch (state) {
    case 'confirmed':                 return 'confirmed_provider'
    case 'not_confirmed':             return 'not_confirmed'
    case 'requestable':               return 'not_confirmed'
    case 'requested':                 return 'requested'
    case 'unavailable_internal_only': return null
  }
}

// ─── Dentist Page Model ───────────────────────────────────────────────────────

export function getDentistPageModel(
  state: DapAvailabilityState,
  practiceName: string,
  gates: DapGateState,
): DapDentistPageModel | null {
  const templateId = getDentistPageTemplate(state)
  if (templateId === null || templateId === 'internal_only') return null

  const primaryCta = getPrimaryCtaForPractice(state, gates)

  switch (templateId) {
    case 'confirmed_provider':
      return {
        templateId,
        h1Pattern: `${practiceName} and Dental Advantage Plan`,
        allowedCopySamples: [
          `${practiceName} is confirmed to offer Dental Advantage Plan.`,
          'View plan details or join today.',
        ],
        forbiddenCopySamples: [
          'Request DAP at this office.',
          'Coming soon.',
          'We will reach out on your behalf.',
        ],
        primaryCta,
        isPublic: true,
      }

    case 'not_confirmed':
      return {
        templateId,
        h1Pattern: `Request Dental Advantage Plan at ${practiceName}`,
        allowedCopySamples: [
          `We have not confirmed that ${practiceName} offers Dental Advantage Plan.`,
          'Patients have asked about DAP at this office.',
        ],
        forbiddenCopySamples: [
          'This dentist accepts DAP.',
          'DAP is available here.',
          'Join now.',
          'DAP confirmed.',
        ],
        primaryCta,
        isPublic: true,
      }

    case 'requested':
      return {
        templateId,
        h1Pattern: `Patients have requested DAP at ${practiceName}`,
        allowedCopySamples: [
          `Patients have asked about using Dental Advantage Plan at ${practiceName}. Availability has not been confirmed.`,
        ],
        forbiddenCopySamples: [
          'This office offers DAP.',
          'DAP is available here.',
          'Join now.',
        ],
        primaryCta,
        isPublic: true,
      }
  }
}

// ─── Allowed Public Claims ────────────────────────────────────────────────────

export function getAllowedPublicClaimsForPractice(
  state: DapAvailabilityState,
  gates: DapGateState,
): readonly string[] {
  switch (state) {
    case 'confirmed':
      if (gates.offerTermsValidated) {
        return [
          'This dental office is confirmed to offer Dental Advantage Plan.',
          'Specific pricing ($450/yr adult, $350/yr child)',
          '"Join plan" CTA',
          '"View plan details" CTA',
        ]
      }
      return [
        'This dental office is confirmed to offer Dental Advantage Plan.',
        '"View plan details" CTA',
        '"Request plan details" CTA',
      ]

    case 'not_confirmed':
    case 'requestable':
      return [
        'We have not confirmed that this dental office offers Dental Advantage Plan.',
        '"Request DAP at this practice" CTA',
        'Public practice details (name, city, specialty)',
      ]

    case 'requested':
      return [
        'Patients have asked about using Dental Advantage Plan at this office. Availability has not been confirmed.',
        '"Add your request" CTA',
      ]

    case 'unavailable_internal_only':
      return []
  }
}

// ─── City Availability Summary ────────────────────────────────────────────────

export function getCityAvailabilitySummary(
  cityName: string,
  confirmedCount: number,
  requestedCount: number,
  totalCount: number,
): DapCityAvailabilitySummary {
  const hasConfirmedProviders = confirmedCount > 0

  const heading = hasConfirmedProviders
    ? `Dentists offering Dental Advantage Plan in ${cityName}`
    : `Dental Advantage Plan in ${cityName}`

  const subheading = hasConfirmedProviders
    ? `These practices are confirmed to offer Dental Advantage Plan. Don't see your dentist? Request DAP at any local practice — with your consent, we'll reach out on your behalf.`
    : `Dental Advantage Plan is not yet confirmed with any dentist in ${cityName}. With your consent, we can contact local practices and notify you when coverage becomes available.`

  return {
    cityName,
    confirmedCount,
    requestedCount,
    totalCount,
    heading,
    subheading,
    primaryCta: getCityPrimaryCta(confirmedCount),
    hasConfirmedProviders,
  }
}

export function getCityPrimaryCta(confirmedCount: number): DapPublicCtaType {
  return confirmedCount > 0 ? 'search_nearby' : 'request_city_availability'
}

// ─── City Page Model ──────────────────────────────────────────────────────────

export function getCityPageModel(
  cityName: string,
  confirmedCount: number,
): DapCityPageModel {
  const primaryCta = getCityPrimaryCta(confirmedCount)
  const hasConfirmed = confirmedCount > 0

  return {
    pageKind: 'city_page',
    h1: hasConfirmed
      ? `DAP dentists in ${cityName}`
      : `Request Dental Advantage Plan in ${cityName}`,
    subheading: hasConfirmed
      ? `These practices are confirmed to offer Dental Advantage Plan. Don't see your dentist? Request DAP at any practice in ${cityName}.`
      : `No confirmed DAP dentists in ${cityName} yet. With your consent, we can contact local practices about offering DAP and notify you when coverage becomes available.`,
    primaryCta,
    sections: [
      'hero',
      'search_filter',
      'availability_summary',
      'confirmed_providers',
      'request_availability',
      'how_dap_works',
      'faq',
    ] as const,
    impliesUniversalAvailability: false,
  }
}

// ─── Search Results Model ─────────────────────────────────────────────────────

export function getSearchResultsModel(input: DapSearchResultsInput): DapSearchResultsModel {
  const hasConfirmed = input.confirmedCount > 0
  const hasAny = input.confirmedCount + input.notConfirmedCount + input.requestedCount > 0

  if (!hasAny) {
    return {
      hasConfirmedProviders: false,
      primaryCta: 'request_city_availability',
      secondaryCta: 'request_this_dentist',
      isDeadEnd: false,
      noResultsModel: getNoResultsModel(input.searchLocation),
    }
  }

  return {
    hasConfirmedProviders: hasConfirmed,
    primaryCta: hasConfirmed ? 'view_plan_details' : 'request_this_dentist',
    secondaryCta: hasConfirmed ? 'request_this_dentist' : 'request_city_availability',
    isDeadEnd: false,
    noResultsModel: null,
  }
}

// ─── No Results Model ─────────────────────────────────────────────────────────

export function getNoResultsModel(searchContext: string): DapNoResultsModel {
  return {
    headline: 'No confirmed DAP provider in this area yet.',
    body: `Tell us your preferred dentist or area near ${searchContext} — with your consent, we'll contact local practices about offering DAP and let you know when that changes.`,
    primaryCta: {
      type: 'request_city_availability',
      label: 'Request DAP in this area',
      href: '/request-dap',
    },
    secondaryCta: {
      type: 'request_this_dentist',
      label: 'Request a specific dentist',
      href: '/request-dap/dentist',
    },
    isDeadEnd: false,
  }
}

// ─── Homepage Hero Model ──────────────────────────────────────────────────────

export function getHomepageHeroModel(): DapHomepageHeroModel {
  return {
    headline: 'No dental insurance? Find participating dentists or request DAP near you.',
    subheadline:
      'Dental Advantage Plan is a membership — not insurance. Pay an annual fee, get discounts at confirmed participating dentists. No claims. No deductibles. If your dentist is not on DAP yet, you can request it.',
    primaryCta: {
      type: 'search_nearby',
      label: 'Find DAP dentists near me',
      href: '/search',
    },
    secondaryCta: {
      type: 'request_this_dentist',
      label: 'Request a dentist',
      href: '/request-dap',
    },
    impliesUniversalAvailability: false,
  }
}

// ─── Decision Page CTA Model ──────────────────────────────────────────────────

export function getDecisionPageCtaModel(): DapDecisionPageCtaModel {
  return {
    primaryCta: 'search_nearby',
    secondaryCta: 'request_city_availability',
    impliesPricing: false,
    impliesUniversalAvailability: false,
  }
}

// ─── Treatment Page CTA Model ─────────────────────────────────────────────────

export function getTreatmentPageCtaModel(): DapTreatmentPageCtaModel {
  return {
    primaryCta: 'search_nearby',
    secondaryCta: 'request_city_availability',
    impliesGuaranteedPricing: false,
  }
}

// ─── Request Flow Model ───────────────────────────────────────────────────────

const REQUEST_FLOW_STEPS: readonly DapRequestFlowStep[] = [
  { step: 1, label: 'Choose request type',       fields: ['requestType'] as const },
  { step: 2, label: 'Enter location / dentist',  fields: ['location', 'dentistName', 'treatmentNeed'] as const },
  { step: 3, label: 'Enter contact info',        fields: ['name', 'email', 'phone'] as const },
  { step: 4, label: 'Confirm consent',           fields: ['consentToContact'] as const },
]

export function getRequestFlowModel(requestType: DapRequestType): DapRequestFlowModel {
  return {
    requestType,
    steps: REQUEST_FLOW_STEPS,
    availabilityCaveat:
      'Submitting a request does not guarantee availability at your preferred practice. No dentist or practice is contacted without your explicit consent.',
    collectsConsent: true,
  }
}
