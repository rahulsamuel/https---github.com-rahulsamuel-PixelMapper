CREATE TABLE IF NOT EXISTS signal_flow_diagram_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES pixel_map_projects(id) ON DELETE CASCADE,
  diagram_name text NOT NULL,
  diagram_data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signal_flow_diagram_versions_project_created
  ON signal_flow_diagram_versions (project_id, created_at DESC);

ALTER TABLE signal_flow_diagram_versions ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON signal_flow_diagram_versions TO authenticated;

DROP POLICY IF EXISTS "select_signal_flow_versions_of_visible_projects" ON signal_flow_diagram_versions;
CREATE POLICY "select_signal_flow_versions_of_visible_projects" ON signal_flow_diagram_versions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pixel_map_projects p
      WHERE p.id = signal_flow_diagram_versions.project_id
    )
  );

CREATE OR REPLACE FUNCTION snapshot_signal_flow_diagram_version()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.diagram_data IS DISTINCT FROM NEW.diagram_data
     AND NOT EXISTS (
       SELECT 1 FROM signal_flow_diagram_versions v
       WHERE v.project_id = OLD.project_id
         AND v.created_at > now() - interval '5 minutes'
     ) THEN
    INSERT INTO signal_flow_diagram_versions (project_id, diagram_name, diagram_data)
    VALUES (OLD.project_id, OLD.diagram_name, OLD.diagram_data);

    DELETE FROM signal_flow_diagram_versions
    WHERE project_id = OLD.project_id
      AND id NOT IN (
        SELECT id FROM signal_flow_diagram_versions
        WHERE project_id = OLD.project_id
        ORDER BY created_at DESC
        LIMIT 50
      );
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION snapshot_signal_flow_diagram_version() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS snapshot_signal_flow_diagram_version_trigger ON signal_flow_diagrams;
CREATE TRIGGER snapshot_signal_flow_diagram_version_trigger
  AFTER UPDATE OF diagram_data ON signal_flow_diagrams
  FOR EACH ROW
  EXECUTE FUNCTION snapshot_signal_flow_diagram_version();
