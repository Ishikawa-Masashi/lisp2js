/**
 * Returns a modulo value which is always positive.
 *
 * @method mod
 * @param {Number} n The divisor
 * @return {Number} A modulo value
 */
export function mod(value: number, n: number) {
  return ((value % n) + n) % n;
}
