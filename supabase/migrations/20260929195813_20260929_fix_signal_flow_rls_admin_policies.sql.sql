/*
# Fix RLS policies for signal_flow tables — use app_metadata path

The original policies used `auth.jwt() ->> 'is_admin'` which reads a top-level JWT field.
However, `is_admin` is stored inside `app_metadata` in the JWT, so the correct path is
`auth.jwt() -> 'app_metadata' ->> 'is_admin'`. This matches how other admin-scoped tables
(contact_messages, download_feedback) already check admin status.

1. Policies updated (drop + recreate):
- signal_flow_devices: INSERT, UPDATE, DELETE
- signal_flow_categories: INSERT, UPDATE, DELETE
- signal_flow_cable_types: INSERT, UPDATE, DELETE

2. No data changes. SELECT policies remain unchanged (anon + authenticated read).
*/

-- signal_flow_devices
DROP POLICY IF EXISTS "admin_insert_signal_flow_devices" ON signal_flow_devices;
CREATE POLICY "admin_insert_signal_flow_devices"
ON signal_flow_devices FOR INSERT
TO authenticated WITH CHECK ((auth.jwt() -> 'app_metadata'::text) ->> 'is_admin'::text = 'true'::text);

DROP POLICY IF EXISTS "admin_update_signal_flow_devices" ON signal_flow_devices;
CREATE POLICY "admin_update_signal_flow_devices"
ON signal_flow_devices FOR UPDATE
TO authenticated USING ((auth.jwt() -> 'app_metadata'::text) ->> 'is_admin'::text = 'true'::text)
WITH CHECK ((auth.jwt() -> 'app_metadata'::text) ->> 'is_admin'::text = 'true'::text);

DROP POLICY IF EXISTS "admin_delete_signal_flow_devices" ON signal_flow_devices;
CREATE POLICY "admin_delete_signal_flow_devices"
ON signal_flow_devices FOR DELETE
TO authenticated USING ((auth.jwt() -> 'app_metadata'::text) ->> 'is_admin'::text = 'true'::text);

-- signal_flow_categories
DROP POLICY IF EXISTS "admin_insert_signal_flow_categories" ON signal_flow_categories;
CREATE POLICY "admin_insert_signal_flow_categories"
ON signal_flow_categories FOR INSERT
TO authenticated WITH CHECK ((auth.jwt() -> 'app_metadata'::text) ->> 'is_admin'::text = 'true'::text);

DROP POLICY IF EXISTS "admin_update_signal_flow_categories" ON signal_flow_categories;
CREATE POLICY "admin_update_signal_flow_categories"
ON signal_flow_categories FOR UPDATE
TO authenticated USING ((auth.jwt() -> 'app_metadata'::text) ->> 'is_admin'::text = 'true'::text)
WITH CHECK ((auth.jwt() -> 'app_metadata'::text) ->> 'is_admin'::text = 'true'::text);

DROP POLICY IF EXISTS "admin_delete_signal_flow_categories" ON signal_flow_categories;
CREATE POLICY "admin_delete_signal_flow_categories"
ON signal_flow_categories FOR DELETE
TO authenticated USING ((auth.jwt() -> 'app_metadata'::text) ->> 'is_admin'::text = 'true'::text);

-- signal_flow_cable_types
DROP POLICY IF EXISTS "admin_insert_signal_flow_cable_types" ON signal_flow_cable_types;
CREATE POLICY "admin_insert_signal_flow_cable_types"
ON signal_flow_cable_types FOR INSERT
TO authenticated WITH CHECK ((auth.jwt() -> 'app_metadata'::text) ->> 'is_admin'::text = 'true'::text);

DROP POLICY IF EXISTS "admin_update_signal_flow_cable_types" ON signal_flow_cable_types;
CREATE POLICY "admin_update_signal_flow_cable_types"
ON signal_flow_cable_types FOR UPDATE
TO authenticated USING ((auth.jwt() -> 'app_metadata'::text) ->> 'is_admin'::text = 'true'::text)
WITH CHECK ((auth.jwt() -> 'app_metadata'::text) ->> 'is_admin'::text = 'true'::text);

DROP POLICY IF EXISTS "admin_delete_signal_flow_cable_types" ON signal_flow_cable_types;
CREATE POLICY "admin_delete_signal_flow_cable_types"
ON signal_flow_cable_types FOR DELETE
TO authenticated USING ((auth.jwt() -> 'app_metadata'::text) ->> 'is_admin'::text = 'true'::text);
