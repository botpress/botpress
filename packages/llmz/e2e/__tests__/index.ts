import { Cognitive, type CognitiveRequest, type CognitiveStreamChunk } from '@botpress/cognitive'
import fs from 'node:fs'
import path from 'node:path'
import { expect } from 'vitest'

import { cacheKeyOf, stringifyWithSortedKeys } from './cache-key.js'

/**
 * The models used by the e2e suites, as a fallback chain. Every request that
 * does not pin an explicit model is rewritten to this list.
 */
// Runtime integration tests use a reference model. The opt-in model suites
// separately exercise GPT-OSS, Qwen, Mercury, and the reference model without fallbacks.
export const TEST_MODELS = [
  'openai:gpt-5.6-luna',
  'cerebras:gemma-4-31b',
  'cerebras:gpt-oss-120b',
  'anthropic:claude-haiku-4-5-20251001',
  'google-ai:gemini-3.5-flash',
] as const

/** Base64 data URI for a fixture file in this directory. */
export function getFixtureDataUri(filename: string, mimeType: string) {
  const buffer = fs.readFileSync(path.resolve(__dirname, filename))
  return `data:${mimeType};base64,${buffer.toString('base64')}`
}

/**
 * A short spoken voice message (macOS TTS), base64-encoded as a data URI.
 * The speaker says: "Hey! Please say the word pineapple, and also tell me
 * what the capital of France is."
 */
export function getVoiceMessageDataUri() {
  return getFixtureDataUri('./voice-message.wav', 'audio/wav')
}

/**
 * Fixtures for the screen-share scenario: three checkout screenshots
 * (purchase page, payment form, payment-failed error page) and the user's
 * spoken narration. The speaker says: "Hey, so I was trying to buy the
 * premium plan. I clicked buy now, I filled in my card and a little note,
 * and then I landed on this error page you can see on my screen. Can you
 * tell me exactly what went wrong, and was I charged anything?"
 *
 * The error details (ERR-PAY-042, insufficient funds, no charge made) appear
 * ONLY in screenshot C — reading the image is the only way to answer.
 */
export function getScreenShareFixtures() {
  return {
    screenshotA: getFixtureDataUri('./screenshot-a.png', 'image/png'),
    screenshotB: getFixtureDataUri('./screenshot-b.png', 'image/png'),
    screenshotC: getFixtureDataUri('./screenshot-c.png', 'image/png'),
    voice: getFixtureDataUri('./voice-screenshare.wav', 'audio/wav'),
  }
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

// Override with a new path to run against a fresh cache without growing the checked-in fixture.
const CACHE_PATH = process.env.LLMZ_E2E_CACHE_PATH ?? path.resolve(__dirname, './cache.jsonl')
const FRESH_RESPONSES = process.env.LLMZ_E2E_FRESH === '1'

const cache: Map<string, CacheEntry> = readJSONL(CACHE_PATH, 'key')

/** Rewrites unpinned/auto model selection to the deterministic test model chain. */
const pinModels = <T extends CognitiveRequest>(input: T): T => {
  const model = input.model
  if (!model || model === 'best' || model === 'fast' || model === 'auto') {
    return { ...input, model: [...TEST_MODELS] as CognitiveRequest['model'] }
  }
  return input
}

/** Fresh evaluations bypass both response caches while still recording observations. */
const prepareRequest = (input: CognitiveRequest): CognitiveRequest => {
  if (!FRESH_RESPONSES) {
    return input
  }

  return { ...input, options: { ...input.options, skipCache: true } }
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

    const cached = FRESH_RESPONSES ? undefined : cache.get(key)
    if (cached?.value) {
      return cached.value
    }

    if (process.env.CI) {
      console.info(`LLM cache miss (generateText) for ${key} in test ${testKey}`)
    }

    const request = prepareRequest(pinned)
    const response = await super.generateText(request, options)
    this._persist({ key, test: testKey, input: stringifyWithSortedKeys(request), value: response })
    return response
  }

  public override async *generateTextStream(
    input: CognitiveRequest,
    options?: Parameters<Cognitive['generateTextStream']>[1]
  ): AsyncGenerator<CognitiveStreamChunk, void, unknown> {
    const pinned = pinModels(input)
    const key = cacheKeyOf('stream', pinned)
    const testKey = this._testKey()

    const cached = FRESH_RESPONSES ? undefined : cache.get(key)
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
    const request = prepareRequest(pinned)

    for await (const chunk of super.generateTextStream(request, options)) {
      chunks.push(chunk)
      yield chunk
    }

    this._persist({ key, test: testKey, input: stringifyWithSortedKeys(request), chunks })
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
