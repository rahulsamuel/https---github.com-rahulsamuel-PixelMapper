/*
# Revoke anonymous grants on signed-in user tables

1. Overview
- Anonymous visitors had full table privileges (read, insert, update, delete) on tables that hold user-owned data and have no anonymous policies. Row level security already blocked them, but the grants were broader than needed.

2. Modified tables
- `users`, `pixel_map_projects`, `power_data_settings`, `pre_visual_saves`, `rack_drawing_saves`, `signal_flow_diagrams`, `project_collaborators`, `led_listing_fee_acknowledgements`: all table privileges revoked from the anonymous role.

3. Security changes
- Signed-in users keep their existing privileges, governed by their row level security policies.
- No policies or data are changed.

4. Important notes
- Idempotent: revoking an absent privilege is a no-op.
*/

REVOKE ALL ON users, pixel_map_projects, power_data_settings, pre_visual_saves, rack_drawing_saves, signal_flow_diagrams, project_collaborators, led_listing_fee_acknowledgements FROM anon;
