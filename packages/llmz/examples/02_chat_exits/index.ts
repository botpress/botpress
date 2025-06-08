import { Client } from '@botpress/client'
import { z } from '@bpinternal/zui'
import { execute, Exit } from 'llmz'

import { CLIChat } from '../utils/cli-chat'

const client = new Client({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

const chat = new CLIChat()

const exit = new Exit({
  name: 'exit',
  description: 'When the user wants to exit the program',
  schema: z.object({
    message: z.string().describe('Output message'),
  }),
})

const escalation = new Exit({
  name: 'escalation',
  description: 'Escalate the issue to a human agent',
  schema: z.object({
    reason: z.enum(['Frustrated user', 'Technical issue', 'Sensitive topic', 'Other']),
  }),
})

while (await chat.iterate()) {
  await execute({
    instructions: 'You are a helpful assistant. Greet the user and suggest topics for discussion using buttons.',
    exits: [exit, escalation],
    chat,
    client,
  })
}

if (chat.hasExitedWith(exit)) {
  console.log(`-----------------------`)
  console.log('👋 Goodbye!')
  console.log(`-----------------------`)
} else if (chat.hasExitedWith(escalation)) {
  console.log(`-----------------------`)
  console.log(`🚨 Escalation needed: ${chat.status.exit_success.return_value.reason}`)
  console.log(`-----------------------`)
}
