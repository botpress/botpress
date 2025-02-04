import { Client } from '@botpress/client'
import { type TextTokenizer, getWasmTokenizer } from '@bpinternal/thicktoken'
import fs from 'node:fs'
import path from 'node:path'
import { beforeAll } from 'vitest'
import { Zai } from '../src'
import { fastHash } from '../src/utils'

const DATA_PATH = path.join(__dirname, 'data')
const CACHE_PATH = path.join(DATA_PATH, 'cache.jsonl')
const DOC_PATH = path.join(DATA_PATH, 'botpress_docs.txt')

export const getClient = () => {
  return new Client({
    apiUrl: process.env.CLOUD_API_ENDPOINT ?? 'https://api.botpress.dev',
    botId: process.env.CLOUD_BOT_ID,
    token: process.env.CLOUD_PAT,
  })
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

const cache: Map<string, { key: string; value: any }> = readJSONL(CACHE_PATH, 'key')

export const getCachedClient = () => {
  const client = getClient()

  const proxy = new Proxy(client, {
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
            CACHE_PATH,
            JSON.stringify({
              key,
              value: response,
            }) + '\n'
          )

          return response
        }
      }
      return Reflect.get(target, prop)
    },
  })

  return proxy
}

export const getZai = () => {
  const client = getCachedClient()
  return new Zai({ client, retry: { maxRetries: 0 } })
}

export let tokenizer: TextTokenizer = null!

beforeAll(async () => {
  tokenizer = (await getWasmTokenizer()) as TextTokenizer
})

export const BotpressDocumentation = fs.readFileSync(DOC_PATH, 'utf-8').trim()

export const metadata = { cost: { input: 1, output: 1 }, latency: 0, model: '', tokens: { input: 1, output: 1 } }
