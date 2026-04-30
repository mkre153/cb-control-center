-- ─── Phase 9H: DAP Practice Onboarding Intake ────────────────────────────────
-- Internal onboarding tracking for practices originating from approved DAP requests.
-- These are NOT public provider records.
-- Provider status that requires offer terms validation belongs in a later phase.

-- ─── dap_practice_onboarding_intakes ─────────────────────────────────────────

CREATE TABLE dap_practice_onboarding_intakes (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  -- Source request (one intake per approved request)
  request_id        uuid        NOT NULL REFERENCES dap_requests(id),

  -- CB Control Center scoping
  vertical_key      text        NOT NULL DEFAULT 'dap',
  client_key        text        NOT NULL DEFAULT 'dental_advantage_plan',

  -- Workflow status (offer validation and final status belong in a later phase)
  status            text        NOT NULL DEFAULT 'intake_created'
    CHECK (status IN (
      'intake_created',
      'outreach_needed',
      'outreach_started',
      'practice_responded',
      'not_interested',
      'interested',
      'terms_needed',
      'terms_under_review',
      'ready_for_offer_validation'
    )),

  -- Practice info copied from the source request at intake creation time
  practice_name     text,
  practice_slug     text,
  city              text,
  zip               text,

  -- Attribution
  actor_id          text,
  note              text,

  -- Uniqueness: one intake per approved request
  CONSTRAINT dap_practice_onboarding_intakes_request_id_unique UNIQUE (request_id)
);

-- ─── dap_practice_onboarding_events ──────────────────────────────────────────
-- Append-only audit log for onboarding intake state changes.

CREATE TABLE dap_practice_onboarding_events (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_id       uuid        NOT NULL REFERENCES dap_practice_onboarding_intakes(id),
  event_type      text        NOT NULL,
  event_timestamp timestamptz NOT NULL DEFAULT now(),
  actor_type      text        NOT NULL DEFAULT 'admin',
  actor_id        text,
  event_note      text,
  metadata_json   jsonb
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX dap_practice_onboarding_intakes_request_id_idx
  ON dap_practice_onboarding_intakes (request_id);

CREATE INDEX dap_practice_onboarding_intakes_status_idx
  ON dap_practice_onboarding_intakes (status);

CREATE INDEX dap_practice_onboarding_intakes_vertical_key_idx
  ON dap_practice_onboarding_intakes (vertical_key);

CREATE INDEX dap_practice_onboarding_events_intake_id_idx
  ON dap_practice_onboarding_events (intake_id);

-- ─── updated_at trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION dap_practice_onboarding_intakes_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER dap_practice_onboarding_intakes_updated_at
  BEFORE UPDATE ON dap_practice_onboarding_intakes
  FOR EACH ROW EXECUTE FUNCTION dap_practice_onboarding_intakes_set_updated_at();
