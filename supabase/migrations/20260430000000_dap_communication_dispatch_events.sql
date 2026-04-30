-- ─── Phase 9W: DAP Communication Dispatch Event Log ─────────────────────────
-- Append-only internal record of dispatch lifecycle decisions.
-- Events record decisions. They do not execute sends.
-- CB Control Center is the dispatch authority. MKCRM is not.
-- No PHI columns. No email body columns. No payment CTA columns.
-- No UPDATE policy. No DELETE policy. Service-role only.

-- ─── dap_communication_dispatch_events ───────────────────────────────────────

CREATE TABLE dap_communication_dispatch_events (
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

  -- Dispatch lifecycle event (no sent/delivered/failed states)
  event_type                  text        NOT NULL
    CHECK (event_type IN (
      'dispatch_review_started',
      'dispatch_ready_for_review',
      'dispatch_blocked',
      'dispatch_approved_for_future_send',
      'dispatch_cancelled',
      'dispatch_shadow_payload_created'
    )),

  -- Readiness summary at time of event
  readiness_status            text        NOT NULL
    CHECK (readiness_status IN (
      'not_ready',
      'ready_for_review',
      'approved_for_future_dispatch',
      'blocked'
    )),

  eligible_for_future_dispatch boolean    NOT NULL DEFAULT false,

  -- Blocker codes (stored as array; no full copy stored here)
  blocker_codes               text[]      NOT NULL DEFAULT '{}',

  -- Authority fields (enforced by CHECK — MKCRM must not be authority)
  decision_authority          text        NOT NULL DEFAULT 'cb_control_center'
    CHECK (decision_authority = 'cb_control_center'),

  crm_authority               boolean     NOT NULL DEFAULT false
    CHECK (crm_authority = false),

  payment_authority           boolean     NOT NULL DEFAULT false
    CHECK (payment_authority = false),

  billing_source              text
    CHECK (billing_source IS NULL OR billing_source = 'client_builder_pro'),

  -- Actor who triggered the event
  actor_type                  text        NOT NULL DEFAULT 'system'
    CHECK (actor_type IN ('system', 'admin')),

  actor_id                    text        NOT NULL DEFAULT 'dap-dispatch-system',

  -- Metadata safety flags (locked — no exceptions)
  external_send_disabled      boolean     NOT NULL DEFAULT true
    CHECK (external_send_disabled = true),

  mkcrm_delivery_disabled     boolean     NOT NULL DEFAULT true
    CHECK (mkcrm_delivery_disabled = true),

  resend_disabled             boolean     NOT NULL DEFAULT true
    CHECK (resend_disabled = true),

  no_phi                      boolean     NOT NULL DEFAULT true
    CHECK (no_phi = true),

  no_payment_cta              boolean     NOT NULL DEFAULT true
    CHECK (no_payment_cta = true)

  -- No email body column. No payment CTA column. No PHI column.
);

-- ─── Append-only: revoke UPDATE and DELETE ────────────────────────────────────

REVOKE UPDATE ON dap_communication_dispatch_events FROM PUBLIC;
REVOKE UPDATE ON dap_communication_dispatch_events FROM authenticated;
REVOKE DELETE ON dap_communication_dispatch_events FROM PUBLIC;
REVOKE DELETE ON dap_communication_dispatch_events FROM authenticated;

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_dap_comm_dispatch_events_template
  ON dap_communication_dispatch_events (template_key);

CREATE INDEX idx_dap_comm_dispatch_events_event_type
  ON dap_communication_dispatch_events (event_type);

CREATE INDEX idx_dap_comm_dispatch_events_created
  ON dap_communication_dispatch_events (created_at DESC);

-- ─── RLS: service-role only ───────────────────────────────────────────────────

ALTER TABLE dap_communication_dispatch_events ENABLE ROW LEVEL SECURITY;

-- No public read. No authenticated write. Service-role bypasses RLS.
-- Future phases may add admin-read policy when an admin surface is built.
