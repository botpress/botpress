import * as NLU from './sdk.u.test'

export type SemaphoreResolver = () => void

export interface SemaphoreQueueEntry {
  resolve: (nextCycle: [number, SemaphoreResolver]) => void
  reject: (err: Error) => void
}
export class Semaphore {
  private _value: number
  private _queue: SemaphoreQueueEntry[] = []
  private _resolver: SemaphoreResolver | undefined

  constructor(private _n: number) {
    if (_n <= 0) {
      throw new Error('Semaphore must be initialized with a positive value')
    }
    this._value = _n
  }

  get locked() {
    return this._value <= 0
  }

  async exclusively(cb: (val: number) => Promise<any>) {
    const [value, unlock] = await this._lock()
    try {
      return cb(value)
    } finally {
      unlock()
    }
  }

  private _lock(): Promise<[number, SemaphoreResolver]> {
    const lockPromise = new Promise<[number, SemaphoreResolver]>((resolve, reject) => {
      this._queue.push({ resolve, reject })
    })

    if (!this.locked) this._cycle()
    return lockPromise
  }

  private _cycle() {
    const promise = this._queue.shift()

    if (!promise) {
      return
    }

    let unlocked = false

    this._resolver = () => {
      if (unlocked) {
        return
      }
      unlocked = true
      this._value++
      this._cycle()
    }
    promise.resolve([this._value--, this._resolver])
  }
}

export const areEqual = (id1: string, id2: string): boolean => {
  return id1 === id2
}

export const sleep = async (ms: number) => {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}
