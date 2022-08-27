;; This is the comment
;; Please use Firefox to run compiled ECMAScript 6
;; Please open Web Console to see console.log result.
;; github link : https://github.com/shd101wyy/lisp2js
;; npm link    : https://www.npmjs.com/package/lisp2js

;; hello world
(console.log "Hello World")

;; define a variable
(def x 12)
(def y [1 2 3])
(def z 'This-is-string )
(def o {:a 12 :b 13 z "Hi There"})

;; change a variable value
(set! x 13)
(set! y[0] 4)
(set! o.a 15)
(set! o[z] 17)

;; define a function
(defn add [a b]
    (+ a b))

;; call a function
(add 3 4)

;; if statement
(defn abs [x]
    (if (> x 0)
        x
        (- x)))

(def greater_than_0 (if (> x 0) x 0))

    ;; anonymous function call
    ((fn [input-string] (console.log input-string)) "Hi There")

    ;; let
    (def value
        (let [x 1
              y 2
              z (+ x y)]
             (* x y z)))

    ;; new
    (def my_array (new Array 1 2 3 4 5))
    (console.log my_array)

    ;; do
    (do (def x 1)
        (def y 2)
        (def z 3)
        (+ x y z))

    ;; macro
    (defmacro square [x] `(* ~x ~x))
    (square 12)

    (defmacro square-with-different-params
      [x] `(* ~x ~x)
      [x y] `(+ (* ~x ~x) (* ~y ~y)))

    (square-with-different-params 12)
    (square-with-different-params 15 16)


    ;; list data type
    ;; need to include list.js from https://github.com/shd101wyy/List_for_FP

    ;; define a list
    (def x '(1 2 3 4))

    ;; quasiquote
    (def a 1)
    (def b 2)
    (def c 3)
    (def d `(~a a ~b b (~c c)))
    (console.log (d.toString))

    ;; list function
    (def x (list a b c d ))

    ;; car function
    ;; get first element of a list
    (def x '(1 2 3))
    (car x)  ;; => 1

    ;; cdr function
    (def x '(1 2 3))
    (cdr x) ;; => (2 3)

    ;; see doc in https://github.com/shd101wyy/List_for_FP  for more information.


    ;; array map
    ([1 2 3 4].map (fn [i] (* i 2)))

    ;; loop
    ;; calculate factorial 10
    (loop   [i 10
            acc 1]
            (if (= i 0)
                acc
                (recur (- i 1)
                        (* i acc))))