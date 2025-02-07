import { Client } from '@botpress/client'

import fs from 'node:fs'
import path from 'node:path'
import { IClonable } from '../client'

function readJSONL<T>(filePath: string, keyProperty: keyof T): Map<string, T> {
  const lines = fs.readFileSync(filePath, 'utf-8').split(/\r?\n/).filter(Boolean)

  const map = new Map<string, T>()

  for (const line of lines) {
    const obj = JSON.parse(line) as T
    const key = String(obj[keyProperty])
    map.set(key, obj)
  }

  return map
}

const cache: Map<string, { key: string; value: any }> = readJSONL(
  path.resolve(import.meta.dirname, './cache.jsonl'),
  'key'
)

export const getCachedClient = (
  client: Client = new Client({
    apiUrl: process.env.CLOUD_API_ENDPOINT ?? 'https://api.botpress.dev',
    botId: process.env.CLOUD_BOT_ID,
    token: process.env.CLOUD_PAT
  })
) => {
  const proxy: IClonable<Client> = new Proxy(client, {
    get(target, prop) {
      if (prop === 'callAction') {
        return async (...args: Parameters<Client['callAction']>) => {
          const key = fastHash(JSON.stringify(args))
          const cached = cache.get(key)

          if (cached) {
            return cached.value
          }

          const response = await target.callAction(...args)
          cache.set(key, { key, value: response })

          fs.appendFileSync(
            path.resolve(import.meta.dirname, './cache.jsonl'),
            JSON.stringify({
              key,
              value: response
            }) + '\n'
          )

          return response
        }
      }
      return Reflect.get(target, prop)
    }
  }) as IClonable<Client>

  proxy.clone = () => getCachedClient(client)

  return proxy
}

function fastHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0 // Convert to 32bit integer
  }
  return (hash >>> 0).toString(16) // Convert to unsigned and then to hex
}
