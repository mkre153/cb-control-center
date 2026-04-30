// DAP member standing is derived from append-only Client Builder Pro billing events.
// Notification copy reflects derived status only.
// No email sending, no payment processing, no PHI.

import type { DapMemberStanding } from './dapMemberStatusTypes'

export type DapMemberStatusEmailTemplateKey =
  | 'member_status_unknown'
  | 'member_status_pending'
  | 'member_status_active'
  | 'member_status_past_due'
  | 'member_status_payment_failed'
  | 'member_status_canceled'
  | 'member_status_refunded'
  | 'member_status_chargeback'

export type DapMemberStatusEmailAudience = 'member'

export interface DapMemberStatusEmailCopy {
  templateKey:              DapMemberStatusEmailTemplateKey
  audience:                 DapMemberStatusEmailAudience
  standing:                 DapMemberStanding
  subject:                  string
  previewText:              string
  headline:                 string
  body:                     string[]
  footerNote:               string
  includesPaymentCta:       false
  includesPhi:              false
  derivedFromBillingEvents: true
}
