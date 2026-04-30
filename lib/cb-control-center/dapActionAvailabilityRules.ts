// DAP Action Availability Rules.
// Pure — no network calls, no Supabase, no MKCRM, no email, no payment.
// Takes a composite context and returns the full computed action catalog.

import type {
  DapAction,
  DapActionAvailability,
  DapActionAvailabilityContext,
  DapActionDefinition,
} from './dapActionCatalogTypes'
import { DAP_ACTION_DEFINITIONS } from './dapActionCatalog'

// ─── Gate satisfaction ────────────────────────────────────────────────────────

function isGateSatisfied(gate: string, ctx: DapActionAvailabilityContext): boolean {
  switch (gate) {
    case 'request_submitted':
      return ctx.requestStatus !== null && ctx.requestStatus !== 'draft'
    case 'phi_acknowledgment_confirmed':
      return ctx.decisionReadinessStatus !== null && ctx.decisionReadinessStatus !== 'blocked_by_safety_rules'
    case 'contact_info_present':
      return ctx.decisionReadinessStatus === 'ready_for_review'
    case 'admin_decision_readiness_checked':
      return ctx.decisionReadinessStatus !== null
    case 'request_approved':
      return ctx.requestStatus === 'approved'
    case 'offer_terms_submitted':
      return ctx.offerTermsReviewStatus !== null
    case 'offer_terms_under_review':
      return ctx.offerTermsReviewStatus === 'review_started' || ctx.offerTermsReviewStatus === 'clarification_requested'
    case 'offer_terms_passed':
      return ctx.offerTermsReviewStatus === 'review_passed'
    case 'participation_invitation_sent':
      return (
        ctx.providerParticipationStatus !== null &&
        ctx.providerParticipationStatus !== 'confirmation_voided'
      )
    case 'provider_agreement_acknowledged':
      return (
        ctx.providerParticipationStatus === 'agreement_received' ||
        ctx.providerParticipationStatus === 'participation_confirmed'
      )
    case 'provider_confirmed':
      return ctx.isProviderConfirmed
    case 'public_page_content_ready':
      return false  // not yet built
    case 'membership_id_present':
      return ctx.membershipId !== null
    case 'member_standing_derived':
      return ctx.memberStanding !== null
    case 'communication_template_available':
      return ctx.memberStanding !== null
    case 'communication_dispatch_event_ready':
      return ctx.communicationApprovalStatus !== null
    case 'shadow_payload_valid':
      return ctx.shadowPayloadValid
    case 'communication_previously_approved':
      return ctx.communicationApprovalStatus === 'approved_for_future_send'
    case 'communication_approved_for_future_send':
      return ctx.communicationApprovalStatus === 'approved_for_future_send'
    case 'shadow_payload_exists':
      return ctx.hasShadowPayload
    case 'communication_dry_run_complete':
      return ctx.dryRunStatus === 'dry_run_ready'
    case 'admin_approval_granted':
      return ctx.communicationApprovalStatus === 'approved_for_future_send'
    default:
      return false
  }
}

function computeSatisfiedGates(
  requiredGates: string[],
  ctx: DapActionAvailabilityContext,
): string[] {
  return requiredGates.filter(g => isGateSatisfied(g, ctx))
}

// ─── Per-action availability logic ───────────────────────────────────────────

type AvailabilityResult = {
  availability: DapActionAvailability
  blockedBy:    string[]
  reasons:      string[]
}

function computeActionAvailability(
  actionKey: DapActionDefinition['actionKey'],
  ctx: DapActionAvailabilityContext,
): AvailabilityResult {
  switch (actionKey) {

    case 'approve_practice_request': {
      if (ctx.decisionReadinessStatus === 'ready_for_review') {
        return { availability: 'available', blockedBy: [], reasons: ['Admin decision authority confirmed. All required fields present.'] }
      }
      if (ctx.decisionReadinessStatus === 'already_decided') {
        return { availability: 'blocked', blockedBy: ['request_already_decided'], reasons: ['Request has already been decided.'] }
      }
      if (ctx.decisionReadinessStatus === 'blocked_by_safety_rules') {
        return { availability: 'blocked', blockedBy: ['safety_rule_violation'], reasons: ['Request is blocked by safety rules. No-PHI policy not acknowledged.'] }
      }
      if (ctx.decisionReadinessStatus === 'missing_required_fields') {
        return { availability: 'blocked', blockedBy: ['missing_required_fields'], reasons: ['Required fields are missing for approval.'] }
      }
      return { availability: 'blocked', blockedBy: ['no_decision_context'], reasons: ['No decision readiness context available.'] }
    }

    case 'reject_practice_request': {
      if (ctx.decisionReadinessStatus === 'already_decided') {
        return { availability: 'blocked', blockedBy: ['request_already_decided'], reasons: ['Request has already been decided.'] }
      }
      if (ctx.decisionReadinessStatus === 'blocked_by_safety_rules') {
        return { availability: 'blocked', blockedBy: ['safety_rule_violation'], reasons: ['Request is blocked by safety rules.'] }
      }
      if (ctx.decisionReadinessStatus === 'ready_for_review' || ctx.decisionReadinessStatus === 'missing_required_fields') {
        return { availability: 'available', blockedBy: [], reasons: ['Admin may reject with or without full required fields.'] }
      }
      return { availability: 'blocked', blockedBy: ['no_decision_context'], reasons: ['No decision readiness context available.'] }
    }

    case 'mark_offer_terms_review_passed': {
      if (ctx.offerTermsReviewStatus === 'review_started' || ctx.offerTermsReviewStatus === 'clarification_requested') {
        return { availability: 'available', blockedBy: [], reasons: ['Offer terms are under review and ready for pass decision.'] }
      }
      if (ctx.offerTermsReviewStatus === 'review_passed') {
        return { availability: 'blocked', blockedBy: ['offer_terms_already_passed'], reasons: ['Offer terms review has already been marked as passed.'] }
      }
      if (ctx.offerTermsReviewStatus === 'review_failed') {
        return { availability: 'blocked', blockedBy: ['offer_terms_already_failed'], reasons: ['Offer terms review has already been marked as failed.'] }
      }
      return { availability: 'blocked', blockedBy: ['offer_terms_not_submitted'], reasons: ['No offer terms review has been started.'] }
    }

    case 'mark_offer_terms_review_failed': {
      if (ctx.offerTermsReviewStatus === 'review_started' || ctx.offerTermsReviewStatus === 'clarification_requested') {
        return { availability: 'available', blockedBy: [], reasons: ['Offer terms are under review and ready for fail decision.'] }
      }
      if (ctx.offerTermsReviewStatus === 'review_passed') {
        return { availability: 'blocked', blockedBy: ['offer_terms_already_passed'], reasons: ['Offer terms review has already been marked as passed.'] }
      }
      if (ctx.offerTermsReviewStatus === 'review_failed') {
        return { availability: 'blocked', blockedBy: ['offer_terms_already_failed'], reasons: ['Offer terms review has already been marked as failed.'] }
      }
      return { availability: 'blocked', blockedBy: ['offer_terms_not_submitted'], reasons: ['No offer terms review has been started.'] }
    }

    case 'start_provider_participation_confirmation': {
      if (ctx.requestStatus !== 'approved') {
        return { availability: 'blocked', blockedBy: ['request_not_approved'], reasons: ['Request must be approved before provider participation can begin.'] }
      }
      if (ctx.offerTermsReviewStatus !== 'review_passed') {
        return { availability: 'blocked', blockedBy: ['offer_terms_not_passed'], reasons: ['Offer terms must be reviewed and passed.'] }
      }
      if (ctx.providerParticipationStatus !== null) {
        return { availability: 'blocked', blockedBy: ['participation_already_started'], reasons: ['Provider participation confirmation has already been initiated.'] }
      }
      return { availability: 'available', blockedBy: [], reasons: ['Request approved and offer terms passed. Ready to start confirmation.'] }
    }

    case 'confirm_provider_participation':
      return { availability: 'future_only', blockedBy: ['provider_self_service_not_built'], reasons: ['Provider self-service confirmation workflow not yet implemented.'] }

    case 'decline_provider_participation':
      return { availability: 'future_only', blockedBy: ['provider_self_service_not_built'], reasons: ['Provider self-service decline workflow not yet implemented.'] }

    case 'publish_provider_page':
      return { availability: 'future_only', blockedBy: ['public_page_publishing_not_built'], reasons: ['Public provider page publishing not yet implemented.'] }

    case 'unpublish_provider_page':
      return { availability: 'future_only', blockedBy: ['public_page_publishing_not_built'], reasons: ['Public provider page management not yet implemented.'] }

    case 'unlock_join_cta':
      return { availability: 'future_only', blockedBy: ['join_cta_unlock_not_built'], reasons: ['Patient-facing Join CTA unlock not yet implemented.'] }

    case 'view_member_status': {
      if (ctx.membershipId !== null) {
        return { availability: 'available', blockedBy: [], reasons: ['Membership ID present. Public-safe status page available.'] }
      }
      return { availability: 'blocked', blockedBy: ['no_membership_id'], reasons: ['No membership ID in context. Cannot display member status.'] }
    }

    case 'prepare_member_status_notification': {
      if (ctx.memberStanding !== null) {
        return { availability: 'preview_only', blockedBy: [], reasons: ['Preview only — does not send or queue email. Standing derived from billing events.'] }
      }
      return { availability: 'blocked', blockedBy: ['no_member_standing'], reasons: ['No member standing in context. Cannot prepare notification.'] }
    }

    case 'approve_communication_for_future_send': {
      if (ctx.communicationApprovalStatus === 'not_reviewed') {
        return { availability: 'available', blockedBy: [], reasons: ['Communication is awaiting admin review. Admin may approve for future send.'] }
      }
      if (ctx.communicationApprovalStatus === 'approved_for_future_send') {
        return { availability: 'blocked', blockedBy: ['communication_already_approved'], reasons: ['Communication has already been approved for future send.'] }
      }
      if (ctx.communicationApprovalStatus === 'rejected_for_future_send') {
        return { availability: 'blocked', blockedBy: ['communication_already_rejected'], reasons: ['Communication has been rejected and cannot be re-approved.'] }
      }
      if (ctx.communicationApprovalStatus === 'approval_revoked') {
        return { availability: 'blocked', blockedBy: ['communication_approval_revoked'], reasons: ['Communication approval was revoked.'] }
      }
      return { availability: 'blocked', blockedBy: ['no_communication_context'], reasons: ['No communication approval context available.'] }
    }

    case 'reject_communication_for_future_send': {
      if (ctx.communicationApprovalStatus === 'not_reviewed') {
        return { availability: 'available', blockedBy: [], reasons: ['Communication is awaiting admin review. Admin may reject.'] }
      }
      if (ctx.communicationApprovalStatus === 'rejected_for_future_send') {
        return { availability: 'blocked', blockedBy: ['communication_already_rejected'], reasons: ['Communication has already been rejected.'] }
      }
      if (ctx.communicationApprovalStatus === 'approved_for_future_send') {
        return { availability: 'blocked', blockedBy: ['communication_already_approved'], reasons: ['Communication is already approved. Use revoke instead.'] }
      }
      return { availability: 'blocked', blockedBy: ['no_communication_context'], reasons: ['No communication approval context available.'] }
    }

    case 'revoke_communication_approval': {
      if (ctx.communicationApprovalStatus === 'approved_for_future_send') {
        return { availability: 'available', blockedBy: [], reasons: ['Communication is currently approved. Admin may revoke approval.'] }
      }
      return { availability: 'blocked', blockedBy: ['communication_not_approved'], reasons: ['Communication is not currently in approved state. Nothing to revoke.'] }
    }

    case 'create_communication_dry_run': {
      if (ctx.communicationApprovalStatus !== 'approved_for_future_send') {
        return { availability: 'blocked', blockedBy: ['communication_not_approved'], reasons: ['Dry-run requires an approved communication.'] }
      }
      if (ctx.dryRunStatus === 'dry_run_ready') {
        return { availability: 'blocked', blockedBy: ['dry_run_already_complete'], reasons: ['A dry-run has already been completed for this communication.'] }
      }
      return { availability: 'available', blockedBy: [], reasons: ['Communication is approved. Dry-run simulation is ready to run.'] }
    }

    case 'preview_mkcrm_shadow_payload': {
      if (ctx.hasShadowPayload) {
        return { availability: 'preview_only', blockedBy: [], reasons: ['Preview only — MKCRM shadow payload available for admin review. No live sync.'] }
      }
      return { availability: 'blocked', blockedBy: ['no_shadow_payload'], reasons: ['No MKCRM shadow payload exists in context.'] }
    }

    case 'approve_mkcrm_shadow_payload_for_future_sync':
      return { availability: 'future_only', blockedBy: ['mkcrm_live_sync_not_built'], reasons: ['MKCRM live sync is not yet implemented. Shadow payload approval is a future phase action.'] }

    default:
      return { availability: 'blocked', blockedBy: ['unknown_action'], reasons: ['Unknown action key.'] }
  }
}

// ─── Core evaluator ───────────────────────────────────────────────────────────

export function evaluateDapActionAvailability(
  definition: DapActionDefinition,
  ctx: DapActionAvailabilityContext,
): DapAction {
  const { availability, blockedBy, reasons } = computeActionAvailability(definition.actionKey, ctx)
  const satisfiedGates = computeSatisfiedGates(definition.requiredGates, ctx)

  return {
    actionKey:       definition.actionKey,
    label:           definition.label,
    description:     definition.description,
    category:        definition.category,
    availability,
    authoritySource: definition.authoritySource,
    requiredGates:   definition.requiredGates,
    satisfiedGates,
    blockedBy,
    reasons,
    safetyFlags:     definition.safetyFlags,
  }
}

// ─── Primary public API ───────────────────────────────────────────────────────

export function buildDapActionAvailabilityCatalog(
  ctx: DapActionAvailabilityContext,
): DapAction[] {
  return DAP_ACTION_DEFINITIONS.map(def => evaluateDapActionAvailability(def, ctx))
}

// ─── Fixture contexts ─────────────────────────────────────────────────────────

export const DAP_ACTION_CONTEXT_EMPTY: DapActionAvailabilityContext = {
  requestStatus:               null,
  requestId:                   null,
  decisionReadinessStatus:     null,
  offerTermsReviewStatus:      null,
  providerParticipationStatus: null,
  memberStanding:              null,
  membershipId:                null,
  communicationApprovalStatus: null,
  dryRunStatus:                null,
  hasShadowPayload:            false,
  shadowPayloadValid:          false,
  isProviderConfirmed:         false,
  isPublicPagePublished:       false,
}

export const DAP_ACTION_CONTEXT_DEMO: DapActionAvailabilityContext = {
  requestStatus:               'queued_for_review',
  requestId:                   'req-demo-001',
  decisionReadinessStatus:     'ready_for_review',
  offerTermsReviewStatus:      'review_started',
  providerParticipationStatus: null,
  memberStanding:              'active',
  membershipId:                'dap-p10-active',
  communicationApprovalStatus: 'not_reviewed',
  dryRunStatus:                null,
  hasShadowPayload:            true,
  shadowPayloadValid:          true,
  isProviderConfirmed:         false,
  isPublicPagePublished:       false,
}

export const DAP_ACTION_CONTEXT_APPROVED: DapActionAvailabilityContext = {
  requestStatus:               'approved',
  requestId:                   'req-approved-001',
  decisionReadinessStatus:     'already_decided',
  offerTermsReviewStatus:      'review_passed',
  providerParticipationStatus: null,
  memberStanding:              'active',
  membershipId:                'dap-p10-active',
  communicationApprovalStatus: 'approved_for_future_send',
  dryRunStatus:                null,
  hasShadowPayload:            true,
  shadowPayloadValid:          true,
  isProviderConfirmed:         false,
  isPublicPagePublished:       false,
}
