// Admin approval is not delivery.
// An approved communication is approved for future sending only.
// CB Control Center determines approval. MKCRM does not.
// No email sending, no MKCRM calls, no Supabase mutations in this module.

import type {
  DapCommunicationDispatchAudience,
  DapCommunicationDispatchChannel,
  DapCommunicationDispatchStatus,
} from './dapCommunicationDispatchTypes'

import type {
  DapCommunicationType,
  DapCommunicationDispatchEventType,
} from './dapCommunicationDispatchEventTypes'

export type { DapCommunicationDispatchAudience, DapCommunicationDispatchChannel }

export type DapCommunicationApprovalStatus =
  | 'not_reviewed'
  | 'approved_for_future_send'
  | 'rejected_for_future_send'
  | 'approval_revoked'

export type DapCommunicationApprovalEventType =
  | 'approval_review_started'
  | 'approval_granted_for_future_send'
  | 'approval_rejected_for_future_send'
  | 'approval_revoked'

export type DapCommunicationApprovalActorType =
  | 'admin'
  | 'system'

export interface DapCommunicationApprovalDecision {
  approvalId:           string
  verticalKey:          'dap'
  communicationType:    DapCommunicationType
  templateKey:          string
  audience:             DapCommunicationDispatchAudience
  channel:              DapCommunicationDispatchChannel
  approvalStatus:       DapCommunicationApprovalStatus
  approvalEventType:    DapCommunicationApprovalEventType
  eligibleForApproval:  boolean
  approvalBlockerCodes: string[]
  readinessStatus:      DapCommunicationDispatchStatus
  dispatchEventType:    DapCommunicationDispatchEventType
  shadowPayloadValid:   boolean
  source: {
    decisionAuthority: 'cb_control_center'
    crmAuthority:      false
    paymentAuthority:  false
    billingSource?:    'client_builder_pro'
  }
  actor: {
    type: DapCommunicationApprovalActorType
    id:   string
  }
  delivery: {
    deliveryDisabled:      true
    externalSendDisabled:  true
    mkcrmDeliveryDisabled: true
    resendDisabled:        true
  }
  safety: {
    noPhi:            true
    noPaymentCta:     true
    noEmailBody:      true
    noStoredStanding: true
  }
  createdAt: string
  notes?:    string
}
