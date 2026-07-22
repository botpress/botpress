import { z } from '@bpinternal/zui'
import { describe, expect, test } from 'vitest'

import { Iteration, type IterationParameters } from '../context.js'
import { CodeExecutionError, SnapshotSignal } from '../errors.js'
import { Exit } from '../exit.js'
import { TranscriptArray } from '../transcript.js'
import { type VMExecutionResult } from '../types.js'
import { applyNextExit, interpretVMResult } from './interpret-result.js'

const makeIteration = (exits: Exit[] = [], variables: Record<string, any> = {}) =>
  new Iteration({
    id: 'iteration_1',
    messages: [],
    variables,
    parameters: {
      transcript: new TranscriptArray(),
      tools: [],
      objects: [],
      exits,
      instructions: undefined,
      components: [],
      model: 'best',
      temperature: 0.7,
    } satisfies IterationParameters,
  })

const successResult = (returnValue: unknown): VMExecutionResult => ({
  success: true,
  variables: {},
  lines_executed: [[1, 1]],
  return_value: returnValue,
})

describe('interpretVMResult', () => {
  test('a returned value with no ■next maps to thinking_requested', async () => {
    const iteration = makeIteration([], { previous: true })

    await interpretVMResult({
      iteration,
      result: successResult({ value: 1 }),
      controller: new AbortController(),
      startedAt: Date.now(),
    })

    expect(iteration.status).toMatchObject({
      type: 'thinking_requested',
      thinking_requested: {
        variables: { value: 1 },
        reason: 'Code execution completed',
      },
    })
  })

  test('a run with no return value maps to thinking_requested with the iteration variables', async () => {
    const iteration = makeIteration([], { previous: true })

    await interpretVMResult({
      iteration,
      result: successResult(undefined),
      controller: new AbortController(),
      startedAt: Date.now(),
    })

    expect(iteration.status).toMatchObject({
      type: 'thinking_requested',
      thinking_requested: {
        variables: { previous: true },
      },
    })
  })

  test('an unknown ■next exit maps to exit_error', async () => {
    const iteration = makeIteration([new Exit({ name: 'done', description: 'done' })])
    iteration.next = { name: 'missing', props: {} }

    await applyNextExit({ iteration, controller: new AbortController() })

    expect(iteration.status).toMatchObject({
      type: 'exit_error',
      exit_error: {
        exit: 'missing',
      },
    })
  })

  test('a valid ■next exit maps to exit_success', async () => {
    const done = new Exit({
      name: 'done',
      description: 'done',
      schema: z.object({ greeting: z.string() }),
    })
    const iteration = makeIteration([done])
    iteration.next = { name: 'done', props: { greeting: 'hello' } }

    await applyNextExit({ iteration, controller: new AbortController() })

    expect(iteration.status).toEqual({
      type: 'exit_success',
      exit_success: {
        exit_name: 'done',
        return_value: { greeting: 'hello' },
      },
    })
  })

  test('■next exit names are matched case-insensitively', async () => {
    const done = new Exit({ name: 'done', description: 'done' })
    const iteration = makeIteration([done])
    iteration.next = { name: 'DONE', props: {} }

    await applyNextExit({ iteration, controller: new AbortController() })

    expect(iteration.status).toMatchObject({
      type: 'exit_success',
      exit_success: { exit_name: 'done' },
    })
  })

  test('turns onExit failures into exit_error', async () => {
    const done = new Exit({ name: 'done', description: 'done' })
    const iteration = makeIteration([done])
    iteration.next = { name: 'done', props: {} }

    await applyNextExit({
      iteration,
      controller: new AbortController(),
      onExit: async () => {
        throw new Error('not allowed')
      },
    })

    expect(iteration.status).toMatchObject({
      type: 'exit_error',
      exit_error: {
        exit: 'done',
        message: 'Error executing exit done: not allowed',
      },
    })
  })

  test('maps SnapshotSignal to callback_requested', async () => {
    const iteration = makeIteration()
    const signal = new SnapshotSignal('pause')

    await interpretVMResult({
      iteration,
      result: {
        success: true,
        variables: {},
        signal,
        lines_executed: [[1, 1]],
      },
      controller: new AbortController(),
      startedAt: Date.now(),
    })

    expect(iteration.status).toEqual({
      type: 'callback_requested',
      callback_requested: {
        signal,
      },
    })
  })

  test('maps CodeExecutionError to execution_error', async () => {
    const iteration = makeIteration()
    const error = new CodeExecutionError('boom', 'await demo()', 'stack trace')

    await interpretVMResult({
      iteration,
      result: {
        success: false,
        variables: {},
        error,
        traces: [],
        lines_executed: [],
      },
      controller: new AbortController(),
      startedAt: Date.now(),
    })

    expect(iteration.status.type).toBe('execution_error')
    if (iteration.status.type === 'execution_error') {
      expect(iteration.status.execution_error.message).toContain('boom')
    }
  })

  test('■next combined with returning code is ignored (value shown instead)', async () => {
    const done = new Exit({ name: 'done', description: 'done' })
    const iteration = makeIteration([done])
    iteration.code = 'return { some: "value" }'
    iteration.next = { name: 'done', props: {} }

    await interpretVMResult({
      iteration,
      result: successResult({ some: 'value' }),
      controller: new AbortController(),
      startedAt: Date.now(),
    })

    expect(iteration.status).toMatchObject({
      type: 'thinking_requested',
      thinking_requested: {
        variables: { some: 'value' },
      },
    })
  })

  test('unwraps exit props mistakenly nested under a "props" key', async () => {
    const done = new Exit({
      name: 'done',
      description: 'done',
      schema: z.object({ ticketId: z.string() }),
    })
    const iteration = makeIteration([done])
    iteration.next = { name: 'done', props: { props: { ticketId: 'T-123' } } }

    await applyNextExit({ iteration, controller: new AbortController() })

    expect(iteration.status).toEqual({
      type: 'exit_success',
      exit_success: {
        exit_name: 'done',
        return_value: { ticketId: 'T-123' },
      },
    })
  })

  test('■next combined with side-effect-only code (no return keyword) is honored', async () => {
    const done = new Exit({ name: 'done', description: 'done' })
    const iteration = makeIteration([done])
    iteration.code = 'await simple()'
    iteration.next = { name: 'done', props: {} }

    await interpretVMResult({
      iteration,
      result: successResult(undefined),
      controller: new AbortController(),
      startedAt: Date.now(),
    })

    expect(iteration.status).toMatchObject({
      type: 'exit_success',
      exit_success: { exit_name: 'done' },
    })
  })

  test('■next=listen combined with returning code is ignored, even when the value is undefined', async () => {
    const listen = new Exit({ name: 'listen', description: 'listen' })
    const iteration = makeIteration([listen], { previous: true })
    iteration.code = 'const movie = movies.find(m => m.title.includes("x"))\nreturn movie'
    iteration.next = { name: 'listen', props: {} }

    await interpretVMResult({
      iteration,
      result: successResult(undefined),
      controller: new AbortController(),
      startedAt: Date.now(),
    })

    expect(iteration.status).toMatchObject({
      type: 'thinking_requested',
    })
  })

  test('local variables are surfaced when the code returns nothing', async () => {
    const iteration = makeIteration([])

    await interpretVMResult({
      iteration,
      result: {
        success: true,
        variables: { movies: [{ id: 'Matrix_1124' }], fn: '[[non-primitive]]' },
        lines_executed: [[1, 1]],
        return_value: undefined,
      },
      controller: new AbortController(),
      startedAt: Date.now(),
    })

    expect(iteration.status).toMatchObject({
      type: 'thinking_requested',
      thinking_requested: {
        variables: { movies: [{ id: 'Matrix_1124' }] },
      },
    })
  })
})
