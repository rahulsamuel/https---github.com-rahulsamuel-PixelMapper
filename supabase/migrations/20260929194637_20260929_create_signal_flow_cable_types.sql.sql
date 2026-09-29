/*
# Create signal_flow_cable_types table

1. New Tables
- `signal_flow_cable_types` — Admin-managed cable/connector types used in the Signal Flow tool.
  Each cable type has a slug id (e.g. "hdmi", "usb"), a display name, a color, sort order,
  and an is_active flag. When a diagram is loaded, these rows replace the hardcoded
  DEFAULT_CABLE_TYPES so that admin-added types (USB, DMX, etc.) are selectable in port
  and cable dropdowns.
  - `id` (uuid, primary key)
  - `slug` (text, unique, not null) — stable identifier used in port data (e.g. "hdmi")
  - `name` (text, not null) — display name (e.g. "HDMI")
  - `color` (text, not null default '#64748b') — hex color for cable rendering
  - `sort_order` (int, default 0)
  - `is_active` (boolean, default true)
  - `is_system` (boolean, default false) — true for seeded standard types (cannot be deleted)
  - `created_at` (timestamptz, default now())

2. Seed Data
- HDMI, SDI, RJ45/Ethernet, DVI, Fiber, Power, USB, DMX, Custom (all is_system = true)

3. Security
- Enable RLS on signal_flow_cable_types.
- SELECT: anyone (anon + authenticated) can read — cable types appear in the signal flow sidebar.
- INSERT/UPDATE/DELETE: only authenticated admins (via app_metadata.is_admin).
*/

CREATE TABLE IF NOT EXISTS signal_flow_cable_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#64748b',
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE signal_flow_cable_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_signal_flow_cable_types" ON signal_flow_cable_types;
CREATE POLICY "anon_select_signal_flow_cable_types"
ON signal_flow_cable_types FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_signal_flow_cable_types" ON signal_flow_cable_types;
CREATE POLICY "admin_insert_signal_flow_cable_types"
ON signal_flow_cable_types FOR INSERT
TO authenticated WITH CHECK (auth.jwt() ->> 'is_admin' = 'true');

DROP POLICY IF EXISTS "admin_update_signal_flow_cable_types" ON signal_flow_cable_types;
CREATE POLICY "admin_update_signal_flow_cable_types"
ON signal_flow_cable_types FOR UPDATE
TO authenticated USING (auth.jwt() ->> 'is_admin' = 'true')
WITH CHECK (auth.jwt() ->> 'is_admin' = 'true');

DROP POLICY IF EXISTS "admin_delete_signal_flow_cable_types" ON signal_flow_cable_types;
CREATE POLICY "admin_delete_signal_flow_cable_types"
ON signal_flow_cable_types FOR DELETE
TO authenticated USING (auth.jwt() ->> 'is_admin' = 'true');

INSERT INTO signal_flow_cable_types (slug, name, color, sort_order, is_system) VALUES
  ('hdmi',   'HDMI',           '#ef4444', 0, true),
  ('sdi',    'SDI',            '#3b82f6', 1, true),
  ('rj45',   'RJ45 / Ethernet','#10b981', 2, true),
  ('dvi',    'DVI',            '#f59e0b', 3, true),
  ('fiber',  'Fiber',          '#06b6d4', 4, true),
  ('power',  'Power',          '#f97316', 5, true),
  ('usb',    'USB',            '#8b5cf6', 6, true),
  ('dmx',    'DMX',            '#e11d48', 7, true),
  ('custom', 'Custom',         '#64748b', 8, true)
ON CONFLICT (slug) DO NOTHING;
