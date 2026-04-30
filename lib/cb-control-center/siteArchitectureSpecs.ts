import type { ArchitecturePageSpec, ArchitectureRisk } from './siteArchitectureTypes'

// ─── DAP Site Architecture Page Specs ────────────────────────────────────────
// Canonical definitions for every page type in the DAP directory/recruitment
// model. These specs drive the eligibility evaluator — they are not page
// templates and do not produce production routes.

export const DAP_ARCHITECTURE_SPECS: ArchitecturePageSpec[] = [
  {
    id: 'homepage',
    label: 'Homepage',
    routePattern: '/',
    audience: 'patients',
    purpose: 'Entry point for patients seeking a dental membership plan. Directs to search (Path 1 / Path 2) or the request flow (Path 3). Never implies all dentists offer DAP.',
    publicVisibility: true,
    requiredTruthFields: ['bt-name', 'bt-category'],
    requiredGates: [],
    allowedProviderStatuses: [],
    blockedProviderStatuses: [],
    allowedCtas: [
      '"Find a DAP Dentist Near Me" — always safe as primary CTA',
      '"Search Near You" — always safe',
      '"Request DAP Availability" — always safe as secondary CTA',
      '"Learn How It Works" — always safe',
    ],
    blockedCtas: [
      '"Join Now" or "Start Membership" as primary — implies DAP is immediately joinable without a confirmed provider context',
      '"Join Plan" without confirmed provider + validated offer terms + CTA gate unlocked',
      '"Get Your Plan" — implies product enrollment at homepage level',
    ],
    allowedClaims: [
      '"Find in-house dental membership plans at participating practices"',
      '"Connect with dentists who offer Dental Advantage Plan"',
      '"Request DAP at your preferred dentist"',
      'General education about in-house dental plans (no practice-specific claims)',
    ],
    forbiddenClaims: [
      '"Dentists near you accept DAP" — unconfirmed',
      '"Join a plan today" — implies immediate availability everywhere',
      'Any network size claims unless confirmed provider count is accurate',
      'Pricing claims unless tied to a specific confirmed practice',
    ],
    requiredModules: ['ZIP / procedure search widget', 'Value proposition copy', 'Navigation to Search and Request paths'],
    riskNotes: [
      'Homepage built with "Join Now" as primary CTA implies plan is joinable anywhere — false before confirmed providers exist',
      '"Dentists near you" language without confirmed provider nearby is a false claim',
    ],
  },

  {
    id: 'search_or_zip_lookup',
    label: 'Search / ZIP Lookup',
    routePattern: '/search or /find',
    audience: 'patients',
    purpose: 'Core directory search. Patient enters ZIP or city. Returns Path 1 (confirmed provider found) or Path 2 (no confirmed provider — demand capture). Never shows unconfirmed practices as DAP results.',
    publicVisibility: true,
    requiredTruthFields: ['bt-category', 'ppt-directory-source'],
    requiredGates: [],
    allowedProviderStatuses: ['confirmed_dap_provider'],
    blockedProviderStatuses: ['not_confirmed', 'recruitment_requested', 'pending_confirmation', 'declined'],
    allowedCtas: [
      '"View plan details" → confirmed provider page (Path 1)',
      '"Request a DAP dentist in your area" → /request-dap (Path 2)',
      '"Tell us which dentist you want" → /request-dap with dentist param (Path 3)',
    ],
    blockedCtas: [
      '"Join plan" in search results — requires confirmed provider + offer terms + CTA gate',
      '"Book appointment" — DAP does not manage appointments',
      'Any CTA implying unconfirmed practices offer DAP',
    ],
    allowedClaims: [
      'Show confirmed provider badge on confirmed providers only',
      '"We do not yet have a confirmed DAP dentist in your area" — honest Path 2 message',
      '"Request DAP near you" — demand capture, no plan-availability implied',
    ],
    forbiddenClaims: [
      'Showing unconfirmed / pending / declined practices as search results',
      '"Dentists in [city] offer DAP" — unless all shown practices are confirmed',
      '"X dentists near you" — implies a network of available practices',
      'Any pricing or plan details for unconfirmed practices',
    ],
    requiredModules: ['ZIP/procedure search input', 'Path 1 result card (confirmed provider)', 'Path 2 demand capture panel', 'Path 3 specific-dentist request entry'],
    riskNotes: [
      'Showing all SD County directory practices as results implies they all offer DAP — false for all but Olaes',
      'Mixing confirmed and unconfirmed practices in the same result set destroys trust and accuracy',
    ],
  },

  {
    id: 'city_landing_page',
    label: 'City / ZIP Demand Page',
    routePattern: '/dental-savings-plans/[city-or-zip]',
    audience: 'patients',
    purpose: 'SEO-targeted landing pages for city or ZIP searches. Shows confirmed providers if any exist. Captures demand if none. Does not claim DAP coverage in areas without confirmed providers.',
    publicVisibility: true,
    requiredTruthFields: ['dlt-source', 'dlt-geo-scope', 'pdt-request-flow'],
    requiredGates: [
      'Request flow (eb-003) confirmed before full demand-capture CTA can be shown',
    ],
    allowedProviderStatuses: ['confirmed_dap_provider'],
    blockedProviderStatuses: ['not_confirmed', 'recruitment_requested', 'pending_confirmation', 'declined'],
    allowedCtas: [
      '"Find a DAP Dentist in [City]" — if confirmed provider exists in that city',
      '"Request DAP availability in [City]" — always safe for cities with no confirmed provider',
      '"Notify me when DAP is available near [ZIP]" — demand capture',
    ],
    blockedCtas: [
      '"Join a dental plan in [City]" — implies broad availability',
      '"Dentists in [City] offer DAP" — unless confirmed providers exist in that city',
    ],
    allowedClaims: [
      '"No confirmed DAP dentist in [City] yet — request one here" — honest',
      '"[Practice Name] offers DAP in [City]" — only if that practice is confirmed_dap_provider',
      'General information about what DAP is (no city-specific plan availability claims)',
    ],
    forbiddenClaims: [
      '"DAP is available in [City]" unless a confirmed provider exists there',
      '"Dentists in [City] offer dental savings plans" — unconfirmed',
      'Listing unconfirmed practices as if they participate in DAP',
      'Pricing or plan details without confirmed provider in that city',
    ],
    requiredModules: ['City/ZIP header with honest availability status', 'Confirmed provider card if exists', 'Demand capture form if none confirmed', 'Link to how_it_works_guide'],
    riskNotes: [
      'City pages claiming "DAP dentists in [City]" without confirmed providers makes a false coverage claim',
      'Publishing before request flow is confirmed means the demand-capture form has no defined follow-up path',
    ],
  },

  {
    id: 'confirmed_provider_page',
    label: 'Confirmed Provider Page',
    routePattern: '/practice/[slug]',
    audience: 'patients',
    purpose: 'Practice-specific page for a confirmed DAP provider. Shows plan details, pricing, and enrollment CTA. Uses Template A. "Join plan" CTA requires all three gates: provider confirmed + offer terms validated + CTA gate unlocked.',
    publicVisibility: true,
    requiredTruthFields: ['ppt-confirmed-list', 'ppt-confirmation-method', 'per-confirmed-provider-page', 'pcs-confirmed-provider'],
    requiredGates: [
      'provider_status = confirmed_dap_provider (eb-001)',
      'Offer terms validated from current brochure (eb-002) — required before "Join plan" CTA',
      '"Join plan" CTA gate documented (eb-004) — required before "Join plan" CTA',
    ],
    allowedProviderStatuses: ['confirmed_dap_provider'],
    blockedProviderStatuses: ['not_confirmed', 'recruitment_requested', 'pending_confirmation', 'declined'],
    allowedCtas: [
      '"View plan details" — allowed when provider_status = confirmed_dap_provider',
      '"Join plan" — allowed ONLY when all three gates satisfied: provider confirmed + offer validated + CTA gate unlocked',
    ],
    blockedCtas: [
      '"Request DAP at this office" — wrong template, contradicts confirmed status',
      '"Join plan" before offer terms validated and CTA gate unlocked',
      '"Book appointment" — DAP does not manage appointments',
    ],
    allowedClaims: [
      '"DAP is available at [Practice Name]"',
      '"This practice is a confirmed DAP provider"',
      'Specific pricing ($450/yr adult, $350/yr child) — only from confirmed current brochure',
      '"25% off non-covered procedures" — only when offer terms confirmed',
      '"No waiting period" — only when confirmed',
    ],
    forbiddenClaims: [
      'Any pricing or plan details not confirmed from current practice brochure',
      '"Coming soon" — contradicts confirmed status',
      '"Request DAP at this office" — wrong template',
      '"Join plan" before all three gates are satisfied',
    ],
    requiredModules: ['Confirmed DAP Provider badge', 'Plan overview (from confirmed offer terms)', '"View plan details" CTA', '"Join plan" CTA (gated)', 'Required disclaimer'],
    riskNotes: [
      'Building this page before provider_status = confirmed_dap_provider makes a false claim',
      '"Join plan" CTA without offer terms validated implies enrollable terms exist — may not be true',
      'Pricing displayed before current brochure confirmation may be stale',
    ],
  },

  {
    id: 'request_availability_page',
    label: 'Request DAP Availability',
    routePattern: '/request-dap',
    audience: 'patients',
    purpose: 'Demand-capture form for patients in areas without a confirmed DAP provider, or patients who want DAP at their specific dentist. Must never imply the named dentist already offers DAP.',
    publicVisibility: true,
    requiredTruthFields: ['pdt-request-flow', 'pdt-consent', 'pdt-followup'],
    requiredGates: [
      'Patient request flow design confirmed (eb-003)',
      'Consent language for practice outreach confirmed (eb-003)',
      'Follow-up expectation for patients defined (eb-003)',
    ],
    allowedProviderStatuses: ['not_confirmed', 'recruitment_requested', 'pending_confirmation'],
    blockedProviderStatuses: ['confirmed_dap_provider', 'declined'],
    allowedCtas: [
      '"Submit request" — triggers Path 3 request flow',
      '"Notify me when available" — demand capture without outreach',
    ],
    blockedCtas: [
      '"Join plan" — plan is not available at the requested practice',
      '"Enroll now" — implies availability',
      '"Book with this dentist" — DAP does not manage appointments',
    ],
    allowedClaims: [
      '"Request this dentist to offer a Dental Advantage Plan"',
      '"We will contact this practice on your behalf"',
      '"This does not guarantee the dentist will participate"',
      '"We will notify you if they join"',
    ],
    forbiddenClaims: [
      '"Your dentist will offer DAP" — no guarantee',
      '"DAP is coming to [practice name]" — premature',
      '"This dentist is interested in DAP" — no basis',
      'Any pricing or savings claims for the requested practice',
      'Any implication that the request creates an obligation on the practice',
    ],
    requiredModules: ['ZIP / dentist name input', 'Consent checkbox', 'Honest expectation message', 'Confirmation email trigger'],
    riskNotes: [
      'Publishing this page before request flow is confirmed means no defined follow-up path — patient submitted, nothing happens',
      'Showing the requested dentist\'s name without "not yet confirmed" language implies DAP relationship',
    ],
  },

  {
    id: 'how_it_works_guide',
    label: 'How It Works / Patient Guide',
    routePattern: '/guide or /how-it-works',
    audience: 'patients',
    purpose: 'Education page explaining what an in-house dental membership plan is, how DAP works, and how to use the directory to find or request a dentist. No provider-specific claims.',
    publicVisibility: true,
    requiredTruthFields: ['bt-name', 'bt-category', 'ot-product'],
    requiredGates: [],
    allowedProviderStatuses: [],
    blockedProviderStatuses: [],
    allowedCtas: [
      '"Search Near You" → search page',
      '"Request DAP at Your Dentist" → request page',
      '"Find a Confirmed DAP Dentist" → search page',
    ],
    blockedCtas: [
      '"Join Now" — no specific confirmed provider context',
      '"Start My Membership" — no enrollment without confirmed provider',
    ],
    allowedClaims: [
      'General explanation of in-house dental membership plans',
      '"No insurance required"',
      '"Each practice sets its own pricing"',
      '"Find a participating dentist or request DAP at your dentist"',
      'Required disclaimer verbatim',
    ],
    forbiddenClaims: [
      'Any claim implying DAP is broadly available ("dentists across San Diego offer DAP")',
      'Any specific pricing claim without confirmed practice attribution',
      '"Insurance alternative" or "dental benefits"',
    ],
    requiredModules: ['Plan explainer copy', 'How to find a dentist steps', 'Required disclaimer', 'Navigation to search and request paths'],
    riskNotes: [
      'Low risk — education-only content, no provider or pricing claims required',
    ],
  },

  {
    id: 'dentist_recruitment_page',
    label: 'For Dentists / Practice Enrollment',
    routePattern: '/for-dentists',
    audience: 'practices',
    purpose: 'B2B landing page for dental practices. Explains the DAP program, the $199/mo listing fee, and the enrollment process. Recruits practices to become confirmed DAP providers.',
    publicVisibility: true,
    requiredTruthFields: ['bt-name', 'bt-entity', 'ot-product'],
    requiredGates: [],
    allowedProviderStatuses: [],
    blockedProviderStatuses: [],
    allowedCtas: [
      '"Enroll Your Practice" → practice enrollment form',
      '"Learn About the DAP Program"',
      '"Request More Information"',
    ],
    blockedCtas: [
      'Any patient-facing enrollment CTAs',
      '"Join plan" — wrong audience',
    ],
    allowedClaims: [
      '"$199/month per location — flat fee"',
      '"Listing + HR director outreach + monthly newsletter + patient lead routing"',
      '"Add your practice to the DAP directory"',
      'Patient demand signals in the practice\'s area (aggregate, anonymized)',
    ],
    forbiddenClaims: [
      '"Hundreds of patients waiting to join your plan" — unverified',
      '"Guaranteed patient growth" — cannot be promised',
      '"Insurance replacement" — compliance violation',
      '"Network of [X] dentists" — must use accurate confirmed count only',
    ],
    requiredModules: ['Value proposition for practices', 'Enrollment form', 'Program explainer', 'CAN-SPAM compliant email capture'],
    riskNotes: [
      'Low risk — B2B page, no patient-facing DAP availability implied',
      'Patient demand claims must use real aggregate data — do not fabricate demand signals',
    ],
  },

  {
    id: 'internal_only_practice_record',
    label: 'Internal Practice Record (Declined / Suppressed)',
    routePattern: '(no public route)',
    audience: 'internal',
    purpose: 'Internal CRM record for practices that have declined DAP, been suppressed, or are under internal review. Never public. Never accessible by patients. Patient searches treat the area as if the practice does not exist in DAP\'s system.',
    publicVisibility: false,
    requiredTruthFields: ['per-declined-practice'],
    requiredGates: ['Declined routing process documented (eb-005)'],
    allowedProviderStatuses: ['declined'],
    blockedProviderStatuses: ['confirmed_dap_provider', 'not_confirmed', 'recruitment_requested', 'pending_confirmation'],
    allowedCtas: [],
    blockedCtas: [
      'All patient-facing CTAs',
      'Any CTA implying DAP relationship',
    ],
    allowedClaims: [
      'Internal notes only',
      'Recruitment outcome record (for internal use)',
    ],
    forbiddenClaims: [
      'Any patient-facing disclosure of decline reason',
      'Any patient-facing label indicating the practice declined',
      'Any page accessible at a public URL',
    ],
    requiredModules: ['Internal CRM record', 'Routing suppression flag'],
    riskNotes: [
      'High risk if a page is built at a public URL for a declined practice',
      'High risk if the declined status is surfaced to patients — damages practice relationships',
      'If declined routing (eb-005) is not documented, do not record any practice declines',
    ],
  },
]

// ─── Architecture Risks ───────────────────────────────────────────────────────

export const DAP_ARCHITECTURE_RISKS: ArchitectureRisk[] = [
  {
    id: 'risk-001',
    severity: 'high',
    pageType: 'homepage',
    description: 'Homepage uses "Join Now" as primary CTA before provider and offer gates are satisfied.',
    condition: 'confirmed provider does not exist OR offer terms are not validated',
    resolution: 'Replace primary CTA with "Find a DAP Dentist Near Me" until all three gates are confirmed. "Join plan" is only valid within a confirmed provider page context.',
  },
  {
    id: 'risk-002',
    severity: 'high',
    pageType: 'search_or_zip_lookup',
    description: 'Search results show unconfirmed, pending, or recruitment_requested practices as DAP providers.',
    condition: 'Any practice with non-confirmed status appears in patient-visible search results',
    resolution: 'Filter results to confirmed_dap_provider only. All others trigger Path 2 (demand capture).',
  },
  {
    id: 'risk-003',
    severity: 'high',
    pageType: 'internal_only_practice_record',
    description: 'Declined practice has a publicly accessible URL.',
    condition: 'provider_status = declined AND a pageSlug or public route exists',
    resolution: 'Remove any public route for declined practices. Patient searches must return Path 2 as if the practice is not in the system.',
  },
  {
    id: 'risk-004',
    severity: 'high',
    pageType: 'confirmed_provider_page',
    description: '"Join plan" CTA appears on confirmed provider page before offer terms are validated.',
    condition: 'provider_status = confirmed_dap_provider AND (offer terms not validated OR CTA gate not unlocked)',
    resolution: 'Show "View plan details" only until both eb-002 and eb-004 are resolved. Never show "Join plan" based on provider status alone.',
  },
  {
    id: 'risk-005',
    severity: 'medium',
    pageType: 'city_landing_page',
    description: 'City page claims DAP coverage or lists dentists as offering DAP in areas without a confirmed provider.',
    condition: 'city_landing_page exists for a city with 0 confirmed_dap_provider records',
    resolution: 'City pages in areas without confirmed providers must use demand-capture framing only: "No confirmed DAP dentist in [City] yet — request one."',
  },
  {
    id: 'risk-006',
    severity: 'medium',
    pageType: 'confirmed_provider_page',
    description: 'Pricing claims appear before current practice brochure is confirmed.',
    condition: 'offer terms not validated from current brochure (eb-002 open)',
    resolution: 'Do not publish specific pricing ($450/yr, 25% off) until offer terms are confirmed from the current practice-approved brochure.',
  },
  {
    id: 'risk-007',
    severity: 'medium',
    pageType: 'request_availability_page',
    description: 'Request availability page is live but request flow has no confirmed follow-up path.',
    condition: 'request_availability_page is published AND eb-003 is still open',
    resolution: 'Do not publish the full request flow until consent language and follow-up expectation are confirmed (eb-003). Publish "notify me" demand capture only.',
  },
  {
    id: 'risk-008',
    severity: 'low',
    pageType: 'city_landing_page',
    description: 'City page claims broad DAP coverage where only one confirmed provider exists.',
    condition: 'city page uses "dentists in [city] offer DAP" when only 1 confirmed provider exists in that city',
    resolution: 'Name the confirmed provider explicitly. Do not imply a network. "Irene Olaes DDS offers DAP in La Mesa" is accurate. "DAP dentists in San Diego" is not.',
  },
]
