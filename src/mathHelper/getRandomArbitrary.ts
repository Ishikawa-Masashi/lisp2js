// 指定した値の間の乱数を返します。返値は min 以上、 max 未満です。
export function getRandomArbitrary(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
