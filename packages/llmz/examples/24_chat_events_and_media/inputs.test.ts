import { expect, test } from 'vitest'
import { Session } from 'llmz'
import { createInputs } from './inputs.js'

test('events, images and a voice transcript become native input without losing their transcript roles', () => {
  const session = new Session()
  const inputs = createInputs('https://example.org/panels.png')
  for (const message of inputs) session.append(message)
  expect(session.transcript.map((message) => message.role)).toEqual(['event', 'user', 'user'])
  expect(session.transcript[0]).toEqual(inputs[0])
  expect(session.pendingMessages[0]).toMatchObject({ role: 'user', content: expect.stringContaining('gallery.opened') })
  expect(session.pendingMessages[1]!.content).toContainEqual({ type: 'image', url: 'https://example.org/panels.png' })
  expect(session.pendingMessages[2]!.content).toContain('Voice message (transcript):')
  expect(session.pendingMessages[2]!.content).toContain('Which color is in the middle?')
})

test('an audio URL passes through as audio input, without inventing its transcript', () => {
  const session = new Session()
  const voice = createInputs('https://example.org/panels.png', 'https://example.org/question.wav')[2]!
  session.append(voice)
  expect(session.pendingMessages[0]!.content).toContainEqual({ type: 'audio', url: 'https://example.org/question.wav' })
  expect(JSON.stringify(session.pendingMessages)).not.toContain('Which color is in the middle?')
})
