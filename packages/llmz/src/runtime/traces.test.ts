import { z } from '@bpinternal/zui'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Exit } from '../exit.js'
import { ObjectInstance } from '../objects.js'
import { Tool } from '../tool.js'
import type { Trace } from '../types.js'
import { executeContext } from './execute.js'
import { NativeClient, javascript } from './fixtures/native-client.js'

const done = new Exit({ name: 'done', description: 'Complete the work', schema: z.object({}) })

describe.each(['true', 'false'])('runtime traces (QuickJS=%s)', (quickJS) => {
  beforeEach(() => vi.stubEnv('USE_QUICKJS', quickJS))
  afterEach(() => vi.unstubAllEnvs())

  it('delivers every trace once, in order, with its owning iteration', async () => {
    const events: { trace: Trace; iteration: number }[] = []
    const account = new ObjectInstance({
      name: 'account',
      properties: [{ name: 'name', value: 'before', type: z.string(), writable: true }],
    })
    const operation = vi.fn(async () => {
      // Logs are observed while the program is running, before its next host call.
      expect(events.some(({ trace }) => trace.type === 'log')).toBe(true)
      return 'after'
    })
    const result = await executeContext({
      client: new NativeClient([
        javascript('console.log("starting"); account.name = await operation(); throw new Error("retry");'),
        javascript('return exit("done", {});'),
      ]),
      tools: [new Tool({ name: 'operation', handler: operation })],
      objects: [account],
      exits: [done],
      onTrace: ({ trace, iteration }) => events.push({ trace, iteration }),
    })

    expect(result.isSuccess()).toBe(true)
    expect(operation).toHaveBeenCalledOnce()
    expect(events).toEqual(
      result.iterations.flatMap((iteration, index) =>
        iteration.traces.map((trace) => ({ trace, iteration: index + 1 }))
      )
    )
    expect(events.map(({ trace }) => trace.type)).toEqual(
      expect.arrayContaining([
        'llm_call_started',
        'llm_call_success',
        'log',
        'tool_call',
        'property',
        'code_execution_exception',
        'code_execution',
      ])
    )
    for (const iteration of result.iterations) {
      expect(Object.getPrototypeOf(iteration.traces)).toBe(Array.prototype)
      expect(iteration.toJSON().traces).toEqual(iteration.traces)
    }

    const count = events.length
    result.iterations[0]!.recordTrace({ type: 'log', message: 'after execution', args: [], started_at: 0 })
    expect(events).toHaveLength(count)
  })

  it('honors a live trace observer abort before the next business tool', async () => {
    const operation = vi.fn()
    const result = await executeContext({
      client: new NativeClient([javascript('console.log("stop"); await operation(); return exit("done", {});')]),
      tools: [new Tool({ name: 'operation', handler: operation })],
      exits: [done],
      onTrace: ({ trace, controller }) => {
        if (trace.type === 'log') {
          controller.abort('Stopped by observer')
        }
      },
    })

    expect(result.isError()).toBe(true)
    expect(operation).not.toHaveBeenCalled()
    expect(result.iterations[0]?.traces.some((trace) => trace.type === 'log')).toBe(true)
    expect(result.session.pendingCalls).toEqual([])
  })

  it('retains traces and successful work when the observer throws', async () => {
    const observer = vi.fn(() => {
      throw new Error('Observer failed')
    })
    const operation = vi.fn(async () => true)
    const result = await executeContext({
      client: new NativeClient([javascript('await operation(); return exit("done", {});')]),
      tools: [new Tool({ name: 'operation', handler: operation })],
      exits: [done],
      onTrace: observer,
    })

    expect(result.isSuccess()).toBe(true)
    expect(operation).toHaveBeenCalledOnce()
    expect(observer).toHaveBeenCalledTimes(result.iterations[0]!.traces.length)
    expect(result.iterations[0]?.traces.find((trace) => trace.type === 'tool_call')).toMatchObject({ success: true })
  })
})
