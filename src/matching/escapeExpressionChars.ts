// helper which escapes all the possible math related
// characters which are also regex control characters.
export function escapeExpressionChars(expression: string) {
  return expression.replace(/[-+*()/]/g, '\\$&');
}
