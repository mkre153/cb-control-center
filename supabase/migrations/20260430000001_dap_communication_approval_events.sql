-- ─── Phase 9Y: DAP Communication Admin Approval Surface ──────────────────────
-- Append-only internal record of communication approval decisions.
-- Admin approval is not delivery. Approved = approved for future sending only.
-- CB Control Center determines approval. MKCRM does not.
-- No PHI columns. No email body columns. No payment CTA columns.
-- No UPDATE policy. No DELETE policy. Service-role only.

-- ─── dap_communication_approval_events ───────────────────────────────────────

CREATE TABLE dap_communication_approval_events (
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

  -- Approval lifecycle state
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

  eligible_for_approval       boolean     NOT NULL DEFAULT false,

  -- Approval blocker codes (stored as array)
  approval_blocker_codes      text[]      NOT NULL DEFAULT '{}',

  -- Dispatch context at time of approval
  readiness_status            text        NOT NULL
    CHECK (readiness_status IN (
      'not_ready',
      'ready_for_review',
      'approved_for_future_dispatch',
      'blocked'
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

  -- Actor who triggered the approval event
  actor_type                  text        NOT NULL DEFAULT 'system'
    CHECK (actor_type IN ('system', 'admin')),

  actor_id                    text        NOT NULL DEFAULT 'dap-approval-system',

  -- Delivery flags (locked — no exceptions)
  delivery_disabled           boolean     NOT NULL DEFAULT true
    CHECK (delivery_disabled = true),

  external_send_disabled      boolean     NOT NULL DEFAULT true
    CHECK (external_send_disabled = true),

  mkcrm_delivery_disabled     boolean     NOT NULL DEFAULT true
    CHECK (mkcrm_delivery_disabled = true),

  resend_disabled             boolean     NOT NULL DEFAULT true
    CHECK (resend_disabled = true),

  -- Safety flags (locked — no exceptions)
  no_phi                      boolean     NOT NULL DEFAULT true
    CHECK (no_phi = true),

  no_payment_cta              boolean     NOT NULL DEFAULT true
    CHECK (no_payment_cta = true),

  no_email_body               boolean     NOT NULL DEFAULT true
    CHECK (no_email_body = true),

  no_stored_standing          boolean     NOT NULL DEFAULT true
    CHECK (no_stored_standing = true),

  -- Optional notes from reviewer
  notes                       text

  -- No email body column. No payment CTA column. No PHI column.
);

-- ─── Append-only: revoke UPDATE and DELETE ────────────────────────────────────

REVOKE UPDATE ON dap_communication_approval_events FROM PUBLIC;
REVOKE UPDATE ON dap_communication_approval_events FROM authenticated;
REVOKE DELETE ON dap_communication_approval_events FROM PUBLIC;
REVOKE DELETE ON dap_communication_approval_events FROM authenticated;

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_dap_comm_approval_events_template
  ON dap_communication_approval_events (template_key);

CREATE INDEX idx_dap_comm_approval_events_status
  ON dap_communication_approval_events (approval_status);

CREATE INDEX idx_dap_comm_approval_events_event_type
  ON dap_communication_approval_events (approval_event_type);

CREATE INDEX idx_dap_comm_approval_events_created
  ON dap_communication_approval_events (created_at DESC);

-- ─── RLS: service-role only ───────────────────────────────────────────────────

ALTER TABLE dap_communication_approval_events ENABLE ROW LEVEL SECURITY;

-- No public read. No authenticated write. Service-role bypasses RLS.
-- Future phases may add admin-read policy when a full approval workflow is built.
