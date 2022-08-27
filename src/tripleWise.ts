export function* tripleWise<T>(iterable: Iterable<T>): Generator<Array<T>> {
  const iterator = iterable[Symbol.iterator]();
  let first = iterator.next();
  let second = iterator.next();
  let third = iterator.next();
  while (!second.done && !third.done) {
    yield [first.value, second.value, third.value];
    first = second;
    second = third;
    third = iterator.next();
  }
}
