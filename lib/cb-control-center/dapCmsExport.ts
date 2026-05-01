import type { MockDentistPage, ProviderStatus } from './types'
import {
  shouldShowJoinCta,
  shouldShowPricingClaims,
  isPublicOfferCard,
  shouldShowConfirmedBadge,
  getCtaLabel,
  getCtaHref,
  CONFIRMED_PRICING,
  REQUEST_EXPECTATION_COPY,
  REQUEST_FLOW_ROUTE,
  getPatientCtaForSearchState,
  getSearchResultState,
} from './dapDisplayRules'
import {
  getDentistSlug,
  getCityHeading,
  getCitySubheading,
  getPracticesForCity,
  getCityBySlug,
  ALL_PREVIEW_PRACTICES,
  DAP_CITY_PAGES,
} from './dapCityData'
import type {
  DapPracticeCmsRecord,
  DapCityCmsRecord,
  DapDentistPageCmsRecord,
  DapDecisionPageCmsRecord,
  DapTreatmentPageCmsRecord,
  DapCmsSnapshot,
  DentistPublicState,
} from './dapCmsTypes'
import { buildDapCmsSnapshotFromSource } from './source/dapSourceAdapter'
import type { DapCmsSourceBundle } from './source/dapSourceTypes'

const COUNTY       = 'San Diego County'
const STATE        = 'CA'
const DENTIST_BASE = '/preview/dap/dentists'
const CITY_BASE    = '/preview/dap'
const DIRECTORY    = '/preview/dap'

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

function derivePublicState(status: ProviderStatus): DentistPublicState {
  switch (status) {
    case 'confirmed_dap_provider': return 'confirmed_provider'
    case 'pending_confirmation':   return 'search_estimate'
    case 'declined':               return 'internal_only'
    default:                       return 'request_dentist'
  }
}

// ─── Practice card export ─────────────────────────────────────────────────────

export function exportPracticeToCmsRecord(
  practice: MockDentistPage,
  offerTermsValidated: boolean,
  ctaGateUnlocked: boolean,
): DapPracticeCmsRecord {
  const slug        = getDentistSlug(practice) ?? null
  const isPublic    = isPublicOfferCard(practice.provider_status)
  const showPricing = shouldShowPricingClaims(practice.provider_status, offerTermsValidated)
  const showJoinCta = shouldShowJoinCta(practice.provider_status, offerTermsValidated, ctaGateUnlocked)
  const urlPath     = isPublic && slug ? `${DENTIST_BASE}/${slug}` : null

  return {
    id:            practice.id,
    slug,
    name:          practice.practiceName,
    status:        practice.provider_status,
    city:          practice.city,
    county:        COUNTY,
    state:         STATE,
    zip:           practice.zip,
    publicUrlPath: urlPath,
    publicDisplay: {
      isPublic,
      showPricing,
      showJoinCta,
      showConfirmedBadge: shouldShowConfirmedBadge(practice.provider_status),
      ctaLabel: isPublic
        ? getCtaLabel(practice.provider_status, offerTermsValidated, ctaGateUnlocked)
        : '',
      ctaHref: isPublic
        ? getCtaHref(practice.provider_status, urlPath ?? undefined, offerTermsValidated, ctaGateUnlocked)
        : '',
    },
    offerSummary: showPricing
      ? {
          adultAnnualFee: CONFIRMED_PRICING.adult,
          childAnnualFee: CONFIRMED_PRICING.child,
          source:         CONFIRMED_PRICING.source,
        }
      : null,
    safetyMetadata: {
      forbiddenClaims:    practiceForbiddenClaims(practice.provider_status),
      requiresDisclaimer: isPublic,
      disclaimer: isPublic
        ? practice.provider_status === 'confirmed_dap_provider'
          ? `Pricing confirmed at ${practice.practiceName}. Each practice sets its own membership terms.`
          : `${practice.practiceName} has not confirmed participation in Dental Advantage Plan.`
        : null,
    },
  }
}

// ─── City page export ─────────────────────────────────────────────────────────

export function exportCityToCmsRecord(citySlug: string): DapCityCmsRecord {
  const cityData        = getCityBySlug(citySlug)!
  const allPractices    = getPracticesForCity(cityData.name)
  const publicPractices = allPractices.filter(p => isPublicOfferCard(p.provider_status))
  const hiddenPractices = allPractices.filter(p => !isPublicOfferCard(p.provider_status))

  const confirmedCount   = publicPractices.filter(p => p.provider_status === 'confirmed_dap_provider').length
  const unconfirmedCount = publicPractices.filter(p => p.provider_status !== 'confirmed_dap_provider').length
  const declinedCount    = hiddenPractices.length

  const searchState = getSearchResultState(confirmedCount, unconfirmedCount, declinedCount)
  const primaryCta  = getPatientCtaForSearchState(searchState)

  const publicClaimLevel =
    confirmedCount   > 0 ? 'full'    :
    unconfirmedCount > 0 ? 'limited' : 'none'

  const visiblePracticeSlugs = publicPractices
    .map(p => getDentistSlug(p))
    .filter((s): s is string => s !== undefined)

  return {
    slug:                citySlug,
    cityName:            cityData.name,
    countyName:          COUNTY,
    state:               STATE,
    publicUrlPath:       `${CITY_BASE}/${citySlug}`,
    heading:             getCityHeading(cityData.name),
    subheading:          getCitySubheading(),
    practiceIds:         allPractices.map(p => p.id),
    visiblePracticeSlugs,
    hiddenPracticeIds:   hiddenPractices.map(p => p.id),
    publicClaimLevel,
    seoTitle:            `${getCityHeading(cityData.name)} — Dental Advantage Plan`,
    seoDescription:      `Dental Advantage Plan directory for ${cityData.name}. See confirmed providers or request DAP at a dentist near you.`,
    primaryCta: {
      label: primaryCta.label,
      href:  primaryCta.href,
    },
  }
}

// ─── Dentist detail page export ───────────────────────────────────────────────
// Precondition: practice must be public (isPublicOfferCard) and have a pageSlug.

export function exportDentistPageToCmsRecord(
  practice: MockDentistPage,
  offerTermsValidated: boolean,
  ctaGateUnlocked: boolean,
): DapDentistPageCmsRecord {
  const slug        = getDentistSlug(practice)!
  const isConfirmed = practice.provider_status === 'confirmed_dap_provider'
  const showJoinCta = shouldShowJoinCta(practice.provider_status, offerTermsValidated, ctaGateUnlocked)
  const showPricing = shouldShowPricingClaims(practice.provider_status, offerTermsValidated)
  const urlPath     = `${DENTIST_BASE}/${slug}`
  const publicState = derivePublicState(practice.provider_status)

  const ctaHref = showJoinCta
    ? `${urlPath}/enroll`
    : isConfirmed
    ? urlPath
    : REQUEST_FLOW_ROUTE

  return {
    slug,
    practiceId:    practice.id,
    practiceName:  practice.practiceName,
    city:          practice.city,
    state:         STATE,
    zip:           practice.zip,
    publicUrlPath: urlPath,
    publicState,
    pageType:      isConfirmed ? 'confirmed_provider_detail' : 'unconfirmed_request_detail',
    heading: isConfirmed
      ? `Dental Advantage Plan at ${practice.practiceName}`
      : `${practice.practiceName} — Request Dental Advantage Plan`,
    badgeLabel: isConfirmed ? 'Confirmed DAP Provider' : 'Not a DAP provider yet',
    bodySections: isConfirmed
      ? ['plan overview', 'pricing', 'how to enroll']
      : ['about this practice', 'request dap at this office'],
    primaryCta: {
      label: getCtaLabel(practice.provider_status, offerTermsValidated, ctaGateUnlocked),
      href:  ctaHref,
    },
    expectationCopy: isConfirmed ? null : REQUEST_EXPECTATION_COPY,
    offerSummary: showPricing
      ? {
          adultAnnualFee: CONFIRMED_PRICING.adult,
          childAnnualFee: CONFIRMED_PRICING.child,
          source:         CONFIRMED_PRICING.source,
        }
      : null,
    forbiddenClaims: practiceForbiddenClaims(practice.provider_status),
  }
}

// ─── Decision pages ───────────────────────────────────────────────────────────

const CONFIRMED_SLUG = 'irene-olaes-dds'
const SD_CITIES      = ['san-diego', 'la-mesa', 'chula-vista', 'la-jolla'] as const
const ALL_CITIES     = ['san-diego', 'la-mesa', 'chula-vista', 'la-jolla', 'escondido'] as const

const SEED_DECISION_PAGES: DapDecisionPageCmsRecord[] = [
  // ── Original 5 ──────────────────────────────────────────────────────────────

  {
    slug:            'no-insurance-dentist-san-diego',
    queryIntent:     'patient without insurance seeking dentist in San Diego',
    decisionQuestion: 'Is there a dentist in San Diego that offers a membership plan for patients without insurance?',
    audience:        'Adults without dental insurance in San Diego County',
    safeAnswer:
      'Some dentists in San Diego offer in-house dental membership plans — a flat annual fee covering preventive care with discounts on other services. Dental Advantage Plan helps you find which practices offer these plans or request one near you.',
    primaryCtaLogic:
      'If a confirmed DAP provider exists near the patient: show "View plan details" CTA. Otherwise: show "Request a DAP dentist" CTA → request flow.',
    requiredFacts: [
      'DAP is a directory — it does not bill patients or administer the plan',
      'Each practice sets its own membership terms and pricing',
      'Only confirmed DAP providers may be presented as offering a plan',
      'Unconfirmed practices route to the request flow, not the plan',
    ],
    forbiddenClaims: [
      '"All San Diego dentists accept DAP" — false',
      '"DAP dentists near you" — only confirmed providers may be presented',
      '"Guaranteed savings at any dentist" — pricing set by each practice',
      'Specific pricing without confirmed provider attribution',
    ],
    seoTitle:       'Find a Dentist Without Insurance in San Diego — Dental Advantage Plan',
    seoDescription: 'No dental insurance? Find dentists in San Diego who offer in-house membership plans, or request one near you through Dental Advantage Plan.',
    secondaryCta:   { label: 'Browse the directory', href: DIRECTORY },
    relatedCitySlugs:     ['san-diego', 'la-mesa'],
    relatedPracticeSlugs: [CONFIRMED_SLUG],
    publicClaimLevel:     'limited',
  },
  {
    slug:            'dental-membership-plan-vs-insurance',
    queryIntent:     'patient comparing in-house membership plans to traditional dental insurance',
    decisionQuestion: 'Is a dental membership plan better than dental insurance if I just need cleanings and basic care?',
    audience:        'Adults evaluating dental coverage options, no current insurance',
    safeAnswer:
      'In-house dental membership plans can be a good fit for patients who mainly need preventive care — cleanings, exams, and X-rays — and want predictable costs without monthly premiums. Unlike insurance, there are no deductibles, waiting periods, or claim forms at participating practices.',
    primaryCtaLogic: 'Always route to search or request flow — this is an education page. No enrollment CTA on this page.',
    requiredFacts: [
      'Membership plans are set and administered by each individual dental practice',
      'DAP is a directory — it does not set plan terms or collect fees from patients',
      'Each practice that joins DAP sets its own pricing',
      'Pricing claims must cite a specific confirmed provider as the source',
    ],
    forbiddenClaims: [
      'Any network-size claim ("thousands of dentists") — only one confirmed provider on record',
      'Guaranteed savings without per-practice source attribution',
      '"Always better than insurance" — depends on individual needs and treatment',
      'Specific pricing not attributed to a confirmed provider',
    ],
    seoTitle:       "Dental Membership Plan vs Insurance — What's the Difference?",
    seoDescription: 'Learn how in-house dental membership plans compare to traditional dental insurance — and how to find a participating dentist near you.',
    secondaryCta:   { label: 'Browse the directory', href: DIRECTORY },
    relatedCitySlugs:     [...SD_CITIES],
    relatedPracticeSlugs: [],
    publicClaimLevel:     'none',
  },
  {
    slug:            'dentist-payment-options-without-insurance',
    queryIntent:     'patient seeking affordable payment options for dental care without insurance',
    decisionQuestion: "What are my options for paying for dental care if I don't have insurance?",
    audience:        'Adults without dental insurance who need care now',
    safeAnswer:
      'Options for uninsured dental patients include in-house membership plans at participating dentists, dental school clinics, sliding-scale community health centers, and third-party financing. Dental Advantage Plan helps you find local dentists that offer in-house membership plans.',
    primaryCtaLogic: 'Show confirmed provider search CTA. If no confirmed provider near patient: request flow CTA.',
    requiredFacts: [
      'Only confirmed DAP providers may be described as offering a plan',
      'DAP does not offer financing or payment plans — it is a directory',
      'Pricing at each practice is set by that practice, not by DAP',
    ],
    forbiddenClaims: [
      '"DAP guarantees lower dental bills" — pricing set by each practice',
      '"Most dentists offer DAP" — only confirmed providers participate',
      'Specific procedure pricing without confirmed provider source',
    ],
    seoTitle:       'Dental Payment Options Without Insurance — Dental Advantage Plan',
    seoDescription: 'Explore your options for affordable dental care without insurance, including in-house membership plans at participating DAP dentists.',
    secondaryCta:   { label: 'Browse the directory', href: DIRECTORY },
    relatedCitySlugs:     ['san-diego'],
    relatedPracticeSlugs: [],
    publicClaimLevel:     'none',
  },
  {
    slug:            'affordable-dental-cleaning-without-insurance',
    queryIntent:     'patient seeking affordable dental cleaning with no insurance',
    decisionQuestion: "How do I get an affordable dental cleaning if I don't have insurance?",
    audience:        'Adults without dental insurance who need a cleaning',
    safeAnswer:
      'Patients without insurance can get affordable cleanings at dentists that offer in-house membership plans, which typically include two cleanings and two exams per year at no additional charge at that practice. Dental Advantage Plan helps you find which local practices offer these plans.',
    primaryCtaLogic: 'Search CTA → if confirmed provider found, show confirmed-provider card with plan details. Otherwise: request flow.',
    requiredFacts: [
      'Plan inclusions (2 cleanings, 2 exams) must be attributed to a specific confirmed provider',
      '"Zero copay at checkout" may only be claimed if confirmed from current practice brochure',
      'Only confirmed DAP providers may be presented as offering this benefit',
    ],
    forbiddenClaims: [
      '"Free cleanings at all DAP dentists" — plan terms set per practice',
      '"No copay at any DAP dentist" — only verified at specific confirmed providers',
      '"DAP covers cleanings" — DAP is a directory, not a payer',
    ],
    seoTitle:       'Affordable Dental Cleaning Without Insurance — Dental Advantage Plan',
    seoDescription: 'Find a dentist that offers affordable cleanings through an in-house membership plan — or request one near you through Dental Advantage Plan.',
    secondaryCta:   { label: 'Browse the directory', href: DIRECTORY },
    relatedCitySlugs:     ['san-diego', 'la-mesa'],
    relatedPracticeSlugs: [CONFIRMED_SLUG],
    publicClaimLevel:     'limited',
  },
  {
    slug:            'how-to-save-on-crowns-without-insurance',
    queryIntent:     'patient seeking to reduce out-of-pocket cost for a dental crown without insurance',
    decisionQuestion: "How can I save money on a dental crown if I don't have dental insurance?",
    audience:        'Adults without insurance facing a crown procedure',
    safeAnswer:
      'In-house dental membership plans may offer a discount on crowns and other non-covered procedures at participating practices. Dental Advantage Plan helps you find dentists with these plans near you. The discount and terms vary by practice.',
    primaryCtaLogic: 'Search CTA → confirmed provider if available. Otherwise: request flow. Never claim savings without source attribution.',
    requiredFacts: [
      'Savings percentages must cite a specific confirmed provider as the source',
      '"Pricing set by each practice" caveat is required on any savings claim',
      'Only confirmed providers may be presented as offering procedure discounts',
      'DAP does not negotiate or set pricing — individual practices do',
    ],
    forbiddenClaims: [
      '"Save 25% on crowns at any DAP dentist" — savings vary by practice',
      '"DAP reduces your crown cost" — DAP is a directory, not a plan administrator',
      'Crown-cost estimates without confirmed provider source',
      '"Guaranteed savings on crowns" — pricing and discounts set by each practice',
    ],
    seoTitle:       'Save on a Dental Crown Without Insurance — Dental Advantage Plan',
    seoDescription: 'Find a dentist that may offer discounts on crowns through an in-house membership plan, or request one near you through Dental Advantage Plan.',
    secondaryCta:   { label: 'Browse the directory', href: DIRECTORY },
    relatedCitySlugs:     ['san-diego', 'la-mesa'],
    relatedPracticeSlugs: [CONFIRMED_SLUG],
    publicClaimLevel:     'limited',
  },

  // ── New 10 ───────────────────────────────────────────────────────────────────

  {
    slug:            'dental-membership-plan-worth-it-for-crown',
    queryIntent:     'patient evaluating whether a dental membership plan offsets the cost of a crown',
    decisionQuestion: 'Is a dental membership plan worth it if I need a crown?',
    audience:        'Adults without insurance who need a crown and are evaluating cost options',
    safeAnswer:
      'If a dentist near you offers an in-house membership plan with a discount on non-covered procedures, the annual membership fee may be less than the discount you receive on a crown alone. Whether it is worthwhile depends on the specific practice\'s pricing, plan terms, and your treatment plan. DAP helps you find dentists that offer these plans.',
    primaryCtaLogic: 'Show confirmed provider CTA if one is nearby. Otherwise: request flow so patient can signal demand near their specific dentist.',
    requiredFacts: [
      'Plan discounts on non-covered procedures (such as crowns) vary by practice',
      'Savings must be evaluated against the specific practice\'s membership fee and discount rate',
      'Only confirmed DAP providers may be presented with plan pricing or discount claims',
      'DAP does not set or negotiate procedure pricing — individual practices do',
    ],
    forbiddenClaims: [
      '"A membership plan always pays for itself with one crown" — depends on practice terms',
      '"Guaranteed savings on your crown" — pricing set by each individual practice',
      '"DAP covers crown procedures" — DAP is a directory, not a payer',
      'Crown cost estimates without confirmed provider source attribution',
    ],
    seoTitle:       'Is a Dental Membership Plan Worth It for a Crown? — Dental Advantage Plan',
    seoDescription: 'Find out if an in-house dental membership plan could reduce the cost of your crown, and find a participating dentist near you through Dental Advantage Plan.',
    secondaryCta:   { label: 'See how DAP works', href: '/preview/dap/request' },
    relatedCitySlugs:     ['san-diego', 'la-mesa'],
    relatedPracticeSlugs: [CONFIRMED_SLUG],
    publicClaimLevel:     'limited',
  },
  {
    slug:            'dap-vs-paying-cash-dentist',
    queryIntent:     'patient without insurance comparing membership plan cost to paying full price per visit',
    decisionQuestion: 'Is it better to use a dental membership plan or just pay cash at the dentist?',
    audience:        'Uninsured adults weighing the cost of a membership plan against out-of-pocket per-visit costs',
    safeAnswer:
      'For patients who need regular preventive care, an in-house dental membership plan may reduce annual costs compared to paying full price for each visit separately. Whether the plan saves money depends on the specific practice\'s pricing, the plan\'s annual fee, and your treatment needs. DAP helps you find dentists that offer these plans near you.',
    primaryCtaLogic: 'Search CTA → confirmed provider if available. Otherwise: request flow.',
    requiredFacts: [
      'Each practice sets its own membership fee and pricing independently of DAP',
      'The cost comparison depends on the specific practice\'s fee schedule and plan terms',
      'Savings claims for a specific practice must cite that practice as the source',
      'DAP does not set pricing or guarantee that a plan will be less expensive than cash payment',
    ],
    forbiddenClaims: [
      '"A membership plan is always cheaper than paying cash" — depends on practice and patient needs',
      '"Guaranteed savings over cash pricing" — not universally true',
      '"All DAP dentists offer better rates than cash payment" — pricing set per practice',
      'Savings claims without confirmed provider source',
    ],
    seoTitle:       'Dental Membership Plan vs Paying Cash — Which Is Better?',
    seoDescription: 'Compare the cost of an in-house dental membership plan to paying out of pocket, and find participating dentists near you through Dental Advantage Plan.',
    secondaryCta:   { label: 'Browse the directory', href: DIRECTORY },
    relatedCitySlugs:     [...SD_CITIES],
    relatedPracticeSlugs: [],
    publicClaimLevel:     'none',
  },
  {
    slug:            'can-i-use-dap-without-dental-insurance',
    queryIntent:     'patient without dental insurance asking if they can use DAP',
    decisionQuestion: "Can I use DAP if I don't have dental insurance?",
    audience:        'Adults without dental insurance who want affordable dental care',
    safeAnswer:
      'Yes — in-house dental membership plans are specifically designed for patients without dental insurance. DAP is a free directory that helps uninsured patients find dentists who offer their own membership plans. No dental insurance is required to search, request, or enroll at a participating practice.',
    primaryCtaLogic: 'Show search CTA → confirmed provider if available. Otherwise: request flow. This page should always have an actionable next step.',
    requiredFacts: [
      'DAP is a directory for patients without insurance — no insurance required',
      'In-house membership plans are offered directly by the dental practice, not through an insurer',
      'DAP does not provide dental insurance or process insurance claims',
      'Enrollment at participating practices is handled directly with the practice',
    ],
    forbiddenClaims: [
      '"DAP is a form of dental insurance" — false',
      '"DAP covers dental procedures" — DAP is a directory, not a payer',
      '"Guaranteed availability at dentists near you" — only confirmed providers offer a plan',
      '"DAP replaces dental insurance" — different product category',
    ],
    seoTitle:       'Can I Use DAP Without Dental Insurance? — Dental Advantage Plan',
    seoDescription: 'Yes — Dental Advantage Plan is designed for patients without insurance. Find dentists with in-house membership plans near you.',
    secondaryCta:   { label: 'Browse the directory', href: DIRECTORY },
    relatedCitySlugs:     [...SD_CITIES],
    relatedPracticeSlugs: [],
    publicClaimLevel:     'none',
  },
  {
    slug:            'how-much-save-dental-work-without-insurance',
    queryIntent:     'patient asking how much they can save on dental procedures without insurance using a membership plan',
    decisionQuestion: 'How much can I save on dental work without insurance?',
    audience:        'Adults without insurance researching cost savings for dental procedures',
    safeAnswer:
      'Savings depend on the specific dentist and plan. At a confirmed DAP provider, in-house membership plans often include preventive care at no extra charge and may offer a discount on non-covered procedures. The exact amount varies by practice and treatment type. DAP helps you find which dentists offer these plans near you.',
    primaryCtaLogic: 'Search CTA → confirmed provider if available (show plan pricing if validated). Otherwise: request flow.',
    requiredFacts: [
      'Savings percentages and dollar amounts must be attributed to a specific confirmed provider',
      '"Pricing set by each practice" caveat is required on any claim about savings',
      'Preventive care inclusions (cleanings, exams, X-rays) must cite a specific confirmed practice as source',
      'DAP does not negotiate procedure pricing — individual practices set their own fee schedules',
    ],
    forbiddenClaims: [
      '"Save up to X% at any DAP dentist" — savings vary by practice',
      '"Guaranteed savings on dental work" — not universally true across all practices',
      'Specific dollar amounts saved without confirmed provider source',
      '"DAP reduces your dental bill" — DAP is a directory, not a pricing intermediary',
    ],
    seoTitle:       'How Much Can I Save on Dental Work Without Insurance?',
    seoDescription: 'Learn how in-house dental membership plans can reduce your dental costs, and find a participating dentist near you through Dental Advantage Plan.',
    secondaryCta:   { label: 'Browse the directory', href: DIRECTORY },
    relatedCitySlugs:     ['san-diego', 'la-mesa'],
    relatedPracticeSlugs: [CONFIRMED_SLUG],
    publicClaimLevel:     'limited',
  },
  {
    slug:            'what-to-do-if-dentist-does-not-offer-dap',
    queryIntent:     'patient whose preferred dentist is not a confirmed DAP provider',
    decisionQuestion: "What should I do if my dentist doesn't offer DAP?",
    audience:        'Adults who want their current dentist to participate in DAP',
    safeAnswer:
      'You can submit a request through DAP to signal patient demand at your preferred dental practice. DAP uses these signals to identify where patients want access to in-house membership plans and may contact practices in those areas. Submitting a request does not guarantee the dentist will join or on what timeline.',
    primaryCtaLogic: 'Always route to request flow — the patient\'s dentist is not confirmed. No confirmed-provider offer CTA.',
    requiredFacts: [
      'Submitting a request is not a guarantee that the practice will join DAP',
      'DAP may contact the practice on the patient\'s behalf, but the decision to participate belongs to the practice',
      'Patients will be notified if a provider joins near them',
      'The request becomes a demand signal DAP uses for provider recruitment prioritization',
    ],
    forbiddenClaims: [
      '"Your dentist will offer DAP" — no guarantee',
      '"DAP is coming soon to your dentist" — premature and unprovable',
      '"We will recruit your dentist" — cannot guarantee outcome',
      '"Your dentist is interested in DAP" — no basis for claim without confirmation',
    ],
    seoTitle:       "What to Do If Your Dentist Doesn't Offer DAP — Dental Advantage Plan",
    seoDescription: "If your dentist doesn't offer Dental Advantage Plan, you can submit a request. DAP may reach out to practices where patients signal demand.",
    secondaryCta:   { label: 'Browse confirmed providers', href: DIRECTORY },
    relatedCitySlugs:     [...ALL_CITIES],
    relatedPracticeSlugs: [],
    publicClaimLevel:     'none',
  },
  {
    slug:            'can-i-ask-dentist-to-offer-dental-savings-plan',
    queryIntent:     'patient wanting to ask their dentist to participate in DAP',
    decisionQuestion: 'Can I ask my dentist to offer a dental savings plan?',
    audience:        'Adults who want their current dentist to run an in-house membership plan',
    safeAnswer:
      'You can request that your dentist participate in Dental Advantage Plan by submitting a demand request through the directory. DAP uses these requests to identify patient demand and may contact the practice about listing their in-house plan. The decision to participate belongs to the practice.',
    primaryCtaLogic: 'Always route to request flow — patient is signaling demand at a specific practice.',
    requiredFacts: [
      'Participation in DAP is voluntary — dental practices decide whether to join',
      'DAP uses patient demand signals to prioritize outreach to practices',
      'Submitting a request does not create an obligation for the practice or for DAP',
      'DAP does not charge patients — practices pay a listing fee if they join',
    ],
    forbiddenClaims: [
      '"Your dentist is required to offer a savings plan if enough patients request it" — false',
      '"DAP will enroll your dentist" — practice decides to participate voluntarily',
      '"Guaranteed that a savings plan will be available" — not within DAP\'s control',
      '"Your dentist is considering joining DAP" — no basis for this claim without confirmation',
    ],
    seoTitle:       'Can I Ask My Dentist to Offer a Dental Savings Plan? — DAP',
    seoDescription: "You can submit a request through Dental Advantage Plan to signal demand at your preferred dentist. Learn how patient requests help DAP reach out to practices.",
    secondaryCta:   { label: 'Browse confirmed providers', href: DIRECTORY },
    relatedCitySlugs:     [...ALL_CITIES],
    relatedPracticeSlugs: [],
    publicClaimLevel:     'none',
  },
  {
    slug:            'is-dap-dental-insurance',
    queryIntent:     'patient asking whether DAP is a form of dental insurance',
    decisionQuestion: 'Is DAP dental insurance?',
    audience:        'Adults comparing dental coverage options and evaluating what DAP is',
    safeAnswer:
      'No. DAP is a patient directory — it helps patients find dentists who offer their own in-house dental membership plans. DAP does not provide dental insurance, process claims, or pay dental bills. Each practice that lists with DAP sets its own plan terms and pricing independently.',
    primaryCtaLogic: 'Route to directory search or request flow — this is a clarification page, not an enrollment page.',
    requiredFacts: [
      'DAP is a directory, not an insurance product or plan administrator',
      'DAP does not process claims or pay dental bills on behalf of patients',
      'In-house dental membership plans are offered by individual practices, not by DAP',
      'No regulatory treatment as insurance — DAP facilitates patient-to-practice connections',
    ],
    forbiddenClaims: [
      '"DAP is dental insurance" — categorically false',
      '"DAP pays your dental bills" — DAP is a directory, not a payer',
      '"DAP processes insurance claims" — no claims processing',
      '"DAP is regulated as an insurance product" — not applicable',
    ],
    seoTitle:       'Is DAP Dental Insurance? — Dental Advantage Plan',
    seoDescription: 'Dental Advantage Plan is not dental insurance. Learn what DAP is — a free directory that helps patients find dentists with in-house membership plans.',
    secondaryCta:   { label: 'Browse the directory', href: DIRECTORY },
    relatedCitySlugs:     [...SD_CITIES],
    relatedPracticeSlugs: [],
    publicClaimLevel:     'none',
  },
  {
    slug:            'difference-between-dap-and-dental-insurance',
    queryIntent:     'patient comparing DAP to traditional dental insurance',
    decisionQuestion: 'What is the difference between DAP and dental insurance?',
    audience:        'Adults without insurance evaluating their dental coverage options',
    safeAnswer:
      'Dental insurance is provided by a third-party insurer that pays a portion of covered procedures and processes claims on your behalf. DAP is a free patient directory that helps you find dentists who run their own in-house membership plans — flat annual fees with no claims, no deductibles, and no waiting periods at participating offices.',
    primaryCtaLogic: 'Route to directory or request flow — education page. Show search CTA alongside the explanation.',
    requiredFacts: [
      'Dental insurance involves a third-party insurer and claim submission process',
      'In-house membership plans are set entirely by the individual dental practice',
      'DAP is a directory — it does not process claims or act as an insurer',
      'No waiting periods and no claims at participating practices are practice-level features, not DAP-guaranteed features',
    ],
    forbiddenClaims: [
      '"DAP is a type of dental insurance" — different product category',
      '"DAP processes claims" — no claims processing exists',
      '"All DAP dentists have no waiting periods" — this is a practice-level feature, not a DAP guarantee',
      'Network-size claims for unconfirmed practices',
    ],
    seoTitle:       'DAP vs Dental Insurance — What Is the Difference?',
    seoDescription: 'Understand the difference between Dental Advantage Plan and dental insurance — and how DAP helps you find dentists with in-house membership plans.',
    secondaryCta:   { label: 'Browse the directory', href: DIRECTORY },
    relatedCitySlugs:     [...SD_CITIES],
    relatedPracticeSlugs: [],
    publicClaimLevel:     'none',
  },
  {
    slug:            'can-i-join-dap-before-next-appointment',
    queryIntent:     'patient asking if they can enroll in a DAP membership plan before their upcoming appointment',
    decisionQuestion: 'Can I join DAP before my next appointment?',
    audience:        'Adults with an upcoming dental appointment who want to reduce out-of-pocket costs',
    safeAnswer:
      'If a confirmed DAP provider is near you, you may be able to enroll in that practice\'s in-house membership plan before your appointment. Enrollment is handled directly with the dental practice — not through DAP. Contact the specific practice to confirm enrollment timing and whether the plan takes effect immediately.',
    primaryCtaLogic: 'If confirmed provider nearby: show confirmed-provider CTA so patient can view plan and contact the practice. Otherwise: request flow.',
    requiredFacts: [
      'Enrollment at confirmed DAP providers is handled directly by the practice, not by DAP',
      'DAP cannot guarantee that enrollment is available before any specific appointment date',
      'Plan activation timing is set by the individual practice',
      'Only confirmed DAP providers have an active in-house plan patients can join',
    ],
    forbiddenClaims: [
      '"Join DAP now — plan activates immediately at any dentist" — only at confirmed providers, on the practice\'s timeline',
      '"DAP guarantees same-day enrollment" — enrollment is controlled by the practice',
      '"Your plan is ready before your appointment" — cannot be guaranteed by DAP',
      '"All DAP dentists allow pre-appointment enrollment" — practice-level decision',
    ],
    seoTitle:       'Can I Join a Dental Membership Plan Before My Appointment? — DAP',
    seoDescription: 'If a confirmed DAP provider is near you, you may be able to enroll before your next appointment. Find participating dentists through Dental Advantage Plan.',
    secondaryCta:   { label: 'Browse confirmed providers', href: DIRECTORY },
    relatedCitySlugs:     ['san-diego', 'la-mesa'],
    relatedPracticeSlugs: [CONFIRMED_SLUG],
    publicClaimLevel:     'limited',
  },
  {
    slug:            'what-happens-if-no-dentist-offers-dap-near-me',
    queryIntent:     'patient in an area with no confirmed DAP providers asking what their options are',
    decisionQuestion: 'What happens if no dentist near me offers DAP yet?',
    audience:        'Adults in areas where no confirmed DAP provider has been identified',
    safeAnswer:
      'If there is no confirmed DAP provider near you, you can submit a demand request through DAP. DAP uses these requests to identify areas where patients want access to in-house membership plans and may contact dental practices in those areas. You will be notified if a confirmed provider joins near you. We cannot guarantee when or whether a practice will participate.',
    primaryCtaLogic: 'Always route to request flow — this page is specifically for the no-confirmed-provider scenario.',
    requiredFacts: [
      'Patient demand signals are used to prioritize provider recruitment outreach',
      'Submitting a request is not a guarantee that a provider will join in the patient\'s area',
      'DAP notifies patients when a confirmed provider joins near their requested area',
      'The decision to participate in DAP belongs to each individual dental practice',
    ],
    forbiddenClaims: [
      '"DAP is coming to your area soon" — cannot predict or guarantee provider recruitment',
      '"Guaranteed DAP coverage in your area" — practice participation is voluntary',
      '"Dentists near you offer DAP" — only confirmed providers may be presented as offering a plan',
      '"We will recruit a dentist for you" — cannot guarantee a specific outcome',
    ],
    seoTitle:       'No DAP Dentist Near Me — What Are My Options? — Dental Advantage Plan',
    seoDescription: 'No confirmed DAP provider in your area? Submit a demand request and DAP may reach out to dental practices near you on your behalf.',
    secondaryCta:   { label: 'Browse all cities', href: DIRECTORY },
    relatedCitySlugs:     [...ALL_CITIES],
    relatedPracticeSlugs: [],
    publicClaimLevel:     'none',
  },

  // ── Phase 7A expansion — 15 new decision pages ───────────────────────────

  {
    slug:             'dental-membership-plan-worth-it',
    queryIntent:      'patient evaluating whether an in-house dental membership plan is worthwhile',
    decisionQuestion: 'Is a dental membership plan worth it for patients without insurance?',
    audience:         'Adults without dental insurance evaluating cost options for routine care',
    safeAnswer:
      'For patients who use regular preventive dental care — two cleanings and exams per year — an in-house dental membership plan may reduce annual dental costs compared to paying per visit without any plan. Whether the plan is worth the annual fee depends on the specific practice\'s pricing, plan inclusions, and your treatment needs. DAP helps you find dentists that offer these plans near you.',
    primaryCtaLogic: 'Show search CTA → confirmed provider if available. Otherwise: request flow.',
    requiredFacts: [
      'Membership plan terms and fees are set by each individual dental practice, not by DAP',
      'The value of a membership plan depends on your anticipated treatment frequency and the specific practice\'s fee schedule',
      'DAP is a directory — it does not administer plans or process fees',
      'Only confirmed DAP providers may be presented as offering an active in-house plan',
    ],
    forbiddenClaims: [
      '"Always worth it for every patient" — depends on individual needs and practice terms',
      '"Guaranteed savings with a membership plan" — not universally true',
      '"DAP membership plans are the most affordable option" — depends on individual circumstances',
      'Specific savings amounts without confirmed provider source attribution',
    ],
    seoTitle:       'Is a Dental Membership Plan Worth It? — Dental Advantage Plan',
    seoDescription: 'Find out if an in-house dental membership plan makes sense for you, and locate dentists that offer these plans near you through Dental Advantage Plan.',
    secondaryCta:   { label: 'Browse the directory', href: DIRECTORY },
    relatedCitySlugs:     [...SD_CITIES],
    relatedPracticeSlugs: [],
    publicClaimLevel:     'none',
  },
  {
    slug:             'dental-membership-plan-worth-it-deep-cleaning',
    queryIntent:      'patient evaluating whether a membership plan offsets the cost of a deep cleaning',
    decisionQuestion: 'Is a dental membership plan worth it if I need a deep cleaning?',
    audience:         'Adults without insurance who need scaling and root planing (deep cleaning)',
    safeAnswer:
      'If a dentist near you offers an in-house membership plan that includes periodontal procedures at a reduced fee or discounted rate, the annual membership cost may be less than paying for a deep cleaning without any plan. Plan inclusions for periodontal work vary by practice. DAP helps you find dentists that offer these plans near you.',
    primaryCtaLogic: 'Show confirmed provider CTA if nearby. Otherwise: request flow.',
    requiredFacts: [
      'Plan inclusions for deep cleaning (scaling and root planing) vary by practice',
      'Not all in-house plans cover periodontal procedures — terms must be verified with the specific practice',
      'Only confirmed DAP providers may be presented with plan details',
      'DAP does not set pricing or guarantee coverage for periodontal procedures',
    ],
    forbiddenClaims: [
      '"Deep cleanings are always included in DAP plans" — varies by practice',
      '"Guaranteed discount on scaling and root planing" — plan terms set per practice',
      'Specific deep cleaning cost savings without confirmed provider source',
      '"DAP covers periodontal treatment" — DAP is a directory, not a payer',
    ],
    seoTitle:       'Is a Dental Membership Plan Worth It for a Deep Cleaning? — DAP',
    seoDescription: 'Find out if a dental membership plan could reduce your deep cleaning cost, and locate participating dentists near you through Dental Advantage Plan.',
    secondaryCta:   { label: 'Browse the directory', href: DIRECTORY },
    relatedCitySlugs:     ['san-diego', 'la-mesa'],
    relatedPracticeSlugs: [CONFIRMED_SLUG],
    publicClaimLevel:     'limited',
  },
  {
    slug:             'dental-membership-plan-worth-it-fillings',
    queryIntent:      'patient evaluating whether a membership plan reduces the cost of dental fillings',
    decisionQuestion: 'Is a dental membership plan worth it if I need fillings?',
    audience:         'Adults without insurance who need one or more dental fillings',
    safeAnswer:
      'In-house dental membership plans at some practices include discounts on restorative procedures such as composite or amalgam fillings. Whether the plan is worth the annual fee depends on how many fillings you need, the specific practice\'s fee schedule, and the discount rate they offer. DAP helps you find dentists that offer these plans near you.',
    primaryCtaLogic: 'Show confirmed provider CTA if nearby. Otherwise: request flow.',
    requiredFacts: [
      'Discounts on restorative procedures such as fillings vary by practice and plan terms',
      'Plan fees and discount rates must be confirmed directly with the dental practice',
      'Only confirmed DAP providers may be presented with specific plan and pricing information',
      'DAP does not negotiate pricing or guarantee discounts on any procedure',
    ],
    forbiddenClaims: [
      '"Fillings are always discounted at DAP dentists" — plan terms set per practice',
      '"Guaranteed savings on composite fillings" — not universally true',
      'Specific filling cost savings without confirmed provider attribution',
      '"DAP covers fillings" — DAP is a directory, not a payer',
    ],
    seoTitle:       'Is a Dental Membership Plan Worth It for Fillings? — DAP',
    seoDescription: 'Learn whether an in-house dental membership plan could reduce your filling costs, and find participating dentists near you through Dental Advantage Plan.',
    secondaryCta:   { label: 'Browse the directory', href: DIRECTORY },
    relatedCitySlugs:     [...SD_CITIES],
    relatedPracticeSlugs: [],
    publicClaimLevel:     'none',
  },
  {
    slug:             'dental-membership-plan-worth-it-root-canal',
    queryIntent:      'patient evaluating whether a membership plan offsets the cost of a root canal',
    decisionQuestion: 'Is a dental membership plan worth it if I need a root canal?',
    audience:         'Adults without insurance who need endodontic treatment',
    safeAnswer:
      'A root canal is among the higher-cost dental procedures for uninsured patients. If a dentist near you offers an in-house membership plan with a discount on endodontic procedures, the annual membership fee may be less than the discount you receive on a single root canal. The discount rate and plan terms vary by practice. DAP helps you find these dentists near you.',
    primaryCtaLogic: 'Show confirmed provider CTA if nearby. Otherwise: request flow.',
    requiredFacts: [
      'Discounts on endodontic procedures (root canals) vary significantly by practice and plan',
      'Plan terms must be confirmed directly with the dental practice before treatment',
      'Only confirmed DAP providers may be presented with specific plan and discount information',
      'DAP does not negotiate procedure pricing — each practice sets its own fee schedule',
    ],
    forbiddenClaims: [
      '"Root canals are always discounted at DAP dentists" — plan terms set per practice',
      '"Guaranteed savings on root canal treatment" — not universally true',
      'Specific root canal cost savings without confirmed provider source',
      '"DAP covers root canal procedures" — DAP is a directory, not a payer',
    ],
    seoTitle:       'Is a Dental Membership Plan Worth It for a Root Canal? — DAP',
    seoDescription: 'Find out if an in-house dental membership plan could reduce your root canal cost, and locate participating dentists near you through Dental Advantage Plan.',
    secondaryCta:   { label: 'Browse the directory', href: DIRECTORY },
    relatedCitySlugs:     ['san-diego', 'la-mesa'],
    relatedPracticeSlugs: [CONFIRMED_SLUG],
    publicClaimLevel:     'limited',
  },
  {
    slug:             'dap-vs-dental-discount-plans',
    queryIntent:      'patient comparing in-house membership plans to third-party dental discount cards',
    decisionQuestion: 'What is the difference between DAP and a dental discount plan?',
    audience:         'Adults without insurance evaluating dental cost reduction options',
    safeAnswer:
      'Dental discount plans are third-party programs that negotiate reduced rates at a network of participating dentists in exchange for an annual membership fee. DAP is a patient directory — it helps patients find individual dental practices that offer their own in-house membership plans. Unlike discount plan networks, in-house plans are set entirely by each individual practice. DAP does not negotiate pricing or administer any plan on behalf of patients.',
    primaryCtaLogic: 'Route to directory or request flow — education page.',
    requiredFacts: [
      'Dental discount plans involve a third-party network and pre-negotiated rates with specific dentists',
      'In-house dental membership plans are set and administered by each individual dental practice',
      'DAP is a directory — it does not negotiate pricing, manage networks, or process member fees',
      'Only confirmed DAP providers have active in-house plans patients can inquire about',
    ],
    forbiddenClaims: [
      '"DAP has a larger network than dental discount plans" — network size comparison not applicable',
      '"DAP offers better rates than discount plan networks" — rate comparison requires confirmed per-practice source',
      '"DAP is a dental discount plan" — different product category',
      'Network size or coverage claims without confirmed provider attribution',
    ],
    seoTitle:       'DAP vs Dental Discount Plans — What Is the Difference?',
    seoDescription: 'Learn how Dental Advantage Plan differs from third-party dental discount plans, and find dentists with in-house membership plans near you.',
    secondaryCta:   { label: 'Browse the directory', href: DIRECTORY },
    relatedCitySlugs:     [...SD_CITIES],
    relatedPracticeSlugs: [],
    publicClaimLevel:     'none',
  },
  {
    slug:             'how-to-find-dentist-who-offers-dap',
    queryIntent:      'patient trying to locate a dentist that participates in DAP',
    decisionQuestion: 'How do I find a dentist that offers DAP near me?',
    audience:         'Adults without insurance looking for a dentist with an in-house membership plan',
    safeAnswer:
      'Search the DAP directory to find confirmed providers in your area. Confirmed providers are dental practices that have listed their own in-house membership plan with DAP. If no confirmed provider is near you, you can submit a request — DAP uses these signals to identify patient demand and may contact practices in areas where patients have requested access.',
    primaryCtaLogic: 'Show confirmed provider CTA if nearby. Otherwise: request flow.',
    requiredFacts: [
      'Confirmed DAP providers are practices that have chosen to list their in-house plan with DAP',
      'Not every dental practice offers an in-house membership plan',
      'Patient requests help DAP identify demand and prioritize outreach to practices in specific areas',
      'DAP does not guarantee that a provider will be available in any specific area',
    ],
    forbiddenClaims: [
      '"Thousands of dentists in the DAP directory" — network size not applicable to current data',
      '"A DAP dentist is near you" — only confirmed providers may be presented as offering a plan',
      '"Find participating dentists near you" — implies broader availability than currently confirmed',
      'Network size or coverage claims without confirmed provider data',
    ],
    seoTitle:       'How to Find a Dentist That Offers DAP Near Me — Dental Advantage Plan',
    seoDescription: 'Search the DAP directory to find confirmed providers near you, or submit a request if no participating dentist is available in your area.',
    secondaryCta:   { label: 'Browse the directory', href: DIRECTORY },
    relatedCitySlugs:     [...ALL_CITIES],
    relatedPracticeSlugs: [CONFIRMED_SLUG],
    publicClaimLevel:     'limited',
  },
  {
    slug:             'is-dap-accepted-everywhere',
    queryIntent:      'patient asking whether DAP is universally accepted at dental offices',
    decisionQuestion: 'Is DAP accepted at every dental office?',
    audience:         'Adults researching how widely available DAP is before searching',
    safeAnswer:
      'No. DAP is a directory of dental practices that have chosen to list their own in-house membership plans. Not every dental practice offers an in-house membership plan, and not every practice that does is listed with DAP. If no confirmed provider is near you, you can submit a request through DAP to signal patient demand in your area.',
    primaryCtaLogic: 'Route to directory search or request flow — clarification page.',
    requiredFacts: [
      'DAP is accepted only at confirmed DAP providers — practices that have actively listed with DAP',
      'Participation in DAP is voluntary — dental practices choose whether to list their plan',
      'Not every dental practice offers an in-house membership plan',
      'Patient demand requests help DAP identify where to focus provider outreach',
    ],
    forbiddenClaims: [
      '"DAP is accepted everywhere" — only at confirmed providers who have listed with DAP',
      '"DAP is accepted at any dental office" — participation is voluntary and limited',
      '"All dentists offer DAP" — categorically false',
      'Universal acceptance claims of any kind',
    ],
    seoTitle:       'Does DAP Work at All Dental Offices? — Dental Advantage Plan',
    seoDescription: 'DAP is available at confirmed participating practices — not every dental office. Find confirmed providers near you or submit a request through Dental Advantage Plan.',
    secondaryCta:   { label: 'Browse the directory', href: DIRECTORY },
    relatedCitySlugs:     [...SD_CITIES],
    relatedPracticeSlugs: [],
    publicClaimLevel:     'none',
  },
  {
    slug:             'is-dap-available-in-san-diego',
    queryIntent:      'patient asking specifically about DAP availability in the San Diego area',
    decisionQuestion: 'Is DAP available in San Diego?',
    audience:         'Adults in San Diego County without dental insurance',
    safeAnswer:
      'DAP has confirmed providers in parts of San Diego County. The directory is focused on San Diego County as a pilot region, but not every city or neighborhood within the county has a confirmed provider. You can search for confirmed providers near your specific area or submit a request if none are currently available near you.',
    primaryCtaLogic: 'Show search CTA → confirmed provider if available for the patient\'s area. Otherwise: request flow.',
    requiredFacts: [
      'DAP is focused on San Diego County as a pilot region',
      'Confirmed providers are available in specific cities within San Diego County — not county-wide',
      'Many San Diego neighborhoods and cities do not yet have a confirmed DAP provider',
      'Patient demand requests help DAP identify which San Diego areas to prioritize for provider outreach',
    ],
    forbiddenClaims: [
      '"DAP is available across all of San Diego" — only in specific confirmed-provider locations',
      '"All San Diego dentists offer DAP" — only confirmed providers participate',
      '"DAP is coming to San Diego soon" — cannot predict or guarantee future provider recruitment',
      '"DAP dentists near you in San Diego" — only confirmed providers may be presented as offering a plan',
    ],
    seoTitle:       'Is DAP Available in San Diego? — Dental Advantage Plan',
    seoDescription: 'DAP has confirmed providers in parts of San Diego County. Find confirmed providers near you or request a DAP dentist in your San Diego neighborhood.',
    secondaryCta:   { label: 'Browse San Diego', href: `${CITY_BASE}/san-diego` },
    relatedCitySlugs:     [...ALL_CITIES, 'el-cajon', 'national-city', 'oceanside'],
    relatedPracticeSlugs: [CONFIRMED_SLUG],
    publicClaimLevel:     'limited',
  },
  {
    slug:             'find-dap-near-me',
    queryIntent:      'patient using near-me search intent to locate DAP dentists',
    decisionQuestion: 'How do I find DAP near me?',
    audience:         'Adults without insurance searching locally for a membership-plan dentist',
    safeAnswer:
      'Search the DAP directory to see if a confirmed provider is near you. Confirmed providers are dental practices that have listed their own in-house membership plan with DAP. If no confirmed provider is available in your area, you can submit a request — DAP uses these signals to identify patient demand and may contact dental practices in your area about participating.',
    primaryCtaLogic: 'Always show a search or request CTA — this is a near-me intent page.',
    requiredFacts: [
      'Confirmed DAP providers are the only practices where patients can view plan details',
      'Patient demand requests help DAP identify which areas to prioritize for provider recruitment',
      'DAP does not guarantee that a provider will be available in any specific location',
      'DAP is a directory — it does not place dentists or guarantee plan enrollment',
    ],
    forbiddenClaims: [
      '"DAP near you" — only confirmed providers may be presented as offering a plan',
      '"Find DAP at any dentist near you" — participation is limited to confirmed providers',
      '"DAP available in your area" — cannot be stated without a confirmed provider in that area',
      'Location-specific availability claims without confirmed provider data',
    ],
    seoTitle:       'Find DAP Near Me — Dental Advantage Plan',
    seoDescription: 'Search the DAP directory to find a participating dentist near you, or submit a request if no confirmed provider is available in your area.',
    secondaryCta:   { label: 'Browse the directory', href: DIRECTORY },
    relatedCitySlugs:     [...ALL_CITIES],
    relatedPracticeSlugs: [],
    publicClaimLevel:     'none',
  },
  {
    slug:             'dental-membership-plan-near-me',
    queryIntent:      'patient using near-me search intent to find a local in-house membership plan',
    decisionQuestion: 'How do I find a dental membership plan near me?',
    audience:         'Adults without dental insurance searching for a local in-house plan',
    safeAnswer:
      'An in-house dental membership plan is offered and managed by an individual dental practice — not by an insurer or a third-party network. DAP helps patients find which dental practices near them offer these plans. Search the DAP directory to see confirmed providers in your area, or submit a request if none are currently available near you.',
    primaryCtaLogic: 'Show search CTA → confirmed provider if available. Otherwise: request flow.',
    requiredFacts: [
      'In-house dental membership plans are offered directly by individual dental practices',
      'DAP helps patients find which practices offer these plans — DAP does not offer a plan itself',
      'Confirmed DAP providers are the only practices where patients can view specific plan details',
      'Not every dentist offers an in-house plan — availability is practice-specific',
    ],
    forbiddenClaims: [
      '"Dental membership plans near you" — only confirmed providers have active plans in the directory',
      '"In-house plans available at dentists near you" — cannot be stated without confirmed provider data',
      '"DAP membership plans available nationwide" — pilot region only',
      'Universal membership plan availability claims',
    ],
    seoTitle:       'Dental Membership Plan Near Me — Dental Advantage Plan',
    seoDescription: 'Search the DAP directory for in-house dental membership plans in your area, or submit a request if no participating dentist is currently listed.',
    secondaryCta:   { label: 'Browse the directory', href: DIRECTORY },
    relatedCitySlugs:     [...ALL_CITIES],
    relatedPracticeSlugs: [],
    publicClaimLevel:     'none',
  },
  {
    slug:             'affordable-dentist-without-insurance-san-diego',
    queryIntent:      'patient in San Diego seeking affordable dental care without insurance',
    decisionQuestion: 'How do I find an affordable dentist without insurance in San Diego?',
    audience:         'Uninsured adults in San Diego County seeking affordable dental care',
    safeAnswer:
      'Options for uninsured patients in San Diego County include dental practices that offer in-house membership plans, dental school clinics at local universities, Federally Qualified Health Centers in the county, and community dental programs. DAP helps you find which San Diego-area dentists offer in-house membership plans through the directory or request service.',
    primaryCtaLogic: 'Show confirmed provider search CTA for San Diego. Otherwise: request flow.',
    requiredFacts: [
      'In-house membership plans at DAP providers are one option — not the only option for uninsured patients',
      'DAP is a directory — it does not provide dental care, pricing guarantees, or financial assistance',
      'Only confirmed DAP providers may be presented as offering a specific in-house plan',
      'Alternative options (dental schools, FQHCs) are not part of the DAP directory',
    ],
    forbiddenClaims: [
      '"DAP guarantees affordable care in San Diego" — pricing set by each practice',
      '"All San Diego dentists offer DAP" — only confirmed providers participate',
      '"DAP is the most affordable dental option in San Diego" — depends on individual needs and providers',
      'Specific cost comparisons without confirmed provider source',
    ],
    seoTitle:       'Affordable Dentist Without Insurance in San Diego — Dental Advantage Plan',
    seoDescription: 'Find affordable dental care in San Diego without insurance — including dentists with in-house membership plans through the DAP directory.',
    secondaryCta:   { label: 'Browse San Diego', href: `${CITY_BASE}/san-diego` },
    relatedCitySlugs:     ['san-diego', 'la-mesa', 'chula-vista', 'el-cajon', 'national-city'],
    relatedPracticeSlugs: [CONFIRMED_SLUG],
    publicClaimLevel:     'limited',
  },
  {
    slug:             'how-does-dap-work',
    queryIntent:      'patient seeking to understand how Dental Advantage Plan works',
    decisionQuestion: 'How does Dental Advantage Plan work for patients?',
    audience:         'Adults unfamiliar with DAP who want to understand what it is and how to use it',
    safeAnswer:
      'DAP is a free patient directory that helps uninsured patients find dental practices that offer their own in-house membership plans. Patients can search for confirmed providers in their area, view plan details for confirmed practices, or submit a request if no confirmed provider is near them. Enrollment in a plan is handled directly between the patient and the dental practice — DAP does not process payments or administer any plan.',
    primaryCtaLogic: 'Show search or request CTA — this is an explainer page.',
    requiredFacts: [
      'DAP is a free directory for patients — there is no patient-facing fee to use the directory',
      'Confirmed DAP providers are practices that have chosen to list their in-house plan with DAP',
      'Enrollment in a plan is handled directly with the dental practice, not through DAP',
      'DAP does not process membership payments or administer dental plans',
    ],
    forbiddenClaims: [
      '"DAP administers dental plans" — each plan is administered by the individual dental practice',
      '"Join DAP" — DAP is a directory, not a membership program patients join',
      '"DAP processes your membership payment" — payments go directly to the dental practice',
      '"DAP guarantees plan availability" — only confirmed providers have active listed plans',
    ],
    seoTitle:       'How Does Dental Advantage Plan Work? — DAP',
    seoDescription: 'Learn how Dental Advantage Plan works for patients — a free directory that helps uninsured patients find dentists with in-house membership plans.',
    secondaryCta:   { label: 'Browse the directory', href: DIRECTORY },
    relatedCitySlugs:     [...SD_CITIES],
    relatedPracticeSlugs: [],
    publicClaimLevel:     'none',
  },
  {
    slug:             'what-does-dap-cost-patients',
    queryIntent:      'patient asking about the cost of using or joining DAP',
    decisionQuestion: 'Does DAP cost anything for patients?',
    audience:         'Adults wondering if there is a fee to use the DAP directory or list with DAP',
    safeAnswer:
      'DAP is a free directory service for patients. There is no fee to search the directory, view confirmed provider listings, or submit a request for a dentist in your area. If you join an in-house membership plan at a confirmed DAP practice, the membership fee you pay goes directly to that dental practice — not to DAP. DAP does not collect fees from patients.',
    primaryCtaLogic: 'Route to directory or request flow — reassurance page.',
    requiredFacts: [
      'Using the DAP directory is free for patients — no signup required',
      'Membership fees at confirmed DAP practices go directly to the dental practice',
      'DAP does not charge patients a fee to access directory listings or submit requests',
      'Dental practices, not DAP, set and collect membership plan fees',
    ],
    forbiddenClaims: [
      '"Free dental care through DAP" — DAP is a directory, not a dental payer',
      '"DAP provides free dental procedures" — procedures are provided and priced by the practice',
      '"No cost for dental care at DAP dentists" — plan fees and procedure costs are set by each practice',
      'Any claim that DAP provides dental benefits directly to patients',
    ],
    seoTitle:       'Does DAP Cost Anything for Patients? — Dental Advantage Plan',
    seoDescription: 'Using the DAP directory is free for patients. Learn about how in-house membership plan fees work at confirmed DAP practices.',
    secondaryCta:   { label: 'Browse the directory', href: DIRECTORY },
    relatedCitySlugs:     [...SD_CITIES],
    relatedPracticeSlugs: [],
    publicClaimLevel:     'none',
  },
  {
    slug:             'dap-for-seniors-without-insurance',
    queryIntent:      'senior patient without dental insurance researching in-house membership plan options',
    decisionQuestion: 'Is DAP a good option for seniors without dental insurance?',
    audience:         'Adults 60+ without dental insurance who need regular dental care',
    safeAnswer:
      'For seniors without dental insurance, in-house dental membership plans at participating practices may provide predictable annual costs for preventive care. DAP helps seniors find local dentists that offer these plans. The value depends on the specific practice\'s plan terms, pricing, and what procedures are included. DAP is not affiliated with Medicare, Medicaid, or any government dental program.',
    primaryCtaLogic: 'Show confirmed provider CTA if nearby. Otherwise: request flow.',
    requiredFacts: [
      'DAP is not affiliated with Medicare, Medicaid, or any government dental benefit program',
      'In-house membership plans are offered by individual dental practices — not through government programs',
      'Plan terms and inclusions for senior patients must be confirmed directly with the dental practice',
      'DAP does not provide dental benefits or subsidized care for seniors',
    ],
    forbiddenClaims: [
      '"DAP is a Medicare supplement" — not affiliated with Medicare or Medicaid',
      '"Guaranteed dental coverage for seniors through DAP" — plan terms set by each practice',
      '"DAP replaces Medicare dental coverage" — different product category entirely',
      'Any implication that DAP provides government-subsidized dental benefits',
    ],
    seoTitle:       'DAP for Seniors Without Dental Insurance — Dental Advantage Plan',
    seoDescription: 'Find out how Dental Advantage Plan can help seniors without dental insurance find dentists with in-house membership plans near them.',
    secondaryCta:   { label: 'Browse the directory', href: DIRECTORY },
    relatedCitySlugs:     [...SD_CITIES],
    relatedPracticeSlugs: [],
    publicClaimLevel:     'none',
  },
  {
    slug:             'dap-for-families-without-insurance',
    queryIntent:      'family without dental insurance researching in-house membership plan options',
    decisionQuestion: 'Can families without dental insurance use DAP?',
    audience:         'Families without dental insurance looking for affordable dental care for multiple members',
    safeAnswer:
      'Families without dental insurance can use DAP to find dentists that offer in-house membership plans. Some practices offer separate membership tiers for adults and children, with different annual fees and inclusions for each. Plan terms and whether family or child memberships are available vary by practice. DAP helps you find which local practices offer these plans.',
    primaryCtaLogic: 'Show confirmed provider CTA if nearby (and indicate child membership availability if confirmed). Otherwise: request flow.',
    requiredFacts: [
      'Membership plan terms for families, adults, and children are set by each individual dental practice',
      'Not all in-house plans include separate child membership tiers — terms must be verified with the practice',
      'Only confirmed DAP providers may be presented with specific plan pricing or inclusion details',
      'DAP does not administer family plans or process membership fees for any household',
    ],
    forbiddenClaims: [
      '"DAP covers all family members" — plan terms and inclusions are practice-specific',
      '"Free dental care for children through DAP" — child membership fees are set by the practice',
      '"Family plans guaranteed at all DAP dentists" — availability varies by practice',
      'Specific pricing for child or family memberships without confirmed provider attribution',
    ],
    seoTitle:       'DAP for Families Without Dental Insurance — Dental Advantage Plan',
    seoDescription: 'Find dentists with in-house family membership plans near you through Dental Advantage Plan, and learn how DAP can help families without dental insurance.',
    secondaryCta:   { label: 'Browse the directory', href: DIRECTORY },
    relatedCitySlugs:     [...SD_CITIES],
    relatedPracticeSlugs: [],
    publicClaimLevel:     'none',
  },
]

export function exportDecisionPagesToCmsRecords(): DapDecisionPageCmsRecord[] {
  return SEED_DECISION_PAGES
}

// ─── Treatment-intent pages ───────────────────────────────────────────────────
// Each page answers "How do I get [treatment] without insurance?"
// No specific pricing. No universal coverage claims. Request-flow CTA unless
// a confirmed provider is nearby.

const SEED_TREATMENT_PAGES: DapTreatmentPageCmsRecord[] = [
  {
    slug:             'dental-crown-without-insurance',
    treatment:        'dental crown',
    treatmentQuestion: 'How do I pay for a dental crown without insurance?',
    audience:         'Adults without insurance who need a dental crown',
    safeAnswer:
      'Options for patients needing a dental crown without insurance include in-house dental membership plans at participating practices — which may offer a discount on restorative procedures — dental school clinics that provide reduced-fee crown work, and third-party dental financing. If a confirmed DAP provider offers a plan near you, you can inquire directly with that practice about crown procedure discounts under their plan.',
    requiredFacts: [
      'Crown cost discounts under in-house plans vary by practice and plan terms',
      'Dental school clinics and FQHCs are alternative lower-cost options not affiliated with DAP',
      'Only confirmed DAP providers may be presented with plan details',
      'DAP does not negotiate crown pricing or guarantee discounts on any procedure',
    ],
    forbiddenClaims: [
      '"DAP covers dental crowns" — DAP is a directory, not a payer',
      '"Guaranteed discount on crowns at DAP dentists" — terms vary by practice',
      'Specific crown cost savings without confirmed provider source attribution',
      '"All DAP dentists discount crowns" — plan terms are practice-specific',
    ],
    seoTitle:       'Dental Crown Without Insurance — Dental Advantage Plan',
    seoDescription: 'Find out how to pay for a dental crown without insurance, including in-house membership plans at participating DAP dentists near you.',
    primaryCta:     { label: 'Find a DAP dentist near you', href: REQUEST_FLOW_ROUTE },
    relatedCitySlugs:  ['san-diego', 'la-mesa', 'chula-vista'],
    publicClaimLevel:  'limited',
  },
  {
    slug:             'dental-filling-without-insurance',
    treatment:        'dental filling',
    treatmentQuestion: 'How do I get a dental filling without insurance?',
    audience:         'Adults without insurance who need one or more fillings',
    safeAnswer:
      'Patients needing a dental filling without insurance can inquire about in-house dental membership plans at local practices. Some plans include discounts on restorative procedures such as composite or amalgam fillings. DAP helps patients find dentists that offer these plans near them. If no confirmed DAP provider is in your area, you can submit a request through DAP.',
    requiredFacts: [
      'Filling discounts under in-house plans vary by practice, material type, and plan terms',
      'Only confirmed DAP providers may be presented with specific plan and pricing information',
      'Not all in-house plans include filling discounts — terms must be verified directly with the practice',
      'DAP does not negotiate procedure pricing or guarantee discounts on restorative work',
    ],
    forbiddenClaims: [
      '"DAP covers dental fillings" — DAP is a directory, not a payer',
      '"Guaranteed savings on fillings at DAP dentists" — terms vary by practice',
      'Specific filling cost savings without confirmed provider attribution',
      '"All DAP dentists offer filling discounts" — plan terms are practice-specific',
    ],
    seoTitle:       'Dental Filling Without Insurance — Dental Advantage Plan',
    seoDescription: 'Find out how to pay for dental fillings without insurance, including membership plans at participating DAP dentists near you.',
    primaryCta:     { label: 'Find a DAP dentist near you', href: REQUEST_FLOW_ROUTE },
    relatedCitySlugs:  [...SD_CITIES],
    publicClaimLevel:  'none',
  },
  {
    slug:             'dental-cleaning-without-insurance',
    treatment:        'dental cleaning',
    treatmentQuestion: 'How do I get a dental cleaning without insurance?',
    audience:         'Adults without insurance who need a routine prophylaxis cleaning',
    safeAnswer:
      'Patients without insurance can get preventive cleanings at dental practices that offer in-house membership plans, which often include two cleanings and two exams per year at that practice as part of the plan. DAP helps you find which local dentists offer these plans. If no confirmed DAP provider is near you, submit a request through DAP.',
    requiredFacts: [
      'Cleaning inclusions (number per year, type) in in-house plans vary by practice',
      '"Two cleanings per year" language must be attributed to a specific confirmed provider',
      'Only confirmed DAP providers may be presented with specific plan inclusion details',
      'DAP is a directory — it does not provide dental cleanings or administer any plan',
    ],
    forbiddenClaims: [
      '"Free cleanings at all DAP dentists" — plan terms set per practice',
      '"No copay for cleanings at DAP practices" — only verified at specific confirmed providers',
      '"DAP covers dental cleanings" — DAP is a directory, not a payer',
      '"Two cleanings included at every DAP practice" — plan inclusions are practice-specific',
    ],
    seoTitle:       'Dental Cleaning Without Insurance — Dental Advantage Plan',
    seoDescription: 'Find dentists that include cleanings in their in-house membership plans, or request a DAP dentist near you through Dental Advantage Plan.',
    primaryCta:     { label: 'Find a DAP dentist near you', href: REQUEST_FLOW_ROUTE },
    relatedCitySlugs:  ['san-diego', 'la-mesa', 'chula-vista', 'la-jolla'],
    publicClaimLevel:  'limited',
  },
  {
    slug:             'dental-exam-without-insurance',
    treatment:        'dental exam',
    treatmentQuestion: 'How do I get a dental exam without insurance?',
    audience:         'Adults without insurance who need a routine dental examination',
    safeAnswer:
      'Patients without insurance can get routine dental exams at practices that offer in-house membership plans, which often include annual exams as part of the plan. DAP helps you find which local dentists offer these plans. For patients in areas without a confirmed DAP provider, community health centers and dental school clinics may also offer low-cost or sliding-scale exams.',
    requiredFacts: [
      'Exam inclusions in in-house plans vary by practice — not all plans include the same exam types',
      'Only confirmed DAP providers may be presented with specific plan inclusion details',
      'Community health centers and dental school clinics are alternative options not affiliated with DAP',
      'DAP does not provide dental exams or administer any plan',
    ],
    forbiddenClaims: [
      '"Free dental exams at all DAP dentists" — exam inclusions vary by practice',
      '"No charge for exams at DAP practices" — only verified at specific confirmed providers',
      '"DAP covers dental exams" — DAP is a directory, not a payer',
      '"Annual exams included at every DAP practice" — plan inclusions are practice-specific',
    ],
    seoTitle:       'Dental Exam Without Insurance — Dental Advantage Plan',
    seoDescription: 'Find dentists that include exams in their in-house membership plans, or request a DAP dentist near you through Dental Advantage Plan.',
    primaryCta:     { label: 'Find a DAP dentist near you', href: REQUEST_FLOW_ROUTE },
    relatedCitySlugs:  [...SD_CITIES],
    publicClaimLevel:  'none',
  },
  {
    slug:             'dental-xray-without-insurance',
    treatment:        'dental X-ray',
    treatmentQuestion: 'How do I get dental X-rays without insurance?',
    audience:         'Adults without insurance who need diagnostic dental X-rays',
    safeAnswer:
      'Dental X-rays are often included in in-house membership plans at participating practices, alongside preventive cleanings and exams. DAP helps you find local dentists that offer these plans. If no confirmed DAP provider is near you, dental school clinics and Federally Qualified Health Centers may offer reduced-fee diagnostic services including X-rays.',
    requiredFacts: [
      'X-ray inclusions in in-house plans vary by practice and plan tier',
      'Only confirmed DAP providers may be presented with specific plan inclusion details',
      'Dental school clinics and FQHCs are alternative low-cost options not affiliated with DAP',
      'DAP does not provide diagnostic services or administer any plan',
    ],
    forbiddenClaims: [
      '"Free X-rays at all DAP dentists" — inclusions vary by practice',
      '"Bitewing X-rays included at every DAP practice" — plan terms are practice-specific',
      '"DAP covers dental X-rays" — DAP is a directory, not a payer',
      'Specific X-ray inclusion claims without confirmed provider source',
    ],
    seoTitle:       'Dental X-Rays Without Insurance — Dental Advantage Plan',
    seoDescription: 'Find dentists that include X-rays in their in-house membership plans, or request a DAP dentist near you through Dental Advantage Plan.',
    primaryCta:     { label: 'Find a DAP dentist near you', href: REQUEST_FLOW_ROUTE },
    relatedCitySlugs:  [...SD_CITIES],
    publicClaimLevel:  'none',
  },
  {
    slug:             'deep-cleaning-without-insurance',
    treatment:        'deep cleaning (scaling and root planing)',
    treatmentQuestion: 'How do I pay for a deep cleaning without insurance?',
    audience:         'Adults without insurance who need periodontal scaling and root planing',
    safeAnswer:
      'Deep cleaning — scaling and root planing — is a periodontal procedure that treats gum disease. Some in-house dental membership plans include discounts on periodontal procedures. If a confirmed DAP provider offers a plan that includes periodontal benefits, you can inquire about terms directly with that practice. DAP helps you find these providers or request one near you.',
    requiredFacts: [
      'Periodontal procedure coverage in in-house plans varies significantly by practice',
      'Not all in-house plans include scaling and root planing — terms must be confirmed with the practice',
      'Only confirmed DAP providers may be presented with plan details',
      'DAP does not negotiate periodontal pricing or guarantee coverage for any procedure',
    ],
    forbiddenClaims: [
      '"DAP covers deep cleaning" — DAP is a directory, not a payer',
      '"Guaranteed discount on scaling and root planing" — terms vary by practice',
      'Specific deep cleaning cost savings without confirmed provider attribution',
      '"All DAP dentists offer periodontal discounts" — plan terms are practice-specific',
    ],
    seoTitle:       'Deep Cleaning Without Insurance — Dental Advantage Plan',
    seoDescription: 'Find out how to pay for a dental deep cleaning without insurance, including membership plans at participating DAP dentists near you.',
    primaryCta:     { label: 'Find a DAP dentist near you', href: REQUEST_FLOW_ROUTE },
    relatedCitySlugs:  ['san-diego', 'la-mesa'],
    publicClaimLevel:  'limited',
  },
  {
    slug:             'root-canal-without-insurance',
    treatment:        'root canal',
    treatmentQuestion: 'How do I pay for a root canal without insurance?',
    audience:         'Adults without insurance who need endodontic treatment',
    safeAnswer:
      'A root canal is among the higher-cost dental procedures for uninsured patients. Options include in-house dental membership plans that may offer a discount on endodontic procedures, dental school clinics that perform root canal treatment at reduced fees, and third-party dental financing. DAP helps you find practices that offer in-house membership plans — contact the practice directly to ask about root canal coverage under their plan.',
    requiredFacts: [
      'Endodontic procedure discounts in in-house plans vary by practice and complexity of the case',
      'Dental school clinics are an alternative lower-cost option not affiliated with DAP',
      'Only confirmed DAP providers may be presented with specific plan details',
      'DAP does not negotiate root canal pricing or guarantee coverage for endodontic treatment',
    ],
    forbiddenClaims: [
      '"DAP covers root canal treatment" — DAP is a directory, not a payer',
      '"Guaranteed savings on root canals at DAP dentists" — terms vary by practice',
      'Specific root canal cost savings without confirmed provider source',
      '"All DAP dentists offer endodontic discounts" — plan terms are practice-specific',
    ],
    seoTitle:       'Root Canal Without Insurance — Dental Advantage Plan',
    seoDescription: 'Find out how to pay for a root canal without insurance, including membership plans at participating DAP dentists near you.',
    primaryCta:     { label: 'Find a DAP dentist near you', href: REQUEST_FLOW_ROUTE },
    relatedCitySlugs:  ['san-diego', 'la-mesa'],
    publicClaimLevel:  'limited',
  },
  {
    slug:             'emergency-dental-without-insurance',
    treatment:        'emergency dental care',
    treatmentQuestion: 'How do I handle a dental emergency without insurance?',
    audience:         'Adults without insurance who need urgent or emergency dental treatment',
    safeAnswer:
      'For a dental emergency without insurance, contact local dental practices directly — many accept uninsured patients for emergency treatment. In-house dental membership plans at DAP providers may include emergency exam visits or discounts on urgent care at that specific practice. Community health centers and dental school emergency clinics may also offer same-day or urgent care at reduced fees.',
    requiredFacts: [
      'Emergency care coverage and availability vary by dental practice',
      'In-house membership plan terms for emergency visits must be confirmed directly with the practice',
      'Community health centers and dental school clinics are alternative options not affiliated with DAP',
      'DAP does not provide emergency dental services or guarantee same-day appointment access',
    ],
    forbiddenClaims: [
      '"DAP covers dental emergencies" — DAP is a directory, not a payer',
      '"Guaranteed same-day emergency treatment at DAP dentists" — appointment availability set by each practice',
      '"Free emergency visits at DAP dentists" — plan terms and emergency coverage vary by practice',
      'Specific emergency care cost claims without confirmed provider source',
    ],
    seoTitle:       'Emergency Dental Care Without Insurance — Dental Advantage Plan',
    seoDescription: 'Find out how to handle a dental emergency without insurance, including membership plans at participating DAP dentists and local urgent care resources.',
    primaryCta:     { label: 'Find a DAP dentist near you', href: REQUEST_FLOW_ROUTE },
    relatedCitySlugs:  [...SD_CITIES],
    publicClaimLevel:  'none',
  },
  {
    slug:             'tooth-extraction-without-insurance',
    treatment:        'tooth extraction',
    treatmentQuestion: 'How do I get a tooth extracted without insurance?',
    audience:         'Adults without insurance who need a tooth extraction',
    safeAnswer:
      'Tooth extractions are generally among the more affordable dental procedures even without insurance. Some in-house dental membership plans at participating practices may include simple extractions or offer discounts on oral surgery procedures. DAP helps you find which local dentists offer these plans. Contact the specific practice to ask about extraction coverage under their plan.',
    requiredFacts: [
      'Simple extraction discounts in in-house plans vary by practice and extraction type (simple vs. surgical)',
      'Not all in-house plans include oral surgery procedures — terms must be verified with the practice',
      'Only confirmed DAP providers may be presented with specific plan details',
      'DAP does not negotiate extraction pricing or guarantee coverage for any oral surgery procedure',
    ],
    forbiddenClaims: [
      '"DAP covers tooth extractions" — DAP is a directory, not a payer',
      '"Guaranteed savings on extractions at DAP dentists" — terms vary by practice',
      '"Free simple extractions at DAP practices" — plan terms are practice-specific',
      'Specific extraction cost claims without confirmed provider source',
    ],
    seoTitle:       'Tooth Extraction Without Insurance — Dental Advantage Plan',
    seoDescription: 'Find out how to pay for a tooth extraction without insurance, including membership plans at participating DAP dentists near you.',
    primaryCta:     { label: 'Find a DAP dentist near you', href: REQUEST_FLOW_ROUTE },
    relatedCitySlugs:  [...SD_CITIES],
    publicClaimLevel:  'none',
  },
  {
    slug:             'dental-bridge-without-insurance',
    treatment:        'dental bridge',
    treatmentQuestion: 'How do I pay for a dental bridge without insurance?',
    audience:         'Adults without insurance who need a multi-unit dental bridge',
    safeAnswer:
      'A dental bridge is a multi-unit prosthetic procedure that can be costly without insurance. Options include in-house dental membership plans that may offer a discount on major restorative work, dental school clinics that perform bridge work at reduced fees, and third-party dental financing. DAP helps patients find practices that offer in-house plans — contact the practice directly to ask about bridge procedure discounts under their specific plan.',
    requiredFacts: [
      'Bridge procedure discounts in in-house plans vary by practice, number of units, and plan terms',
      'Dental school clinics are an alternative lower-cost option not affiliated with DAP',
      'Only confirmed DAP providers may be presented with specific plan details and pricing',
      'DAP does not negotiate bridge pricing or guarantee coverage for major restorative work',
    ],
    forbiddenClaims: [
      '"DAP covers dental bridges" — DAP is a directory, not a payer',
      '"Guaranteed savings on bridge work at DAP dentists" — terms vary by practice',
      'Specific bridge cost savings without confirmed provider source',
      '"All DAP dentists discount major restorative procedures" — plan terms are practice-specific',
    ],
    seoTitle:       'Dental Bridge Without Insurance — Dental Advantage Plan',
    seoDescription: 'Find out how to pay for a dental bridge without insurance, including membership plans at participating DAP dentists near you.',
    primaryCta:     { label: 'Find a DAP dentist near you', href: REQUEST_FLOW_ROUTE },
    relatedCitySlugs:  ['san-diego', 'la-mesa'],
    publicClaimLevel:  'limited',
  },
  {
    slug:             'orthodontic-treatment-without-insurance',
    treatment:        'orthodontic treatment',
    treatmentQuestion: 'How do I afford orthodontic treatment without dental insurance?',
    audience:         'Adults and parents without insurance considering braces or clear aligner treatment',
    safeAnswer:
      'Orthodontic coverage in in-house dental membership plans varies by practice — most in-house plans focus on general preventive and restorative care rather than orthodontics. Some general dentistry practices that offer DAP plans may also provide orthodontic consultations at a reduced fee. For comprehensive orthodontic treatment, patients may also consider orthodontic-specific payment plans offered directly by orthodontists.',
    requiredFacts: [
      'In-house dental membership plans typically focus on general dentistry — orthodontic coverage varies widely',
      'Orthodontic procedure discounts under DAP plans must be confirmed directly with the specific practice',
      'Dedicated orthodontists may offer their own in-house payment plans independent of DAP',
      'DAP does not represent or list orthodontic-specific practices as a separate category',
    ],
    forbiddenClaims: [
      '"DAP covers orthodontic treatment" — orthodontic coverage is not standard in DAP plans',
      '"Braces or Invisalign included in all DAP membership plans" — plan terms are practice-specific',
      '"All DAP dentists offer orthodontic discounts" — coverage varies significantly by practice',
      'Specific orthodontic cost claims without confirmed provider source',
    ],
    seoTitle:       'Orthodontic Treatment Without Insurance — Dental Advantage Plan',
    seoDescription: 'Learn about options for orthodontic treatment without insurance, and find general dentists with in-house membership plans through Dental Advantage Plan.',
    primaryCta:     { label: 'Find a DAP dentist near you', href: REQUEST_FLOW_ROUTE },
    relatedCitySlugs:  [...SD_CITIES],
    publicClaimLevel:  'none',
  },
]

export function exportTreatmentPagesToCmsRecords(): DapTreatmentPageCmsRecord[] {
  return SEED_TREATMENT_PAGES
}

// ─── Mock source bundle ───────────────────────────────────────────────────────
// Converts current mock/fixture data into DapCmsSourceBundle format so it can
// flow through buildDapCmsSnapshotFromSource() — the same path future Supabase
// data will use. Gate convention: confirmed providers get all gates open;
// all other statuses get closed gates.

export function buildMockSourceBundle(): DapCmsSourceBundle {
  const practices = ALL_PREVIEW_PRACTICES.map(p => {
    const isConfirmed = p.provider_status === 'confirmed_dap_provider'
    return {
      id:                    p.id,
      name:                  p.practiceName,
      city:                  p.city,
      county:                COUNTY,
      state:                 STATE,
      zip:                   p.zip,
      provider_status:       p.provider_status,
      page_slug:             getDentistSlug(p) ?? null,
      offer_terms_validated: isConfirmed,
      cta_gate_unlocked:     isConfirmed,
      adult_annual_fee:      isConfirmed ? CONFIRMED_PRICING.adult : null,
      child_annual_fee:      isConfirmed ? CONFIRMED_PRICING.child : null,
      offer_source:          isConfirmed ? CONFIRMED_PRICING.source : null,
      published:             true,
      forbidden_claims:      [] as string[],
    }
  })

  const cities = DAP_CITY_PAGES.map(c => ({
    slug:        c.slug,
    city_name:   c.name,
    county_name: COUNTY,
    state:       STATE,
    published:   true,
  }))

  const decisionPages = SEED_DECISION_PAGES.map(d => ({
    slug:                   d.slug,
    query_intent:           d.queryIntent,
    decision_question:      d.decisionQuestion,
    audience:               d.audience,
    safe_answer:            d.safeAnswer,
    primary_cta_logic:      d.primaryCtaLogic,
    required_facts:         d.requiredFacts,
    forbidden_claims:       d.forbiddenClaims,
    seo_title:              d.seoTitle,
    seo_description:        d.seoDescription,
    secondary_cta_label:    d.secondaryCta?.label ?? null,
    secondary_cta_href:     d.secondaryCta?.href ?? null,
    related_city_slugs:     d.relatedCitySlugs,
    related_practice_slugs: d.relatedPracticeSlugs,
    public_claim_level:     d.publicClaimLevel,
    published:              true,
  }))

  const treatmentPages = SEED_TREATMENT_PAGES.map(t => ({
    slug:               t.slug,
    treatment:          t.treatment,
    treatment_question: t.treatmentQuestion,
    audience:           t.audience,
    safe_answer:        t.safeAnswer,
    required_facts:     t.requiredFacts,
    forbidden_claims:   t.forbiddenClaims,
    seo_title:          t.seoTitle,
    seo_description:    t.seoDescription,
    primary_cta_label:  t.primaryCta.label,
    primary_cta_href:   t.primaryCta.href,
    related_city_slugs: t.relatedCitySlugs,
    public_claim_level: t.publicClaimLevel,
    published:          true,
  }))

  return { practices, cities, decisionPages, treatmentPages }
}

// ─── Full CMS snapshot ────────────────────────────────────────────────────────
// Routes mock data through buildDapCmsSnapshotFromSource() — the same adapter
// future Supabase/CMS data will use. The output shape is identical to the
// previous direct-export implementation.

export function exportDapCmsSnapshot(): DapCmsSnapshot {
  return buildDapCmsSnapshotFromSource(buildMockSourceBundle())
}
