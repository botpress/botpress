/**
 * Wraps an async iterable so it can be iterated multiple times: chunks pulled
 * from the source are cached, and every iteration replays the cache before
 * pulling new chunks. Concurrent iterations are safe — pulls on the underlying
 * source are serialized.
 */
export class ReplayableAsyncIterable<T> implements AsyncIterable<T> {
  private _source: AsyncIterator<T>
  private _chunks: T[] = []
  private _done = false
  private _lock: Promise<unknown> = Promise.resolve()

  public constructor(source: AsyncIterable<T>) {
    this._source = source[Symbol.asyncIterator]()
  }

  /** True once the underlying source has been fully consumed. */
  public get done(): boolean {
    return this._done
  }

  /** The chunks pulled from the source so far. */
  public get chunks(): T[] {
    return [...this._chunks]
  }

  public async *[Symbol.asyncIterator](): AsyncIterator<T> {
    let index = 0
    while (true) {
      if (index < this._chunks.length) {
        yield this._chunks[index++]!
      } else if (this._done) {
        return
      } else {
        await this._pull()
      }
    }
  }

  /** Consumes the entire source and returns all chunks. */
  public async collect(): Promise<T[]> {
    for await (const _ of this) {
      // draining populates the cache
    }
    return this.chunks
  }

  private _pull(): Promise<void> {
    const next = this._lock.then(async () => {
      if (this._done) {
        return
      }
      const { value, done } = await this._source.next()
      if (done) {
        this._done = true
      } else {
        this._chunks.push(value)
      }
    })
    this._lock = next.catch(() => {})
    return next
  }
}

/** Drains a string iterable into a single string. */
export const collectText = async (iterable: AsyncIterable<string>): Promise<string> => {
  let text = ''
  for await (const chunk of iterable) {
    text += chunk
  }
  return text
}
