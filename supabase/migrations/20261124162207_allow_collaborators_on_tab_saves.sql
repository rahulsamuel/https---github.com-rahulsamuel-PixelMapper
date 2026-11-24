/*
# Allow collaborators to read and save in every tool tab

1. Summary
   This migration extends row-level security on the per-tool save tables so that
   project collaborators (people the project owner invited) can read, create,
   and update the saved tool data for projects shared with them. Previously only
   the project owner could read or write these rows, which made shared projects
   effectively read-only in the other tools. Delete stays owner-only, matching
   the existing signal-flow pattern.

2. Tables modified (policies only, no schema changes)
   - power_data_settings        (Power & Data tab saves)
   - rack_drawing_saves         (Rack Drawing tab saves)
   - pre_visual_saves           (Pre-Visual tab saves)
   - hardware_list_saves        (Hardware List tab saves)
   - project_tab_identifiers    (per-tab identifier rows shared by all tools)

3. Security changes
   - SELECT/INSERT/UPDATE: owner OR collaborator of the parent project.
   - DELETE: owner only.
   - A row is visible/editable if the user owns the row (their user_id) OR is a
     collaborator on the row's project. INSERT/UPDATE additionally require the
     user to own or collaborate on the target project, and the row's user_id is
     required to be the caller, so attribution cannot be forged. The project_id
     column is already locked against changes by an earlier migration.

4. Notes
   - Idempotent: drop-then-create for every policy.
   - No data is modified; no columns added or removed.
*/

-- ─────────────────────────────────────────────────────────────
-- power_data_settings
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "select_own_power_data_settings" ON power_data_settings;
CREATE POLICY "select_own_power_data_settings"
ON power_data_settings FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM project_collaborators c
    WHERE c.project_id = power_data_settings.project_id
      AND c.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "insert_own_power_data_settings" ON power_data_settings;
CREATE POLICY "insert_own_power_data_settings"
ON power_data_settings FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM pixel_map_projects p
    WHERE p.id = power_data_settings.project_id
      AND (p.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_collaborators c
          WHERE c.project_id = p.id AND c.user_id = auth.uid()
        ))
  )
);

DROP POLICY IF EXISTS "update_own_power_data_settings" ON power_data_settings;
CREATE POLICY "update_own_power_data_settings"
ON power_data_settings FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM project_collaborators c
    WHERE c.project_id = power_data_settings.project_id
      AND c.user_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM pixel_map_projects p
    WHERE p.id = power_data_settings.project_id
      AND (p.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_collaborators c
          WHERE c.project_id = p.id AND c.user_id = auth.uid()
        ))
  )
);

DROP POLICY IF EXISTS "delete_own_power_data_settings" ON power_data_settings;
CREATE POLICY "delete_own_power_data_settings"
ON power_data_settings FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- rack_drawing_saves
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "select_own_rack_drawing_saves" ON rack_drawing_saves;
CREATE POLICY "select_own_rack_drawing_saves"
ON rack_drawing_saves FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM project_collaborators c
    WHERE c.project_id = rack_drawing_saves.project_id
      AND c.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "insert_own_rack_drawing_saves" ON rack_drawing_saves;
CREATE POLICY "insert_own_rack_drawing_saves"
ON rack_drawing_saves FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM pixel_map_projects p
    WHERE p.id = rack_drawing_saves.project_id
      AND (p.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_collaborators c
          WHERE c.project_id = p.id AND c.user_id = auth.uid()
        ))
  )
);

DROP POLICY IF EXISTS "update_own_rack_drawing_saves" ON rack_drawing_saves;
CREATE POLICY "update_own_rack_drawing_saves"
ON rack_drawing_saves FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM project_collaborators c
    WHERE c.project_id = rack_drawing_saves.project_id
      AND c.user_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM pixel_map_projects p
    WHERE p.id = rack_drawing_saves.project_id
      AND (p.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_collaborators c
          WHERE c.project_id = p.id AND c.user_id = auth.uid()
        ))
  )
);

DROP POLICY IF EXISTS "delete_own_rack_drawing_saves" ON rack_drawing_saves;
CREATE POLICY "delete_own_rack_drawing_saves"
ON rack_drawing_saves FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- pre_visual_saves
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "select_own_pre_visual_saves" ON pre_visual_saves;
CREATE POLICY "select_own_pre_visual_saves"
ON pre_visual_saves FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM project_collaborators c
    WHERE c.project_id = pre_visual_saves.project_id
      AND c.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "insert_own_pre_visual_saves" ON pre_visual_saves;
CREATE POLICY "insert_own_pre_visual_saves"
ON pre_visual_saves FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM pixel_map_projects p
    WHERE p.id = pre_visual_saves.project_id
      AND (p.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_collaborators c
          WHERE c.project_id = p.id AND c.user_id = auth.uid()
        ))
  )
);

DROP POLICY IF EXISTS "update_own_pre_visual_saves" ON pre_visual_saves;
CREATE POLICY "update_own_pre_visual_saves"
ON pre_visual_saves FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM project_collaborators c
    WHERE c.project_id = pre_visual_saves.project_id
      AND c.user_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM pixel_map_projects p
    WHERE p.id = pre_visual_saves.project_id
      AND (p.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_collaborators c
          WHERE c.project_id = p.id AND c.user_id = auth.uid()
        ))
  )
);

DROP POLICY IF EXISTS "delete_own_pre_visual_saves" ON pre_visual_saves;
CREATE POLICY "delete_own_pre_visual_saves"
ON pre_visual_saves FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- hardware_list_saves
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "select_own_hardware_list_saves" ON hardware_list_saves;
CREATE POLICY "select_own_hardware_list_saves"
ON hardware_list_saves FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM project_collaborators c
    WHERE c.project_id = hardware_list_saves.project_id
      AND c.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "insert_own_hardware_list_saves" ON hardware_list_saves;
CREATE POLICY "insert_own_hardware_list_saves"
ON hardware_list_saves FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM pixel_map_projects p
    WHERE p.id = hardware_list_saves.project_id
      AND (p.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_collaborators c
          WHERE c.project_id = p.id AND c.user_id = auth.uid()
        ))
  )
);

DROP POLICY IF EXISTS "update_own_hardware_list_saves" ON hardware_list_saves;
CREATE POLICY "update_own_hardware_list_saves"
ON hardware_list_saves FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM project_collaborators c
    WHERE c.project_id = hardware_list_saves.project_id
      AND c.user_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM pixel_map_projects p
    WHERE p.id = hardware_list_saves.project_id
      AND (p.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_collaborators c
          WHERE c.project_id = p.id AND c.user_id = auth.uid()
        ))
  )
);

DROP POLICY IF EXISTS "delete_own_hardware_list_saves" ON hardware_list_saves;
CREATE POLICY "delete_own_hardware_list_saves"
ON hardware_list_saves FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- project_tab_identifiers
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "insert_own_project_tab_identifiers" ON project_tab_identifiers;
CREATE POLICY "insert_own_project_tab_identifiers"
ON project_tab_identifiers FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM pixel_map_projects p
    WHERE p.id = project_tab_identifiers.project_id
      AND (p.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_collaborators c
          WHERE c.project_id = p.id AND c.user_id = auth.uid()
        ))
  )
);

DROP POLICY IF EXISTS "select_own_project_tab_identifiers" ON project_tab_identifiers;
CREATE POLICY "select_own_project_tab_identifiers"
ON project_tab_identifiers FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM pixel_map_projects p
    WHERE p.id = project_tab_identifiers.project_id
      AND (p.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_collaborators c
          WHERE c.project_id = p.id AND c.user_id = auth.uid()
        ))
  )
);

-- Re-assert grants for authenticated (no anon grants)
GRANT SELECT, INSERT, UPDATE, DELETE ON
  power_data_settings,
  rack_drawing_saves,
  pre_visual_saves,
  hardware_list_saves,
  project_tab_identifiers
TO authenticated;
