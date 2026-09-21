import { Client } from '@botpress/client'
import { Chat, execute } from 'llmz'
import { createSession } from './compaction'

const client = new Client({
  apiUrl: process.env.BOTPRESS_API_URL,
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})
const session = createSession()
const chat = new Chat({ response: { handler: (text) => console.log(`Assistant: ${text}`) } })

async function turn(content: string) {
  console.log(`User: ${content}`)
  session.append({ role: 'user', content })
  const result = await execute({
    client,
    session,
    chat,
    model: process.env.BOTPRESS_MODEL ?? 'openai:gpt-5.6-luna',
    instructions:
      'Plan a short trip. Reply in one brief sentence. Use the trip preferences in memory; do not change them.',
  })
  if (result.isError()) throw result.error
}

await turn('I want a quiet weekend in Quebec City, under 300 Canadian dollars.')
await turn('I prefer walking and museums. Suggest one activity.')

// Preview without changing history. Both calls use our mocked callback, not another LLM.
const preview = await session.summarize({ client })
console.log('Summary preview:', preview?.content)
const before = session.transcript.length
await session.compact({ client, keepRecentIterations: 1 })
console.log(`Compacted transcript: ${before} → ${session.transcript.length} messages`)
console.log(
  'Summary event:',
  session.transcript.find((message) => message.role === 'summary')
)
console.log('Exact memory preserved:', session.memory.variables.trip)

await turn('Remind me of my destination and budget, then suggest the next step.')
