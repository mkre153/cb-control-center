import type {
  DapRequestInput,
  DapRequest,
  DapRequestStatus,
  DapRequestValidationResult,
  DapRequestValidationIssue,
  DapRequestSafetyFlags,
  DapRequestConfirmationModel,
} from './dapRequestTypes'

// ─── Known source page kinds ──────────────────────────────────────────────────
const KNOWN_SOURCE_PAGE_KINDS = new Set([
  'homepage',
  'city_page',
  'dentist_page',
  'decision_page',
  'treatment_page',
  'search_results_page',
  'request_flow',
])

// ─── No-PHI guardrail ─────────────────────────────────────────────────────────
// Simple keyword and pattern scan for obvious PHI indicators.
// Forbidden: SSN, insurance IDs, DOB, medical record numbers, diagnoses, symptoms.
// Allowed treatment interests: cleaning, crown, implant, dentures, emergency visit, not sure yet.
// Not exhaustive — secondary review handles edge cases.
const PHI_PATTERNS: RegExp[] = [
  /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/,   // SSN pattern
  /\bssn\b/i,
  /social\s+security/i,
  /date\s+of\s+birth/i,
  /\bdob\b/i,
  /insurance\s+(id|number|card)/i,
  /\bmember\s+(id|number)\b/i,
  /medical\s+record/i,
  /\bdiagnos(is|ed)\b/i,
  /\bsymptoms\b/i,
]

export function containsPhi(text: string): boolean {
  return PHI_PATTERNS.some(p => p.test(text))
}

// ─── Validation ───────────────────────────────────────────────────────────────

export function validateDapRequestInput(input: DapRequestInput): DapRequestValidationResult {
  const issues: DapRequestValidationIssue[] = []

  if (!input.requester_email && !input.requester_phone) {
    issues.push({
      field: 'requester_email',
      code: 'EMAIL_OR_PHONE_REQUIRED',
      message: 'Email or phone number is required.',
    })
  }

  if (!input.city && !input.zip) {
    issues.push({
      field: 'city',
      code: 'CITY_OR_ZIP_REQUIRED',
      message: 'City or ZIP code is required.',
    })
  }

  if (!input.preferred_practice_name && !input.city && !input.zip) {
    issues.push({
      field: 'preferred_practice_name',
      code: 'PRACTICE_OR_AREA_REQUIRED',
      message: 'A preferred practice name or geographic area (city or ZIP) is required.',
    })
  }

  if (!input.consent_text || input.consent_text.trim().length === 0) {
    issues.push({
      field: 'consent_text',
      code: 'CONSENT_TEXT_REQUIRED',
      message: 'Consent text is required.',
    })
  }

  if (!input.no_phi_acknowledged) {
    issues.push({
      field: 'no_phi_acknowledged',
      code: 'NO_PHI_ACKNOWLEDGED_REQUIRED',
      message: 'Patient must acknowledge that no protected health information is included.',
    })
  }

  if (!KNOWN_SOURCE_PAGE_KINDS.has(input.source_page_kind)) {
    issues.push({
      field: 'source_page_kind',
      code: 'UNKNOWN_SOURCE_PAGE_KIND',
      message: `Unknown source page kind: ${input.source_page_kind}`,
    })
  }

  if (input.treatment_interest && containsPhi(input.treatment_interest)) {
    issues.push({
      field: 'treatment_interest',
      code: 'PHI_DETECTED',
      message: 'Treatment interest field may contain protected health information.',
    })
  }

  if (input.user_message && containsPhi(input.user_message)) {
    issues.push({
      field: 'user_message',
      code: 'PHI_DETECTED',
      message: 'Message field may contain protected health information.',
    })
  }

  return { valid: issues.length === 0, issues }
}

// ─── Normalization ────────────────────────────────────────────────────────────

export function normalizeDapRequestInput(input: DapRequestInput): DapRequestInput {
  return {
    ...input,
    requester_name: input.requester_name.trim(),
    requester_email: input.requester_email?.trim().toLowerCase() ?? null,
    requester_phone: input.requester_phone?.replace(/\D/g, '') ?? null,
    city: input.city?.trim() ?? null,
    zip: input.zip?.trim() ?? null,
    preferred_practice_name: input.preferred_practice_name?.trim() ?? null,
    preferred_practice_slug: input.preferred_practice_slug?.trim().toLowerCase() ?? null,
    treatment_interest: input.treatment_interest?.trim() ?? null,
    consent_text: input.consent_text.trim(),
    user_message: input.user_message?.trim() ?? null,
    source_path: input.source_path.trim(),
  }
}

// ─── Submission gate ──────────────────────────────────────────────────────────
// A request may only be submitted when validation passes and the patient has
// given at least one form of consent (to be contacted, or for practice outreach).

export function canSubmitDapRequest(input: DapRequestInput): boolean {
  const validation = validateDapRequestInput(input)
  if (!validation.valid) return false
  if (!input.consent_to_contact_patient && !input.consent_to_contact_practice) return false
  if (!input.consent_text || input.consent_text.trim().length === 0) return false
  return true
}

// ─── Practice outreach gate ───────────────────────────────────────────────────
// Practice outreach requires explicit consent_to_contact_practice.
// Not eligible from draft or any closed status.

export function canMarkPracticeOutreachReady(request: DapRequest): boolean {
  if (!request.consent_to_contact_practice) return false
  const eligibleStatuses: DapRequestStatus[] = [
    'submitted',
    'consent_verified',
    'queued_for_review',
  ]
  return eligibleStatuses.includes(request.request_status)
}

// ─── Status transition rules ──────────────────────────────────────────────────
// provider_confirmed is only reachable via provider_onboarding_started, which
// itself requires an external onboarding flow. No direct path exists from
// patient-submitted statuses to provider_confirmed.

const ALLOWED_TRANSITIONS: Readonly<Record<DapRequestStatus, readonly DapRequestStatus[]>> = {
  draft:                      ['submitted'],
  submitted:                  ['consent_verified', 'queued_for_review', 'needs_review', 'approved', 'rejected', 'closed_invalid', 'closed_duplicate'],
  consent_verified:           ['queued_for_review', 'needs_review', 'approved', 'rejected', 'practice_outreach_ready', 'closed_invalid', 'closed_duplicate'],
  queued_for_review:          ['needs_review', 'approved', 'rejected', 'practice_outreach_ready', 'closed_invalid', 'closed_duplicate', 'closed_no_response'],
  // Phase 9F/9G: admin review statuses — internal only, no public claim implications
  // approved → rejected requires going through needs_review first (no direct skip)
  // rejected → approved requires going through needs_review first (no direct reversal)
  needs_review:               ['approved', 'rejected', 'queued_for_review'],
  approved:                   ['practice_outreach_ready', 'needs_review'],
  rejected:                   ['needs_review'],
  practice_outreach_ready:    ['practice_contacted', 'closed_invalid', 'closed_no_response'],
  practice_contacted:         ['practice_declined', 'practice_interested', 'closed_no_response'],
  practice_declined:          ['closed_no_response', 'closed_user_requested_stop'],
  practice_interested:        ['provider_onboarding_started'],
  provider_onboarding_started:['provider_confirmed', 'closed_no_response'],
  provider_confirmed:         [],
  closed_no_response:         [],
  closed_invalid:             [],
  closed_duplicate:           [],
  closed_user_requested_stop: [],
}

export function canTransitionDapRequestStatus(
  from: DapRequestStatus,
  to: DapRequestStatus,
): boolean {
  const allowed = ALLOWED_TRANSITIONS[from]
  if (!allowed) return false  // unknown from-status: blocked, not silently allowed
  return (allowed as readonly string[]).includes(to)
}

export function assertValidDapRequestTransition(
  from: DapRequestStatus,
  to: DapRequestStatus,
): void {
  if (!canTransitionDapRequestStatus(from, to)) {
    throw new Error(`Invalid DAP request status transition: '${from}' → '${to}'`)
  }
}

// ─── Safety flags ─────────────────────────────────────────────────────────────

export function getDapRequestSafetyFlags(request: DapRequest): DapRequestSafetyFlags {
  return {
    impliesEnrollment: false,
    impliesGuaranteedAvailability: false,
    impliesGuaranteedPricing: false,
    requiresConsent: true,
    phiRiskDetected:
      containsPhi(request.treatment_interest ?? '') ||
      containsPhi(request.user_message ?? ''),
    duplicateRisk: false,
  }
}

// ─── Dedupe key ───────────────────────────────────────────────────────────────
// Stable identifier built from contact method + target (practice or area).
// Excludes timestamp, user_message, and treatment_interest — those vary
// across duplicate submissions and must not affect deduplication.

export function buildDapRequestDedupeKey(input: DapRequestInput): string {
  const n = normalizeDapRequestInput(input)
  const contact = n.requester_email ?? n.requester_phone ?? ''
  const target =
    n.preferred_practice_slug ??
    [n.city, n.zip].filter(Boolean).join('-').toLowerCase()
  return `${contact}::${target}`
}

// ─── Confirmation model ───────────────────────────────────────────────────────
// Must not imply enrollment, availability guarantee, pricing guarantee,
// or that a practice was contacted without consent.

export function getDapRequestConfirmationModel(request: DapRequest): DapRequestConfirmationModel {
  void request // request_id available for future personalization; unused in v1
  return {
    requestReceived: true,
    isEnrollment: false,
    guaranteesAvailability: false,
    guaranteesPricing: false,
    practiceContactedWithoutConsent: false,
    headline: 'Your request has been received',
    body:
      'We have received your request. This is not enrollment in Dental Advantage Plan. ' +
      'DAP availability at the requested location is not guaranteed. ' +
      'No dental office will be contacted without your consent.',
    nextStep:
      'Our team will review your request. If clarification is needed, we may reach out to you.',
    mayContactForClarification: true,
  }
}
