// DAP admin rejection visibility model.
// Connects the rejected decision state to Phase 2B rejection email templates.
// Pure — no network calls, no Supabase, no MKCRM, no payments.
// Preview-only. No email has been sent. CB Control Center decides rejections.

import type {
  DapAdminRejectionEmailTemplateKey,
  DapAdminRejectionEmailAudience,
} from './dapAdminRejectionEmailTypes'

// ─── Type ─────────────────────────────────────────────────────────────────────

export interface DapAdminRejectionVisibilityModel {
  templateKey:       DapAdminRejectionEmailTemplateKey
  audience:          DapAdminRejectionEmailAudience
  previewPath:       '/preview/dap/admin-rejection-emails'
  decisionAuthority: 'cb_control_center'
  crmAuthority:      false
  paymentAuthority:  false
  previewOnly:       true
  sent:              false
  safety: {
    includesPhi:         false
    includesPaymentCta:  false
  }
}

// ─── Locked constants ─────────────────────────────────────────────────────────

const SAFETY = {
  includesPhi:        false,
  includesPaymentCta: false,
} as const

// ─── Template map ─────────────────────────────────────────────────────────────

const REJECTION_VISIBILITY_MAP: Record<
  DapAdminRejectionEmailTemplateKey,
  DapAdminRejectionVisibilityModel
> = {
  practice_enrollment_rejected: {
    templateKey:       'practice_enrollment_rejected',
    audience:          'practice_admin',
    previewPath:       '/preview/dap/admin-rejection-emails',
    decisionAuthority: 'cb_control_center',
    crmAuthority:      false,
    paymentAuthority:  false,
    previewOnly:       true,
    sent:              false,
    safety:            SAFETY,
  },
  practice_participation_rejected: {
    templateKey:       'practice_participation_rejected',
    audience:          'practice_admin',
    previewPath:       '/preview/dap/admin-rejection-emails',
    decisionAuthority: 'cb_control_center',
    crmAuthority:      false,
    paymentAuthority:  false,
    previewOnly:       true,
    sent:              false,
    safety:            SAFETY,
  },
  member_enrollment_rejected: {
    templateKey:       'member_enrollment_rejected',
    audience:          'member',
    previewPath:       '/preview/dap/admin-rejection-emails',
    decisionAuthority: 'cb_control_center',
    crmAuthority:      false,
    paymentAuthority:  false,
    previewOnly:       true,
    sent:              false,
    safety:            SAFETY,
  },
  membership_activation_rejected: {
    templateKey:       'membership_activation_rejected',
    audience:          'member',
    previewPath:       '/preview/dap/admin-rejection-emails',
    decisionAuthority: 'cb_control_center',
    crmAuthority:      false,
    paymentAuthority:  false,
    previewOnly:       true,
    sent:              false,
    safety:            SAFETY,
  },
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getDapAdminRejectionVisibilityModel(
  templateKey: DapAdminRejectionEmailTemplateKey
): DapAdminRejectionVisibilityModel {
  return REJECTION_VISIBILITY_MAP[templateKey]
}

export function getAllDapAdminRejectionVisibilityModels(): DapAdminRejectionVisibilityModel[] {
  return Object.values(REJECTION_VISIBILITY_MAP)
}

export const DAP_REJECTION_VISIBILITY_TEMPLATE_KEYS: DapAdminRejectionEmailTemplateKey[] = [
  'practice_enrollment_rejected',
  'practice_participation_rejected',
  'member_enrollment_rejected',
  'membership_activation_rejected',
]
