import type { CognitiveMessage } from '@botpress/cognitive'
import { describe, expect, it, vi } from 'vitest'
import { Session, Tool } from '../../src/index.js'
import { executeContext } from '../../src/runtime/execute.js'
import { createRecordingChat } from '../../src/runtime/fixtures/chat.js'
import { NativeClient, javascript, response } from '../../src/runtime/fixtures/native-client.js'
import { prependNativeDemonstrations } from './native-demonstrations.js'

const all = { chat: true, tools: true, components: true, exits: true, listen: true }

describe('request-only native demonstration pilot', () => {
  it('preserves real history and separates labeled, paired native examples from it', () => {
    const original: CognitiveMessage[] = [
      { role: 'system', content: 'Actual API\n<examples>Old documentation examples</examples>\nActual instructions' },
      { role: 'user', content: 'Real question containing <examples>literal user text</examples>' },
      {
        role: 'assistant',
        type: 'tool_calls',
        content: null,
        toolCalls: [
          {
            id: 'llmz_example_search',
            type: 'function',
            function: { name: 'run_javascript', arguments: { code: 'return inspect(7)' } },
          },
        ],
      },
      { role: 'user', type: 'tool_result', toolResultCallId: 'llmz_example_search', content: '7' },
    ]
    const before = structuredClone(original)
    const messages = prependNativeDemonstrations(original, all)
    expect(original).toEqual(before)
    expect(messages[0]?.content).toBe('Actual API\n\nActual instructions')
    const boundary = messages.findIndex((m) => String(m.content).includes('<real_context_starts_here>'))
    expect(messages.slice(boundary + 1)).toEqual(original.slice(1))
    const demonstrations = messages.slice(2, boundary)
    const calls = demonstrations.flatMap((m) => m.toolCalls ?? [])
    expect(calls).toHaveLength(3)
    expect(new Set(calls.map((call) => call.id)).size).toBe(3)
    expect(calls[0]?.id).toBe('llmz_example_search_')
    for (const message of demonstrations) {
      if (message.content !== null) expect(message.content).toContain('[FICTIONAL EXAMPLE — NOT LIVE HISTORY]')
      for (const call of message.toolCalls ?? []) {
        expect(call.function.name).toBe('run_javascript')
        expect(call.function.arguments?.code).toMatch(/^\/\/ \[FICTIONAL EXAMPLE/)
        const index = demonstrations.indexOf(message)
        expect(demonstrations[index + 1]).toMatchObject({
          role: 'user',
          type: 'tool_result',
          toolResultCallId: call.id,
        })
      }
    }
    expect(demonstrations.some((m) => m.toolCalls?.length && m.content)).toBe(true)
  })

  it('does not teach worker mode to send assistant text or chat components', () => {
    const messages = prependNativeDemonstrations([], { ...all, chat: false })
    expect(messages.filter((m) => m.role === 'assistant')).toHaveLength(2)
    expect(messages.filter((m) => m.role === 'assistant').every((m) => m.content === null)).toBe(true)
    expect(JSON.stringify(messages)).not.toContain('chat.exampleChoices')
    expect(JSON.stringify(messages)).not.toContain("exit('listen')")
  })

  it('does not demonstrate unavailable business tools, exits, or components', () => {
    const messages = prependNativeDemonstrations([], {
      chat: true,
      tools: false,
      components: false,
      exits: false,
      listen: false,
    })
    expect(messages.flatMap((m) => m.toolCalls ?? [])).toEqual([])
    const withoutListen = prependNativeDemonstrations([], { ...all, listen: false })
    expect(JSON.stringify(withoutListen)).not.toContain('chat.exampleChoices')
  })

  it('never executes examples, delivers their text, or persists their facts across iterations', async () => {
    const delivered = vi.fn()
    const tool = vi.fn(async () => 'Real result')
    const session = new Session()
    session.append({ role: 'user', content: 'Look up my order.' })
    const client = new NativeClient([
      javascript('const order = await lookup(); return inspect(order);'),
      response('Your real result.'),
    ])
    const result = await executeContext({
      client,
      session,
      chat: createRecordingChat({ handler: delivered }),
      tools: [new Tool({ name: 'lookup', handler: tool })],
      onBeforeRequest: ({ messages }) => ({ messages: prependNativeDemonstrations(messages, all) }),
      options: { loop: 2 },
    })
    expect(result.isSuccess()).toBe(true)
    expect(client.requests).toHaveLength(2)
    for (const request of client.requests) {
      expect(request.messages.filter((m) => String(m.content).includes('<demonstration_block>'))).toHaveLength(1)
      expect(
        request.messages.flatMap((m) => m.toolCalls ?? []).filter((call) => call.id.startsWith('llmz_example_'))
      ).toHaveLength(3)
    }
    expect(tool).toHaveBeenCalledTimes(1)
    expect(delivered).toHaveBeenCalledTimes(1)
    expect(delivered.mock.calls[0]?.[0]).toEqual({ type: 'text', text: 'Your real result.' })
    expect(result.session.memory.variables.order).toBe('Real result')
    expect(JSON.stringify(result.session.toJSON())).not.toMatch(
      /FICTIONAL EXAMPLE|llmz_example_|blue mugs|example_complete/
    )
    expect(result.iterations.flatMap((iteration) => iteration.errors)).toEqual([])
  })
})
