import type { CognitiveToolCall } from '@botpress/cognitive'
import { describe, expect, it } from 'vitest'
import { RUN_JAVASCRIPT_TOOL, transcriptToNativeMessages, validateNativeToolCalls } from './native-tools.js'

const call = (name: string, input: Record<string, unknown> = {}, id = name) => ({ id, name, input })

describe('single native execution tool', () => {
  it('documents one JavaScript tool and refers to the system syntax section', () => {
    expect(RUN_JAVASCRIPT_TOOL.name).toBe('run_javascript')
    expect(RUN_JAVASCRIPT_TOOL.description).toContain('"run_javascript syntax"')
    expect(RUN_JAVASCRIPT_TOOL.parameters).toMatchObject({
      type: 'object',
      required: ['code'],
      additionalProperties: false,
    })
  })

  it('accepts ordinary text or one complete JavaScript program', () => {
    expect(validateNativeToolCalls([])).toEqual({ valid: true })
    expect(validateNativeToolCalls([call('run_javascript', { code: 'return inspect(42)' })])).toEqual({
      valid: true,
      call: { id: 'run_javascript', code: 'return inspect(42)' },
    })
  })

  it.each([
    [
      call('run_javascript', { code: 'return inspect(1)' }, 'a'),
      call('run_javascript', { code: 'return inspect(2)' }, 'b'),
    ],
    [
      call('run_javascript', { code: 'return inspect(1)' }, 'same'),
      call('run_javascript', { code: 'return inspect(2)' }, 'same'),
    ],
    [call('run_javascript', { code: 'return inspect(1)' }, '')],
    [call('run_javascript', { code: '   ' })],
    [call('run_javascript', { code: 'return inspect(1)', ignored: true })],
    [call('run_javascript', {})],
    [call('listen')],
    [call('exit_done', { count: 2 })],
    [call('show_button', { label: 'First' })],
  ])('rejects the entire invalid response before dispatch: %j', (...calls) => {
    const result = validateNativeToolCalls(calls)

    expect(result.valid).toBe(false)
    expect(result).not.toHaveProperty('call')

    if (!result.valid) {
      expect(result.errors.length).toBeGreaterThan(0)
    }
  })

  it.each([null, [], 'return inspect(1)', 42])('rejects non-object arguments: %j', (input) => {
    const invalid = { id: 'call-1', name: 'run_javascript', input } as unknown as CognitiveToolCall
    expect(validateNativeToolCalls([invalid])).toMatchObject({ valid: false })
  })
})

describe('native transcript messages', () => {
  it('retains native roles and media on their original turns', () => {
    const messages = transcriptToNativeMessages([
      {
        role: 'user',
        content: 'First photo',
        attachments: [{ type: 'image', url: 'https://example.com/first.png', id: 'first' }],
      },
      { role: 'assistant', content: 'I see the photo.' },
      { role: 'user', content: '', attachments: [{ type: 'audio', url: 'https://example.com/voice.wav' }] },
    ])
    expect(messages.map((message) => message.role)).toEqual(['user', 'assistant', 'user'])
    expect(messages[0]).toMatchObject({
      type: 'multipart',
      content: expect.arrayContaining([{ type: 'image', url: 'https://example.com/first.png' }]),
    })
    expect(JSON.stringify(messages[2])).not.toContain('first.png')
    expect(messages[2]).toMatchObject({
      type: 'multipart',
      content: expect.arrayContaining([{ type: 'audio', url: 'https://example.com/voice.wav' }]),
    })
  })

  it('keeps events and summaries as labeled data rather than elevated instructions', () => {
    const messages = transcriptToNativeMessages([
      { role: 'event', name: 'payment', payload: { amount: 10 } },
      {
        role: 'summary',
        content: 'Previous request',
        attachments: [{ type: 'image', url: 'https://example.com/summary.png' }],
      },
      { role: 'user', content: 'A spoken request', modality: 'voice' },
    ])
    expect(messages.every((message) => message.role === 'user')).toBe(true)
    expect(messages[0]?.content).toContain('Event: payment')
    expect(JSON.stringify(messages[1])).toContain('Earlier conversation summary')
    expect(JSON.stringify(messages[1])).toContain('summary.png')
    expect(messages[2]?.content).toContain('[Voice message; transcribed]')
  })
})
