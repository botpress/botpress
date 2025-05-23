type UnsubscribeFn = () => void
type EventHandler<T> = (event: T) => void
export type SubscribeFn<T> = (fn: EventHandler<T>) => UnsubscribeFn

class Emitter<T> {
  private handlers: EventHandler<T>[] = []

  public subscribe: SubscribeFn<T> = (fn) => {
    this.handlers.push(fn)
    return () => {
      this.handlers = this.handlers.filter((handler) => handler !== fn)
    }
  }

  public emit(event: T) {
    this.handlers.forEach((handler) => handler(event))
  }
}

export class HookedArray<T> extends Array<T> {
  #listeners = new Emitter<T[]>()

  constructor(...items: T[]) {
    super(...items)
    Object.setPrototypeOf(this, new.target.prototype)
  }

  push(...items: T[]): number {
    try {
      this.#listeners.emit(items)
    } finally {
      return super.push(...items)
    }
  }

  onPush(fn: EventHandler<T[]>): UnsubscribeFn {
    return this.#listeners.subscribe(fn)
  }
}
