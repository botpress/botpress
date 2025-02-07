export type Func<X extends any[], Y> = (...args: X) => Y

export const setName = <X extends any[], Y>(f: Func<X, Y>, name: string): Func<X, Y> => {
  Object.defineProperty(f, 'name', { value: name })
  return f
}
