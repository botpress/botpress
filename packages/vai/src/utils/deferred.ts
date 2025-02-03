export class Deferred<T> {
  public promise: Promise<T>
  private _resolve!: (value: T | PromiseLike<T>) => void
  private _reject!: (reason?: unknown) => void

  public constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this._resolve = resolve
      this._reject = reject
    })
  }

  public resolve(value: T | PromiseLike<T>): void {
    this._resolve(value)
  }

  public reject(reason?: unknown): void {
    this._reject(reason)
  }
}
