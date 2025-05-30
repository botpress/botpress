import { Client } from '@botpress/client'
import { executeContext } from 'llmz'

import { CLIChat } from '../utils/cli-chat'

const client = new Client({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

const chat = new CLIChat({
  client,
  instructions: 'You are a helpful assistant. Greet the user and suggest topics for discussion using buttons.',
})

while (!chat.done) {
  await executeContext(chat.context)
}

console.log('👋 Goodbye!')
process.exit(0)
