import { EventEmitter } from 'events'
import { inject, injectable } from 'inversify'
import { Redis } from 'ioredis'

import { ObjectCache } from '../../common/object-cache'
import { IInitializeFromConfig } from '../../common/typings'
import { CacheInvalidators, MemoryObjectCache } from '../bpfs'
import { makeRedisKey, getOrCreate as redisFactory } from '../distributed'
import { TYPES } from '../types'

const REDIS_INVALIDATE_STARTING_WITH = makeRedisKey('object-cache/invalidate-starting-with')
const REDIS_INVALIDATE = makeRedisKey('object-cache/invalidate')
const REDIS_SYNC = makeRedisKey('redis/sync')

@injectable()
export class RedisObjectCache implements ObjectCache, IInitializeFromConfig {
  public readonly events: EventEmitter
  private _redisSub: Redis | undefined
  private _redisPub: Redis | undefined
  private _memCache: MemoryObjectCache

  constructor(@inject(TYPES.FileCacheInvalidator) private cacheInvalidator: CacheInvalidators.FileChangedInvalidator) {
    this.cacheInvalidator.install(this)
    this._memCache = new MemoryObjectCache(cacheInvalidator)
    // We want classes to register to the memCache emitter, not redis
    this.events = this._memCache.events
  }

  initializeFromConfig() {
    if (process.CLUSTER_ENABLED) {
      // We're using the in-memory object cache instead
      this._redisSub = redisFactory('subscriber')
      this._redisPub = redisFactory('commands')

      this._redisSub.subscribe(REDIS_INVALIDATE, REDIS_INVALIDATE_STARTING_WITH, REDIS_SYNC)
      this._redisSub.on('message', this._handleMessage)
    }
  }

  _handleMessage = async (channel: string, message: string) => {
    if (channel === REDIS_INVALIDATE_STARTING_WITH) {
      await this._memCache.invalidateStartingWith(message)
    } else if (channel === REDIS_INVALIDATE) {
      await this._memCache.invalidate(message)
    } else if (channel === REDIS_SYNC) {
      this.events.emit('syncDbFilesToDisk', message)
    }
  }

  async get<T>(key: string): Promise<T> {
    return this._memCache.get<T>(key)
  }

  async set<T>(key: string, obj: T): Promise<void> {
    return this._memCache.set(key, obj)
  }

  async has(key: string): Promise<boolean> {
    return this._memCache.has(key)
  }

  async invalidate(key: string): Promise<void> {
    if (this._redisPub) {
      await this._redisPub.publish(REDIS_INVALIDATE, key)
    } else {
      await this._memCache.invalidate(key)
    }
  }

  async invalidateStartingWith(prefix: string): Promise<void> {
    if (this._redisPub) {
      await this._redisPub.publish(REDIS_INVALIDATE_STARTING_WITH, prefix)
    } else {
      await this._memCache.invalidateStartingWith(prefix)
    }
  }

  async sync(message: string): Promise<void> {
    if (this._redisPub) {
      await this._redisPub.publish(REDIS_SYNC, message)
    } else {
      this.events.emit('syncDbFilesToDisk', message)
    }
  }
}
