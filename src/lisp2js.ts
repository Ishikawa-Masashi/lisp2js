import { List, cons, car, cdr, list } from './list';
/*
 *
 *  Simple Lisp to JavaScript compiler
 *
 */
let node_environment = false;
let vm: any = null;
if (typeof module != 'undefined') {
  // nodejs
  vm = require('vm');
  node_environment = true;
}

/**
 * ######################################################
 * ######################################################
 * ##################  List Prototype  ##################
 * ######################################################
 * ######################################################
 */
let $List = List;

/*
 * ########################################
 * ########################################
 * ########################################
 *  lisp module
 * ########################################
 * ########################################
 * ########################################
 */
const macros: Record<string, any> = {}; // used to save macro
let eval_result = '';
let global_context = null;
let recursion_function_name_count = 0;

const append = (x: List | null, y: List | null): List | null => {
  // (x y) (z w) => (x y z w)
  if (x === null) {
    return y instanceof $List || y === null ? y : cons(y, null);
  }
  return cons(x.first, append(x.rest, y));
};

if (node_environment) {
  // run under nodejs env
  // create global context
  const sandbox = {
    cons: cons,
    car: car,
    cdr: cdr,
    list: list,
    $List: $List,
    append: append,
    console: console,
  };
  global_context = vm.createContext(sandbox);
  // console.log(vm.runInContext("[1, 2, 3] instanceof Array", global_context, "repl"));
} else {
  window.append = append;
}
const lexer = function (input_string: string) {
  const output_list: string[] = [];
  let paren_count = 0;
  const getIndexOfValidStr = function (input_string: string, end: number) {
    while (1) {
      if (
        end === input_string.length ||
        input_string[end] === ' ' ||
        input_string[end] === '\n' ||
        input_string[end] === '\t' ||
        input_string[end] === ',' ||
        input_string[end] === ')' ||
        input_string[end] === '(' ||
        input_string[end] === ']' ||
        input_string[end] === '[' ||
        input_string[end] === '{' ||
        input_string[end] === '}' ||
        input_string[end] === "'" ||
        input_string[end] === '`' ||
        input_string[end] === '~' ||
        input_string[end] === ';' ||
        input_string[end] === ':' ||
        input_string[end] === '.'
      ) {
        break;
      }
      end += 1;
    }
    return end;
  };
  for (let i = 0; i < input_string.length; i++) {
    if (input_string[i] === '(') {
      output_list.push('(');
      paren_count++;
    } else if (input_string[i] === '[') {
      if (
        i !== 0 &&
        input_string[i - 1] !== ' ' &&
        input_string[i - 1] !== '\n' &&
        input_string[i - 1] !== '\t' &&
        input_string[i - 1] !== "'" &&
        input_string[i - 1] !== '`' &&
        input_string[i - 1] !== '~' &&
        input_string[i - 1] !== '(' &&
        input_string[i - 1] !== '{' &&
        input_string[i - 1] !== '['
      ) {
        j = output_list.length - 1;
        p = output_list[j] === ')' ? 1 : 0;
        if (p === 0) {
          // x[0]
          output_list.push('get');
          output_list.push(output_list[j]);
          output_list[j] = '(';
        } else {
          // x[1]
          output_list.push(''); // save space;
          output_list.push(''); // save space;
          output_list[j + 2] = output_list[j];
          j = j - 1;
          while (1) {
            output_list[j + 2] = output_list[j];
            if (output_list[j] === ')') {
              p++;
            }
            if (output_list[j] === '(') {
              p--;
            }
            if (p === 0) {
              break;
            }
            j--;
          }
          output_list[j] = '(';
          output_list[j + 1] = 'get';
        }
      } else {
        output_list.push('(');
        output_list.push('Array');
      }
      paren_count++;
    } else if (input_string[i] === '{') {
      output_list.push('(');
      output_list.push('Object');
      paren_count++;
    } else if (
      input_string[i] === ')' ||
      input_string[i] === ']' ||
      input_string[i] === '}'
    ) {
      output_list.push(')');
      paren_count--;
    } else if (
      input_string[i] === ' ' ||
      input_string[i] === '\n' ||
      input_string[i] == '\t' ||
      input_string[i] == ','
    ) {
      continue;
    } else if (input_string[i] === '~' && input_string[i + 1] === '@') {
      output_list.push('~@');
      i++;
    } else if (
      input_string[i] === '`' ||
      input_string[i] === '~' ||
      input_string[i] === "'"
    ) {
      output_list.push(input_string[i]);
    } else if (input_string[i] === ';') {
      // comment
      while (i != input_string.length) {
        if (input_string[i] === '\n') {
          break;
        }
        i++;
      }
    } else if (input_string[i] === '"') {
      // string
      let a = i + 1;
      while (a != input_string.length) {
        if (input_string[a] === '\\') {
          a += 2;
          continue;
        }
        if (input_string[a] === '"') {
          break;
        }
        a++;
      }
      output_list.push(input_string.slice(i, a + 1));
      i = a;
    } else {
      const end = getIndexOfValidStr(input_string, i + 1);
      const t = input_string.slice(i, end);

      // check exp like [0].x
      // (get x 0) .abc
      // (get (get x 0) .abc)
      if (
        t[0] === '.' &&
        output_list[output_list.length - 1] === ')' &&
        input_string[i - 1] !== ' ' &&
        input_string[i - 1] !== '\n' &&
        input_string[i - 1] !== '\t'
      ) {
        var p = 1;
        var j = output_list.length - 1;
        output_list.push(''); // save space;
        output_list.push(''); // save space;
        //output_list.push(""); // save space;
        output_list[j + 2] = output_list[j];
        j = j - 1;
        while (1) {
          output_list[j + 2] = output_list[j];
          if (output_list[j] === ')') {
            p++;
          }
          if (output_list[j] === '(') {
            p--;
          }
          if (p === 0) {
            break;
          }
          j--;
        }
        output_list[j] = '(';
        output_list[j + 1] = 'get';
        output_list.push('"' + t.slice(1) + '"');
        output_list.push(')');
      }

      // a.b
      else if (
        t[0] === '.' &&
        i > 0 &&
        input_string[i - 1] !== ' ' &&
        input_string[i - 1] !== '\t' &&
        input_string[i - 1] !== '\n' &&
        input_string[i - 1] !== '{' &&
        input_string[i - 1] !== '(' &&
        input_string[i - 1] !== '}' &&
        input_string[i - 1] !== ')'
      ) {
        const last = output_list[output_list.length - 1];
        output_list[output_list.length - 1] = '(';
        output_list.push('get');
        output_list.push(last);
        output_list.push('"' + t.slice(1) + '"');
        output_list.push(')');
      }
      // check exp like "abc".length
      else if (t[0] === '.' && input_string[i - 1] === '"') {
        output_list[output_list.length - 1] += t;
      } else {
        output_list.push(t);
      }
      /*// case like (get console .log)
                else if (t[0] === "."){
                    output_list.push("\"" + t.slice(1) + "\"");
                }*/
      i = end - 1;
    }
  }
  // error, parent doesn't match
  if (paren_count !== 0) {
    return null;
  }
  return output_list;
};

const parser = (l: string) => {
  const parser_get_tag = {
    "'": 'quote',
    '~': 'unquote',
    '~@': 'unquote-splice',
    '`': 'quasiquote',
  };
  if (l === null) {
    // lexer failure
    return null;
  }
  let current_list_pointer = null;
  let i, j;
  let lists = null;
  let temp = null;
  const t = null;
  for (i = l.length - 1; i >= 0; i--) {
    if (l[i] === ')') {
      lists = cons(current_list_pointer, lists); // save current lists
      current_list_pointer = null; // reset current_list_pointer
    } else if (l[i] === '(') {
      if (
        i !== 0 &&
        (l[i - 1] === '~@' ||
          l[i - 1] === "'" ||
          l[i - 1] === '~' ||
          l[i - 1] === '`')
      ) {
        current_list_pointer = cons(
          cons(parser_get_tag[l[i - 1]], cons(current_list_pointer, null)),
          car(lists)
        );
        i--;
      } else {
        // check vector
        if (
          current_list_pointer !== null &&
          current_list_pointer.first === 'Array'
        ) {
          const arr = [];
          current_list_pointer = current_list_pointer.rest;
          while (current_list_pointer !== null) {
            arr.push(current_list_pointer.first);
            current_list_pointer = current_list_pointer.rest;
          }
          current_list_pointer = cons(arr, car(lists)); // append array
        } else {
          current_list_pointer = cons(current_list_pointer, car(lists)); // append list
        }
      }
      temp = lists;
      lists = cdr(lists);
    } else {
      temp = l[i];
      if (
        i !== 0 &&
        (l[i - 1] === '~@' ||
          l[i - 1] === "'" ||
          l[i - 1] === '~' ||
          l[i - 1] === '`')
      ) {
        current_list_pointer = cons(
          cons(parser_get_tag[l[i - 1]], cons(temp, null)),
          current_list_pointer
        );
        i--;
      } else {
        current_list_pointer = cons(temp, current_list_pointer);
      }
    }
  }
  return current_list_pointer;
};

function arrayToList(arr, f) {
  let output = null;
  for (let i = arr.length - 1; i >= 0; i--) {
    const a = arr[i];
    if (typeof a === 'number') {
      output = cons(a, output);
    } else if (typeof a === 'string' && a[0] === '"') {
      output = cons(a, output);
    } else if (typeof a === 'string') {
      output = cons('"' + a + '"', output);
    } else if (a instanceof Array) {
      output = cons(arrayToList(a), output);
    } else if (a instanceof $List) {
      if (a.first === 'unquote' && f === quasiquote_list) {
        output = cons(a.rest.first, output);
      } else {
        output = cons(f(a), output);
      }
    } else {
      output = cons(a, output);
    }
  }
  return output;
}

function quote_list(l) {
  if (l === null) {
    return null;
  }
  const v = l.first;
  if (v instanceof $List) {
    return cons('cons', cons(quote_list(v), cons(quote_list(l.rest), null)));
  } else if (typeof v === 'string' && v === '.') {
    return cons('quote', cons(l.rest.first, null));
  } else if (v instanceof Array) {
    return cons(
      'cons',
      cons(
        cons('Array', arrayToList(v, quote_list)),
        cons(quote_list(l.rest), null)
      )
    );
  } else {
    return cons(
      'cons',
      cons(cons('quote', cons(v, null)), cons(quote_list(l.rest), null))
    );
  }
}

// validate variable name.
const validateName = function (var_name) {
  let o = '';
  for (let i = 0; i < var_name.length; i++) {
    const code = var_name.charCodeAt(i);
    if (
      (code > 47 && code < 58) || // numeric (0-9)
      (code > 64 && code < 91) || // upper alpha (A-Z)
      (code > 96 && code < 123) || // lower alpha (a-z)
      var_name[i] === '$' ||
      var_name[i] === '_' ||
      var_name[i] === '.' ||
      var_name[i] === '&' ||
      code > 255 // utf
    ) {
      o += var_name[i];
    } else {
      o += '_$' + code + '_';
    }
  }
  if (!isNaN(o[0])) {
    o = '_' + o;
  } // first letter is number, add _ ahead.
  //if (o === "super"){
  //    return "this.__proto__.__proto__";
  //}
  return o;
};

function quasiquote_list(l: List): List | null {
  if (l === null) {
    return null;
  }
  let v = l.first;
  if (v instanceof $List) {
    if (typeof v.first === 'string' && v.first === 'unquote') {
      return cons(
        'cons',
        cons(v.rest.first, cons(quasiquote_list(cdr(l)), null))
      );
    } else if (typeof v.first == 'string' && v.first === 'unquote-splice') {
      return cons(
        'append',
        cons(v.rest.first, cons(quasiquote_list(l.rest), null))
      );
    }
    return cons(
      'cons',
      cons(quasiquote_list(v), cons(quasiquote_list(l.rest), null))
    );
  } else if (typeof v === 'string' && v === '.') {
    return cons('quote', cons(l.rest.first, null));
  } else if (v instanceof Array) {
    // TODO: this has problem.
    return cons(
      'cons',
      cons(
        cons('Array', arrayToList(v, quasiquote_list)),
        cons(quote_list(l.rest), null)
      )
    );
  } else {
    return cons(
      'cons',
      cons(cons('quote', cons(v, null)), cons(quasiquote_list(l.rest), null))
    );
  }
}

const macro_match = function (a, b, result) {
  let i = 0;
  while (true) {
    if (i === a.length && i === b.length) {
      return result;
    } else if (
      (i === a.length && i !== b.length) ||
      (i !== a.length && i === b.length && a[i] !== '.')
    ) {
      return 0; // doesn't match
    } else if (a[i] instanceof Array && b[i] instanceof Array) {
      const match = macro_match(a[i], b[i], result);
      if (!match) {
        return 0;
      } // doesn't match
      i += 1;
      continue;
    } else if (a[i] instanceof Array && !(b[i] instanceof Array)) {
      return 0; // doesn't match
    } else {
      if (typeof a[i] === 'string' && a[i][0] === '#') {
        // constant
        if (typeof b[i] !== 'string') {
          return 0; // doesn't match
        }
        if (a[i].slice(1) === b[i]) {
          i += 1;
          continue;
        } else {
          return 0;
        }
      } else if (typeof a[i] === 'string' && a[i] === '.') {
        result[a[i + 1]] = b;
        return result;
      } else {
        result[a[i]] = b[i];
        i += 1;
        continue;
      }
    }
  }
};
const macro_expand = function (clauses: any, exp: any) {
  exp = exp.toArray();
  const formatList = (l: any): List => {
    // add "" to values.
    if (l === null) {
      return null;
    } else if (l.first instanceof $List) {
      return cons(cons('list', formatList(l.first)), formatList(l.rest));
    } else {
      if (l.first[0] === '"') {
        let o = '';
        for (let i = 0; i < l.first.length; i++) {
          if (l.first[i] === '"') {
            o += '\\"';
          } else if (l.first[i] === '\\') {
            o += '\\\\';
          } else if (l.first[i] === '\n') {
            o += '\\n';
          } else if (l.first[i] === '\t') {
            o += '\\t';
          } else {
            o += l.first[i];
          }
        }
        return cons('"' + o + '"', formatList(l.rest));
      } else if (l.first === null) {
        return cons(l.first, formatList(l.rest));
      } else {
        return cons('"' + validateName(l.first) + '"', formatList(l.rest));
      }
      // return cons(l.first[0] === "\"" ? ("'" + l.first + "'") : '"' + l.first + '"', formatList(l.rest)); // ????????????????????? ""abc""???????????? eval ????????????bug
    }
  };
  while (clauses !== null) {
    const match = macro_match(clauses.first, exp, {});
    if (match) {
      // match
      //console.log(match);
      //console.log(compiler(clauses.rest.first));
      let eval_macro = '(function(){';
      for (const key in match) {
        if (match[key] instanceof $List) {
          eval_macro +=
            'var ' +
            validateName(key) +
            ' = ' +
            compiler(cons('list', formatList(match[key]))) +
            ';';
        } else if (match[key] === null) {
          eval_macro += 'var ' + validateName(key) + ' = null; ';
        } else {
          eval_macro +=
            'var ' +
            validateName(key) +
            ' = ' +
            compiler('"' + match[key]) +
            '"' +
            ';';
        }
      }
      eval_macro += 'return (' + compiler(clauses.rest.first) + ');';
      eval_macro += '})();';
      if (node_environment) {
        try {
          const result = vm.runInContext(eval_macro, global_context, 'lisp.vm');
          return result;
        } catch (e) {
          console.log(e);
          return '';
        }
      } else {
        try {
          return window.eval(eval_macro);
        } catch (e) {
          console.log(e);
          return '';
        }
      }
    }
    clauses = clauses.rest.rest;
  }
  console.log('ERROR: Failed to expand macro\n');
  return '';
};

/**
 *
 * format parameters
 *
 */
const formatParams = function (params) {
  let o = '';
  let start_paren = false;
  while (true) {
    if (params === null) {
      break;
    }
    let p = params.first;
    p = compiler(p, null, null, null, true);
    if (typeof p === 'string' && p[0] === ':') {
      // named parameters
      if (start_paren === false) {
        // add left paren
        o += '(';
        start_paren = true;
      } else {
        o += ', ';
      }
      o +=
        '{' +
        p.slice(1) +
        ': ' +
        compiler(params.rest.first, null, null, null, true);
      params = params.rest.rest;
      while (true) {
        if (params === null) {
          o += '}';
          break;
        }
        const default_param_name = compiler(
          params.first,
          null,
          null,
          null,
          true
        );
        if (default_param_name[0] !== ':') {
          /*
                        if (default_param_name[0] === "."){ // (a .test :x 12 .test2) => a.test({x: 12}).test2
                            o += "})";
                            o += formatKeyForObject(default_param_name);
                            start_paren = false; // end paren
                            if (params.rest === null || params.rest.first[0] === "."){ // eg: (a .test :x 12 .done) => a.test({x: 12}).done() instead of a.test({x: 12}).done
                                o += "()";
                            }
                        }
                        else{
                            o += "}, " + default_param_name;
                        }*/
          o += '}, ' + default_param_name;
          break;
        }
        if (params.rest === null) {
          console.log('ERROR: Invalid parameter name');
          return '';
        }
        const default_param_val = compiler(
          params.rest.first,
          null,
          null,
          null,
          true
        );
        o += ', ' + default_param_name.slice(1) + ': ' + default_param_val;
        params = params.rest.rest;
      }
      // o += (p.slice(1) + "="); // stop supporting add(x = 12) like exp, which is invalid
    } /*
            else if (p[0] === "."){ // eg (console .log "Hello World")
                if(start_paren === true){
                    o += ")";
                }
                o += formatKeyForObject(p);
                start_paren = false; // end paren
                if (params.rest === null || params.rest.first[0] === "."){
                    o += "()";
                }
            }*/ else {
      if (start_paren === false) {
        // add left paren
        o += '(';
        start_paren = true;
      } else {
        o += ', ';
      }
      o += p;
    }
    if (params === null || params.rest === null) {
      break;
    }
    params = params.rest;
  }
  if (start_paren) {
    o += ')';
  }
  if (o.trim().length === 0) {
    return '()';
  }
  return o;
};

/*
 *   eg key is ":a-b-c" ".a-b-c"
 *   then p is "a-b-c"  "a-b-c"
 *
 */
const formatKey = (p: string) => {
  if (validateName(p) === p && isNaN(p)) {
    return p;
  } else {
    return '"' + p + '"';
  }
};

const formatKeyForObject = function (key) {
  if (key[0] === '"' || key[0] == '.') {
    // if "abc", then use .abc
    const mid = key[0] === '.' ? key.slice(1) : key.slice(1, -1);
    if (mid === validateName(mid) && isNaN(mid)) {
      return '.' + mid;
    } else {
      return '[' + key + ']';
    }
  } else {
    return '[' + key + ']';
  }
};

const compiler = function (
  l: any[] | List | string | null,
  is_last_exp?,
  is_recur?,
  need_return_string?,
  param_or_assignment?,
  current_fn_name?
) {
  let i;
  if (l === null) {
    return need_return_string ? 'return null' : 'null';
  }
  // Array value
  else if (l instanceof Array) {
    let o = need_return_string ? 'return [' : '[';
    for (i = 0; i < l.length; i++) {
      o += compiler(l[i], null, null, null, true);
      if (i !== l.length - 1) {
        o += ', ';
      }
    }
    o += ']';
    return o;
  } else if (l instanceof $List) {
    let tag = car(l);
    let o,
      var_name,
      var_value,
      v,
      key,
      params,
      body,
      test,
      func,
      p,
      args,
      clauses,
      find_else;
    if (tag === 'def' || tag === ':=' || tag === 'set!' || tag === 'const') {
      var_name = car(cdr(l));
      var_value = null;
      if (cdr(cdr(l)) === null) {
        var_value = null;
      } else if (/*tag === "def" &&*/ cdr(cdr(cdr(l))) !== null) {
        var_value = cons('fn', cons(car(cdr(cdr(l))), cdr(cdr(cdr(l)))));
      } else {
        var_value = l.rest.rest.first;
      }

      var_name = compiler(var_name);
      var_value = compiler(var_value, null, null, null, true, var_name); // param_or_assignment
      o =
        (tag === 'def' || tag === ':='
          ? 'var '
          : tag === 'const'
          ? 'const '
          : '') +
        var_name +
        ' = ' +
        var_value +
        ' ';
      return need_return_string ? o + '; return ' + var_name : o;
    } else if (tag === 'Array') {
      // array
      o = need_return_string ? 'return [' : '[';
      l = cdr(l);
      while (l !== null) {
        o += compiler(car(l), null, null, null, true);
        if (cdr(l) !== null) {
          o += ', ';
        }
        l = cdr(l);
      }
      o += ']';
      return o;
    } else if (tag === 'Object') {
      // object
      o = need_return_string ? 'return {' : '{';
      l = l.rest;
      while (l !== null) {
        key = compiler(l.first, null, null, null, true);
        if (key[0] === ':') {
          if (l.rest !== null && l.rest.first[0] !== ':') {
            const k = formatKey(key.slice(1));
            o += k + ': ';
          } else {
            // {:a :b}  => {a, b}
            o += key.slice(1) + (l.rest === null ? '' : ', ');
            l = l.rest;
            continue;
          }
        } else if (key[0] === "'" || key[0] === '"') {
          o += key + ': ';
        } else {
          o += '[' + key + ']: ';
        }

        const value = compiler(l.rest.first, null, null, null, true);
        o += value;
        if (l.rest.rest !== null) {
          o += ', ';
        }
        l = l.rest.rest;
      }
      o += '}';
      return o;
    } else if (tag === 'quote' || tag === 'quasiquote') {
      if (l.rest.first instanceof $List) {
        v = compiler(
          tag === 'quote'
            ? quote_list(l.rest.first)
            : quasiquote_list(l.rest.first)
        );
        return need_return_string ? 'return ' + v : v;
      } else if (l.rest === null) {
        return need_return_string ? 'return null' : 'null';
      } else {
        if (isNaN(l.rest.first)) {
          // not a number
          o = l.rest.first[0] === '"' ? l.rest.first : '"' + l.rest.first + '"'; // if val is string, return itself; otherwise return "val"
          return need_return_string ? 'return ' + o : o;
        } else {
          return need_return_string ? 'return ' + l.rest.first : l.rest.first;
        }
      }
    } else if (
      tag === 'defn' ||
      tag === 'fn' ||
      tag === 'fn*' ||
      tag === '??' ||
      tag === '??*' ||
      tag === '=>'
    ) {
      if (tag === 'defn' || tag === 'fn' || tag === '??') {
        // o is part ahead (){}
        o = 'function ';
      } else if (tag === 'fn*' || tag === '??*') {
        o = 'function* ';
      } else {
        o = '';
      }
      if (need_return_string) {
        o = 'return ' + o;
      }
      let o2 = ''; // o2 is (){}
      if (typeof l.rest.first === 'string') {
        // solve ((function test (){})()) problem
        current_fn_name = l.rest.first; // set recur fn name
        o2 += l.rest.first + '(';
        params = l.rest.rest.first;
        body = l.rest.rest.rest;
      } else {
        o2 += '(';
        params = l.rest.first;
        body = l.rest.rest;
      }
      // check default parameters
      /*

                    # keyword parameters
                    (def test (x {:y 12})
                      (+ x y))

                    (test 3 :y 13)

                    var test = function(x, args){
                        args = (args == null ? {} : args)
                        var y = (args.y == null ? 12 : args.y)
                        return x + y;
                    }

                    # default parameters
                    (def add (:a 12 :b 13)
                        (+ a b))

                    var add = function(a, b){
                        a = (a === void 0) ? 12 : a;
                        b = (b === void 0) ? 13 : b;
                        a + b;
                    }

                */

      const default_and_keyword_params = []; // [(x, 12), (y, 13), {}]
      const keyword_params: Record<string, any> = {}; // used to save default params and its value.
      let parameter_num = 0;
      let __lisp_rest_list__ = false; // check whether rest parameter is in list ds
      let __lisp_rest__ = null; // save rest parameter.
      if (!(params instanceof Array)) {
        throw 'Invalid experssion: '; // TODO: print expression
      }

      for (i = 0; i < params.length; i++) {
        p = params[i];
        if (typeof p !== 'string') {
          // keyword parameters
          if (p.first !== 'Object') {
            throw 'ERROR: Invalid parameters';
          }
          parameter_num++;
          p = p.rest;
          while (p !== null) {
            // get var_name and var_val;
            var_name = compiler(p.first);
            var_name = var_name[0] === '"' ? var_name.slice(1, -1) : var_name;
            var_name = var_name[0] === ':' ? var_name.slice(1) : var_name;
            var_value = compiler(p.rest.first, null, null, null, true);

            // save to table
            keyword_params[var_name] = var_value;

            p = p.rest.rest;
          }
          o2 += '__lisp_args__';
          if (
            i < params.length - 1 &&
            i + 1 < params.length &&
            params[i + 1] !== '&' &&
            params[i + 1] !== '.'
          ) {
            o2 += ', ';
          }
          default_and_keyword_params.push(keyword_params);
          continue;
        }
        p = compiler(p);
        if (p === '&') {
          // ecmascript 6 rest parameters
          parameter_num++;
          __lisp_rest__ = compiler(params[i + 1]);
          //o2 += ("..." + compiler(params.rest.first));
          break;
        } else if (p === '.') {
          // es6 rest parameters. convert to list
          parameter_num++;
          __lisp_rest__ = compiler(params[i + 1]);
          __lisp_rest_list__ = true;
          break;
        } else if (p[0] === ':') {
          parameter_num++;
          const default_param_name = p.slice(1); // get default param name.
          o2 += default_param_name; // add parameter name.
          default_and_keyword_params.push([
            default_param_name,
            compiler(params[i + 1], null, null, null, true),
          ]);
          i += 1;
          if (
            i < params.length - 1 &&
            i + 1 < params.length &&
            params[i + 1] !== '&' &&
            params[i + 1] !== '.'
          ) {
            o2 += ', ';
          }
          continue;
        } else {
          parameter_num++;
          o2 += p;
          if (
            i < params.length - 1 &&
            i + 1 < params.length &&
            params[i + 1] !== '&' &&
            params[i + 1] !== '.'
          ) {
            o2 += ', ';
          }
        }
      }

      is_recur = [current_fn_name ? current_fn_name : false];
      if (tag === '=>') {
        // (a, b) => {a + b};
        o2 += ')=>{';
      } else {
        o2 += '){';
      }

      if (__lisp_rest__) {
        // rest parameters
        o2 +=
          'for(var ' +
          __lisp_rest__ +
          ' = [], $__0 = ' +
          (parameter_num - 1) +
          '; $__0 < arguments.length; $__0++)' +
          __lisp_rest__ +
          '[$__0 - ' +
          (parameter_num - 1) +
          '] = arguments[$__0];';
        if (__lisp_rest_list__) {
          o2 += __lisp_rest__ + ' = list.apply(null, ' + __lisp_rest__ + ');';
        }
      }

      // check default_and_keyword_params.
      for (i = 0; i < default_and_keyword_params.length; i++) {
        v = default_and_keyword_params[i];
        if (v.constructor === Array) {
          // default parameters.
          const p_name = v[0];
          const p_val = v[1];
          o2 +=
            p_name +
            ' = (' +
            p_name +
            ' === void 0 ? ' +
            p_val +
            ' : ' +
            p_name +
            ' );';
        } else {
          // keyword parameters.
          o2 += 'var __lisp_args_v__;';
          o2 +=
            '__lisp_args__ = (__lisp_args__ === void 0 ? {} : __lisp_args__); ';
          for (key in v) {
            o2 +=
              'var ' +
              key +
              ' = ((__lisp_args_v__ = __lisp_args__.' +
              key +
              ') === void 0 ? ' +
              v[key] +
              ' : __lisp_args_v__); ';
          }
        }
      }
      o2 += lisp_compiler(body, true, null, is_recur);
      o2 += '}';
      if (is_recur[0] !== false && is_recur[0] !== current_fn_name) {
        // is recur
        o += is_recur[0];
      }
      return o + o2;
    } else if (tag === 'let') {
      /*
       * (let [x 1 y 2]
       *  	body)
       * => // {let x = 1; let y = 2; ...} deprecated
       * => ((function(){var x = 1; var y = 2; body...}))
       */
      const vars = {};
      const assignments = l.rest.first;

      o = '((function(){';
      for (i = 0; i < assignments.length; i += 2) {
        var_name = assignments[i];
        var_value = assignments[i + 1];

        if (typeof (var_name === 'string')) {
          if (var_name in vars) {
            o += var_name + ' = ' + compiler(var_value) + ';';
          } else {
            vars[var_name] = true;
            o +=
              /*param_or_assignment ? "var " :*/ /*"let "*/ 'var ' +
              var_name +
              ' = ' +
              compiler(var_value) +
              ';';
          }
        } else {
          console.log('let implementation not finished yet');
        }
      }

      // it is param or assignment, or inside function and is last exp
      o += compiler(
        cons('do', l.rest.rest),
        null,
        null,
        /*(param_or_assignment ||
                                                        (is_recur && is_last_exp)) ? true : false*/ true
      );
      o += '})())'; /*param_or_assignment ? "})())" : "}";*/
      return (
        (need_return_string /*&& param_or_assignment*/ ? 'return ' : '') + o
      ); //+ "}";
    } else if (tag === 'cond') {
      /*
       * (cond test1 body1 test2 body2 ...)
       */
      find_else = false;
      clauses = l.rest;
      o = 'if(';
      if (param_or_assignment) {
        o = '(function(){' + o;
      }
      test = compiler(clauses.first, null, null, null, true, null);
      o = o + test + '){';
      body = clauses.rest.first;
      o += compiler(
        body,
        true,
        is_recur,
        need_return_string || param_or_assignment,
        null,
        current_fn_name
      );
      o += '}';
      clauses = clauses.rest.rest;
      while (clauses !== null) {
        o += ' else ';
        if (clauses.first !== 'else') {
          // else if
          o += 'if (';
          test = compiler(clauses.first, null, null, null, true);
          o = o + test + '){';
          body = clauses.rest.first;
          o += compiler(
            body,
            true,
            is_recur,
            need_return_string || param_or_assignment,
            null,
            current_fn_name
          );
          o += '}';
          clauses = clauses.rest.rest;
        } else {
          find_else = true;
          o += '{';
          body = clauses.rest.first;
          o += compiler(
            body,
            true,
            is_recur,
            need_return_string || param_or_assignment,
            null,
            current_fn_name
          );
          o += '}';
          break;
        }
      }
      if (find_else === false && need_return_string) {
        o += ' else return null';
      }
      if (param_or_assignment) {
        o = o + '})()';
      }
      return o;
    } else if (tag === 'if') {
      /*
       *  (if a b c) => ((a) ? (b) : (c));
       */
      o = '(';
      test = l.rest.first;
      const conseq = l.rest.rest.first;
      const alter = l.rest.rest.rest === null ? null : l.rest.rest.rest.first;
      if (param_or_assignment) {
        o += compiler(test, null, null, null, true) + ' ? ';
        o += compiler(conseq, is_last_exp, is_recur, null, true, null) + ' : ';
        o += compiler(alter, is_last_exp, is_recur, null, true, null) + ')';
        return o;
      } else {
        if (alter === null) {
          return compiler(
            list('cond', test, conseq),
            is_last_exp,
            is_recur,
            need_return_string,
            param_or_assignment
          );
        } else {
          return compiler(
            list('cond', test, conseq, 'else', alter),
            is_last_exp,
            is_recur,
            need_return_string,
            param_or_assignment
          );
        }
      }
    } else if (tag === 'do') {
      if (param_or_assignment) {
        return '(function (){' + lisp_compiler(l.rest, true) + '})()';
      } else {
        return lisp_compiler(l.rest, need_return_string, null, is_recur);
      }
    } /*else if (tag === "begin"){   // begin will get return, while do wont
               // return lisp_compiler(l.rest, true, null, is_recur);
            }*/ else if (tag === 'apply') {
      func = compiler(l.rest.first);
      params = compiler(l.rest.rest.first, null, null, null, true);
      return (
        (need_return_string ? 'return ' : '') +
        '(' +
        func +
        ').apply(this, ' +
        '(function(){var temp = ' +
        params +
        '; return temp instanceof $List ? temp.toArray() : temp})()' +
        ')'
      );
    } else if (tag === 'new') {
      func = compiler(l.rest.first);
      o = '(new ' + func + '';
      o += formatParams(l.rest.rest);
      o += ')';
      return (need_return_string ? 'return ' : '') + o;
    } else if (
      tag === '+' ||
      tag === '-' ||
      tag === '*' ||
      tag === '/' ||
      tag === '%' ||
      tag === '=' ||
      tag === '<' ||
      tag === '>' ||
      tag === '!=' ||
      tag === '<=' ||
      tag === '>=' ||
      tag === '&&' ||
      tag === '||' ||
      tag === '&' ||
      tag === '|' ||
      tag === 'and' ||
      tag === 'or' ||
      tag === 'xor'
    ) {
      o = '(';
      params = l.rest;
      if (params.rest === null) {
        // only one params
        if (tag === '+' || tag === '*' || tag === '%') {
          return (
            (need_return_string ? 'return ' : '') +
            compiler(params.first, null, null, null, true)
          );
        } else if (tag === '-') {
          return (
            (need_return_string ? 'return ' : '') +
            '(-' +
            compiler(params.first, null, null, null, true) +
            ')'
          );
        } else if (tag === '/') {
          return (
            (need_return_string ? 'return ' : '') +
            '(1/' +
            compiler(params.first, null, null, null, true) +
            ')'
          );
        }
        // this part might be wrong.
        else {
          return (need_return_string ? 'return ' : '') + 'true';
        }
      }
      p = compiler(params.first, null, null, null, true);
      o += p;
      params = params.rest;
      while (params !== null) {
        p = compiler(params.first, null, null, null, true);
        if (tag === 'and') {
          tag = '&&';
        } else if (tag === 'or') {
          tag = '||';
        } else if (tag === '=') {
          tag = '===';
        } else if (tag === 'xor') {
          tag = '^';
        }
        o += ' ' + tag + ' ';

        o += p;
        if (
          params.rest !== null &&
          (tag === '===' ||
            tag === '<' ||
            tag === '>' ||
            tag === '!=' ||
            tag === '<=' ||
            tag === '>=')
        ) {
          o += ' && ' + p;
        }
        params = params.rest;
      }
      return (need_return_string ? 'return ' : '') + o + ')';
    } else if (tag === 'case') {
      /*  (def x 12)
             *  (case x
                    'apple "This is apple"
                    'yoo   "This is yooo"
                    else   "Hoo")
             *
             *
             *
             */
      find_else = false;
      let switch_object = l.rest.first; // get switch object
      switch_object = compiler(switch_object, null, null, null, true); // compile switch object
      clauses = l.rest.rest;
      o = 'switch (' + switch_object + '){';
      if (param_or_assignment) {
        // case inside param or assignment.
        o = '(function(){' + o;
      }
      while (clauses !== null) {
        if (clauses.first !== 'else') {
          // not default
          o += ' case ';
          test = compiler(clauses.first, null, null, null, true); // compile case
          o += test + ':';
          body = clauses.rest.first;
          o += compiler(
            body,
            true,
            is_recur,
            need_return_string || param_or_assignment,
            null,
            current_fn_name
          );
          o += o[o.length - 1] === ';' ? '' : ';';
          if (!(need_return_string || param_or_assignment)) {
            o += ' break;';
          }
          clauses = clauses.rest.rest;
        } else {
          // default
          find_else = true;
          o += ' default: ';
          body = clauses.rest.first;
          o += compiler(
            body,
            true,
            is_recur,
            need_return_string || param_or_assignment,
            null,
            current_fn_name
          );
          o += o[o.length - 1] === ';' ? '' : ';';
          if (!(need_return_string || param_or_assignment)) {
            o += ' break;';
          }
          break;
        }
      }
      if (find_else === false && need_return_string) {
        o += ' default: return null;';
      }
      o += '}';
      if (param_or_assignment) {
        o = o + '})()';
      }
      return o;
    } else if (tag === 'not') {
      return (
        (need_return_string ? 'return ' : '') +
        '(!' +
        compiler(l.rest.first, null, null, null, true) +
        ')'
      );
    } else if (tag === 'instanceof') {
      return (
        (need_return_string ? 'return ' : '') +
        '(' +
        compiler(l.rest.first) +
        ' instanceof ' +
        compiler(l.rest.rest.first) +
        ')'
      );
    } else if (tag === 'get') {
      // (get a "length")  => a["length"]
      v = compiler(l.rest.first, null, null, null, true);
      if (v === 'super') {
        v = 'this.__super__';
      } // check super object
      o = v;
      args = l.rest.rest;
      while (args !== null) {
        key = compiler(args.first, null, null, null, true);
        o += formatKeyForObject(key); // format key
        args = args.rest;
      }
      return (need_return_string ? 'return ' : '') + o;
    } else if (tag === '->') {
      /*
       *   (-> $ (.post ))
       *
       */
      v = compiler(l.rest.first, null, null, null, true); // get object
      if (v === 'super') {
        v = 'this.__super__';
      } // check super object
      o = v;
      args = l.rest.rest;
      while (args !== null) {
        let call_func = false; // check whether it is a function call.
        if (args.first instanceof $List) {
          call_func = true;
          key = compiler(args.first.first, null, null, null, true);
        } else {
          key = compiler(args.first, null, null, null, true);
        }
        o += formatKeyForObject(key);
        // call func
        if (call_func) {
          params = args.first.rest;
          o += formatParams(params);
        }
        args = args.rest;
      }
      return (need_return_string ? 'return ' : '') + o;
    } else if (tag === 'loop') {
      /**
       * (loop [i 10] (if (== i 0) 'done (recur (- i 1))))
       * => ((fn (i) (if (== i 0) 'done (recur (- i 1)))) 10)
       * => ((function (i){if(i == 0) return done; else return recur(i - 1)})(10))
       */
      const loop_params = [];
      const loop_args = [];
      clauses = l.rest.first;
      body = l.rest.rest;
      for (i = 0; i < clauses.length; i += 2) {
        var_name = compiler(clauses[i]);
        var_value = compiler(clauses[i + 1], null, null, null, true);
        loop_params.push(var_name);
        loop_args.push(var_value);
      }
      let loop_args_list = null;
      for (i = loop_params.length - 1; i >= 0; i--) {
        loop_args_list = cons(loop_args[i], loop_args_list);
      }
      return compiler(
        cons(cons('fn', cons(loop_params, body)), loop_args_list),
        is_last_exp,
        is_recur,
        need_return_string,
        param_or_assignment,
        current_fn_name
      );
    } else if (tag === 'try') {
      /*
       *  (try (do ...)   catch e (do ...) finally (do ...))
       *
       */
      o = 'try{';
      clauses = l.rest;
      body = clauses.first;
      o += compiler(
        body,
        true,
        is_recur,
        need_return_string || param_or_assignment,
        null,
        current_fn_name
      );
      o += '}';
      clauses = clauses.rest;
      if (clauses !== null && clauses.first === 'catch') {
        // catch
        o += 'catch(';
        const error = compiler(clauses.rest.first); // e
        o += error + '){';
        body = clauses.rest.rest.first;
        o += compiler(
          body,
          true,
          is_recur,
          need_return_string || param_or_assignment,
          null,
          current_fn_name
        );
        o += '}';
        clauses = clauses.rest.rest.rest;
      }
      if (clauses !== null && clauses.first === 'finally') {
        // finally
        body = clauses.rest.first;
        o += 'finally {';
        o += compiler(
          body,
          true,
          is_recur,
          need_return_string || param_or_assignment,
          null,
          current_fn_name
        );
        o += '}';
      }
      return o;
    } else if (tag === 'throw' || tag === 'yield') {
      return (
        /*(need_return_string ? "return " : "") +*/ tag +
        ' ' +
        compiler(l.rest.first, null, null, null, true) +
        (need_return_string ? '; return;' : '')
      );
    }
    // (in 'a {:a 12}) => true
    else if (tag === 'in') {
      return (
        (need_return_string ? 'return ' : '') +
        '(' +
        compiler(l.rest.first) +
        ' in ' +
        compiler(l.rest.rest.first) +
        ')'
      );
    } else if (tag === 'class') {
      /*
                ;; define Animal class
                (class Animal
                    :constructor (fn (age)
                                    (= this.age age))
                    :showAge (fn () (console.log this.age)))

                ;; Dog class extends Animal class
                (class Dog extends Animal
                    :constructor (fn (age)
                                    (super age))
                    :showAge (fn ()
                                (super.showAge)
                                (console.log "This is dog")))

                super => this.proto;
                super(12) => this.proto = new Animal(12);


                eg:
                (class A
                    :constructor (fn (x)
                                    (= this.x x))
                    :showX (fn ()
                                (console.log this.x)))
                (class B extends A
                    :constructor (fn (x y)
                                    (= this.y y)
                                    (super y))
                    :showX (fn ()
                                (console.log "This is B")
                                (super.showX)))
                =>
                function A(x){
                    this.x = x
                }
                A.prototype = {
                    constructor: A,
                    showX: function(){ console.log (this.x) }
                }

                function B(x, y){
                    this.y = y;
                    A.call(this, y); // A is this.__proto__.__proto__.constructor
                }
                B.prototype = {
                    __proto__: A.prototype,
                    constructor: B,
                    showX: function(){
                        console.log("This is B");
                        this.__proto__.__proto__.showX.apply(this);
                    }
                }
             */
      const class_name = l.rest.first; // get class name
      let constructor_value = null;
      let constructor_string;
      let extends_class_name = null;
      o = class_name + '.prototype = {constructor: ' + class_name + ''; // used to add prototype

      // super class
      if (l.rest.rest.first === 'extends') {
        extends_class_name = l.rest.rest.rest.first; // get superclass name
        l = l.rest.rest;
        o += ', __proto__: ' + extends_class_name + '.prototype'; // set __proto__
      }
      // todo check extends.
      l = l.rest.rest;
      while (l !== null) {
        key = compiler(l.first, null, null, null, true);
        if (key[0] === ':') {
          key = formatKey(key.slice(1));
          if (key === 'constructor') {
            if (constructor_value !== null) {
              // redefine the constructor.
              console.log(
                'ERROR: redefine the constructor for class ' + class_name
              );
              return '';
            }
            constructor_value = l.rest.first; // get constructor value
            l = l.rest.rest;
            continue;
          } else {
            o += ', ';
            o += key + ': ';
          }
        } else if (key[0] === "'" || key[0] === '"') {
          o += ', ';
          o += key + ': ';
        } else {
          o += ', ';
          o += '[' + key + ']: ';
        }

        var_value = compiler(l.rest.first, null, null, null, true);
        o += var_value;
        l = l.rest.rest;
      }
      o += '};';
      if (constructor_value !== null) {
        // compile constructor
        constructor_string = compiler(
          list('def', class_name, constructor_value)
        );
      }
      o = constructor_string + ';' + o;
      if (need_return_string) {
        return o + '; return ' + class_name + ';';
      } else {
        if (param_or_assignment) {
          return '(function(){' + o + ' return ' + class_name + ';}())';
        } else {
          return o;
        }
      }
    } else if (tag === 'defmacro') {
      /*
       * (defmacro macro-name
       *      var0 pattern0
       *      var1 pattern1 ... )
       *
       * eg:
       * (defmacro square [x] `(* ~x ~x))
       */
      const macro_name = compiler(l.rest.first);
      if (typeof macro_name !== 'string') {
        throw 'ERROR: Invalid macro name: ' + macro_name.toString();
      }
      clauses = l.rest.rest;
      macros[macro_name] = clauses;
      return '';
    } else if (tag === 'macroexpand') {
      /*
       * expand macro
       * eg (defmacro square (x) `(* ~x ~x))
       *    (macroexpand (square 12) 1)  expand once
       */
      const macro_expr = l.rest.first;
      let expand_time = l.rest.rest;
      const result = compiler(macro_expr);
      if (node_environment) {
        try {
          eval_result = vm.runInContext(result, global_context, 'lisp.vm');
          expand_time =
            expand_time === null
              ? -1
              : vm.runInContext(expand_time.first, global_context, 'lisp.vm');
        } catch (e) {
          console.log(e);
        }
      } else {
        try {
          eval_result = window.eval(result);
          expand_time =
            expand_time === null ? -1 : window.eval(expand_time.first);
        } catch (e) {
          console.log(e);
        }
      }
      // console.log("EVAL_RESULT: " + eval_result.toString());
      if (eval_result.first in macros) {
        // expand until the first element of list is not macro.
        var expanded_value = eval_result;
        i = 0;
        while (true) {
          expanded_value = macro_expand(
            macros[expanded_value.first],
            expanded_value.rest
          );
          if (expanded_value === null || !(expanded_value.first in macros)) {
            break;
          }
          i++;
          if (i === expand_time) {
            break;
          }
        }
        // console.log("EXPAND: " + expanded_value.toString());
        return compiler(
          list('quote', expanded_value),
          null,
          null,
          null,
          param_or_assignment
        );
        // return "\"" + expanded_value.toString() + "\"";
      } else {
        console.log(
          'ERROR: macro-expand invalid macro: ' + macro_expr.toString()
        );
        return '';
      }
    } else {
      // fn
      func = l.first;
      params = l.rest;
      func = compiler(func, null, null, null, true);
      if (func === 'recur' && is_last_exp) {
        if (is_recur[0] === false) {
          is_recur[0] = '__lisp__recur__$' + recursion_function_name_count; // last exp;
          recursion_function_name_count += 3;
        }
        func = is_recur[0];
        l.first = func;
      } else if (func === 'super') {
        // super constructor. eg (super 1 2)
        params = formatParams(params);
        o =
          "Object.defineProperty(this, '__super__', {value: this.__proto__.__proto__}); ";
        o +=
          (need_return_string ? 'return ' : '') +
          'this.__super__.constructor.call(this' +
          (params === '()' ? ')' : ', ' + params.slice(1));
        return o;
      } else if (
        (typeof func === 'string' && func.slice(0, 15) === 'this.__super__.') ||
        func.slice(0, 15) === 'this.__super__['
      ) {
        // super function. eg (super.showX);
        params = formatParams(params);
        o =
          'this.__super__' +
          func.slice(14) +
          '.call(this' +
          (params === '()' ? ')' : ', ' + params.slice(1));
        return (need_return_string ? 'return ' : '') + o;
      }
      o = func;
      if (func[func.length - 1] === '}' || !isNaN(func)) {
        // solve ((fn () "Hi")) bug
        o = '(' + o + ')';
      }
      if (func in macros) {
        const expanded_value = macro_expand(macros[func], params);
        return (
          (need_return_string ? 'return ' : '') +
          compiler(
            expanded_value,
            is_last_exp,
            is_recur,
            need_return_string,
            param_or_assignment,
            current_fn_name
          )
        );
      }

      o += formatParams(params);
      return (need_return_string ? 'return ' : '') + o;
    }
  } else {
    // string.
    if (isNaN(l) && l && l[0] !== "'" && l[0] !== '"' && l[0] !== ':') {
      // not a number
      return (need_return_string ? 'return ' : '') + validateName(l);
    } else {
      return (need_return_string ? 'return ' : '') + l;
    } // number
  }
};
/**
        l: the expressions
        need_return: need "return " keyword
        eval_$:  whether eval or not
        is_recur: recur object
        print_eval_result$: whether print eval result or not

    */
const lisp_compiler = function (
  l,
  need_return,
  eval_$?,
  is_recur?,
  print_eval_result$?
) {
  let o = '';
  let result;
  let need_return_string = false;
  while (l !== null) {
    if (need_return && l.rest === null) {
      need_return_string = true; // need add return string.
    }
    result = compiler(
      l.first,
      l.rest === null ? true : false,
      is_recur,
      need_return_string
    );
    if (typeof result === 'string') {
      result = result.trim();
    }
    if (
      typeof result === 'string' &&
      result.length !== 0 &&
      result[result.length - 1] !== ';' /*&& result[result.length - 1] !== "}"*/
    ) {
      result += ';';
    }
    if (eval_$) {
      // eval
      if (node_environment) {
        try {
          eval_result = vm.runInContext(result, global_context, 'lisp.vm');
          if (print_eval_result$) {
            console.log(eval_result);
          }
        } catch (e) {
          console.log(e);
        }
      } else {
        try {
          eval_result = window.eval(result);
          if (print_eval_result$) {
            console.log(eval_result);
          }
        } catch (e) {
          console.log(e);
        }
      }
    }
    o += result;
    l = l.rest;
  }
  return o;
};

export const compile = function (input_string: string, print_eval_result$?) {
  const l = lexer(input_string);
  if (l === null) {
    return null;
  }
  const p = parser(l);
  return lisp_compiler(p, false, true, null, print_eval_result$);
};

export const getEvalResult = function () {
  return eval_result;
};

// console.log(lisp.compile("(defn add [x y] (+ x y))"));
//console.log(lisp.compile("(fn [x] (if (= x 0) 1 (recur (- x 1))))"))
//console.log(lisp.compile("(loop [x 10] (if (= x 1) 'Done (recur (- x 1))))"));
//console.log(lisp.compile("(test :a 12)"));
//console.log(lisp.compile("(defmacro square [x] `(* ~x ~x) [x y] `(- ~x ~x)) (square 3 4)"));
