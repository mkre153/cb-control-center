// DAP Action Catalog — type definitions.
// Phase 12 is read-only. This catalog describes actions as preview metadata.
// No action in this catalog executes, mutates, sends, queues, or triggers payment.

import type { DapRequestStatus }                  from '../dap/registry/dapRequestTypes'
import type { DapMemberStanding }                  from './dapMemberStatusTypes'
import type { DapAdminDecisionReadinessStatus }    from './dapAdminDecisionReadiness'
import type { DapOfferTermsReviewStatus }          from '../dap/registry/dapOfferTermsReviewTypes'
import type { DapProviderParticipationStatus }     from '../dap/registry/dapProviderParticipationTypes'
import type { DapCommunicationApprovalStatus }     from './dapCommunicationApprovalTypes'
import type { DapCommunicationDryRunStatus }       from './dapCommunicationDryRunTypes'

// ─── Enums ────────────────────────────────────────────────────────────────────

export type DapActionKey =
  | 'approve_practice_request'
  | 'reject_practice_request'
  | 'mark_offer_terms_review_passed'
  | 'mark_offer_terms_review_failed'
  | 'start_provider_participation_confirmation'
  | 'confirm_provider_participation'
  | 'decline_provider_participation'
  | 'publish_provider_page'
  | 'unpublish_provider_page'
  | 'unlock_join_cta'
  | 'view_member_status'
  | 'prepare_member_status_notification'
  | 'approve_communication_for_future_send'
  | 'reject_communication_for_future_send'
  | 'revoke_communication_approval'
  | 'create_communication_dry_run'
  | 'preview_mkcrm_shadow_payload'
  | 'approve_mkcrm_shadow_payload_for_future_sync'

export type DapActionCategory =
  | 'request_workflow'
  | 'provider_participation'
  | 'member_standing'
  | 'communication'
  | 'mkcrm_shadow'
  | 'public_page'
  | 'admin_review'

export type DapActionAvailability =
  | 'available'
  | 'blocked'
  | 'future_only'
  | 'preview_only'

export type DapActionAuthoritySource =
  | 'cb_control_center'
  | 'client_builder_pro'
  | 'mkcrm_shadow'
  | 'public_member_page'
  | 'provider_submission'

// ─── Safety flags ─────────────────────────────────────────────────────────────
// All Phase 12 actions are read-only and preview-only.
// These flags are literal — tests assert them at runtime.

export interface DapActionSafetyFlags {
  readOnly:               true
  previewOnly:            true
  mutatesSupabase:        false
  sendsEmail:             false
  queuesEmail:            false
  triggersPayment:        false
  triggersMkcrmLiveSync:  false
  includesPhi:            false
}

// ─── Static definition ────────────────────────────────────────────────────────
// Describes an action without computing its availability.
// No execution logic. No handlers.

export interface DapActionDefinition {
  actionKey:       DapActionKey
  label:           string
  description:     string
  category:        DapActionCategory
  authoritySource: DapActionAuthoritySource
  requiredGates:   string[]
  safetyFlags:     DapActionSafetyFlags
}

// ─── Computed action ──────────────────────────────────────────────────────────
// Produced by evaluateDapActionAvailability / buildDapActionAvailabilityCatalog.
// Includes availability, gate satisfaction, and block reasons derived from context.

export interface DapAction {
  actionKey:       DapActionKey
  label:           string
  description:     string
  category:        DapActionCategory
  availability:    DapActionAvailability
  authoritySource: DapActionAuthoritySource
  requiredGates:   string[]
  satisfiedGates:  string[]
  blockedBy:       string[]
  reasons:         string[]
  safetyFlags:     DapActionSafetyFlags
}

// ─── Composite context ────────────────────────────────────────────────────────
// Input to buildDapActionAvailabilityCatalog.
// Describes the current admin/system state across all DAP workflow layers.

export interface DapActionAvailabilityContext {
  // Practice request workflow
  requestStatus:              DapRequestStatus | null
  requestId:                  string | null
  // Admin decision
  decisionReadinessStatus:    DapAdminDecisionReadinessStatus | null
  // Offer terms review
  offerTermsReviewStatus:     DapOfferTermsReviewStatus | null
  // Provider participation
  providerParticipationStatus: DapProviderParticipationStatus | null
  // Member standing
  memberStanding:             DapMemberStanding | null
  membershipId:               string | null
  // Communication approval
  communicationApprovalStatus: DapCommunicationApprovalStatus | null
  // Dry-run
  dryRunStatus:               DapCommunicationDryRunStatus | null
  // MKCRM shadow
  hasShadowPayload:           boolean
  shadowPayloadValid:         boolean
  // Public page / provider enrollment
  isProviderConfirmed:        boolean
  isPublicPagePublished:      boolean
}
