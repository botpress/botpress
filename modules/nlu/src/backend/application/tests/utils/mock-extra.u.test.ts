type Func = (...args: any[]) => any
type MockedFunc<F extends Func> = jest.Mock<ReturnType<F>, Parameters<F>>

export type Mock<I> = {
  [k in keyof I]: I[k] extends Func ? MockedFunc<I[k]> : Mock<I[k]>
}

export const mock = <I>(partial: Partial<Mock<I>>): Mock<I> => {
  return <Mock<I>>partial
}
