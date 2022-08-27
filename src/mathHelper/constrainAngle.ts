import { mod } from './mod';

// https://stackoverflow.com/questions/11498169/dealing-with-angle-wrap-in-c-code

// Normalize to [0,360):
export function constrainAngle180(x: number) {
  x = mod(x + 180, 360);
  if (x < 0) {
    x += 360;
  }
  return x - 180;
}

// Normalize to [-180,180):
export function constrainAngle360(x: number) {
  x = mod(x, 360);
  if (x < 0) {
    x += 360;
  }
  return x;
}

// Normalize to [0,360):
export function constrainAngle(x: number) {
  x = mod(x, 360);
  if (x < 0) {
    x += 360;
  }
  return x;
}

export function angleDiff(a: number, b: number) {
  let dif = mod(b - a + 180, 360);
  if (dif < 0) {
    dif += 360;
  }
  return dif - 180;
}

export function bisectAngle(a: number, b: number) {
  return constrainAngle(a + angleDiff(a, b) * 0.5);
}
