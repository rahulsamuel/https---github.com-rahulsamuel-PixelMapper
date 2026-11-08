/*
# Block disposable email domains on account creation

1. New Table
- `disposable_email_domains`: lowercase domain names known to issue temporary inboxes (for example mailinator.com).
- Row level security is enabled. Anonymous and signed-in clients may read the list so the sign-up form can show a message before submitting. No client may write to it; rows are managed through the database.

2. Enforcement
- A BEFORE INSERT trigger on `auth.users` rejects any new account whose email domain matches a listed domain or one of its subdomains.
- This runs for every signup path, so it cannot be bypassed from the browser.

3. Notes
- The function is SECURITY DEFINER so the auth service can read the list without extra grants, and EXECUTE is revoked from client roles.
*/

CREATE TABLE IF NOT EXISTS public.disposable_email_domains (
  domain text PRIMARY KEY CHECK (domain = lower(domain)),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.disposable_email_domains ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.disposable_email_domains TO anon, authenticated;

CREATE POLICY "anyone_can_read_disposable_email_domains"
  ON public.disposable_email_domains
  FOR SELECT
  TO anon, authenticated
  USING (true);

INSERT INTO public.disposable_email_domains (domain) VALUES
  ('mailinator.com'), ('tempmail.com'), ('temp-mail.org'), ('temp-mail.io'), ('tempmailo.com'),
  ('tempr.email'), ('tempail.com'), ('tempinbox.com'), ('tmpmail.org'), ('tmpmail.net'),
  ('guerrillamail.com'), ('guerrillamail.net'), ('guerrillamail.org'), ('guerrillamail.biz'),
  ('guerrillamailblock.com'), ('sharklasers.com'), ('grr.la'), ('spam4.me'),
  ('yopmail.com'), ('yopmail.net'), ('yopmail.fr'), ('cool.fr.nf'), ('jetable.org'),
  ('10minutemail.com'), ('10minutemail.net'), ('20minutemail.com'), ('throwawaymail.com'),
  ('trashmail.com'), ('trashmail.net'), ('trashmail.de'), ('wegwerfemail.de'),
  ('getnada.com'), ('maildrop.cc'), ('mailnesia.com'), ('fakeinbox.com'), ('fakemail.net'),
  ('emailfake.com'), ('emailondeck.com'), ('mohmal.com'), ('mintemail.com'), ('mytemp.email'),
  ('moakt.com'), ('spamgourmet.com'), ('mailcatch.com'), ('mailnull.com'), ('mailforspam.com'),
  ('spambox.us'), ('harakirimail.com'), ('getairmail.com'), ('discard.email'), ('mailmetrash.com'),
  ('dropmail.me'), ('bccto.me'), ('mvrht.com'), ('incognitomail.com'), ('tmail.ws'), ('nwldx.com'),
  ('burnermail.io')
ON CONFLICT (domain) DO NOTHING;

CREATE OR REPLACE FUNCTION public.reject_disposable_email_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  email_domain text := lower(split_part(NEW.email, '@', 2));
BEGIN
  IF email_domain <> '' AND EXISTS (
    SELECT 1 FROM public.disposable_email_domains d
    WHERE email_domain = d.domain OR email_domain LIKE '%.' || d.domain
  ) THEN
    RAISE EXCEPTION 'Please sign up with a permanent personal or work email address.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reject_disposable_email_signup() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS reject_disposable_email_signup ON auth.users;
CREATE TRIGGER reject_disposable_email_signup
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.reject_disposable_email_signup();
