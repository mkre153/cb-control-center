// DAP admin rejection email types.
// Rejection decisions are made by CB Control Center only.
// MKCRM does not decide rejections.
// Client Builder Pro / payment systems have no authority over DAP enrollment decisions.
// Preview-only. No email sending. No PHI. No payment CTAs.

export type DapAdminRejectionEmailTemplateKey =
  | 'practice_enrollment_rejected'
  | 'practice_participation_rejected'
  | 'member_enrollment_rejected'
  | 'membership_activation_rejected'

export type DapAdminRejectionEmailAudience = 'practice_admin' | 'member'

export interface DapAdminRejectionEmailCopy {
  templateKey:         DapAdminRejectionEmailTemplateKey
  audience:            DapAdminRejectionEmailAudience
  subject:             string
  previewText:         string
  headline:            string
  body:                string[]
  footerNote:          string
  includesPaymentCta:  false
  includesPhi:         false
  includesCta:         false
}
