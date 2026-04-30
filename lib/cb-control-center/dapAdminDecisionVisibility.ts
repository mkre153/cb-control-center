// DAP admin decision visibility model.
// Pure — no network calls, no Supabase, no MKCRM, no payments.
// Describes what an admin can see and act on for a given decision state.
// CB Control Center makes enrollment decisions. MKCRM has no decision authority.

import type { DapAdminRejectionEmailTemplateKey } from './dapAdminRejectionEmailTypes'

// ─── Types ────────────────────────────────────────────────────────────────────

export type DapAdminDecisionVisibilityState =
  | 'pending'
  | 'queued_for_review'
  | 'needs_review'
  | 'approved'
  | 'rejected'

export interface DapAdminDecisionVisibilityModel {
  state:                       DapAdminDecisionVisibilityState
  label:                       string
  description:                 string
  decisionAuthority:           'cb_control_center'
  crmAuthority:                false
  paymentAuthorityInsideDap:   false
  externalDispatchEnabled:     false
  communicationPreviewAvailable: boolean
  communicationPreviewPath:    string | null
  applicableRejectionTemplates: DapAdminRejectionEmailTemplateKey[]
  safety: {
    includesPhi:          false
    includesPaymentCta:   false
  }
}

// ─── Locked constants ─────────────────────────────────────────────────────────

const SAFETY = {
  includesPhi:        false,
  includesPaymentCta: false,
} as const

// ─── State map ────────────────────────────────────────────────────────────────

const VISIBILITY_MAP: Record<DapAdminDecisionVisibilityState, DapAdminDecisionVisibilityModel> = {
  pending: {
    state:                        'pending',
    label:                        'Pending',
    description:                  'Request received but not yet queued for admin review.',
    decisionAuthority:            'cb_control_center',
    crmAuthority:                 false,
    paymentAuthorityInsideDap:    false,
    externalDispatchEnabled:      false,
    communicationPreviewAvailable: false,
    communicationPreviewPath:     null,
    applicableRejectionTemplates: [],
    safety:                       SAFETY,
  },
  queued_for_review: {
    state:                        'queued_for_review',
    label:                        'Queued for Review',
    description:                  'Request is in the admin review queue. No decision has been made.',
    decisionAuthority:            'cb_control_center',
    crmAuthority:                 false,
    paymentAuthorityInsideDap:    false,
    externalDispatchEnabled:      false,
    communicationPreviewAvailable: false,
    communicationPreviewPath:     null,
    applicableRejectionTemplates: [],
    safety:                       SAFETY,
  },
  needs_review: {
    state:                        'needs_review',
    label:                        'Needs Review',
    description:                  'Request has been flagged and requires additional review before a decision can be made.',
    decisionAuthority:            'cb_control_center',
    crmAuthority:                 false,
    paymentAuthorityInsideDap:    false,
    externalDispatchEnabled:      false,
    communicationPreviewAvailable: false,
    communicationPreviewPath:     null,
    applicableRejectionTemplates: [],
    safety:                       SAFETY,
  },
  approved: {
    state:                        'approved',
    label:                        'Approved',
    description:                  'Admin review passed. This does not confirm provider participation or publish any patient-facing content.',
    decisionAuthority:            'cb_control_center',
    crmAuthority:                 false,
    paymentAuthorityInsideDap:    false,
    externalDispatchEnabled:      false,
    communicationPreviewAvailable: false,
    communicationPreviewPath:     null,
    applicableRejectionTemplates: [],
    safety:                       SAFETY,
  },
  rejected: {
    state:                        'rejected',
    label:                        'Rejected',
    description:                  'Admin review did not pass. Rejection email templates are available for preview. No email has been sent.',
    decisionAuthority:            'cb_control_center',
    crmAuthority:                 false,
    paymentAuthorityInsideDap:    false,
    externalDispatchEnabled:      false,
    communicationPreviewAvailable: true,
    communicationPreviewPath:     '/preview/dap/admin-rejection-emails',
    applicableRejectionTemplates: [
      'practice_enrollment_rejected',
      'practice_participation_rejected',
      'member_enrollment_rejected',
      'membership_activation_rejected',
    ],
    safety: SAFETY,
  },
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getDapAdminDecisionVisibilityModel(
  state: DapAdminDecisionVisibilityState
): DapAdminDecisionVisibilityModel {
  return VISIBILITY_MAP[state]
}

export function getAllDapAdminDecisionVisibilityModels(): DapAdminDecisionVisibilityModel[] {
  return Object.values(VISIBILITY_MAP)
}

export const DAP_ADMIN_DECISION_VISIBILITY_STATES: DapAdminDecisionVisibilityState[] = [
  'pending',
  'queued_for_review',
  'needs_review',
  'approved',
  'rejected',
]
