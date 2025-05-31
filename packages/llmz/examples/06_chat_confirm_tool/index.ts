import { Client } from '@botpress/client'
import { executeContext, ThinkSignal, Tool } from 'llmz'
import { z } from '@bpinternal/zui'

import { CLIChat } from '../utils/cli-chat'
import { printTrace } from '../utils/debug'
import chalk from 'chalk'

const client = new Client({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

let should_confirm = false
let confirming = false

const overwriteData = new Tool({
  name: 'overwrite',
  output: z.object({
    success: z.boolean().describe('Whether the operation was successful'),
  }),
  async handler() {
    if (!confirming) {
      should_confirm = true
      throw new ThinkSignal('Please ask the user for confirmation before proceeding.')
    } else {
      should_confirm = false
      confirming = false
    }

    console.log(chalk.bold('✅ Overwriting data'))

    return { success: true }
  },
})

const chat = new CLIChat({
  client,
  instructions: `You are an assistant that can overwrite data. 
  Greet the user and tell them you can overwrite data (show a button "Overwrite Data").
  Use buttons for quick responses when possible.`,
  tools: [overwriteData],
  onTrace: ({ trace }) => printTrace(trace, ['tool_call']),
  onExit: (exit) => {
    // This guard prevents LLMz from re-calling the tool before the user confirms.
    // This provides guarantee that the user will see the confirmation prompt and approves it.
    if (exit.name === 'listen') {
      if (should_confirm) {
        confirming = true
        should_confirm = false
      } else {
        confirming = false
      }
    }
  },
})

while (!chat.done) {
  await executeContext(chat.context)
}

console.log('👋 Goodbye!')
process.exit(0)
