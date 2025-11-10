import { Client } from '@botpress/client'
import { Cognitive, ModelProvider } from '@botpress/cognitive'
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
    try {
      const obj = JSON.parse(line) as T
      const key = String(obj[keyProperty])
      map.set(key, obj)
    } catch {}
  }

  return map
}

type CacheEntry = { key: string; value: any; test: string; input: string }

const cache: Map<string, CacheEntry> = readJSONL(path.resolve(__dirname, './data/cache.jsonl'), 'key')
const cacheByTest: Map<string, CacheEntry> = readJSONL(path.resolve(__dirname, './data/cache.jsonl'), 'test')

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

    if (process.env.CI && cacheByTest.has(testKey)) {
      console.info(`Cache miss for ${key} in test ${testKey}`)
      console.info(
        diffLines(
          JSON.stringify(JSON.parse(cacheByTest.get(testKey)?.input!), null, 2),
          JSON.stringify(JSON.parse(stringifyWithSortedKeys(args)), null, 2)
        )
      )
    }

    const response = await this.#client.callAction(...args)
    cache.set(key, { key, value: response, test: testKey, input: stringifyWithSortedKeys(args) })

    fs.appendFileSync(
      path.resolve(__dirname, './data/cache.jsonl'),
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

const cognitiveProvider: ModelProvider = {
  deleteModelPreferences: async () => {},
  saveModelPreferences: async () => {},
  fetchInstalledModels: async () => [
    {
      ref: 'openai:gpt-4o-2024-11-20',
      integration: 'openai',
      id: 'gpt-4o-2024-11-20',
      name: 'GPT-4o (November 2024)',
      description:
        "GPT-4o (“o” for “omni”) is OpenAI's most advanced model. It is multimodal (accepting text or image inputs and outputting text), and it has the same high intelligence as GPT-4 Turbo but is cheaper and more efficient.",
      input: {
        costPer1MTokens: 2.5,
        maxTokens: 128000,
      },
      output: {
        costPer1MTokens: 10,
        maxTokens: 16384,
      },
      tags: ['recommended', 'vision', 'general-purpose', 'coding', 'agents', 'function-calling'],
    },
  ],
  fetchModelPreferences: async () => ({
    best: ['openai:gpt-4o-2024-11-20'] as const,
    fast: ['openai:gpt-4o-2024-11-20'] as const,
    downtimes: [],
  }),
}

export const getCognitiveClient = () => {
  const cognitive = new Cognitive({
    client: new Client({
      apiUrl: process.env.CLOUD_API_ENDPOINT ?? 'https://api.botpress.dev',
      botId: process.env.CLOUD_BOT_ID,
      token: process.env.CLOUD_PAT,
    }),
    provider: cognitiveProvider,
  })
  return cognitive
}

export const getCachedCognitiveClient = () => {
  const cognitive = new Cognitive({
    client: new CachedClient({
      apiUrl: process.env.CLOUD_API_ENDPOINT ?? 'https://api.botpress.dev',
      botId: process.env.CLOUD_BOT_ID,
      token: process.env.CLOUD_PAT,
    }),
    provider: cognitiveProvider,
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
