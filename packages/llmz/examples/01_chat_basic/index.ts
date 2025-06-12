import { Client } from '@botpress/client'
import { execute } from 'llmz'

import { CLIChat } from '../utils/cli-chat'

// An instance of the Botpress Client is necessary to interact with LLMs
const client = new Client({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

// CLIChat is a simple chat interface for the command line
// It holds the conversation history, manages user input, and prints messages to the console
const chat = new CLIChat()

// chat.iterate() captures the user input and appends it to a transcript
while (await chat.iterate()) {
  await execute({
    instructions:
      "You are a helpful assistant. Greet the user and suggest topics for discussion using buttons. Don't let users type themselves, suggest topics instead.",
    chat,
    client,
  })
}
