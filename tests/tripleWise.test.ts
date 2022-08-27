import { describe, expect, it } from 'vitest';
import { tripleWise } from '../src';

describe('tripleWise', () => {
  it('[apple]', () => {
    const values = [...tripleWise(['apple', 'orange', 'kiwi', 'banana'])];
    expect(values).toEqual([
      ['apple', 'orange', 'kiwi'],
      ['orange', 'kiwi', 'banana'],
    ]);
  });
});
