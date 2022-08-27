// retrieves the correct parenthesized expression
// by counting parantheses from a token's left side.
// https://stackoverflow.com/questions/71358959/how-to-extract-the-content-of-also-nested-parentheses-before-and-after-a-specifi
export function createFirstValidParenthesizedExpression(token: string) {
  let expression = '';

  if (token[0] === '(') {
    // if (token.at(0) === '(') {
    expression = '(';

    const charList = token.split('').slice(1);
    let char;

    let idx = -1;
    let balance = 1;

    while (balance !== 0 && (char = charList[++idx]) !== undefined) {
      if (char === '(') {
        balance = balance + 1;
      } else if (char === ')') {
        balance = balance - 1;
      }
      expression = expression + char;
    }
    if (balance !== 0) {
      expression = '';
    }
  }
  return expression;
}
