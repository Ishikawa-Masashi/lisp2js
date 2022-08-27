export function* pairwise<T>(iterable: Iterable<T>): Generator<Array<T>> {
  const iterator = iterable[Symbol.iterator]();
  let current = iterator.next();
  let next = iterator.next();
  while (!next.done) {
    yield [current.value, next.value];
    current = next;
    next = iterator.next();
  }
}
