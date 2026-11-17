/*
# Allow the hardware_list tab key in project_tab_identifiers

1. Modified Tables
- `project_tab_identifiers`: the `tab_key` check constraint now also accepts
  'hardware_list' so the new Hardware List tab can save its own per-project identifier,
  matching Power & Data, Rack Drawing, Pre-Visual and Signal Flow.

2. Notes
- Constraint is replaced atomically via NOT VALID + VALIDATE to avoid a long table scan.
*/

ALTER TABLE project_tab_identifiers DROP CONSTRAINT IF EXISTS project_tab_identifiers_tab_key_check;

ALTER TABLE project_tab_identifiers ADD CONSTRAINT project_tab_identifiers_tab_key_check
  CHECK (tab_key IN ('power_data', 'rack_drawing', 'pre_visual', 'signal_flow', 'hardware_list')) NOT VALID;

ALTER TABLE project_tab_identifiers VALIDATE CONSTRAINT project_tab_identifiers_tab_key_check;