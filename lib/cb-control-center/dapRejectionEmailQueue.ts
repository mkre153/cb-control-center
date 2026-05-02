// DAP rejection email queue model.
// The queue entry is derived from the request_rejected event metadata_json.
// CB Control Center owns the rejection decision. MKCRM has no authority.
// Pure — no Supabase, no network, no mutations.

import type { DapAdminRejectionEmailTemplateKey } from './dapAdminRejectionEmailTypes'
import type { DapRequestEvent } from '../dap/registry/dapRequestTypes'

export interface DapRejectionEmailQueueEntry {
  requestId:         string
  templateKey:       DapAdminRejectionEmailTemplateKey
  queuedAt:          string
  previewPath:       '/preview/dap/admin-rejection-emails'
  decisionAuthority: 'cb_control_center'
  crmAuthority:      false
  paymentAuthority:  false
  sent:              false
  safety: {
    includesPhi:        false
    includesPaymentCta: false
  }
}

export const DAP_MEMBER_REQUEST_REJECTION_TEMPLATE: DapAdminRejectionEmailTemplateKey =
  'member_enrollment_rejected'

export function getDapRejectionEmailQueueEntryFromEvent(
  event: DapRequestEvent,
): DapRejectionEmailQueueEntry | null {
  if (event.event_type !== 'request_rejected') return null
  const meta = event.metadata_json as Record<string, unknown> | null
  const templateKey: DapAdminRejectionEmailTemplateKey =
    (meta?.rejection_email_template_key as DapAdminRejectionEmailTemplateKey | undefined) ??
    DAP_MEMBER_REQUEST_REJECTION_TEMPLATE

  return {
    requestId:         event.request_id,
    templateKey,
    queuedAt:          event.event_timestamp,
    previewPath:       '/preview/dap/admin-rejection-emails',
    decisionAuthority: 'cb_control_center',
    crmAuthority:      false,
    paymentAuthority:  false,
    sent:              false,
    safety: {
      includesPhi:        false,
      includesPaymentCta: false,
    },
  }
}

export function findDapRejectionEmailQueueEntry(
  events: DapRequestEvent[],
): DapRejectionEmailQueueEntry | null {
  const rejection = events.find(e => e.event_type === 'request_rejected')
  return rejection ? getDapRejectionEmailQueueEntryFromEvent(rejection) : null
}
