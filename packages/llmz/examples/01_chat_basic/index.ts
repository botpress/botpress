import { Client } from '@botpress/client'
import { execute } from 'llmz'

import { CLIChat } from '../utils/cli-chat'

const client = new Client({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

const chat = new CLIChat()

while (await chat.iterate()) {
  await execute({
    instructions:
      "You are a helpful assistant. Greet the user and suggest topics for discussion using buttons. Don't let users type themselves, suggest topics instead.",
    chat,
    client,
  })
}
