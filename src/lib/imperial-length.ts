const FRACTION_DENOMINATOR = 16;

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function formatFeetInches(totalInches: number): string {
  const sixteenths = Math.round(totalInches * FRACTION_DENOMINATOR);
  const feet = Math.floor(sixteenths / (12 * FRACTION_DENOMINATOR));
  const remainder = sixteenths - feet * 12 * FRACTION_DENOMINATOR;
  const wholeInches = Math.floor(remainder / FRACTION_DENOMINATOR);
  const numerator = remainder % FRACTION_DENOMINATOR;

  let inchText = `${wholeInches}`;
  if (numerator > 0) {
    const divisor = gcd(numerator, FRACTION_DENOMINATOR);
    inchText += ` ${numerator / divisor}/${FRACTION_DENOMINATOR / divisor}`;
  }
  return `${feet}' ${inchText}"`;
}
