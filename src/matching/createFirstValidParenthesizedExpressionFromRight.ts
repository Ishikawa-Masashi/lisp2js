// retrieves the correct parenthesized expression
// by counting parantheses from a token's right side.
export function createFirstValidParenthesizedExpressionFromRight(
  token: string
) {
  let expression = '';

  if (token.slice(-1) === ')') {
    // if (token.at(-1) === ')') {
    expression = ')';

    const charList = token.split('').slice(0, -1);
    let char;

    let idx = charList.length;
    let balance = 1;

    while (balance !== 0 && (char = charList[--idx]) !== undefined) {
      if (char === ')') {
        balance = balance + 1;
      } else if (char === '(') {
        balance = balance - 1;
      }
      expression = char + expression;
    }
    if (balance !== 0) {
      expression = '';
    }
  }
  return expression;
}
