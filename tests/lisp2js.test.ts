import { describe, expect, it } from 'vitest';
import { lisp } from '../src';

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
    expect(lisp.compile('(defn add [{:a 1 :b 2}] (+ a b))')).toBe(
      'function add(__lisp_args__){var __lisp_args_v__;__lisp_args__ = (__lisp_args__ === void 0 ? {} : __lisp_args__); var a = ((__lisp_args_v__ = __lisp_args__.a) === void 0 ? 1 : __lisp_args_v__); var b = ((__lisp_args_v__ = __lisp_args__.b) === void 0 ? 2 : __lisp_args_v__); return (a + b);};'
    );
    expect(lisp.compile('(add)')).toBe('add();');
    expect(lisp.getEvalResult()).toBe(3);

    expect(lisp.compile('(add :a 3 :b 4)')).toBe('add({a: 3, b: 4});');
    expect(lisp.getEvalResult()).toBe(7);

    expect(lisp.compile('(add :b 3) ')).toBe('add({b: 3});');
    expect(lisp.getEvalResult()).toBe(4);
  });

  it('define a macro (unhygienic right now)', () => {
    expect(lisp.compile('(defn add [a & b] (+ a b[0]))')).toBe(
      'function add(a){for(var b = [], $__0 = 1; $__0 < arguments.length; $__0++)b[$__0 - 1] = arguments[$__0];return (a + b[0]);};'
    );
    expect(lisp.compile('(defn add [a . b] (+ a (car b)))')).toBe(
      'function add(a){for(var b = [], $__0 = 1; $__0 < arguments.length; $__0++)b[$__0 - 1] = arguments[$__0];b = list.apply(null, b);return (a + car(b));};'
    );
  });

  it('anonymous function', () => {
    expect(lisp.compile('(fn [a :b 13 & c] (+ a b c[0]))')).toBe(
      'function (a, b){for(var c = [], $__0 = 2; $__0 < arguments.length; $__0++)c[$__0 - 2] = arguments[$__0];b = (b === void 0 ? 13 : b );return (a + b + c[0]);};'
    );
  });

  it('do. run a series of exps', () => {
    expect(lisp.compile('(do (+ 1 2) (- 3 4) (* 5 6))')).toBe(
      '(1 + 2);(3 - 4);(5 * 6);'
    );

    expect(lisp.compile('(fn [] (do (+ 1 2) (- 3 4) (* 5 6)))')).toBe(
      'function (){(1 + 2);(3 - 4);return (5 * 6);};'
    );

    expect(
      lisp.compile('(if 1 (do (def x 1) (def y 2)) (do (def x 2) (def y 1 )))')
    ).toBe('if(1){var x = 1;var y = 2;} else {var x = 2;var y = 1;};');
  });

  it('if', () => {
    expect(lisp.compile('(if 1 2 3)')).toBe('if(1){2} else {3};');

    expect(lisp.compile('(def x (if 1 2 3))')).toBe('var x = (1 ? 2 : 3);');
  });

  it('if', () => {
    expect(lisp.compile('(if 1 2 3)')).toBe('if(1){2} else {3};');

    expect(lisp.compile('(def x (if 1 2 3))')).toBe('var x = (1 ? 2 : 3);');
  });

  it('cond', () => {
    expect(
      lisp.compile(
        '(cond test1 (do stm1 stm2) test2 (do stm3 stem4) test3 stm5 else stm6)'
      )
    ).toBe(
      'if(test1){stm1;stm2;} else if (test2){stm3;stem4;} else if (test3){stm5} else {stm6};'
    );
  });

  it('case', () => {
    expect(
      lisp.compile(
        '(defn test [x] (case x "apple" "This is apple" "orange" "This is orange" else "This is nothing"))'
      )
    ).toBe(
      'function test(x){switch (x){ case "apple":return "This is apple"; case "orange":return "This is orange"; default: return "This is nothing";};};'
    );
  });

  it('let (es5)', () => {
    expect(lisp.compile('(let [x 1 y 2 x (+ x y) z 4] (+ x y z))')).toBe(
      '((function(){var x = 1;var y = 2;x = (x + y);var z = 4;return (x + y + z);})());'
    );

    expect(lisp.compile('(+ (let [x 1 y 2] (- x y)) 3)')).toBe(
      '(((function(){var x = 1;var y = 2;return (x - y);})()) + 3);'
    );

    expect(lisp.compile('(defn test [] (let x 1 y 2 (+ x y)))')).toBe(
      'function test(){return ((function(){var x = undefined;1;y;2;return (x + y);})());};'
    );
  });

  it('throw', () => {
    expect(lisp.compile('(throm "Too Big")')).toBe('throm("Too Big");');
  });

  it('yield', () => {
    expect(lisp.compile('(defn text [] (yield 1) (yield 2))')).toBe(
      'function text(){yield 1;yield 2; return;};'
    );

    expect(lisp.compile('(def x (test))')).toBe('var x = test();');

    expect(lisp.compile('(x.next)')).toBe('x.next();');
    expect(lisp.compile('(x.next)')).toBe('x.next();');
    expect(lisp.compile('(x.next)')).toBe('x.next();');
  });

  it('try/catch/finally', () => {
    expect(
      lisp.compile(
        '(try (console.log "This is try") catch e (console.log "This is catch") finally (console.log "This is finally"))'
      )
    ).toBe(
      'try{console.log("This is try")}catch(e){console.log("This is catch")}finally {console.log("This is finally")};'
    );
  });

  it('some operators', () => {
    expect(lisp.compile('(= 1 1)')).toBe('(1 === 1);');
    expect(lisp.compile('(+ 1 2 3)')).toBe('(1 + 2 + 3);');
    expect(lisp.compile('(- 1 2 3)')).toBe('(1 - 2 - 3);');
    expect(lisp.compile('(* 1 2 3)')).toBe('(1 * 2 * 3);');
    expect(lisp.compile('(/ 1 2 3)')).toBe('(1 / 2 / 3);');
    expect(lisp.compile('(* (+ 1 2) (- 3 4))')).toBe('((1 + 2) * (3 - 4));');
    expect(lisp.compile('(> 1 2 3 4)')).toBe('(1 > 2 && 2 > 3 && 3 > 4);');
    expect(lisp.compile('(<= 1 2 3 4)')).toBe('(1 <= 2 && 2 <= 3 && 3 <= 4);');
    expect(lisp.compile('(&& true false)')).toBe('(true && false);');
    expect(lisp.compile('(|| 1 2)')).toBe('(1 || 2);');
    expect(lisp.compile('(| 1 0x12)')).toBe('(1 | 0x12);');
    expect(lisp.compile('(and true false)')).toBe('(true && false);');
    expect(lisp.compile('(or true false)')).toBe('(true || false);');
    expect(lisp.compile('(not true)')).toBe('(!true);');
  });

  it('get', () => {
    expect(lisp.compile(`(get "abcd" 'length)`)).toBe('"abcd".length;');
    expect(lisp.compile(`(get "abcd" length)`)).toBe('"abcd"[length];');
    expect(lisp.compile('(get console .log)')).toBe('console.log;');
  });

  it('->', () => {
    expect(lisp.compile('(-> console (.log "Hello World"))')).toBe(
      'console.log("Hello World");'
    );

    // expect(
    //   lisp.compile(
    //     '(-> $ (.post "test.php") (.done (fn () "done")) (.fail (fn () "fail")))'
    //   )
    // ).toBe('console.log("Hello World");');

    expect(lisp.compile('(-> "i am cool" .length)')).toBe(
      '"i am cool".length;'
    );
  });

  it('class (this might be buggy, I will implement class in es6 in the future)', () => {
    lisp.compile(`
    (class Animal
        :constructor (fn [age]                ;; define constructor
                        (set! this.age age))
        :showAge (fn []                       ;; define method
                    (console.log "Called from Animal")
                    (console.log this.age)))
    `);

    lisp.compile(`
    (class Dog extends Animal
        :constructor (fn [age]                ;; define constructor
                        (super age))          ;; call superclass constructor
        :showAge (fn []                       ;; define method
                    (console.log "Called from Dog")
                    (super.showAge))          ;; call superclass method
        :bark (fn []                          ;; define method
                (console.log "Bark!")))

    `);

    lisp.compile('(def dog (new Dog 5))');
    lisp.compile('(dog.showAge)');
    lisp.compile('(dog.bark)');
  });

  it('loop', () => {
    expect(
      lisp.compile(`
    ;; calculate factorial 10
    (loop [i 10
           acc 1]
        (if (= i 0)
            acc
            (recur (- i 1)
                   (* i acc))))
    `)
    ).toBe(
      '(function __lisp__recur__$0(i, acc){if((i === 0)){return acc} else {return __lisp__recur__$0((i - 1), (i * acc))};})(10, 1);'
    );
  });

  it('new', () => {
    expect(lisp.compile(`(def x (new Array 1 2 3 4))`)).toBe(
      'var x = (new Array(1, 2, 3, 4));'
    );
  });

  it('in', () => {
    expect(lisp.compile(`(in 'a {'a 12})`)).toBe('("a" in {"a": 12});');
  });

  it('instanceof', () => {
    expect(lisp.compile(`(instanceof [1 2 3] Array)`)).toBe(
      '([1, 2, 3] instanceof Array);'
    );
  });
});
