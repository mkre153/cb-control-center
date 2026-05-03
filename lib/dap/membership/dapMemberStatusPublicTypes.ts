// Public-safe member status types.
// The page displays status. It does not decide status.
// standing is derived, not stored.
// No PHI. No payment CTAs. No raw billing events. No MKCRM authority.
// Client Builder Pro is the payment system. DAP is the registry.

import type { DapMemberStanding } from './dapMemberStatusTypes'

export type { DapMemberStanding }

export type DapMemberPublicStatus =
  | 'active'
  | 'pending'
  | 'attention_needed'
  | 'inactive'
  | 'unknown'

export interface DapMemberStatusPublicReadModel {
  membershipId:     string
  verticalKey:      'dap'
  publicStatus:     DapMemberPublicStatus
  standing:         DapMemberStanding
  statusLabel:      string
  statusSummary:    string
  nextStep:         string
  lastActivityDate?: string  // YYYY-MM-DD, derived from last billing event — no time, no raw event type
  source: {
    derivedFromBillingEvents: true
    paymentAuthority:         'client_builder_pro'
    crmAuthority:             false
    dapAuthority:             'registry_only'
  }
  safety: {
    includesPhi:              false
    includesPaymentCta:       false
    includesRawBillingEvents: false
  }
}
