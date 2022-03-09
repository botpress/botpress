import { printRow } from 'diag/utils'
import RedisIo, { Cluster, ClusterNode, ClusterOptions, Redis, RedisOptions } from 'ioredis'
import _ from 'lodash'

interface ClientEntry {
  raw: string
  parsed: RedisClient
}

interface RedisClient {
  name: string
  addr: string
  id: string
  cmd: string
  age: number
}

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

    const RETRY_STRATEGY = (times: number) => {
      if (times > 10) {
        throw new Error('Unable to connect to the Redis cluster after multiple attempts.')
      }
      return Math.min(times * 200, 5000)
    }

    let redisNodes: ClusterNode[] = []
    try {
      redisNodes = process.env.REDIS_URL ? JSON.parse(process.env.REDIS_URL) : []
    } catch {}

    let options = {}
    try {
      options = process.env.REDIS_OPTIONS ? JSON.parse(process.env.REDIS_OPTIONS) : {}
    } catch {}

    const redisOptions: RedisOptions = {
      retryStrategy: RETRY_STRATEGY
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

const parseLine = (client: string): ClientEntry => {
  return {
    raw: client,
    parsed: client.split(' ').reduce((acc, curr) => {
      const [param, value] = curr.split('=')
      acc[param] = value
      return acc
    }, {}) as RedisClient
  }
}

export const getClientsList = async (redis: Redis): Promise<ClientEntry[]> => {
  let clients
  try {
    clients = await redis.client('list')

    // We don't want to get clients which issues commands
    const subscribers = clients
      .split('\n')
      .map(parseLine)
      .filter(x => x.parsed.name && x.parsed.cmd === 'subscribe')

    return _.uniqBy(subscribers, x => x.parsed.name)
  } catch (err) {
    printRow('Error parsing redis clients', err)
    printRow('Clients returned:', clients)
  }

  return []
}
