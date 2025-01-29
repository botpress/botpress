export type Callback<T> = (error: any | null, value: T) => void
export type Interceptor<T> = (error: any | null, value: T, next: Callback<T>, done: Callback<T>) => Promise<void> | void

export class InterceptorManager<T> {
  private _interceptors: Interceptor<T>[] = []

  public use(interceptor: Interceptor<T>) {
    this._interceptors.push(interceptor)
    return () => this.remove(interceptor)
  }

  public remove(interceptor: Interceptor<T>) {
    this._interceptors = this._interceptors.filter((i) => i !== interceptor)
  }

  public async run(value: T, signal: AbortSignal): Promise<T> {
    let error: any | null = null
    let result: T = value
    let done = false

    for (const interceptor of this._interceptors) {
      if (done) {
        break
      }

      if (signal.aborted) {
        throw signal.reason
      }

      await new Promise<void>((resolve) => {
        void interceptor(
          error,
          result,
          (err, val) => {
            error = err
            result = val
            resolve()
          },
          (err, val) => {
            error = err
            result = val
            done = true
            resolve()
          }
        )
      })
    }

    if (error) {
      throw error
    }

    return result
  }
}
