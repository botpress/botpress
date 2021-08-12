import _ from 'lodash'

interface Listener<Y> {
  name: string
  cb: (y: Y, err?: Error) => void
}

type Watcher<X extends any[], Y> = (...x: X) => Promise<Y>

interface KeyParser<X extends any[]> {
  makeKey(...x: X): string
  parseKey(key: string): X
}

export class PollingWatcherPool<X extends any[], Y> {
  private _listeners: _.Dictionary<[NodeJS.Timeout, Listener<Y>[]]> = {}

  constructor(private _watcher: Watcher<X, Y>, private _pollingInterval: number, private _keyParser: KeyParser<X>) {}

  public for(...x: X) {
    const addListener = (l: Listener<Y>) => {
      const key = this._keyParser.makeKey(...x)
      if (!this._listeners[key]) {
        const int = this._startWatching(key)
        this._listeners[key] = [int, []]
      }
      this._listeners[key][1].push(l)
    }

    const rmListener = (l: Listener<Y>) => {
      const key = this._keyParser.makeKey(...x)

      if (!this._listeners[key]) {
        throw new Error(`Key "${key}" not being watched`)
      }

      const idx = this._listeners[key][1].findIndex(li => li.name === l.name)
      if (idx < 0) {
        throw new Error(`Listener "${l.name}" not listening`)
      }

      this._listeners[key][1].splice(idx, 1)

      if (!this._listeners[key][1].length) {
        clearInterval(this._listeners[key][0])
        delete this._listeners[key]
      }
    }

    return {
      addListener,
      rmListener
    }
  }

  private _startWatching(key: string) {
    return setInterval(async () => {
      const x = this._keyParser.parseKey(key)
      const y = await this._watcher(...x)
      this._listeners[key][1].forEach(l => l.cb(y))
    }, this._pollingInterval)
  }
}
