-- Auto-refresh updated_at on cbcc_projects and cbcc_project_stages

CREATE OR REPLACE FUNCTION cbcc_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cbcc_projects_updated_at
  BEFORE UPDATE ON cbcc_projects
  FOR EACH ROW EXECUTE FUNCTION cbcc_set_updated_at();

CREATE TRIGGER cbcc_project_stages_updated_at
  BEFORE UPDATE ON cbcc_project_stages
  FOR EACH ROW EXECUTE FUNCTION cbcc_set_updated_at();

-- Index for fast stage lookups by project
CREATE INDEX IF NOT EXISTS idx_cbcc_project_stages_project_id
  ON cbcc_project_stages (project_id, stage_number);
