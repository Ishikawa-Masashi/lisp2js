import { createFirstValidParenthesizedExpression } from './createFirstValidParenthesizedExpression';
import { createFirstValidParenthesizedExpressionFromRight } from './createFirstValidParenthesizedExpressionFromRight';
import { escapeExpressionChars } from './escapeExpressionChars';

export function createNthRootExpression(
  leftHandToken: string,
  rightHandToken: string
) {
  leftHandToken = leftHandToken.trim();
  rightHandToken = rightHandToken.trim();

  // patterns that match partial 'nthroot' expressions
  // which are free of parentheses.
  const regXSimpleLeftHandExpression = /[\d*/]+$/;
  const regXSimpleRightHandExpression = /^[\d*/]+|^\([^+-]*\)/;

  // retrieve part of the future 'nthroot' expression
  // from the token to the left of '√'.
  const leftHandExpression =
    leftHandToken.match(regXSimpleLeftHandExpression)?.[0] ||
    createFirstValidParenthesizedExpressionFromRight(leftHandToken);

  // retrieve part of the future 'nthroot' expression
  // from the token to the right of '√'.
  const rightHandExpression =
    rightHandToken.match(regXSimpleRightHandExpression)?.[0] ||
    createFirstValidParenthesizedExpression(rightHandToken);

  leftHandToken = leftHandToken.replace(
    // remove the terminating match/expression from the token.
    RegExp(escapeExpressionChars(leftHandExpression) + '$'),
    ''
  );
  rightHandToken = rightHandToken.replace(
    // remove the starting match/expression from the token.
    RegExp('^' + escapeExpressionChars(rightHandExpression)),
    ''
  );

  return [
    leftHandToken,
    `nthroot(${rightHandExpression},${leftHandExpression})`,
    rightHandToken,
  ].join('');
}
