-- Phase 9C: DAP Request Backend Foundation
-- Creates dap_requests and dap_request_events tables.
-- dap_request_events is append-only — rows are never updated or deleted.
-- Safety constraints enforce consent and no-PHI acknowledgment at the DB level.

-- ─── dap_requests ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dap_requests (
  id                          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now(),

  -- Client/vertical scoping
  -- dap_requests lives in the CB Control Center Supabase project.
  -- DAP is a vertical inside CB Control Center — it does not own the database.
  -- These columns allow the table to serve multiple clients/verticals in future.
  client_key                  text        NOT NULL DEFAULT 'dental_advantage_plan',
  vertical_key                text        NOT NULL DEFAULT 'dap',
  project_key                 text,       -- null = no sub-project scoping

  request_status              text        NOT NULL DEFAULT 'submitted',
  source_page_kind            text        NOT NULL,
  source_path                 text        NOT NULL,
  city                        text,
  zip                         text,
  preferred_practice_name     text,
  preferred_practice_slug     text,
  treatment_interest          text,
  requester_name              text        NOT NULL,
  requester_email             text,
  requester_phone             text,
  consent_to_contact_practice boolean     NOT NULL DEFAULT false,
  consent_to_contact_patient  boolean     NOT NULL DEFAULT false,
  consent_text                text        NOT NULL,
  consent_timestamp           timestamptz NOT NULL DEFAULT now(),
  no_phi_acknowledged         boolean     NOT NULL DEFAULT false,
  user_message                text,
  dedupe_key                  text        NOT NULL,
  ip_hash                     text,
  user_agent_hash             text,

  -- Consent text must never be empty (no silent opt-in)
  CONSTRAINT dap_requests_consent_text_not_empty
    CHECK (trim(consent_text) <> ''),

  -- PHI acknowledgment is mandatory — row cannot be inserted without it
  CONSTRAINT dap_requests_no_phi_acknowledged_required
    CHECK (no_phi_acknowledged = true),

  -- At least one contact method must be provided
  CONSTRAINT dap_requests_contact_required
    CHECK (requester_email IS NOT NULL OR requester_phone IS NOT NULL),

  -- At least one geographic target must be provided
  CONSTRAINT dap_requests_area_required
    CHECK (city IS NOT NULL OR zip IS NOT NULL)
);

-- ─── dap_request_events ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dap_request_events (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id       uuid        NOT NULL REFERENCES dap_requests(id) ON DELETE RESTRICT,
  event_type       text        NOT NULL,
  event_timestamp  timestamptz NOT NULL DEFAULT now(),
  actor_type       text        NOT NULL,
  event_note       text,
  metadata_json    jsonb
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS dap_requests_dedupe_key_idx
  ON dap_requests (dedupe_key);

CREATE INDEX IF NOT EXISTS dap_requests_status_idx
  ON dap_requests (request_status);

CREATE INDEX IF NOT EXISTS dap_request_events_request_id_idx
  ON dap_request_events (request_id);

-- Scoping index — supports future multi-client/vertical queries
CREATE INDEX IF NOT EXISTS dap_requests_scope_idx
  ON dap_requests (client_key, vertical_key);

-- ─── updated_at trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION dap_requests_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER dap_requests_updated_at
  BEFORE UPDATE ON dap_requests
  FOR EACH ROW EXECUTE FUNCTION dap_requests_set_updated_at();
