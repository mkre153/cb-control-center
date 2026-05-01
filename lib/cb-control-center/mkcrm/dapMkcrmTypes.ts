export type DapMkcrmSyncEventType =
  | 'practice_enrollment_submitted'
  | 'practice_approved'
  | 'practice_rejected'
  | 'provider_magic_link_requested'
  | 'provider_logged_in'
  | 'membership_enrolled'
  | 'membership_email_confirmed'
  | 'membership_standing_active'
  | 'membership_standing_past_due'
  | 'membership_standing_canceled'
  | 'participation_confirmation_started'
  | 'participation_agreement_sent'
  | 'participation_agreement_received'
  | 'participation_confirmed'
  | 'participation_declined'
  | 'participation_voided'

export type DapMkcrmObjectType =
  | 'practice'
  | 'provider'
  | 'member'
  | 'participation'
  | 'billing'

export interface DapMkcrmSyncPayload {
  eventType: DapMkcrmSyncEventType
  objectType: DapMkcrmObjectType
  dapId: string
  verticalKey: 'dap'
  occurredAt: string
  shadowMode: true
  dedupeKey: string
  payloadVersion: '2026-04-30'
  data: Record<string, unknown>
}
