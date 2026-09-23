import { z } from '@bpinternal/zui'
import { describe, expect, test } from 'vitest'

import { Iteration } from '../context.js'
import { SnapshotSignal, ThinkSignal } from '../errors.js'
import { Tool } from '../tool.js'
import { type Trace } from '../types.js'
import { wrapTool } from './tool-wrapper.js'

const iteration = {} as Iteration

describe('wrapTool', () => {
  test('mutates input and output through hooks while tracing original input', async () => {
    let originalInputName: string | undefined
    let calledInputName: string | undefined
    let afterHookInputName: string | undefined
    const traces: Trace[] = []

    const tool = new Tool({
      name: 'greeting',
      input: z.object({ name: z.string() }),
      output: z.string(),
      handler: async ({ name }) => {
        calledInputName = name
        return `Hi ${name}`
      },
    })

    const wrapped = wrapTool({
      tool,
      traces,
      iteration,
      controller: new AbortController(),
      beforeHook: async ({ input }) => {
        originalInputName = input.name
        return { input: { name: 'Jacques' } }
      },
      afterHook: async ({ input, output }) => {
        afterHookInputName = input.name
        return { output: output.toUpperCase() }
      },
    })

    await expect(wrapped({ name: 'Alice' })).resolves.toBe('HI JACQUES')

    expect(originalInputName).toBe('Alice')
    expect(calledInputName).toBe('Jacques')
    expect(afterHookInputName).toBe('Jacques')
    expect(traces).toMatchObject([
      {
        type: 'tool_call',
        tool_name: 'greeting',
        input: { name: 'Alice' },
        output: 'HI JACQUES',
        success: true,
      },
    ])
  })

  test('traces failed tool calls', async () => {
    const traces: Trace[] = []
    const tool = new Tool({
      name: 'fail',
      input: z.object({ value: z.string() }),
      handler: async () => {
        throw new Error('boom')
      },
    })

    const wrapped = wrapTool({
      tool,
      traces,
      iteration,
      controller: new AbortController(),
    })

    await expect(wrapped({ value: 'x' })).rejects.toThrow('boom')
    expect(traces).toHaveLength(1)
    expect(traces[0]).toMatchObject({
      type: 'tool_call',
      tool_name: 'fail',
      input: { value: 'x' },
      success: false,
    })
    expect((traces[0] as any).error).toBeInstanceOf(Error)
  })

  test('traces ThinkSignal as successful and rethrows it', async () => {
    const traces: Trace[] = []
    const signal = new ThinkSignal('need context', { value: 1 })
    const tool = new Tool({
      name: 'thinker',
      handler: async () => {
        throw signal
      },
    })

    const wrapped = wrapTool({
      tool,
      traces,
      iteration,
      controller: new AbortController(),
    })

    await expect(wrapped(undefined)).rejects.toBe(signal)
    expect(traces.map((trace) => trace.type)).toEqual(['think_signal', 'tool_call'])
    expect(traces[1]).toMatchObject({
      type: 'tool_call',
      tool_name: 'thinker',
      output: signal,
      success: true,
    })
  })

  test('adds tool call metadata to SnapshotSignal', async () => {
    const traces: Trace[] = []
    const signal = new SnapshotSignal('pause')
    const tool = new Tool({
      name: 'payment',
      input: z.object({ amount: z.number() }),
      output: z.object({ paymentIntentId: z.string() }),
      handler: async () => {
        throw signal
      },
    })

    const wrapped = wrapTool({
      tool,
      traces,
      iteration,
      controller: new AbortController(),
    })

    await expect(wrapped({ amount: 10 })).rejects.toBe(signal)
    expect(signal.toolCall).toEqual({
      name: 'payment',
      inputSchema: tool.input,
      outputSchema: tool.output,
      input: { amount: 10 },
    })
    expect(traces).toMatchObject([
      {
        type: 'tool_call',
        tool_name: 'payment',
        input: { amount: 10 },
        error: signal,
        success: false,
      },
    ])
  })
})
