-- ─── Phase 9K: DAP Offer Terms Review ────────────────────────────────────────
-- Internal reviewer gate for submitted offer terms drafts.
-- review_passed means terms cleared internal review criteria only.
-- It does not alter public provider status or patient-facing behavior.

-- ─── dap_offer_terms_reviews ──────────────────────────────────────────────────

CREATE TABLE dap_offer_terms_reviews (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  -- Source offer terms draft (one review record per draft)
  draft_id         uuid        NOT NULL REFERENCES dap_offer_terms_drafts(id),

  -- CB Control Center scoping
  vertical_key     text        NOT NULL DEFAULT 'dap',

  -- Internal review status (no final public approval here)
  status           text        NOT NULL DEFAULT 'review_started'
    CHECK (status IN (
      'review_started',
      'review_passed',
      'review_failed',
      'clarification_requested'
    )),

  -- Criteria snapshot captured at review time
  criteria_json    jsonb,

  -- Audit
  actor_id         text,

  CONSTRAINT dap_offer_terms_reviews_draft_unique UNIQUE (draft_id)
);

CREATE INDEX idx_dap_offer_terms_reviews_draft    ON dap_offer_terms_reviews (draft_id);
CREATE INDEX idx_dap_offer_terms_reviews_vertical ON dap_offer_terms_reviews (vertical_key);

-- ─── dap_offer_terms_review_events ───────────────────────────────────────────
-- Append-only event log. No delete or update on this table.

CREATE TABLE dap_offer_terms_review_events (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id        uuid        NOT NULL REFERENCES dap_offer_terms_reviews(id),
  event_type       text        NOT NULL,
  event_timestamp  timestamptz NOT NULL DEFAULT now(),
  actor_type       text        NOT NULL DEFAULT 'admin',
  actor_id         text,
  event_note       text,
  metadata_json    jsonb
);

CREATE INDEX idx_dap_offer_terms_review_events_review
  ON dap_offer_terms_review_events (review_id, event_timestamp);

-- ─── Updated-at trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION dap_offer_terms_reviews_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER dap_offer_terms_reviews_updated_at
  BEFORE UPDATE ON dap_offer_terms_reviews
  FOR EACH ROW EXECUTE FUNCTION dap_offer_terms_reviews_set_updated_at();
