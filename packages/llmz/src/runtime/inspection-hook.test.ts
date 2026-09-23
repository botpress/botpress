import { z } from '@bpinternal/zui'
import { describe, expect, test } from 'vitest'

import { Chat } from '../chat/chat.js'
import { type InspectEvent, inspect } from '../index.js'
import { ObjectInstance } from '../objects.js'
import { Session } from '../session/session.js'
import { Tool } from '../tool.js'
import { truncate } from '../truncate.js'
import { getTokenizer } from '../utils.js'
import { executeContext } from './execute.js'
import { NativeClient, javascript, response } from './fixtures/native-client.js'

describe('runtime inspection hook', () => {
  test('provides inspection purpose and runtime identity without changing retained values', async () => {
    const events: InspectEvent[] = []
    const evidence = 'Source passage\n'.repeat(200)
    const session = new Session({ variables: { account: { id: 42 } } })
    const client = new NativeClient([
      javascript('const evidence = await search(); return inspect(evidence);'),
      response('Reviewed.'),
    ])
    const result = await executeContext({
      client,
      session,
      chat: new Chat({ response: { handler: () => undefined } }),
      objects: [
        new ObjectInstance({ name: 'customer', properties: [{ name: 'plan', type: z.string(), value: 'Team' }] }),
      ],
      tools: [
        new Tool({
          name: 'search',
          output: z.string(),
          handler: async () => truncate({ value: evidence, maxTokens: 80 }),
        }),
      ],
      options: { toolResultMaxTokens: 20 },
      onInspect: (event) => {
        events.push(event)

        if (event.purpose === 'result') {
          return `Custom evidence\n${evidence}`
        }

        return undefined
      },
    })

    expect(result.isSuccess()).toBe(true)
    expect(session.memory.variables.evidence).toBe(evidence)
    expect(session.getBindings().$return).toBe(evidence)
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          purpose: 'variable',
          identity: expect.objectContaining({ sessionId: session.id, turn: 1, variable: 'account' }),
        }),
        expect.objectContaining({
          purpose: 'property',
          identity: expect.objectContaining({ object: 'customer', property: 'plan' }),
        }),
        expect.objectContaining({
          purpose: 'result',
          value: evidence,
          maxTokens: 80,
          identity: expect.objectContaining({ iterationId: result.iterations[0]!.id, iteration: 1 }),
        }),
      ])
    )
    const report = String(session.messages.find((message) => message.type === 'tool_result')!.content)
    const preview = report.split('inspect() result\n')[1]!.split('\n</result>')[0]!

    expect(preview).toContain('Custom evidence')
    expect(getTokenizer().count(preview, { approximate: false })).toBeLessThanOrEqual(80)
  })

  test('allows delegation to the exported inspector', async () => {
    const client = new NativeClient([javascript('return inspect({ count: 3 });'), response('Done.')])
    const result = await executeContext({
      client,
      chat: new Chat({ response: { handler: () => undefined } }),
      onInspect: ({ value, maxTokens, preserve, compact }) =>
        inspect(value, undefined, { tokens: maxTokens, preserve, compact }),
    })

    expect(result.isSuccess()).toBe(true)
    expect(result.session.getBindings().$return).toEqual({ count: 3 })
    expect(JSON.stringify(result.session.messages)).toContain('count')
  })
})
