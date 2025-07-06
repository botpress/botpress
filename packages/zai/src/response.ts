import { Usage, ZaiContext } from './context'
import { EventEmitter } from './emitter'

// Event types for the Response class
export type ResponseEvents<TComplete = any> = {
  progress: Usage
  complete: TComplete
  error: unknown
}

export class Response<T = any, S = T> implements PromiseLike<S> {
  private _promise: Promise<T>
  private _eventEmitter: EventEmitter<ResponseEvents<T>>
  private _context: ZaiContext
  private _elasped: number | null = null
  private _simplify: (value: T) => S

  public constructor(context: ZaiContext, promise: Promise<T>, simplify: (value: T) => S) {
    this._context = context
    this._eventEmitter = new EventEmitter<ResponseEvents<T>>()
    this._simplify = simplify
    this._promise = promise.then(
      (value) => {
        this._elasped ||= this._context.elapsedTime
        this._eventEmitter.emit('complete', value)
        this._eventEmitter.clear()
        this._context.clear()
        return value
      },
      (reason) => {
        this._elasped ||= this._context.elapsedTime
        this._eventEmitter.emit('error', reason)
        this._eventEmitter.clear()
        this._context.clear()
        throw reason
      }
    )

    this._context.on('update', (usage) => {
      this._eventEmitter.emit('progress', usage)
    })
  }

  // Event emitter methods
  public on<K extends keyof ResponseEvents<T>>(type: K, listener: (event: ResponseEvents<T>[K]) => void) {
    this._eventEmitter.on(type, listener)
    return this
  }

  public off<K extends keyof ResponseEvents<T>>(type: K, listener: (event: ResponseEvents<T>[K]) => void) {
    this._eventEmitter.off(type, listener)
    return this
  }

  public once<K extends keyof ResponseEvents<T>>(type: K, listener: (event: ResponseEvents<T>[K]) => void) {
    this._eventEmitter.once(type, listener)
    return this
  }

  public abort(reason?: string | Error) {
    this._context.controller.abort(reason)
    this._eventEmitter.emit('error', reason)
    this._eventEmitter.clear()
    this._context.clear()
  }

  public then<TResult1 = S, TResult2 = never>(
    onfulfilled?: ((value: S) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this._promise.then(
      (value: T) => {
        const simplified = this._simplify(value)
        return onfulfilled ? onfulfilled(simplified) : simplified
      },
      (reason) => {
        if (onrejected) {
          return onrejected(reason)
        }
        throw reason
      }
    ) as PromiseLike<TResult1 | TResult2>
  }

  public async result(): Promise<{
    output: T
    usage: Usage
    elapsed: number
  }> {
    const output = await this._promise
    const usage = this._context.usage
    return { output, usage, elapsed: this._elasped }
  }
}
