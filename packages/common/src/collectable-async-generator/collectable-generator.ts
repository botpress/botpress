type CollectableAsyncGenerator<T, TReturn = unknown, TNext = unknown> = AsyncGenerator<T, TReturn, TNext> & {
  collect(limit?: number): Promise<T[]>
}

export function collectableGenerator<T, TReturn = unknown, TNext = undefined, Args extends unknown[] = []>(
  generatorFn: (...args: Args) => AsyncGenerator<T, TReturn, TNext>
): (...args: Args) => CollectableAsyncGenerator<T, TReturn, TNext> {
  return function (this: unknown, ...args: Args) {
    const originalGenerator = generatorFn.apply(this, args)

    const enhancedGenerator = Object.assign(originalGenerator, {
      async collect(limit: number = Infinity): Promise<T[]> {
        const results: T[] = []

        for await (const item of _takeFromGenerator(originalGenerator, limit)) {
          results.push(item)
        }

        return results
      },
    }) as CollectableAsyncGenerator<T, TReturn, TNext>

    return enhancedGenerator
  }
}

async function* _takeFromGenerator<T, TReturn>(
  generator: AsyncGenerator<T, TReturn, unknown>,
  limit: number
): AsyncGenerator<T, void, undefined> {
  let count = 0

  for await (const item of generator) {
    if (count >= limit) break
    yield item
    count++
  }
}
