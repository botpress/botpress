import {
  Cognitive,
  type CognitiveRequest,
  type CognitiveResponse,
  type CognitiveStreamChunk,
  type Model,
} from '@botpress/cognitive'
import fs from 'node:fs'
import path from 'node:path'
import { expect } from 'vitest'

import { cacheKeyOf, stringifyWithSortedKeys } from './cache-key.js'
import { markCacheIncomplete, markCacheUsed, withCacheLock } from './cache-usage.js'

export type CacheMode = 'auto' | 'replay' | 'refresh'

export function cacheMode(): CacheMode {
  const mode = process.env.LLMZ_E2E_CACHE_MODE ?? (process.env.LLMZ_E2E_FRESH === '1' ? 'refresh' : 'auto')

  if (mode !== 'auto' && mode !== 'replay' && mode !== 'refresh') {
    throw new Error(`Unknown LLMZ_E2E_CACHE_MODE: ${mode}`)
  }

  return mode
}

export const TEST_MODELS = [
  'openai:gpt-5.6-luna',
  'cerebras:gemma-4-31b',
  'cerebras:gpt-oss-120b',
  'anthropic:claude-haiku-4-5-20251001',
  'google-ai:gemini-3.5-flash',
] as const

const DEFAULT_ENDPOINT = 'https://api.botpress.cloud'
type Entry = {
  key: string
  scope?: string
  kind?: 'text' | 'stream' | 'model'
  test?: string
  input?: string
  value?: CognitiveResponse | Model
  chunks?: CognitiveStreamChunk[]
}
type Settings = { path?: string; mode?: CacheMode }

function rateLimited(entry: Entry): boolean {
  const responses = entry.chunks ?? (entry.value && entry.kind !== 'model' ? [entry.value as CognitiveResponse] : [])
  const limited = (message: string) => /\b429\b|\brate[ _-]?limit(?:ed|ing)?\b|\btoo many requests\b/i.test(message)

  return responses.some(
    (response) =>
      response.metadata?.warnings?.some((warning) => limited(warning.message)) ||
      ('restart' in response && response.restart && limited(response.restart.reason))
  )
}

function completeStream(chunks: CognitiveStreamChunk[]): boolean {
  return !!chunks.at(-1)?.finished && !!chunks.at(-1)?.metadata && !chunks.some((chunk) => chunk.error)
}

/** Shared by ordinary integration tests and model evaluations. */
export class CachedCognitive extends Cognitive {
  private readonly _path: string
  private readonly _mode: CacheMode
  private readonly _scope: string
  private readonly _entries = new Map<string, Entry>()

  public constructor(props: ConstructorParameters<typeof Cognitive>[0] = {}, settings: Settings = {}) {
    super(props)
    this._path = settings.path ?? process.env.LLMZ_E2E_CACHE_PATH ?? path.resolve(__dirname, './cache.jsonl')
    this._mode = settings.mode ?? cacheMode()
    this._scope = props.apiUrl ?? DEFAULT_ENDPOINT

    if (!fs.existsSync(this._path)) {
      return
    }

    for (const line of fs.readFileSync(this._path, 'utf8').split(/\r?\n/).filter(Boolean)) {
      try {
        const entry: Entry = JSON.parse(line)

        if ((entry.scope ?? DEFAULT_ENDPOINT) !== this._scope) {
          continue
        }

        if (rateLimited(entry)) {
          continue
        }

        // Re-key legacy recordings from their complete request, avoiding old 32-bit hash collisions.
        const kind = entry.kind ?? (entry.chunks ? 'stream' : 'text')

        if (kind === 'stream' && !completeStream(entry.chunks ?? [])) {
          continue
        }

        if (kind === 'text' && !(entry.value as CognitiveResponse | undefined)?.metadata) {
          continue
        }

        const key = kind === 'model' ? entry.key : cacheKeyOf(kind, JSON.parse(entry.input!))
        this._entries.set(key, entry)
      } catch {
        // Ignore a truncated final line left by an interrupted recording.
      }
    }
  }

  private _read(key: string): Entry | undefined {
    const entry = this._mode === 'refresh' ? undefined : this._entries.get(key)

    if (!entry && this._mode === 'replay') {
      markCacheIncomplete(this._path)
      throw new Error(`E2E cache miss in replay mode: ${key}. Record it with LLMZ_E2E_CACHE_MODE=auto or refresh.`)
    }

    if (entry) markCacheUsed(this._path, entry)
    return entry && structuredClone(entry)
  }

  private _write(entry: Entry): void {
    // A successful fallback can still carry a provider 429. Preserve the live
    // response for assertions, but never freeze temporary throttling into a fixture.
    if (rateLimited(entry)) {
      markCacheIncomplete(this._path)
      return
    }

    const snapshot = structuredClone({ ...entry, scope: this._scope, test: expect.getState().currentTestName })
    const written = withCacheLock(this._path, () => fs.appendFileSync(this._path, JSON.stringify(snapshot) + '\n'))
    if (!written) return
    markCacheUsed(this._path, snapshot)
    this._entries.set(entry.key, snapshot)
  }

  private _prepare(input: CognitiveRequest): CognitiveRequest {
    const model = input.model

    return {
      ...input,
      model:
        !model || (typeof model === 'string' && ['auto', 'best', 'fast'].includes(model)) ? [...TEST_MODELS] : model,
      options: { ...input.options, ...(this._mode === 'refresh' ? { skipCache: true } : {}) },
    }
  }

  public override async getModelDetails(model: string): Promise<Model> {
    const key = `model:${model}`
    const cached = this._read(key)

    if (cached?.value) {
      return cached.value as Model
    }

    const value = await super.getModelDetails(model).catch((error) => {
      markCacheIncomplete(this._path)
      throw error
    })
    this._write({ kind: 'model', key, value })
    return value
  }

  public override async generateText(input: CognitiveRequest, options?: Parameters<Cognitive['generateText']>[1]) {
    options?.signal?.throwIfAborted()
    const request = this._prepare(input)
    const key = cacheKeyOf('text', request)
    const cached = this._read(key)

    if (cached?.value) {
      const response = cached.value as CognitiveResponse
      response.metadata = { ...response.metadata, cached: true, cost: 0 }
      return response
    }

    const value = await super.generateText(request, options).catch((error) => {
      markCacheIncomplete(this._path)
      throw error
    })
    this._write({ kind: 'text', key, input: stringifyWithSortedKeys(request), value })
    return value
  }

  public override async *generateTextStream(
    input: CognitiveRequest,
    options?: Parameters<Cognitive['generateTextStream']>[1]
  ): AsyncGenerator<CognitiveStreamChunk, void, unknown> {
    options?.signal?.throwIfAborted()
    const request = this._prepare(input)
    const key = cacheKeyOf('stream', request)
    const cached = this._read(key)

    if (cached?.chunks) {
      for (const chunk of cached.chunks) {
        options?.signal?.throwIfAborted()

        if (chunk.metadata) {
          chunk.metadata = { ...chunk.metadata, cached: true, cost: 0 }
        }

        yield chunk
      }

      return
    }

    const chunks: CognitiveStreamChunk[] = []
    try {
      for await (const chunk of super.generateTextStream(request, options)) {
        chunks.push(structuredClone(chunk))
        yield chunk
      }

      // Failed, canceled, partially consumed, and incomplete streams must never become replay fixtures.
      if (completeStream(chunks)) {
        this._write({ kind: 'stream', key, input: stringifyWithSortedKeys(request), chunks })
      }
    } finally {
      if (!completeStream(chunks)) markCacheIncomplete(this._path)
    }
  }
}
