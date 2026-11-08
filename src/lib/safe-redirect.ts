const UNSAFE_PATH_CHARS = /[\u0000-\u001f\u007f\\]/;

export function getSafeNextPath(search: string): string | null {
  const next = new URLSearchParams(search).get('next');
  if (!next || !next.startsWith('/') || next.startsWith('//')) return null;
  if (UNSAFE_PATH_CHARS.test(next) || next.startsWith('/login')) return null;
  return next;
}
