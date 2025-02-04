export const debounceAsync = <TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  ms: number
): ((...args: TArgs) => Promise<TReturn>) => {
  let timeout: NodeJS.Timeout | null = null

  return async function (this: unknown, ...args: TArgs): Promise<TReturn> {
    if (timeout) {
      clearTimeout(timeout)
    }
    return new Promise<TReturn>((resolve, reject) => {
      timeout = setTimeout(() => {
        fn.apply(this, args).then(resolve, reject)
      }, ms)
    })
  }
}
