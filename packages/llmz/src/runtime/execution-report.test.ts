import { z } from '@bpinternal/zui'
import { describe, expect, test, vi } from 'vitest'

import { DefaultComponents } from '../chat/component.default.js'
import { ThinkSignal } from '../errors.js'
import { Exit } from '../exit.js'
import type { ExecutionResult } from '../result.js'
import { Session } from '../session/session.js'
import { Tool } from '../tool.js'
import { getTokenizer } from '../utils.js'
import { executeContext } from './execute.js'
import { createRecordingChat } from './fixtures/chat.js'
import { NativeClient, javascript } from './fixtures/native-client.js'

const done = new Exit({
  name: 'done',
  description: 'Complete with the observed value.',
  schema: z.object({ value: z.number() }),
})

function reportAt(result: ExecutionResult, index = 0): string {
  const reports = result.session.messages.filter((message) => message.type === 'tool_result')
  const report = reports[index]

  expect(report).toBeDefined()
  expect(typeof report?.content).toBe('string')

  return String(report!.content)
}

describe('execution reports from actual runtime traces', () => {
  test('explicitly reports successful local code with no business tools or messages', async () => {
    const client = new NativeClient([
      javascript('const total = 6 * 7; return inspect(total);'),
      javascript('return exit("done", { value: $return });'),
    ])
    const result = await executeContext({ client, exits: [done] })
    const report = reportAt(result)

    expect(result.is(done)).toBe(true)
    expect(result.output).toEqual({ value: 42 })
    expect(report).toMatch(/^run_javascript: succeeded/)
    expect(report).not.toContain('Tools called')
    expect(report).not.toContain('Messages sent')
    expect(report).not.toContain('JavaScript ran successfully.')
    expect(report).toContain('Memory changes')
    expect(report).toContain('Created')
    expect(report).toContain('total')
    expect(report).toContain('inspect() result')
    expect(report).toContain('42')
  })

  test('reports successful tools, sent content, created and updated memory, then the inspected result', async () => {
    const read = vi.fn(async () => ({ id: 'account-42', name: 'Maya' }))
    const handler = vi.fn()
    const client = new NativeClient([
      javascript(`
        const account = await readAccount();
        visits += 1;
        chat.card({ title: 'Account ' + account.id, text: 'Welcome, ' + account.name });
        return inspect({ id: account.id, visits });
      `),
      javascript('return exit("done", { value: $return.visits });'),
    ])
    const result = await executeContext({
      client,
      session: new Session({ variables: { visits: 1 } }),
      tools: [new Tool({ name: 'readAccount', handler: read })],
      exits: [done],
      chat: createRecordingChat({ components: [DefaultComponents.Card], handler }),
    })
    const report = reportAt(result)

    expect(result.is(done)).toBe(true)
    expect(result.output).toEqual({ value: 2 })
    expect(read).toHaveBeenCalledOnce()
    expect(handler).toHaveBeenCalledOnce()
    expect(report).toMatch(/^run_javascript: succeeded/)
    expect(report).toContain('readAccount(): succeeded')
    expect(report).toContain('Tools called')
    expect(report).toContain('readAccount')
    expect(report).toContain('Messages sent')
    expect(report).toMatch(/card/i)
    expect(report).toContain('Welcome, Maya')
    expect(report).toContain('Memory changes')
    expect(report).toContain('Created: account')
    expect(report).toContain('Updated: visits')
    expect(report).not.toContain('Created: account:')
    expect(report).toContain('inspect() result')
    expect(report.indexOf('Tools called')).toBeLessThan(report.indexOf('Messages sent'))
    expect(report.indexOf('Messages sent')).toBeLessThan(report.indexOf('Memory changes'))
    expect(report.indexOf('Memory changes')).toBeLessThan(report.indexOf('inspect() result'))
  })

  test('reports partial tool success as failed execution without an inspection result', async () => {
    const create = vi.fn(async () => ({ id: 'ticket-42' }))
    const deliver = vi.fn(async () => {
      throw new Error('Receipt service unavailable')
    })
    const client = new NativeClient([
      javascript(`
        const ticket = await createTicket();
        const receipt = await deliverReceipt();
        return inspect({ ticket, receipt });
      `),
      javascript('return exit("done", { value: 1 });'),
    ])
    const result = await executeContext({
      client,
      exits: [done],
      tools: [
        new Tool({ name: 'createTicket', handler: create }),
        new Tool({ name: 'deliverReceipt', handler: deliver }),
      ],
    })
    const report = reportAt(result)

    expect(result.is(done)).toBe(true)
    expect(create).toHaveBeenCalledOnce()
    expect(deliver).toHaveBeenCalledOnce()
    expect(result.session.memory.variables.ticket).toEqual({ id: 'ticket-42' })
    expect(result.session.getBindings().$return).toBeUndefined()
    expect(report).toMatch(/^run_javascript: failed/)
    expect(report).toContain('Tools called')
    expect(report).toContain('createTicket')
    expect(report).toContain('ticket-42')
    expect(report).toContain('deliverReceipt')
    expect(report).toMatch(/createTicket[^\n]*succeeded/)
    expect(report).toMatch(/deliverReceipt[^\n]*failed/)
    expect(report).toContain('Receipt service unavailable')
    expect(report).toContain('Memory changes')
    expect(report).toContain('Created')
    expect(report).toContain('inspect() result\nNot produced; execution did not complete an inspection.')
  })

  test('prints memory values and inspection results once in the next request', async () => {
    const client = new NativeClient([
      javascript(`
        const account = await readAccount();
        return inspect({ receipt: 'INSPECT_ONLY_VALUE' });
      `),
      javascript('return exit("done", { value: 1 });'),
    ])
    const result = await executeContext({
      client,
      exits: [done],
      tools: [new Tool({ name: 'readAccount', handler: async () => ({ reference: 'MEMORY_ONLY_VALUE' }) })],
    })
    const feedback = String(client.requests[1]!.messages.at(-1)!.content)
    const report = reportAt(result)

    expect(result.is(done)).toBe(true)
    expect(report).toContain('Created: account')
    expect(report).not.toContain('MEMORY_ONLY_VALUE')
    expect(feedback.match(/MEMORY_ONLY_VALUE/g)).toHaveLength(1)
    expect(feedback.match(/INSPECT_ONLY_VALUE/g)).toHaveLength(1)
    expect(feedback).toContain('`$return` = `$iterations[0].result`')
    expect(feedback).not.toContain('Tools: 1 succeeded')
  })

  test('bounds large displayed values while preserving full JavaScript memory', async () => {
    const records = Array.from({ length: 5000 }, (_, id) => ({ id, text: `Record ${id}: ${'payload '.repeat(30)}` }))
    const client = new NativeClient([
      javascript('const records = await readRecords(); return inspect(records);'),
      javascript('return exit("done", { value: $return.length });'),
    ])
    const result = await executeContext({
      client,
      exits: [done],
      tools: [new Tool({ name: 'readRecords', handler: async () => records })],
    })
    const report = reportAt(result)
    const inspection = report.split('inspect() result\n')[1]!
    const feedback = String(client.requests[1]!.messages.at(-1)!.content)

    expect(result.output).toEqual({ value: records.length })
    expect(result.session.memory.variables.records).toEqual(records)
    expect(result.session.getBindings().$return).toEqual(records)
    expect(inspection).toContain('[truncated]')
    expect(getTokenizer().count(inspection)).toBeLessThanOrEqual(2000)
    expect(getTokenizer().count(feedback)).toBeLessThan(2500)
    expect(feedback).not.toContain('Record 4999:')
  })

  test('bounds interruption evidence instead of bypassing the inspector for strings', async () => {
    const evidence = '# SOURCE_START\n\n' + 'Retrieved passage.\n\n'.repeat(10_000) + 'HIDDEN_SOURCE_END'
    const client = new NativeClient([
      javascript('return inspect(await search());'),
      javascript('return exit("done", { value: 1 });'),
    ])
    const result = await executeContext({
      client,
      exits: [done],
      tools: [
        new Tool({
          name: 'search',
          handler: async () => {
            throw new ThinkSignal('Review the evidence.', evidence)
          },
        }),
      ],
    })
    const report = reportAt(result)
    const context = report.split('Interruption context\n')[1]!

    expect(report).toMatch(/^run_javascript: paused/)
    expect(context).toContain('SOURCE_START')
    expect(context).toContain('# SOURCE_START\n\nRetrieved passage.\n\n')
    expect(context).toContain('[truncated]')
    expect(context).not.toContain('HIDDEN_SOURCE_END')
    expect(getTokenizer().count(context)).toBeLessThanOrEqual(2000)
  })

  test.each(['inspection', 'interruption'] as const)(
    'preserves multiline RAG evidence in the actual %s tool-result message',
    async (mode) => {
      const evidence = [
        '# Refund policy 【1】',
        '',
        'Refunds are available within 30 days. See https://example.com/refunds.',
        '',
        '- Keep the original receipt.',
        '- Contact the billing team.',
        '',
        '| Plan | Refund window |',
        '| --- | --- |',
        '| Standard | 30 days |',
        '',
        '```javascript',
        'const delimiter = "\\n";',
        '```',
      ].join('\n')
      const client = new NativeClient([
        javascript('const evidence = await search(); return inspect(evidence);'),
        javascript('return exit("done", { value: 30 });'),
      ])
      const result = await executeContext({
        client,
        exits: [done],
        tools: [
          new Tool({
            name: 'search',
            handler: async () => {
              if (mode === 'interruption') {
                throw new ThinkSignal('Read the retrieved policy.', evidence)
              }

              return evidence
            },
          }),
        ],
      })
      const feedback = client.requests[1]!.messages.find((message) => message.type === 'tool_result')!
      const content = String(feedback.content)
      const heading = mode === 'inspection' ? 'inspect() result' : 'Interruption context'
      const displayed = content.split(`${heading}\n`)[1]!.split('\n\n<runtime-memory>')[0]!

      expect(result.is(done)).toBe(true)
      expect(feedback.toolResultCallId).toBeTruthy()
      expect(displayed).toBe(evidence)
      expect(displayed).not.toContain('【1】\\n\\nRefunds')
      expect(getTokenizer().count(displayed)).toBeLessThanOrEqual(2000)

      if (mode === 'inspection') {
        expect(result.session.memory.variables.evidence).toBe(evidence)
        expect(result.session.getBindings().$return).toBe(evidence)
      }
    }
  )

  test('distinguishes a caught tool failure from the successful surrounding program', async () => {
    const lookup = vi.fn(async () => {
      throw new Error('No matching receipt')
    })
    const client = new NativeClient([
      javascript(`
        let failure;

        try {
          await lookupReceipt();
        } catch (error) {
          failure = error.message;
        }

        return inspect({ failure, nextStep: 'Ask for a receipt number' });
      `),
      javascript('return exit("done", { value: 0 });'),
    ])
    const result = await executeContext({
      client,
      exits: [done],
      tools: [new Tool({ name: 'lookupReceipt', handler: lookup })],
    })
    const report = reportAt(result)

    expect(result.is(done)).toBe(true)
    expect(lookup).toHaveBeenCalledOnce()
    expect(result.iterations[0]?.status.type).toBe('thinking_requested')
    expect(report).toMatch(/^run_javascript: succeeded/)
    expect(report).toContain('Tools called')
    expect(report).toMatch(/lookupReceipt[^\n]*failed/)
    expect(report).toContain('No matching receipt')
    expect(report).toContain('inspect() result')
    expect(report).toContain('Ask for a receipt number')
  })

  test('describes delivered and uncertain components while distinguishing skipped messages', async () => {
    const handler = vi.fn((component) => {
      if (component.props.title === 'Uncertain card') {
        throw new Error('Connection lost after sending')
      }
    })
    const client = new NativeClient([
      javascript(`
        chat.card({ title: 'First card', text: 'This delivery was acknowledged.' });
        chat.card({ title: 'Uncertain card', text: 'This delivery may have reached the user.' });
        chat.card({ title: 'Skipped card', text: 'This delivery must not start.' });
        return inspect({ allSent: true });
      `),
      javascript('return exit("done", { value: 1 });'),
    ])
    const result = await executeContext({
      client,
      exits: [done],
      chat: createRecordingChat({ components: [DefaultComponents.Card], handler }),
    })
    const report = reportAt(result)

    expect(result.is(done)).toBe(true)
    expect(handler).toHaveBeenCalledTimes(2)
    expect(report).toMatch(/^run_javascript: failed/)
    expect(report).toContain('Messages sent')
    expect(report).toMatch(/First card[^\n]*delivered/)
    expect(report).toMatch(/Uncertain card[^\n]*uncertain/)
    expect(report).toMatch(/card/i)
    expect(report).toContain('First card')
    expect(report).toContain('This delivery was acknowledged.')
    expect(report).toContain('Uncertain card')
    expect(report).toContain('uncertain')
    expect(report).toContain('Connection lost after sending')
    expect(report).toContain('skipped')
    expect(report).not.toContain('Skipped card')
    expect(report).toContain('inspect() result\nNot produced; execution did not complete an inspection.')
    expect(report).not.toContain('"allSent": true')
  })

  test('reports named completion without presenting it as an inspection result', async () => {
    const client = new NativeClient([javascript('return exit("done", { value: 42 });')])
    const result = await executeContext({ client, exits: [done] })
    const report = reportAt(result)

    expect(result.is(done)).toBe(true)
    expect(report).toMatch(/^run_javascript: succeeded/)
    expect(report).toContain('Completion\nExit "done" completed.')
    expect(report).toContain('42')
    expect(report).not.toContain('inspect() result')
  })

  test('does not report successful completion when the exit hook rejects it', async () => {
    const client = new NativeClient([javascript('return exit("done", { value: 42 });')])
    const result = await executeContext({
      client,
      exits: [done],
      options: { loop: 1 },
      onExit: () => {
        throw new Error('Business completion rejected')
      },
    })
    const report = reportAt(result)

    expect(result.isError()).toBe(true)
    expect(result.iterations[0]?.status.type).toBe('exit_error')
    expect(report).toMatch(/^run_javascript: failed/)
    expect(report).toContain('Business completion rejected')
    expect(report).not.toContain('Exit "done" completed.')
    expect(report).toContain('inspect() result\nNot produced; execution did not complete an inspection.')
  })
})
