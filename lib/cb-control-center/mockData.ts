import type {
  BusinessRecord,
  PipelineStage,
  CrawlOutput,
  CurrentCommand,
  BusinessTruthRecord,
  StrategyRecord,
  PagePlanItem,
  ActivityEvent,
  InitialInput,
  TruthSection,
  EnrichedBlocker,
  FieldStatus,
  DentistPageTemplate,
  MockDentistPage,
  ProviderStatus,
  ProviderStatusSpec,
  SearchPathRule,
  DapPageTypeSpec,
} from './types'

// ─── Business Truth Schema (7 sections, 36 fields) ───────────────────────────
// This is the canonical record that gates all downstream publishing decisions.
// Each section maps to a specific truth domain. Page Eligibility Rules are
// derived from the other six sections — they reflect what is safe to publish,
// not raw facts.

function schemaReadiness(schema: TruthSection[]): number {
  const total = schema.reduce((n, s) => n + s.fields.length, 0)
  const confirmed = schema.reduce(
    (n, s) => n + s.fields.filter(f => f.status === 'confirmed').length,
    0
  )
  return total > 0 ? Math.round((confirmed / total) * 100) : 0
}

export const MOCK_BUSINESS_TRUTH_SCHEMA: TruthSection[] = [
  {
    id: 'business-truth',
    name: 'Business Truth',
    fields: [
      { id: 'bt-name',     label: 'Brand Name',         value: 'Dental Advantage Plan',                             status: 'confirmed' },
      { id: 'bt-entity',   label: 'Operating Entity',   value: 'MK153 INC (California corporation)',                status: 'confirmed' },
      { id: 'bt-category', label: 'Category',           value: 'Dental savings directory + patient demand capture',  status: 'confirmed' },
      { id: 'bt-website',  label: 'Source Website',     value: 'dentaladvantageplan.vercel.app',                    status: 'confirmed' },
    ],
  },
  {
    id: 'offer-truth',
    name: 'Offer Truth',
    fields: [
      {
        id: 'ot-product',
        label: 'Core Product',
        value: 'Patient aggregator of in-house dental membership plans at participating practices. DAP collects nothing from patients — $49/mo per-practice listing fee only.',
        status: 'confirmed',
      },
      {
        id: 'ot-adult-fee',
        label: 'Adult Annual Fee (Per Practice)',
        value: '$450/year — confirmed, Irene Olaes DDS (source: plan PDF)',
        status: 'confirmed',
      },
      {
        id: 'ot-child-fee',
        label: 'Child Annual Fee (Per Practice)',
        value: '$350/year per child age 17 and under — confirmed, Irene Olaes DDS',
        status: 'confirmed',
      },
      { id: 'ot-discount',    label: 'Discount Rate',                  value: null, status: 'needs_confirmation' },
      {
        id: 'ot-inclusions',
        label: 'Plan Inclusions',
        value: '2 cleanings, 2 exams, 1 set of X-rays per year — zero copay at checkout (from plan PDF, brochure confirmation pending)',
        status: 'needs_confirmation',
      },
      { id: 'ot-exclusions', label: 'Plan Exclusions',               value: null, status: 'missing' },
      { id: 'ot-activation', label: 'Activation Timing',             value: null, status: 'missing' },
      { id: 'ot-renewal',    label: 'Renewal / Cancellation Terms',  value: null, status: 'missing' },
    ],
  },
  {
    id: 'provider-participation-truth',
    name: 'Provider Participation Truth',
    fields: [
      {
        id: 'ppt-confirmed-count',
        label: 'Confirmed DAP Providers',
        value: '1 — Irene Olaes DDS (La Mesa, CA). No other confirmed DAP providers on record.',
        status: 'needs_confirmation',
      },
      {
        id: 'ppt-confirmed-list',
        label: 'Confirmed Provider List',
        value: 'Irene Olaes DDS — agreed to DAP listing. Confirmation method and date not yet documented.',
        status: 'needs_confirmation',
      },
      { id: 'ppt-confirmation-method', label: 'Confirmation Method',                              value: null, status: 'missing' },
      { id: 'ppt-confirmation-date',   label: 'Last Confirmation Date',                           value: null, status: 'missing' },
      { id: 'ppt-directory-source',    label: 'Public Directory Source',                          value: 'San Diego County public dental practice dataset', status: 'needs_confirmation' },
      { id: 'ppt-target-count',        label: 'Unconfirmed / Target Practices in Dataset',        value: null, status: 'missing' },
    ],
  },
  {
    id: 'directory-listing-truth',
    name: 'Directory Listing Truth',
    fields: [
      { id: 'dlt-source',     label: 'Public Dataset Source',    value: 'San Diego County public dental practice registry', status: 'needs_confirmation' },
      { id: 'dlt-record-count', label: 'Total Records',          value: null, status: 'missing' },
      { id: 'dlt-geo-scope',  label: 'Geographic Scope',         value: 'San Diego County, California', status: 'needs_confirmation' },
      { id: 'dlt-freshness',  label: 'Data Freshness',           value: null, status: 'missing' },
      { id: 'dlt-dedup',      label: 'Deduplication Method',     value: null, status: 'missing' },
    ],
  },
  {
    id: 'patient-demand-truth',
    name: 'Patient Demand Truth',
    fields: [
      {
        id: 'pdt-demand-signals',
        label: 'Demand Signals Captured',
        value: 'ZIP-code and procedure search on DAP homepage (live). Redirects to /v5/request-dap when no matching provider found.',
        status: 'confirmed',
      },
      { id: 'pdt-request-flow', label: 'Request / Waitlist Flow',                  value: null, status: 'needs_confirmation' },
      { id: 'pdt-consent',      label: 'Consent Language for Practice Outreach',   value: null, status: 'missing' },
      { id: 'pdt-followup',     label: 'Follow-Up Expectation for Requestors',     value: null, status: 'missing' },
    ],
  },
  {
    id: 'publishing-claim-safety',
    name: 'Publishing Claim Safety',
    fields: [
      { id: 'pcs-confirmed-provider',   label: 'Confirmed Provider Claim Gate',     value: null, status: 'missing' },
      { id: 'pcs-unconfirmed-practice', label: 'Unconfirmed Practice Claim Gate',   value: null, status: 'missing' },
      {
        id: 'pcs-savings',
        label: 'Savings Claim Gate',
        value: 'Must use "typical" or source attribution — no specific % savings without "pricing set by each practice" caveat.',
        status: 'needs_confirmation',
      },
      {
        id: 'pcs-network',
        label: 'Network Size Claim Gate',
        value: 'Cannot claim a network — only 1 confirmed provider. No "dentists near you" language until additional practices are confirmed.',
        status: 'confirmed',
      },
      { id: 'pcs-compliance', label: 'Compliance Review Status', value: null, status: 'missing' },
      {
        id: 'pcs-join-cta-gate',
        label: '"Join Plan" CTA Gate',
        value: null,
        status: 'missing',
      },
    ],
  },
  {
    id: 'page-eligibility-rules',
    name: 'Page Eligibility Rules',
    fields: [
      { id: 'per-confirmed-provider-page', label: 'Confirmed DAP Provider Page',      value: null, status: 'blocked' },
      { id: 'per-unconfirmed-practice',    label: 'Unconfirmed / Target Practice Page', value: null, status: 'blocked' },
      { id: 'per-city-zip-page',           label: 'City / ZIP Demand Page',            value: null, status: 'blocked' },
      {
        id: 'per-education-page',
        label: 'Education / Decision Page',
        value: 'Eligible — can be built from confirmed facts only. No provider claims, no network claims, no confirmed pricing claims. Routes users into search and request flows.',
        status: 'confirmed',
      },
      {
        id: 'per-declined-practice',
        label: 'Declined Practice Routing',
        value: null,
        status: 'missing',
      },
    ],
  },
]

// ─── Blocker Resolution Patches ───────────────────────────────────────────────
// Defines exactly what schema fields change when each blocker is confirmed or
// deferred. Applied in SimulationShell for live mock resolution.

export const BLOCKER_RESOLUTION_PATCHES: Record<string, {
  confirm: Record<string, { status: FieldStatus; value?: string }>
  defer:   Record<string, { status: FieldStatus; value?: string }>
}> = {
  'eb-001': {
    confirm: {
      'ppt-confirmed-count':       { status: 'confirmed', value: '1 confirmed — Irene Olaes DDS (La Mesa, CA). Additional practices pending enrollment.' },
      'ppt-confirmed-list':        { status: 'confirmed', value: 'Irene Olaes DDS — confirmed via signed practice agreement, April 2026' },
      'ppt-confirmation-method':   { status: 'confirmed', value: 'Signed practice agreement' },
      'ppt-confirmation-date':     { status: 'confirmed', value: 'April 2026' },
      'per-confirmed-provider-page': { status: 'confirmed', value: 'Provider participation confirmed. Eligible for confirmed-provider page review, but Join Plan CTA remains blocked until offer terms are validated and the CTA gate is unlocked.' },
      'per-unconfirmed-practice':  { status: 'confirmed', value: 'Safe to publish — use "Request DAP at this office" CTA. No "Join plan", pricing, or plan-availability language on unconfirmed practices.' },
      'pcs-confirmed-provider':    { status: 'confirmed', value: '"DAP is available at this practice" — only on pages with a signed practice agreement on file. No enrollment CTAs until offer terms are validated.' },
      'pcs-unconfirmed-practice':  { status: 'confirmed', value: '"Request DAP at this office" — no plan availability implied. No pricing claims.' },
    },
    defer: {
      'ppt-confirmed-count':       { status: 'confirmed', value: '1 confirmed — Irene Olaes DDS (La Mesa, CA). Scoped to Olaes only for launch; broader list deferred.' },
      'ppt-confirmed-list':        { status: 'confirmed', value: 'Irene Olaes DDS — scoped to launch. Confirmation documentation deferred.' },
      'ppt-confirmation-method':   { status: 'needs_confirmation', value: 'Deferred — will document confirmation method post-launch' },
      'ppt-confirmation-date':     { status: 'needs_confirmation', value: 'April 2026 (approximate)' },
      'per-confirmed-provider-page': { status: 'confirmed', value: 'Provider participation deferred to Olaes only. Page eligible for confirmed-provider review. Join Plan CTA remains blocked until offer terms are validated and CTA gate is unlocked.' },
      'per-unconfirmed-practice':  { status: 'confirmed', value: 'Safe to publish — use "Request DAP at this office" CTA only. No plan-availability language.' },
      'pcs-confirmed-provider':    { status: 'needs_confirmation', value: '"DAP is available at Irene Olaes DDS" — deferred confirmation documentation. Disclaimer required. No enrollment CTAs until offer terms validated.' },
      'pcs-unconfirmed-practice':  { status: 'confirmed', value: '"Request DAP at this office" — no plan availability implied.' },
    },
  },
  'eb-002': {
    confirm: {
      'ot-discount':    { status: 'confirmed', value: '25% off all non-covered procedures — confirmed via current plan brochure. ClearCorrect $1,000 off; Bleaching $100 off.' },
      'ot-inclusions':  { status: 'confirmed', value: '2 cleanings, 2 exams, 1 set of X-rays per year — zero copay at checkout. Confirmed via current plan brochure.' },
      'ot-exclusions':  { status: 'confirmed', value: 'Orthodontic treatment not included. Implants not included. See current plan brochure for full exclusion list.' },
      'ot-activation':  { status: 'confirmed', value: 'Immediate — plan is active at the practice on the day of enrollment.' },
      'ot-renewal':     { status: 'confirmed', value: 'Annual per member. No auto-renewal. Cancellation allowed at renewal date.' },
      'pcs-savings':    { status: 'confirmed', value: 'Confirmed: cite "25% off non-covered procedures at participating practices" with "pricing set by each practice" caveat.' },
    },
    defer: {
      'ot-discount':    { status: 'needs_confirmation', value: '25% off non-covered procedures (from plan PDF — brochure confirmation pending; use "typical" language until confirmed)' },
      'ot-inclusions':  { status: 'needs_confirmation', value: '2 cleanings, 2 exams, 1 set of X-rays (from plan PDF — brochure confirmation pending)' },
      'ot-exclusions':  { status: 'needs_confirmation' },
      'ot-activation':  { status: 'needs_confirmation' },
      'ot-renewal':     { status: 'needs_confirmation' },
      'pcs-savings':    { status: 'needs_confirmation', value: 'Deferred — use "typical savings" language and attribute to plan PDF until full brochure confirmed.' },
    },
  },
  'eb-003': {
    confirm: {
      'pdt-request-flow': { status: 'confirmed', value: 'Patient submits ZIP + preferred dentist + procedure via /request-dap. DAP outreaches to dentist within 48h. Patient receives email confirmation.' },
      'pdt-consent':      { status: 'confirmed', value: '"By submitting, you agree to allow DAP to contact your preferred dental practice on your behalf."' },
      'pdt-followup':     { status: 'confirmed', value: 'Patient receives email confirmation within 1 hour. DAP update within 5 business days.' },
      'per-city-zip-page':{ status: 'confirmed', value: 'Safe to publish — shows confirmed providers if any exist, otherwise captures demand via /request-dap. "Request DAP near me" / "Notify me when available" CTA.' },
    },
    defer: {
      'pdt-request-flow': { status: 'needs_confirmation', value: '/request-dap form available — full outreach workflow and timeline deferred' },
      'pdt-consent':      { status: 'missing' },
      'pdt-followup':     { status: 'needs_confirmation', value: 'Deferred — communicate timeline to patients once flow is confirmed' },
      'per-city-zip-page':{ status: 'needs_confirmation', value: 'Conditional — publish "notify me when available" demand-capture only. Full request flow blocked until consent language confirmed.' },
    },
  },
  'eb-004': {
    confirm: {
      'pcs-join-cta-gate': { status: 'confirmed', value: '"Join plan" CTA requires TWO gates: (1) provider_status = confirmed_dap_provider AND (2) offer_terms_status = complete. A confirmed provider page without validated offer terms shows "View plan details" only.' },
      'per-confirmed-provider-page': { status: 'confirmed', value: 'Safe to publish — confirmed provider. "Join plan" CTA enabled only when offer_terms_status = complete. Use "View plan details" until offer terms are independently validated.' },
    },
    defer: {
      'pcs-join-cta-gate': { status: 'needs_confirmation', value: 'Deferred — temporarily allow "View plan details" CTA on confirmed provider pages. "Join plan" blocked until offer terms explicitly validated.' },
    },
  },
  'eb-005': {
    confirm: {
      'per-declined-practice': { status: 'confirmed', value: 'Confirmed: declined practices are assigned declined status (internal only). No patient-facing page exists. Patient searches return Path 2 — identical to "no confirmed provider nearby." Decline reason is never disclosed to patients.' },
    },
    defer: {
      'per-declined-practice': { status: 'needs_confirmation', value: 'Deferred — declined practice routing process not yet documented. Do not record any practice declines until this is confirmed.' },
    },
  },
}

// ─── Enriched Blockers ────────────────────────────────────────────────────────

export const MOCK_ENRICHED_BLOCKERS: EnrichedBlocker[] = [
  {
    id: 'eb-001',
    title: 'Provider participation not confirmed beyond Olaes',
    severity: 'high',
    relatedSection: 'Provider Participation Truth',
    affectedFields: ['Confirmed DAP Providers', 'Confirmed Provider List', 'Confirmation Method', 'Last Confirmation Date', 'Confirmed Provider Page Eligibility', 'Unconfirmed Practice Page Eligibility'],
    description: 'DAP is confirmed for exactly one participating practice — Irene Olaes DDS. The confirmation method and date are not documented. The public directory dataset contains San Diego County dental practices, but none are confirmed DAP providers. Pages for unconfirmed practices must use "Request DAP at this office" language only — not "Join plan" or "DAP available now."',
    whyItMatters: 'Publishing a Confirmed DAP Provider Page for any practice not explicitly confirmed makes a false claim and destroys trust. The page type — and the language it permits — depends entirely on whether the practice has a live DAP agreement. This gate cannot be bypassed.',
    requiredEvidence: [
      'Full confirmed provider list with documentation of how each was confirmed',
      'Confirmation method (e.g., signed agreement, email confirmation, phone call with record)',
      'Date each practice was last confirmed',
      'Whether Irene Olaes DDS confirmation is still current',
      'Whether any other practices in the San Diego dataset have a DAP relationship',
    ],
    resolutionOptions: [
      { type: 'confirm', label: 'Confirm provider list — document all confirmations' },
      { type: 'defer',   label: 'Defer — scope launch to Olaes only with disclaimer pending full list' },
    ],
    gateCondition: 'Provider Participation Truth must be confirmed or explicitly scoped before any Confirmed DAP Provider Pages can be published. All other practice pages must use Unconfirmed / Target Practice Page type.',
    downstreamUnlockImpact: [
      'Confirmed DAP Provider Page → Eligible to publish',
      'Unconfirmed / Target Practice Page → Safe page type and claim rules defined',
      'Directory listing claim language → Confirmed and safe to generate',
      'Network size claims → Accurate count available',
    ],
    resolutionStatus: 'open',
  },
  {
    id: 'eb-002',
    title: 'Offer terms need final confirmation',
    severity: 'high',
    relatedSection: 'Offer Truth',
    affectedFields: ['Discount Rate', 'Plan Inclusions', 'Plan Exclusions', 'Activation Timing', 'Renewal / Cancellation Terms', 'Savings Claim Gate'],
    description: 'The plan PDF provides base pricing ($450 adult / $350 child) and a discount rate (25% off). However, the full brochure, exclusion language, activation timing, and renewal/cancellation terms have not been confirmed from a current, practice-approved source. Savings claims and decision pages cannot be finalized on partial plan terms.',
    whyItMatters: 'Generating savings copy or decision pages from partial plan terms risks publishing inaccurate claims. The PDF may not reflect the current effective version. Exclusion language and activation rules materially affect the patient decision. Publishing Claim Safety cannot be cleared until offer terms are confirmed.',
    requiredEvidence: [
      'Current approved plan brochure with effective date',
      'Confirmation from Irene Olaes DDS that plan terms are still current',
      'Full exclusion and limitation language',
      'Activation timing — can patient use the plan immediately at enrollment?',
      'Renewal and cancellation terms — annual, no auto-renewal?',
    ],
    resolutionOptions: [
      { type: 'confirm', label: 'Confirm current brochure and enter all confirmed terms' },
      { type: 'defer',   label: 'Defer — publish with PDF-sourced terms and "pending confirmation" disclaimer' },
    ],
    gateCondition: 'Offer Truth must reach confirmed or explicitly deferred status on all fields before savings copy, patient-facing examples, and decision pages can be finalized.',
    downstreamUnlockImpact: [
      'Savings claim language → Safe to finalize',
      'Patient-facing savings example → Unlocked',
      'Plan vs. insurance comparison copy → Unlocked',
      'Core 30 page briefs → Pricing inputs confirmed',
    ],
    resolutionStatus: 'open',
  },
  {
    id: 'eb-003',
    title: 'Patient request / waitlist flow not finalized',
    severity: 'medium',
    relatedSection: 'Patient Demand Truth',
    affectedFields: ['Request / Waitlist Flow', 'Consent Language for Practice Outreach', 'Follow-Up Expectation for Requestors', 'City / ZIP Demand Page Eligibility'],
    description: 'When a user searches a ZIP or city where no confirmed DAP provider exists, there is no confirmed honest next step. The /request-dap form exists but the full flow — including consent language for contacting the patient\'s preferred dentist and the follow-up expectation — is not finalized. Without this, the City / ZIP Demand Page cannot be published safely.',
    whyItMatters: 'Sending a patient into a request flow with no confirmed follow-up path destroys trust. Contacting a dentist on a patient\'s behalf without consent language is a compliance exposure. City / ZIP pages are one of DAP\'s highest-volume page types — this gate must be resolved before launch.',
    requiredEvidence: [
      'Approved request or waitlist flow design (end-to-end)',
      'Consent language for contacting the patient\'s preferred dentist on their behalf',
      'User-facing message for "DAP not yet available near you"',
      'Follow-up expectation — when does the patient hear back?',
      'Practice recruitment workflow and expected timeline',
    ],
    resolutionOptions: [
      { type: 'confirm', label: 'Confirm request flow, consent language, and follow-up expectation' },
      { type: 'defer',   label: 'Defer — publish City / ZIP pages with "notify me" demand capture only (no outreach)' },
    ],
    gateCondition: 'Patient Demand Truth must include a confirmed or explicitly scoped request flow before City / ZIP Demand Pages can be published safely.',
    downstreamUnlockImpact: [
      'City / ZIP Demand Page → Eligible to publish',
      'ZIP search results → Safe for launch in all areas',
      'Practice recruitment workflow → Can be designed',
      'Decision pages → Both available and unavailable-area branches complete',
    ],
    resolutionStatus: 'open',
  },
  {
    id: 'eb-004',
    title: '"Join plan" CTA requires offer terms validation — not provider status alone',
    severity: 'medium',
    relatedSection: 'Publishing Claim Safety',
    affectedFields: ['"Join Plan" CTA Gate', 'Confirmed Provider Page Eligibility'],
    description: 'A practice can be confirmed_dap_provider while offer terms remain unvalidated. The "Join plan" CTA may not appear based on provider status alone. It requires a second, independent gate: offer_terms_status = complete. Without validated offer terms, confirmed provider pages may only show "View plan details" — not "Join plan."',
    whyItMatters: 'A patient clicking "Join plan" must be able to complete enrollment immediately at the practice with accurate terms. If offer terms (pricing, inclusions, exclusions, activation) are not confirmed from a current practice-approved source, presenting a "Join plan" button makes an implicit claim that the terms are ready — which may be false.',
    requiredEvidence: [
      'Current practice-approved brochure or enrollment document with effective date',
      'Confirmation that plan terms are still active and accurate',
      'Documented gate condition: exactly which fields must reach "confirmed" status before "Join plan" CTA is enabled',
      'Decision: which page element shows when offer terms are confirmed vs. still pending',
    ],
    resolutionOptions: [
      { type: 'confirm', label: 'Confirm two-gate CTA rule — document gate condition in Publishing Claim Safety' },
      { type: 'defer',   label: 'Defer — show "View plan details" only on all confirmed provider pages until terms are validated' },
    ],
    gateCondition: '"Join plan" CTA may only appear when BOTH confirmed_dap_provider AND offer_terms_status = complete are true. This gate must be documented in the Truth Schema before any "Join plan" CTA is deployed.',
    downstreamUnlockImpact: [
      '"Join plan" CTA → Eligible to show on confirmed provider pages with validated terms',
      'Enrollment flow → Safely connectable to confirmed provider pages',
      'Conversion tracking → Can be attributed to confirmed, offer-validated practices only',
    ],
    resolutionStatus: 'open',
  },
  {
    id: 'eb-005',
    title: 'Declined practice routing — internal process not documented',
    severity: 'low',
    relatedSection: 'Provider Participation Truth',
    affectedFields: ['Declined Practice Routing'],
    description: 'When a recruited practice declines DAP participation, there is no documented process for what happens next. The declined status must be treated as internal-only — patients must never see a page that discloses a practice\'s refusal or implies DAP was rejected. Patient experience must be identical to "no confirmed provider nearby" (Path 2).',
    whyItMatters: 'Surfacing a declined status to patients (e.g., "This practice has declined DAP") damages practice relationships and creates legal exposure. The practice may have declined for internal reasons and DAP has no right to publish that decision. Patient trust depends on a clean, honest experience: Path 2 is honest; "declined" is not a patient-relevant category.',
    requiredEvidence: [
      'Documented internal definition of declined status and what triggers it',
      'Confirmed: no patient-facing page, label, or badge for declined practices',
      'Routing rule: patient searches that would return a declined practice show Path 2 instead',
      'Internal CRM: how to record a decline, how long before re-engagement is attempted',
    ],
    resolutionOptions: [
      { type: 'confirm', label: 'Confirm declined routing — document internal-only status, no patient disclosure' },
      { type: 'defer',   label: 'Defer — do not record any practice declines until routing process is confirmed' },
    ],
    gateCondition: 'No practice may be marked as declined in the DAP system until the declined routing process is confirmed: (1) internal-only flag, (2) patient sees Path 2, (3) decline never disclosed to patients.',
    downstreamUnlockImpact: [
      'Declined practice handling → Internal process safe to use',
      'CRM state machine → declined status can be added',
      'Recruitment records → Can accurately reflect practice decisions without patient-facing risk',
    ],
    resolutionStatus: 'open',
  },
]

// ─── Provider Status Specs ────────────────────────────────────────────────────
// Per-status behavior table. 5 statuses × 9 behavioral dimensions.
// This is the canonical source of truth for what each status means, what can be
// claimed, and what the patient experiences. Use this to audit any UI change.

export const PROVIDER_STATUS_SPECS: ProviderStatusSpec[] = [
  {
    status: 'confirmed_dap_provider',
    label: 'Confirmed DAP Provider',
    description: 'Signed agreement on file. Practice has accepted DAP terms and is actively participating.',
    appearsInSearch: true,
    canLabelAsOfferingDAP: true,
    allowedClaims: [
      '"DAP is available at this practice"',
      '"Confirmed DAP Provider"',
      'Specific pricing — only if confirmed from current practice brochure',
      '"Join plan" CTA — only when offer_terms_status = complete',
      '"View plan details" CTA — always allowed on confirmed provider pages',
    ],
    forbiddenClaims: [
      '"Request DAP at this office" — wrong template, implies unavailability',
      '"Not yet confirmed" — contradicts status',
      '"Coming soon" — contradicts status',
      '"Join plan" when offer terms are not yet validated',
    ],
    uiTreatment: 'Template A — Confirmed DAP Provider Page. Green "Confirmed DAP Provider" badge. Full pricing display if offer terms confirmed.',
    ctaAllowed: '"Join plan" (requires offer_terms_status = complete) or "View plan details" (always allowed)',
    dapNextAction: 'Maintain active confirmation. Re-verify annually. Update pricing when practice sends new brochure.',
    ifOnlyStatusInArea: 'Patient sees Path 1 — Confirmed provider found. Full plan details shown.',
  },
  {
    status: 'not_confirmed',
    label: 'Not Confirmed',
    description: 'Practice is in the DAP directory dataset but has not been verified as offering a Dental Advantage Plan.',
    appearsInSearch: false,
    canLabelAsOfferingDAP: false,
    allowedClaims: [
      '"Request DAP at this office"',
      '"This practice has not confirmed DAP participation"',
      'General dental education content — no practice-specific pricing',
    ],
    forbiddenClaims: [
      '"DAP available now" — false claim',
      '"Join plan" — plan not available here',
      'Any pricing or savings claims for this practice',
      '"Participating practice" or "DAP provider" — false claim',
    ],
    uiTreatment: 'Template B — demand-capture and request flow only. Not a provider offer page. No plan badges.',
    ctaAllowed: '"Request DAP at this office"',
    dapNextAction: 'Add to recruitment outreach queue. Contact practice about DAP enrollment.',
    ifOnlyStatusInArea: 'Patient sees Path 2 — No confirmed provider nearby. Demand capture form shown.',
  },
  {
    status: 'recruitment_requested',
    label: 'Recruitment Requested',
    description: 'A patient has submitted a request for this practice to offer DAP. DAP outreach is queued or in progress.',
    appearsInSearch: false,
    canLabelAsOfferingDAP: false,
    allowedClaims: [
      '"Request this dentist to offer a Dental Advantage Plan"',
      '"We will contact this practice on your behalf"',
      '"This does not guarantee the dentist will participate"',
      '"We will notify you if they join"',
    ],
    forbiddenClaims: [
      '"DAP is coming to this practice" — premature promise',
      '"This dentist is interested in DAP" — no basis for claim',
      'Any pricing or savings claims for this practice',
      'Any implication that the request creates an obligation on the practice',
    ],
    uiTreatment: 'Template B — same as not_confirmed from patient perspective. Internal dashboard may show request details.',
    ctaAllowed: '"Request DAP at this office" or "Check request status"',
    dapNextAction: 'Complete outreach to practice within 48h of request submission. Record outcome.',
    ifOnlyStatusInArea: 'Patient sees Path 2 — No confirmed provider nearby. Their request is acknowledged.',
  },
  {
    status: 'pending_confirmation',
    label: 'Pending Confirmation',
    description: 'DAP has made contact with the practice and is awaiting their response. Internal status only — patient sees the same experience as not_confirmed.',
    appearsInSearch: false,
    canLabelAsOfferingDAP: false,
    allowedClaims: [
      'Same patient-facing claims as not_confirmed',
      'Internal: "Outreach made — awaiting response"',
    ],
    forbiddenClaims: [
      '"DAP coming soon to this practice" — cannot promise outcome',
      '"Enrollment in progress" — practice has not confirmed',
      'Any patient-facing indication that confirmation is imminent',
    ],
    uiTreatment: 'Template B (same as not_confirmed from patient perspective). Internal CRM shows pending status.',
    ctaAllowed: '"Request DAP at this office"',
    dapNextAction: 'Follow up with practice. Set 5-day reminder. Document outcome — move to confirmed_dap_provider or declined.',
    ifOnlyStatusInArea: 'Patient sees Path 2 — No confirmed provider nearby.',
  },
  {
    status: 'declined',
    label: 'Declined (Internal Only)',
    description: 'Practice has declined DAP participation. Internal flag only — never surfaced to patients. Patient experience is identical to not_confirmed (Path 2). Decline reason never disclosed.',
    appearsInSearch: false,
    canLabelAsOfferingDAP: false,
    allowedClaims: [
      'Internal notes only — no patient-facing claims permitted for this practice',
    ],
    forbiddenClaims: [
      'Any patient-facing disclosure that the practice declined',
      '"Not available due to practice decision" — never disclose decline reason',
      'Any contact with the patient about this specific practice\'s decision',
      'Any patient-facing page, badge, or label tied to declined status',
    ],
    uiTreatment: 'No patient-facing template. Template = internal_only. Patient searches return Path 2 as if the practice is not in DAP\'s system.',
    ctaAllowed: null,
    dapNextAction: 'Mark internal. Do not contact practice again for DAP. Patient demand signals for this area still captured.',
    ifOnlyStatusInArea: 'Patient sees Path 2 — No confirmed provider nearby. Decline never disclosed.',
  },
]

// ─── Business Record ──────────────────────────────────────────────────────────

export const MOCK_BUSINESS: BusinessRecord = {
  id: 'dap',
  name: 'Dental Advantage Plan',
  websiteUrl: 'https://dentaladvantageplan.vercel.app',
  category: 'Dental Savings Directory',
  pipelineStatus: 'Blocked',
  currentStage: 'Truth Schema',
  overallReadiness: schemaReadiness(MOCK_BUSINESS_TRUTH_SCHEMA),
  primaryDecision:
    'Is there a confirmed DAP dentist near me, or should I request DAP availability in my area?',
}

// ─── Current Command ──────────────────────────────────────────────────────────

export const MOCK_CURRENT_COMMAND: CurrentCommand = {
  stage: 'Truth Schema',
  status: 'blocked',
  primaryBlocker:
    'Provider participation and offer terms must be confirmed before any provider pages, city/ZIP pages, or savings claims can be published.',
  whyItMatters:
    'Most dentists in the San Diego dataset are public directory listings only — not confirmed DAP providers. Publishing any page that implies DAP availability at an unconfirmed practice makes a false claim. Offer terms (discount rate, exclusions, activation) are partially confirmed from a plan PDF but not yet validated via current brochure.',
  wrongNextMove:
    'Do not generate provider pages, savings copy, or city/ZIP pages. Do not imply "dentists near you" or "DAP available" language before provider participation is confirmed.',
  correctNextAction:
    'Resolve the 5 open blockers: confirm provider participation (eb-001), validate offer terms (eb-002), define the Join Plan CTA gate (eb-004), finalize the patient request flow (eb-003), and document declined practice routing (eb-005).',
  stageLocked: false,
}

// ─── Pipeline Stages ──────────────────────────────────────────────────────────

export const MOCK_PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 'site-crawl',
    name: 'Site Crawl',
    status: 'complete',
    summary: 'Raw site content captured from homepage, guide, pricing, and FAQ pages.',
    blockers: [],
    artifacts: ['raw_crawl.json', 'page_inventory.json', 'extracted_copy.md'],
    artifactCount: 3,
    primaryAction: 'Review crawl',
    lastUpdated: 'Today 9:12 AM',
  },
  {
    id: 'truth-schema',
    name: 'Truth Schema',
    status: 'blocked',
    summary: '5 blockers open: provider participation, offer terms, Join Plan CTA gate, patient request flow, and declined practice routing. Education page is the only page type currently eligible.',
    blockers: ['Provider participation not confirmed', 'Offer terms not confirmed', '"Join plan" CTA gate not defined', 'Request flow not finalized', 'Declined practice routing not documented'],
    artifacts: ['truth_schema_draft.json'],
    artifactCount: 1,
    primaryAction: 'Resolve blockers',
    lastUpdated: 'Today 9:18 AM',
  },
  {
    id: 'storybrand-diagnosis',
    name: 'StoryBrand Diagnosis',
    status: 'not_started',
    locked: true,
    summary: 'Translate confirmed truth into decision strategy and StoryBrand positioning.',
    blockers: ['Truth Schema must be finalized first'],
    artifacts: [],
    artifactCount: 0,
    primaryAction: 'Build diagnosis',
  },
  {
    id: 'ai-search-strategy',
    name: 'AI Search Strategy',
    status: 'not_started',
    locked: true,
    summary: 'Develop AI-search-ready query map, entity gap analysis, and search strategy.',
    blockers: ['StoryBrand Diagnosis required'],
    artifacts: [],
    artifactCount: 0,
    primaryAction: 'Build strategy',
  },
  {
    id: 'core-30-pages',
    name: 'Core 30 Pages',
    status: 'not_started',
    locked: true,
    summary: 'Prepare AI-search-ready Core 30 page inputs for CBSEOAEO.',
    blockers: ['Truth Schema and strategy required'],
    artifacts: [],
    artifactCount: 0,
    primaryAction: 'Prepare Core 30',
  },
  {
    id: 'qa-approval',
    name: 'QA / Approval',
    status: 'not_started',
    locked: true,
    summary: 'Review and approve all generated assets before publishing.',
    blockers: ['No approved pages yet'],
    artifacts: [],
    artifactCount: 0,
    primaryAction: 'Start QA',
  },
  {
    id: 'publish-monitor',
    name: 'Publish / Monitor',
    status: 'not_started',
    locked: true,
    summary: 'Export or publish approved assets and begin monitoring.',
    blockers: ['No approved pages'],
    artifacts: [],
    artifactCount: 0,
    primaryAction: 'Publish assets',
  },
]

// ─── Crawl Output ─────────────────────────────────────────────────────────────

export const MOCK_CRAWL_OUTPUT: CrawlOutput = {
  crawlRunId: 'crawl_dap_001',
  status: 'complete',
  pagesFound: [
    { title: 'DAP Homepage (v5)',   url: '/v5',         signals: ['hero', 'CTA', 'membership language', 'no insurance language'] },
    { title: 'Find a DAP Dentist',  url: '/v5/search',  signals: ['ZIP search', 'provider cards', 'request form link'] },
    { title: 'Guide — No Insurance', url: '/v5/guide',  signals: ['education', 'comparison', 'patient questions'] },
    { title: 'Request DAP',          url: '/v5/request-dap', signals: ['demand capture', 'ZIP', 'preferred dentist'] },
    { title: 'For Dentists',         url: '/v5/for-dentists', signals: ['$49/mo', 'practice recruitment', 'B2B'] },
  ],
  extractedSignals: {
    headlines: 6,
    ctas: 9,
    pricingMentions: 4,
    trustSignals: 3,
    faqs: 10,
  },
}

// ─── Business Truth Record (legacy flat shape — still used by StrategyTab) ───

export const MOCK_BUSINESS_TRUTH: BusinessTruthRecord = {
  business_name: 'Dental Advantage Plan',
  category: 'Dental savings directory + patient demand capture',
  primary_customer: 'Patients without dental insurance who need affordable dental care',
  primary_problem: 'Patients delay care or pay full price out of pocket because they have no insurance — and most dentists with in-house plans are invisible to them',
  offer: 'A free patient aggregator that surfaces in-house dental membership plans at participating practices. Most directory listings are unconfirmed target practices with "Request DAP" CTAs only.',
  decision_question:
    'Should I join this plan now so my next dental visit costs less — or request it near me if it\'s not yet available?',
  pricing_status: 'Partially confirmed (Olaes plan PDF) — full brochure pending',
  trust_signals: [
    'No insurance claims',
    'No waiting periods',
    'Use at participating dental practices',
    'Request DAP at any dentist — we\'ll reach out on your behalf',
  ],
  known_gaps: [
    'Only 1 confirmed DAP provider (Olaes) — directory is mostly target practices',
    'Offer terms (discount rate, exclusions, activation) not confirmed from current brochure',
    'Request flow and consent language not finalized',
  ],
}

// ─── Strategy ─────────────────────────────────────────────────────────────────

export const MOCK_STRATEGY: StrategyRecord = {
  storybrandStatus: 'Not Started',
  decisionStatus: 'Draft',
  currentDecisionQuestion:
    'Is there a confirmed DAP dentist near me, or should I request DAP availability in my area?',
  positioningAngle: 'No dental insurance? Find a plan that works.',
  homepageGoal:
    'Help patients decide whether joining the plan now (confirmed provider) or requesting DAP at their preferred dentist is the right move. Education page is the only safe surface until Truth Schema is locked.',
  nextStrategyAction: 'Resolve all Truth Schema blockers before drafting StoryBrand diagnosis.',
}

// ─── Page Types ───────────────────────────────────────────────────────────────

export const DAP_PAGE_TYPE_SPECS: DapPageTypeSpec[] = [
  {
    id: 'confirmed-provider-page',
    name: 'Confirmed DAP Provider Page',
    shortName: 'Confirmed Provider',
    gateBlocker: 'eb-001',
    conditionalWithoutGate: false,
    allowedClaims: [
      '"DAP available now at [Practice Name]"',
      '"Join Dental Advantage Plan at this office"',
      'Specific pricing — only when offer terms confirmed',
      '"Join plan" CTA — only when offer_terms_status = complete',
      '"View plan details" CTA — always allowed on confirmed provider pages',
    ],
    forbiddenClaims: [
      '"Request DAP at this office" — wrong template',
      '"Coming soon" — contradicts confirmed status',
      '"Join plan" when offer terms not complete',
    ],
    primaryCta: '"Join plan" · "View plan details"',
    color: 'green',
  },
  {
    id: 'unconfirmed-practice-page',
    name: 'Unconfirmed / Target Practice Page',
    shortName: 'Unconfirmed Practice',
    gateBlocker: null,
    conditionalWithoutGate: false,
    allowedClaims: [
      '"Request DAP at this practice"',
      '"Ask about the Dental Advantage Plan at this office"',
      'Public practice details (name, city, specialty)',
    ],
    forbiddenClaims: [
      '"DAP available now" — implies confirmation',
      '"Join plan" CTA — wrong template',
      '"Confirmed DAP provider" badge',
      'Any pricing claims',
    ],
    primaryCta: '"Request DAP at this office"',
    color: 'amber',
  },
  {
    id: 'city-zip-demand-page',
    name: 'City / ZIP Demand Page',
    shortName: 'City / ZIP',
    gateBlocker: 'eb-003',
    conditionalWithoutGate: true,
    allowedClaims: [
      'Confirmed providers list (if any exist in area)',
      '"Request DAP near me" — demand capture',
      '"Notify me when available" — demand capture only without eb-003',
    ],
    forbiddenClaims: [
      '"DAP dentists available near you" — requires confirmed provider',
      '"We will contact your dentist" — requires eb-003 resolved',
      'Any pricing claims before offer terms confirmed',
    ],
    primaryCta: '"Request DAP near me" · "Notify me when available"',
    color: 'blue',
  },
  {
    id: 'education-decision-page',
    name: 'Education / Decision Page',
    shortName: 'Education / Decision',
    gateBlocker: null,
    conditionalWithoutGate: false,
    allowedClaims: [
      'General dental savings education',
      'Confirmed plan facts (no practice-specific)',
      '"How it works" content',
      'Decision comparison (with insurance vs. without)',
    ],
    forbiddenClaims: [
      'Practice-specific pricing claims',
      '"Available at [Practice Name]"',
      'Provider location claims',
      'Network-wide pricing promises',
    ],
    primaryCta: '"See how it works" · "Find a dentist"',
    color: 'gray',
  },
]

// ─── Pages ────────────────────────────────────────────────────────────────────

export const MOCK_PAGES: PagePlanItem[] = [
  { title: 'Education — Dental savings options without insurance', status: 'Eligible',    reason: 'No provider or pricing claims required — eligible immediately',     pageType: 'education-decision-page' },
  { title: 'Education — Savings copy: Crown cost without insurance', status: 'Not Ready', reason: 'Offer terms eb-002 open — pricing claims blocked',                 pageType: 'education-decision-page' },
  { title: 'Confirmed Provider Page — Irene Olaes DDS',            status: 'Not Ready',  reason: 'Provider participation eb-001 open — no confirmed providers yet',   pageType: 'confirmed-provider-page' },
  { title: 'Unconfirmed Practice Page — [San Diego dentist]',      status: 'Eligible',   reason: 'Public directory listing — no gate required',                       pageType: 'unconfirmed-practice-page' },
  { title: 'City / ZIP — Dental membership plans San Diego',       status: 'Conditional', reason: 'Demand capture only — request flow eb-003 open',                  pageType: 'city-zip-demand-page' },
  { title: 'City / ZIP — Dental savings plans near me',            status: 'Conditional', reason: 'Demand capture only — request flow eb-003 open',                  pageType: 'city-zip-demand-page' },
]

// ─── Initial Input ────────────────────────────────────────────────────────────

export const MOCK_INITIAL_INPUT: InitialInput = {
  businessName: 'Dental Advantage Plan',
  sourceWebsite: 'https://dentaladvantageplan.vercel.app',
  businessType: 'Dental Savings Directory',
  pipelineGoal: 'Publish 4 page types safely: Confirmed Provider, Unconfirmed Target, City/ZIP Demand, and Education/Decision.',
  seedCustomerDecision:
    'Is there a confirmed DAP dentist near me, or should I request DAP availability in my area?',
  inputStatus: 'accepted',
}

// ─── Activity ─────────────────────────────────────────────────────────────────

export const MOCK_ACTIVITY: ActivityEvent[] = [
  { timestamp: 'Today 9:12 AM', description: 'Site crawl completed for Dental Advantage Plan' },
  { timestamp: 'Today 9:15 AM', description: 'Truth Schema draft created — 7 sections, 36 fields' },
  { timestamp: 'Today 9:18 AM', description: 'Provider participation blocker detected (eb-001)' },
  { timestamp: 'Today 9:20 AM', description: 'Offer terms blocker detected (eb-002)' },
  { timestamp: 'Today 9:22 AM', description: 'Request flow blocker detected (eb-003) — pipeline paused at Truth Schema' },
  { timestamp: 'Today 9:25 AM', description: 'Education / Decision Page marked eligible (no provider or pricing claims required)' },
]

// ─── Dentist Page Templates ───────────────────────────────────────────────────
// Two patient-facing templates. declined practices use internal_only — no patient
// template. Template A requires confirmed_dap_provider. Template B is for
// demand-capture / request flows only (not_confirmed, recruitment_requested,
// pending_confirmation). declined never maps to Template B.

export const DENTIST_PAGE_TEMPLATES: DentistPageTemplate[] = [
  {
    id: 'confirmed-provider',
    name: 'Confirmed DAP Provider Page',
    gateCriteria: 'provider_status === "confirmed_dap_provider"',
    providerStatuses: ['confirmed_dap_provider'],
    sampleH1: 'Dental Advantage Plan at [Practice Name]',
    sampleSubhead: 'Confirmed DAP provider — view plan details or join today.',
    ctaText: '"Join plan" (offer terms validated) · "View plan details" (offer terms pending)',
    ctaDestination: '/v5/practice/[slug]/enroll or /v5/practice/[slug]',
    allowedLanguage: [
      '"DAP available now at [Practice Name]"',
      '"Join Dental Advantage Plan at this office"',
      '"This practice is a confirmed DAP provider"',
      'Specific pricing ($450/yr adult, $350/yr child) — only when offer terms confirmed from current brochure',
      '"25% off non-covered procedures" — only when offer terms confirmed',
      '"2 cleanings + exams + X-rays — zero copay" — only when inclusions confirmed',
      '"No waiting period — use your plan today"',
      '"View plan details" CTA — always allowed on confirmed provider pages',
      '"Join plan" CTA — only when offer_terms_status = complete',
    ],
    forbiddenLanguage: [
      '"Request DAP at this office" — wrong template, implies unavailability',
      '"Not currently confirmed" — contradicts confirmed status',
      '"Coming soon" — contradicts confirmed status',
      '"We will reach out on your behalf" — wrong flow for confirmed provider',
      '"Join plan" when offer_terms_status is not complete — even on confirmed provider pages',
    ],
    requiredDisclaimer:
      'Pricing confirmed at [Practice Name]. Each practice sets its own membership terms. Verify current terms directly with the practice.',
  },
  {
    id: 'unconfirmed-practice',
    name: 'Unconfirmed / Target Practice Page',
    gateCriteria: 'provider_status !== "confirmed_dap_provider" && provider_status !== "declined"',
    providerStatuses: ['not_confirmed', 'recruitment_requested', 'pending_confirmation'],
    sampleH1: '[Practice Name] — Dental Savings Info',
    sampleSubhead: 'This is not a provider offer page. Want this dentist to offer a Dental Advantage Plan? Request it below.',
    ctaText: 'Request DAP at this office',
    ctaDestination: '/v5/request-dap?dentist=[id]',
    allowedLanguage: [
      '"Want this dentist to offer Dental Advantage Plan?"',
      '"Request DAP at this office"',
      '"This office is not currently confirmed as a DAP provider"',
      'General dental savings education (no practice-specific pricing or discounts)',
      '"DAP is available at select practices — request it near you"',
    ],
    forbiddenLanguage: [
      '"DAP available now" — false claim',
      '"Join plan" — implies plan is available at this practice',
      'Any specific pricing ($450/yr, $350/yr, 25% off) tied to this practice',
      '"Confirmed provider" or "participating practice" — false claim',
      'Any language implying DAP is currently available at this specific office',
      '"No waiting period" — inapplicable, plan is not yet available here',
    ],
    requiredDisclaimer:
      'This practice has not confirmed participation in Dental Advantage Plan. Submitting a request does not guarantee availability.',
  },
]

// Lookup helper — returns the correct template for a given provider_status.
// declined = internal_only: no patient-facing template exists.
export function getTemplateForStatus(status: ProviderStatus): DentistPageTemplate | null {
  if (status === 'confirmed_dap_provider') return DENTIST_PAGE_TEMPLATES[0]
  if (status === 'declined') return null
  return DENTIST_PAGE_TEMPLATES[1]
}

// ─── Search Path Rules ────────────────────────────────────────────────────────
// The 3 patient paths that drive all search result behavior. The system must
// route every search to exactly one of these paths — no hybrid results, no
// mixing confirmed and unconfirmed practices in the same result set.

export const SEARCH_PATH_RULES: SearchPathRule[] = [
  {
    id: 'confirmed-available',
    label: 'Path 1 — Confirmed Dentist Available',
    trigger: 'ZIP / area search returns ≥1 practice with provider_status = "confirmed_dap_provider"',
    patientQuestion: 'Is there a dentist near me who offers a Dental Advantage Plan?',
    systemBehavior: [
      'Show only confirmed DAP provider card(s) — never mix with unconfirmed practices',
      'Display "Confirmed DAP Provider" badge on each result card',
      'Show plan details and savings logic (from confirmed offer terms only)',
      'Offer "View plan details" CTA always; "Join plan" CTA only when offer terms are validated and CTA gate is unlocked',
      'If unconfirmed practices also exist nearby, do not show them in this results view',
    ],
    allowedClaims: [
      '"[Practice Name] offers a Dental Advantage Plan"',
      '"This dentist is a confirmed DAP provider"',
      '"View plan details" CTA → confirmed provider page (always allowed)',
      'Specific pricing only if confirmed from current practice brochure',
      '"Join plan" CTA → enrollment flow (only when offer terms are validated and CTA gate is unlocked)',
      '"No waiting period" and "No claims" if confirmed',
    ],
    forbiddenClaims: [
      'Showing unconfirmed practices alongside confirmed ones as equivalent results',
      '"Dentists near you offer DAP" — only the confirmed practice(s) do',
      'Pricing claims for any practice other than the confirmed provider',
      '"Broad network available" — only one confirmed provider currently',
    ],
    primaryCTA: 'View plan details',
    ctaDestination: '/v5/practice/[slug]',
    mockResultSummary: 'Irene Olaes DDS — La Mesa, CA 91942 — Confirmed DAP Provider badge — "View plan details" CTA',
  },
  {
    id: 'no-confirmed-nearby',
    label: 'Path 2 — No Confirmed DAP Dentist Nearby',
    trigger: 'ZIP / area search returns 0 practices with provider_status = "confirmed_dap_provider"',
    patientQuestion: 'Is there a DAP dentist near me?',
    systemBehavior: [
      'Do NOT show unconfirmed practices as search results — even if they exist in the database',
      'Display honest no-result message: "We do not yet have a confirmed DAP dentist in your area."',
      'Offer demand capture: patient names their preferred dentist or area for recruitment',
      'Store the ZIP/area as a demand signal for provider recruitment prioritization',
      'Do not promise a practice will be recruited or when',
    ],
    allowedClaims: [
      '"We do not yet have a confirmed DAP dentist in your area."',
      '"Tell us the dentist you want, or the area you want covered."',
      '"We will reach out to practices about offering a Dental Advantage Plan."',
      'General DAP education (what the plan is, how it works)',
      '"We will notify you if a DAP dentist joins in your area."',
    ],
    forbiddenClaims: [
      'Showing the 2,000+ SD dataset practices as search results implying any DAP relationship',
      '"Dentists near you" — none in the area are confirmed DAP providers',
      '"DAP available near you" — false',
      'Any practice-specific pricing for unconfirmed practices',
      '"Coming soon to your area" — do not promise coverage',
    ],
    primaryCTA: 'Request a DAP dentist in your area',
    ctaDestination: '/v5/request-dap',
    mockResultSummary: 'ZIP 92101 search → "We do not yet have a confirmed DAP dentist in your area." → demand capture form',
  },
  {
    id: 'specific-dentist-request',
    label: 'Path 3 — Patient Wants a Specific Dentist',
    trigger: 'Patient names a specific practice or dentist they want recruited',
    patientQuestion: 'Can I get my specific dentist to offer a Dental Advantage Plan?',
    systemBehavior: [
      'Accept: practice name, location (city/ZIP), patient contact info (optional)',
      'Set provider_status = "recruitment_requested" for the named practice',
      'Store as demand-generation signal for DAP provider outreach',
      'Confirm to patient: "We will contact this practice on your behalf"',
      'Do not promise the dentist will join or when they will respond',
      'Send follow-up when/if the practice confirms DAP participation',
    ],
    allowedClaims: [
      '"Request this dentist to offer a Dental Advantage Plan"',
      '"We will contact this practice on your behalf"',
      '"This does not guarantee the dentist will participate"',
      '"We will let you know if they join"',
      '"Your request helps us prioritize recruitment in your area"',
    ],
    forbiddenClaims: [
      '"Your dentist will offer DAP" — no guarantee',
      '"DAP is coming to [practice name]" — premature',
      '"This dentist is interested in DAP" — no basis for claim',
      'Any pricing or savings claims for the requested practice',
      'Implying the request creates any agreement or obligation on the practice',
    ],
    primaryCTA: 'Submit request',
    ctaDestination: '/v5/request-dap?dentist=[name]&zip=[zip]',
    mockResultSummary: 'Patient submits "Pacific Dental Group, San Diego CA 92101" → provider_status set to recruitment_requested → confirmation sent',
  },
]

// ─── Mock Dentist Pages ───────────────────────────────────────────────────────
// Representative sample from the San Diego dataset. One confirmed provider,
// four public directory listings in various stages of outreach.

export const MOCK_DENTIST_PAGES: MockDentistPage[] = [
  {
    id: 'olaes',
    practiceName: 'Irene Olaes DDS',
    city: 'La Mesa',
    zip: '91942',
    provider_status: 'confirmed_dap_provider',
    assignedTemplate: 'confirmed-provider',
    pageSlug: '/v5/practice/irene-olaes-dds',
    eligible: true,
    eligibilityReason: 'Confirmed DAP provider — signed agreement on file',
  },
  {
    id: 'sd-001',
    practiceName: 'Hillcrest Family Dental',
    city: 'San Diego',
    zip: '92103',
    provider_status: 'not_confirmed',
    assignedTemplate: 'unconfirmed-practice',
    pageSlug: '/v5/practice/hillcrest-family-dental',
    eligible: true,
    eligibilityReason: 'In SD County dataset — no DAP relationship confirmed',
  },
  {
    id: 'sd-002',
    practiceName: 'Pacific Dental Group',
    city: 'San Diego',
    zip: '92101',
    provider_status: 'recruitment_requested',
    assignedTemplate: 'unconfirmed-practice',
    pageSlug: '/v5/practice/pacific-dental-group',
    eligible: true,
    eligibilityReason: 'Patient submitted request — DAP outreach pending. Template B until confirmed.',
  },
  {
    id: 'sd-003',
    practiceName: 'Mission Valley Dentistry',
    city: 'San Diego',
    zip: '92108',
    provider_status: 'pending_confirmation',
    assignedTemplate: 'unconfirmed-practice',
    pageSlug: '/v5/practice/mission-valley-dentistry',
    eligible: true,
    eligibilityReason: 'DAP outreach made — awaiting practice response. Template B until confirmed.',
  },
  {
    id: 'sd-004',
    practiceName: 'Bay Park Dental Associates',
    city: 'San Diego',
    zip: '92110',
    provider_status: 'not_confirmed',
    assignedTemplate: 'unconfirmed-practice',
    pageSlug: '/v5/practice/bay-park-dental-associates',
    eligible: true,
    eligibilityReason: 'In SD County dataset — no DAP relationship confirmed',
  },
  {
    id: 'sd-005',
    practiceName: 'Clairemont Dental Care',
    city: 'San Diego',
    zip: '92117',
    provider_status: 'declined',
    assignedTemplate: 'internal_only',
    // pageSlug intentionally absent — declined practices have no public URL
    eligible: false,
    eligibilityReason: 'Declined DAP participation — internal record only. No patient-facing page. Patient searches return Path 2.',
  },
]
