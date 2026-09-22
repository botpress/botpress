import { describe, expect, it } from 'vitest'
import { ListenExit, MissingChatResponseError, execute } from '../src/index.js'
import { createTestChat } from './__tests__/chat.js'
import { getCachedCognitiveClient } from './__tests__/index.js'

const client = getCachedCognitiveClient()

describe('chat completion guard', { retry: 0, timeout: 60_000 }, () => {
  it.each([true, false])('requires a delivered message when requireChatResponse=%s', async (requireChatResponse) => {
    const sent: string[] = []
    let exits = 0
    const result = await execute({
      client,
      model: ['openai:gpt-5.6-luna'],
      reasoningEffort: 'none',
      temperature: 0,
      instructions:
        'This fixture checks the runtime completion policy. For your first response, call run_javascript with exactly: return exit("listen"); and no assistant text. If the runtime rejects completion, reply with exactly "The answer is 991." as normal assistant text.',
      chat: createTestChat({
        components: [],
        onMessage: async (message) => {
          expect(message.type).toBe('text')
          if (message.type === 'text') {
            sent.push(message.text)
          }
        },
      }),
      options: { loop: 2, requireChatResponse },
      onExit: () => {
        exits++
      },
    })
    expect(result.is(ListenExit)).toBe(true)
    expect(exits).toBe(1)
    expect(result.iterations[0]?.code).toContain('exit("listen")')
    expect(sent).toEqual(requireChatResponse ? ['The answer is 991.'] : [])
    expect(result.iterations).toHaveLength(requireChatResponse ? 2 : 1)
    expect(result.iterations.flatMap((iteration) => iteration.errors).filter(MissingChatResponseError.is)).toHaveLength(
      requireChatResponse ? 1 : 0
    )
  })
})
