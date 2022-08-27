// 3つの数値a,b,cの中で、中央の値を取得する
// Get median from three values
export function getMedianFrom(a: number, b: number, c: number) {
  const median = Math.max(Math.min(a, b), Math.min(Math.max(a, b), c));
  return median;
}
