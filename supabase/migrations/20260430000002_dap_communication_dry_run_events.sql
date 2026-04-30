-- ─── Phase 9Z: DAP Communication Dry-Run Delivery Adapter ────────────────────
-- Append-only internal record of dry-run delivery simulation results.
-- Dry-run delivery is not delivery. A dry-run record shows that an approved
-- communication would be eligible for future delivery, but it does not send
-- email, call MKCRM, call Resend, enqueue delivery, or create real delivery status.
-- CB Control Center is the authority. MKCRM is not.
-- No PHI columns. No email body columns. No payment CTA columns.
-- No sent_at, delivered_at, failed_at, opened_at, clicked_at, bounced_at columns.
-- No UPDATE policy. No DELETE policy. Service-role only.

-- ─── dap_communication_dry_run_events ────────────────────────────────────────

CREATE TABLE dap_communication_dry_run_events (
  id                          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at                  timestamptz NOT NULL DEFAULT now(),

  -- Vertical and communication scope
  vertical_key                text        NOT NULL DEFAULT 'dap'
    CHECK (vertical_key = 'dap'),

  communication_type          text        NOT NULL
    CHECK (communication_type IN (
      'member_status_email',
      'practice_decision_email'
    )),

  template_key                text        NOT NULL,

  audience                    text        NOT NULL
    CHECK (audience IN ('member', 'practice', 'admin')),

  channel                     text        NOT NULL DEFAULT 'email'
    CHECK (channel = 'email'),

  -- Dry-run adapter
  adapter                     text        NOT NULL DEFAULT 'mkcrm_shadow'
    CHECK (adapter IN ('mkcrm_shadow', 'resend_disabled')),

  -- Dry-run lifecycle state
  dry_run_status              text        NOT NULL
    CHECK (dry_run_status IN (
      'not_ready',
      'dry_run_ready',
      'dry_run_blocked'
    )),

  dry_run_event_type          text        NOT NULL
    CHECK (dry_run_event_type IN (
      'dry_run_delivery_checked',
      'dry_run_delivery_ready',
      'dry_run_delivery_blocked'
    )),

  eligible_for_dry_run_delivery boolean  NOT NULL DEFAULT false,

  -- Dry-run blocker codes (stored as array)
  dry_run_blocker_codes       text[]      NOT NULL DEFAULT '{}',

  -- Approval context at time of dry-run
  approval_status             text        NOT NULL
    CHECK (approval_status IN (
      'not_reviewed',
      'approved_for_future_send',
      'rejected_for_future_send',
      'approval_revoked'
    )),

  approval_event_type         text        NOT NULL
    CHECK (approval_event_type IN (
      'approval_review_started',
      'approval_granted_for_future_send',
      'approval_rejected_for_future_send',
      'approval_revoked'
    )),

  dispatch_event_type         text        NOT NULL
    CHECK (dispatch_event_type IN (
      'dispatch_review_started',
      'dispatch_ready_for_review',
      'dispatch_blocked',
      'dispatch_approved_for_future_send',
      'dispatch_cancelled',
      'dispatch_shadow_payload_created'
    )),

  readiness_status            text        NOT NULL
    CHECK (readiness_status IN (
      'not_ready',
      'ready_for_review',
      'approved_for_future_dispatch',
      'blocked'
    )),

  shadow_payload_valid        boolean     NOT NULL DEFAULT false,

  -- Authority fields (enforced by CHECK — MKCRM must not be authority)
  decision_authority          text        NOT NULL DEFAULT 'cb_control_center'
    CHECK (decision_authority = 'cb_control_center'),

  crm_authority               boolean     NOT NULL DEFAULT false
    CHECK (crm_authority = false),

  payment_authority           boolean     NOT NULL DEFAULT false
    CHECK (payment_authority = false),

  billing_source              text
    CHECK (billing_source IS NULL OR billing_source = 'client_builder_pro'),

  -- Dry-run delivery flags (locked — no real delivery)
  dry_run_only                boolean     NOT NULL DEFAULT true
    CHECK (dry_run_only = true),

  delivery_disabled           boolean     NOT NULL DEFAULT true
    CHECK (delivery_disabled = true),

  external_send_disabled      boolean     NOT NULL DEFAULT true
    CHECK (external_send_disabled = true),

  mkcrm_delivery_disabled     boolean     NOT NULL DEFAULT true
    CHECK (mkcrm_delivery_disabled = true),

  resend_disabled             boolean     NOT NULL DEFAULT true
    CHECK (resend_disabled = true),

  -- Delivery state (locked to false — no real delivery state)
  queued                      boolean     NOT NULL DEFAULT false
    CHECK (queued = false),

  scheduled                   boolean     NOT NULL DEFAULT false
    CHECK (scheduled = false),

  sent                        boolean     NOT NULL DEFAULT false
    CHECK (sent = false),

  -- Safety flags (locked — no exceptions)
  no_phi                      boolean     NOT NULL DEFAULT true
    CHECK (no_phi = true),

  no_payment_cta              boolean     NOT NULL DEFAULT true
    CHECK (no_payment_cta = true),

  no_email_body               boolean     NOT NULL DEFAULT true
    CHECK (no_email_body = true),

  no_stored_standing          boolean     NOT NULL DEFAULT true
    CHECK (no_stored_standing = true)

  -- No email body column. No PHI column. No payment CTA column.
  -- No sent_at, delivered_at, failed_at, opened_at, clicked_at, bounced_at columns.
  -- No queued_at, scheduled_at columns.
);

-- ─── Append-only: revoke UPDATE and DELETE ────────────────────────────────────

REVOKE UPDATE ON dap_communication_dry_run_events FROM PUBLIC;
REVOKE UPDATE ON dap_communication_dry_run_events FROM authenticated;
REVOKE DELETE ON dap_communication_dry_run_events FROM PUBLIC;
REVOKE DELETE ON dap_communication_dry_run_events FROM authenticated;

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_dap_comm_dry_run_events_template
  ON dap_communication_dry_run_events (template_key);

CREATE INDEX idx_dap_comm_dry_run_events_status
  ON dap_communication_dry_run_events (dry_run_status);

CREATE INDEX idx_dap_comm_dry_run_events_created
  ON dap_communication_dry_run_events (created_at DESC);

-- ─── RLS: service-role only ───────────────────────────────────────────────────

ALTER TABLE dap_communication_dry_run_events ENABLE ROW LEVEL SECURITY;

-- No public read. No authenticated write. Service-role bypasses RLS.
-- Future phases may add admin-read policy when a real delivery gateway is wired.
