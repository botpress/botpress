import ms from 'ms'

export type TimedPerfCallback = (this: TimedPerfCounter, metric: number, time: number) => void

const RETENTION = ms('5m')

export class TimedPerfCounter {
  private readonly _store: { [key: number]: number } = {}
  private _lastRecordKey: number = Number.MAX_VALUE
  private _subscribers: TimedPerfCallback[] = []

  constructor(public readonly name: string) {
    setInterval(this.flush.bind(this), ms('30s'))
  }

  record() {
    const key = ~~(Date.now() / 1000)
    this._store[key] = (this._store[key] || 0) + 1
    if (this._lastRecordKey < key) {
      this._subscribers.forEach(cb => cb && cb.call(this, this._store[this._lastRecordKey], this._lastRecordKey))
    }
    this._lastRecordKey = key
  }

  flush() {
    const cutoff = ~~(Date.now() / 1000) - RETENTION / 1000

    Object.keys(this._store)
      .map(parseInt)
      .filter(n => !isNaN(n) || n <= cutoff)
      .forEach(n => delete this._store[n])
  }

  subscribe(cb: TimedPerfCallback) {
    if (typeof cb === 'function') {
      this._subscribers.push(cb)
    }
  }
}
