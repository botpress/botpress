import { Client } from '@botpress/client'
import { z } from '@bpinternal/zui'
import { executeContext, Exit } from 'llmz'

import { CLIChat } from '../utils/cli-chat'
import { browsePages, webSearch } from '../utils/tools/browser'
import { lightToolTrace } from '../utils/debug'

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

const search = webSearch(client).setStaticInputValues({
  count: 10,
  browsePages: false,
})

const browse = browsePages(client).setStaticInputValues({
  waitFor: 0,
})

const chat = new CLIChat({
  client,
  instructions: `
The current date is ${new Date().toLocaleDateString()}.
You are a helpful assistant that can search the web for information.
You can call 'search' to get the pages, then call 'browse' to fetch the content of the most relevant page(s).`.trim(),
  exits: [exit],
  tools: [search, browse],
  onTrace: ({ trace }) => lightToolTrace(trace),
})

while (!chat.done) {
  await executeContext(chat.context)
}

console.log('👋 Goodbye!')
process.exit(0)
