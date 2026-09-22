import { expect, test, vi } from 'vitest'
import { Chat, execute } from 'llmz'
import { NativeClient, response } from '../../src/runtime/fixtures/native-client.js'
import { createSession, mockSummary } from './compaction.js'

test('mock summarization is deterministic and compaction preserves memory and queued input', async () => {
  const session = createSession()
  const client = new NativeClient([response('Museum first.'), response('Walk next.')])
  for (const content of ['Visit Quebec City for 300 CAD.', 'I enjoy museums.']) {
    session.append({ role: 'user', content })
    expect((await execute({ client, session, chat: new Chat() })).isSuccess()).toBe(true)
  }
  const generate = vi.spyOn(client, 'generateText')
  session.append({ role: 'event', name: 'itinerary.confirmed', payload: { id: 'trip-1' } })
  const before = session.toJSON()
  const preview = await session.summarize({ client })
  expect(preview?.content).toContain('Visit Quebec City')
  expect(session.toJSON()).toEqual(before)
  expect(await session.summarize({ client })).toEqual(preview)
  await session.compact({ client, keepRecentIterations: 1 })
  expect(generate).not.toHaveBeenCalled()
  expect(session.transcript[0]).toMatchObject({
    role: 'summary',
    content: expect.stringContaining('Visit Quebec City'),
  })
  expect(session.transcript.at(-1)).toMatchObject({ role: 'event', name: 'itinerary.confirmed' })
  expect(session.memory.variables.trip).toEqual({ destination: 'Quebec City', budgetCad: 300 })
  expect(await mockSummary({ messages: [], maxTokens: 256 })).toBe('Demo summary of recent requests: ')
})
