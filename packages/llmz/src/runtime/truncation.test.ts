import { z } from '@bpinternal/zui'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { ThinkSignal } from '../errors.js'
import { Exit } from '../exit.js'
import { truncate } from '../index.js'
import type { InspectEvent, OnInspect } from '../inspection.js'
import { Session } from '../session/session.js'
import { Tool } from '../tool.js'
import { getTokenizer } from '../utils.js'
import { executeContext } from './execute.js'
import { NativeClient, javascript } from './fixtures/native-client.js'
import type { ExecutionProps } from './types.js'

const done = new Exit({
  name: 'done',
  description: 'Complete after checking the displayed evidence.',
  schema: z.object({ value: z.unknown() }),
})

function document(name: string): string {
  return [
    `# ${name}\n\nThe source below is retained in full for JavaScript.`,
    ...Array.from(
      { length: 300 },
      (_, index) =>
        `## Passage ${index + 1}\n\nKeep the original invoice and confirm the payment date before requesting a refund review.`
    ),
    `LATE_${name.toUpperCase()}_EVIDENCE: billing approval is required.`,
  ].join('\n\n')
}

const rag = document('rag')
const plain = document('plain')

function nextInspection(client: NativeClient): string {
  const feedback = client.requests[1]!.messages.filter((message) => message.type === 'tool_result').at(-1)
  const report = String(feedback?.content).split('\n\n<runtime-memory>\n')[0]!

  expect(report).toMatch(/^run_javascript: succeeded/)
  expect(report).toContain('inspect() result\n')

  return report.split('inspect() result\n')[1]!.split('\n</result>')[0]!.trim()
}

async function inspectToolResult({
  code = 'const evidence = await search(); return inspect(evidence);',
  tools,
  options,
  session,
  onInspect,
}: {
  code?: string
  tools: Tool[]
  options?: ExecutionProps['options']
  session?: Session
  onInspect?: OnInspect
}) {
  const client = new NativeClient([javascript(code), javascript('return exit("done", { value: true });')])
  const result = await executeContext({ client, tools, options, session, onInspect, exits: [done] })

  expect(result.is(done)).toBe(true)

  return { result, client, inspection: nextInspection(client) }
}

describe.each([
  { name: 'Node', quickjs: 'false' },
  { name: 'QuickJS', quickjs: 'true' },
])('tool result display budgets ($name)', ({ quickjs }) => {
  beforeEach(() => {
    vi.stubEnv('USE_QUICKJS', quickjs)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  test.each([undefined, 64, 0, 2000])('uses the global budget %s without changing stored data', async (maxTokens) => {
    const handler = vi.fn(async () => rag)
    const { result, inspection } = await inspectToolResult({
      tools: [new Tool({ name: 'search', output: z.string(), handler })],
      options: maxTokens === undefined ? undefined : { toolResultMaxTokens: maxTokens },
    })

    expect(handler).toHaveBeenCalledOnce()
    expect(result.session.memory.variables.evidence).toBe(rag)
    expect(result.session.getBindings().$return).toBe(rag)
    expect(getTokenizer().count(inspection)).toBeLessThanOrEqual(maxTokens ?? 2000)
    expect(inspection).not.toContain('LATE_RAG_EVIDENCE')

    if (maxTokens === 0) {
      expect(inspection).toBe('')
    } else {
      expect(inspection).toContain('[truncated]')
    }
  })

  test('uses the inspection hook across result and inventory previews without changing retained values', async () => {
    const events: InspectEvent[] = []
    const { result, inspection } = await inspectToolResult({
      tools: [new Tool({ name: 'search', handler: async () => rag })],
      onInspect: (event) => {
        events.push(event)
        return event.purpose === 'result' ? 'Custom evidence\nSecond line' : undefined
      },
    })

    expect(inspection).toBe('Custom evidence\nSecond line')
    expect(events.some((event) => event.purpose === 'variable' && event.identity?.variable === 'evidence')).toBe(true)
    expect(events.find((event) => event.purpose === 'result')).toMatchObject({
      value: rag,
      maxTokens: 2000,
      identity: { sessionId: result.session.id, iteration: 1 },
    })
    expect(result.session.memory.variables.evidence).toBe(rag)
    expect(result.session.getBindings().$return).toBe(rag)
  })

  test('enforces an explicit wrapper budget on custom result formatting', async () => {
    const { result, inspection } = await inspectToolResult({
      tools: [
        new Tool({ name: 'search', handler: async () => truncate({ value: rag, maxTokens: 80, preserve: 'bottom' }) }),
      ],
      options: { toolResultMaxTokens: 20 },
      onInspect: (event) => (event.purpose === 'result' ? 'DETAIL '.repeat(10000) + 'CUSTOM_END' : undefined),
    })

    expect(inspection).toContain('CUSTOM_END')
    expect(inspection).toContain('[truncated]')
    expect(getTokenizer().count(inspection)).toBeLessThanOrEqual(80)
    expect(result.session.memory.variables.evidence).toBe(rag)
  })

  test('honors a large explicit budget while JavaScript receives an ordinary string', async () => {
    const handler = vi.fn(async () => truncate({ value: rag, maxTokens: 40_000 }))
    const { result, inspection } = await inspectToolResult({
      tools: [new Tool({ name: 'search', output: z.string(), handler })],
      options: { toolResultMaxTokens: 64 },
      code: `const evidence = await search();
const kind = typeof evidence;
const prefix = evidence.slice(0, 5);
const length = evidence.length;

return inspect(evidence);`,
    })

    expect(handler).toHaveBeenCalledOnce()
    expect(inspection).toContain('# rag\n\nThe source')
    expect(inspection).toContain('LATE_RAG_EVIDENCE')
    expect(getTokenizer().count(inspection)).toBeGreaterThan(2000)
    expect(getTokenizer().count(inspection)).toBeLessThanOrEqual(40_000)
    expect(result.session.memory.variables).toMatchObject({
      evidence: rag,
      kind: 'string',
      prefix: '# rag',
      length: rag.length,
    })
    expect(result.session.getBindings().$return).toBe(rag)
    expect(JSON.stringify(result.session.toJSON())).not.toContain('$$truncate')
  })

  test.each([false, true])('applies explicit interruption context budgets: %s', async (explicit) => {
    const client = new NativeClient([
      javascript('await search(); return inspect("unreachable");'),
      javascript('return exit("done", { value: true });'),
    ])
    const search = new Tool({
      name: 'search',
      handler: async () => {
        throw new ThinkSignal('Read the search evidence.', explicit ? truncate({ value: rag, maxTokens: 40_000 }) : rag)
      },
    })
    const result = await executeContext({
      client,
      tools: [search],
      exits: [done],
      options: { toolResultMaxTokens: 64 },
    })
    expect(result.is(done)).toBe(true)
    const report = String(client.requests[1]!.messages.find((message) => message.type === 'tool_result')?.content)
    const preview = report.split('Interruption context\n')[1]!.split('\n</interruption_context>')[0]!
    expect(preview.includes('LATE_RAG_EVIDENCE')).toBe(explicit)
    expect(getTokenizer().count(preview, { approximate: false })).toBeLessThanOrEqual(explicit ? 40_000 : 64)
    expect(preview).not.toContain('$$truncate')
  })

  test.each(['top', 'bottom', 'both'] as const)('preserves the requested %s of a wrapped result', async (preserve) => {
    const { result, inspection } = await inspectToolResult({
      tools: [new Tool({ name: 'search', handler: async () => truncate({ value: rag, maxTokens: 64, preserve }) })],
    })

    expect(getTokenizer().count(inspection)).toBeLessThanOrEqual(64)
    expect(inspection).toContain('[truncated]')
    expect(inspection.includes('# rag')).toBe(preserve !== 'bottom')
    expect(inspection.includes('LATE_RAG_EVIDENCE')).toBe(preserve !== 'top')
    expect(result.session.memory.variables.evidence).toBe(rag)
    expect(result.session.getBindings().$return).toBe(rag)
  })

  test('preserves the declared schema and raw shape of wrapped object results', async () => {
    const schema = z.object({ count: z.number(), evidence: z.string() })
    const value = { count: 7, evidence: rag }
    const { result, client, inspection } = await inspectToolResult({
      tools: [
        new Tool({
          name: 'search',
          output: schema,
          handler: async () => truncate({ value, maxTokens: 40_000 }),
        }),
        new Tool({ name: 'readBaseline', output: schema, handler: async () => value }),
      ],
      code: `const evidence = await search();
const baseline = await readBaseline();
const countKind = typeof evidence.count;
const keys = Object.keys(evidence).sort();

return inspect(evidence);`,
    })

    expect(inspection).toContain('LATE_RAG_EVIDENCE')
    expect(result.session.memory.variables).toMatchObject({
      evidence: { count: 7, evidence: rag },
      countKind: 'number',
      keys: ['count', 'evidence'],
    })
    expect(result.session.getBindings().$return).toEqual({ count: 7, evidence: rag })
    expect(result.session.memory.variables.evidence).toEqual(result.session.memory.variables.baseline)
    const prompt = client.requests[0]!.messages.filter((message) => message.role === 'system')
      .map((message) => String(message.content))
      .join('\n')

    expect(prompt).toContain('count: number')
    expect(prompt).toContain('evidence: string')
    expect(prompt).not.toContain('$$truncate')
    expect(JSON.stringify(result.session.toJSON())).not.toContain('$$truncate')
  })

  test('retains independent budgets when parallel tool results are inspected together', async () => {
    const { result, inspection } = await inspectToolResult({
      tools: [
        new Tool({ name: 'search', handler: async () => truncate({ value: rag, maxTokens: 40_000 }) }),
        new Tool({ name: 'readPlain', handler: async () => plain }),
      ],
      code: `const [rag, plain] = await Promise.all([search(), readPlain()]);

return inspect({ rag, plain });`,
    })

    expect(inspection).toContain('LATE_RAG_EVIDENCE')
    expect(inspection.includes('LATE_PLAIN_EVIDENCE'), 'The ordinary sibling must retain its default budget.').toBe(
      false
    )
    expect(inspection).toContain('[truncated]')
    expect(getTokenizer().count(inspection)).toBeLessThanOrEqual(40_000)
    expect(result.session.memory.variables).toEqual({ rag, plain })
    expect(result.session.getBindings().$return).toEqual({ rag, plain })
    expect(JSON.stringify(result.session.toJSON())).not.toContain('$$truncate')
  })

  test('does not apply a source override to a derived value', async () => {
    const { result, inspection } = await inspectToolResult({
      tools: [new Tool({ name: 'search', handler: async () => truncate({ value: rag, maxTokens: 40_000 }) })],
      code: `const evidence = await search();
const derived = evidence.slice(0, -1);

return inspect(derived);`,
    })

    expect(inspection).toContain('[truncated]')
    expect(inspection).not.toContain('LATE_RAG_EVIDENCE')
    expect(getTokenizer().count(inspection)).toBeLessThanOrEqual(2000)
    expect(result.session.memory.variables.evidence).toBe(rag)
    expect(result.session.memory.variables.derived).toBe(rag.slice(0, -1))
    expect(result.session.getBindings().$return).toBe(rag.slice(0, -1))
  })

  test('does not persist the display override into a restored session', async () => {
    const first = await inspectToolResult({
      tools: [new Tool({ name: 'search', handler: async () => truncate({ value: rag, maxTokens: 40_000 }) })],
    })
    const session = Session.fromJSON(JSON.parse(JSON.stringify(first.result.session.toJSON())))
    const second = await inspectToolResult({ code: 'return inspect(evidence);', tools: [], session })

    expect(first.inspection).toContain('LATE_RAG_EVIDENCE')
    expect(second.inspection).toContain('[truncated]')
    expect(second.inspection).not.toContain('LATE_RAG_EVIDENCE')
    expect(getTokenizer().count(second.inspection)).toBeLessThanOrEqual(2000)
    expect(second.result.session.memory.variables.evidence).toBe(rag)
    expect(second.result.session.getBindings().$return).toBe(rag)
  })

  test.each([-1, 0.5, 2001, Infinity, NaN])('rejects invalid global budget %s before any work', async (maxTokens) => {
    const handler = vi.fn(async () => rag)
    const client = new NativeClient([javascript('return inspect(await search());')])

    await expect(
      executeContext({
        client,
        exits: [done],
        tools: [new Tool({ name: 'search', handler })],
        options: { toolResultMaxTokens: maxTokens },
      })
    ).rejects.toThrow(/toolResultMaxTokens/)

    expect(client.requests).toEqual([])
    expect(handler).not.toHaveBeenCalled()
  })
})
