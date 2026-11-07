const NEAR_MATCH_THRESHOLD = 0.8;

function normalizeName(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function levenshtein(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = temp;
    }
  }
  return prev[b.length];
}

function similarity(a: string, b: string): number {
  if (a === b) return 1;
  const longest = Math.max(a.length, b.length);
  if (longest === 0) return 1;
  return 1 - levenshtein(a, b) / longest;
}

export function nameSimilarity(
  a: { manufacturer: string; productName: string },
  b: { manufacturer: string; productName: string },
): number {
  const manufacturer = similarity(normalizeName(a.manufacturer), normalizeName(b.manufacturer));
  const product = similarity(normalizeName(a.productName), normalizeName(b.productName));
  return Math.min(manufacturer, product);
}

export function isNearMatch(
  a: { manufacturer: string; productName: string },
  b: { manufacturer: string; productName: string },
): boolean {
  return nameSimilarity(a, b) >= NEAR_MATCH_THRESHOLD;
}
