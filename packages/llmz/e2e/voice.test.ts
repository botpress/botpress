import { assert, describe, expect, it } from 'vitest'
import * as llmz from '../src/runtime/execute.js'

import { DefaultComponents } from '../src/component.default.js'
import { Chat } from '../src/chat.js'
import { Exit } from '../src/exit.js'
import { DualModePrompt } from '../src/prompts/dual-modes.js'
import { ExecutionResult, SuccessExecutionResult } from '../src/result.js'
import { Transcript, TranscriptArray } from '../src/transcript.js'
import { getCachedCognitiveClient, getScreenShareFixtures, getVoiceMessageDataUri } from './__tests__/index.js'

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

    it('marks pre-transcribed spoken turns via the explicit modality field', async () => {
      const transcript = new TranscriptArray([
        { role: 'user', content: 'What is the capital of France?', modality: 'voice' },
      ])

      const rendered = transcript.toString()
      expect(rendered).toContain('<user-001 role="user" modality="voice">')
      // No audio attached: no voice message marker, the content IS the transcript
      expect(rendered).not.toContain('[Voice message')

      const message = await DualModePrompt.getInitialUserMessage({
        transcript,
        objects: [],
        globalTools: [],
        exits: [],
        components: [DefaultComponents.Text],
      })

      assert(typeof message.content === 'string', 'Expected a plain text message')
      expect(message.content).toContain('the text below is a transcript of what they said out loud')
      expect(message.content).toContain('What is the capital of France?')
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

    // The default test model chain is served by Cerebras models, which have no
    // native audio support — those tests exercise cognitive's STT fallback
    // (audio transcribed to text before the LLM call). This one pins Gemini,
    // the only provider with supportsAudio, so the model hears the raw audio.
    it('hears the audio natively on an audio-capable model (gemini)', async () => {
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
        model: 'google-ai:gemini-3-flash',
      })

      assertSuccess(result)
      expect(result.iterations).toHaveLength(1)
      expect(replies).toContain('pineapple')
      expect(replies).toContain('paris')
    }, 30_000)
  })

  describe('multi-modality: screen share + voice + text events', () => {
    // Simulates a screen-sharing session: the user's interactions arrive as
    // UI events (text), screenshots capture the screen at key moments (images)
    // and the user narrates by voice (audio) — all in a single user turn.
    const screenShareMessage = (): Transcript.UserMessage => {
      const { screenshotA, screenshotB, screenshotC, voice } = getScreenShareFixtures()
      return {
        role: 'user',
        content: `
<navigation t=0 route="/purchase">
<ui_click t=23 element="button#buy" element_text="Buy now!">
<screenshot-A t=40>
<ui_input t=2300 element="textarea" text="Hello, world">
<screenshot-B t=3000>
<navigation t=4210 route="/purchase/error">
<screenshot-C t=4280>
`.trim(),
        attachments: [
          { type: 'image', url: screenshotA, id: 'screenshot-A' },
          { type: 'image', url: screenshotB, id: 'screenshot-B' },
          { type: 'image', url: screenshotC, id: 'screenshot-C' },
          { type: 'audio', url: voice, id: 'voice-note', alt: "the user's spoken narration" },
        ],
      }
    }

    it('references attachments by their id and describes them with alt', () => {
      const rendered = new TranscriptArray([screenShareMessage()]).toString()

      expect(rendered).toContain('modality="voice"')
      expect(rendered).toContain('[Attachment screenshot-A]')
      expect(rendered).toContain('[Attachment screenshot-B]')
      expect(rendered).toContain('[Attachment screenshot-C]')
      expect(rendered).toContain("[Voice message voice-note: the user's spoken narration]")

      // Without an id, attachments keep the auto-assigned positional letters
      const anonymous = new TranscriptArray([
        { role: 'user', content: 'look', attachments: [{ type: 'image', url: 'data:image/png;base64,x' }] },
      ]).toString()
      expect(anonymous).toContain('[Attachment user-001-A]')
    })

    it('grounds its answer in the screenshots, guided by the voice narration', async () => {
      let replies = ''
      const exit = new Exit({ name: 'done', description: 'call this when you are done' })
      const chat = new Chat({
        components: [DefaultComponents.Text],
        transcript: [screenShareMessage()],
        handler: async (msg) => {
          replies += JSON.stringify(msg).toLowerCase()
        },
      })

      const result = await llmz.executeContext({
        instructions:
          'You are a support agent watching the user share their screen. Their UI interactions arrive as timestamped events, screenshots show their screen at key moments, and the user narrates by voice. Answer their spoken questions using what you see on their screen.',
        options: { loop: 2 },
        exits: [exit],
        chat,
        client,
      })

      assertSuccess(result)
      // The voice asks what went wrong and whether they were charged; the
      // answer is only in screenshot C (declined for insufficient funds, no
      // charge was made)
      expect(replies).toMatch(/insufficient funds|card was declined|card_declined/)
      expect(replies).toMatch(/no charge|not charged|not been charged|wasn'?t charged|nothing was charged/)
    }, 60_000)
  })
})
