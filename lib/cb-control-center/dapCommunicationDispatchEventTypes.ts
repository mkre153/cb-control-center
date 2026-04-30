// Dispatch events are append-only. No update. No delete. No overwrite.
// Events record decisions. They do not execute sends.
// CB Control Center is the dispatch authority. MKCRM is not.

import type {
  DapCommunicationDispatchAudience,
  DapCommunicationDispatchChannel,
  DapCommunicationDispatchStatus,
  DapCommunicationDispatchBlockerCode,
} from './dapCommunicationDispatchTypes'

export type { DapCommunicationDispatchAudience, DapCommunicationDispatchChannel }

export type DapCommunicationType =
  | 'member_status_email'
  | 'practice_decision_email'

export type DapCommunicationDispatchEventType =
  | 'dispatch_review_started'
  | 'dispatch_ready_for_review'
  | 'dispatch_blocked'
  | 'dispatch_approved_for_future_send'
  | 'dispatch_cancelled'
  | 'dispatch_shadow_payload_created'

export type DapCommunicationDispatchActorType =
  | 'system'
  | 'admin'

export interface DapCommunicationDispatchEvent {
  eventId:                   string
  verticalKey:               'dap'
  communicationType:         DapCommunicationType
  templateKey:               string
  audience:                  DapCommunicationDispatchAudience
  channel:                   DapCommunicationDispatchChannel
  eventType:                 DapCommunicationDispatchEventType
  readinessStatus:           DapCommunicationDispatchStatus
  eligibleForFutureDispatch: boolean
  blockerCodes:              DapCommunicationDispatchBlockerCode[]
  source: {
    decisionAuthority: 'cb_control_center'
    crmAuthority:      false
    paymentAuthority:  false
    billingSource?:    'client_builder_pro'
  }
  actor: {
    type: DapCommunicationDispatchActorType
    id:   string
  }
  createdAt: string
  metadata: {
    externalSendDisabled:   true
    mkcrmDeliveryDisabled:  true
    resendDisabled:         true
    noPhi:                  true
    noPaymentCta:           true
  }
}
