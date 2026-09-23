import type { CognitiveMetadata, CognitiveStreamChunk, CognitiveToolCall } from '@botpress/cognitive'
import { describe, expect, it } from 'vitest'

import {
  _CustomModelClient,
  type RuntimeGenerateContentInput,
  type RuntimeGenerateContentOptions,
} from '../src/custom-client.js'
import { ListenExit, Session, Tool, execute } from '../src/index.js'
import { createTestChat } from './__tests__/chat.js'
import { getCachedCognitiveClient } from './__tests__/index.js'

const cached = getCachedCognitiveClient()

type ObservedResponse = {
  output: string
  toolCalls: CognitiveToolCall[]
  metadata?: CognitiveMetadata
  finished?: boolean
}

// Record what Cognitive actually returned; do not synthesize an empty response.
class RecordingClient extends _CustomModelClient {
  public responses: ObservedResponse[] = []
  public getModelDetails(model: string) {
    return cached.getModelDetails(model)
  }
  public async generateText(input: RuntimeGenerateContentInput, options?: RuntimeGenerateContentOptions) {
    const result = await cached.generateText(input, options)
    this.responses.push({ output: result.output, toolCalls: result.toolCalls ?? [], metadata: result.metadata })
    return result
  }
}

class StreamingClient extends RecordingClient {
  public async *generateTextStream(
    input: RuntimeGenerateContentInput,
    options?: RuntimeGenerateContentOptions
  ): AsyncGenerator<CognitiveStreamChunk> {
    const observed: ObservedResponse = { output: '', toolCalls: [] }
    for await (const chunk of cached.generateTextStream(input, options)) {
      expect(chunk.restart).toBeUndefined()
      observed.output += chunk.output ?? ''
      if (chunk.toolCalls) {
        observed.toolCalls = chunk.toolCalls
      }
      if (chunk.metadata) {
        observed.metadata = chunk.metadata
      }
      if (chunk.finished) {
        observed.finished = true
      }
      yield chunk
    }
    this.responses.push(observed)
  }
}

describe('empty normal stop after escalation', { retry: 0, timeout: 60_000 }, () => {
  it.each([
    { streaming: false, assistantSpokeLast: false },
    { streaming: true, assistantSpokeLast: false },
    { streaming: true, assistantSpokeLast: true },
  ])(
    'completes silently (streaming=$streaming, assistantSpokeLast=$assistantSpokeLast)',
    async ({ streaming, assistantSpokeLast }) => {
      const client = streaming ? new StreamingClient() : new RecordingClient()
      const session = new Session()
      session.append({ role: 'user', content: 'Escalate my issue to human support. Do not send me another message.' })
      if (assistantSpokeLast) {
        session.append([
          { role: 'assistant', content: 'I am handing your issue to human support.' },
          { role: 'event', name: 'handoff_requested', payload: { ticketId: 'ticket-42' } },
        ])
      }
      const sent: unknown[] = []
      let escalations = 0
      let exits = 0
      const result = await execute({
        client,
        session,
        model: ['openai:gpt-5.6-luna'],
        temperature: 0,
        reasoningEffort: 'none',
        instructions: [
          'Handle the escalation playbook. The user must not receive an acknowledgement or another message.',
          'First call run_javascript with: const escalation = await escalate(); return inspect(escalation);',
          'Inspect the result to confirm that the human support team owns the issue.',
          'When escalated is true, your work is complete. End your response normally with empty assistant text and no tool calls.',
          'Do not call run_javascript or exit to end the turn. Do not repeat escalate. Do not explain your silence.',
        ].join('\n'),
        tools: [
          new Tool({
            name: 'escalate',
            description: 'Hand the issue to human support; returns whether the handoff succeeded.',
            handler: async () => {
              escalations++
              return { escalated: true, ticketId: 'ticket-42', owner: 'human support', customerNotified: true }
            },
          }),
        ],
        chat: createTestChat({
          onMessage: async (message) => {
            sent.push(message)
          },
        }),
        // Preserve the default guard when the assistant is already the last speaker.
        options: { loop: 2, ...(assistantSpokeLast ? {} : { requireChatResponse: false }) },
        onExit: () => {
          exits++
        },
      })

      // Prove that the model reproduced the reported response, separately from runtime acceptance.
      expect(client.responses).toHaveLength(2)
      expect(client.responses[1]?.output.trim()).toBe('')
      expect(client.responses[1]?.toolCalls).toEqual([])
      expect(client.responses[1]?.metadata?.stopReason).toBe('stop')
      expect(client.responses.every((item) => item.metadata?.model === 'openai:gpt-5.6-luna')).toBe(true)
      if (streaming) {
        expect(client.responses[1]?.finished).toBe(true)
      }

      expect(escalations).toBe(1)
      expect(sent).toEqual([])
      expect(result.is(ListenExit), result.isError() ? result.error.message : result.status).toBe(true)
      expect(exits).toBe(1)
      expect(result.iterations.map((iteration) => iteration.status.type)).toEqual([
        'thinking_requested',
        'exit_success',
      ])
      expect(result.iterations.flatMap((iteration) => iteration.errors)).toEqual([])
      expect(result.session.hasActiveTurn).toBe(false)
    }
  )
})
