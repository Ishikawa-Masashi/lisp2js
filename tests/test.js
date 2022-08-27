
console.log("Hello World");
var x = 12;
var y = [1, 2, 3];
var z = "This-is-string";
var o = {
    a: 12,
    b: 13,
    [z]: "Hi There"
};
x = 13;
y[0] = 4;
o.a = 15;
o[z] = 17;

function add(a, b) {
    return (a + b);
};
add(3, 4);

function abs(x) {
    if ((x > 0)) {
        return x
    } else {
        return (-x)
    };
};
var greater_than_0 = ((x > 0) ? x : 0);
(function(input_$45_string) {
    return console.log(input_$45_string);
})("Hi There");
var value = ((function() {
    var x = 1;
    var y = 2;
    var z = (x + y);
    return (x * y * z);
})());
var my_array = (new Array(1, 2, 3, 4, 5));
console.log(my_array);
var x = 1;
var y = 2;
var z = 3;
(x + y + z);
(12 * 12);
(12 * 12);
((15 * 15) + (16 * 16));
var x = cons(1, cons(2, cons(3, cons(4, null))));
var a = 1;
var b = 2;
var c = 3;
var d = cons(a, cons("a", cons(b, cons("b", cons(cons(c, cons("c", null)), null)))));
console.log(d.toString());
var x = list(a, b, c, d);
var x = cons(1, cons(2, cons(3, null)));
car(x);
var x = cons(1, cons(2, cons(3, null)));
cdr(x);
[1, 2, 3, 4].map(function(i) {
    return (i * 2);
});
(function __lisp__recur__$0(i, acc) {
    if ((i === 0)) {
        return acc
    } else {
        return __lisp__recur__$0((i - 1), (i * acc))
    };
})(10, 1);* i acc))))