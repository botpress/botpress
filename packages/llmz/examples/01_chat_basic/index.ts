import { Client } from '@botpress/client'
import { z } from '@bpinternal/zui'
import { executeContext, Exit } from 'llmz'

import { CLIChat } from '../utils/cli-chat'

const client = new Client({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

const exit = new Exit({
  name: 'exit',
  description: 'Exit the program',
  schema: z.object({
    message: z.string().describe('Output message'),
  }),
})

const chat = new CLIChat({
  client,
  instructions: 'You are a helpful assistant. Greet the user and suggest topics for discussion using buttons.',
  exits: [exit],
})

while (!chat.done) {
  await executeContext(chat.context)
}

console.log('👋 Goodbye!')
process.exit(0)
