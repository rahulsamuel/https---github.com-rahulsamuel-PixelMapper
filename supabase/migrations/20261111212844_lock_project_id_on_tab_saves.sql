/*
# Lock project link on tab saves

Plain-English summary: once a saved tab (Power & Data, Rack Drawing, Pre-Visual, Signal Flow) is linked to a project, it can no longer be moved to a different project. Any attempt to change that link is rejected by the database.

## Changed tables
- `power_data_settings`
- `pre_visual_saves`
- `rack_drawing_saves`
- `signal_flow_diagrams`

Each of these already has a `project_id` column. No columns, data, or policies are added, removed or changed.

## Security changes
- A shared trigger function `prevent_tab_save_project_change` is created. It raises an error when an UPDATE would change `project_id`.
- A BEFORE UPDATE trigger on each table above runs that function.
- EXECUTE on the function is revoked from PUBLIC, anon and authenticated, since it is only ever run by the trigger.

## Important notes
1. Normal saves (updating the content of the same project's row) are unaffected.
2. The check is idempotent: the function is replaced and each trigger is dropped before being created.
3. Deleting a project still removes its tab saves through the existing cascade.
*/

CREATE OR REPLACE FUNCTION public.prevent_tab_save_project_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.project_id IS DISTINCT FROM OLD.project_id THEN
    RAISE EXCEPTION 'Saved tab data cannot be moved to a different project.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prevent_tab_save_project_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS lock_project_id_power_data_settings ON public.power_data_settings;
CREATE TRIGGER lock_project_id_power_data_settings
  BEFORE UPDATE OF project_id ON public.power_data_settings
  FOR EACH ROW EXECUTE FUNCTION public.prevent_tab_save_project_change();

DROP TRIGGER IF EXISTS lock_project_id_pre_visual_saves ON public.pre_visual_saves;
CREATE TRIGGER lock_project_id_pre_visual_saves
  BEFORE UPDATE OF project_id ON public.pre_visual_saves
  FOR EACH ROW EXECUTE FUNCTION public.prevent_tab_save_project_change();

DROP TRIGGER IF EXISTS lock_project_id_rack_drawing_saves ON public.rack_drawing_saves;
CREATE TRIGGER lock_project_id_rack_drawing_saves
  BEFORE UPDATE OF project_id ON public.rack_drawing_saves
  FOR EACH ROW EXECUTE FUNCTION public.prevent_tab_save_project_change();

DROP TRIGGER IF EXISTS lock_project_id_signal_flow_diagrams ON public.signal_flow_diagrams;
CREATE TRIGGER lock_project_id_signal_flow_diagrams
  BEFORE UPDATE OF project_id ON public.signal_flow_diagrams
  FOR EACH ROW EXECUTE FUNCTION public.prevent_tab_save_project_change();
