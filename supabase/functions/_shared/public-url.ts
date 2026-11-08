const PRIVATE_HOSTNAME = /(^localhost$|\.localhost$|\.internal$|\.local$)/;
const PRIVATE_IPV4 = /^(0\.|10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;

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
  return !(PRIVATE_HOSTNAME.test(host) || PRIVATE_IPV4.test(host));
}
