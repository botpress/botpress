import { readFileSync } from 'node:fs'
import { Client } from '@botpress/client'
import { Chat, Session, execute } from 'llmz'
import { createInputs } from './inputs'

const client = new Client({
  apiUrl: process.env.BOTPRESS_API_URL,
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})
const session = new Session()
const imageUrl =
  process.env.IMAGE_URL ??
  `data:image/png;base64,${readFileSync(new URL('./panels.png', import.meta.url)).toString('base64')}`

for (const input of createInputs(imageUrl, process.env.AUDIO_URL)) {
  const voice = 'modality' in input && input.modality === 'voice'
  console.log(`\nIncoming ${input.role === 'event' ? 'event' : voice ? 'voice message' : 'image message'}`)
  session.append(input)
  // Appending queues input; the host decides when to execute.
  const result = await execute({
    client,
    session,
    model: process.env.BOTPRESS_MODEL ?? 'openai:gpt-5.6-luna',
    instructions:
      'Help the user explore a picture. Acknowledge gallery events briefly. Describe only what is visible. Answer in one short sentence.',
    chat: new Chat({
      response: {
        preset: voice ? 'speech' : 'text',
        // Send speech-ready text to your TTS service here; this demo prints it.
        handler: (text) => console.log(`${voice ? 'Speech-ready reply' : 'Assistant'}: ${text}`),
      },
    }),
  })
  if (result.isError()) throw result.error
}
console.log('\nRetained transcript roles:', session.transcript.map((message) => message.role).join(', '))
