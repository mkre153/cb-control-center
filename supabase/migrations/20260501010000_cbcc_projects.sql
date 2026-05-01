-- CBCC v2: generic project registry with Step 0 charter governance
-- Two tables: cbcc_projects (project + Step 0 charter/approval) + cbcc_project_stages (7 rows per project)

CREATE TABLE IF NOT EXISTS cbcc_projects (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                  text UNIQUE NOT NULL,
  name                  text NOT NULL,

  -- Step 0 intake (9 fields)
  business_type         text,
  primary_goal          text,
  target_customer       text,
  known_constraints     text,
  forbidden_claims      text,
  source_urls_notes     text,
  desired_output_type   text,
  approval_owner        text,

  -- Charter artifact (null until generated)
  charter_json          jsonb,
  charter_generated_at  timestamptz,
  charter_model         text,

  -- Approval record
  charter_approved      boolean NOT NULL DEFAULT false,
  charter_approved_at   timestamptz,
  charter_approved_by   text,
  charter_version       integer NOT NULL DEFAULT 1,
  charter_hash          text,

  -- Project lifecycle status
  project_status        text NOT NULL DEFAULT 'step_0_draft'
                          CHECK (project_status IN (
                            'step_0_draft',
                            'step_0_charter_ready',
                            'step_0_approved',
                            'in_progress',
                            'completed',
                            'archived'
                          )),

  -- Approval consistency: approved=true requires both a timestamp and a charter
  CONSTRAINT charter_approval_consistency CHECK (
    charter_approved = false
    OR (charter_approved = true AND charter_approved_at IS NOT NULL AND charter_json IS NOT NULL)
  ),

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cbcc_project_stages (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     uuid NOT NULL REFERENCES cbcc_projects(id) ON DELETE CASCADE,
  stage_number   integer NOT NULL CHECK (stage_number BETWEEN 1 AND 7),
  stage_key      text NOT NULL,
  stage_title    text NOT NULL,

  stage_status   text NOT NULL DEFAULT 'locked'
                   CHECK (stage_status IN (
                     'locked',
                     'available',
                     'in_progress',
                     'awaiting_approval',
                     'approved'
                   )),

  approved       boolean NOT NULL DEFAULT false,
  approved_at    timestamptz,
  approved_by    text,

  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),

  UNIQUE (project_id, stage_number)
);

-- Seed trigger: insert 7 locked stage rows when a project is created
CREATE OR REPLACE FUNCTION cbcc_seed_project_stages()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO cbcc_project_stages (project_id, stage_number, stage_key, stage_title)
  VALUES
    (NEW.id, 1, 'definition',    'Stage 1 — Definition'),
    (NEW.id, 2, 'discovery',     'Stage 2 — Discovery'),
    (NEW.id, 3, 'foundation',    'Stage 3 — Foundation'),
    (NEW.id, 4, 'strategy',      'Stage 4 — Strategy'),
    (NEW.id, 5, 'planning',      'Stage 5 — Planning'),
    (NEW.id, 6, 'build',         'Stage 6 — Build'),
    (NEW.id, 7, 'launch',        'Stage 7 — Launch');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cbcc_projects_seed_stages ON cbcc_projects;
CREATE TRIGGER cbcc_projects_seed_stages
  AFTER INSERT ON cbcc_projects
  FOR EACH ROW EXECUTE FUNCTION cbcc_seed_project_stages();
