import {
  Cognitive,
  type CognitiveRequest,
  type CognitiveResponse,
  type CognitiveStreamChunk,
  type Model,
} from '@botpress/cognitive'
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CachedCognitive, cacheMode } from './cached-cognitive.js'
import { cacheKeyOf } from './cache-key.js'

const request: CognitiveRequest = {
  model: 'openai:gpt-5.6-luna',
  messages: [{ role: 'user', content: 'Run the task.' }],
  tools: [{ name: 'run_javascript', parameters: { type: 'object' } }],
  toolControl: { mode: 'required', parallel: false },
}
const response: CognitiveResponse = {
  output: '',
  toolCalls: [{ id: 'call_1', name: 'run_javascript', input: { code: 'return exit("done");' } }],
  metadata: {
    provider: 'openai',
    model: 'openai:gpt-5.6-luna',
    cached: false,
    latency: 1,
    cost: 0.01,
    usage: { inputTokens: 10, outputTokens: 10, inputCost: 0.005, outputCost: 0.005 },
  },
}
const completed: CognitiveStreamChunk = {
  created: 1,
  finished: true,
  toolCalls: response.toolCalls,
  metadata: response.metadata,
}
const collect = async (stream: AsyncIterable<CognitiveStreamChunk>) => {
  const chunks: CognitiveStreamChunk[] = []
  for await (const chunk of stream) chunks.push(chunk)
  return chunks
}

let directory: string
let file: string
beforeEach(() => {
  directory = mkdtempSync(path.join(tmpdir(), 'llmz-cache-'))
  file = path.join(directory, 'nested', 'responses.jsonl')
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  rmSync(directory, { recursive: true, force: true })
})
const client = (mode: 'auto' | 'replay' | 'refresh' = 'auto', apiUrl?: string) =>
  new CachedCognitive({ apiUrl }, { path: file, mode })

describe('network test cache', () => {
  it('persists and replays full native responses without a network request or shared mutations', async () => {
    const network = vi.spyOn(Cognitive.prototype, 'generateText').mockResolvedValue(structuredClone(response))
    const first = await client().generateText(request)
    first.toolCalls![0]!.input.code = 'mutated'
    network.mockRejectedValue(new Error('network disabled'))
    const replay = client('replay')
    const result = await replay.generateText(request)
    expect(result.toolCalls).toEqual(response.toolCalls)
    expect(result.metadata).toMatchObject({ cached: true, cost: 0 })
    result.toolCalls![0]!.input.code = 'mutated again'
    expect((await replay.generateText(request)).toolCalls).toEqual(response.toolCalls)
    expect(network).toHaveBeenCalledTimes(1)
  })

  it('preserves stream chunks, restarts, and tool calls on disk and on replay', async () => {
    const chunks: CognitiveStreamChunk[] = [
      { created: 1, output: 'abandoned' },
      { created: 2, restart: { attempt: 1, fromModel: 'first', toModel: 'second', reason: 'timeout' } },
      { created: 3, output: 'Checking' },
      completed,
    ]
    const network = vi.spyOn(Cognitive.prototype, 'generateTextStream').mockImplementation(async function* () {
      for (const chunk of chunks) yield structuredClone(chunk)
    })
    expect(await collect(client().generateTextStream(request))).toEqual(chunks)
    network.mockImplementation(async function* () {
      throw new Error('network disabled')
    })
    const replayed = await collect(client('replay').generateTextStream(request))
    expect(replayed.slice(0, -1)).toEqual(chunks.slice(0, -1))
    expect(replayed.at(-1)).toEqual({ ...completed, metadata: { ...response.metadata, cached: true, cost: 0 } })
    expect(network).toHaveBeenCalledTimes(1)
  })

  it.each(['throw', 'incomplete', 'error chunk', 'canceled consumer'])(
    'does not cache a %s stream',
    async (failure) => {
      const network = vi.spyOn(Cognitive.prototype, 'generateTextStream').mockImplementation(async function* () {
        yield { created: 1, output: 'Done.' }
        if (failure === 'throw') throw new Error('Generation failed')
        if (failure === 'error chunk')
          yield { created: 2, finished: true, error: 'Generation failed', metadata: response.metadata }
        if (failure === 'canceled consumer') yield completed
      })
      if (failure === 'canceled consumer') {
        for await (const _chunk of client().generateTextStream(request)) break
      } else if (failure === 'throw') {
        await expect(collect(client().generateTextStream(request))).rejects.toThrow('Generation failed')
      } else {
        await collect(client().generateTextStream(request))
      }
      await expect(collect(client('replay').generateTextStream(request))).rejects.toThrow('cache miss')
      expect(network).toHaveBeenCalledTimes(1)
    }
  )

  it('never caches failed ordinary requests', async () => {
    const network = vi.spyOn(Cognitive.prototype, 'generateText').mockRejectedValue(new Error('request failed'))
    await expect(client().generateText(request)).rejects.toThrow('request failed')
    await expect(client('replay').generateText(request)).rejects.toThrow('cache miss')
    expect(network).toHaveBeenCalledTimes(1)
  })

  it('refresh bypasses local and server caches and records the new response', async () => {
    const network = vi.spyOn(Cognitive.prototype, 'generateText').mockResolvedValue(structuredClone(response))
    await client().generateText(request)
    network.mockResolvedValue({ ...response, output: 'new recording' })
    await client('refresh').generateText(request)
    expect(network).toHaveBeenCalledTimes(2)
    expect(network.mock.calls[1]?.[0].options?.skipCache).toBe(true)
    expect((await client('replay').generateText(request)).output).toBe('new recording')
    expect(network).toHaveBeenCalledTimes(2)
  })

  it('caches model details so replay cannot fall through to remote model discovery', async () => {
    const model: Model = {
      id: 'test:model',
      name: 'Model',
      description: '',
      lifecycle: 'production',
      tags: [],
      input: { maxTokens: 1000, costPer1MTokens: 1 },
      output: { maxTokens: 100, costPer1MTokens: 2 },
    }
    const network = vi.spyOn(Cognitive.prototype, 'getModelDetails').mockResolvedValue(model)
    expect(await client().getModelDetails(model.id)).toEqual(model)
    expect(await client('replay').getModelDetails(model.id)).toEqual(model)
    await expect(client('replay').getModelDetails('missing')).rejects.toThrow('cache miss')
    expect(network).toHaveBeenCalledTimes(1)
  })

  it.each(['text', 'stream', 'model'])('fails before network access on a replay-only %s miss', async (kind) => {
    const text = vi.spyOn(Cognitive.prototype, 'generateText')
    const stream = vi.spyOn(Cognitive.prototype, 'generateTextStream')
    const model = vi.spyOn(Cognitive.prototype, 'getModelDetails')
    const replay = client('replay')
    const call =
      kind === 'text'
        ? replay.generateText(request)
        : kind === 'stream'
          ? collect(replay.generateTextStream(request))
          : replay.getModelDetails('missing')
    await expect(call).rejects.toThrow('cache miss')
    expect(text).not.toHaveBeenCalled()
    expect(stream).not.toHaveBeenCalled()
    expect(model).not.toHaveBeenCalled()
  })

  it('honors cancellation even when a recording exists', async () => {
    vi.spyOn(Cognitive.prototype, 'generateText').mockResolvedValue(structuredClone(response))
    await client().generateText(request)
    const controller = new AbortController()
    controller.abort(new Error('stop'))
    await expect(client('replay').generateText(request, { signal: controller.signal })).rejects.toThrow('stop')
  })

  it.each(['prompt', 'tool control', 'tool schema', 'model', 'endpoint'])('invalidates changed %s', async (change) => {
    const network = vi.spyOn(Cognitive.prototype, 'generateText').mockResolvedValue(structuredClone(response))
    await client().generateText(request)
    const changed = structuredClone(request)
    if (change === 'prompt') changed.messages[0]!.content = 'Another task'
    if (change === 'tool control')
      changed.toolControl = { mode: 'specific', toolName: 'run_javascript', parallel: false }
    if (change === 'tool schema') changed.tools![0]!.parameters = { type: 'object', required: ['code'] }
    if (change === 'model') changed.model = 'another:model'
    const replay = client('replay', change === 'endpoint' ? 'https://test.invalid' : undefined)
    await expect(replay.generateText(changed)).rejects.toThrow('cache miss')
    expect(network).toHaveBeenCalledTimes(1)
  })

  it('migrates complete legacy entries by full request and tolerates an interrupted final line', async () => {
    file = path.join(directory, 'legacy.jsonl')
    writeFileSync(
      file,
      JSON.stringify({ key: 'old-32-bit-hash', input: JSON.stringify(request), value: response }) + '\n{"key":'
    )
    const network = vi.spyOn(Cognitive.prototype, 'generateText')
    expect((await client('replay').generateText(request)).toolCalls).toEqual(response.toolCalls)
    expect(network).not.toHaveBeenCalled()
  })

  it('rejects an incomplete legacy stream recording', async () => {
    file = path.join(directory, 'partial.jsonl')
    writeFileSync(
      file,
      JSON.stringify({ key: 'old', input: JSON.stringify(request), chunks: [{ created: 1, output: 'Done.' }] }) + '\n'
    )
    const network = vi.spyOn(Cognitive.prototype, 'generateTextStream')
    await expect(collect(client('replay').generateTextStream(request))).rejects.toThrow('cache miss')
    expect(network).not.toHaveBeenCalled()
  })

  it('keeps stream and ordinary responses separate and uses a full request digest', () => {
    expect(cacheKeyOf('text', request)).toMatch(/^[a-f0-9]{64}$/)
    expect(cacheKeyOf('text', request)).not.toBe(cacheKeyOf('stream', request))
    expect(cacheKeyOf('text', { ...request, options: { skipCache: true } })).toBe(cacheKeyOf('text', request))
  })

  it('does not persist credentials in recordings', async () => {
    vi.spyOn(Cognitive.prototype, 'generateText').mockResolvedValue(structuredClone(response))
    await new CachedCognitive({ token: 'secret-token', botId: 'secret-bot' }, { path: file }).generateText(request)
    expect(readFileSync(file, 'utf8')).not.toMatch(/secret-token|secret-bot/)
  })

  it('supports explicit cache modes and the legacy fresh flag', () => {
    vi.stubEnv('LLMZ_E2E_CACHE_MODE', undefined)
    vi.stubEnv('LLMZ_E2E_FRESH', undefined)
    expect(cacheMode()).toBe('auto')
    vi.stubEnv('LLMZ_E2E_FRESH', '1')
    expect(cacheMode()).toBe('refresh')
    vi.stubEnv('LLMZ_E2E_CACHE_MODE', 'replay')
    expect(cacheMode()).toBe('replay')
    vi.stubEnv('LLMZ_E2E_CACHE_MODE', 'unknown')
    expect(() => cacheMode()).toThrow('Unknown')
  })
})
