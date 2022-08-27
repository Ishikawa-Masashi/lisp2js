import { describe, expect, it } from 'vitest';
import { lisp } from '../src';
import testLispString from './test.lisp?raw';
import testJSString from './test.js?raw';

describe('lisp2js', () => {
  it('comment', () => {
    expect(lisp.compile('; semicolon is used as comment')).toBe('');
    expect(lisp.compile(';; this is comment')).toBe('');
  });

  it('define variable value', () => {
    expect(lisp.compile('(def x 12)')).toBe('var x = 12;');
    expect(
      lisp.compile(
        '(def ->this*name$invalid@in*js 13)   ;; a invalid js variable name, which will be replaced with another name.'
      )
    ).toBe('var _$45__$62_this_$42_name$invalid_$64_in_$42_js = 13;');
    expect(lisp.compile('(def ** Math.pow)')).toBe(
      'var _$42__$42_ = Math.pow;'
    );
  });

  it('(defn add [x y] (+ x y))', () => {
    expect(lisp.compile('(defn add [x y] (+ x y))')).toBe(
      'function add(x, y){return (x + y);};'
    );
  });

  it('change variable value', () => {
    expect(lisp.compile('(set! x 15)')).toBe('x = 15;');
    expect(lisp.compile('(set! this.x 15)')).toBe('this.x = 15;');
  });

  it('define function', () => {
    expect(lisp.compile('(defn add [a b] (+ a b))')).toBe(
      'function add(a, b){return (a + b);};'
    );
    expect(
      lisp.compile(`
    (defn add [a b]
        (+ a b))`)
    ).toBe('function add(a, b){return (a + b);};');
  });

  it('call function', () => {
    expect(lisp.compile('(add 3 4)')).toBe('add(3, 4);');
  });

  it('define function with default parameters', () => {
    expect(lisp.compile('(defn add [:a 12 :b 3] (+ a b))')).toBe(
      'function add(a, b){a = (a === void 0 ? 12 : a );b = (b === void 0 ? 3 : b );return (a + b);};'
    );
  });

  it('define function with keyword parameters', () => {
    expect(
      lisp.compile(`
        (defn add [x {:y 1 :z 2}]
           (+ x y z))
    `)
    ).toBe(
      'function add(x, __lisp_args__){var __lisp_args_v__;__lisp_args__ = (__lisp_args__ === void 0 ? {} : __lisp_args__); var y = ((__lisp_args_v__ = __lisp_args__.y) === void 0 ? 1 : __lisp_args_v__); var z = ((__lisp_args_v__ = __lisp_args__.z) === void 0 ? 2 : __lisp_args_v__); return (x + y + z);};'
    );

    lisp.compile('(add 0)');
    expect(lisp.getEvalResult()).toBe(3);

    lisp.compile('(add 1 :y 3)   ;;  6');
    expect(lisp.getEvalResult()).toBe(6);
  });

  it('call function with named(keyword) parameters', () => {
    lisp.compile('(defn add [{:a 1 :b 2}] (+ a b))');
    lisp.compile('(add)');
    expect(lisp.getEvalResult()).toBe(3);

    lisp.compile('(add :a 3 :b 4)');
    expect(lisp.getEvalResult()).toBe(7);

    lisp.compile('(add :b 3) ');
    expect(lisp.getEvalResult()).toBe(4);
  });

  it('define a macro (unhygienic right now)', () => {
    lisp.compile('(defmacro square [x] `(* ~x ~x))');
    expect(lisp.compile('(square 12)')).toBe('(12 * 12);');
  });

  it('test', () => {
    const result: string = lisp.compile(testLispString);
    // const splits = result.split(';');
    // // expect(lisp.compile(testLispString)).toBe('add(3, 4);');
    // splits.forEach((value) => {
    //   console.log(value);
    // });
    // expect(result.includes('console.log("Hello World")')).toBe(
    //   'console.log("Hello World")'
    // );
    // expect(result.includes('console.log("Hello World")')).toBeTruthy();
    expect(result).toBe('');
  });
});
