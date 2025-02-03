export class Deferred<T> {
  promise: Promise<T>
  private _resolve!: (value: T | PromiseLike<T>) => void
  private _reject!: (reason?: unknown) => void

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this._resolve = resolve
      this._reject = reject
    })
  }

  resolve(value: T | PromiseLike<T>): void {
    this._resolve(value)
  }

  reject(reason?: unknown): void {
    this._reject(reason)
  }
}
