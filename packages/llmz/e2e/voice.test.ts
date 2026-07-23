import { assert, describe, expect, it } from 'vitest'
import * as llmz from '../src/runtime/execute.js'

import { DefaultComponents } from '../src/component.default.js'
import { Chat } from '../src/chat.js'
import { Exit } from '../src/exit.js'
import { DualModePrompt } from '../src/prompts/dual-modes.js'
import { ExecutionResult, SuccessExecutionResult } from '../src/result.js'
import { Transcript, TranscriptArray } from '../src/transcript.js'
import { getCachedCognitiveClient, getVoiceMessageDataUri } from './__tests__/index.js'

const client = getCachedCognitiveClient()

function assertSuccess(result: ExecutionResult): asserts result is SuccessExecutionResult {
  assert(
    result instanceof SuccessExecutionResult,
    `Expected result to be success but got ${result.status}\n${result.isError() ? result.error : ''}`.trim()
  )
}

const voiceMessage = (content: string = ''): Transcript.UserMessage => ({
  role: 'user',
  content,
  attachments: [{ type: 'audio', url: getVoiceMessageDataUri() }],
})

describe('voice messages', () => {
  describe('prompt rendering', () => {
    it('marks spoken turns in the transcript', () => {
      const transcript = new TranscriptArray([
        { role: 'user', content: 'Hello!' },
        { role: 'assistant', content: 'Hi! How can I help?' },
        voiceMessage(),
      ])

      const rendered = transcript.toString()

      expect(rendered).toContain('modality="voice"')
      expect(rendered).toContain('[Voice message user-003-A]')
      // Typed messages must not be marked as voice
      expect(rendered).toContain('<user-001 role="user">')
      expect(rendered).toContain('<user-003 role="user" modality="voice">')
    })

    it('sends the audio to the model with explicit voice framing', async () => {
      const message = await DualModePrompt.getInitialUserMessage({
        transcript: new TranscriptArray([voiceMessage()]),
        objects: [],
        globalTools: [],
        exits: [],
        components: [DefaultComponents.Text],
      })

      assert(Array.isArray(message.content), 'Expected a multipart message')

      const text = message.content
        .filter((part) => part.type === 'text')
        .map((part) => part.text)
        .join('\n')
      const audioParts = message.content.filter((part) => part.type === 'audio')

      expect(audioParts).toHaveLength(1)
      expect(audioParts[0]!.url).toMatch(/^data:audio\/wav;base64,/)
      expect(text).toContain('voice message')
      expect(text).toContain('spoken out loud in the attached audio')
    })
  })

  describe('llm behavior', () => {
    it('understands what the user said in a voice message', async () => {
      let replies = ''
      const exit = new Exit({ name: 'done', description: 'call this when you are done' })
      const chat = new Chat({
        components: [DefaultComponents.Text],
        transcript: [voiceMessage()],
        handler: async (msg) => {
          replies += JSON.stringify(msg).toLowerCase()
        },
      })

      const result = await llmz.executeContext({
        instructions: 'Do as the user says. You can hear voice messages.',
        options: { loop: 1 },
        exits: [exit],
        chat,
        client,
      })

      assertSuccess(result)
      expect(result.iterations).toHaveLength(1)
      // The audio says: "Please say the word pineapple, and also tell me what the capital of France is."
      expect(replies).toContain('pineapple')
      expect(replies).toContain('paris')
    }, 30_000)

    it('knows the user spoke instead of typing', async () => {
      let replies = ''
      const exit = new Exit({ name: 'done', description: 'call this when you are done' })
      const chat = new Chat({
        components: [DefaultComponents.Text],
        transcript: [voiceMessage()],
        handler: async (msg) => {
          replies += JSON.stringify(msg).toLowerCase()
        },
      })

      const result = await llmz.executeContext({
        instructions:
          'Before answering, tell the user whether their last message was typed as text or spoken as a voice message.',
        options: { loop: 1 },
        exits: [exit],
        chat,
        client,
      })

      assertSuccess(result)
      expect(result.iterations).toHaveLength(1)
      expect(replies).toMatch(/voice|spoke|spoken|audio/)
    }, 30_000)
  })
})
