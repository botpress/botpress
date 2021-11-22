import RedisIo, { Cluster, ClusterNode, ClusterOptions, Redis, RedisOptions } from 'ioredis'
import _ from 'lodash'

const _clients: { [key: string]: Redis } = {}

export const getOrCreate = (type: 'subscriber' | 'commands' | 'socket', url?: string): Redis => {
  if (_clients[type]) {
    return _clients[type]
  }

  const originalPromise = global.Promise
  try {
    // we swap back to native promises for ioredis
    // reason: https://github.com/luin/ioredis/blob/1d06cf4bd968fd9762b87d7cd3d756c396158ce0/lib/connectors/StandaloneConnector.ts#L54
    // TODO: remove this workaround when ioredis supports other promises or if we get rid of bluebird-global
    global.Promise = global['NativePromise'] || global.Promise

    const RETRY_STRATEGY = times => {
      if (times > 10) {
        throw new Error('Unable to connect to the Redis cluster after multiple attempts.')
      }
      return Math.min(times * 200, 5000)
    }

    const { REDIS_URL, REDIS_OPTIONS, BP_REDIS_SCOPE, SERVER_ID } = process.env

    let redisNodes: ClusterNode[] = []
    try {
      redisNodes = REDIS_URL ? JSON.parse(REDIS_URL) : []
    } catch {}

    let options = {}
    try {
      options = REDIS_OPTIONS ? JSON.parse(REDIS_OPTIONS) : {}
    } catch {}

    const redisOptions: RedisOptions = {
      retryStrategy: RETRY_STRATEGY,
      connectionName: `${BP_REDIS_SCOPE ? `${BP_REDIS_SCOPE}/` : ''}studio/${SERVER_ID}`
    }

    if (redisNodes.length > 0) {
      const clusterOptions: ClusterOptions = {
        clusterRetryStrategy: RETRY_STRATEGY,
        redisOptions
      }

      _clients[type] = new Cluster(redisNodes, _.merge(clusterOptions, options)) as RedisIo.Cluster & RedisIo.Redis
    } else {
      _clients[type] = new RedisIo(url || process.env.REDIS_URL, _.merge(redisOptions, options))
    }
  } finally {
    global.Promise = originalPromise
  }

  return _clients[type]
}

export const makeRedisKey = (key: string): string => {
  return process.env.BP_REDIS_SCOPE ? `${process.env.BP_REDIS_SCOPE}/${key}` : key
}
