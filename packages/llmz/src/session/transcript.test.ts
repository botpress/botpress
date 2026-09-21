import { describe, expect, it, vi } from 'vitest'
import { Chat } from '../chat/chat.js'
import { executeContext } from '../runtime/execute.js'
import { NativeClient, response } from '../runtime/fixtures/native-client.js'
import { Session } from './session.js'

import { isVoiceMessage, validateTranscriptMessage, type Transcript } from './transcript.js'

describe('transcript input', () => {
  it.each<Transcript.Message>([
    { role: 'user', content: 'Hello' },
    { role: 'assistant', content: 'Hi' },
    { role: 'summary', content: 'Earlier conversation' },
    { role: 'event', name: 'payment', payload: { paid: true } },
  ])('accepts $role input', (message) => {
    expect(() => validateTranscriptMessage(message)).not.toThrow()
  })

  it.each([
    { role: 'system', content: 'No' },
    { role: 'user', name: 42, content: 'No' },
    { role: 'user', content: 42 },
    { role: 'user', content: 'No', modality: 'video' },
  ])('rejects malformed input', (message) => {
    expect(() => validateTranscriptMessage(message as Transcript.Message)).toThrow()
  })

  it('recognizes voice from explicit modality or an audio attachment', () => {
    expect(isVoiceMessage({ role: 'user', content: 'Spoken', modality: 'voice' })).toBe(true)
    expect(isVoiceMessage({ role: 'user', content: '', attachments: [{ type: 'audio', url: 'audio.wav' }] })).toBe(true)
    expect(
      isVoiceMessage({ role: 'event', name: 'speech', payload: {}, attachments: [{ type: 'audio', url: 'audio.wav' }] })
    ).toBe(true)
    expect(isVoiceMessage({ role: 'user', content: 'Typed' })).toBe(false)
    expect(isVoiceMessage({ role: 'user', content: '', attachments: [{ type: 'image', url: 'image.png' }] })).toBe(
      false
    )
  })
})

describe('session events', () => {
  it('reacts to an external event through the next normal execution and preserves its typed transcript', async () => {
    const session = new Session()
    const event = {
      role: 'event' as const,
      name: 'button.clicked',
      payload: { button: 'confirm', orderId: 'order-42' },
    }
    session.append(event)
    event.payload.button = 'changed outside the session'
    const client = new NativeClient([response('Your choice is confirmed.')])
    const handler = vi.fn()
    const result = await executeContext({ session, client, chat: new Chat({ response: { handler } }) })

    expect(result.isSuccess()).toBe(true)
    const input = client.requests[0]!.messages.find((message) => String(message.content).includes('button.clicked'))
    expect(input?.role).toBe('user')
    expect(input?.content).toContain('External event "button.clicked"')
    expect(input?.content).toContain('confirm')
    expect(input?.content).toContain('order-42')
    expect(handler.mock.calls[0]?.[0]).toBe('Your choice is confirmed.')
    expect(session.transcript[0]).toEqual({
      role: 'event',
      name: 'button.clicked',
      payload: { button: 'confirm', orderId: 'order-42' },
    })
    const restored = Session.fromJSON(JSON.parse(JSON.stringify(session)))
    expect(restored.transcript).toEqual(session.transcript)
  })

  it('keeps events arriving during execution queued until the next turn, including repeated clicks', async () => {
    const session = new Session()
    session.append({ role: 'user', content: 'Show my order.' })
    const client = new NativeClient([response('Here is your order.'), response('I saw both clicks.')])
    const generate = client.generateText.bind(client)
    let calls = 0
    vi.spyOn(client, 'generateText').mockImplementation(async (input) => {
      if (calls++ === 0) {
        const event = { role: 'event' as const, name: 'button.clicked', payload: { id: 'continue' } }
        session.append([event, event])
      }

      return generate(input)
    })
    const chat = new Chat()
    expect((await executeContext({ session, client, chat })).isSuccess()).toBe(true)
    expect(JSON.stringify(client.requests[0])).not.toContain('button.clicked')
    expect(session.pendingMessages).toHaveLength(2)
    expect((await executeContext({ session, client, chat })).isSuccess()).toBe(true)
    expect(
      client.requests[1]?.messages.filter((message) =>
        String(message.content).includes('External event "button.clicked"')
      )
    ).toHaveLength(2)
    expect(session.pendingMessages).toEqual([])
    expect(session.turn).toBe(2)
  })

  it('rejects persisted events whose native input disagrees with their transcript', () => {
    const session = new Session()
    session.append({ role: 'event', name: 'button.clicked', payload: { id: 'confirm' } })
    const state = session.toJSON()
    state.pendingInputs[0]!.message.content = 'Different event'
    expect(() => Session.fromJSON(state)).toThrow('Transcript source')
  })
})
