// 0以上max未満の乱数を返す
export function getRandomIntegerNumber(max: number) {
  // Math.random()関数は、 0 以上 1 未満 (0 は含むが、 1 は含まない) の範囲で浮動小数点の擬似乱数を返す

  // Math.floor() 関数は与えられた数値以下の最大の整数を返します。
  // Math.floor( 45.95); //  45
  // Math.floor( 45.05); //  45
  // Math.floor(  4   ); //   4
  // Math.floor(-45.05); // -46
  // Math.floor(-45.95); // -46
  return Math.floor(Math.random() * max);
}
