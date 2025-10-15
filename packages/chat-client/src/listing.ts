export type PageLister<R> = (t: { nextToken?: string }) => Promise<{ items: R[]; meta: { nextToken?: string } }>
export class AsyncCollection<T> {
  public constructor(private _list: PageLister<T>) {}

  public async *[Symbol.asyncIterator]() {
    let nextToken: string | undefined
    do {
      const { items, meta } = await this._list({ nextToken })
      nextToken = meta.nextToken
      for (const item of items) {
        yield item
      }
    } while (nextToken)
  }

  public async collect(props: { limit?: number } = {}) {
    const limit = props.limit ?? Number.POSITIVE_INFINITY
    const arr: T[] = []
    let count = 0
    for await (const item of this) {
      arr.push(item)
      count++
      if (count >= limit) {
        break
      }
    }
    return arr
  }
}
