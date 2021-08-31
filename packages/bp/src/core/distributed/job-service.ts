import { RedisLock } from 'botpress/sdk'
import { injectable } from 'inversify'
import { Redis } from 'ioredis'
import moment from 'moment'

export interface JobService {
  /**
   * * In Botpress Pro, this allows to broadcast a job to execute to all distributed nodes.
   * It returns a function that returns a promise.
   * The promise will succeed if all nodes have run the job and will fail otherwise.
   *
   * * In Botpress CE, the function will be returned directly.
   * @param fn The function or "job" to execute
   * @param T The return type of the returned function
   */
  broadcast<T>(fn: Function): Promise<Function>

  acquireLock(resource: string, duration: number): Promise<RedisLock | undefined>

  clearLock(resource: string): Promise<boolean>

  getRedisClient(): Redis | undefined

  getNumberOfSubscribers(): Promise<number>
}

@injectable()
export class CEJobService implements JobService {
  private locks: { [key: string]: Date } = {}

  async broadcast<T>(fn: Function): Promise<Function> {
    return fn
  }

  async acquireLock(resource: string, duration: number): Promise<RedisLock | undefined> {
    if (this.locks[resource]) {
      if (this.locks[resource] <= new Date()) {
        delete this.locks[resource]
      } else {
        return
      }
    }

    this.locks[resource] = moment()
      .add(duration)
      .toDate()

    return {
      unlock: async () => {
        delete this.locks[resource]
      },
      extend: async (duration: number) => {
        this.locks[resource] = moment(this.locks[resource])
          .add(duration)
          .toDate()
      }
    }
  }

  async clearLock(resource: string): Promise<boolean> {
    delete this.locks[resource]
    return true
  }

  getRedisClient(): undefined {
    return
  }

  async getNumberOfSubscribers(): Promise<number> {
    return 1
  }
}
