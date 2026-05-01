import type { DapMkcrmSyncPayload, DapMkcrmSyncEventType } from './dapMkcrmTypes'

// ─── Practice lifecycle ────────────────────────────────────────────────────────

interface PracticeInput {
  requestId: string
  practiceName: string
  city: string
  state: string
  occurredAt: string
}

export function buildPracticeEnrollmentSubmittedPayload(input: PracticeInput): DapMkcrmSyncPayload {
  return {
    eventType: 'practice_enrollment_submitted',
    objectType: 'practice',
    dapId: input.requestId,
    verticalKey: 'dap',
    occurredAt: input.occurredAt,
    shadowMode: true,
    dedupeKey: `practice_enrollment_submitted:req:${input.requestId}`,
    payloadVersion: '2026-04-30',
    data: {
      requestId: input.requestId,
      practiceName: input.practiceName,
      city: input.city,
      state: input.state,
    },
  }
}

export function buildPracticeApprovedPayload(input: PracticeInput): DapMkcrmSyncPayload {
  return {
    eventType: 'practice_approved',
    objectType: 'practice',
    dapId: input.requestId,
    verticalKey: 'dap',
    occurredAt: input.occurredAt,
    shadowMode: true,
    dedupeKey: `practice_approved:req:${input.requestId}`,
    payloadVersion: '2026-04-30',
    data: {
      requestId: input.requestId,
      practiceName: input.practiceName,
      city: input.city,
      state: input.state,
    },
  }
}

export function buildPracticeRejectedPayload(input: PracticeInput): DapMkcrmSyncPayload {
  return {
    eventType: 'practice_rejected',
    objectType: 'practice',
    dapId: input.requestId,
    verticalKey: 'dap',
    occurredAt: input.occurredAt,
    shadowMode: true,
    dedupeKey: `practice_rejected:req:${input.requestId}`,
    payloadVersion: '2026-04-30',
    data: {
      requestId: input.requestId,
      practiceName: input.practiceName,
      city: input.city,
      state: input.state,
    },
  }
}

// ─── Membership lifecycle ──────────────────────────────────────────────────────

interface MembershipEnrolledInput {
  memberId: string
  membershipId: string
  practiceId: string
  occurredAt: string
}

export function buildMembershipEnrolledPayload(input: MembershipEnrolledInput): DapMkcrmSyncPayload {
  return {
    eventType: 'membership_enrolled',
    objectType: 'member',
    dapId: input.memberId,
    verticalKey: 'dap',
    occurredAt: input.occurredAt,
    shadowMode: true,
    dedupeKey: `membership_enrolled:mbr:${input.memberId}`,
    payloadVersion: '2026-04-30',
    data: {
      memberId: input.memberId,
      membershipId: input.membershipId,
      practiceId: input.practiceId,
    },
  }
}

interface MembershipEmailConfirmedInput {
  memberId: string
  membershipId: string
  occurredAt: string
}

export function buildMembershipEmailConfirmedPayload(
  input: MembershipEmailConfirmedInput
): DapMkcrmSyncPayload {
  return {
    eventType: 'membership_email_confirmed',
    objectType: 'member',
    dapId: input.memberId,
    verticalKey: 'dap',
    occurredAt: input.occurredAt,
    shadowMode: true,
    dedupeKey: `membership_email_confirmed:mbr:${input.memberId}`,
    payloadVersion: '2026-04-30',
    data: {
      memberId: input.memberId,
      membershipId: input.membershipId,
    },
  }
}

export type MembershipStanding = 'active' | 'past_due' | 'canceled'

interface MembershipStandingInput {
  memberId: string
  membershipId: string
  standing: MembershipStanding
  occurredAt: string
}

const STANDING_TO_EVENT: Record<MembershipStanding, DapMkcrmSyncEventType> = {
  active: 'membership_standing_active',
  past_due: 'membership_standing_past_due',
  canceled: 'membership_standing_canceled',
}

export function buildMembershipStandingPayload(input: MembershipStandingInput): DapMkcrmSyncPayload {
  const eventType = STANDING_TO_EVENT[input.standing]
  return {
    eventType,
    objectType: 'member',
    dapId: input.memberId,
    verticalKey: 'dap',
    occurredAt: input.occurredAt,
    shadowMode: true,
    dedupeKey: `${eventType}:mbr:${input.memberId}`,
    payloadVersion: '2026-04-30',
    data: {
      memberId: input.memberId,
      membershipId: input.membershipId,
      standing: input.standing,
    },
  }
}

// ─── Participation lifecycle ───────────────────────────────────────────────────

export type ParticipationStatus =
  | 'confirmation_started'
  | 'agreement_sent'
  | 'agreement_received'
  | 'participation_confirmed'
  | 'participation_declined'
  | 'confirmation_voided'

const PARTICIPATION_STATUS_TO_EVENT: Record<ParticipationStatus, DapMkcrmSyncEventType> = {
  confirmation_started:   'participation_confirmation_started',
  agreement_sent:         'participation_agreement_sent',
  agreement_received:     'participation_agreement_received',
  participation_confirmed: 'participation_confirmed',
  participation_declined:  'participation_declined',
  confirmation_voided:     'participation_voided',
}

interface ParticipationStatusInput {
  participationId: string
  reviewId: string
  draftId: string
  practiceName: string
  city: string
  status: ParticipationStatus
  occurredAt: string
}

export function buildParticipationStatusPayload(
  input: ParticipationStatusInput
): DapMkcrmSyncPayload {
  const eventType = PARTICIPATION_STATUS_TO_EVENT[input.status]
  return {
    eventType,
    objectType: 'participation',
    dapId: input.participationId,
    verticalKey: 'dap',
    occurredAt: input.occurredAt,
    shadowMode: true,
    dedupeKey: `${eventType}:par:${input.participationId}`,
    payloadVersion: '2026-04-30',
    data: {
      participationId: input.participationId,
      participationReviewId: input.reviewId,
      draftId: input.draftId,
      practiceName: input.practiceName,
      city: input.city,
      status: input.status,
    },
  }
}
