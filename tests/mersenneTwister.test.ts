import { describe, expect, it } from 'vitest';
// https://magicant.github.io/sjavascript/mt.html
import { MersenneTwister } from '../src';

describe('MersenneTwister', () => {
  it('乱数生成テスト', () => {
    const mt = new MersenneTwister([0x123, 0x234, 0x345, 0x456]);

    const resultInt: number[] = [];
    for (let i = 0; i < 20; i++) {
      resultInt.push(mt.nextInt());
    }
    expect(resultInt[0]).toEqual(1067595299);
    expect(resultInt[1]).toEqual(955945823);
    expect(resultInt[2]).toEqual(477289528);
    expect(resultInt[3]).toEqual(4107218783);
    expect(resultInt[4]).toEqual(4228976476);
    expect(resultInt[5]).toEqual(3344332714);
    expect(resultInt[6]).toEqual(3355579695);
    expect(resultInt[7]).toEqual(227628506);
    expect(resultInt[8]).toEqual(810200273);
    expect(resultInt[9]).toEqual(2591290167);
    expect(resultInt[10]).toEqual(2560260675);
    expect(resultInt[11]).toEqual(3242736208);
    expect(resultInt[12]).toEqual(646746669);
    expect(resultInt[13]).toEqual(1479517882);
    expect(resultInt[14]).toEqual(4245472273);
    expect(resultInt[15]).toEqual(1143372638);
    expect(resultInt[16]).toEqual(3863670494);
    expect(resultInt[17]).toEqual(3221021970);
    expect(resultInt[18]).toEqual(1773610557);
    expect(resultInt[19]).toEqual(1138697238);

    const resultFloat: number[] = [];
    for (let i = 0; i < 20; i++) {
      resultFloat.push(mt.next());
    }
    expect(resultFloat[0]).toEqual(0.3310613579725882);
    expect(resultFloat[1]).toEqual(0.6658802808137323);
    expect(resultFloat[2]).toEqual(0.9021936127785443);
    expect(resultFloat[3]).toEqual(0.016891781650972937);
    expect(resultFloat[4]).toEqual(0.6054105963840144);
    expect(resultFloat[5]).toEqual(0.6502730486458488);
    expect(resultFloat[6]).toEqual(0.14105854230491355);
    expect(resultFloat[7]).toEqual(0.16650583422091114);
    expect(resultFloat[8]).toEqual(0.30802692461591674);
    expect(resultFloat[9]).toEqual(0.3248199587299294);
    expect(resultFloat[10]).toEqual(0.48934664479289425);
    expect(resultFloat[11]).toEqual(0.6869515209417516);
    expect(resultFloat[12]).toEqual(0.6741796549553253);
    expect(resultFloat[13]).toEqual(0.23378341289753435);
    expect(resultFloat[14]).toEqual(0.49156192506665863);
    expect(resultFloat[15]).toEqual(0.950513579332625);
    expect(resultFloat[16]).toEqual(0.5713756893851204);
    expect(resultFloat[17]).toEqual(0.19455473543387525);
    expect(resultFloat[18]).toEqual(0.6368395475753994);
    expect(resultFloat[19]).toEqual(0.5064554768524573);
  });
});
