-- ─── Phase 9J: DAP Offer Terms Collection Gate ───────────────────────────────
-- Internal offer terms drafts collected from interested practices.
-- These are NOT validated, approved, or public.
-- Provider status and public claims belong to a later phase.

-- ─── dap_offer_terms_drafts ───────────────────────────────────────────────────

CREATE TABLE dap_offer_terms_drafts (
  id                           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at                   timestamptz NOT NULL DEFAULT now(),
  updated_at                   timestamptz NOT NULL DEFAULT now(),

  -- Source onboarding intake (one draft per intake)
  onboarding_intake_id         uuid        NOT NULL REFERENCES dap_practice_onboarding_intakes(id),

  -- CB Control Center scoping
  vertical_key                 text        NOT NULL DEFAULT 'dap',
  client_key                   text        NOT NULL DEFAULT 'dental_advantage_plan',

  -- Draft workflow status (collection and review only — no final approval here)
  status                       text        NOT NULL DEFAULT 'draft_created'
    CHECK (status IN (
      'draft_created',
      'collecting_terms',
      'submitted_for_review',
      'needs_clarification'
    )),

  -- Practice info snapshot (copied from onboarding intake at creation time)
  practice_name                text,
  practice_slug                text,
  city                         text,
  zip                          text,

  -- Internal offer fields (none of these are public or validated)
  plan_name                    text,
  annual_membership_fee        numeric(10,2),
  included_cleanings_per_year  integer,
  included_exams_per_year      integer,
  included_xrays_per_year      integer,
  preventive_care_summary      text,
  discount_percentage          numeric(5,2),
  excluded_services            text[],
  waiting_period               text,
  cancellation_terms           text,
  renewal_terms                text,
  notes                        text,

  -- Audit
  actor_id                     text,

  CONSTRAINT dap_offer_terms_drafts_intake_unique UNIQUE (onboarding_intake_id)
);

CREATE INDEX idx_dap_offer_terms_drafts_intake   ON dap_offer_terms_drafts (onboarding_intake_id);
CREATE INDEX idx_dap_offer_terms_drafts_vertical ON dap_offer_terms_drafts (vertical_key);

-- ─── dap_offer_terms_events ───────────────────────────────────────────────────

CREATE TABLE dap_offer_terms_events (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id         uuid        NOT NULL REFERENCES dap_offer_terms_drafts(id),
  event_type       text        NOT NULL,
  event_timestamp  timestamptz NOT NULL DEFAULT now(),
  actor_type       text        NOT NULL DEFAULT 'admin',
  actor_id         text,
  event_note       text,
  metadata_json    jsonb
);

CREATE INDEX idx_dap_offer_terms_events_draft ON dap_offer_terms_events (draft_id, event_timestamp);

-- ─── Updated-at trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION dap_offer_terms_drafts_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER dap_offer_terms_drafts_updated_at
  BEFORE UPDATE ON dap_offer_terms_drafts
  FOR EACH ROW EXECUTE FUNCTION dap_offer_terms_drafts_set_updated_at();
