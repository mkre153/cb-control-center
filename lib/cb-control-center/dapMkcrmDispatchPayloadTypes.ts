// MKCRM shadow dispatch payloads are previews only.
// MKCRM does not decide eligibility, practice status, payment status,
// membership standing, or dispatch approval.
// No delivery. No send. No mutations.

import type {
  DapCommunicationDispatchAudience,
  DapCommunicationDispatchChannel,
  DapCommunicationDispatchStatus,
  DapCommunicationDispatchBlockerCode,
} from './dapCommunicationDispatchTypes'

import type {
  DapCommunicationType,
  DapCommunicationDispatchEventType,
} from './dapCommunicationDispatchEventTypes'

export type { DapCommunicationDispatchAudience, DapCommunicationDispatchChannel }

export type DapMkcrmDispatchShadowEventType = 'mkcrm_dispatch_shadow_payload_created'

export interface DapMkcrmDispatchShadowPayload {
  verticalKey:               'dap'
  shadowMode:                true
  eventType:                 DapMkcrmDispatchShadowEventType
  communicationType:         DapCommunicationType
  templateKey:               string
  audience:                  DapCommunicationDispatchAudience
  channel:                   DapCommunicationDispatchChannel
  dispatchEventType:         DapCommunicationDispatchEventType
  readinessStatus:           DapCommunicationDispatchStatus
  eligibleForFutureDispatch: boolean
  blockerCodes:              DapCommunicationDispatchBlockerCode[]
  source: {
    decisionAuthority: 'cb_control_center'
    crmAuthority:      false
    paymentAuthority:  false
    billingSource?:    'client_builder_pro'
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
}
