import { z } from '@bpinternal/zui'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import {
  CodeExecutionError,
  CognitiveError,
  CompactionError,
  Exit,
  InvalidEventError,
  InvalidMessageError,
  MemoryCapacityError,
  ObjectInstance,
  ReservedIdentifierError,
  Session,
  Tool,
  ToolInputError,
  isCriticalError,
  isLLMzError,
} from '../index.js'
import { executeContext } from './execute.js'
import { NativeClient, javascript } from './fixtures/native-client.js'

const done = new Exit({ name: 'done', description: 'Finish the task.', schema: z.object({ ok: z.boolean() }) })
const completed = () => javascript('return exit("done", { ok: true });')

describe.each(['false', 'true'])('typed iteration errors (QuickJS=%s)', (quickjs) => {
  beforeEach(() => vi.stubEnv('USE_QUICKJS', quickjs))
  afterEach(() => vi.unstubAllEnvs())

  test('a tool error caught by JavaScript remains available on a successful iteration', async () => {
    const client = new NativeClient([
      javascript(
        'let message = ""; try { await lookup({ id: 42 }); } catch (error) { message = error.message; } return exit("done", {ok:true});'
      ),
    ])
    const result = await executeContext({
      client,
      exits: [done],
      tools: [new Tool({ name: 'lookup', input: z.object({ id: z.string() }), handler: async () => 'found' })],
    })
    expect(result.is(done)).toBe(true)
    expect(result.iteration!.exception).toBeUndefined()
    const error = result.iteration!.errors.find(ToolInputError.is)
    expect(error?.expectedInput).toBe('{ id: string }')
    expect(error?.issues).toEqual([{ path: ['id'], message: 'Expected string, received number' }])
    expect(result.session.memory.variables.message).toContain('Expected input (TypeScript):')
  })

  test.each([
    new CognitiveError('Provider unavailable'),
    new CompactionError('Summary failed'),
    new MemoryCapacityError(100),
  ])('$code is critical even if generated code catches it; no later action or model request runs', async (error) => {
    const action = vi.fn()
    const client = new NativeClient([
      javascript('try { await fail(); } catch {} await action(); return exit("done", {ok:true});'),
      completed(),
    ])
    const result = await executeContext({
      client,
      exits: [done],
      tools: [
        new Tool({
          name: 'fail',
          handler: () => {
            throw error
          },
        }),
        new Tool({ name: 'action', handler: action }),
      ],
    })
    expect(result.isError()).toBe(true)
    if (!result.isError()) {
      throw new Error('Expected a critical failure')
    }

    expect(isCriticalError(result.error)).toBe(true)
    expect(result.error.code).toBe(error.code)
    expect(client.requests).toHaveLength(1)
    expect(action).not.toHaveBeenCalled()
    expect(result.iteration!.errors.some((failure) => failure.code === error.code)).toBe(true)
  })
})

test('provider failure preserves its cause and stops without another request', async () => {
  const cause = new Error('Provider disconnected')
  const client = new NativeClient([])
  const generate = vi.spyOn(client, 'generateText').mockRejectedValue(cause)
  const result = await executeContext({ client, exits: [done] })
  expect(result.isError()).toBe(true)
  if (!result.isError()) {
    throw new Error('Expected failure')
  }

  expect(CognitiveError.is(result.error)).toBe(true)
  expect(result.error.cause).toBe(cause)
  expect(result.iteration!.exception).toBe(result.error)
  expect(generate).toHaveBeenCalledOnce()
})

test('input overflow is critical before a provider request, even with default compaction', async () => {
  const session = new Session()
  session.append({ role: 'user', content: 'Important input. '.repeat(3000) })
  const client = new NativeClient([completed()])
  const result = await executeContext({ client, session, exits: [done], options: { maxTokens: 1000 } })
  expect(result.isError()).toBe(true)
  if (!result.isError()) {
    throw new Error('Expected failure')
  }

  expect(isLLMzError(result.error, 'TOKEN_OVERFLOW')).toBe(true)
  expect(result.error.critical).toBe(true)
  expect(client.requests).toHaveLength(0)
})

test('iteration exhaustion is distinct from the recoverable failure that consumed the last iteration', async () => {
  const client = new NativeClient([javascript('await missingTool();')])
  const result = await executeContext({ client, exits: [done], options: { loop: 1 } })
  expect(result.isError()).toBe(true)
  if (!result.isError()) {
    throw new Error('Expected failure')
  }

  expect(result.error).toMatchObject({ code: 'ITERATION_LIMIT', critical: true, limit: 1 })
  expect(result.iteration!.exception).toBeInstanceOf(CodeExecutionError)
  expect(client.requests).toHaveLength(1)
})

test.each([
  { role: 'user', content: 42 },
  { role: 'event', name: '', payload: {} },
  { role: 'event', name: 'clicked', payload: { bad: Infinity } },
])('invalid input is rejected before it enters the transcript: %j', (message) => {
  const session = new Session()
  expect(() => session.append(message as never)).toThrow(
    message.role === 'event' ? InvalidEventError : InvalidMessageError
  )
  expect(session.transcript).toEqual([])
})

test.each(['tool', 'object', 'exit'] as const)(
  'reserved %s names are critical configuration errors before generation',
  async (kind) => {
    const client = new NativeClient([completed()])
    const result = await executeContext({
      client,
      tools: kind === 'tool' ? [new Tool({ name: 'inspect', handler: async () => {} })] : [],
      objects: kind === 'object' ? [new ObjectInstance({ name: 'inspect' })] : [],
      exits: kind === 'exit' ? [new Exit({ name: 'inspect', description: 'Invalid reserved exit.' })] : [done],
    })
    expect(result.isError()).toBe(true)
    if (!result.isError()) {
      throw new Error('Expected failure')
    }

    expect(ReservedIdentifierError.is(result.error)).toBe(true)
    expect(result.error).toMatchObject({ identifier: 'inspect', kind, critical: true })
    expect(client.requests).toHaveLength(0)
  }
)

test('a critical error from another library import stops execution', async () => {
  vi.resetModules()
  const other = await import('../errors/catalog.js')
  const error = new other.CompactionError('Custom storage cannot commit a summary')
  const client = new NativeClient([completed()])
  const result = await executeContext({
    client,
    exits: [done],
    onIterationStart: () => {
      throw error
    },
  })
  expect(result.isError()).toBe(true)
  if (result.isError()) {
    expect(CompactionError.is(result.error)).toBe(true)
  }

  expect(client.requests).toHaveLength(0)
})

test('output token exhaustion is critical and is distinguished from input overflow', async () => {
  const generated = completed()
  generated.metadata = { ...generated.metadata, stopReason: 'max_tokens' }
  const client = new NativeClient([generated, completed()])
  const result = await executeContext({ client, exits: [done] })
  expect(result.isError()).toBe(true)
  if (result.isError()) {
    expect(result.error).toMatchObject({ code: 'TOKEN_OVERFLOW', phase: 'output', critical: true })
  }

  expect(client.requests).toHaveLength(1)
})

test('automatic compaction failure stops before the next model request and preserves previous history', async () => {
  const cause = new Error('Summary service unavailable')
  const session = new Session({
    compaction: {
      triggerRatio: 0.01,
      targetRatio: 0.005,
      keepRecentIterations: 0,
      summarize: async () => {
        throw cause
      },
    },
  })
  const client = new NativeClient([completed(), completed()])
  session.append({ role: 'user', content: 'Remember my order.' })
  const first = await executeContext({ client, session, exits: [done] })
  expect(first.isSuccess()).toBe(true)
  const history = session.messages
  session.append({ role: 'event', name: 'order.updated', payload: { id: 'order-1' } })
  const result = await executeContext({ client, session, exits: [done] })
  expect(result.isError()).toBe(true)
  if (result.isError()) {
    expect(CompactionError.is(result.error)).toBe(true)
    expect(result.error.cause).toBe(cause)
  }

  expect(client.requests).toHaveLength(1)
  expect(session.messages.slice(0, history.length)).toEqual(history)
  expect(session.transcript.some((message) => message.role === 'summary')).toBe(false)
})

describe.each(['false', 'true'])('caught API validation failures (QuickJS=%s)', (quickjs) => {
  afterEach(() => vi.unstubAllEnvs())
  test('retains missing tools, components, exit input, and object validation errors without failing a handled iteration', async () => {
    vi.stubEnv('USE_QUICKJS', quickjs)
    const client = new NativeClient([
      javascript(`
      try { missingTool(); } catch {}
      try { chat.doesNotExist(); } catch {}
      try { exit("done", {ok:42}); } catch {}
      try { account.age = "old"; } catch {}
      return exit("done", {ok:true});
    `),
    ])
    const result = await executeContext({
      client,
      exits: [done],
      objects: [
        new ObjectInstance({
          name: 'account',
          properties: [{ name: 'age', value: 30, type: z.number(), writable: true }],
        }),
      ],
    })
    expect(result.is(done)).toBe(true)
    expect(result.iteration!.exception).toBeUndefined()
    expect(result.iteration!.errors.map((error) => error.code)).toEqual([
      'UNKNOWN_TOOL',
      'UNKNOWN_COMPONENT',
      'INVALID_EXIT_INPUT',
      'INVALID_OBJECT_PROPERTY',
    ])
  })
})

test('a critical end-hook failure remains in iteration diagnostics and prevents the next model call', async () => {
  const error = new CompactionError('Cannot persist progress')
  const client = new NativeClient([javascript('return inspect(1);'), completed()])
  const result = await executeContext({
    client,
    exits: [done],
    onIterationEnd: () => {
      throw error
    },
  })
  expect(result.isError()).toBe(true)
  expect(result.iteration!.errors).toContain(error)
  expect(client.requests).toHaveLength(1)
})
