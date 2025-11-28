type _PageLister<R> = (t: { nextToken?: string }) => Promise<{ items: R[]; meta: { nextToken?: string } }>

class AsyncCollection<T> implements AsyncIterableIterator<T> {
  private _nextToken?: string
  private _elementsBuffer: T[] = []
  private _isExhausted = false

  public constructor(private _list: _PageLister<T>) {}

  // Allows iterating with for-await-of loops:
  public [Symbol.asyncIterator](): AsyncIterableIterator<T> {
    return this
  }

  /**
   * Get the next element from the collection and advance the iterator.
   */
  public async next(): Promise<IteratorResult<T, undefined>> {
    if (this._bufferIsEmpty && !this._isExhausted) {
      await this._fetchNextPageIntoBuffer()
    }

    if (this._bufferIsEmpty) {
      return { done: true, value: undefined }
    }

    return { done: false, value: this._elementsBuffer.shift()! }
  }

  /**
   * Take the next n elements from the collection, advancing the iterator, and
   * return them as an array.
   */
  public async take(amount: number): Promise<T[]> {
    const arr: T[] = []
    for (let i = 0; i < amount; ++i) {
      const result = await this.next()
      if (result.done) {
        break
      }
      arr.push(result.value)
    }
    return arr
  }

  /**
   * Take the next n pages of elements from the collection, advancing the
   * iterator, and return the elements as an array.
   */
  public async takePage(amount: number): Promise<T[]> {
    for (let i = 0; i < amount; ++i) {
      if (!this._isExhausted) {
        await this._fetchNextPageIntoBuffer()
      }
    }

    const elements = [...this._elementsBuffer]
    this._elementsBuffer.length = 0

    return elements
  }

  /**
   * Take all remaining elements from in collection, moving the iterator to the
   * end, and return them as an array.
   */
  public async takeAll(): Promise<T[]> {
    return this.take(Number.POSITIVE_INFINITY)
  }

  /**
   * Returns true if there are no more elements to fetch in the collection.
   */
  public get isExhausted() {
    return this._isExhausted
  }

  private async _fetchNextPageIntoBuffer(): Promise<void> {
    const { items, meta } = await this._list({ nextToken: this._nextToken })

    this._elementsBuffer.push(...items)
    this._nextToken = meta.nextToken

    if (!meta.nextToken) {
      this._isExhausted = true
    }
  }

  private get _bufferIsEmpty(): boolean {
    return this._elementsBuffer.length === 0
  }
}

export type { AsyncCollection }
export const createAsyncCollection = <T>(listFn: _PageLister<T>) => new AsyncCollection<T>(listFn)
