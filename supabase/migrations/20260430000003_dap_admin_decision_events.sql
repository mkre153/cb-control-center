-- ─── Phase 15: DAP Admin Decision Event Ledger ───────────────────────────────
-- Append-only contract table for future admin decision event writes.
-- Phase 15 is a SQL contract phase only. No app-side writer exists yet.
-- preview_only = true and read_only = true are enforced by CHECK constraints.
-- CB Control Center is the decision authority. MKCRM is not.
-- No UPDATE policy. No DELETE policy. Service-role insert only (future phase).
-- RLS is enabled. UPDATE and DELETE are revoked from authenticated and anon.

-- ─── dap_admin_decision_events ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dap_admin_decision_events (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            timestamptz NOT NULL DEFAULT now(),

  -- Event identity
  event_key             text        NOT NULL,
  event_type            text        NOT NULL,
  source_action_key     text        NOT NULL,

  -- Entity scope
  entity_type           text        NOT NULL
    CHECK (entity_type IN (
      'practice_request',
      'offer_terms_review',
      'provider_participation',
      'communication_dispatch',
      'mkcrm_shadow_payload'
    )),
  entity_id             text        NOT NULL,

  -- Decision metadata
  decision_label        text        NOT NULL,
  decision_outcome      text        NOT NULL
    CHECK (decision_outcome IN (
      'approved',
      'rejected',
      'passed',
      'failed',
      'confirmed',
      'declined'
    )),
  authority_source      text        NOT NULL
    CHECK (authority_source IN (
      'cb_control_center',
      'provider_submission',
      'mkcrm_shadow',
      'public_member_page'
    )),

  -- Audit fields
  created_by_role       text        NOT NULL
    CHECK (created_by_role = 'admin'),
  reason_code           text        NOT NULL,
  reason_label          text        NOT NULL,

  -- Gate arrays (append-only audit trail)
  required_gates        jsonb       NOT NULL DEFAULT '[]'::jsonb,
  satisfied_gates       jsonb       NOT NULL DEFAULT '[]'::jsonb,
  blocked_by            jsonb       NOT NULL DEFAULT '[]'::jsonb,

  -- Routing and idempotency
  would_append_to       text        NOT NULL,
  idempotency_key       text        NOT NULL,

  -- Arbitrary write payload (for future use — no PHI, no payment data)
  payload               jsonb       NOT NULL DEFAULT '{}'::jsonb,

  -- Phase 15 contract locks — both must remain true until future phase promotes this table
  preview_only          boolean     NOT NULL DEFAULT true,
  read_only             boolean     NOT NULL DEFAULT true,

  -- Constraints
  CONSTRAINT dap_admin_decision_events_preview_only_chk
    CHECK (preview_only = true),
  CONSTRAINT dap_admin_decision_events_read_only_chk
    CHECK (read_only = true),
  CONSTRAINT dap_admin_decision_events_idempotency_key_unique
    UNIQUE (idempotency_key)
);

-- ─── Table comment ────────────────────────────────────────────────────────────

COMMENT ON TABLE dap_admin_decision_events IS
  'DAP admin decision event ledger contract. Preview-only in Phase 15. No production decision authority yet.';

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE dap_admin_decision_events ENABLE ROW LEVEL SECURITY;

-- No SELECT policy yet — service-role reads only until a future read policy is defined.
-- No INSERT policy yet — service-role writes only until a future append-only policy is defined.

-- Permanently revoke mutation capabilities from all non-service roles.
-- These events are append-only by design. No row may ever be updated or deleted.
REVOKE UPDATE, DELETE ON dap_admin_decision_events FROM authenticated;
REVOKE UPDATE, DELETE ON dap_admin_decision_events FROM anon;
