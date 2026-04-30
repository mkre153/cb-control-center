// Dry-run delivery is not delivery.
// A dry-run record shows that an approved communication would be eligible
// for future delivery, but it does not send email, call MKCRM, call Resend,
// enqueue delivery, schedule delivery, or create real delivery status.
// CB Control Center is the authority. MKCRM is not.

import type {
  DapCommunicationDispatchAudience,
  DapCommunicationDispatchChannel,
  DapCommunicationDispatchStatus,
} from './dapCommunicationDispatchTypes'

import type {
  DapCommunicationType,
  DapCommunicationDispatchEventType,
} from './dapCommunicationDispatchEventTypes'

import type {
  DapCommunicationApprovalStatus,
  DapCommunicationApprovalEventType,
} from './dapCommunicationApprovalTypes'

export type { DapCommunicationDispatchAudience, DapCommunicationDispatchChannel }

export type DapCommunicationDryRunStatus =
  | 'not_ready'
  | 'dry_run_ready'
  | 'dry_run_blocked'

export type DapCommunicationDryRunEventType =
  | 'dry_run_delivery_checked'
  | 'dry_run_delivery_ready'
  | 'dry_run_delivery_blocked'

export type DapCommunicationDryRunAdapter =
  | 'mkcrm_shadow'
  | 'resend_disabled'

export interface DapCommunicationDryRunResult {
  dryRunId:                  string
  verticalKey:               'dap'
  communicationType:         DapCommunicationType
  templateKey:               string
  audience:                  DapCommunicationDispatchAudience
  channel:                   DapCommunicationDispatchChannel
  adapter:                   DapCommunicationDryRunAdapter
  dryRunStatus:              DapCommunicationDryRunStatus
  dryRunEventType:           DapCommunicationDryRunEventType
  eligibleForDryRunDelivery: boolean
  dryRunBlockerCodes:        string[]
  approvalStatus:            DapCommunicationApprovalStatus
  approvalEventType:         DapCommunicationApprovalEventType
  dispatchEventType:         DapCommunicationDispatchEventType
  readinessStatus:           DapCommunicationDispatchStatus
  shadowPayloadValid:        boolean
  source: {
    decisionAuthority: 'cb_control_center'
    crmAuthority:      false
    paymentAuthority:  false
    billingSource?:    'client_builder_pro'
  }
  delivery: {
    dryRunOnly:            true
    deliveryDisabled:      true
    externalSendDisabled:  true
    mkcrmDeliveryDisabled: true
    resendDisabled:        true
    queued:                false
    scheduled:             false
    sent:                  false
  }
  safety: {
    noPhi:            true
    noPaymentCta:     true
    noEmailBody:      true
    noStoredStanding: true
  }
  createdAt: string
}
