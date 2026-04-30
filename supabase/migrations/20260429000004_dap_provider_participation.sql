-- ─── Phase 9L: DAP Provider Participation Confirmation ───────────────────────
-- Internal record of explicit provider agreement to participate in DAP.
-- participation_confirmed ≠ practice publicly listed or patient-facing claims unlocked.
-- This phase records agreement status only — public eligibility lives in a later gate.

-- ─── dap_provider_participation_confirmations ─────────────────────────────────

CREATE TABLE dap_provider_participation_confirmations (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),

  -- Source offer terms review (one confirmation per review)
  review_id               uuid        NOT NULL REFERENCES dap_offer_terms_reviews(id),

  -- Denormalized for list/detail display without extra joins
  draft_id                uuid        NOT NULL REFERENCES dap_offer_terms_drafts(id),
  practice_name           text,
  city                    text,

  -- CB Control Center scoping
  vertical_key            text        NOT NULL DEFAULT 'dap',

  -- Internal confirmation workflow status (no public status here)
  status                  text        NOT NULL DEFAULT 'confirmation_started'
    CHECK (status IN (
      'confirmation_started',
      'agreement_sent',
      'agreement_received',
      'participation_confirmed',
      'participation_declined',
      'confirmation_voided'
    )),

  -- Agreement tracking fields (all internal-only)
  agreement_sent_at       timestamptz,
  agreement_received_at   timestamptz,
  signer_name             text,
  signer_title            text,
  signer_email            text,
  agreement_version       text,
  agreement_document_url  text,
  confirmation_notes      text,

  -- Audit
  actor_id                text,

  CONSTRAINT dap_provider_participation_review_unique UNIQUE (review_id)
);

CREATE INDEX idx_dap_provider_participation_review
  ON dap_provider_participation_confirmations (review_id);
CREATE INDEX idx_dap_provider_participation_draft
  ON dap_provider_participation_confirmations (draft_id);
CREATE INDEX idx_dap_provider_participation_vertical
  ON dap_provider_participation_confirmations (vertical_key);

-- ─── dap_provider_participation_events ───────────────────────────────────────
-- Append-only event log. No delete or update on this table.

CREATE TABLE dap_provider_participation_events (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  confirmation_id  uuid        NOT NULL REFERENCES dap_provider_participation_confirmations(id),
  event_type       text        NOT NULL,
  event_timestamp  timestamptz NOT NULL DEFAULT now(),
  actor_type       text        NOT NULL DEFAULT 'admin',
  actor_id         text,
  event_note       text,
  metadata_json    jsonb
);

CREATE INDEX idx_dap_provider_participation_events_conf
  ON dap_provider_participation_events (confirmation_id, event_timestamp);

-- ─── Updated-at trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION dap_provider_participation_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER dap_provider_participation_updated_at
  BEFORE UPDATE ON dap_provider_participation_confirmations
  FOR EACH ROW EXECUTE FUNCTION dap_provider_participation_set_updated_at();
