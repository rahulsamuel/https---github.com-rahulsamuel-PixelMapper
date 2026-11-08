const PRIVATE_HOSTNAME = /(^localhost$|\.localhost$|\.internal$|\.local$|^metadata$)/;
const PRIVATE_IPV4 =
  /^(0\.|10\.|127\.|169\.254\.|192\.168\.|192\.0\.0\.|198\.1[89]\.|172\.(1[6-9]|2\d|3[01])\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.)/;

export function isPublicHttpUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (host === "::1" || host.startsWith("fe80") || /^f[cd]/.test(host)) return false;
  // IPv4-mapped IPv6 such as ::ffff:127.0.0.1
  const mapped = host.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (mapped && PRIVATE_IPV4.test(mapped[1])) return false;
  return !(PRIVATE_HOSTNAME.test(host) || PRIVATE_IPV4.test(host));
}

/**
 * Fetch a caller-supplied URL, re-validating every redirect hop so a public URL
 * cannot redirect the request into a private or link-local address.
 */
export async function safeFetch(
  input: string,
  init: RequestInit = {},
  maxRedirects = 5,
): Promise<Response> {
  let current = input;
  for (let hop = 0; hop <= maxRedirects; hop++) {
    if (!isPublicHttpUrl(current)) {
      throw new Error("Blocked request to a non-public address.");
    }
    const resp = await fetch(current, { ...init, redirect: "manual" });
    if (resp.status >= 300 && resp.status < 400) {
      const location = resp.headers.get("location");
      if (!location) return resp;
      current = new URL(location, current).toString();
      continue;
    }
    return resp;
  }
  throw new Error("Too many redirects.");
}
