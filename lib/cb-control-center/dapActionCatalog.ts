// DAP Action Catalog — static action definitions.
// These are descriptions only. No execution logic, no handlers, no mutation.
// Availability is computed separately by dapActionAvailabilityRules.ts.

import type { DapActionDefinition, DapActionSafetyFlags } from './dapActionCatalogTypes'

// ─── Shared safety flags ──────────────────────────────────────────────────────
// All Phase 12 actions share these literal flags.

const SAFETY: DapActionSafetyFlags = {
  readOnly:               true,
  previewOnly:            true,
  mutatesSupabase:        false,
  sendsEmail:             false,
  queuesEmail:            false,
  triggersPayment:        false,
  triggersMkcrmLiveSync:  false,
  includesPhi:            false,
}

// ─── Static action definitions ────────────────────────────────────────────────

export const DAP_ACTION_DEFINITIONS: readonly DapActionDefinition[] = [

  // ── Request workflow ────────────────────────────────────────────────────────

  {
    actionKey:       'approve_practice_request',
    label:           'Approve Practice Request',
    description:     'Mark the practice enrollment request as approved for internal handoff. Does not confirm the practice as a DAP provider or publish any patient-facing claims.',
    category:        'request_workflow',
    authoritySource: 'cb_control_center',
    requiredGates:   ['request_submitted', 'phi_acknowledgment_confirmed', 'contact_info_present', 'admin_decision_readiness_checked'],
    safetyFlags:     SAFETY,
  },

  {
    actionKey:       'reject_practice_request',
    label:           'Reject Practice Request',
    description:     'Mark the practice enrollment request as rejected. Admin-driven. Cannot be triggered by MKCRM or payment standing.',
    category:        'request_workflow',
    authoritySource: 'cb_control_center',
    requiredGates:   ['request_submitted', 'phi_acknowledgment_confirmed', 'admin_decision_readiness_checked'],
    safetyFlags:     SAFETY,
  },

  // ── Offer terms ────────────────────────────────────────────────────────────

  {
    actionKey:       'mark_offer_terms_review_passed',
    label:           'Mark Offer Terms Review: Passed',
    description:     'Record that the practice offer terms have passed internal review. Internal handoff gate only — does not publish provider page or unlock patient CTAs.',
    category:        'admin_review',
    authoritySource: 'cb_control_center',
    requiredGates:   ['offer_terms_submitted', 'offer_terms_under_review'],
    safetyFlags:     SAFETY,
  },

  {
    actionKey:       'mark_offer_terms_review_failed',
    label:           'Mark Offer Terms Review: Failed',
    description:     'Record that the practice offer terms have failed internal review. Blocks provider participation confirmation.',
    category:        'admin_review',
    authoritySource: 'cb_control_center',
    requiredGates:   ['offer_terms_submitted', 'offer_terms_under_review'],
    safetyFlags:     SAFETY,
  },

  // ── Provider participation ──────────────────────────────────────────────────

  {
    actionKey:       'start_provider_participation_confirmation',
    label:           'Start Provider Participation Confirmation',
    description:     'Begin the provider participation confirmation workflow. Requires request approval and passed offer terms review.',
    category:        'provider_participation',
    authoritySource: 'cb_control_center',
    requiredGates:   ['request_approved', 'offer_terms_passed'],
    safetyFlags:     SAFETY,
  },

  {
    actionKey:       'confirm_provider_participation',
    label:           'Confirm Provider Participation',
    description:     'Provider explicitly confirms participation in DAP. Provider-submitted only — not admin-approved. Future phase.',
    category:        'provider_participation',
    authoritySource: 'provider_submission',
    requiredGates:   ['participation_invitation_sent', 'provider_agreement_acknowledged'],
    safetyFlags:     SAFETY,
  },

  {
    actionKey:       'decline_provider_participation',
    label:           'Decline Provider Participation',
    description:     'Provider declines to participate in DAP. Provider-submitted only. Future phase.',
    category:        'provider_participation',
    authoritySource: 'provider_submission',
    requiredGates:   ['participation_invitation_sent'],
    safetyFlags:     SAFETY,
  },

  // ── Public page ────────────────────────────────────────────────────────────

  {
    actionKey:       'publish_provider_page',
    label:           'Publish Provider Page',
    description:     'Publish the provider\'s public DAP directory page. Requires provider confirmation and content readiness. Future phase.',
    category:        'public_page',
    authoritySource: 'cb_control_center',
    requiredGates:   ['provider_confirmed', 'offer_terms_passed', 'public_page_content_ready'],
    safetyFlags:     SAFETY,
  },

  {
    actionKey:       'unpublish_provider_page',
    label:           'Unpublish Provider Page',
    description:     'Remove the provider\'s public DAP directory page. Future phase.',
    category:        'public_page',
    authoritySource: 'cb_control_center',
    requiredGates:   ['provider_confirmed'],
    safetyFlags:     SAFETY,
  },

  {
    actionKey:       'unlock_join_cta',
    label:           'Unlock Join CTA',
    description:     'Allow the patient-facing Join CTA to appear on this provider\'s public page. Future phase.',
    category:        'public_page',
    authoritySource: 'cb_control_center',
    requiredGates:   ['provider_confirmed', 'public_page_content_ready'],
    safetyFlags:     SAFETY,
  },

  // ── Member standing ────────────────────────────────────────────────────────

  {
    actionKey:       'view_member_status',
    label:           'View Member Status',
    description:     'Display the public-safe member status page derived from Client Builder Pro billing events. Display only — not a decision authority.',
    category:        'member_standing',
    authoritySource: 'public_member_page',
    requiredGates:   ['membership_id_present'],
    safetyFlags:     SAFETY,
  },

  {
    actionKey:       'prepare_member_status_notification',
    label:           'Prepare Member Status Notification',
    description:     'Preview a member status notification template derived from billing events. Preview only — does not send or queue email.',
    category:        'communication',
    authoritySource: 'cb_control_center',
    requiredGates:   ['member_standing_derived', 'communication_template_available'],
    safetyFlags:     SAFETY,
  },

  // ── Communication approval / dry-run ───────────────────────────────────────

  {
    actionKey:       'approve_communication_for_future_send',
    label:           'Approve Communication for Future Send',
    description:     'Mark a prepared communication as approved for future send. Does not send or queue. Admin-only.',
    category:        'communication',
    authoritySource: 'cb_control_center',
    requiredGates:   ['communication_dispatch_event_ready', 'shadow_payload_valid'],
    safetyFlags:     SAFETY,
  },

  {
    actionKey:       'reject_communication_for_future_send',
    label:           'Reject Communication for Future Send',
    description:     'Mark a prepared communication as rejected. Does not send or queue. Admin-only.',
    category:        'communication',
    authoritySource: 'cb_control_center',
    requiredGates:   ['communication_dispatch_event_ready'],
    safetyFlags:     SAFETY,
  },

  {
    actionKey:       'revoke_communication_approval',
    label:           'Revoke Communication Approval',
    description:     'Revoke a previously approved communication. Does not cancel any live send. Admin-only.',
    category:        'communication',
    authoritySource: 'cb_control_center',
    requiredGates:   ['communication_previously_approved'],
    safetyFlags:     SAFETY,
  },

  {
    actionKey:       'create_communication_dry_run',
    label:           'Create Communication Dry-Run',
    description:     'Simulate what would happen if the approved communication were handed to a delivery adapter. No network calls. No email sent.',
    category:        'communication',
    authoritySource: 'cb_control_center',
    requiredGates:   ['communication_approved_for_future_send'],
    safetyFlags:     SAFETY,
  },

  // ── MKCRM shadow ───────────────────────────────────────────────────────────

  {
    actionKey:       'preview_mkcrm_shadow_payload',
    label:           'Preview MKCRM Shadow Payload',
    description:     'Display the prepared MKCRM shadow payload for admin review. MKCRM is reference/shadow authority only. Does not sync to MKCRM.',
    category:        'mkcrm_shadow',
    authoritySource: 'mkcrm_shadow',
    requiredGates:   ['shadow_payload_exists'],
    safetyFlags:     SAFETY,
  },

  {
    actionKey:       'approve_mkcrm_shadow_payload_for_future_sync',
    label:           'Approve MKCRM Shadow Payload for Future Sync',
    description:     'Mark the shadow payload as approved for future MKCRM sync. Future phase — no live sync exists yet.',
    category:        'mkcrm_shadow',
    authoritySource: 'cb_control_center',
    requiredGates:   ['shadow_payload_valid', 'communication_dry_run_complete', 'admin_approval_granted'],
    safetyFlags:     SAFETY,
  },

] as const
