import { Logger, RedisLock } from 'botpress/runtime-sdk'
import { inject, injectable } from 'inversify'
import { Redis } from 'ioredis'
import _ from 'lodash'
import { nanoid } from 'nanoid'
import Redlock from 'redlock'

import { IInitializeFromConfig } from '../../common/typings'
import { JobService } from '../distributed'
import { AppLifecycle, AppLifecycleEvents } from '../lifecycle'
import { TYPES } from '../types'

import { getOrCreate as redisFactory, makeRedisKey } from './async-redis'

const JobStartChannel = makeRedisKey('job_start')
const JobDoneChannel = makeRedisKey('job_done')

interface JobMessage {
  clientId: string
  jobId: string
  jobName: string
  args?: any[]
}

interface Job {
  jobId: string
  clientsDoneIds: string[]
  totalSubscribers: number
  endJob: () => void
}

const debug = DEBUG('services:jobs')
const getLockName = (resource: string) => makeRedisKey(`lock_${resource}`)

@injectable()
export class RedisJobService implements JobService, IInitializeFromConfig {
  private _redisSub!: Redis
  private _redisPub!: Redis
  private _redisAvailable: Promise<void> = new Promise(resolve => (this._setRedisAvailable = resolve))
  private _redisClientId!: string
  private _setRedisAvailable!: Function
  private _jobsList: Job[] = []
  private _redlock!: Redlock

  constructor(@inject(TYPES.Logger) private logger: Logger) {}

  async acquireLock(resource: string, duration: number): Promise<RedisLock | undefined> {
    const lock = this._redlock.lock(getLockName(resource), duration).catch(() => undefined) as unknown
    return lock as RedisLock // Custom typings for the SDK
  }

  async clearLock(resource: string): Promise<boolean> {
    return !!(await this._redisPub.del(getLockName(resource)))
  }

  getRedisClient(): Redis {
    return this._redisPub
  }

  initializeFromConfig() {
    if (!process.CLUSTER_ENABLED) {
      return
    }

    this._redisClientId = nanoid()
    this.logger.debug('ClientId:', this._redisClientId)

    this._redisSub = redisFactory('subscriber', process.env.REDIS_URL!)
    this._redisPub = redisFactory('commands', process.env.REDIS_URL!)

    // Each new broadcasted job require an additional listener
    this._redisSub.setMaxListeners(15)

    this._redisSub.on('message', this._onMessageReceived.bind(this))

    this._redisSub.subscribe(JobStartChannel, JobDoneChannel)
    this._setRedisAvailable()
  }

  async broadcast<T>(fn: Function): Promise<Function> {
    await this._redisAvailable
    const that = this
    const jobName = fn.name.split(' _')[1] || fn.name

    let result: T

    that.onMessage(that._redisSub, JobStartChannel, async message => {
      if (message.jobName !== jobName) {
        return
      }

      result = await fn.apply(undefined, message.args)

      debug(`Client "${that._redisClientId}" start job "${jobName}"`)

      const jobDoneMessage = {
        clientId: that._redisClientId,
        jobName,
        jobId: message.jobId
      }
      await that._redisPub.publish(JobDoneChannel, JSON.stringify(jobDoneMessage))
    })

    return async function(): Promise<T> {
      /**
       * Events should not be broadcasted when the bot is starting up. Otherwise, every running server reload all bots.
       * It also cause issues when a server is not entirely up / if it gets spammed by multiple servers booting at the same time.
       */
      if (!AppLifecycle.waitFor(AppLifecycleEvents.BOTPRESS_READY).isResolved()) {
        return fn.apply(undefined, arguments)
      }

      const jobId = nanoid()
      const startJobMessage = {
        clientId: that._redisClientId,
        jobId,
        jobName,
        args: _.toArray(arguments)
      }

      await that.waitUntillAllNodesAreDone(jobId, () =>
        that._redisPub.publish(JobStartChannel, JSON.stringify(startJobMessage))
      )
      that._clearJob(jobId)

      return result
    }
  }

  private _clearJob(jobId: string) {
    const index = this._jobsList.findIndex(j => j.jobId === jobId)
    if (index > -1) {
      this._jobsList.splice(index, 1)
    }
  }

  private async _onMessageReceived(channel: string, rawMessage: string) {
    if (channel !== JobDoneChannel) {
      return
    }

    const message = JSON.parse(rawMessage)
    const job = this._jobsList.find(x => x.jobId === message.jobId)
    if (!job) {
      return
    }

    if (!job.clientsDoneIds.includes(message.clientId)) {
      debug(`Client "${message.clientId}" done job "${message.jobName}"`)
      job.clientsDoneIds.push(message.clientId)

      if (job.clientsDoneIds.length === job.totalSubscribers) {
        job.endJob()
        debug(`All "${message.jobName}" jobs complete.`)
      }
    }
  }

  private async waitUntillAllNodesAreDone(jobId: string, publishFn): Promise<any> {
    const totalSubscribers = await this.getNumberOfSubscribers()

    const timeoutPromise = new Promise(reject => {
      setTimeout(() => reject(), 1500)
    })

    const jobPromise = new Promise(resolve =>
      this._jobsList.push({ jobId, clientsDoneIds: [], totalSubscribers, endJob: resolve })
    )

    // Need to publish after we listen for the message
    publishFn.call()

    return Promise.race([timeoutPromise, jobPromise])
  }

  private onMessage(client: Redis, jobChannel: string, cb: (arg: JobMessage) => Promise<void>) {
    client.on('message', async (channel: string, message: string) => {
      if (channel === jobChannel) {
        await cb(JSON.parse(message))
      }
    })
  }

  getNumberOfSubscribers(): Promise<number> {
    return new Promise((resolve, reject) => {
      // @ts-ignore typing missing for that method
      this._redisPub.pubsub(['NUMSUB', JobDoneChannel], (err: Error, reply: number[]) => {
        if (err) {
          reject(err)
        }
        resolve(reply[1])
      })
    })
  }
}
