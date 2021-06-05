import { injectable } from 'inversify'
import { Dictionary } from 'lodash'

export enum AppLifecycleEvents {
  HTTP_SERVER_READY = 'HTTP_SERVER_READY',
  SERVICES_READY = 'SERVICES_READY',
  CONFIGURATION_LOADED = 'CONFIGURATION_LOADED',
  BOTPRESS_READY = 'BOTPRESS_READY',
  MODULES_READY = 'MODULES_READY',
  STUDIO_READY = 'STUDIO_READY'
}

interface CacheEntry {
  promise: Promise<void>
  resolve: Function
  reject: Function
}

@injectable()
export class AppLifecycle {
  private static _cache: Dictionary<CacheEntry> = {}

  static waitFor(event: AppLifecycleEvents): Promise<void> {
    return this.getOrCreate(event).promise
  }

  private static getOrCreate(event: AppLifecycleEvents): CacheEntry {
    if (!(event in AppLifecycle._cache)) {
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

  static setDone(event: AppLifecycleEvents) {
    this.getOrCreate(event).resolve()
  }

  static setError(event: AppLifecycleEvents, error: Error) {
    this.getOrCreate(event).reject(error)
  }
}
