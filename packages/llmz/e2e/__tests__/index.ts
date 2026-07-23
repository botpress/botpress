import { Client } from '@botpress/client'
import { Cognitive, type CognitiveRequest, type CognitiveStreamChunk } from '@botpress/cognitive'
import fs from 'node:fs'
import path from 'node:path'
import { expect } from 'vitest'

/**
 * The models used by the e2e suites, as a fallback chain. Every request that
 * does not pin an explicit model is rewritten to this list.
 */
export const TEST_MODELS = [
  'cerebras:gemma-4-31b',
  'cerebras:gpt-oss-120b',
  'anthropic:claude-haiku-4-5-20251001',
  'google-ai:gemini-3.5-flash',
] as const

export async function getCorgiUrl() {
  const client = new Client({
    apiUrl: process.env.CLOUD_API_ENDPOINT ?? 'https://api.botpress.cloud',
    botId: process.env.CLOUD_BOT_ID,
    token: process.env.CLOUD_PAT,
  })

  const { file } = await client.uploadFile({
    key: 'tests/corgi.png',
    content: fs.readFileSync(path.resolve(__dirname, './corgi.png')),
    publicContentImmediatelyAccessible: true,
    accessPolicies: ['public_content'],
  })

  return file.url
}

/**
 * A short spoken voice message (macOS TTS), base64-encoded as a data URI.
 * The speaker says: "Hey! Please say the word pineapple, and also tell me
 * what the capital of France is."
 */
export function getVoiceMessageDataUri() {
  const audio = fs.readFileSync(path.resolve(__dirname, './voice-message.wav'))
  return `data:audio/wav;base64,${audio.toString('base64')}`
}

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
  if (!fs.existsSync(filePath)) {
    return new Map()
  }

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

type CacheEntry = {
  key: string
  test: string
  input: string
  /** Present for non-streaming generateText calls */
  value?: any
  /** Present for streaming generateTextStream calls */
  chunks?: CognitiveStreamChunk[]
}

const CACHE_PATH = path.resolve(__dirname, './cache.jsonl')

const cache: Map<string, CacheEntry> = readJSONL(CACHE_PATH, 'key')

function fastHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0 // Convert to 32bit integer
  }
  return (hash >>> 0).toString(16) // Convert to unsigned and then to hex
}

/** Rewrites unpinned/auto model selection to the deterministic test model chain. */
const pinModels = <T extends CognitiveRequest>(input: T): T => {
  const model = input.model
  if (!model || model === 'best' || model === 'fast' || model === 'auto') {
    return { ...input, model: [...TEST_MODELS] as CognitiveRequest['model'] }
  }
  return input
}

/** Strips non-deterministic / non-serializable fields before hashing. */
const cacheKeyOf = (kind: 'text' | 'stream', input: CognitiveRequest): string => {
  const { signal: _signal, ...rest } = input as CognitiveRequest & { signal?: unknown }
  return fastHash(stringifyWithSortedKeys({ kind, input: rest }))
}

/**
 * A Cognitive client that replays LLM responses from a JSONL cache.
 * Both the streaming and non-streaming surfaces are cached; streamed responses
 * are replayed chunk by chunk, exactly as they were received.
 */
class CachedCognitive extends Cognitive {
  private _callsByTest: Record<string, number> = {}

  private _testKey(): string {
    const currentTestName = expect.getState().currentTestName ?? 'default'
    this._callsByTest[currentTestName] ||= 0
    this._callsByTest[currentTestName]++
    return `${currentTestName}-${this._callsByTest[currentTestName]}`
  }

  private _persist(entry: CacheEntry): void {
    cache.set(entry.key, entry)
    fs.appendFileSync(CACHE_PATH, JSON.stringify(entry) + '\n')
  }

  public override async generateText(
    input: CognitiveRequest,
    options?: Parameters<Cognitive['generateText']>[1]
  ): Promise<any> {
    const pinned = pinModels(input)
    const key = cacheKeyOf('text', pinned)
    const testKey = this._testKey()

    const cached = cache.get(key)
    if (cached?.value) {
      return cached.value
    }

    if (process.env.CI) {
      console.info(`LLM cache miss (generateText) for ${key} in test ${testKey}`)
    }

    const response = await super.generateText(pinned, options)
    this._persist({ key, test: testKey, input: stringifyWithSortedKeys(pinned), value: response })
    return response
  }

  public override async *generateTextStream(
    input: CognitiveRequest,
    options?: Parameters<Cognitive['generateTextStream']>[1]
  ): AsyncGenerator<CognitiveStreamChunk, void, unknown> {
    const pinned = pinModels(input)
    const key = cacheKeyOf('stream', pinned)
    const testKey = this._testKey()

    const cached = cache.get(key)
    if (cached?.chunks) {
      for (const chunk of cached.chunks) {
        yield chunk
      }
      return
    }

    if (process.env.CI) {
      console.info(`LLM cache miss (generateTextStream) for ${key} in test ${testKey}`)
    }

    const chunks: CognitiveStreamChunk[] = []
    for await (const chunk of super.generateTextStream(pinned, options)) {
      chunks.push(chunk)
      yield chunk
    }

    this._persist({ key, test: testKey, input: stringifyWithSortedKeys(pinned), chunks })
  }
}

export const getCachedCognitiveClient = () => {
  return new CachedCognitive({
    apiUrl: process.env.CLOUD_API_ENDPOINT ?? 'https://api.botpress.cloud',
    botId: process.env.CLOUD_BOT_ID,
    token: process.env.CLOUD_PAT,
    timeout: 60_000,
  })
}
