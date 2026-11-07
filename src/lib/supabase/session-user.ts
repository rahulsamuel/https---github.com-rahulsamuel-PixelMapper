import { getSupabaseUserClient } from '@/lib/supabase/server';

export type SessionUser = { id: string; isAdmin: boolean };

export async function getSessionUser(accessToken: string | null): Promise<SessionUser | null> {
  if (!accessToken) return null;
  try {
    const { data: { user } } = await getSupabaseUserClient(accessToken).auth.getUser(accessToken);
    if (!user) return null;
    return { id: user.id, isAdmin: user.app_metadata?.['is_admin'] === true };
  } catch {
    return null;
  }
}
