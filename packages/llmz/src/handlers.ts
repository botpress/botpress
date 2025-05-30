type UnsubscribeFn = () => void
type EventHandler<T> = (event: T) => void
export type SubscribeFn<T> = (fn: EventHandler<T>) => UnsubscribeFn

class Emitter<T> {
  private _handlers: EventHandler<T>[] = []

  public subscribe: SubscribeFn<T> = (fn) => {
    this._handlers.push(fn)
    return () => {
      this._handlers = this._handlers.filter((handler) => handler !== fn)
    }
  }

  public emit(event: T) {
    this._handlers.forEach((handler) => handler(event))
  }
}

export class HookedArray<T> extends Array<T> {
  #listeners = new Emitter<T[]>()

  public constructor(...items: T[]) {
    super(...items)
    Object.setPrototypeOf(this, new.target.prototype)
  }

  public push(...items: T[]): number {
    try {
      this.#listeners.emit(items)
    } finally {
      return super.push(...items)
    }
  }

  public onPush(fn: EventHandler<T[]>): UnsubscribeFn {
    return this.#listeners.subscribe(fn)
  }
}
