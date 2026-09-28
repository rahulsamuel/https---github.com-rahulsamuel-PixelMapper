/*
# Create signal flow device library tables

1. New Tables
- `signal_flow_devices` — Admin-managed library of device presets (processors, media servers, converters, etc.)
  that appear in the signal flow sidebar for all users.
  - `id` (uuid, primary key)
  - `name` (text, not null) — display name e.g. "Brompton SX40"
  - `device_type` (text, not null) — one of: processor, led-screen, media-server, power-supply, network-switch, matrix, distribution, converter, custom
  - `category` (text, not null) — sidebar category: processor, media-server, led-screen, power, network, converter, other
  - `color` (text, not null default '#475569') — hex color for the device block
  - `width` (int, default 180) — canvas width
  - `height` (int, default 120) — canvas height
  - `ports` (jsonb, not null default '[]') — array of { label, direction, portType } objects
  - `is_active` (boolean, default true) — soft delete / hide from sidebar
  - `sort_order` (int, default 0) — ordering within category
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

- `signal_flow_categories` — Admin-managed custom categories for the device sidebar.
  - `id` (uuid, primary key)
  - `name` (text, not null) — display label
  - `color` (text, not null default '#475569') — hex color
  - `sort_order` (int, default 0)
  - `is_active` (boolean, default true)
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on both tables.
- SELECT: anyone (anon + authenticated) can read active devices and categories — they appear in the sidebar.
- INSERT/UPDATE/DELETE: only authenticated admins can modify (checked via app_metadata.is_admin).
*/

CREATE TABLE IF NOT EXISTS signal_flow_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  device_type text NOT NULL,
  category text NOT NULL,
  color text NOT NULL DEFAULT '#475569',
  width int NOT NULL DEFAULT 180,
  height int NOT NULL DEFAULT 120,
  ports jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE signal_flow_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_signal_flow_devices" ON signal_flow_devices;
CREATE POLICY "anon_select_signal_flow_devices"
ON signal_flow_devices FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_signal_flow_devices" ON signal_flow_devices;
CREATE POLICY "admin_insert_signal_flow_devices"
ON signal_flow_devices FOR INSERT
TO authenticated WITH CHECK (auth.jwt() ->> 'is_admin' = 'true');

DROP POLICY IF EXISTS "admin_update_signal_flow_devices" ON signal_flow_devices;
CREATE POLICY "admin_update_signal_flow_devices"
ON signal_flow_devices FOR UPDATE
TO authenticated USING (auth.jwt() ->> 'is_admin' = 'true')
WITH CHECK (auth.jwt() ->> 'is_admin' = 'true');

DROP POLICY IF EXISTS "admin_delete_signal_flow_devices" ON signal_flow_devices;
CREATE POLICY "admin_delete_signal_flow_devices"
ON signal_flow_devices FOR DELETE
TO authenticated USING (auth.jwt() ->> 'is_admin' = 'true');

CREATE TABLE IF NOT EXISTS signal_flow_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#475569',
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE signal_flow_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_signal_flow_categories" ON signal_flow_categories;
CREATE POLICY "anon_select_signal_flow_categories"
ON signal_flow_categories FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_signal_flow_categories" ON signal_flow_categories;
CREATE POLICY "admin_insert_signal_flow_categories"
ON signal_flow_categories FOR INSERT
TO authenticated WITH CHECK (auth.jwt() ->> 'is_admin' = 'true');

DROP POLICY IF EXISTS "admin_update_signal_flow_categories" ON signal_flow_categories;
CREATE POLICY "admin_update_signal_flow_categories"
ON signal_flow_categories FOR UPDATE
TO authenticated USING (auth.jwt() ->> 'is_admin' = 'true')
WITH CHECK (auth.jwt() ->> 'is_admin' = 'true');

DROP POLICY IF EXISTS "admin_delete_signal_flow_categories" ON signal_flow_categories;
CREATE POLICY "admin_delete_signal_flow_categories"
ON signal_flow_categories FOR DELETE
TO authenticated USING (auth.jwt() ->> 'is_admin' = 'true');

-- Seed converter presets so they appear immediately
INSERT INTO signal_flow_devices (name, device_type, category, color, width, height, ports, sort_order)
VALUES
  ('HDMI to SDI Converter', 'converter', 'converter', '#6d28d9', 160, 100,
   '[{"label":"HDMI IN","direction":"input","portType":"hdmi"},{"label":"SDI OUT","direction":"output","portType":"sdi"}]'::jsonb, 0),
  ('SDI to HDMI Converter', 'converter', 'converter', '#6d28d9', 160, 100,
   '[{"label":"SDI IN","direction":"input","portType":"sdi"},{"label":"HDMI OUT","direction":"output","portType":"hdmi"}]'::jsonb, 1),
  ('DVI to HDMI Converter', 'converter', 'converter', '#6d28d9', 160, 100,
   '[{"label":"DVI IN","direction":"input","portType":"dvi"},{"label":"HDMI OUT","direction":"output","portType":"hdmi"}]'::jsonb, 2),
  ('HDMI to DVI Converter', 'converter', 'converter', '#6d28d9', 160, 100,
   '[{"label":"HDMI IN","direction":"input","portType":"hdmi"},{"label":"DVI OUT","direction":"output","portType":"dvi"}]'::jsonb, 3),
  ('SDI to Fiber Converter', 'converter', 'converter', '#6d28d9', 160, 100,
   '[{"label":"SDI IN","direction":"input","portType":"sdi"},{"label":"FIBER OUT","direction":"output","portType":"fiber"}]'::jsonb, 4),
  ('Fiber to SDI Converter', 'converter', 'converter', '#6d28d9', 160, 100,
   '[{"label":"FIBER IN","direction":"input","portType":"fiber"},{"label":"SDI OUT","direction":"output","portType":"sdi"}]'::jsonb, 5)
ON CONFLICT DO NOTHING;
