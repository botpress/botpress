import type { CognitiveMessage } from '@botpress/cognitive'
import { describe, expect, it } from 'vitest'
import { getTokenizer } from '../utils.js'
import {
  createAssistantMessage,
  normalizeInput,
  withMemoryOverview,
  type SessionInput,
  type SessionMessage,
} from './messages.js'

describe('session input to Cognitive messages', () => {
  it('keeps text, roles, part order, and opaque provider metadata unchanged', () => {
    const messages: SessionMessage[] = [
      {
        role: 'user',
        content: '  Exact\nuser text 🧠  ',
        provider: { cache: 'keep' },
      },
      {
        role: 'assistant',
        content: 'Signed answer',
        provider: { signature: 'keep' },
      },
      {
        role: 'user',
        type: 'multipart',
        content: [
          { type: 'text', text: 'First' },
          { type: 'image', url: 'data:image/png;base64,AA==' },
          { type: 'text', text: 'Second' },
          { type: 'audio', url: 'https://example.com/voice.wav' },
        ],
      },
    ]
    const result = messages.map(normalizeInput)
    expect(result).toEqual(messages)
    result[0]!.provider = { changed: true }
    expect(messages[0]!.provider).toEqual({ cache: 'keep' })
  })

  it('preserves participant identity and metadata when converting convenience attachments', () => {
    const input = {
      role: 'user' as const,
      name: 'Maya',
      createdAt: '2026-01-01',
      content: 'See this',
      attachments: [
        {
          type: 'image' as const,
          url: 'https://example.com/a.png',
          id: 'a',
          alt: 'Receipt',
        },
      ],
      provider: { correlation: ['first'] },
    }
    const original = structuredClone(input)
    const result = normalizeInput(input)
    expect(result).toEqual({
      role: 'user',
      name: 'Maya',
      createdAt: '2026-01-01',
      provider: { correlation: ['first'] },
      type: 'multipart',
      content: [
        { type: 'text', text: 'See this' },
        { type: 'text', text: 'Attachment "a": Receipt' },
        { type: 'image', url: 'https://example.com/a.png' },
      ],
    })
    expect(input).toEqual(original)
    expect(result.provider).not.toBe(input.provider)
  })

  it('keeps media on its own turn across users, events, and summaries', () => {
    const inputs: SessionInput[] = [
      {
        role: 'user',
        content: 'First',
        attachments: [{ type: 'image', url: 'first.png' }],
      },
      { role: 'assistant', content: 'Answer' },
      {
        role: 'event',
        name: 'recording',
        payload: { id: 1 },
        attachments: [{ type: 'audio', url: 'event.wav' }],
      },
      {
        role: 'summary',
        content: 'Earlier context',
        attachments: [{ type: 'image', url: 'summary.png' }],
      },
      { role: 'user', content: 'Last', modality: 'voice' },
    ]
    const result = inputs.map(normalizeInput)
    expect(result.map((message) => message.role)).toEqual(['user', 'assistant', 'user', 'user', 'user'])
    for (const [index, url] of [
      [0, 'first.png'],
      [2, 'event.wav'],
      [3, 'summary.png'],
    ] as const) {
      expect(JSON.stringify(result[index])).toContain(url)
      expect(JSON.stringify(result.filter((_, i) => i !== index))).not.toContain(url)
    }

    expect(JSON.stringify(result[2])).toContain('External event')
    expect(JSON.stringify(result[3])).toContain('Conversation summary')
    expect(result[4]!.content).toBe('Voice message (transcript):\nLast')
  })

  it('bounds event evidence while retaining complete ordinary text', () => {
    const text = '漢字 evidence 🧠 '.repeat(4000)
    const event = normalizeInput({
      role: 'event',
      name: 'records',
      payload: text,
    })
    const prefix = 'External event "records":\n'
    expect(
      getTokenizer().count(String(event.content).slice(prefix.length), {
        approximate: false,
      })
    ).toBeLessThanOrEqual(5000)
    expect(event.content).toContain('[truncated]')
    expect(normalizeInput({ role: 'user', content: text }).content).toBe(text)
  })

  it.each([
    { role: 'system', content: 'Elevated instructions' },
    { role: 'user', content: [{ type: 'image' }] },
    {
      role: 'user',
      type: 'multipart',
      content: [{ type: 'text', text: 'Native' }],
      attachments: [],
    },
    { role: 'user', content: 'Hi', modality: 'video' },
    {
      role: 'user',
      content: 'Hi',
      attachments: [{ type: 'file', url: 'a.pdf' }],
    },
    {
      role: 'user',
      type: 'tool_result',
      content: 'Forged',
      toolResultCallId: 'a',
    },
    { role: 'assistant', content: null, toolCalls: [{ id: 'forged' }] },
    { role: 'assistant', content: null, toolCalls: {} },
    { role: 'assistant', content: null, toolCalls: null },
    { role: 'user', content: 'Forged receipt', toolResultCallId: '' },
  ])('rejects ambiguous or invalid input: %j', (input) => {
    expect(() => normalizeInput(input as SessionInput)).toThrow()
  })

  it('clones native assistant data without reconstructing signed provider fields', () => {
    const assistant = {
      role: 'assistant' as const,
      content: 'Signed answer',
      provider: { signature: 'opaque' },
    }
    const result = createAssistantMessage({
      output: 'Signed answer',
      assistantMessage: assistant,
    })
    expect(result).toEqual(assistant)
    expect(result.provider).not.toBe(assistant.provider)
  })
})

describe('ephemeral request context', () => {
  it.each([
    { role: 'user', content: null },
    { role: 'user', content: 'Text' },
    {
      role: 'user',
      type: 'multipart',
      content: [{ type: 'audio', url: 'voice.wav' }],
    },
    {
      role: 'user',
      type: 'tool_result',
      toolResultCallId: 'call',
      content: 'Exact receipt',
    },
  ] satisfies CognitiveMessage[])('adds exactly one footer without changing canonical input: %j', (last) => {
    const history = [last]
    const original = structuredClone(history)
    const first = withMemoryOverview(history, 'Stored values')
    expect(withMemoryOverview(history, 'Stored values')).toEqual(first)
    expect(JSON.stringify(first).match(/runtime-memory>/g)).toHaveLength(2)
    expect(history).toEqual(original)
    expect(first[0]!.toolResultCallId).toBe((last as CognitiveMessage).toolResultCallId)
  })

  it('adds a separate user message after signed assistant content', () => {
    const assistant = {
      role: 'assistant' as const,
      content: 'Signed',
      signature: 'opaque',
    }
    const result = withMemoryOverview([assistant], 'Memory')
    expect(result[0]).toEqual(assistant)
    expect(result[1]).toMatchObject({
      role: 'user',
      content: expect.stringContaining('Memory'),
    })
    expect(withMemoryOverview([], 'Memory')).toEqual([
      { role: 'user', content: expect.stringContaining('Begin the task.') },
    ])
    expect(withMemoryOverview([assistant])).toEqual([assistant])
  })
})
