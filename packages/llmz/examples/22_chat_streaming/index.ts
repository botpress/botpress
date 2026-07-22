/**
 * Example 22: Streaming Chat
 *
 * This example demonstrates how to stream agent responses to the client in
 * real time — here the "client" is the terminal, but the exact same pattern
 * applies to a websocket, an SSE response or any other transport.
 *
 * It shows how to:
 * - Use a CognitiveBeta client, which streams tokens as they are generated
 * - Receive message body chunks live with `Chat.onMessageDelta`
 * - Receive the complete, authoritative message with `handler`
 *
 * Key concepts:
 * - `onMessageDelta` fires for every chunk of a message body while the LLM
 *   is still generating. Each chunk carries a stable `id` per message, the
 *   new `delta` text and the accumulated `content` so far.
 * - `handler` still fires once per complete message. Deltas are a
 *   best-effort progressive preview; the handler call is the source of
 *   truth (and the only delivery for components without a body, like
 *   buttons, or when the client does not support streaming).
 */

import { CognitiveBeta } from '@botpress/cognitive'
import chalk from 'chalk'
import { Chat, DefaultComponents, ListenExit, execute, isComponent } from 'llmz'

import { prompt } from '../utils/buttons'

// Streaming requires the Cognitive v2 (beta) client. A regular Botpress
// client also works, but messages are then delivered whole, not streamed.
const client = new CognitiveBeta({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

const transcript: Array<{ role: 'user' | 'assistant'; content: string }> = []
let buttons: string[] = []

// The id of the message currently being streamed to the terminal, if any
let streaming: string | null = null

const chat = new Chat({
  components: [DefaultComponents.Text, DefaultComponents.Button],
  transcript: () => transcript,

  // Called for every chunk of a message body, while the LLM is still
  // generating. Print chunks as they arrive for a live typewriter effect.
  onMessageDelta: (delta) => {
    if (streaming !== delta.id) {
      streaming = delta.id
      process.stdout.write(chalk.bold('🤖 Agent: '))
    }
    process.stdout.write(delta.delta)
  },

  // Called once per complete message — the authoritative delivery
  handler: async (component) => {
    if (isComponent(component, DefaultComponents.Button)) {
      buttons.push(component.props.label)
      return
    }

    const text = component.children
      .filter((child) => typeof child === 'string')
      .join('')
      .trim()

    if (!text.length) {
      return
    }

    transcript.push({ role: 'assistant', content: text })

    if (streaming) {
      // The body was already printed live by onMessageDelta — just end the line
      streaming = null
      process.stdout.write('\n')
    } else {
      // Fallback for non-streaming clients: print the whole message at once
      console.log(`${chalk.bold('🤖 Agent:')} ${text}`)
    }
  },
})

while (true) {
  const reply = await prompt(chalk.gray('(your reply) '), buttons)
  buttons = []

  if (!reply?.trim().length) {
    break
  }

  transcript.push({ role: 'user', content: reply })
  console.log(`${chalk.bold('👤 User:')} ${reply}`)

  const result = await execute({
    instructions:
      'You are a knowledgeable assistant. Answer questions thoroughly in well-structured markdown, then suggest follow-up topics as buttons.',
    chat,
    client,
  })

  if (!result.is(ListenExit)) {
    // The agent exited (or errored) instead of handing the turn back
    break
  }
}
