CREATE TABLE IF NOT EXISTS public.rate_limits (
  key text PRIMARY KEY,
  window_start timestamptz NOT NULL DEFAULT now(),
  hits integer NOT NULL DEFAULT 0
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rate_limits FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.consume_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_window interval := make_interval(secs => p_window_seconds);
  v_hits integer;
BEGIN
  IF p_key IS NULL OR length(p_key) > 200 OR p_limit < 1 OR p_window_seconds < 1 THEN
    RAISE EXCEPTION 'invalid rate limit arguments';
  END IF;

  INSERT INTO public.rate_limits AS r (key, window_start, hits)
  VALUES (p_key, v_now, 1)
  ON CONFLICT (key) DO UPDATE SET
    window_start = CASE WHEN r.window_start <= v_now - v_window THEN v_now ELSE r.window_start END,
    hits = CASE WHEN r.window_start <= v_now - v_window THEN 1 ELSE r.hits + 1 END
  RETURNING hits INTO v_hits;

  DELETE FROM public.rate_limits WHERE key IN (
    SELECT key FROM public.rate_limits WHERE window_start < v_now - interval '1 day' LIMIT 50
  );

  RETURN v_hits <= p_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_rate_limit(text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text, integer, integer) TO anon, authenticated;

ALTER TABLE public.led_products
  ADD CONSTRAINT led_products_spec_sheet_url_safe CHECK (spec_sheet_url IS NULL OR spec_sheet_url ~* '^https?://' OR spec_sheet_url NOT LIKE '%:%') NOT VALID,
  ADD CONSTRAINT led_products_product_image_url_safe CHECK (product_image_url IS NULL OR product_image_url ~* '^https?://') NOT VALID;

ALTER TABLE public.processor_library
  ADD CONSTRAINT processor_library_spec_sheet_url_safe CHECK (spec_sheet_url IS NULL OR spec_sheet_url ~* '^https?://') NOT VALID,
  ADD CONSTRAINT processor_library_product_image_url_safe CHECK (product_image_url IS NULL OR product_image_url ~* '^https?://') NOT VALID;

ALTER TABLE public.contact_messages
  ADD CONSTRAINT contact_messages_name_length CHECK (length(name) <= 100) NOT VALID,
  ADD CONSTRAINT contact_messages_email_length CHECK (length(email) <= 254) NOT VALID,
  ADD CONSTRAINT contact_messages_message_length CHECK (length(message) <= 5000) NOT VALID;

ALTER TABLE public.download_feedback
  ADD CONSTRAINT download_feedback_message_length CHECK (length(message) <= 2000) NOT VALID,
  ADD CONSTRAINT download_feedback_submitter_name_length CHECK (length(submitter_name) <= 100) NOT VALID,
  ADD CONSTRAINT download_feedback_submitter_email_length CHECK (length(submitter_email) <= 254) NOT VALID,
  ADD CONSTRAINT download_feedback_download_type_length CHECK (length(download_type) <= 100) NOT VALID,
  ADD CONSTRAINT download_feedback_category_length CHECK (length(category) <= 50) NOT VALID;

ALTER TABLE public.pixel_map_snapshots
  ADD CONSTRAINT pixel_map_snapshots_session_id_length CHECK (length(session_id) <= 100) NOT VALID,
  ADD CONSTRAINT pixel_map_snapshots_screen_name_length CHECK (length(screen_name) <= 200) NOT VALID,
  ADD CONSTRAINT pixel_map_snapshots_filename_length CHECK (length(filename) <= 255) NOT VALID,
  ADD CONSTRAINT pixel_map_snapshots_download_type_length CHECK (length(download_type) <= 50) NOT VALID,
  ADD CONSTRAINT pixel_map_snapshots_thumbnail_length CHECK (length(thumbnail) <= 5000000) NOT VALID;
