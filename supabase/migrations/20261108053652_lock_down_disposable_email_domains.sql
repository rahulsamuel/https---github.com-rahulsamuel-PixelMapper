/*
# Lock down the disposable email domain blocklist

1. Security changes
  - Revokes all privileges on `public.disposable_email_domains` from `anon` and `authenticated`.
    They previously held INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER and REFERENCES in addition to
    SELECT. TRUNCATE is not filtered by row level security, so the blocklist could be emptied by
    anyone able to connect with the public key.
  - Re-grants SELECT only, which is all the signup check needs.

2. Important notes
  1. The existing read policy is unchanged, so the signup check keeps working.
  2. service_role privileges are untouched, so administrative maintenance still works.
*/

REVOKE ALL ON public.disposable_email_domains FROM anon, authenticated;

GRANT SELECT ON public.disposable_email_domains TO anon, authenticated;
