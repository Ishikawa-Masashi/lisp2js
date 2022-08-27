import { describe, expect, it } from 'vitest';
import { pairwise } from '../src';

describe('pairwise', () => {
  it('[apple]', () => {
    const values = [...pairwise(['apple', 'orange', 'kiwi', 'banana'])];
    expect(values).toEqual([
      ['apple', 'orange'],
      ['orange', 'kiwi'],
      ['kiwi', 'banana'],
    ]);
  });
});
