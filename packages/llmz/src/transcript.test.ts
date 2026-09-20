import { describe, expect, it } from 'vitest'

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
