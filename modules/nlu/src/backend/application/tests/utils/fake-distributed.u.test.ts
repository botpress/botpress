import * as sdk from 'botpress/sdk'

import './sdk.u.test'

type IDistributed = typeof sdk.distributed

export class FakeDistributed implements IDistributed {
  public async acquireLock(resource: string, duration: number): Promise<sdk.RedisLock | undefined> {
    return {
      extend: async (ms: number) => {},
      unlock: async () => {}
    }
  }

  public async clearLock(resource: string): Promise<boolean> {
    return true
  }

  public async broadcast<T>(fn: Function): Promise<Function> {
    return fn
  }
}
