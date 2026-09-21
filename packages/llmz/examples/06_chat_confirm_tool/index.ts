import { Client } from '@botpress/client'
import { execute } from 'llmz'
import { CLIChat } from '../utils/cli-chat'
import { prompt } from '../utils/buttons'
import { createOverwriteTool } from './confirmation'

const client = new Client({
  apiUrl: process.env.BOTPRESS_API_URL,
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})
const overwrite = createOverwriteTool(
  async () => (await prompt('Overwrite the simulated data? Type OVERWRITE to approve: ')) === 'OVERWRITE',
  async () => {
    console.log('Demo data overwritten (no real storage was changed).')
  }
)
const chat = new CLIChat()

while (await chat.iterate()) {
  await execute({
    model: process.env.BOTPRESS_MODEL ?? 'openai:gpt-5.6-luna',
    client,
    chat,
    session: chat.session,
    instructions:
      'Offer to overwrite the demo data. The overwrite tool handles confirmation itself. Respect a declined operation.',
    tools: [overwrite],
  })
}
