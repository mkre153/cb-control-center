/**
 * Phase 9A — DAP Request Backend Architecture
 *
 * PURPOSE: Verify that the request backend architecture types, validation rules,
 * status lifecycle, and safety invariants are correct. Also enforces that no API
 * routes, database migrations, production routes, or deferred integrations were
 * added in this phase.
 *
 * COVERAGE:
 *   Group 1  — Request input validation
 *   Group 2  — Consent required for submission
 *   Group 3  — Practice outreach requires consent
 *   Group 4  — No-PHI guardrail
 *   Group 5  — Dedupe key stability
 *   Group 6  — Status transitions are constrained
 *   Group 7  — Provider confirmation cannot happen from request alone
 *   Group 8  — Confirmation model: no enrollment guarantee
 *   Group 9  — Confirmation model: no pricing guarantee
 *   Group 10 — No API routes added
 *   Group 11 — No database migrations added
 *   Group 12 — Tier 2 and Tier 3 routes remain absent
 *   Group 13 — Deferred integrations remain deferred
 */

import { describe, it, expect } from 'vitest'
import { existsSync, readdirSync, readFileSync } from 'fs'
import { resolve, join } from 'path'

import {
  validateDapRequestInput,
  normalizeDapRequestInput,
  canSubmitDapRequest,
  canMarkPracticeOutreachReady,
  canTransitionDapRequestStatus,
  getDapRequestSafetyFlags,
  buildDapRequestDedupeKey,
  getDapRequestConfirmationModel,
  containsPhi,
} from '../../dap/registry/dapRequestRules'

import type {
  DapRequestInput,
  DapRequest,
  DapRequestStatus,
} from '../../dap/registry/dapRequestTypes'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROOT = resolve(__dirname, '../../..')

function makeValidInput(overrides: Partial<DapRequestInput> = {}): DapRequestInput {
  return {
    client_key: 'dental_advantage_plan',
    vertical_key: 'dap',
    project_key: null,
    requester_name: 'Jane Smith',
    requester_email: 'jane@example.com',
    requester_phone: null,
    city: 'San Diego',
    zip: null,
    preferred_practice_name: 'Sunshine Dental',
    preferred_practice_slug: 'sunshine-dental',
    treatment_interest: 'cleaning',
    consent_to_contact_practice: true,
    consent_to_contact_patient: true,
    consent_text: 'I consent to be contacted by DAP.',
    no_phi_acknowledged: true,
    user_message: null,
    source_page_kind: 'request_flow',
    source_path: '/preview/dap/request',
    ...overrides,
  }
}

function makePersistedRequest(overrides: Partial<DapRequest> = {}): DapRequest {
  return {
    id: 'req-001',
    created_at: '2026-04-29T12:00:00Z',
    updated_at: '2026-04-29T12:00:00Z',
    client_key: 'dental_advantage_plan',
    vertical_key: 'dap',
    project_key: null,
    request_status: 'submitted',
    source_page_kind: 'request_flow',
    source_path: '/preview/dap/request',
    city: 'San Diego',
    zip: null,
    preferred_practice_name: 'Sunshine Dental',
    preferred_practice_slug: 'sunshine-dental',
    treatment_interest: 'cleaning',
    requester_name: 'Jane Smith',
    requester_email: 'jane@example.com',
    requester_phone: null,
    consent_to_contact_practice: true,
    consent_to_contact_patient: true,
    consent_text: 'I consent to be contacted by DAP.',
    consent_timestamp: '2026-04-29T12:00:00Z',
    no_phi_acknowledged: true,
    user_message: null,
    dedupe_key: 'jane@example.com::sunshine-dental',
    ip_hash: null,
    user_agent_hash: null,
    ...overrides,
  }
}

function findFiles(dir: string, test: (path: string) => boolean): string[] {
  if (!existsSync(dir)) return []
  const results: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.next') {
      results.push(...findFiles(full, test))
    } else if (entry.isFile() && test(full)) {
      results.push(full)
    }
  }
  return results
}

// ─── Group 1: Request input validation ───────────────────────────────────────

describe('Request input validation', () => {
  it('valid input passes', () => {
    const result = validateDapRequestInput(makeValidInput())
    expect(result.valid).toBe(true)
    expect(result.issues).toHaveLength(0)
  })

  it('missing both email and phone fails with EMAIL_OR_PHONE_REQUIRED', () => {
    const result = validateDapRequestInput(
      makeValidInput({ requester_email: null, requester_phone: null })
    )
    expect(result.valid).toBe(false)
    expect(result.issues.some(i => i.code === 'EMAIL_OR_PHONE_REQUIRED')).toBe(true)
  })

  it('email alone satisfies contact requirement', () => {
    const result = validateDapRequestInput(
      makeValidInput({ requester_email: 'test@example.com', requester_phone: null })
    )
    expect(result.issues.some(i => i.code === 'EMAIL_OR_PHONE_REQUIRED')).toBe(false)
  })

  it('phone alone satisfies contact requirement', () => {
    const result = validateDapRequestInput(
      makeValidInput({ requester_email: null, requester_phone: '6195550100' })
    )
    expect(result.issues.some(i => i.code === 'EMAIL_OR_PHONE_REQUIRED')).toBe(false)
  })

  it('missing both city and ZIP fails with CITY_OR_ZIP_REQUIRED', () => {
    const result = validateDapRequestInput(
      makeValidInput({ city: null, zip: null })
    )
    expect(result.valid).toBe(false)
    expect(result.issues.some(i => i.code === 'CITY_OR_ZIP_REQUIRED')).toBe(true)
  })

  it('city alone satisfies geographic requirement', () => {
    const result = validateDapRequestInput(
      makeValidInput({ city: 'San Diego', zip: null })
    )
    expect(result.issues.some(i => i.code === 'CITY_OR_ZIP_REQUIRED')).toBe(false)
  })

  it('ZIP alone satisfies geographic requirement', () => {
    const result = validateDapRequestInput(
      makeValidInput({ city: null, zip: '92101' })
    )
    expect(result.issues.some(i => i.code === 'CITY_OR_ZIP_REQUIRED')).toBe(false)
  })

  it('missing consent_text fails with CONSENT_TEXT_REQUIRED', () => {
    const result = validateDapRequestInput(makeValidInput({ consent_text: '' }))
    expect(result.valid).toBe(false)
    expect(result.issues.some(i => i.code === 'CONSENT_TEXT_REQUIRED')).toBe(true)
  })

  it('whitespace-only consent_text fails with CONSENT_TEXT_REQUIRED', () => {
    const result = validateDapRequestInput(makeValidInput({ consent_text: '   ' }))
    expect(result.issues.some(i => i.code === 'CONSENT_TEXT_REQUIRED')).toBe(true)
  })

  it('no_phi_acknowledged=false fails with NO_PHI_ACKNOWLEDGED_REQUIRED', () => {
    const result = validateDapRequestInput(makeValidInput({ no_phi_acknowledged: false }))
    expect(result.valid).toBe(false)
    expect(result.issues.some(i => i.code === 'NO_PHI_ACKNOWLEDGED_REQUIRED')).toBe(true)
  })

  it('unknown source_page_kind fails with UNKNOWN_SOURCE_PAGE_KIND', () => {
    const result = validateDapRequestInput(
      // @ts-expect-error intentional unknown value
      makeValidInput({ source_page_kind: 'admin_panel' })
    )
    expect(result.valid).toBe(false)
    expect(result.issues.some(i => i.code === 'UNKNOWN_SOURCE_PAGE_KIND')).toBe(true)
  })

  it('all known page kinds are accepted', () => {
    const knownKinds = [
      'homepage',
      'city_page',
      'dentist_page',
      'decision_page',
      'treatment_page',
      'search_results_page',
      'request_flow',
    ] as const
    for (const kind of knownKinds) {
      const result = validateDapRequestInput(makeValidInput({ source_page_kind: kind }))
      expect(result.issues.some(i => i.code === 'UNKNOWN_SOURCE_PAGE_KIND')).toBe(false)
    }
  })

  it('multiple issues can be returned in a single result', () => {
    const result = validateDapRequestInput(
      makeValidInput({
        requester_email: null,
        requester_phone: null,
        city: null,
        zip: null,
        consent_text: '',
      })
    )
    expect(result.valid).toBe(false)
    expect(result.issues.length).toBeGreaterThan(1)
  })

  it('normalization lowercases email and strips phone non-digits', () => {
    const normalized = normalizeDapRequestInput(
      makeValidInput({ requester_email: '  Jane@Example.COM  ', requester_phone: '(619) 555-0100' })
    )
    expect(normalized.requester_email).toBe('jane@example.com')
    expect(normalized.requester_phone).toBe('6195550100')
  })

  it('normalization trims whitespace from name and city', () => {
    const normalized = normalizeDapRequestInput(
      makeValidInput({ requester_name: '  Jane Smith  ', city: '  San Diego  ' })
    )
    expect(normalized.requester_name).toBe('Jane Smith')
    expect(normalized.city).toBe('San Diego')
  })
})

// ─── Group 2: Consent required for submission ─────────────────────────────────

describe('Consent required for submission', () => {
  it('valid input with both consents passes canSubmitDapRequest', () => {
    const input = makeValidInput({
      consent_to_contact_patient: true,
      consent_to_contact_practice: true,
    })
    expect(canSubmitDapRequest(input)).toBe(true)
  })

  it('consent_to_contact_patient alone is sufficient for submission', () => {
    const input = makeValidInput({
      consent_to_contact_patient: true,
      consent_to_contact_practice: false,
    })
    expect(canSubmitDapRequest(input)).toBe(true)
  })

  it('consent_to_contact_practice alone is sufficient for submission', () => {
    const input = makeValidInput({
      consent_to_contact_patient: false,
      consent_to_contact_practice: true,
    })
    expect(canSubmitDapRequest(input)).toBe(true)
  })

  it('no consent flags set prevents submission', () => {
    const input = makeValidInput({
      consent_to_contact_patient: false,
      consent_to_contact_practice: false,
    })
    expect(canSubmitDapRequest(input)).toBe(false)
  })

  it('empty consent_text prevents submission even with consent flags', () => {
    const input = makeValidInput({
      consent_to_contact_patient: true,
      consent_text: '',
    })
    expect(canSubmitDapRequest(input)).toBe(false)
  })

  it('invalid input (missing email+phone) prevents submission', () => {
    const input = makeValidInput({
      requester_email: null,
      requester_phone: null,
      consent_to_contact_patient: true,
    })
    expect(canSubmitDapRequest(input)).toBe(false)
  })
})

// ─── Group 3: Practice outreach requires explicit consent ─────────────────────

describe('Practice outreach requires explicit consent', () => {
  it('submitted request with consent_to_contact_practice can be marked outreach ready', () => {
    const request = makePersistedRequest({
      request_status: 'submitted',
      consent_to_contact_practice: true,
    })
    expect(canMarkPracticeOutreachReady(request)).toBe(true)
  })

  it('consent_verified request with consent can be marked outreach ready', () => {
    const request = makePersistedRequest({
      request_status: 'consent_verified',
      consent_to_contact_practice: true,
    })
    expect(canMarkPracticeOutreachReady(request)).toBe(true)
  })

  it('queued_for_review request with consent can be marked outreach ready', () => {
    const request = makePersistedRequest({
      request_status: 'queued_for_review',
      consent_to_contact_practice: true,
    })
    expect(canMarkPracticeOutreachReady(request)).toBe(true)
  })

  it('submitted request WITHOUT consent_to_contact_practice cannot be marked outreach ready', () => {
    const request = makePersistedRequest({
      request_status: 'submitted',
      consent_to_contact_practice: false,
    })
    expect(canMarkPracticeOutreachReady(request)).toBe(false)
  })

  it('draft request cannot be marked outreach ready even with consent', () => {
    const request = makePersistedRequest({
      request_status: 'draft',
      consent_to_contact_practice: true,
    })
    expect(canMarkPracticeOutreachReady(request)).toBe(false)
  })

  it('closed request cannot be marked outreach ready', () => {
    const closedStatuses: DapRequestStatus[] = [
      'closed_no_response',
      'closed_invalid',
      'closed_duplicate',
      'closed_user_requested_stop',
    ]
    for (const status of closedStatuses) {
      const request = makePersistedRequest({
        request_status: status,
        consent_to_contact_practice: true,
      })
      expect(canMarkPracticeOutreachReady(request)).toBe(false)
    }
  })

  it('safety flags always have practiceContactedWithoutConsent: false in confirmation model', () => {
    const request = makePersistedRequest()
    const model = getDapRequestConfirmationModel(request)
    expect(model.practiceContactedWithoutConsent).toBe(false)
  })
})

// ─── Group 4: No-PHI guardrail ────────────────────────────────────────────────

describe('No-PHI guardrail', () => {
  it('SSN-formatted number is flagged', () => {
    expect(containsPhi('my ssn is 123-45-6789')).toBe(true)
  })

  it('"social security" phrase is flagged', () => {
    expect(containsPhi('my social security number is...')).toBe(true)
  })

  it('"diagnosis" is flagged', () => {
    expect(containsPhi('I have a diagnosis of periodontitis')).toBe(true)
  })

  it('"diagnosed" is flagged', () => {
    expect(containsPhi('I was diagnosed with gum disease')).toBe(true)
  })

  it('"symptoms" is flagged', () => {
    expect(containsPhi('my symptoms include bleeding')).toBe(true)
  })

  it('"insurance id" is flagged', () => {
    expect(containsPhi('insurance id: 12345')).toBe(true)
  })

  it('"insurance number" is flagged', () => {
    expect(containsPhi('my insurance number is ABC123')).toBe(true)
  })

  it('"member id" is flagged', () => {
    expect(containsPhi('member id 9988')).toBe(true)
  })

  it('"date of birth" is flagged', () => {
    expect(containsPhi('my date of birth is 01/01/1980')).toBe(true)
  })

  it('"DOB" is flagged', () => {
    expect(containsPhi('DOB: 1985-03-15')).toBe(true)
  })

  it('"medical record" is flagged', () => {
    expect(containsPhi('see my medical record from 2020')).toBe(true)
  })

  it('clean free text is not flagged', () => {
    expect(containsPhi('I am interested in getting a cleaning')).toBe(false)
    expect(containsPhi('looking for implant options near downtown')).toBe(false)
    expect(containsPhi('not sure yet what I need')).toBe(false)
  })

  it('allowed treatment interests do not trigger PHI detection', () => {
    const allowed = [
      'cleaning',
      'crown',
      'implant',
      'dentures',
      'emergency visit',
      'not sure yet',
    ]
    for (const interest of allowed) {
      expect(containsPhi(interest)).toBe(false)
    }
  })

  it('PHI in treatment_interest causes validation failure', () => {
    const result = validateDapRequestInput(
      makeValidInput({ treatment_interest: 'I was diagnosed with gum disease' })
    )
    expect(result.valid).toBe(false)
    expect(
      result.issues.some(i => i.field === 'treatment_interest' && i.code === 'PHI_DETECTED')
    ).toBe(true)
  })

  it('PHI in user_message causes validation failure', () => {
    const result = validateDapRequestInput(
      makeValidInput({ user_message: 'my ssn is 111-22-3333' })
    )
    expect(result.valid).toBe(false)
    expect(
      result.issues.some(i => i.field === 'user_message' && i.code === 'PHI_DETECTED')
    ).toBe(true)
  })

  it('getDapRequestSafetyFlags sets phiRiskDetected=true when PHI present', () => {
    const request = makePersistedRequest({
      treatment_interest: 'I was diagnosed with something',
    })
    const flags = getDapRequestSafetyFlags(request)
    expect(flags.phiRiskDetected).toBe(true)
  })

  it('getDapRequestSafetyFlags sets phiRiskDetected=false for clean content', () => {
    const request = makePersistedRequest({ treatment_interest: 'cleaning' })
    const flags = getDapRequestSafetyFlags(request)
    expect(flags.phiRiskDetected).toBe(false)
  })
})

// ─── Group 5: Dedupe key stability ────────────────────────────────────────────

describe('Dedupe key stability', () => {
  it('same input produces same dedupe key', () => {
    const input = makeValidInput()
    expect(buildDapRequestDedupeKey(input)).toBe(buildDapRequestDedupeKey(input))
  })

  it('different email produces different key', () => {
    const a = buildDapRequestDedupeKey(makeValidInput({ requester_email: 'a@example.com' }))
    const b = buildDapRequestDedupeKey(makeValidInput({ requester_email: 'b@example.com' }))
    expect(a).not.toBe(b)
  })

  it('different practice slug produces different key', () => {
    const a = buildDapRequestDedupeKey(makeValidInput({ preferred_practice_slug: 'practice-a' }))
    const b = buildDapRequestDedupeKey(makeValidInput({ preferred_practice_slug: 'practice-b' }))
    expect(a).not.toBe(b)
  })

  it('email is normalized before keying (case insensitive)', () => {
    const lower = buildDapRequestDedupeKey(makeValidInput({ requester_email: 'jane@example.com' }))
    const upper = buildDapRequestDedupeKey(makeValidInput({ requester_email: 'JANE@EXAMPLE.COM' }))
    expect(lower).toBe(upper)
  })

  it('user_message variation does not change dedupe key', () => {
    const a = buildDapRequestDedupeKey(makeValidInput({ user_message: null }))
    const b = buildDapRequestDedupeKey(makeValidInput({ user_message: 'Please hurry' }))
    expect(a).toBe(b)
  })

  it('treatment_interest variation does not change dedupe key', () => {
    const a = buildDapRequestDedupeKey(makeValidInput({ treatment_interest: 'cleaning' }))
    const b = buildDapRequestDedupeKey(makeValidInput({ treatment_interest: 'crown' }))
    expect(a).toBe(b)
  })

  it('key uses city+zip when no practice slug', () => {
    const input = makeValidInput({
      preferred_practice_slug: null,
      city: 'San Diego',
      zip: '92101',
    })
    const key = buildDapRequestDedupeKey(input)
    expect(key).toContain('san diego')
    expect(key).toContain('92101')
  })
})

// ─── Group 6: Status transitions are constrained ──────────────────────────────

describe('Status transitions are constrained', () => {
  it('draft → submitted is allowed', () => {
    expect(canTransitionDapRequestStatus('draft', 'submitted')).toBe(true)
  })

  it('draft → practice_contacted is not allowed', () => {
    expect(canTransitionDapRequestStatus('draft', 'practice_contacted')).toBe(false)
  })

  it('submitted → consent_verified is allowed', () => {
    expect(canTransitionDapRequestStatus('submitted', 'consent_verified')).toBe(true)
  })

  it('submitted → queued_for_review is allowed', () => {
    expect(canTransitionDapRequestStatus('submitted', 'queued_for_review')).toBe(true)
  })

  it('submitted → provider_confirmed is not allowed (direct jump)', () => {
    expect(canTransitionDapRequestStatus('submitted', 'provider_confirmed')).toBe(false)
  })

  it('practice_interested → provider_onboarding_started is allowed', () => {
    expect(canTransitionDapRequestStatus('practice_interested', 'provider_onboarding_started')).toBe(true)
  })

  it('provider_onboarding_started → provider_confirmed is allowed', () => {
    expect(canTransitionDapRequestStatus('provider_onboarding_started', 'provider_confirmed')).toBe(true)
  })

  it('terminal statuses have no allowed outbound transitions', () => {
    const terminal: DapRequestStatus[] = [
      'provider_confirmed',
      'closed_no_response',
      'closed_invalid',
      'closed_duplicate',
      'closed_user_requested_stop',
    ]
    const all: DapRequestStatus[] = [
      'draft', 'submitted', 'consent_verified', 'queued_for_review',
      'practice_outreach_ready', 'practice_contacted', 'practice_declined',
      'practice_interested', 'provider_onboarding_started', 'provider_confirmed',
      'closed_no_response', 'closed_invalid', 'closed_duplicate', 'closed_user_requested_stop',
    ]
    for (const from of terminal) {
      for (const to of all) {
        expect(canTransitionDapRequestStatus(from, to)).toBe(false)
      }
    }
  })

  it('self-transitions are not allowed', () => {
    const all: DapRequestStatus[] = [
      'draft', 'submitted', 'consent_verified', 'queued_for_review',
      'practice_outreach_ready', 'practice_contacted', 'practice_declined',
      'practice_interested', 'provider_onboarding_started', 'provider_confirmed',
      'closed_no_response', 'closed_invalid', 'closed_duplicate', 'closed_user_requested_stop',
    ]
    for (const status of all) {
      expect(canTransitionDapRequestStatus(status, status)).toBe(false)
    }
  })
})

// ─── Group 7: Provider confirmation cannot happen from request alone ──────────

describe('Provider confirmation cannot happen from request alone', () => {
  it('draft cannot transition to provider_confirmed', () => {
    expect(canTransitionDapRequestStatus('draft', 'provider_confirmed')).toBe(false)
  })

  it('submitted cannot transition to provider_confirmed', () => {
    expect(canTransitionDapRequestStatus('submitted', 'provider_confirmed')).toBe(false)
  })

  it('consent_verified cannot transition to provider_confirmed', () => {
    expect(canTransitionDapRequestStatus('consent_verified', 'provider_confirmed')).toBe(false)
  })

  it('queued_for_review cannot transition to provider_confirmed', () => {
    expect(canTransitionDapRequestStatus('queued_for_review', 'provider_confirmed')).toBe(false)
  })

  it('practice_outreach_ready cannot transition to provider_confirmed', () => {
    expect(canTransitionDapRequestStatus('practice_outreach_ready', 'provider_confirmed')).toBe(false)
  })

  it('practice_contacted cannot transition to provider_confirmed', () => {
    expect(canTransitionDapRequestStatus('practice_contacted', 'provider_confirmed')).toBe(false)
  })

  it('practice_interested cannot transition to provider_confirmed', () => {
    expect(canTransitionDapRequestStatus('practice_interested', 'provider_confirmed')).toBe(false)
  })

  it('only provider_onboarding_started can transition to provider_confirmed', () => {
    // All statuses except provider_onboarding_started cannot reach provider_confirmed
    const all: DapRequestStatus[] = [
      'draft', 'submitted', 'consent_verified', 'queued_for_review',
      'practice_outreach_ready', 'practice_contacted', 'practice_declined',
      'practice_interested', 'provider_confirmed',
      'closed_no_response', 'closed_invalid', 'closed_duplicate', 'closed_user_requested_stop',
    ]
    for (const from of all) {
      expect(canTransitionDapRequestStatus(from, 'provider_confirmed')).toBe(false)
    }
    expect(canTransitionDapRequestStatus('provider_onboarding_started', 'provider_confirmed')).toBe(true)
  })

  it('safety flags never imply enrollment regardless of status', () => {
    const statuses: DapRequestStatus[] = [
      'submitted', 'practice_interested', 'provider_onboarding_started', 'provider_confirmed',
    ]
    for (const status of statuses) {
      const flags = getDapRequestSafetyFlags(makePersistedRequest({ request_status: status }))
      expect(flags.impliesEnrollment).toBe(false)
    }
  })
})

// ─── Group 8: Confirmation model — no enrollment guarantee ────────────────────

describe('Confirmation model: no enrollment guarantee', () => {
  it('isEnrollment is false', () => {
    const model = getDapRequestConfirmationModel(makePersistedRequest())
    expect(model.isEnrollment).toBe(false)
  })

  it('requestReceived is true', () => {
    const model = getDapRequestConfirmationModel(makePersistedRequest())
    expect(model.requestReceived).toBe(true)
  })

  it('body text explicitly states this is not enrollment', () => {
    const model = getDapRequestConfirmationModel(makePersistedRequest())
    expect(model.body.toLowerCase()).toMatch(/not enrollment/)
  })

  it('body does not contain "you are enrolled" or similar', () => {
    const model = getDapRequestConfirmationModel(makePersistedRequest())
    expect(model.body.toLowerCase()).not.toMatch(/you are enrolled/)
    expect(model.body.toLowerCase()).not.toMatch(/enrollment confirmed/)
    expect(model.body.toLowerCase()).not.toMatch(/welcome to dap/)
  })

  it('headline does not imply enrollment', () => {
    const model = getDapRequestConfirmationModel(makePersistedRequest())
    expect(model.headline.toLowerCase()).not.toMatch(/enrolled/)
    expect(model.headline.toLowerCase()).not.toMatch(/welcome to the plan/)
  })
})

// ─── Group 9: Confirmation model — no pricing guarantee ──────────────────────

describe('Confirmation model: no pricing guarantee', () => {
  it('guaranteesPricing is false', () => {
    const model = getDapRequestConfirmationModel(makePersistedRequest())
    expect(model.guaranteesPricing).toBe(false)
  })

  it('guaranteesAvailability is false', () => {
    const model = getDapRequestConfirmationModel(makePersistedRequest())
    expect(model.guaranteesAvailability).toBe(false)
  })

  it('body does not contain guaranteed savings language', () => {
    const model = getDapRequestConfirmationModel(makePersistedRequest())
    expect(model.body.toLowerCase()).not.toMatch(/guaranteed savings/)
    expect(model.body.toLowerCase()).not.toMatch(/save \$/)
    expect(model.body.toLowerCase()).not.toMatch(/you will save/)
  })

  it('body states availability is not guaranteed', () => {
    const model = getDapRequestConfirmationModel(makePersistedRequest())
    expect(model.body.toLowerCase()).toMatch(/not guaranteed/)
  })

  it('body states no office will be contacted without consent', () => {
    const model = getDapRequestConfirmationModel(makePersistedRequest())
    expect(model.body.toLowerCase()).toMatch(/without your consent/)
  })

  it('safety flags never imply guaranteed pricing', () => {
    const flags = getDapRequestSafetyFlags(makePersistedRequest())
    expect(flags.impliesGuaranteedPricing).toBe(false)
  })

  it('safety flags never imply guaranteed availability', () => {
    const flags = getDapRequestSafetyFlags(makePersistedRequest())
    expect(flags.impliesGuaranteedAvailability).toBe(false)
  })

  it('safety flags always require consent', () => {
    const flags = getDapRequestSafetyFlags(makePersistedRequest())
    expect(flags.requiresConsent).toBe(true)
  })
})

// ─── Group 10: API route inventory (Phase 9C added POST /api/dap/requests) ────

describe('API route inventory', () => {
  const appDir = resolve(ROOT, 'app')

  it('only the Phase 9C route handler exists under app/', () => {
    const routeFiles = findFiles(appDir, p => p.endsWith('route.ts') || p.endsWith('route.tsx'))
    const KNOWN_ROUTES = [
      'app/api/dap/requests/route.ts',
      'app/api/businesses/dental-advantage-plan/stages/review/route.ts',
    ]
    const unexpected = routeFiles.filter(r => !KNOWN_ROUTES.some(k => r.endsWith(k)))
    expect(unexpected).toHaveLength(0)
  })

  it('app/api exists only for the DAP request handler (Phase 9C)', () => {
    expect(existsSync(resolve(appDir, 'api/dap/requests/route.ts'))).toBe(true)
    expect(existsSync(resolve(appDir, 'api/dap/requests/page.tsx'))).toBe(false)
  })
})

// ─── Group 11: Database migration inventory (Phase 9C added SQL migration) ────

describe('Database migration inventory', () => {
  it('supabase migrations directory exists (Phase 9C)', () => {
    expect(existsSync(resolve(ROOT, 'supabase/migrations'))).toBe(true)
  })

  it('exactly the known SQL migrations exist (Phase 9Z added dry-run events migration)', () => {
    const sqlFiles = findFiles(ROOT, p => p.endsWith('.sql'))
    const KNOWN_MIGRATIONS = [
      'supabase/migrations/20260429000000_dap_requests.sql',
      'supabase/migrations/20260429000001_dap_practice_onboarding.sql',
      'supabase/migrations/20260429000002_dap_offer_terms.sql',
      'supabase/migrations/20260429000003_dap_offer_terms_review.sql',
      'supabase/migrations/20260429000004_dap_provider_participation.sql',
      'supabase/migrations/20260430000000_dap_communication_dispatch_events.sql',
      'supabase/migrations/20260430000001_dap_communication_approval_events.sql',
      'supabase/migrations/20260430000002_dap_communication_dry_run_events.sql',
      'supabase/migrations/20260430000003_dap_admin_decision_events.sql',
      'supabase/migrations/20260501010000_cbcc_projects.sql',
    ]
    const unexpected = sqlFiles.filter(f => !KNOWN_MIGRATIONS.some(k => f.endsWith(k)))
    expect(unexpected).toHaveLength(0)
    expect(sqlFiles).toHaveLength(10)
  })
})

// ─── Group 12: Tier 2 and Tier 3 routes remain absent ────────────────────────
// Phase 9A added no production routes (architecture only).
// Phase 9B later promoted Tier 1 routes (dental-advantage-plan, guides, treatments).
// The checks below remain valid for routes that are still deferred.

describe('Tier 2 and Tier 3 routes remain absent', () => {
  const appDir = resolve(ROOT, 'app')

  it('app/dentists does not exist (Tier 2 — live data required)', () => {
    expect(existsSync(resolve(appDir, 'dentists'))).toBe(false)
  })

  it('app/request does not exist (Tier 3 — backend required)', () => {
    expect(existsSync(resolve(appDir, 'request'))).toBe(false)
  })

  it('app/search does not exist (Tier 2 — live search required)', () => {
    expect(existsSync(resolve(appDir, 'search'))).toBe(false)
  })

  it('app/api exists only for the Phase 9C route handler (no public pages)', () => {
    // Phase 9C added app/api/dap/requests/route.ts — only that route should exist
    expect(existsSync(resolve(appDir, 'api/dap/requests/route.ts'))).toBe(true)
    expect(existsSync(resolve(appDir, 'api/dap/requests/page.tsx'))).toBe(false)
  })
})

// ─── Group 13: Deferred integrations remain deferred ─────────────────────────

describe('Deferred integrations remain deferred', () => {
  it('docs/dap-request-backend-architecture.md exists and documents deferred integrations', () => {
    const docPath = resolve(ROOT, 'docs/dap-request-backend-architecture.md')
    expect(existsSync(docPath)).toBe(true)
    const content = readFileSync(docPath, 'utf8').toLowerCase()
    expect(content).toMatch(/deferred/)
  })

  it('no CRM integration files exist', () => {
    const crmFiles = findFiles(ROOT, p =>
      p.includes('/crm/') || p.includes('crm-') || p.endsWith('.crm.ts')
    )
    // Filter out test files referencing CRM in comments
    const nonTestFiles = crmFiles.filter(p => !p.includes('.test.'))
    expect(nonTestFiles).toHaveLength(0)
  })

  it('no MKCRM integration files exist outside the deliberate mkcrm/ folder', () => {
    const mkCrmFiles = findFiles(ROOT, p =>
      p.includes('mkcrm') && !p.includes('lib/cb-control-center/mkcrm/')
    )
    expect(mkCrmFiles).toHaveLength(0)
  })

  it('no email notification handler files exist under app/api', () => {
    // app/api exists (Phase 9C), but only for the DAP request handler — no email routes
    const emailRoutes = findFiles(resolve(ROOT, 'app/api'), p =>
      p.includes('email') || p.includes('notify') || p.includes('send')
    )
    expect(emailRoutes).toHaveLength(0)
  })

  it('dapRequestRules.ts does not import CRM, MKCRM, or email packages', () => {
    const content = readFileSync(
      resolve(ROOT, 'lib/dap/registry/dapRequestRules.ts'),
      'utf8'
    )
    expect(content).not.toMatch(/from ['"].*crm/)
    expect(content).not.toMatch(/from ['"].*mkcrm/)
    expect(content).not.toMatch(/from ['"].*resend/)
    expect(content).not.toMatch(/from ['"].*sendgrid/)
    expect(content).not.toMatch(/from ['"].*nodemailer/)
    expect(content).not.toMatch(/from ['"].*webhook/)
  })

  it('dapRequestTypes.ts contains no database driver imports', () => {
    const content = readFileSync(
      resolve(ROOT, 'lib/dap/registry/dapRequestTypes.ts'),
      'utf8'
    )
    expect(content).not.toMatch(/from ['"]@supabase/)
    expect(content).not.toMatch(/from ['"]pg['"]/)
    expect(content).not.toMatch(/from ['"]drizzle/)
    expect(content).not.toMatch(/from ['"]prisma/)
  })

  it('architecture doc mentions all required deferred items', () => {
    const doc = readFileSync(
      resolve(ROOT, 'docs/dap-request-backend-architecture.md'),
      'utf8'
    ).toLowerCase()
    expect(doc).toMatch(/crm/)
    expect(doc).toMatch(/webhook/)
    expect(doc).toMatch(/email/)
    expect(doc).toMatch(/migration/)
    expect(doc).toMatch(/admin/)
  })
})
