import { injectable } from 'inversify'
import { Dictionary } from 'lodash'

export enum AppLifecycleEvents {
  HTTP_SERVER_READY = 'HTTP_SERVER_READY',
  SERVICES_READY = 'SERVICES_READY'
}

type CacheEntry = { promise: Promise<void>; resolve: Function; reject: Function }

@injectable()
export class AppLifecycle {
  private _cache: Dictionary<CacheEntry> = {}

  waitFor(event: AppLifecycleEvents): Promise<void> {
    return this.getOrCreate(event).promise
  }

  private getOrCreate(event: AppLifecycleEvents): CacheEntry {
    if (!(event in this._cache)) {
      let _res, _rej
      const p = new Promise<void>((resolve, reject) => {
        _res = resolve
        _rej = reject
      })

      this._cache[event] = {
        promise: p,
        reject: _rej,
        resolve: _res
      }
    }

    return this._cache[event]
  }

  setDone(event: AppLifecycleEvents) {
    this.getOrCreate(event).resolve()
  }

  setError(event: AppLifecycleEvents, error: Error) {
    this.getOrCreate(event).reject(error)
  }
}
