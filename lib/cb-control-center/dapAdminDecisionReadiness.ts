// Admin decision readiness helper.
// Pure — no network calls, no Supabase, no MKCRM, no payments.
// Admin decision is required. MKCRM cannot decide. Payment standing cannot decide.

import type { DapRequestStatus } from '../dap/registry/dapRequestTypes'

export type DapAdminDecisionReadinessStatus =
  | 'ready_for_review'
  | 'missing_required_fields'
  | 'blocked_by_safety_rules'
  | 'already_decided'

export interface DapAdminDecisionReadinessResult {
  status:     DapAdminDecisionReadinessStatus
  requestId:  string
  canApprove: boolean
  canReject:  boolean
  blockers:   string[]
  warnings:   string[]
  safety: {
    includesPhi:                 false
    usesPaymentAuthority:        false
    usesMkcrmDecisionAuthority:  false
    adminDecisionRequired:       true
  }
}

export interface DapAdminDecisionInput {
  requestId:                string
  requestStatus:            DapRequestStatus
  requesterName:            string | null
  requesterEmail:           string | null
  requesterPhone:           string | null
  consentToContactPractice: boolean
  consentToContactPatient:  boolean
  noPhiAcknowledged:        boolean
  consentText:              string | null
}

const ALREADY_DECIDED_STATUSES: ReadonlySet<DapRequestStatus> = new Set([
  'approved',
  'rejected',
])

const SAFETY = {
  includesPhi:                false,
  usesPaymentAuthority:       false,
  usesMkcrmDecisionAuthority: false,
  adminDecisionRequired:      true,
} as const

export function buildDapAdminDecisionReadiness(
  input: DapAdminDecisionInput,
): DapAdminDecisionReadinessResult {
  const warnings: string[] = []

  if (ALREADY_DECIDED_STATUSES.has(input.requestStatus)) {
    return {
      status:     'already_decided',
      requestId:  input.requestId,
      canApprove: false,
      canReject:  false,
      blockers:   [`Request is already ${input.requestStatus}.`],
      warnings:   [],
      safety:     SAFETY,
    }
  }

  if (!input.noPhiAcknowledged) {
    return {
      status:     'blocked_by_safety_rules',
      requestId:  input.requestId,
      canApprove: false,
      canReject:  false,
      blockers:   ['Patient has not acknowledged the no-PHI policy.'],
      warnings,
      safety:     SAFETY,
    }
  }

  const approvalBlockers: string[] = []

  if (!input.requesterName?.trim()) {
    approvalBlockers.push('Requester name is required.')
  }

  const hasContact = !!input.requesterEmail?.trim() || !!input.requesterPhone?.trim()
  if (!hasContact) {
    approvalBlockers.push('At least one contact method (email or phone) is required.')
  }

  if (!input.consentToContactPractice) {
    approvalBlockers.push('Consent to contact practice is required.')
  }

  if (!input.consentToContactPatient) {
    approvalBlockers.push('Consent to contact patient is required.')
  }

  if (!input.consentText?.trim()) {
    approvalBlockers.push('Consent text is required.')
  }

  if (approvalBlockers.length > 0) {
    return {
      status:     'missing_required_fields',
      requestId:  input.requestId,
      canApprove: false,
      canReject:  true,
      blockers:   approvalBlockers,
      warnings,
      safety:     SAFETY,
    }
  }

  return {
    status:     'ready_for_review',
    requestId:  input.requestId,
    canApprove: true,
    canReject:  true,
    blockers:   [],
    warnings,
    safety:     SAFETY,
  }
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

export const DAP_ADMIN_DECISION_FIXTURES: Record<string, DapAdminDecisionInput> = {
  ready: {
    requestId:                'req-fixture-ready',
    requestStatus:            'queued_for_review',
    requesterName:            'Jane Smith',
    requesterEmail:           'jane@example.com',
    requesterPhone:           null,
    consentToContactPractice: true,
    consentToContactPatient:  true,
    noPhiAcknowledged:        true,
    consentText:              'I consent to be contacted.',
  },
  'missing-fields': {
    requestId:                'req-fixture-missing',
    requestStatus:            'queued_for_review',
    requesterName:            '',
    requesterEmail:           null,
    requesterPhone:           null,
    consentToContactPractice: false,
    consentToContactPatient:  false,
    noPhiAcknowledged:        true,
    consentText:              null,
  },
  'safety-blocked': {
    requestId:                'req-fixture-safety',
    requestStatus:            'queued_for_review',
    requesterName:            'John Doe',
    requesterEmail:           'john@example.com',
    requesterPhone:           null,
    consentToContactPractice: true,
    consentToContactPatient:  true,
    noPhiAcknowledged:        false,
    consentText:              'I consent.',
  },
  'already-approved': {
    requestId:                'req-fixture-approved',
    requestStatus:            'approved',
    requesterName:            'Mary Jones',
    requesterEmail:           'mary@example.com',
    requesterPhone:           null,
    consentToContactPractice: true,
    consentToContactPatient:  true,
    noPhiAcknowledged:        true,
    consentText:              'I consent.',
  },
  'already-rejected': {
    requestId:                'req-fixture-rejected',
    requestStatus:            'rejected',
    requesterName:            'Bob Brown',
    requesterEmail:           'bob@example.com',
    requesterPhone:           null,
    consentToContactPractice: true,
    consentToContactPatient:  true,
    noPhiAcknowledged:        true,
    consentText:              'I consent.',
  },
}

export function getAllDapAdminDecisionReadinessPreviews(): DapAdminDecisionReadinessResult[] {
  return Object.values(DAP_ADMIN_DECISION_FIXTURES).map(buildDapAdminDecisionReadiness)
}
