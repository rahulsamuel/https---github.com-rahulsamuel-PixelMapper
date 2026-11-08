import { supabase } from '@/lib/supabase/client';

export const DISPOSABLE_EMAIL_MESSAGE =
  'Temporary email addresses are not accepted. Please enter a permanent personal or work email address.';

function domainAndParents(domain: string): string[] {
  const labels = domain.split('.');
  return labels.map((_, i) => labels.slice(i).join('.'));
}

export async function isDisposableEmail(email: string): Promise<boolean> {
  const domain = email.split('@')[1]?.trim().toLowerCase();
  if (!domain) return false;

  const { data, error } = await supabase
    .from('disposable_email_domains')
    .select('domain')
    .in('domain', domainAndParents(domain))
    .limit(1);

  if (error) return false;
  return (data?.length ?? 0) > 0;
}
