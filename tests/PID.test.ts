import { describe, expect, it } from 'vitest';
import { PID } from '../src';

describe('PID', () => {
  it('PIDのテスト', () => {
    const pid = new PID(0.1, 100, -100, 0.1, 0.01, 0.5);
    // let value = 20;
    // for (let i = 0; i < 100; i++) {
    //   const inc = pid.calculate(0, value);
    //   // Printf("val:% 7.3f inc:% 7.3f\n", val, inc);
    //   console.log(`val:${value} inc:${inc}`);
    //   value += inc;
    // }
    expect(pid).toBeTruthy();
  });
});
