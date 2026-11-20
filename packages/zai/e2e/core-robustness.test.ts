import { describe, it, expect, vi, afterEach } from 'vitest'
import { TableAdapter } from '../src/adapters/botpress-table'
import { ZaiContext } from '../src/context'
import { EventEmitter } from '../src/emitter'
import { Response } from '../src/response'
import { stringify } from '../src/utils'
import { Zai } from '../src/zai'

// Offline tests: a fake Cognitive client returns crafted outputs, no network involved

type Handler = (...args: any[]) => void
type GenerateFn = (input: any, opts: any) => Promise<any>

const ok = (output: string, metadata?: any) => ({
  output,
  metadata: metadata ?? {
    provider: 'fake',
    model: 'fake:model',
    usage: { inputTokens: 1, outputTokens: 1, inputCost: 0, outputCost: 0 },
    cost: 0,
  },
})

const makeFakeCognitive = (generate: GenerateFn) => {
  const calls: any[] = []
  const make = (): any => {
    const listeners: Record<string, Handler[]> = {}
    const emit = (type: string, ...args: any[]) => (listeners[type] ?? []).forEach((l) => l(...args))
    return {
      $$IS_COGNITIVE_BETA: 'v2',
      calls,
      clone: () => make(),
      on: (type: string, listener: Handler) => {
        ;(listeners[type] ??= []).push(listener)
        return () => {}
      },
      getModelDetails: async (id: string) => ({
        id,
        name: id,
        input: { maxTokens: 128_000 },
        output: { maxTokens: 8_192 },
      }),
      generateText: async (input: any, opts: any) => {
        calls.push({ input: structuredClone({ ...input, signal: undefined }), opts })
        emit('request', {})
        try {
          const res = await generate(input, opts)
          emit('response', {}, res)
          return res
        } catch (err) {
          emit('error', {}, err)
          throw err
        }
      },
    }
  }
  return make()
}

const makeContext = (client: any, modelId: string = 'best', memoizer?: any) =>
  new ZaiContext({ client, taskType: 'zai.test', taskId: 'test', modelId, memoizer })

const TRUE_ANSWER = 'Analysis: it is.\nFinal Answer: ■TRUE■'

describe('ZaiContext retries', () => {
  it('rethrows request errors (auth, bad request) without retrying or feeding them back to the model', async () => {
    const authError = Object.assign(new Error('Unauthorized'), { response: { status: 401 } })
    const client = makeFakeCognitive(async () => {
      throw authError
    })
    const ctx = makeContext(client)

    await expect(ctx.generateContent({ messages: [{ role: 'user', content: 'hi', type: 'text' }] })).rejects.toBe(
      authError
    )
    expect(client.calls).toHaveLength(1)
  })

  it('retries transform errors with the error fed back to the model', async () => {
    let n = 0
    const client = makeFakeCognitive(async () => ok(n++ === 0 ? 'garbage' : 'VALID'))
    const ctx = makeContext(client)

    const res = await ctx.generateContent({
      messages: [{ role: 'user', content: 'hi', type: 'text' }],
      transform: (text) => {
        if (text !== 'VALID') {
          throw new Error('expected VALID')
        }
        return text
      },
    })

    expect(res.extracted).toBe('VALID')
    expect(client.calls).toHaveLength(2)
    const lastMessages = client.calls[1].input.messages
    expect(lastMessages.at(-1).content).toContain('ERROR PARSING OUTPUT')
    expect(lastMessages.at(-1).content).toContain('expected VALID')
  })

  it('throws the last transform error after maxRetries', async () => {
    const client = makeFakeCognitive(async () => ok('garbage'))
    const ctx = makeContext(client)

    await expect(
      ctx.generateContent({
        maxRetries: 2,
        messages: [{ role: 'user', content: 'hi', type: 'text' }],
        transform: () => {
          throw new Error('still invalid')
        },
      })
    ).rejects.toThrow('still invalid')
    expect(client.calls).toHaveLength(3)
  })

  it('does not crash when the response has no usage metadata', async () => {
    const client = makeFakeCognitive(async () => ({ output: 'hello', metadata: { provider: 'x' } }))
    const ctx = makeContext(client)

    const res = await ctx.generateContent({ messages: [{ role: 'user', content: 'hi', type: 'text' }] })
    expect(res.text).toBe('hello')
    expect(res.meta.tokens).toEqual({ input: 0, output: 0 })
    expect(res.meta.cost).toEqual({ input: 0, output: 0 })
  })

  it('rejects with the abort reason (never null) when aborted before the first call', async () => {
    const client = makeFakeCognitive(async () => ok('x'))
    const ctx = makeContext(client)
    ctx.controller.abort('user-cancel')

    await expect(ctx.generateContent({ messages: [{ role: 'user', content: 'hi', type: 'text' }] })).rejects.toBe(
      'user-cancel'
    )
    expect(client.calls).toHaveLength(0)
  })

  it('memo key depends on the model and sampling options', async () => {
    const keys: string[] = []
    const memoizer = { run: (id: string, fn: () => Promise<any>) => (keys.push(id), fn()) }
    const client = makeFakeCognitive(async () => ok('x'))
    const messages = [{ role: 'user' as const, content: 'hi', type: 'text' as const }]

    await makeContext(client, 'best', memoizer).generateContent({ messages })
    await makeContext(client, 'fast', memoizer).generateContent({ messages })
    await makeContext(client, 'fast', memoizer).generateContent({ messages, temperature: 0.9 })
    await makeContext(client, 'fast', memoizer).generateContent({
      messages: [{ role: 'assistant', content: 'hi', type: 'text' }],
      temperature: 0.9,
    })

    expect(new Set(keys).size).toBe(4)
  })
})

describe('Zai operations with a fake client', () => {
  it('aborting before the first LLM call rejects with the abort reason', async () => {
    const client = makeFakeCognitive(async () => ok(TRUE_ANSWER))
    const zai = new Zai({ client })
    const res = zai.check('hello', 'is a greeting')
    res.abort('user-cancel')

    await expect(res).rejects.toBe('user-cancel')
    expect(client.calls).toHaveLength(0)
  })

  it('forwards userId on the request metadata', async () => {
    const client = makeFakeCognitive(async () => ok(TRUE_ANSWER))
    const zai = new Zai({ client, userId: 'user-123' })

    await zai.check('hello', 'is a greeting')
    expect(client.calls[0].input.meta.metadata).toMatchObject({ userId: 'user-123' })
  })

  it('does not add metadata when no userId is set', async () => {
    const client = makeFakeCognitive(async () => ok(TRUE_ANSWER))
    const zai = new Zai({ client })

    await zai.check('hello', 'is a greeting')
    expect(client.calls[0].input.meta.metadata).toBeUndefined()
  })

  it('Response.catch() resolves to the simplified value', async () => {
    const client = makeFakeCognitive(async () => ok(TRUE_ANSWER))
    const zai = new Zai({ client })

    const value = await zai.check('hello', 'is a greeting').catch(() => 'failed')
    expect(value).toBe(true)
  })

  it('a throwing complete listener does not fail the operation', async () => {
    const client = makeFakeCognitive(async () => ok(TRUE_ANSWER))
    const zai = new Zai({ client })
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const res = zai.check('hello', 'is a greeting').on('complete', () => {
      throw new Error('listener bug')
    })

    await expect(res).resolves.toBe(true)
    spy.mockRestore()
  })

  it('a fire-and-forget failing operation does not cause an unhandled rejection', async () => {
    const client = makeFakeCognitive(async () => {
      throw new Error('API down')
    })
    const zai = new Zai({ client })
    const unhandled = vi.fn()
    process.on('unhandledRejection', unhandled)

    const onError = vi.fn()
    zai.check('hello', 'is a greeting').on('error', onError)

    await new Promise((resolve) => setTimeout(resolve, 50))
    process.off('unhandledRejection', unhandled)

    expect(onError).toHaveBeenCalledTimes(1)
    expect(unhandled).not.toHaveBeenCalled()
  })

  it('awaiting a failing operation still rejects', async () => {
    const client = makeFakeCognitive(async () => {
      throw new Error('API down')
    })
    const zai = new Zai({ client })
    await expect(zai.check('hello', 'is a greeting')).rejects.toThrow('API down')
  })

  it('bindSignal removes its abort listener once the operation settles', async () => {
    const client = makeFakeCognitive(async () => ok(TRUE_ANSWER))
    const zai = new Zai({ client })
    const controller = new AbortController()
    const add = vi.spyOn(controller.signal, 'addEventListener')
    const remove = vi.spyOn(controller.signal, 'removeEventListener')

    await zai.check('hello', 'is a greeting').bindSignal(controller.signal)
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(add).toHaveBeenCalledTimes(1)
    expect(remove).toHaveBeenCalledWith('abort', add.mock.calls[0]![1])
  })

  it('bindSignal with an already-aborted signal aborts without registering a listener', async () => {
    const client = makeFakeCognitive(async () => ok(TRUE_ANSWER))
    const zai = new Zai({ client })
    const controller = new AbortController()
    controller.abort('already')
    const add = vi.spyOn(controller.signal, 'addEventListener')

    await expect(zai.check('hello', 'is a greeting').bindSignal(controller.signal)).rejects.toBe('already')
    expect(add).not.toHaveBeenCalled()
  })

  it('rejects table names the adapter would reject, with a clear message', () => {
    const client = makeFakeCognitive(async () => ok(TRUE_ANSWER))
    expect(
      () => new Zai({ client, activeLearning: { enable: true, tableName: 'my-learning-Table', taskId: 'x' } })
    ).toThrow(/Table name/)
    expect(
      () => new Zai({ client, activeLearning: { enable: true, tableName: 'MyLearningTable', taskId: 'x' } })
    ).not.toThrow()
  })
})

describe('EventEmitter', () => {
  it('calls every once listener', () => {
    const emitter = new EventEmitter<{ done: number }>()
    const a = vi.fn()
    const b = vi.fn()
    emitter.once('done', a)
    emitter.once('done', b)
    emitter.emit('done', 1)
    emitter.emit('done', 2)
    expect(a).toHaveBeenCalledTimes(1)
    expect(b).toHaveBeenCalledTimes(1)
  })

  it('a throwing listener does not prevent the next ones', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const emitter = new EventEmitter<{ done: number }>()
    const b = vi.fn()
    emitter.on('done', () => {
      throw new Error('boom')
    })
    emitter.on('done', b)
    expect(() => emitter.emit('done', 1)).not.toThrow()
    expect(b).toHaveBeenCalledWith(1)
    spy.mockRestore()
  })
})

describe('Response', () => {
  it('two once("complete") listeners both fire', async () => {
    const client = makeFakeCognitive(async () => ok('x'))
    const ctx = makeContext(client)
    const res = new Response(ctx, Promise.resolve(42), (v) => v)
    const a = vi.fn()
    const b = vi.fn()
    res.once('complete', a).once('complete', b)
    await res
    expect(a).toHaveBeenCalledWith(42)
    expect(b).toHaveBeenCalledWith(42)
  })
})

describe('stringify', () => {
  it('keeps falsy primitives', () => {
    expect(stringify(0)).toBe('0')
    expect(stringify(false)).toBe('false')
    expect(stringify(12.5)).toBe('12.5')
  })

  it('uses the placeholder only for null, undefined and empty string', () => {
    expect(stringify(null)).toMatch(/^<input is/)
    expect(stringify(undefined)).toMatch(/^<input is/)
    expect(stringify('')).toMatch(/^<input is/)
  })

  it('always returns a string for non-serializable inputs', () => {
    const circular: any = { a: 1 }
    circular.self = circular
    expect(stringify(circular)).toContain('[Circular]')
    expect(typeof stringify(() => 1)).toBe('string')
    expect(typeof stringify(Symbol('x'))).toBe('string')
    expect(stringify({ n: BigInt(5) })).toContain('5')
  })

  it('keeps the same output for regular objects', () => {
    expect(stringify({ a: 1 })).toBe(JSON.stringify({ a: 1 }, null, 2))
    expect(stringify({ a: 1 }, false)).toBe(JSON.stringify({ a: 1 }))
  })
})

describe('TableAdapter degrades gracefully', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  const goodSchemaTable = () => {
    const properties: Record<string, any> = {}
    for (const key of [
      'taskType',
      'taskId',
      'key',
      'instructions',
      'input',
      'output',
      'explanation',
      'metadata',
      'status',
      'feedback',
    ]) {
      properties[key] = { type: ['input', 'output', 'metadata', 'feedback'].includes(key) ? 'object' : 'string' }
    }
    properties.input['x-zui'] = { searchable: true }
    return {
      factor: 30,
      frozen: true,
      tags: { system: 'true', 'schema-purpose': 'active-learning', 'schema-version': 'Oct-2024' },
      schema: { properties },
    }
  }

  const makeTableClient = (table: any, rows: any[] = []) => ({
    getOrCreateTable: vi.fn(async () => ({ table, created: false })),
    findTableRows: vi.fn(async () => ({ rows })),
    upsertTableRows: vi.fn(async () => ({})),
  })

  it('an existing table with a column missing x-zui disables learning instead of throwing', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const table = goodSchemaTable()
    delete table.schema.properties.input['x-zui']
    const client = makeTableClient(table)
    const adapter = new TableAdapter({ client: client as any, tableName: 'TestTable' })

    await expect(adapter.getExamples({ taskType: 't', taskId: 'x', input: 'a' })).resolves.toEqual([])
    await expect(
      adapter.saveExample({
        key: 'k',
        taskType: 't',
        taskId: 'x',
        instructions: '',
        input: 'a',
        output: 'b',
        metadata: {} as any,
      })
    ).resolves.toBeUndefined()
    expect(client.findTableRows).not.toHaveBeenCalled()
    expect(client.upsertTableRows).not.toHaveBeenCalled()
  })

  it('a schema mismatch (wrong factor) keeps the adapter disabled', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const table = { ...goodSchemaTable(), factor: 1 }
    const client = makeTableClient(table)
    const adapter = new TableAdapter({ client: client as any, tableName: 'TestTable' })

    await expect(adapter.getExamples({ taskType: 't', taskId: 'x', input: 'a' })).resolves.toEqual([])
    expect(client.findTableRows).not.toHaveBeenCalled()
  })

  it('getOrCreateTable failing disables learning instead of failing the operation', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const client = makeTableClient(null)
    client.getOrCreateTable.mockRejectedValue(new Error('Forbidden'))
    const adapter = new TableAdapter({ client: client as any, tableName: 'TestTable' })

    await expect(adapter.getExamples({ taskType: 't', taskId: 'x', input: 'a' })).resolves.toEqual([])
  })

  it('skips malformed rows', async () => {
    const client = makeTableClient(goodSchemaTable(), [
      { key: 'good', input: { value: 'a' }, output: { value: 'b' }, explanation: 'e', similarity: 0.9 },
      { key: 'no-input', input: null, output: { value: 'b' } },
      { key: 'no-output', input: { value: 'a' } },
      null,
    ])
    const adapter = new TableAdapter({ client: client as any, tableName: 'TestTable' })

    const examples = await adapter.getExamples({ taskType: 't', taskId: 'x', input: 'a' })
    expect(examples).toEqual([{ key: 'good', input: 'a', output: 'b', explanation: 'e', similarity: 0.9 }])
  })

  it('handles non-serializable inputs when searching', async () => {
    const client = makeTableClient(goodSchemaTable())
    const adapter = new TableAdapter({ client: client as any, tableName: 'TestTable' })
    const circular: any = {}
    circular.self = circular

    await expect(adapter.getExamples({ taskType: 't', taskId: 'x', input: circular })).resolves.toEqual([])
  })
})

describe('bindSignal after settle', () => {
  it('does not register a listener once the operation has settled', async () => {
    const client = makeFakeCognitive(async () => ok(TRUE_ANSWER))
    const zai = new Zai({ client })
    const response = zai.check('hello', 'is a greeting')
    await response
    const controller = new AbortController()
    const add = vi.spyOn(controller.signal, 'addEventListener')
    response.bindSignal(controller.signal)
    expect(add).not.toHaveBeenCalled()
  })
})
