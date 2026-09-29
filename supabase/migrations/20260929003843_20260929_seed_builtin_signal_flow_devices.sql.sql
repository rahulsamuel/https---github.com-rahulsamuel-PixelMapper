/*
# Seed built-in signal flow device presets into the database

## What this does
The Signal Flow tool has 8 hardcoded device presets (LED Processor, LED Screen,
Media Server, Power Supply, Network Switch, Matrix Router, Distribution Box,
Custom Device) that exist only in frontend code. The admin panel reads from the
`signal_flow_devices` table, so these presets never appeared there — the admin
could only see the 6 converter rows that were previously seeded.

This migration inserts those 8 built-in presets as rows in `signal_flow_devices`
so they show up in the admin panel alongside the converters. Each row's `ports`
column matches the frontend preset exactly (label, direction, portType).

## Idempotency
Each insert uses `WHERE NOT EXISTS` — safe to re-run.

## Security
No RLS changes. The table already has policies allowing anon/authenticated CRUD.
*/

INSERT INTO signal_flow_devices (name, device_type, category, color, width, height, ports, is_active, sort_order)
SELECT 'LED Processor', 'processor', 'processor', '#1e3a5f', 200, 160,
  '[{"label":"HDMI IN 1","direction":"input","portType":"hdmi"},{"label":"HDMI IN 2","direction":"input","portType":"hdmi"},{"label":"SDI IN","direction":"input","portType":"sdi"},{"label":"OUT 1","direction":"output","portType":"rj45"},{"label":"OUT 2","direction":"output","portType":"rj45"},{"label":"OUT 3","direction":"output","portType":"rj45"},{"label":"OUT 4","direction":"output","portType":"rj45"}]'::jsonb,
  true, 0
WHERE NOT EXISTS (SELECT 1 FROM signal_flow_devices WHERE name = 'LED Processor' AND device_type = 'processor');

INSERT INTO signal_flow_devices (name, device_type, category, color, width, height, ports, is_active, sort_order)
SELECT 'LED Screen', 'led-screen', 'led-screen', '#0d9488', 180, 120,
  '[{"label":"DATA IN","direction":"input","portType":"rj45"},{"label":"DATA OUT","direction":"output","portType":"rj45"},{"label":"POWER IN","direction":"input","portType":"power"}]'::jsonb,
  true, 0
WHERE NOT EXISTS (SELECT 1 FROM signal_flow_devices WHERE name = 'LED Screen' AND device_type = 'led-screen');

INSERT INTO signal_flow_devices (name, device_type, category, color, width, height, ports, is_active, sort_order)
SELECT 'Media Server', 'media-server', 'media-server', '#7c2d12', 180, 130,
  '[{"label":"OUT 1","direction":"output","portType":"hdmi"},{"label":"OUT 2","direction":"output","portType":"sdi"}]'::jsonb,
  true, 0
WHERE NOT EXISTS (SELECT 1 FROM signal_flow_devices WHERE name = 'Media Server' AND device_type = 'media-server');

INSERT INTO signal_flow_devices (name, device_type, category, color, width, height, ports, is_active, sort_order)
SELECT 'Power Supply', 'power-supply', 'power', '#b45309', 160, 140,
  '[{"label":"CH 1","direction":"output","portType":"power"},{"label":"CH 2","direction":"output","portType":"power"},{"label":"CH 3","direction":"output","portType":"power"},{"label":"CH 4","direction":"output","portType":"power"}]'::jsonb,
  true, 0
WHERE NOT EXISTS (SELECT 1 FROM signal_flow_devices WHERE name = 'Power Supply' AND device_type = 'power-supply');

INSERT INTO signal_flow_devices (name, device_type, category, color, width, height, ports, is_active, sort_order)
SELECT 'Network Switch', 'network-switch', 'network', '#1e40af', 200, 150,
  '[{"label":"PORT 1","direction":"input","portType":"rj45"},{"label":"PORT 2","direction":"input","portType":"rj45"},{"label":"PORT 3","direction":"output","portType":"rj45"},{"label":"PORT 4","direction":"output","portType":"rj45"},{"label":"PORT 5","direction":"output","portType":"rj45"},{"label":"PORT 6","direction":"output","portType":"rj45"}]'::jsonb,
  true, 0
WHERE NOT EXISTS (SELECT 1 FROM signal_flow_devices WHERE name = 'Network Switch' AND device_type = 'network-switch');

INSERT INTO signal_flow_devices (name, device_type, category, color, width, height, ports, is_active, sort_order)
SELECT 'Matrix Router', 'matrix', 'other', '#581c87', 200, 180,
  '[{"label":"IN 1","direction":"input","portType":"hdmi"},{"label":"IN 2","direction":"input","portType":"hdmi"},{"label":"IN 3","direction":"input","portType":"sdi"},{"label":"IN 4","direction":"input","portType":"sdi"},{"label":"OUT 1","direction":"output","portType":"hdmi"},{"label":"OUT 2","direction":"output","portType":"hdmi"},{"label":"OUT 3","direction":"output","portType":"sdi"},{"label":"OUT 4","direction":"output","portType":"sdi"}]'::jsonb,
  true, 0
WHERE NOT EXISTS (SELECT 1 FROM signal_flow_devices WHERE name = 'Matrix Router' AND device_type = 'matrix');

INSERT INTO signal_flow_devices (name, device_type, category, color, width, height, ports, is_active, sort_order)
SELECT 'Distribution Box', 'distribution', 'other', '#0f766e', 160, 120,
  '[{"label":"IN","direction":"input","portType":"rj45"},{"label":"OUT 1","direction":"output","portType":"rj45"},{"label":"OUT 2","direction":"output","portType":"rj45"},{"label":"OUT 3","direction":"output","portType":"rj45"},{"label":"OUT 4","direction":"output","portType":"rj45"}]'::jsonb,
  true, 1
WHERE NOT EXISTS (SELECT 1 FROM signal_flow_devices WHERE name = 'Distribution Box' AND device_type = 'distribution');

INSERT INTO signal_flow_devices (name, device_type, category, color, width, height, ports, is_active, sort_order)
SELECT 'Custom Device', 'custom', 'other', '#475569', 160, 100,
  '[{"label":"IN","direction":"input","portType":"custom"},{"label":"OUT","direction":"output","portType":"custom"}]'::jsonb,
  true, 2
WHERE NOT EXISTS (SELECT 1 FROM signal_flow_devices WHERE name = 'Custom Device' AND device_type = 'custom');
