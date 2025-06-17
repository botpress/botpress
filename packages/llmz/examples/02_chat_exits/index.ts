import { Client } from '@botpress/client'
import { z } from '@bpinternal/zui'
import { execute, Exit, ListenExit } from 'llmz'

import { CLIChat } from '../utils/cli-chat'

const client = new Client({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

// An execution in chat mode can exit in two ways:
// The agent listens for the user's input, or one of the user-defined exits is triggered.
// In this example, we define two exits: one for exiting the chat and another for escalating the issue to a human agent.

const chat = new CLIChat()

/** An exit with no output */
const exit = new Exit({
  name: 'exit',
  description: 'When the user wants to exit the program',
})

/**
 * An exit with an output schema
 * LLMz will try to parse the output of the agent to match the schema
 */
const escalation = new Exit({
  name: 'escalation',
  description: 'Escalate the issue to a human agent',
  schema: z.object({
    reason: z.enum(['Frustrated user', 'Technical issue', 'Sensitive topic', 'Other']),
  }),
})

while (await chat.iterate()) {
  const result = await execute({
    instructions: 'You are a helpful assistant. Greet the user and suggest topics for discussion using buttons.',
    // when `chat` is used, the <ListenExit> is automatically added to the available exits
    exits: [exit, escalation],
    chat,
    client,
  })

  // .is(<exit>) checks if the result is an exit of the given type
  if (result.is(exit)) {
    console.log(`-----------------------`)
    console.log('👋 Goodbye!')
    console.log(`-----------------------`)
    process.exit(0)
  }

  if (result.is(escalation)) {
    console.log(`-----------------------`)
    console.log(`🚨 Escalation needed: ${result.output.reason}`)
    console.log(`-----------------------`)
    process.exit(0)
  }

  if (result.is(ListenExit)) {
    // The agent is waiting for the user's input
    // So we keep looping to capture the user input and iterate
  }
}
