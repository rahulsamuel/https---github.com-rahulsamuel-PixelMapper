/*
# Tighten row level security, grants, and function access

1. Overview
- Confirms row level security is enabled on every table in the public schema.
- Shared catalog tables (processors, rack equipment, signal flow devices, pre-visual models) keep public read access, but only administrators can add, change, or remove entries.
- Rack equipment is the one catalog that signed-in users can add to. Each new entry records its creator, and only that creator or an administrator can change or remove it.
- Guest analytics snapshots can only be inserted with no owner. Signed-in owners can only insert snapshots they own.
- Anonymous visitors lose every grant they do not need. They keep read access to public catalogs and can still submit contact and download feedback forms.
- Several security definer functions are no longer callable by anonymous visitors, and the download feedback timestamp trigger has a fixed search path.

2. Modified tables
- `rack_equipment_library`: new column `user_id` (uuid, defaults to the signed-in user, nullable so existing entries stay admin-only).
- Policies on `processor_library`, `rack_equipment_library`, `rack_equipment`, `signal_flow_devices`, `signal_flow_categories`, `signal_flow_cable_types`, `pre_visual_models`, and `pixel_map_snapshots` are replaced.

3. Security changes
- Removed anonymous write policies on `processor_library` and `rack_equipment_library`.
- Removed signed-in write access to `processor_library`, `rack_equipment`, and the signal flow and pre-visual catalogs for non-administrators.
- Removed the open "anyone can insert snapshots" policy and replaced it with an owner-or-guest rule.
- Revoked anonymous TRUNCATE, REFERENCES, TRIGGER and all write grants on tables that anonymous visitors do not write to.
- Revoked TRUNCATE, REFERENCES, TRIGGER from signed-in users on every public table.
- Revoked anonymous execute on `is_project_collaborator`, `is_project_owner`, and `set_admin_flag`. The first two stay executable by signed-in users because project sharing policies depend on them.
- Pinned the search path on `update_download_feedback_updated_at`.

4. Important notes
- Administrator status is read from the signed-in user's app metadata, not user-editable data.
- Migrations are idempotent: policies are dropped before they are created, and column and function changes are guarded.
- Not changed in this migration: the "Users can read all profiles for collaboration" policy on `users`. Project invitations look collaborators up by email, so tightening it requires a separate lookup function.
*/

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE TRUNCATE, REFERENCES, TRIGGER ON %I FROM anon, authenticated', t);
  END LOOP;
END $$;

ALTER TABLE rack_equipment_library
  ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS rack_equipment_library_user_id_idx ON rack_equipment_library (user_id);

REVOKE ALL ON processor_library, rack_equipment_library, rack_equipment, signal_flow_devices, signal_flow_categories, signal_flow_cable_types, pre_visual_models, led_products, contact_messages, download_feedback, pixel_map_snapshots FROM anon;
GRANT SELECT ON processor_library, rack_equipment_library, rack_equipment, signal_flow_devices, signal_flow_categories, signal_flow_cable_types, pre_visual_models, led_products TO anon;
GRANT INSERT ON contact_messages, download_feedback, pixel_map_snapshots TO anon;

DROP POLICY IF EXISTS "insert_processors_anon" ON processor_library;
DROP POLICY IF EXISTS "update_processors_anon" ON processor_library;
DROP POLICY IF EXISTS "delete_processors_anon" ON processor_library;
DROP POLICY IF EXISTS "insert_processors" ON processor_library;
DROP POLICY IF EXISTS "update_processors" ON processor_library;
DROP POLICY IF EXISTS "delete_processors" ON processor_library;
DROP POLICY IF EXISTS "Admins can insert processors" ON processor_library;
DROP POLICY IF EXISTS "Admins can update processors" ON processor_library;
DROP POLICY IF EXISTS "Admins can delete processors" ON processor_library;
CREATE POLICY "Admins can insert processors" ON processor_library FOR INSERT
  TO authenticated WITH CHECK (((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true');
CREATE POLICY "Admins can update processors" ON processor_library FOR UPDATE
  TO authenticated USING (((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true')
  WITH CHECK (((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true');
CREATE POLICY "Admins can delete processors" ON processor_library FOR DELETE
  TO authenticated USING (((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true');

DROP POLICY IF EXISTS "insert_rack_equipment" ON rack_equipment_library;
DROP POLICY IF EXISTS "update_rack_equipment" ON rack_equipment_library;
DROP POLICY IF EXISTS "delete_rack_equipment" ON rack_equipment_library;
DROP POLICY IF EXISTS "Signed-in users can add rack equipment" ON rack_equipment_library;
DROP POLICY IF EXISTS "Owners and admins can update rack equipment" ON rack_equipment_library;
DROP POLICY IF EXISTS "Owners and admins can delete rack equipment" ON rack_equipment_library;
CREATE POLICY "Signed-in users can add rack equipment" ON rack_equipment_library FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners and admins can update rack equipment" ON rack_equipment_library FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR ((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true')
  WITH CHECK (auth.uid() = user_id OR ((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true');
CREATE POLICY "Owners and admins can delete rack equipment" ON rack_equipment_library FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR ((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true');

DROP POLICY IF EXISTS "auth_insert_rack_equipment" ON rack_equipment;
DROP POLICY IF EXISTS "auth_update_rack_equipment" ON rack_equipment;
DROP POLICY IF EXISTS "auth_delete_rack_equipment" ON rack_equipment;
DROP POLICY IF EXISTS "Admins can insert rack equipment" ON rack_equipment;
DROP POLICY IF EXISTS "Admins can update rack equipment" ON rack_equipment;
DROP POLICY IF EXISTS "Admins can delete rack equipment" ON rack_equipment;
CREATE POLICY "Admins can insert rack equipment" ON rack_equipment FOR INSERT
  TO authenticated WITH CHECK (((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true');
CREATE POLICY "Admins can update rack equipment" ON rack_equipment FOR UPDATE
  TO authenticated USING (((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true')
  WITH CHECK (((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true');
CREATE POLICY "Admins can delete rack equipment" ON rack_equipment FOR DELETE
  TO authenticated USING (((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true');

DROP POLICY IF EXISTS "admin_insert_signal_flow_devices" ON signal_flow_devices;
DROP POLICY IF EXISTS "admin_update_signal_flow_devices" ON signal_flow_devices;
DROP POLICY IF EXISTS "admin_delete_signal_flow_devices" ON signal_flow_devices;
DROP POLICY IF EXISTS "Admins can insert signal flow devices" ON signal_flow_devices;
DROP POLICY IF EXISTS "Admins can update signal flow devices" ON signal_flow_devices;
DROP POLICY IF EXISTS "Admins can delete signal flow devices" ON signal_flow_devices;
CREATE POLICY "Admins can insert signal flow devices" ON signal_flow_devices FOR INSERT
  TO authenticated WITH CHECK (((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true');
CREATE POLICY "Admins can update signal flow devices" ON signal_flow_devices FOR UPDATE
  TO authenticated USING (((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true')
  WITH CHECK (((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true');
CREATE POLICY "Admins can delete signal flow devices" ON signal_flow_devices FOR DELETE
  TO authenticated USING (((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true');

DROP POLICY IF EXISTS "admin_insert_signal_flow_categories" ON signal_flow_categories;
DROP POLICY IF EXISTS "admin_update_signal_flow_categories" ON signal_flow_categories;
DROP POLICY IF EXISTS "admin_delete_signal_flow_categories" ON signal_flow_categories;
DROP POLICY IF EXISTS "Admins can insert signal flow categories" ON signal_flow_categories;
DROP POLICY IF EXISTS "Admins can update signal flow categories" ON signal_flow_categories;
DROP POLICY IF EXISTS "Admins can delete signal flow categories" ON signal_flow_categories;
CREATE POLICY "Admins can insert signal flow categories" ON signal_flow_categories FOR INSERT
  TO authenticated WITH CHECK (((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true');
CREATE POLICY "Admins can update signal flow categories" ON signal_flow_categories FOR UPDATE
  TO authenticated USING (((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true')
  WITH CHECK (((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true');
CREATE POLICY "Admins can delete signal flow categories" ON signal_flow_categories FOR DELETE
  TO authenticated USING (((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true');

DROP POLICY IF EXISTS "admin_insert_signal_flow_cable_types" ON signal_flow_cable_types;
DROP POLICY IF EXISTS "admin_update_signal_flow_cable_types" ON signal_flow_cable_types;
DROP POLICY IF EXISTS "admin_delete_signal_flow_cable_types" ON signal_flow_cable_types;
DROP POLICY IF EXISTS "Admins can insert signal flow cable types" ON signal_flow_cable_types;
DROP POLICY IF EXISTS "Admins can update signal flow cable types" ON signal_flow_cable_types;
DROP POLICY IF EXISTS "Admins can delete signal flow cable types" ON signal_flow_cable_types;
CREATE POLICY "Admins can insert signal flow cable types" ON signal_flow_cable_types FOR INSERT
  TO authenticated WITH CHECK (((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true');
CREATE POLICY "Admins can update signal flow cable types" ON signal_flow_cable_types FOR UPDATE
  TO authenticated USING (((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true')
  WITH CHECK (((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true');
CREATE POLICY "Admins can delete signal flow cable types" ON signal_flow_cable_types FOR DELETE
  TO authenticated USING (((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true');

DROP POLICY IF EXISTS "admin_insert_pre_visual_models" ON pre_visual_models;
DROP POLICY IF EXISTS "admin_update_pre_visual_models" ON pre_visual_models;
DROP POLICY IF EXISTS "admin_delete_pre_visual_models" ON pre_visual_models;
DROP POLICY IF EXISTS "Admins can insert pre-visual models" ON pre_visual_models;
DROP POLICY IF EXISTS "Admins can update pre-visual models" ON pre_visual_models;
DROP POLICY IF EXISTS "Admins can delete pre-visual models" ON pre_visual_models;
CREATE POLICY "Admins can insert pre-visual models" ON pre_visual_models FOR INSERT
  TO authenticated WITH CHECK (((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true');
CREATE POLICY "Admins can update pre-visual models" ON pre_visual_models FOR UPDATE
  TO authenticated USING (((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true')
  WITH CHECK (((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true');
CREATE POLICY "Admins can delete pre-visual models" ON pre_visual_models FOR DELETE
  TO authenticated USING (((auth.jwt() -> 'app_metadata') ->> 'is_admin') = 'true');

DROP POLICY IF EXISTS "Anon and guests can insert snapshots" ON pixel_map_snapshots;
DROP POLICY IF EXISTS "Guests can insert unowned snapshots" ON pixel_map_snapshots;
CREATE POLICY "Guests can insert unowned snapshots" ON pixel_map_snapshots FOR INSERT
  TO anon, authenticated WITH CHECK (user_id IS NULL);

REVOKE EXECUTE ON FUNCTION public.is_project_collaborator(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_project_collaborator(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_project_owner(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_project_owner(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.set_admin_flag() FROM PUBLIC, anon, authenticated;

ALTER FUNCTION public.update_download_feedback_updated_at() SET search_path = public;
