import { Cognitive, Model } from '@botpress/cognitive'
import { describe, expect, test, vi } from 'vitest'
import { Context } from './context.js'
import { executeContext } from './runtime/execute.js'
import { ErrorExecutionResult } from './result.js'
import { CognitiveError } from './errors.js'

const makeFakeModel = (model: string): Model => ({
  id: model,
  name: 'Fake Model',
  description: 'A fake model for testing',
  input: { maxTokens: 8192, costPer1MTokens: 0 },
  output: { maxTokens: 2048, costPer1MTokens: 0 },
  tags: [],
  lifecycle: 'production',
})

/**
 * Branded non-streaming Cognitive mock. Plain object rather than a subclass:
 * subclassing the real Cognitive would inherit `generateTextStream` and route
 * the runtime through the streaming path (and the network).
 */
const makeCognitive = (generateText: (input: any, options?: any) => Promise<never>): Cognitive =>
  ({
    ['$$IS_COGNITIVE_BETA']: 'v2',
    getModelDetails: async (model: string) => makeFakeModel(model),
    generateText,
  }) as unknown as Cognitive

test('executeContext should early exit when cognitive service is unreachable', async () => {
  const err = new Error('Simulated connection error')
  const cognitive = makeCognitive(async () => {
    throw err
  })

  const output = await executeContext({ client: cognitive, options: { loop: 5 } })

  expect(output.status).toBe('error')
  expect(output.iterations.length).toBe(1)
  expect((output as ErrorExecutionResult).error).toBeInstanceOf(CognitiveError)
  expect(((output as ErrorExecutionResult).error as Error).message).toContain(err.message)
})

test('executeContext prefers the streaming path when the client exposes generateTextStream', async () => {
  const generateText = vi.fn().mockRejectedValue(new Error('v2 boom'))
  // like the real client, the stream is an async generator: the error surfaces
  // on the first next() call, not at invocation time
  const generateTextStream = vi.fn(async function* (): AsyncGenerator<never, void, unknown> {
    throw new Error('v2 boom')
  })
  const getModelDetails = vi.fn().mockImplementation(async (model: string) => makeFakeModel(model))

  const cognitive = {
    ['$$IS_COGNITIVE_BETA']: 'v2',
    generateText,
    getModelDetails,
    generateTextStream,
  } as unknown as Cognitive

  expect(Cognitive.isCognitiveClient(cognitive)).toBe(true)

  const output = await executeContext({ client: cognitive, options: { loop: 5 } })

  // Reaching generateTextStream proves the streaming path was taken (model
  // details resolved without throwing, then streaming generation attempted).
  expect(generateTextStream).toHaveBeenCalled()
  expect(generateText).not.toHaveBeenCalled()
  expect(output.status).toBe('error')
  expect((output as ErrorExecutionResult).error).toBeInstanceOf(CognitiveError)
  expect(((output as ErrorExecutionResult).error as Error).message).toContain('v2 boom')
})

test('executeContext does not execute an iteration after onIterationStart throws', async () => {
  let generated = false

  const cognitive = makeCognitive(async () => {
    generated = true
    throw new Error('should not generate content')
  })

  const onIterationEnd = vi.fn()
  const output = await executeContext({
    client: cognitive,
    options: { loop: 1 },
    onIterationStart: () => {
      throw new Error('start hook boom')
    },
    onIterationEnd,
  })

  expect(generated).toBe(false)
  expect(onIterationEnd).toHaveBeenCalledTimes(1)
  expect(output.iterations).toHaveLength(1)
  expect(output.iterations[0]!.status.type).toBe('execution_error')
  if (output.iterations[0]!.status.type === 'execution_error') {
    expect(output.iterations[0]!.status.execution_error.message).toContain('start hook boom')
  }
})

test('executeContext calls onIterationEnd when onIterationStart aborts', async () => {
  let generated = false

  const cognitive = makeCognitive(async () => {
    generated = true
    throw new Error('should not generate content')
  })

  const onIterationEnd = vi.fn()
  const output = await executeContext({
    client: cognitive,
    options: { loop: 1 },
    onIterationStart: (_iteration, controller) => {
      controller.abort('ABORTED')
    },
    onIterationEnd,
  })

  expect(generated).toBe(false)
  expect(onIterationEnd).toHaveBeenCalledTimes(1)
  expect(output.iterations).toHaveLength(1)
  expect(output.iterations[0]!.status.type).toBe('aborted')
  expect((output as ErrorExecutionResult).error).toBe('ABORTED')
})

test('executeContext calls onIterationEnd when LLM generation aborts', async () => {
  const controller = new AbortController()

  const cognitive = makeCognitive(async () => {
    controller.abort('ABORTED')
    throw new Error('generation aborted')
  })

  const onIterationEnd = vi.fn()
  const output = await executeContext({
    client: cognitive,
    options: { loop: 1 },
    signal: controller.signal,
    onIterationEnd,
  })

  expect(onIterationEnd).toHaveBeenCalledTimes(1)
  expect(output.iterations).toHaveLength(1)
  expect(output.iterations[0]!.status.type).toBe('aborted')
  expect((output as ErrorExecutionResult).error).toBe('ABORTED')
})

test('executeContext forwards metadata to cognitive generation', async () => {
  let capturedInput: { meta?: { metadata?: Record<string, string> } } | undefined

  const cognitive = makeCognitive(async (input) => {
    capturedInput = input as typeof capturedInput
    throw new Error('stop after capture')
  })

  await executeContext({
    client: cognitive,
    options: { loop: 1 },
    metadata: { conversationId: 'conv-123', workflowId: 'wf-456' },
  })

  expect(capturedInput?.meta?.metadata).toEqual({ conversationId: 'conv-123', workflowId: 'wf-456' })
})

describe('reasoningEffort', () => {
  test('reasoningEffort is available on iteration and in toJSON', async () => {
    const ctx = new Context({ reasoningEffort: 'low' })
    const iteration = await ctx.nextIteration()

    expect(iteration.reasoningEffort).toBe('low')

    const json = iteration.toJSON()
    expect(json.reasoningEffort).toBe('low')
  })

  test('reasoningEffort is undefined on iteration when not set', async () => {
    const ctx = new Context({})
    const iteration = await ctx.nextIteration()

    expect(iteration.reasoningEffort).toBeUndefined()

    const json = iteration.toJSON()
    expect(json.reasoningEffort).toBeUndefined()
  })
})
