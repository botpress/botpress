import { Client } from '@botpress/client'
import { Cognitive } from '@botpress/cognitive'
import { diffLines } from 'diff'
import fs from 'node:fs'
import path from 'node:path'
import { expect } from 'vitest'

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

type CacheEntry = { key: string; value: any; test: string; input: string }

const cache: Map<string, CacheEntry> = readJSONL(path.resolve(__dirname, './cache.jsonl'), 'key')
const cacheByTest: Map<string, CacheEntry> = readJSONL(path.resolve(__dirname, './cache.jsonl'), 'test')

class CachedClient extends Client {
  #client: Client
  #callsByTest: Record<string, number> = {}

  public constructor(options: ConstructorParameters<typeof Client>[0]) {
    super(options)
    this.#client = new Client(options)
  }

  public callAction = async (...args: Parameters<Client['callAction']>) => {
    const currentTestName = expect.getState().currentTestName ?? 'default'
    this.#callsByTest[currentTestName] ||= 0
    this.#callsByTest[currentTestName]++

    const testKey = `${currentTestName}-${this.#callsByTest[currentTestName]}`

    const key = fastHash(stringifyWithSortedKeys(args))
    const cached = cache.get(key)

    if (cached) {
      return cached.value
    }

    if (cacheByTest.has(testKey)) {
      console.log(`Cache miss for ${key} in test ${testKey}`)
      console.log(
        diffLines(
          JSON.stringify(JSON.parse(cacheByTest.get(testKey)?.input!), null, 2),
          JSON.stringify(JSON.parse(stringifyWithSortedKeys(args)), null, 2)
        )
      )
    }

    const response = await this.#client.callAction(...args)
    cache.set(key, { key, value: response, test: testKey, input: stringifyWithSortedKeys(args) })

    fs.appendFileSync(
      path.resolve(__dirname, './cache.jsonl'),
      JSON.stringify({
        test: testKey,
        key,
        input: stringifyWithSortedKeys(args),
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
