import * as sdk from 'botpress/sdk'

import './sdk.u.test'

type IDistributed = typeof sdk.distributed

export class FakeDistributed implements IDistributed {
  private _mutexes: _.Dictionary<boolean> = {}
  private _functions: _.Dictionary<Function[]> = {}

  public async acquireLock(resource: string, duration: number): Promise<sdk.RedisLock | undefined> {
    if (this._mutexes[resource]) {
      return
    }

    this._mutexes[resource] = true
    return {
      extend: async (ms: number) => {},
      unlock: async () => {
        this._mutexes[resource] = false
      }
    }
  }

  public async clearLock(resource: string): Promise<boolean> {
    this._mutexes[resource] = false
    return true
  }

  public async broadcast<T>(fn: Function): Promise<Function> {
    if (!this._functions[fn.name]) {
      this._functions[fn.name] = []
    }

    this._functions[fn.name].push(fn)

    return (...args: any[]) => {
      return Promise.map(this._functions[fn.name], f => f(...args))
    }
  }
}
