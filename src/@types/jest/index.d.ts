declare namespace jest {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  interface Matchers<R> {
    toBeCalledWithStringified<E>(expected: E): R;
  }
}
