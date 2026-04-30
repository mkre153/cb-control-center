// Dispatch readiness is a read-only gate. No email sending, no MKCRM calls,
// no Supabase mutations. Previewable does not mean sendable.
// CB Control Center determines dispatch eligibility. MKCRM does not.

export type DapCommunicationDispatchAudience =
  | 'member'
  | 'practice'
  | 'admin'

export type DapCommunicationDispatchChannel = 'email'

export type DapCommunicationDispatchStatus =
  | 'not_ready'
  | 'ready_for_review'
  | 'approved_for_future_dispatch'
  | 'blocked'

export type DapCommunicationDispatchBlockerCode =
  | 'unsafe_copy'
  | 'invalid_audience'
  | 'missing_cb_control_center_authority'
  | 'mkcrm_authority_detected'
  | 'payment_authority_detected'
  | 'payment_cta_detected'
  | 'phi_detected'
  | 'missing_operational_decision'
  | 'missing_billing_event_source'
  | 'standing_not_derived'
  | 'unknown_template'

export interface DapCommunicationDispatchBlocker {
  code:     DapCommunicationDispatchBlockerCode
  message:  string
  severity: 'blocking' | 'warning'
}

export interface DapCommunicationDispatchReadiness {
  templateKey:               string
  audience:                  DapCommunicationDispatchAudience
  channel:                   DapCommunicationDispatchChannel
  status:                    DapCommunicationDispatchStatus
  eligibleForFutureDispatch: boolean
  blockers:                  DapCommunicationDispatchBlocker[]
  source: {
    decisionAuthority: 'cb_control_center'
    crmAuthority:      false
    paymentAuthority:  false
    billingSource?:    'client_builder_pro'
  }
  safety: {
    copySafe:                boolean
    includesPaymentCta:      false
    includesPhi:             false
    decidedByMkcrm:          false
    decidedByCbControlCenter: true
  }
}
