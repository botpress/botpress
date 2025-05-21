import { Client } from '@botpress/client'
import { Cognitive } from '@botpress/cognitive'

import fs from 'node:fs'
import path from 'node:path'

function stringifyWithSortedKeys(obj: any, space?: number): string {
  function sortKeys(input: any): any {
    if (Array.isArray(input)) {
      return input.map(sortKeys)
    } else if (input && typeof input === 'object' && input.constructor === Object) {
      return Object.keys(input)
        .sort()
        .reduce(
          (acc, key) => {
            acc[key] = sortKeys(input[key])
            return acc
          },
          {} as Record<string, any>
        )
    } else {
      return input
    }
  }

  return JSON.stringify(sortKeys(obj), null, space)
}

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

const cache: Map<string, { key: string; value: any }> = readJSONL(path.resolve(__dirname, './cache.jsonl'), 'key')

class CachedClient extends Client {
  #client: Client

  public constructor(options: ConstructorParameters<typeof Client>[0]) {
    super(options)
    this.#client = new Client(options)
  }

  public callAction = async (...args: Parameters<Client['callAction']>) => {
    const key = fastHash(stringifyWithSortedKeys(args))
    const cached = cache.get(key)

    if (cached) {
      return cached.value
    }

    console.log('Cache miss', key, args, cache.size, cache.keys().toArray())

    const response = await this.#client.callAction(...args)
    cache.set(key, { key, value: response })

    fs.appendFileSync(
      path.resolve(__dirname, './cache.jsonl'),
      JSON.stringify({
        key,
        value: response,
      }) + '\n'
    )

    return response
  }

  public clone() {
    return this
  }
}

export const getCachedCognitiveClient = () => {
  const cognitive = new Cognitive({
    client: new CachedClient({
      apiUrl: process.env.CLOUD_API_ENDPOINT ?? 'https://api.botpress.dev',
      botId: process.env.CLOUD_BOT_ID,
      token: process.env.CLOUD_PAT,
    }),
    provider: {
      deleteModelPreferences: async () => {},
      saveModelPreferences: async () => {},
      fetchInstalledModels: async () => [],
      fetchModelPreferences: async () => ({
        best: ['openai:gpt-4o-2024-11-20'] as const,
        fast: ['openai:gpt-4o-2024-11-20'] as const,
        downtimes: [],
      }),
    },
  })
  return cognitive
}

function fastHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0 // Convert to 32bit integer
  }
  return (hash >>> 0).toString(16) // Convert to unsigned and then to hex
}
