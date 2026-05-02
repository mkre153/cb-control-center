import {
  shouldShowJoinCta,
  shouldShowPricingClaims,
  isPublicOfferCard,
  shouldShowConfirmedBadge,
  getCtaLabel,
  getCtaHref,
  REQUEST_EXPECTATION_COPY,
  REQUEST_FLOW_ROUTE,
  getSearchResultState,
  getPatientCtaForSearchState,
} from '../dapDisplayRules'
import { getCityHeading, getCitySubheading } from '../dapCityData'
import type {
  DapPracticeCmsRecord,
  DapCityCmsRecord,
  DapDentistPageCmsRecord,
  DapDecisionPageCmsRecord,
  DapTreatmentPageCmsRecord,
  DapCmsSnapshot,
  DentistPublicState,
} from '../../dap/site/dapCmsTypes'
import type { ProviderStatus, PublicClaimLevel } from '../types'
import type {
  DapPracticeSourceRecord,
  DapCitySourceRecord,
  DapDecisionSourceRecord,
  DapTreatmentSourceRecord,
  DapCmsSourceBundle,
} from './dapSourceTypes'

const DENTIST_BASE = '/preview/dap/dentists'
const CITY_BASE    = '/preview/dap'

// ─── Internal helpers ─────────────────────────────────────────────────────────

function derivePublicState(status: ProviderStatus): DentistPublicState {
  switch (status) {
    case 'confirmed_dap_provider': return 'confirmed_provider'
    case 'pending_confirmation':   return 'search_estimate'
    case 'declined':               return 'internal_only'
    default:                       return 'request_dentist'
  }
}

function practiceForbiddenClaims(status: ProviderStatus): string[] {
  if (status === 'confirmed_dap_provider') {
    return [
      '"Join plan" when offer terms are not yet validated',
      '"Request DAP at this office" — wrong template for a confirmed provider',
    ]
  }
  return [
    '"DAP available now" — plan not confirmed at this practice',
    '"Join plan" — plan not available at this practice',
    'Any pricing or savings claims for this practice',
  ]
}

// ─── Practice adapter ─────────────────────────────────────────────────────────

function adaptPractice(src: DapPracticeSourceRecord): DapPracticeCmsRecord {
  const isPublic    = isPublicOfferCard(src.provider_status)
  const showPricing = shouldShowPricingClaims(src.provider_status, src.offer_terms_validated)
  const showJoinCta = shouldShowJoinCta(src.provider_status, src.offer_terms_validated, src.cta_gate_unlocked)
  const urlPath     = isPublic && src.page_slug ? `${DENTIST_BASE}/${src.page_slug}` : null

  return {
    id:            src.id,
    slug:          src.page_slug,
    name:          src.name,
    status:        src.provider_status,
    city:          src.city,
    county:        src.county,
    state:         src.state,
    zip:           src.zip,
    publicUrlPath: urlPath,
    publicDisplay: {
      isPublic,
      showPricing,
      showJoinCta,
      showConfirmedBadge: shouldShowConfirmedBadge(src.provider_status),
      ctaLabel: isPublic
        ? getCtaLabel(src.provider_status, src.offer_terms_validated, src.cta_gate_unlocked)
        : '',
      ctaHref: isPublic
        ? getCtaHref(src.provider_status, urlPath ?? undefined, src.offer_terms_validated, src.cta_gate_unlocked)
        : '',
    },
    offerSummary: showPricing && src.adult_annual_fee && src.child_annual_fee
      ? {
          adultAnnualFee: src.adult_annual_fee,
          childAnnualFee: src.child_annual_fee,
          source:         src.offer_source ?? 'Source not specified',
        }
      : null,
    safetyMetadata: {
      forbiddenClaims:    practiceForbiddenClaims(src.provider_status),
      requiresDisclaimer: isPublic,
      disclaimer: isPublic
        ? src.provider_status === 'confirmed_dap_provider'
          ? `Pricing confirmed at ${src.name}. Each practice sets its own membership terms.`
          : `${src.name} has not confirmed participation in Dental Advantage Plan.`
        : null,
    },
  }
}

// ─── City adapter ─────────────────────────────────────────────────────────────
// allPublishedPractices: all practices with published=true (includes declined),
// needed to correctly compute hiddenPracticeIds for the city record.

function adaptCity(
  src: DapCitySourceRecord,
  allPublishedPractices: DapPracticeSourceRecord[],
): DapCityCmsRecord {
  const cityPractices    = allPublishedPractices.filter(p => p.city === src.city_name)
  const publicPractices  = cityPractices.filter(p => isPublicOfferCard(p.provider_status))
  const hiddenPractices  = cityPractices.filter(p => !isPublicOfferCard(p.provider_status))

  const confirmedCount   = publicPractices.filter(p => p.provider_status === 'confirmed_dap_provider').length
  const unconfirmedCount = publicPractices.filter(p => p.provider_status !== 'confirmed_dap_provider').length
  const declinedCount    = hiddenPractices.length

  const searchState = getSearchResultState(confirmedCount, unconfirmedCount, declinedCount)
  const primaryCta  = getPatientCtaForSearchState(searchState)

  const publicClaimLevel: PublicClaimLevel =
    confirmedCount   > 0 ? 'full'    :
    unconfirmedCount > 0 ? 'limited' : 'none'

  const visiblePracticeSlugs = publicPractices
    .map(p => p.page_slug)
    .filter((s): s is string => s !== null)

  return {
    slug:                src.slug,
    cityName:            src.city_name,
    countyName:          src.county_name,
    state:               src.state,
    publicUrlPath:       `${CITY_BASE}/${src.slug}`,
    heading:             getCityHeading(src.city_name),
    subheading:          getCitySubheading(),
    practiceIds:         cityPractices.map(p => p.id),
    visiblePracticeSlugs,
    hiddenPracticeIds:   hiddenPractices.map(p => p.id),
    publicClaimLevel,
    seoTitle:            `${getCityHeading(src.city_name)} — Dental Advantage Plan`,
    seoDescription:      `Dental Advantage Plan directory for ${src.city_name}. See confirmed providers or request DAP at a dentist near you.`,
    primaryCta: {
      label: primaryCta.label,
      href:  primaryCta.href,
    },
  }
}

// ─── Dentist detail page adapter ──────────────────────────────────────────────
// Precondition: src.page_slug is non-null and src.provider_status !== 'declined'

function adaptDentistPage(src: DapPracticeSourceRecord): DapDentistPageCmsRecord {
  const slug        = src.page_slug!
  const isConfirmed = src.provider_status === 'confirmed_dap_provider'
  const showJoinCta = shouldShowJoinCta(src.provider_status, src.offer_terms_validated, src.cta_gate_unlocked)
  const showPricing = shouldShowPricingClaims(src.provider_status, src.offer_terms_validated)
  const urlPath     = `${DENTIST_BASE}/${slug}`

  const ctaHref = showJoinCta
    ? `${urlPath}/enroll`
    : isConfirmed
    ? urlPath
    : REQUEST_FLOW_ROUTE

  return {
    slug,
    practiceId:    src.id,
    practiceName:  src.name,
    city:          src.city,
    state:         src.state,
    zip:           src.zip,
    publicUrlPath: urlPath,
    publicState:   derivePublicState(src.provider_status),
    pageType:      isConfirmed ? 'confirmed_provider_detail' : 'unconfirmed_request_detail',
    heading: isConfirmed
      ? `Dental Advantage Plan at ${src.name}`
      : `${src.name} — Request Dental Advantage Plan`,
    badgeLabel: isConfirmed ? 'Confirmed DAP Provider' : 'Not a DAP provider yet',
    bodySections: isConfirmed
      ? ['plan overview', 'pricing', 'how to enroll']
      : ['about this practice', 'request dap at this office'],
    primaryCta: {
      label: getCtaLabel(src.provider_status, src.offer_terms_validated, src.cta_gate_unlocked),
      href:  ctaHref,
    },
    expectationCopy: isConfirmed ? null : REQUEST_EXPECTATION_COPY,
    offerSummary: showPricing && src.adult_annual_fee && src.child_annual_fee
      ? {
          adultAnnualFee: src.adult_annual_fee,
          childAnnualFee: src.child_annual_fee,
          source:         src.offer_source ?? 'Source not specified',
        }
      : null,
    forbiddenClaims: practiceForbiddenClaims(src.provider_status),
  }
}

// ─── Decision page adapter ────────────────────────────────────────────────────

function adaptDecisionPage(src: DapDecisionSourceRecord): DapDecisionPageCmsRecord {
  return {
    slug:                   src.slug,
    queryIntent:            src.query_intent,
    decisionQuestion:       src.decision_question,
    audience:               src.audience,
    safeAnswer:             src.safe_answer,
    primaryCtaLogic:        src.primary_cta_logic,
    requiredFacts:          [...src.required_facts],
    forbiddenClaims:        [...src.forbidden_claims],
    seoTitle:               src.seo_title,
    seoDescription:         src.seo_description,
    ...(src.secondary_cta_label && src.secondary_cta_href
      ? { secondaryCta: { label: src.secondary_cta_label, href: src.secondary_cta_href } }
      : {}),
    relatedCitySlugs:       [...src.related_city_slugs],
    relatedPracticeSlugs:   [...src.related_practice_slugs],
    publicClaimLevel:       src.public_claim_level,
  }
}

// ─── Treatment page adapter ───────────────────────────────────────────────────

function adaptTreatmentPage(src: DapTreatmentSourceRecord): DapTreatmentPageCmsRecord {
  return {
    slug:              src.slug,
    treatment:         src.treatment,
    treatmentQuestion: src.treatment_question,
    audience:          src.audience,
    safeAnswer:        src.safe_answer,
    requiredFacts:     [...src.required_facts],
    forbiddenClaims:   [...src.forbidden_claims],
    seoTitle:          src.seo_title,
    seoDescription:    src.seo_description,
    primaryCta: {
      label: src.primary_cta_label,
      href:  src.primary_cta_href,
    },
    relatedCitySlugs:  [...src.related_city_slugs],
    publicClaimLevel:  src.public_claim_level,
  }
}

// ─── Main adapter ─────────────────────────────────────────────────────────────
//
// Transforms a DapCmsSourceBundle (raw CMS/Supabase rows) into the gated
// DapCmsSnapshot that public page components consume.
//
// Filtering rules:
//   - published === false  → skip entirely (draft records never surface)
//   - provider_status === 'declined' → excluded from public practices/dentistPages,
//     but still counted in city hiddenPracticeIds so the city record is accurate
//
// The output shape is identical to exportDapCmsSnapshot() — this is the same
// contract that all existing tests, QA scans, and page components depend on.

export function buildDapCmsSnapshotFromSource(source: DapCmsSourceBundle): DapCmsSnapshot {
  // Published practices (includes declined — needed for city hiddenPracticeIds)
  const publishedPractices = source.practices.filter(p => p.published)

  // Public-only practices: published + not declined
  const publicPractices = publishedPractices.filter(p => isPublicOfferCard(p.provider_status))

  const practices = publicPractices.map(adaptPractice)

  const cities = source.cities
    .filter(c => c.published)
    .map(c => adaptCity(c, publishedPractices))

  const dentistPages = publicPractices
    .filter(p => p.page_slug !== null)
    .map(adaptDentistPage)

  const decisionPages = source.decisionPages
    .filter(d => d.published)
    .map(adaptDecisionPage)

  const treatmentPages = source.treatmentPages
    .filter(t => t.published)
    .map(adaptTreatmentPage)

  return { practices, cities, dentistPages, decisionPages, treatmentPages }
}
