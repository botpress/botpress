import { z } from '@bpinternal/zui'
import { describe, expect, test, vi } from 'vitest'

import { Iteration } from '../context.js'
import { HookError, ThinkSignal } from '../errors.js'
import { Tool } from '../tool.js'
import { wrapTool } from './tool-wrapper.js'

function createIteration() {
  return new Iteration({
    id: 'tool-test',
    parameters: {
      tools: [],
      objects: [],
      exits: [],
      components: new Map(),
      chatEnabled: false,
      model: 'test',
      temperature: 0,
    },
    systemMessage: { role: 'system', content: '' },
  })
}

describe('wrapTool', () => {
  test('does not start business work when cancelled during async input validation', async () => {
    let release!: () => void
    const blocked = new Promise<void>((resolve) => {
      release = resolve
    })
    const normalize = vi.fn(async (value: string) => {
      await blocked
      return value.trim()
    })
    const handler = vi.fn(async () => 'saved')
    const controller = new AbortController()
    const wrapped = wrapTool({
      tool: new Tool({ name: 'save', input: z.string().transform(normalize), handler }),
      iteration: createIteration(),
      controller,
    })
    const task = wrapped(' value ')
    await vi.waitFor(() => expect(normalize).toHaveBeenCalledOnce())
    controller.abort(new Error('Cancelled'))
    release()

    await expect(task).rejects.toThrow('Cancelled')
    expect(handler).not.toHaveBeenCalled()
  })

  test('mutates input and output through hooks while tracing original input', async () => {
    let originalInputName: string | undefined
    let calledInputName: string | undefined
    let afterHookInputName: string | undefined
    const iteration = createIteration()
    const traces = iteration.traces

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
    const iteration = createIteration()
    const traces = iteration.traces
    const tool = new Tool({
      name: 'fail',
      input: z.object({ value: z.string() }),
      handler: async () => {
        throw new Error('boom')
      },
    })

    const wrapped = wrapTool({
      tool,
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

  test.each(['before', 'after', 'after output'] as const)('rejects ThinkSignal from a %s hook', async (phase) => {
    const iteration = createIteration()
    const handler = vi.fn(async () => new ThinkSignal('Tool result', { secret: 'tool-value' }))
    const onThink = vi.fn()
    const signal = new ThinkSignal('Hook signal', { secret: 'hook-value' })
    const wrapped = wrapTool({
      tool: new Tool({ name: 'lookup', handler }),
      iteration,
      controller: new AbortController(),
      onThink,
      beforeHook:
        phase === 'before'
          ? () => {
              throw signal
            }
          : undefined,
      afterHook: async () => {
        if (phase === 'after') {
          throw signal
        }

        if (phase === 'after output') {
          return { output: signal }
        }

        return undefined
      },
    })
    await expect(wrapped(undefined)).rejects.toSatisfy(HookError.is)
    expect(handler).toHaveBeenCalledTimes(phase === 'before' ? 0 : 1)
    expect(onThink).not.toHaveBeenCalled()
    expect(iteration.traces).toMatchObject([{ type: 'tool_call', success: false, output: undefined }])
    expect(JSON.stringify(iteration.traces)).not.toContain('tool-value')
    expect(JSON.stringify(iteration.traces)).not.toContain('hook-value')
  })

  test('does not publish a ThinkSignal result rejected by the output hook', async () => {
    const iteration = createIteration()
    const onThink = vi.fn()
    const onResult = vi.fn()
    const wrapped = wrapTool({
      tool: new Tool({
        name: 'lookup',
        handler: async () => {
          throw new ThinkSignal('Inspect', { secret: 'withheld' })
        },
      }),
      iteration,
      controller: new AbortController(),
      onThink,
      onResult,
      afterHook: () => {
        throw new Error('Output rejected')
      },
    })
    await expect(wrapped(undefined)).rejects.toThrow('Output rejected')
    expect(onThink).not.toHaveBeenCalled()
    expect(onResult).not.toHaveBeenCalled()
    expect(iteration.traces).toMatchObject([{ type: 'tool_call', success: false, output: undefined }])
    expect(JSON.stringify(iteration.traces)).not.toContain('withheld')
  })

  test('traces ThinkSignal as successful and returns its context', async () => {
    const iteration = createIteration()
    const traces = iteration.traces
    const signal = new ThinkSignal('need context', { value: 1 })
    const tool = new Tool({
      name: 'thinker',
      handler: async () => {
        throw signal
      },
    })

    const wrapped = wrapTool({
      tool,
      iteration,
      controller: new AbortController(),
    })

    await expect(wrapped(undefined)).resolves.toEqual({ value: 1 })
    expect(traces.map((trace) => trace.type)).toEqual(['think_signal', 'tool_call'])
    expect(traces[1]).toMatchObject({
      type: 'tool_call',
      tool_name: 'thinker',
      output: { value: 1 },
      success: true,
    })
  })
})
