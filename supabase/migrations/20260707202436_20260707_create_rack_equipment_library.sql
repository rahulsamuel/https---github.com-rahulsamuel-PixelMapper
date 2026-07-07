/*
# Create rack_equipment_library table

1. New Tables
   - `rack_equipment_library`
     - `id` (uuid, primary key)
     - `name` (text, display name, e.g. "Brompton S8")
     - `model` (text, nullable, full model name e.g. "S8 Processor")
     - `ru` (integer, rack unit height, 1-42)
     - `type` (text, one of: processor/power/network/utility/media/other)
     - `color` (text, CSS hex color for visual display)
     - `wattage` (integer, nullable, power draw in watts)
     - `mountable_at` (text, one of: front/rear/both — defaults to 'both')
     - `is_active` (boolean, soft-delete flag, default true)
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

2. Security
   - Enable RLS on `rack_equipment_library`.
   - SELECT: all roles (anon + authenticated) can read all items.
   - INSERT/UPDATE/DELETE: all roles allowed (admin-only enforcement is at the application/UI layer).

3. Seed Data
   - Pre-populate with 13 common AV rack equipment items covering all types.

4. Notes
   - Admin CRUD operations are performed via server actions that use the Supabase anon key.
   - The `is_active` flag allows soft-deleting items without breaking existing rack layouts.
   - Color codes follow the type-based system: processor=#3b82f6, power=#f59e0b, network=#10b981,
     utility=#64748b, media=#8b5cf6, other=#71717a.
*/

CREATE TABLE IF NOT EXISTS rack_equipment_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  model text,
  ru integer NOT NULL DEFAULT 1 CHECK (ru >= 1 AND ru <= 42),
  type text NOT NULL DEFAULT 'other' CHECK (type IN ('processor', 'power', 'network', 'utility', 'media', 'other')),
  color text NOT NULL DEFAULT '#71717a',
  wattage integer DEFAULT 0,
  mountable_at text NOT NULL DEFAULT 'both' CHECK (mountable_at IN ('front', 'rear', 'both')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE rack_equipment_library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_rack_equipment" ON rack_equipment_library;
CREATE POLICY "select_rack_equipment" ON rack_equipment_library FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_rack_equipment" ON rack_equipment_library;
CREATE POLICY "insert_rack_equipment" ON rack_equipment_library FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_rack_equipment" ON rack_equipment_library;
CREATE POLICY "update_rack_equipment" ON rack_equipment_library FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_rack_equipment" ON rack_equipment_library;
CREATE POLICY "delete_rack_equipment" ON rack_equipment_library FOR DELETE
  TO anon, authenticated USING (true);

-- Seed default equipment
INSERT INTO rack_equipment_library (name, model, ru, type, color, wattage, mountable_at) VALUES
  ('Brompton S8',       'S8 Processor',           4, 'processor', '#3b82f6', 200,  'front'),
  ('Brompton T1',       'T1 Processor',            2, 'processor', '#3b82f6', 120,  'front'),
  ('Brompton SX40',     'SX40 4K Processor',       2, 'processor', '#3b82f6', 180,  'front'),
  ('Novastar VX1000',   'VX1000 Processor',        2, 'processor', '#3b82f6', 150,  'front'),
  ('Novastar J6',       'J6 All-in-One',           1, 'processor', '#3b82f6',  80,  'front'),
  ('PDU 1U',            '1U Power Distribution',   1, 'power',     '#f59e0b',   0,  'both'),
  ('PDU 2U',            '2U Power Distribution',   2, 'power',     '#f59e0b',   0,  'both'),
  ('UPS 2U',            '2U Uninterruptible Power',2, 'power',     '#f59e0b',   0,  'front'),
  ('Network Switch',    '1U 24-Port Switch',       1, 'network',   '#10b981',  30,  'front'),
  ('Patch Panel',       '1U 24-Port Cat6',         1, 'network',   '#10b981',   0,  'rear'),
  ('Media Server',      '2U Rack Server',          2, 'media',     '#8b5cf6', 350,  'front'),
  ('Blank Panel 1U',    '1U Filler',               1, 'utility',   '#64748b',   0,  'both'),
  ('Cable Manager',     '1U Horizontal Manager',   1, 'utility',   '#64748b',   0,  'both')
ON CONFLICT DO NOTHING;
