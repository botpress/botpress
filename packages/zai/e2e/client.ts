import { Client } from '@botpress/client'
import { Cognitive } from '@botpress/cognitive'
import { diffLines } from 'diff'
import fs from 'node:fs'
import path from 'node:path'
import { beforeEach, expect } from 'vitest'

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
      const value = obj[keyProperty]
      if (value === undefined || value === null) {
        continue
      }
      const key = String(value)
      map.set(key, obj)
    } catch {}
  }

  return map
}

type CacheEntry = { key: string; value: any; error?: string; test?: string; input: string }

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

    if (process.env.CI) {
      const previous = cacheByTest.get(testKey)
      if (previous) {
        console.info(`Cache miss for ${key} in test ${testKey}`)
        console.info(
          diffLines(
            JSON.stringify(JSON.parse(previous.input), null, 2),
            JSON.stringify(JSON.parse(stringifyWithSortedKeys(args)), null, 2)
          )
        )
      }

      throw new Error(
        `Missing cached Botpress action response for ${key} in ${testKey}. Run pnpm test:e2e:update to refresh packages/zai/e2e/data/cache.jsonl.`
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

  // Tables calls are recorded and replayed too, so tests never depend on the live Tables API.
  // Table state changes during a test, so a call is keyed by test name, method, arguments and how many times that
  // exact call was made in the test (counts reset before each test, so vitest retries replay the same sequence).
  #replayTable = async (method: TableMethod, args: unknown[]) => {
    const currentTestName = expect.getState().currentTestName
    if (!currentTestName) {
      // Suite-level cleanup (afterAll): nothing to assert on, and in CI there is no live table to clean
      return process.env.CI ? {} : (this.#client[method] as any)(...args).catch(() => ({}))
    }
    const input = stringifyWithSortedKeys({ method, args })
    const occurrence = (tableCallsByTest[`${currentTestName}|${input}`] =
      (tableCallsByTest[`${currentTestName}|${input}`] ?? 0) + 1)
    const testKey = `table:${currentTestName}-${method}-${occurrence}`
    const key = `table:${fastHash(`${currentTestName}|${occurrence}|${input}`)}`
    const cached = cache.get(key)
    if (cached) {
      if (cached.error !== undefined) throw new Error(cached.error)
      return cached.value
    }
    if (process.env.CI) {
      throw new Error(
        `Missing cached Tables response for ${key} in ${testKey}. Run pnpm test:e2e:update to refresh packages/zai/e2e/data/cache.jsonl.`
      )
    }
    let value: any
    let error: string | undefined
    try {
      value = await (this.#client[method] as any)(...args)
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : String(err)
    }
    const entry: CacheEntry = { key, value, error, test: testKey, input }
    cache.set(key, entry)
    fs.appendFileSync(path.resolve(__dirname, './data/cache.jsonl'), JSON.stringify(entry) + '\n')
    if (error !== undefined) throw new Error(error)
    return value
  }

  public getOrCreateTable = ((...args) => this.#replayTable('getOrCreateTable', args)) as Client['getOrCreateTable']
  public findTableRows = ((...args) => this.#replayTable('findTableRows', args)) as Client['findTableRows']
  public upsertTableRows = ((...args) => this.#replayTable('upsertTableRows', args)) as Client['upsertTableRows']
  public deleteTableRows = ((...args) => this.#replayTable('deleteTableRows', args)) as Client['deleteTableRows']
  public deleteTable = ((...args) => this.#replayTable('deleteTable', args)) as Client['deleteTable']

  public clone() {
    return this
  }
}

type TableMethod = 'getOrCreateTable' | 'findTableRows' | 'upsertTableRows' | 'deleteTableRows' | 'deleteTable'
let tableCallsByTest: Record<string, number> = {}
beforeEach(() => {
  tableCallsByTest = {}
})

/** A Botpress client whose LLM and Tables calls are served from e2e/data/cache.jsonl (recorded on a miss outside CI) */
export const getCachedBotpressClient = () =>
  new CachedClient({
    apiUrl: process.env.CLOUD_API_ENDPOINT ?? 'https://api.botpress.dev',
    botId: process.env.CLOUD_BOT_ID,
    token: process.env.CLOUD_PAT,
  })

export const getCognitiveClient = () => {
  const cognitive = new Cognitive({
    client: new Client({
      apiUrl: process.env.CLOUD_API_ENDPOINT ?? 'https://api.botpress.dev',
      botId: process.env.CLOUD_BOT_ID,
      token: process.env.CLOUD_PAT,
    }),
  })
  return cognitive
}

export const getCachedCognitiveClient = () => {
  const cognitive = new Cognitive({
    client: new CachedClient({
      // Using mock server (MSW) - actual URL doesn't matter as requests are intercepted
      apiUrl: process.env.CLOUD_API_ENDPOINT ?? 'https://api.botpress.dev',
      botId: process.env.CLOUD_BOT_ID,
      token: process.env.CLOUD_PAT,
    }),
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
