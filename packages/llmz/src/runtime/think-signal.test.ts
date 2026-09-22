import { z } from '@bpinternal/zui'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { Exit, ThinkSignal, Tool, InvalidConfigurationError, ObjectInstance, type ExecutionResult } from '../index.js'
import { executeContext } from './execute.js'
import { NativeClient, javascript } from './fixtures/native-client.js'

// Proposed contract: tool ThinkSignals are successful values plus a mandatory
// inspection, not exceptions that interrupt assignments or sibling operations.
const evidence = { product: 'bananas', collection: 'Dock 7' }
const reason = 'Review the pickup location before answering.'
const done = new Exit({ name: 'done', description: 'Finish after reviewing the evidence.', schema: z.string() })
const finish = javascript('return exit("done", "reviewed");')

function search(delivery: 'thrown' | 'returned', context: unknown = evidence) {
  const handler = vi.fn(async () => {
    const signal = new ThinkSignal(reason, context)
    if (delivery === 'thrown') {
      throw signal
    }

    return signal
  })
  return { handler, tool: new Tool({ name: 'search', handler }) }
}

function feedback(client: NativeClient): string {
  const message = client.requests[1]?.messages
    .slice()
    .reverse()
    .find((message) => message.type === 'tool_result')
  expect.soft(message, 'The second model turn must receive the settled execution report').toBeDefined()
  return String(message?.content ?? '').split('\n\n<runtime-memory>')[0]!
}

function expectSuccessfulInspection(result: ExecutionResult, client: NativeClient) {
  expect.soft(result.is(done)).toBe(true)
  expect.soft(client.requests).toHaveLength(2)
  expect.soft(result.iterations[0]?.status.type).toBe('thinking_requested')
  expect.soft(result.session.pendingCalls).toEqual([])
  const report = feedback(client)
  expect.soft(report).toMatch(/forced inspection/i)
  expect.soft(report).toContain('This is the equivalent of an inspect() call.')
  expect.soft(report).toMatch(/do not (?:repeat|re-?run|call .* again)/i)
  expect.soft(report).not.toContain('interrupted; pending')
  expect.soft(report).not.toContain('Not produced; execution did not complete an inspection.')
  expect.soft(report).not.toContain('result is not initialized')
  return report
}

describe.each([
  { name: 'Node', quickjs: 'false' },
  { name: 'QuickJS', quickjs: 'true' },
])('ThinkSignal forced inspection ($name)', ({ quickjs }) => {
  beforeEach(() => vi.stubEnv('USE_QUICKJS', quickjs))
  afterEach(() => vi.unstubAllEnvs())

  test.each(['thrown', 'returned'] as const)(
    '%s signals return their context and retain the assigned value',
    async (delivery) => {
      const { handler, tool } = search(delivery)
      const client = new NativeClient([
        javascript('const result = await search(); const collection = result.collection; return inspect(result);'),
        javascript('return exit("done", result.collection);'),
      ])
      const result = await executeContext({ client, tools: [tool], exits: [done], options: { loop: 2 } })

      expectSuccessfulInspection(result, client)
      expect.soft(handler).toHaveBeenCalledOnce()
      expect.soft(result.output).toBe('Dock 7')
      expect.soft(result.session.memory.variables).toMatchObject({ result: evidence, collection: 'Dock 7' })
      expect.soft(result.iterations[0]?.errors).toEqual([])
      expect
        .soft(
          result.session.iterations.some(
            (entry) => entry.hasResult && JSON.stringify(entry.result) === JSON.stringify(evidence)
          )
        )
        .toBe(true)
      const call = result.iterations[0]?.traces.find((trace) => trace.type === 'tool_call')
      expect.soft(call).toMatchObject({ success: true, output: evidence })
      expect.soft(feedback(client)).toContain(reason)
      expect.soft(feedback(client)).toContain('Dock 7')
    }
  )

  test.each(
    [
      { ending: 'explicit inspection', code: 'return inspect({ note: "also inspect this" });' },
      { ending: 'valid exit', code: 'return exit("done", "premature");' },
      { ending: 'invalid exit payload', code: 'return exit("done", 123);' },
      { ending: 'unknown exit', code: 'return exit("missing");' },
      { ending: 'later code error', code: 'throw new Error("later calculation failed");' },
      { ending: 'implicit return', code: '' },
    ].flatMap((scenario) => (['thrown', 'returned'] as const).map((delivery) => ({ ...scenario, delivery })))
  )('forces inspection for $delivery signals despite $ending, deferring all exit hooks', async ({ code, delivery }) => {
    const { tool, handler } = search(delivery)
    const onExit = vi.fn()
    const client = new NativeClient([
      javascript(`const result = await search(); const continued = true; ${code}`),
      finish,
    ])
    const result = await executeContext({ client, tools: [tool], exits: [done], onExit, options: { loop: 2 } })

    const report = expectSuccessfulInspection(result, client)
    expect.soft(result.output).toBe('reviewed')
    expect.soft(handler).toHaveBeenCalledOnce()
    expect.soft(result.session.memory.variables).toMatchObject({ result: evidence, continued: true })
    expect.soft(onExit).toHaveBeenCalledOnce()
    expect.soft(onExit.mock.calls[0]?.[0].result).toBe('reviewed')
    expect.soft(report).toContain('Dock 7')
    expect.soft(report).toContain(reason)
    if (code.includes('also inspect this')) {
      expect.soft(report).toContain('also inspect this')
    }

    if (code.includes('later calculation failed')) {
      // An actual downstream error remains visible; it must not recast the
      // successful search as failed or prevent its evidence from being inspected.
      expect.soft(report).toContain('later calculation failed')
      expect.soft(result.iterations[0]?.errors.length).toBeGreaterThan(0)
    }
  })

  test.each([
    { order: 'sequential', secondDelivery: 'thrown' },
    { order: 'parallel', secondDelivery: 'thrown' },
    { order: 'sequential', secondDelivery: 'returned' },
    { order: 'parallel', secondDelivery: 'returned' },
  ])(
    'collects multiple $order signals (second $secondDelivery) and ordinary results in one iteration',
    async ({ order, secondDelivery }) => {
      const events: string[] = []
      const first = vi.fn(async () => {
        events.push('first')
        throw new ThinkSignal('Read the stock result.', { stock: 4 })
      })
      const second = vi.fn(async () => {
        // Settle later than the first signal to catch premature iteration closure.
        await new Promise<void>((resolve) => setImmediate(resolve))
        events.push('second')
        const signal = new ThinkSignal('Read the pickup result.', { pickup: 'Dock 7' })
        if (secondDelivery === 'thrown') {
          throw signal
        }

        return signal
      })
      const ordinary = vi.fn(async () => {
        events.push('ordinary')
        return { receipt: 'receipt-42' }
      })
      const calls =
        order === 'parallel'
          ? 'const results = await Promise.all([\n  first(),\n  second(),\n  ordinary()\n]);'
          : 'const results = [\n  await first(),\n  await second(),\n  await ordinary()\n];'
      const client = new NativeClient([
        javascript(`${calls} const continued = true; return inspect({ note: "all calls settled" });`),
        finish,
      ])
      const result = await executeContext({
        client,
        tools: [
          new Tool({ name: 'first', handler: first }),
          new Tool({ name: 'second', handler: second }),
          new Tool({ name: 'ordinary', handler: ordinary }),
        ],
        exits: [done],
        options: { loop: 2 },
        onIterationStart: () => {
          if (client.requests.length === 1) {
            events.push('next generation')
          }
        },
      })

      const report = expectSuccessfulInspection(result, client)
      expect.soft(first).toHaveBeenCalledOnce()
      expect.soft(second).toHaveBeenCalledOnce()
      expect.soft(ordinary).toHaveBeenCalledOnce()
      expect.soft(events.at(-1)).toBe('next generation')
      expect.soft(result.session.memory.variables).toMatchObject({
        results: [{ stock: 4 }, { pickup: 'Dock 7' }, { receipt: 'receipt-42' }],
        continued: true,
      })
      expect.soft(result.iterations[0]?.errors).toEqual([])
      expect.soft(result.iterations[0]?.traces.filter((trace) => trace.type === 'tool_call')).toHaveLength(3)
      for (const value of ['Read the stock result.', 'Read the pickup result.', 'Dock 7', 'all calls settled']) {
        expect.soft(report).toContain(value)
      }

      // Attribute every signal to its original JavaScript call site, even when
      // promises settle out of order. Ordinary tools must not be listed here.
      const section = report.match(/<forced_inspection>[\s\S]*?<\/forced_inspection>/)?.[0] ?? ''
      const firstEntry = section.match(/<tool name="first" line="2">[\s\S]*?<\/tool>/)?.[0] ?? ''
      const secondEntry = section.match(/<tool name="second" line="3">[\s\S]*?<\/tool>/)?.[0] ?? ''
      expect.soft(firstEntry).toContain('<reason>Read the stock result.</reason>')
      expect.soft(firstEntry).toContain('"stock": 4')
      expect.soft(firstEntry).not.toContain('Dock 7')
      expect.soft(secondEntry).toContain('<reason>Read the pickup result.</reason>')
      expect.soft(secondEntry).toContain('"pickup": "Dock 7"')
      expect.soft(secondEntry).not.toContain('"stock"')
      expect.soft(section).not.toContain('name="ordinary"')
    }
  )

  test('a thrown signal resolves normally through catch/finally and nested async helpers', async () => {
    const { tool, handler } = search('thrown')
    const client = new NativeClient([
      javascript(`
        let caught = false;
        let finalized = false;
        async function load() {
          try { return await search(); }
          catch { caught = true; return {}; }
          finally { finalized = true; }
        }
        const result = await load();
        const continued = true;
        return inspect(result);
      `),
      finish,
    ])
    const result = await executeContext({ client, tools: [tool], exits: [done], options: { loop: 2 } })
    expectSuccessfulInspection(result, client)
    expect.soft(handler).toHaveBeenCalledOnce()
    expect.soft(result.session.memory.variables).toMatchObject({
      result: evidence,
      caught: false,
      finalized: true,
      continued: true,
    })
    expect.soft(result.iterations[0]?.errors).toEqual([])
  })

  test('retains both results and reasons from repeated calls to the same signaling tool', async () => {
    const handler = vi.fn(async ({ item }: { item: string }) => {
      throw new ThinkSignal(`Review ${item}.`, { item, location: item === 'bananas' ? 'Dock 7' : 'Dock 9' })
    })
    const client = new NativeClient([
      javascript(
        'const results = await Promise.all([search({ item: "bananas" }), search({ item: "apples" })]); return exit("done", "premature");'
      ),
      finish,
    ])
    const result = await executeContext({
      client,
      tools: [new Tool({ name: 'search', input: z.object({ item: z.string() }), handler })],
      exits: [done],
      options: { loop: 2 },
    })
    const report = expectSuccessfulInspection(result, client)
    expect.soft(handler).toHaveBeenCalledTimes(2)
    expect.soft(result.session.memory.variables.results).toEqual([
      { item: 'bananas', location: 'Dock 7' },
      { item: 'apples', location: 'Dock 9' },
    ])
    const section = report.match(/<forced_inspection>[\s\S]*?<\/forced_inspection>/)?.[0] ?? ''
    const entries = section.match(/<tool name="search" line="1">[\s\S]*?<\/tool>/g) ?? []
    expect.soft(entries).toHaveLength(2)
    for (const [item, location] of [
      ['bananas', 'Dock 7'],
      ['apples', 'Dock 9'],
    ]) {
      const entry = entries.find((entry) => entry.includes(`<reason>Review ${item}.</reason>`)) ?? ''
      expect.soft(entry).toContain(`"item": "${item}"`)
      expect.soft(entry).toContain(`"location": "${location}"`)
    }
  })

  test('retains the inspected tool result even when guest code mutates its local copy', async () => {
    const { tool } = search('thrown', { collection: 'Dock 7' })
    const client = new NativeClient([
      javascript(
        'const result = await search(); result.collection = "changed locally"; return exit("done", "premature");'
      ),
      finish,
    ])
    const result = await executeContext({ client, tools: [tool], exits: [done], options: { loop: 2 } })
    const report = expectSuccessfulInspection(result, client)
    const section = report.match(/<forced_inspection>[\s\S]*?<\/forced_inspection>/)?.[0] ?? ''
    expect(section).toContain('Dock 7')
    expect(section).not.toContain('changed locally')
    expect(result.session.memory.variables.result).toEqual({ collection: 'changed locally' })
  })

  test('uses effective hook output in forced inspection without exposing redacted evidence', async () => {
    const { tool } = search('returned', { secret: 'private-value', stock: 4 })
    const onAfterTool = vi.fn(async () => ({ output: { stock: 4 } }))
    const client = new NativeClient([javascript('const result = await search(); return inspect(result);'), finish])
    const result = await executeContext({ client, tools: [tool], exits: [done], options: { loop: 2 }, onAfterTool })
    expectSuccessfulInspection(result, client)
    expect(onAfterTool).toHaveBeenCalledOnce()
    expect(JSON.stringify(client.requests[1])).not.toContain('private-value')
    expect(result.session.memory.variables.result).toEqual({ stock: 4 })
  })

  test.each(['thrown', 'returned'] as const)(
    'withholds a %s signal when the output hook rejects it',
    async (delivery) => {
      const { tool } = search(delivery, { secret: 'REJECTED_EVIDENCE' })
      const client = new NativeClient([javascript('const result = await search(); return inspect(result);'), finish])
      const result = await executeContext({
        client,
        tools: [tool],
        exits: [done],
        options: { loop: 2 },
        onAfterTool: () => {
          throw new Error('Output policy rejected this result.')
        },
      })
      expect(result.is(done)).toBe(true)
      expect(result.iterations[0]?.status.type).toBe('execution_error')
      expect(result.iterations[0]?.traces.some((trace) => trace.type === 'think_signal')).toBe(false)
      expect(feedback(client)).not.toContain('<forced_inspection>')
      expect(JSON.stringify(client.requests[1])).not.toContain('REJECTED_EVIDENCE')
      expect(JSON.stringify(result.session.memory.variables)).not.toContain('REJECTED_EVIDENCE')
    }
  )

  test.each(['critical error', 'cancellation'] as const)(
    'never overrides %s with forced inspection',
    async (failure) => {
      const { tool } = search('returned')
      const controller = new AbortController()
      const onExit = vi.fn()
      const stop = new Tool({
        name: 'stop',
        handler: async () => {
          if (failure === 'critical error') {
            throw new InvalidConfigurationError('Stop execution completely.')
          }

          controller.abort(new Error('Cancelled by the caller.'))
        },
      })
      const client = new NativeClient([
        javascript('await search(); try { await stop(); } catch {} return exit("done", "premature");'),
        finish,
      ])
      const result = await executeContext({
        client,
        tools: [tool, stop],
        exits: [done],
        signal: controller.signal,
        onExit,
      })
      expect(result.isError()).toBe(true)
      expect(client.requests).toHaveLength(1)
      expect(onExit).not.toHaveBeenCalled()
    }
  )

  test('attributes scoped tool calls inside helpers to the executed override source', async () => {
    const scoped = new ObjectInstance({
      name: 'Catalog',
      tools: [
        new Tool({
          name: 'search',
          handler: async () => {
            throw new ThinkSignal('Review stock.', { stock: 4 })
          },
        }),
      ],
    })
    const client = new NativeClient([javascript('return exit("done", "premature");'), finish])
    let executions = 0
    const result = await executeContext({
      client,
      objects: [scoped],
      exits: [done],
      options: { loop: 2 },
      onBeforeExecution: async () => {
        if (++executions === 1) {
          return {
            code: 'async function load() {\n  return await Catalog.search();\n}\nconst result = await load();\nreturn inspect(result);',
          }
        }

        return undefined
      },
    })
    const report = expectSuccessfulInspection(result, client)
    expect(report).toContain('<tool name="Catalog.search" line="2">')
    expect(result.session.memory.variables.result).toEqual({ stock: 4 })
  })

  test('joins a signal that arrives after an attempted exit before applying any exit hook', async () => {
    const handler = vi.fn(async () => {
      await new Promise<void>((resolve) => setImmediate(resolve))
      throw new ThinkSignal(reason, evidence, { source: 'catalog' })
    })
    const onExit = vi.fn()
    const client = new NativeClient([javascript('void search(); return exit("done", "premature");'), finish])
    const result = await executeContext({
      client,
      tools: [new Tool({ name: 'search', handler })],
      exits: [done],
      options: { loop: 2 },
      onExit,
    })
    expectSuccessfulInspection(result, client)
    expect(handler).toHaveBeenCalledOnce()
    expect(onExit).toHaveBeenCalledOnce()
    expect(onExit.mock.calls[0]?.[0].result).toBe('reviewed')
    expect(result.iterations[0]?.status).toMatchObject({
      type: 'thinking_requested',
      thinking_requested: { metadata: { source: 'catalog' } },
    })
    expect(result.iterations[0]?.traces.find((trace) => trace.type === 'think_signal')).toMatchObject({
      tool_name: 'search',
      line: 1,
      reason,
      context: evidence,
      metadata: { source: 'catalog' },
    })
  })

  test.each([undefined, null, false, 0, ''])('forces inspection even when context is %j', async (context) => {
    // Pass the context directly: undefined must remain a reason-only signal.
    const handler = vi.fn(async () => new ThinkSignal(reason, context))
    const client = new NativeClient([
      javascript('const result = await search(); return exit("done", "premature");'),
      finish,
    ])
    const result = await executeContext({
      client,
      tools: [new Tool({ name: 'search', handler })],
      exits: [done],
      options: { loop: 2 },
    })
    expectSuccessfulInspection(result, client)
    expect.soft(result.session.memory.variables.result).toEqual(context)
    expect.soft(handler).toHaveBeenCalledOnce()
    expect.soft(feedback(client)).toContain(reason)
  })
})

test('the next-turn prompt explicitly distinguishes forced inspection from failure', async () => {
  let section: string | undefined
  try {
    for (const quickjs of ['false', 'true']) {
      vi.stubEnv('USE_QUICKJS', quickjs)
      const { tool } = search('thrown')
      const client = new NativeClient([javascript('const result = await search(); return inspect(result);'), finish])
      const result = await executeContext({ client, tools: [tool], exits: [done], options: { loop: 2 } })
      expectSuccessfulInspection(result, client)

      // Proposed model-facing contract. Keep this short section together so its
      // wording can be reviewed before implementing the new runtime behavior.
      const current = feedback(client).match(/<forced_inspection>[\s\S]*?<\/forced_inspection>/)?.[0]
      if (section !== undefined) {
        expect(current).toBe(section)
      }

      section = current
    }
  } finally {
    vi.unstubAllEnvs()
  }

  expect(section).toMatchInlineSnapshot(`
      "<forced_inspection>
      Forced inspection: the tools listed below completed successfully and requested review of their results.
      This is the equivalent of an inspect() call. Do not repeat these tool calls; use the results below and retained variables.
      No exit was applied. Review the evidence before continuing or completing the task.

      Tools requesting inspection (lines refer to the executed JavaScript):
      <tool name="search" line="1">
      <reason>Review the pickup location before answering.</reason>
      <result>
      // Object Preview
      --------------
      {
        "product": "bananas",
        "collection": "Dock 7"
      }
      </result>
      </tool>
      </forced_inspection>"
    `)
})
